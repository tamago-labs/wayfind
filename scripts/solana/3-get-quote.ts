// OKX DEX Script 3: Get swap quote on Solana
// Endpoint: GET /api/v6/dex/aggregator/quote
// Chain: Solana (chainIndex=501)
// Usage: npx tsx scripts/solana/3-get-quote.ts

import { config } from "dotenv";
import crypto from "crypto";

config({ path: ".env.local" });

const OKX_API_KEY = process.env.OKX_API_KEY;
const OKX_SECRET_KEY = process.env.OKX_SECRET_KEY;
const OKX_PASSPHRASE = process.env.OKX_PASSPHRASE;

if (!OKX_API_KEY || !OKX_SECRET_KEY || !OKX_PASSPHRASE) {
  console.error("Error: OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE required in .env.local");
  process.exit(1);
}

const BASE_URL = "https://web3.okx.com/api/v6/dex/aggregator/quote";
const CHAIN_INDEX = "501";

// SOL → TSLAX
const FROM_TOKEN = "11111111111111111111111111111111";
const TO_TOKEN = "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB";
const FROM_DECIMALS = 9;
const TO_DECIMALS = 8;

interface DexProtocol {
  dexName: string;
  percent: string;
}

interface TokenInfo {
  tokenContractAddress: string;
  tokenSymbol: string;
  tokenUnitPrice: string;
  decimal: string;
  isHoneyPot: boolean;
  taxRate: string;
}

interface DexRouter {
  dexProtocol: DexProtocol;
  fromToken: TokenInfo;
  fromTokenIndex: string;
  toToken: TokenInfo;
  toTokenIndex: string;
}

interface Quote {
  chainIndex: string;
  swapMode: string;
  fromToken: TokenInfo;
  fromTokenAmount: string;
  toToken: TokenInfo;
  toTokenAmount: string;
  router: string;
  dexRouterList: DexRouter[];
  priceImpactPercent: string;
  tradeFee: string;
  estimateGasFee: string;
}

interface ApiResponse {
  code: string;
  data: Quote[];
  msg: string;
}

function sign(timestamp: string, method: string, requestPath: string, body = ""): string {
  const prehash = timestamp + method + requestPath + body;
  return crypto.createHmac("sha256", OKX_SECRET_KEY!).update(prehash).digest("base64");
}

function formatAmount(raw: string, decimals: number): string {
  const num = Number(raw) / Math.pow(10, decimals);
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

async function getQuote(amount: string) {
  const url = new URL(BASE_URL);
  url.searchParams.set("chainIndex", CHAIN_INDEX);
  url.searchParams.set("amount", amount);
  url.searchParams.set("fromTokenAddress", FROM_TOKEN);
  url.searchParams.set("toTokenAddress", TO_TOKEN);

  const path = url.pathname + url.search;
  const timestamp = new Date().toISOString();
  const signature = sign(timestamp, "GET", path);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "OK-ACCESS-KEY": OKX_API_KEY!,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE!,
      "OK-ACCESS-TIMESTAMP": timestamp,
    },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  return (await res.json()) as ApiResponse;
}

