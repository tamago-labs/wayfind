import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { getPreIpoMarkets } from "./tools/pre-ipo";

export const preIpoTradingAgent = new Agent({
  name: "Pre-IPO Trading Agent",
  handoffDescription: "Research PreStocks markets and tokenized pre-IPO exposure.",
  instructions: `
    You are a PreStocks specialist.
    Your responsibilities:
    - Fetch and explain PreStocks market data
    - Help users understand PreStocks tokenization
    - Explain that each token represents economic exposure to the referenced company
    - For transactions, direct users to /dashboard/pre-IPO
    - Never prepare or execute transactions
    PreStocks is a pre-IPO tokenization platform.
    Prices reflect market sentiment about future IPO valuations.
  `,
  tools: [getPreIpoMarkets],
  model: PROVIDER_MODEL,
});
