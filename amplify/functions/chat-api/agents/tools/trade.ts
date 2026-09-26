import { tool } from "@openai/agents";
import { z } from "zod";
import crypto from "crypto";
import { KNOWN_MINTS, KNOWN_SYMBOLS } from "../../config/tokens";

const OKX_API_KEY = process.env.OKX_API_KEY ?? "";
const OKX_SECRET_KEY = process.env.OKX_SECRET_KEY ?? "";
const OKX_PASSPHRASE = process.env.OKX_PASSPHRASE ?? "";

function okxSign(timestamp: string, method: string, requestPath: string, body = ""): string {
  const prehash = timestamp + method + requestPath + body;
  return crypto.createHmac("sha256", OKX_SECRET_KEY).update(prehash).digest("base64");
}

export const getUserBalance = tool({
  name: "get_user_balance",
  description: "Get the user's token balances for their connected wallet.",
  parameters: z.object({
    walletAddress: z.string().describe("User's wallet address"),
  }),
  execute: async ({ walletAddress }: { walletAddress: string }) => {
    if (!walletAddress) {
      return JSON.stringify({ error: "No wallet connected" });
    }

    const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.mainnet.solana.com";

    const solRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [walletAddress],
      }),
    }).then((r) => r.json());

    const solBalance = (solRes?.result?.value ?? 0) / 1e9;

    const splRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "getTokenAccountsByOwner",
        params: [
          walletAddress,
          { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
          { encoding: "jsonParsed" },
        ],
      }),
    }).then((r) => r.json());

    const spl2022Res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "getTokenAccountsByOwner",
        params: [
          walletAddress,
          { programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" },
          { encoding: "jsonParsed" },
        ],
      }),
    }).then((r) => r.json());

    const splBalances: Record<string, number> = {};
    for (const account of [...(splRes?.result?.value ?? []), ...(spl2022Res?.result?.value ?? [])]) {
      const info = account.account?.data?.parsed?.info;
      if (info?.mint && info?.tokenAmount?.uiAmount != null) {
        splBalances[info.mint] = info.tokenAmount.uiAmount;
      }
    }

    const balances: Record<string, number> = { SOL: solBalance };
    for (const [mint, amount] of Object.entries(splBalances)) {
      const symbol = Object.entries(KNOWN_SYMBOLS).find(([, m]) => m === mint)?.[0];
      if (symbol) {
        balances[symbol] = amount;
      } else {
        balances[mint.slice(0, 8)] = amount;
      }
    }

    return JSON.stringify({ wallet: walletAddress, balances });
  },
});