async function main() {
  const amounts = ["0.1", "1", "10"];

  for (const amt of amounts) {
    const amountRaw = (Number(amt) * Math.pow(10, FROM_DECIMALS)).toString();

    console.log(`\n${"═".repeat(70)}`);
    console.log(`Quote: ${amt} SOL → TSLAX`);
    console.log(`${"═".repeat(70)}`);

    const json = await getQuote(amountRaw);

    if (json.code !== "0") {
      console.error(`API error: code=${json.code}, msg=${json.msg}`);
      continue;
    }

    const quote = json.data[0];
    if (!quote) {
      console.log("No quote available.");
      continue;
    }

    console.log(`\nSwap Mode: ${quote.swapMode}`);
    console.log(`Price Impact: ${quote.priceImpactPercent}%`);
    console.log(`Est. Gas Fee: ${quote.estimateGasFee}`);
    console.log(`Trade Fee: $${quote.tradeFee}`);

    console.log(`\nInput:  ${formatAmount(quote.fromTokenAmount, FROM_DECIMALS)} ${quote.fromToken.tokenSymbol}`);
    console.log(`Output: ${formatAmount(quote.toTokenAmount, TO_DECIMALS)} ${quote.toToken.tokenSymbol}`);

    if (quote.fromToken.tokenUnitPrice) {
      console.log(`\nSOL Price:  $${quote.fromToken.tokenUnitPrice}`);
    }
    if (quote.toToken.tokenUnitPrice) {
      console.log(`TSLAX Price: $${quote.toToken.tokenUnitPrice}`);
    }

    console.log(`\nRoute: ${quote.router}`);

    console.log(`\nDEX Router Breakdown:`);
    console.log("─".repeat(60));

    const seen = new Map<string, number>();
    for (const step of quote.dexRouterList) {
      const key = `${step.dexProtocol.dexName}`;
      seen.set(key, (seen.get(key) ?? 0) + Number(step.dexProtocol.percent));
    }

    for (const [name, pct] of seen) {
      console.log(`  ${name}: ${pct}%`);
    }

    console.log("\nRaw Response:");
    console.log(JSON.stringify(quote, null, 2));
  }
}

main().catch(console.error);



// ◇ injected env (6) from .env.local // tip: ⌘ override existing { override: true }

// ══════════════════════════════════════════════════════════════════════
// Quote: 0.1 SOL → TSLAX
// ══════════════════════════════════════════════════════════════════════

// Swap Mode: exactIn
// Price Impact: 0.04%
// Est. Gas Fee: 587300
// Trade Fee: $0.00048635

// Input:  0.1 SOL
// Output: 0.027253 TSLAx

// SOL Price:  $97.27
// TSLAX Price: $357.0441046609161190048722333296177

// Route: 11111111111111111111111111111111--EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v--XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB

// DEX Router Breakdown:
// ────────────────────────────────────────────────────────────
//   Quantum pAMM: 55%
//   Raydium CL: 21%
//   FluxMM: 24%
//   Orca Whirlpools: 100%

// Raw Response:
// {
//   "chainIndex": "501",
//   "contextSlot": 447511318,
//   "dexRouterList": [
//     {
//       "dexProtocol": {
//         "dexName": "Quantum pAMM",
//         "percent": "55"
//       },
//       "fromToken": {
//         "decimal": "9",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "So11111111111111111111111111111111111111112",
//         "tokenSymbol": "wSOL",
//         "tokenUnitPrice": "97.27"
//       },
//       "fromTokenIndex": "0",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "1"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "Raydium CL",
//         "percent": "21"
//       },
//       "fromToken": {
//         "decimal": "9",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "So11111111111111111111111111111111111111112",
//         "tokenSymbol": "wSOL",
//         "tokenUnitPrice": "97.27"
//       },
//       "fromTokenIndex": "0",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "1"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "FluxMM",
//         "percent": "24"
//       },
//       "fromToken": {
//         "decimal": "9",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "So11111111111111111111111111111111111111112",
//         "tokenSymbol": "wSOL",
//         "tokenUnitPrice": "97.27"
//       },
//       "fromTokenIndex": "0",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "1"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "Orca Whirlpools",
//         "percent": "100"
//       },
//       "fromToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "fromTokenIndex": "1",
//       "toToken": {
//         "decimal": "8",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
//         "tokenSymbol": "TSLAx",
//         "tokenUnitPrice": "357.0441046609161190048722333296177"
//       },
//       "toTokenIndex": "2"
//     }
//   ],
//   "estimateGasFee": "587300",
//   "fromToken": {
//     "decimal": "9",
//     "isHoneyPot": false,
//     "latestMultiplier": "1",
//     "taxRate": "0",
//     "tokenContractAddress": "11111111111111111111111111111111",
//     "tokenSymbol": "SOL",
//     "tokenUnitPrice": "97.27"
//   },
//   "fromTokenAmount": "100000000",
//   "mode": "dex",
//   "priceImpactPercent": "0.04",
//   "quoteId": "3140695581208120003",
//   "router": "11111111111111111111111111111111--EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v--XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
//   "signData": null,
//   "swapMode": "exactIn",
//   "toToken": {
//     "decimal": "8",
//     "isHoneyPot": false,
//     "latestMultiplier": "1",
//     "taxRate": "0",
//     "tokenContractAddress": "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
//     "tokenSymbol": "TSLAx",
//     "tokenUnitPrice": "357.0441046609161190048722333296177"
//   },
//   "toTokenAmount": "2725340",
//   "tradeFee": "0.00048635"
// }

