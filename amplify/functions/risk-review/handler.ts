import type { Schema } from "../../data/resource";
import { run, Agent } from "@openai/agents";
import { z } from "zod";
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/risk-review";
import { PROVIDER_MODEL, PROVIDER_BASE_URL } from "./provider";
import { getTokenMeta, getIssuerRisk } from "./config/tokens";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);

const CREDIT_RATE = 0.05;

Amplify.configure(resourceConfig, libraryOptions);

const dataClient = generateClient<Schema>();

interface Holding {
  symbol: string;
  name?: string;
  balance: number;
  price: number;
  type?: "tokenized" | "pre-ipo" | "base" | "simulated";
}

interface EnrichedHolding {
  symbol: string;
  name: string;
  stockSymbol: string;
  stockName: string;
  balance: number;
  price: number;
  value: number;
  valuePct: number;
  type: string;
  industry: string;
  issuer: string;
  issuerRiskLevel: string;
  liquidityTier: string;
  exchange: string;
}

const QUESTIONS_SYSTEM_PROMPT = `You are Wayfind's portfolio risk intake assistant. Before running a deep risk analysis, you ask a few clarifying questions to personalize the review.

Your questions must be:
- Relevant: derived from the actual portfolio composition and the user's prompt
- Concise: one short sentence each
- Multiple-choice: 2-4 options per question, each option a short label
- Personalized: reference specific holdings, sectors, concentration, or issuer risks when notable
- Use the pre-computed portfolio stats provided. Do NOT recalculate percentages.

Generate exactly 3-5 questions. Do NOT ask anything already answerable from the portfolio data.

You MUST respond with ONLY valid JSON matching the requested schema. No markdown, no extra text.`;

const questionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string(),
        options: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
          })
        ),
      })
    )
    .min(3)
    .max(5),
});

