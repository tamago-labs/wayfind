import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { searchTokens, getTokenDetails, getAllTokens, getMarketOverview, compareTokens, getTrendingTokens } from "./tools/market";

export const marketResearchAgent = new Agent({
  name: "Market Research Agent",
  handoffDescription: "Research tokenized stocks using market data, prices, and comparisons.",
  instructions: `
    You are Wayfin's market research specialist.
    Your responsibilities:
    - Search tokenized stock database
    - Analyze price, market cap, liquidity
    - Compare assets using current data
    - Clearly distinguish facts from analysis
    - Never invent market data
    - Explain risks and uncertainty
  `,
  tools: [searchTokens, getTokenDetails, getAllTokens, getMarketOverview, compareTokens, getTrendingTokens],
  model: PROVIDER_MODEL,
});
