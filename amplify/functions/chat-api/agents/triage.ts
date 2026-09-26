import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { marketResearchAgent } from "./market-research";
import { newsIntelligenceAgent } from "./news-intelligence";
import { tradeSpecialistAgent } from "./trade-specialist";
import { preIpoTradingAgent } from "./pre-ipo-trading";

export function createTriageAgent(walletAddress: string | undefined) {
  const walletContext = walletAddress
    ? `The user's wallet is connected: ${walletAddress}. You can fetch balances and prepare trades.`
    : `The user has NOT connected a wallet. If they ask to trade, check balances, or do anything requiring a wallet, tell them to connect their wallet first.`;

  return new Agent({
    name: "Zivic Triage",
    instructions:
      "You are the entry point for Zivic, " +
      "a personalized AI assistant for tokenized stocks on Solana.\n\n" +
      walletContext + "\n\n" +
      "CRITICAL: You must NOT answer questions about trading, swapping, prices, or portfolio directly. " +
      "You MUST ALWAYS hand off to the appropriate specialist agent:\n" +
      "- Token research, prices, market data -> Market Research Agent\n" +
      "- Market news -> News Intelligence Agent\n" +
      "- Trade, swap, buy, sell, quote -> Trade Specialist (ALWAYS hand off, never answer yourself)\n" +
      "- Pre-IPO / PreStocks -> Pre-IPO Trading Agent\n\n" +
      "For trade/swap requests, ONLY respond with a handoff to the Trade Specialist. " +
      "Do NOT provide any trade information or summaries yourself.",
    handoffs: [
      marketResearchAgent,
      newsIntelligenceAgent,
      tradeSpecialistAgent,
      preIpoTradingAgent,
    ],
    model: PROVIDER_MODEL,
  });
}