function enrichHoldings(holdings: Holding[]): { enriched: EnrichedHolding[]; totalValue: number } {
  const withMeta = holdings
    .filter((h) => h.balance > 0 && h.price > 0)
    .map((h) => {
      const meta = getTokenMeta(h.symbol);
      const issuerRisk = getIssuerRisk(meta?.issuer_name);
      const volume24h = meta?.volume_24h ?? 0;
      const liquidityTier = volume24h > 5000000 ? "High" : volume24h > 500000 ? "Moderate" : "Low";
      const value = h.balance * h.price;
      return {
        symbol: h.symbol,
        name: h.name ?? meta?.name ?? h.symbol,
        stockSymbol: meta?.stockSymbol ?? "",
        stockName: meta?.stockName ?? "",
        balance: h.balance,
        price: h.price,
        value,
        valuePct: 0,
        type: h.type ?? (meta ? "tokenized" : "base"),
        industry: meta?.industry ?? (h.type === "base" || !meta ? "Crypto" : "Unknown"),
        issuer: meta?.issuer_name ?? "Unknown",
        issuerRiskLevel: issuerRisk?.level ?? "Unknown",
        liquidityTier,
        exchange: meta?.exchange ?? "",
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  const totalValue = withMeta.reduce((sum, h) => sum + h.value, 0);
  if (totalValue > 0) {
    for (const h of withMeta) {
      h.valuePct = (h.value / totalValue) * 100;
    }
  }

  return { enriched: withMeta, totalValue };
}

function buildUserPrompt(
  prompt: string,
  enriched: EnrichedHolding[],
  totalValue: number,
  stats: {
    largestPosition: { symbol: string; pct: number } | null;
    top2Pct: number;
    topSectors: Array<{ sector: string; pct: number }>;
  }
): string {
  const formatHolding = (h: EnrichedHolding) =>
    "- " +
    h.symbol +
    (h.stockSymbol ? " (" + h.stockSymbol + " — " + h.stockName + (h.exchange ? ", " + h.exchange : "") + ")" : "") +
    ': value=$' +
    h.value.toFixed(2) +
    " (" +
    h.valuePct.toFixed(1) +
    "% of portfolio), type=\"" +
    h.type +
    '", industry="' +
    h.industry +
    '", issuer="' +
    h.issuer +
    '", issuerRisk="' +
    h.issuerRiskLevel +
    '", liquidityTier="' +
    h.liquidityTier +
    '"';

  const formatSector = (s: { sector: string; pct: number }) => "- " + s.sector + ": " + s.pct.toFixed(1) + "%";

  return `The user wants a portfolio risk review and asked: "${prompt}"

PORTFOLIO STATS (pre-computed, use these exact values, do NOT recalculate):
- Total value: $${totalValue.toFixed(2)}
- Largest position: ${stats.largestPosition ? stats.largestPosition.symbol + " at " + stats.largestPosition.pct.toFixed(1) + "%" : "N/A"}
- Top 2 positions combined: ${stats.top2Pct.toFixed(1)}%
- Sector exposure:
${stats.topSectors.map(formatSector).join("\n") || "N/A"}

HOLDINGS:
${enriched.map(formatHolding).join("\n") || "None"}

Generate 3-5 clarifying questions to personalize the risk analysis for this portfolio. Reference specific concentrations, sectors, or issuer risks when notable.`;
}

export const handler: Schema["riskReview"]["functionHandler"] = async (event) => {
  try {
    const { userProfileId, prompt: rawPrompt, holdings: rawHoldings } = event.arguments as any;
    const prompt = typeof rawPrompt === "string" ? rawPrompt : "";
    const holdings: Holding[] = typeof rawHoldings === "string" ? JSON.parse(rawHoldings) : (rawHoldings ?? []);

    console.log("[risk-review] called with:", {
      userProfileId,
      prompt: prompt.slice(0, 60),
      holdingsCount: Array.isArray(holdings) ? holdings.length : 0,
    });

    if (!userProfileId || !prompt || !Array.isArray(holdings) || holdings.length === 0) {
      console.log("[risk-review] missing arguments, returning null");
      return null;
    }

    // Enrich + compute stats
    const { enriched, totalValue } = enrichHoldings(holdings);
    if (enriched.length === 0) {
      console.log("[risk-review] no valid holdings after filter, returning null");
      return null;
    }

    const sorted = [...enriched].sort((a, b) => b.value - a.value);
    const largestPosition = sorted[0] ? { symbol: sorted[0].symbol, pct: sorted[0].valuePct } : null;
    const top2Pct = sorted.slice(0, 2).reduce((sum, h) => sum + h.valuePct, 0);

    const sectorMap = new Map<string, number>();
    for (const h of enriched) {
      if (h.industry && h.industry !== "Unknown") {
        sectorMap.set(h.industry, (sectorMap.get(h.industry) ?? 0) + h.valuePct);
      }
    }
    const topSectors = Array.from(sectorMap.entries())
      .map(([sector, pct]) => ({ sector, pct }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);

    const OpenAI = (await import("openai")).default;
    const openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: PROVIDER_BASE_URL,
    });
    const { setDefaultOpenAIClient, setTracingDisabled } = await import("@openai/agents");
    setDefaultOpenAIClient(openaiClient);
    setTracingDisabled(true);

    const userPrompt = buildUserPrompt(prompt, enriched, totalValue, { largestPosition, top2Pct, topSectors });

    const agent = new Agent({
      name: "Risk Intake",
      model: PROVIDER_MODEL,
      instructions: QUESTIONS_SYSTEM_PROMPT,
      outputType: questionsSchema,
    });

    const result = await run(agent, [{ role: "user", content: userPrompt }], { maxTurns: 10 });

    const output = result.finalOutput as z.infer<typeof questionsSchema>;
    console.log("[risk-review] questions generated:", output.questions?.length);

    // Deduct credits
    try {
      const { data: profile } = await dataClient.models.UserProfile.get({ id: userProfileId });
      if (profile) {
        const inputTokens = Math.ceil(userPrompt.length / 4);
        const outputTokens = Math.ceil(JSON.stringify(output ?? {}).length / 4);
        const creditsUsed = (inputTokens + outputTokens) * CREDIT_RATE;
        const newCredits = Math.max(0, (profile.credits ?? 0) - creditsUsed);
        await dataClient.models.UserProfile.update({
          id: profile.id,
          credits: newCredits,
        });
        console.log("[risk-review] credits deducted:", creditsUsed, "remaining:", newCredits);
      } else {
        console.log("[risk-review] profile not found:", userProfileId);
      }
    } catch (creditErr) {
      console.error("[risk-review] credits deduction failed:", creditErr);
    }

    return output;
  } catch (err) {
    console.error("[risk-review] error:", err);
    if (err instanceof Error) {
      console.error("[risk-review] error message:", err.message);
    }
    return null;
  }
};