// ══════════════════════════════════════════════════════════════════════
// Quote: 1 SOL → TSLAX
// ══════════════════════════════════════════════════════════════════════

// Swap Mode: exactIn
// Price Impact: 0.03%
// Est. Gas Fee: 735300
// Trade Fee: $0.00048635

// Input:  1 SOL
// Output: 0.272506 TSLAx

// SOL Price:  $97.27
// TSLAX Price: $357.0441046609161190048722333296177

// Route: 11111111111111111111111111111111--EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v--XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB

// DEX Router Breakdown:
// ────────────────────────────────────────────────────────────
//   JIT Router: 50%
//   Raydium CL: 2%
//   FluxMM: 48%
//   Orca Whirlpools: 100%

// Raw Response:
// {
//   "chainIndex": "501",
//   "contextSlot": 447511318,
//   "dexRouterList": [
//     {
//       "dexProtocol": {
//         "dexName": "JIT Router",
//         "percent": "50"
//       },
//       "fromToken": {
//         "decimal": "9",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "So11111111111111111111111111111111111111112",
//         "tokenSymbol": "wSOL",
//         "tokenUnitPrice": "97.27"
//       },
//       "fromTokenIndex": "0",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "1"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "Raydium CL",
//         "percent": "2"
//       },
//       "fromToken": {
//         "decimal": "9",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "So11111111111111111111111111111111111111112",
//         "tokenSymbol": "wSOL",
//         "tokenUnitPrice": "97.27"
//       },
//       "fromTokenIndex": "0",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "1"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "FluxMM",
//         "percent": "48"
//       },
//       "fromToken": {
//         "decimal": "9",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "So11111111111111111111111111111111111111112",
//         "tokenSymbol": "wSOL",
//         "tokenUnitPrice": "97.27"
//       },
//       "fromTokenIndex": "0",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "1"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "Orca Whirlpools",
//         "percent": "100"
//       },
//       "fromToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "fromTokenIndex": "1",
//       "toToken": {
//         "decimal": "8",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
//         "tokenSymbol": "TSLAx",
//         "tokenUnitPrice": "357.0441046609161190048722333296177"
//       },
//       "toTokenIndex": "2"
//     }
//   ],
//   "estimateGasFee": "735300",
//   "fromToken": {
//     "decimal": "9",
//     "isHoneyPot": false,
//     "latestMultiplier": "1",
//     "taxRate": "0",
//     "tokenContractAddress": "11111111111111111111111111111111",
//     "tokenSymbol": "SOL",
//     "tokenUnitPrice": "97.27"
//   },
//   "fromTokenAmount": "1000000000",
//   "mode": "dex",
//   "priceImpactPercent": "0.03",
//   "quoteId": "3130895581210030004",
//   "router": "11111111111111111111111111111111--EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v--XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
//   "signData": null,
//   "swapMode": "exactIn",
//   "toToken": {
//     "decimal": "8",
//     "isHoneyPot": false,
//     "latestMultiplier": "1",
//     "taxRate": "0",
//     "tokenContractAddress": "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
//     "tokenSymbol": "TSLAx",
//     "tokenUnitPrice": "357.0441046609161190048722333296177"
//   },
//   "toTokenAmount": "27250616",
//   "tradeFee": "0.00048635"
// }

// ══════════════════════════════════════════════════════════════════════
// Quote: 10 SOL → TSLAX
// ══════════════════════════════════════════════════════════════════════

// Swap Mode: exactIn
// Price Impact: -0.04%
// Est. Gas Fee: 1586400
// Trade Fee: $0.00048635

// Input:  10 SOL
// Output: 2.723357 TSLAx

