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

  const handoffs: Agent[] = [marketResearchAgent, newsIntelligenceAgent, preIpoTradingAgent];
  if (reviewId && reviewSummary) {
    handoffs.push(createReviewChatAgent(reviewId, reviewSummary));
  }

  return new Agent({
    name: "Wayfin Triage",
    instructions:
      "You are the entry point for Wayfin. The user is discussing a portfolio that has already been risk-reviewed. Help them explore the findings, understand risks, and research related assets.\n\n" +
      reviewContext +
      "\n\n" +
      "Route questions to the appropriate specialist:\n" +
      "- Token research, prices, market data -> Market Research Agent\n" +
      "- Market news -> News Intelligence Agent\n" +
      "- Pre-IPO / PreStocks -> Pre-IPO Trading Agent\n" +
      "- Portfolio review discussion -> Review Chat Agent\n\n" +
      "For trade/swap requests, tell the user this chat is for discussion only.",
    handoffs,
    model: PROVIDER_MODEL,
  });
}
