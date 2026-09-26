import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { streamifyResponse, ResponseStream } from "lambda-stream";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../data/resource";
import { run } from "@openai/agents";
import { env } from "$amplify/env/chat-api";
import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { PROVIDER_BASE_URL } from "./provider";
import { createTriageAgent } from "./agents";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);

Amplify.configure(resourceConfig, libraryOptions);

const dataClient = generateClient<Schema>();

const CREDIT_RATE = 0.01;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function chatStreamHandler(
  event: APIGatewayProxyEventV2,
  responseStream: ResponseStream
): Promise<void> {
  const metadata = {
    statusCode: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "X-Accel-Buffering": "no",
    },
  };

  responseStream.setContentType(metadata.headers["Content-Type"]);

  let body: any;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    responseStream.write("data: " + JSON.stringify({ error: "Invalid JSON" }) + "\n\n");
    responseStream.end();
    return;
  }

  const { message, sessionName, sessionId, walletAddress } = body;

  if (!walletAddress) {
    responseStream.write("data: " + JSON.stringify({ error: "walletAddress is required" }) + "\n\n");
    responseStream.end();
    return;
  }

  // Mode 1: Create empty session
  if (!sessionId) {
    try {
      const { data: newSession } = await dataClient.models.AgentSession.create({
        sessionName: sessionName || "New Chat",
        items: JSON.stringify([]),
        walletAddress,
      });
      responseStream.write("data: " + JSON.stringify({ sessionId: newSession?.id ?? null }) + "\n\n");
    } catch (error) {
      responseStream.write("data: " + JSON.stringify({ error: error instanceof Error ? error.message : "Failed to create session" }) + "\n\n");
    }
    responseStream.end();
    return;
  }

  // Mode 2: Stream chat
  if (!message || typeof message !== "string") {
    responseStream.write("data: " + JSON.stringify({ error: "Message is required" }) + "\n\n");
    responseStream.end();
    return;
  }

  try {
    let sessionItems: any[] = [];
    let currentSessionId = sessionId;

    if (currentSessionId) {
      const { data: sessions } = await dataClient.models.AgentSession.get({ id: currentSessionId });
      if (sessions) {
        sessionItems = JSON.parse(sessions.items as string) ?? [];
      }
    }

    if (!currentSessionId) {
      const { data: newSession } = await dataClient.models.AgentSession.create({
        sessionName: sessionName || "New Chat",
        items: JSON.stringify([]),
        walletAddress,
      });
      currentSessionId = newSession?.id ?? undefined;
    }

    const OpenAI = (await import("openai")).default;
    const openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: PROVIDER_BASE_URL,
    });

    const { setDefaultOpenAIClient, setTracingDisabled } = await import("@openai/agents");
    setDefaultOpenAIClient(openaiClient);
    setTracingDisabled(true);

    const historyMessages = sessionItems.map((item: any) => {
      const role = item.role ?? "user";
      let content = item.content ?? "";
      if (typeof content === "string") {
        const contentType = role === "assistant" ? "output_text" : "input_text";
        content = [{ type: contentType, text: content }];
      }
      return { type: item.type ?? "message", role, content };
    });

    console.log("[history] messages:", JSON.stringify(historyMessages.slice(0, 3)));

    const allMessages = [
      ...historyMessages,
      { type: "message" as const, role: "user" as const, content: [{ type: "input_text" as const, text: message }] },
    ];

    const walletContext = walletAddress
      ? `[WALLET_CONNECTED] ${walletAddress}`
      : `[WALLET_DISCONNECTED] User has not connected a wallet. Tell them to connect before trading.`;

    const triageAgent = createTriageAgent(walletAddress);
    const stream = await run(triageAgent, allMessages as any, { stream: true, maxTurns: 20 });

    const STREAM_TIMEOUT_MS = 250000;
    const NO_PROGRESS_TIMEOUT_MS = 45000;

    let lastEventTime = Date.now();
    const newTrades: any[] = [];

    const noProgressInterval = setInterval(() => {
      if (Date.now() - lastEventTime > NO_PROGRESS_TIMEOUT_MS) {
        console.error("[stream] no progress for", NO_PROGRESS_TIMEOUT_MS / 1000, "s — aborting");
        responseStream.write("data: " + JSON.stringify({ error: "Agent is taking too long. Please try again with a shorter message." }) + "\n\n");
        responseStream.end();
        process.exit(1);
      }
    }, 5000);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Stream timeout")), STREAM_TIMEOUT_MS)
    );

    try {
      await Promise.race([
        (async () => {
          for await (const event of stream) {
            lastEventTime = Date.now();

            if (event.type === "raw_model_stream_event" && event.data.type === "output_text_delta") {
              responseStream.write("data: " + JSON.stringify({ chunk: event.data.delta }) + "\n\n");
            }

            if (event.type === "agent_updated_stream_event") {
              responseStream.write("data: " + JSON.stringify({ agent: event.agent.name }) + "\n\n");
            }

            if (event.type === "run_item_stream_event") {
              const item = event.item as any;

              if (item.type === "tool_call_output_item") {
                const toolName = item.name ?? item.rawItem?.name ?? "unknown";
                if (toolName === "prepare_trade") {
                  try {
                    const output = typeof item.output === "string" ? item.output : JSON.stringify(item.output);
                    const parsed = JSON.parse(output);
                    const trade = {
                      ...parsed,
                      status: "pending",
                      createdAt: new Date().toISOString(),
                    };
                    newTrades.push(trade);
                    responseStream.write("data: " + JSON.stringify({ trade }) + "\n\n");
                  } catch (e) {
                    console.log("[stream] trade parse error:", e);
                  }
                }
              }
            }
          }
        })(),
        timeoutPromise,
      ]);
    } catch (streamErr) {
      clearInterval(noProgressInterval);
      console.error("[stream] error or timeout:", streamErr);
      const msg = streamErr instanceof Error && streamErr.message.includes("Max turns")
        ? "The agent took too many steps. Try rephrasing your question or being more specific."
        : "Stream interrupted. Please try again.";
      responseStream.write("data: " + JSON.stringify({ error: msg }) + "\n\n");
    } finally {
      clearInterval(noProgressInterval);
    }

    if (currentSessionId && newTrades.length > 0) {
      try {
        const { data: session } = await dataClient.models.AgentSession.get({ id: currentSessionId });
        const existingTransactions = session?.transactions ? JSON.parse(session.transactions as string) : [];
        const updatedTransactions = [...existingTransactions, ...newTrades];
        await dataClient.models.AgentSession.update({
          id: currentSessionId,
          transactions: JSON.stringify(updatedTransactions),
        });
      } catch (e) {
        console.error("[transactions] failed to save:", e);
      }
    }

    const finalItems = allMessages.concat(
      [{ type: "message", role: "assistant", content: [{ type: "output_text", text: stream.finalOutput }] }]
    );

    if (currentSessionId) {
      await dataClient.models.AgentSession.update({
        id: currentSessionId,
        items: JSON.stringify(finalItems),
      });
    }

    const inputTokens = estimateTokens(message);
    const outputTokens = estimateTokens(stream.finalOutput ?? '');
    const creditsUsed = (inputTokens + outputTokens) * CREDIT_RATE;

    try {
      const { data: profiles } = await dataClient.models.UserProfile.list({
        filter: { walletAddress: { eq: walletAddress } },
      });
      const profile = profiles?.[0];
      if (profile) {
        const newCredits = Math.max(0, (profile.credits ?? 0) - creditsUsed);
        await dataClient.models.UserProfile.update({
          id: profile.id,
          credits: newCredits,
        });
      }
    } catch (creditErr) {
      console.error('[credits] failed to deduct:', creditErr);
    }

    responseStream.write("data: " + JSON.stringify({ done: true, sessionId: currentSessionId }) + "\n\n");
  } catch (error) {
    console.error("Chat error:", error);
    responseStream.write("data: " + JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }) + "\n\n");
  } finally {
    console.log("[stream] closing response stream");
    responseStream.end();
  }
}

export const handler = streamifyResponse(chatStreamHandler);
