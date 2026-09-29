import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { marketResearchAgent } from "./market-research";
import { newsIntelligenceAgent } from "./news-intelligence";
import { preIpoTradingAgent } from "./pre-ipo-trading";
import { createReviewChatAgent } from "./review-chat";

export function createTriageAgent(reviewId?: string, reviewSummary?: string) {
  const reviewContext = reviewSummary
    ? `\n\nThe user is viewing a saved portfolio review. Context: ${reviewSummary}\nIf they ask about their review, portfolio risks, or analysis findings, hand off to the Review Chat Agent.`
    : '';

  const handoffs: Agent[] = [];
  if (reviewId && reviewSummary) {
    handoffs.push(createReviewChatAgent(reviewId, reviewSummary));
  }
  handoffs.push(marketResearchAgent, newsIntelligenceAgent, preIpoTradingAgent);

  return new Agent({
    name: "Wayfin Triage",
    instructions:
      "You are the entry point for Wayfin. The user is discussing a portfolio that has already been risk-reviewed.\n\n" +
      "CRITICAL RULES:\n" +
      "1. You must NOT answer any question yourself. Always hand off to a specialist.\n" +
      "2. Do NOT write messages like 'Let me hand you over' or 'I've connected you'. Just hand off silently.\n" +
      "3. For ANY question about the review, risks, portfolio analysis, or holdings — hand off to the Review Chat Agent.\n" +
      "4. Only hand off to Market Research, News, or Pre-IPO if the user explicitly asks for live market data, news, or pre-IPO markets.\n" +
      "5. For trade/swap requests, tell the user this chat is for discussion only.\n\n" +
      reviewContext,
    handoffs,
    model: PROVIDER_MODEL,
  });
}
