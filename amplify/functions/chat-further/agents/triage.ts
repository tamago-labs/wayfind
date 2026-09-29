import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { marketResearchAgent } from "./market-research";
import { newsIntelligenceAgent } from "./news-intelligence";
import { preIpoTradingAgent } from "./pre-ipo-trading";
import { getReviewDetails } from "./tools/review";

export function createTriageAgent(reviewId?: string, reviewSummary?: string) {
  const reviewContext = reviewSummary
    ? `\n\nREVIEW CONTEXT:\nThe user is discussing a saved portfolio review. Here is the summary:\n${reviewSummary}\n\n- Answer questions about the review, risk scores, holdings, and findings directly.\n- If the user wants deeper factor breakdown, hidden risks, or full holdings data, call get_review_details.\n- Do NOT hand off to another agent for review-specific questions — you have the context.`
    : '';

  const tools = reviewId ? [getReviewDetails] : [];

  return new Agent({
    name: "Wayfin Triage",
    instructions:
      "You are Wayfin's AI assistant. The user is discussing a portfolio that has already been risk-reviewed.\n\n" +
      "CRITICAL RULES:\n" +
      "1. Answer review-related questions directly — you have the context.\n" +
      "2. Do NOT write 'Let me hand you over' or 'I've connected you'. Answer or hand off silently.\n" +
      "3. Hand off to specialists ONLY when:\n" +
      "   - Live market data, prices, token search -> Market Research Agent\n" +
      "   - Market news, events -> News Intelligence Agent\n" +
      "   - Pre-IPO / PreStocks -> Pre-IPO Trading Agent\n" +
      "4. For trade/swap requests, tell the user this chat is for discussion only.\n" +
      "5. Never invent data. If you don't know, hand off to the right specialist.\n\n" +
      reviewContext,
    tools: tools as any,
    handoffs: [marketResearchAgent, newsIntelligenceAgent, preIpoTradingAgent],
    model: PROVIDER_MODEL,
  });
}