export const getSwapRoute = tool({
  name: "get_swap_route",
  description: "Get the best swap route through OKX DEX Router for a given token pair and amount on Solana.",
  parameters: z.object({
    tokenIn: z.string().describe("Input token symbol (e.g. SOL, USDC, AAPL)"),
    tokenOut: z.string().describe("Output token symbol (e.g. SOL, USDC, TSLA)"),
    amount: z.number().describe("Amount of tokenIn to swap"),
  }),
  execute: async ({ tokenIn, tokenOut, amount }: { tokenIn: string; tokenOut: string; amount: number }) => {
    const fromSymbol = tokenIn.toUpperCase();
    const toSymbol = tokenOut.toUpperCase();

    const from = KNOWN_MINTS[fromSymbol];
    const to = KNOWN_MINTS[toSymbol];

    if (!from || !to) {
      return JSON.stringify({ error: `Unknown token: ${!from ? fromSymbol : toSymbol}` });
    }

    const rawAmount = Math.round(amount * Math.pow(10, from.decimals)).toString();

    const url = new URL("https://web3.okx.com/api/v6/dex/aggregator/quote");
    url.searchParams.set("chainIndex", "501");
    url.searchParams.set("amount", rawAmount);
    url.searchParams.set("fromTokenAddress", from.mint);
    url.searchParams.set("toTokenAddress", to.mint);

    const path = url.pathname + url.search;
    const timestamp = new Date().toISOString();
    const signature = okxSign(timestamp, "GET", path);

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "OK-ACCESS-KEY": OKX_API_KEY,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE,
        "OK-ACCESS-TIMESTAMP": timestamp,
      },
    });

    if (!res.ok) {
      return JSON.stringify({ error: `OKX API HTTP ${res.status}` });
    }

    const json = await res.json();
    if (json.code !== "0") {
      return JSON.stringify({ error: json.msg || "OKX API error" });
    }

    const quote = json.data?.[0];
    if (!quote) {
      return JSON.stringify({ error: "No quote available for this pair" });
    }

    const fromAmount = Number(quote.fromTokenAmount) / Math.pow(10, from.decimals);
    const toAmount = Number(quote.toTokenAmount) / Math.pow(10, to.decimals);

    return JSON.stringify({
      tokenIn: fromSymbol,
      tokenOut: toSymbol,
      amountIn: fromAmount,
      estimatedOutput: toAmount,
      price: toAmount / fromAmount,
      priceImpact: quote.priceImpactPercent,
      route: quote.dexRouterList?.map((d: any) => d.dexProtocol?.dexName).filter(Boolean) ?? ["OKX DEX"],
      dexRouterList: quote.dexRouterList,
      quoteId: quote.quoteId,
    });
  },
});

export const prepareTrade = tool({
  name: "prepare_trade",
  description: "Prepare a trade summary for user review. Returns structured JSON for the frontend to execute. Does NOT execute the swap.",
  parameters: z.object({
    tokenIn: z.string().describe("Input token symbol"),
    tokenOut: z.string().describe("Output token symbol"),
    amountIn: z.number().describe("Amount to swap"),
  }),
  execute: async ({ tokenIn, tokenOut, amountIn }: { tokenIn: string; tokenOut: string; amountIn: number }) => {
    const fromSymbol = tokenIn.toUpperCase();
    const toSymbol = tokenOut.toUpperCase();

    const from = KNOWN_MINTS[fromSymbol];
    const to = KNOWN_MINTS[toSymbol];

    if (!from || !to) {
      return JSON.stringify({ error: `Unknown token: ${!from ? fromSymbol : toSymbol}` });
    }

    const rawAmount = Math.round(amountIn * Math.pow(10, from.decimals)).toString();

    const url = new URL("https://web3.okx.com/api/v6/dex/aggregator/quote");
    url.searchParams.set("chainIndex", "501");
    url.searchParams.set("amount", rawAmount);
    url.searchParams.set("fromTokenAddress", from.mint);
    url.searchParams.set("toTokenAddress", to.mint);

    const path = url.pathname + url.search;
    const timestamp = new Date().toISOString();
    const signature = okxSign(timestamp, "GET", path);

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "OK-ACCESS-KEY": OKX_API_KEY,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE,
        "OK-ACCESS-TIMESTAMP": timestamp,
      },
    });

    if (!res.ok) {
      return JSON.stringify({ error: `OKX API HTTP ${res.status}` });
    }

    const json = await res.json();
    if (json.code !== "0") {
      return JSON.stringify({ error: json.msg || "OKX API error" });
    }

    const quote = json.data?.[0];
    if (!quote) {
      return JSON.stringify({ error: "No quote available for this pair" });
    }

    const toAmount = Number(quote.toTokenAmount) / Math.pow(10, to.decimals);

    return JSON.stringify({
      tokenIn: fromSymbol,
      tokenOut: toSymbol,
      amountIn,
      estimatedOutput: toAmount,
      price: toAmount / amountIn,
      priceImpact: quote.priceImpactPercent,
      route: quote.dexRouterList?.map((d: any) => d.dexProtocol?.dexName).filter(Boolean) ?? ["OKX DEX"],
    });
  },
});
