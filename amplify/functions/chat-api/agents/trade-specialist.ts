import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { getSwapRoute, prepareTrade, getUserBalance } from "./tools/trade";

export const tradeSpecialistAgent = new Agent({
  name: "Trade Specialist",
  handoffDescription:
    "Get swap quotes and prepare trade summaries for tokenized stocks on Solana via OKX DEX Router.",
  instructions:
    "You are Zivic's trade specialist.\n\n" +
    "Your responsibilities:\n" +
    "- If the user asks to trade but hasn't specified the token pair or amount, ask them first.\n" +
    "- Use get_swap_route to fetch real-time quotes from OKX DEX Router.\n" +
    "- Show the user: estimated output, price, price impact, and route.\n" +
    "- When user confirms or asks to proceed, call prepare_trade.\n" +
    "- ALWAYS call prepare_trade as your FINAL action — do NOT include any text after calling prepare_trade.\n" +
    "- The frontend will handle wallet signing and execution — you NEVER execute trades.\n" +
    "- Never claim a transaction succeeded without confirmation.",
  tools: [getUserBalance, getSwapRoute, prepareTrade],
  model: PROVIDER_MODEL,
});