// SOL Price:  $97.27
// TSLAX Price: $357.0441046609161190048722333296177

// Route: 11111111111111111111111111111111--Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB--EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v--XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB

// DEX Router Breakdown:
// ────────────────────────────────────────────────────────────
//   BisonFi: 45.5%
//   FluxMM: 4.5%
//   JIT Router: 50%
//   Deriverse: 100%
//   Riptide: 60%
//   Orca Whirlpools: 40%

// Raw Response:
// {
//   "chainIndex": "501",
//   "contextSlot": 447511320,
//   "dexRouterList": [
//     {
//       "dexProtocol": {
//         "dexName": "BisonFi",
//         "percent": "45.5"
//       },
//       "fromToken": {
//         "decimal": "9",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "So11111111111111111111111111111111111111112",
//         "tokenSymbol": "wSOL",
//         "tokenUnitPrice": "97.27"
//       },
//       "fromTokenIndex": "0",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "2"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "FluxMM",
//         "percent": "4.5"
//       },
//       "fromToken": {
//         "decimal": "9",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "So11111111111111111111111111111111111111112",
//         "tokenSymbol": "wSOL",
//         "tokenUnitPrice": "97.27"
//       },
//       "fromTokenIndex": "0",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "2"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "JIT Router",
//         "percent": "50"
//       },
//       "fromToken": {
//         "decimal": "9",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "So11111111111111111111111111111111111111112",
//         "tokenSymbol": "wSOL",
//         "tokenUnitPrice": "97.27"
//       },
//       "fromTokenIndex": "0",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
//         "tokenSymbol": "USDT",
//         "tokenUnitPrice": "0.99909"
//       },
//       "toTokenIndex": "1"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "Deriverse",
//         "percent": "100"
//       },
//       "fromToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
//         "tokenSymbol": "USDT",
//         "tokenUnitPrice": "0.99909"
//       },
//       "fromTokenIndex": "1",
//       "toToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "toTokenIndex": "2"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "Riptide",
//         "percent": "60"
//       },
//       "fromToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "fromTokenIndex": "2",
//       "toToken": {
//         "decimal": "8",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
//         "tokenSymbol": "TSLAx",
//         "tokenUnitPrice": "357.0441046609161190048722333296177"
//       },
//       "toTokenIndex": "3"
//     },
//     {
//       "dexProtocol": {
//         "dexName": "Orca Whirlpools",
//         "percent": "40"
//       },
//       "fromToken": {
//         "decimal": "6",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//         "tokenSymbol": "USDC",
//         "tokenUnitPrice": "1"
//       },
//       "fromTokenIndex": "2",
//       "toToken": {
//         "decimal": "8",
//         "isHoneyPot": false,
//         "latestMultiplier": "",
//         "taxRate": "0",
//         "tokenContractAddress": "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
//         "tokenSymbol": "TSLAx",
//         "tokenUnitPrice": "357.0441046609161190048722333296177"
//       },
//       "toTokenIndex": "3"
//     }
//   ],
//   "estimateGasFee": "1586400",
//   "fromToken": {
//     "decimal": "9",
//     "isHoneyPot": false,
//     "latestMultiplier": "1",
//     "taxRate": "0",
//     "tokenContractAddress": "11111111111111111111111111111111",
//     "tokenSymbol": "SOL",
//     "tokenUnitPrice": "97.27"
//   },
//   "fromTokenAmount": "10000000000",
//   "mode": "dex",
//   "priceImpactPercent": "-0.04",
//   "quoteId": "3141095581211330001",
//   "router": "11111111111111111111111111111111--Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB--EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v--XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
//   "signData": null,
//   "swapMode": "exactIn",
//   "toToken": {
//     "decimal": "8",
//     "isHoneyPot": false,
//     "latestMultiplier": "1",
//     "taxRate": "0",
//     "tokenContractAddress": "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
//     "tokenSymbol": "TSLAx",
//     "tokenUnitPrice": "357.0441046609161190048722333296177"
//   },
//   "toTokenAmount": "272335655",
//   "tradeFee": "0.00048635"
// }