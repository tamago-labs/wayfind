import type { Schema } from "../../data/resource";
import { run, Agent, MemorySession } from "@openai/agents";
import { z } from "zod";
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/evaluate-risk";
import { PROVIDER_MODEL, PROVIDER_BASE_URL } from "./provider";
import { getTokenMeta, toTicker, getCryptoId, getIssuerRisk } from "./config/tokens";
import kaminoData from "./config/kamino-apy-results.json";
import byrealData from "./config/byreal-pool-results.json";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);

const CREDIT_RATE = 0.05;

Amplify.configure(resourceConfig, libraryOptions);

const dataClient = generateClient<Schema>();

const CMC_API_KEY = env.CMC_API_KEY ?? "";
const CMC_BASE_URL = "https://pro-api.coinmarketcap.com";



interface Holding {
  symbol: string;
  balance: number;
  price: number;
  change24h: number;
  type: "tokenized" | "pre-ipo" | "base";
  mint?: string;
}

interface RiskReport {
  overallScore: number;
  overallLabel: string;
  overallDescription: string;
  concentration: {
    score: number;
    label: string;
    largestPosition: { symbol: string; percentage: number } | null;
    top2Percentage: number;
  };
  marketRisk: {
    score: number;
    label: string;
    equityVolatility: { score: number; label: string };
    sectorConcentration: { score: number; label: string };
    marketCorrelation: { score: number; label: string };
  };
  tokenRisk: {
    score: number;
    label: string;
    tokens: Array<{
      symbol: string;
      liquidityTier: string;
      issuerRisk: string;
    }>;
  };
  updatedAt?: string;
  rebalanceSuggestions?: Array<{
    action: string;
    symbol: string;
    reason: string;
    suggestedAllocation: number;
  }>;
  yieldStrategies?: Array<{
    token: string;
    action: string;
    reason: string;
    platform: string;
    apy: number;
  }>;
}

async function fetchCMCMetadata(symbols: string[]): Promise<Record<string, any>> {
  if (!symbols.length || !CMC_API_KEY) return {};
  try {
    const url = new URL(`${CMC_BASE_URL}/v2/cryptocurrency/info`);
    url.searchParams.set("symbol", symbols.join(","));
    const res = await fetch(url.toString(), {
      headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY, Accept: "application/json" },
    });
    const json = await res.json();
    return json.data ?? {};
  } catch (err) {
    console.error("[evaluate-risk] CMC metadata fetch failed:", err);
    return {};
  }
}

async function fetchCMCMarketData(cryptoIds: number[]): Promise<Record<number, any>> {
  if (!cryptoIds.length || !CMC_API_KEY) return {};
  try {
    const url = new URL(`${CMC_BASE_URL}/v2/cryptocurrency/quotes/latest`);
    url.searchParams.set("id", cryptoIds.join(","));
    url.searchParams.set("convert", "USD");
    const res = await fetch(url.toString(), {
      headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY, Accept: "application/json" },
    });
    const json = await res.json();
    return json.data ?? {};
  } catch (err) {
    console.error("[evaluate-risk] CMC market data fetch failed:", err);
    return {};
  }
}

async function fetchCMCOHLCV(cryptoId: number, interval: string = "1d", limit: number = 30): Promise<any[]> {
  if (!CMC_API_KEY) return [];
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    const url = new URL(`${CMC_BASE_URL}/v2/cryptocurrency/ohlcv/historical`);
    url.searchParams.set("id", String(cryptoId));
    url.searchParams.set("convert", "USD");
    url.searchParams.set("time_start", start.toISOString());
    url.searchParams.set("time_end", end.toISOString());
    url.searchParams.set("interval", interval);
    url.searchParams.set("count", String(limit));
    const res = await fetch(url.toString(), {
      headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY, Accept: "application/json" },
    });
    const json = await res.json();
    const data = json.data;
    if (!data?.quotes) return [];
    return data.quotes;
  } catch (err) {
    console.error("[evaluate-risk] CMC OHLCV fetch failed:", err);
    return [];
  }
}

async function fetchPreStockData(): Promise<Record<string, any>> {
  try {
    const res = await dataClient.models.PreStock.list({});
    const map: Record<string, any> = {};
    for (const item of res.data ?? []) {
      if (item.symbol) map[item.symbol] = item;
    }
    return map;
  } catch (err) {
    console.error("[evaluate-risk] PreStock DB fetch failed:", err);
    return {};
  }
}

function calculateVolatility(ohlcv: any[]): number {
  if (ohlcv.length < 2) return 0;
  const closes = ohlcv.map((q: any) => q.quote?.USD?.close ?? 0).filter((c: number) => c > 0);
  if (closes.length < 2) return 0;
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * 100;
}

const RISK_SYSTEM_PROMPT = `You are Zivic's portfolio risk analysis engine. You analyze tokenized stock portfolios on Solana and produce professional, structured risk evaluations.

Your analysis must be:
- Data-driven: base all scores on the actual portfolio data provided
- Professional: use institutional-grade risk terminology
- Concise: descriptions should be 1-2 sentences, not paragraphs
- Actionable: highlight specific concerns a user should understand

Score range: 0-100 where:
- 0-30: Low risk (stable, well-diversified)
- 31-60: Moderate risk (some concentration or volatility concerns)
- 61-80: High risk (significant concentration, high volatility, or liquidity concerns)
- 81-100: Very high risk (extreme concentration, illiquid, or highly volatile)

You MUST respond with ONLY valid JSON matching the requested schema. No markdown, no extra text.`;

const REBALANCE_SYSTEM_PROMPT = `You are Zivic's portfolio rebalancing advisor. Based on a risk evaluation you just performed, provide specific, actionable rebalancing suggestions.

Your suggestions must be:
- Specific: name exact tokens to reduce or add
- Data-driven: reference concentration, sector exposure, and risk scores
- Practical: suggest concrete allocation targets
- Concise: 2-4 suggestions, each 1-2 sentences

You MUST respond with ONLY valid JSON in this format:
{
  "suggestions": [
    {
      "action": "reduce" | "add" | "diversify" | "hedge",
      "symbol": "TOKEN",
      "reason": "why this suggestion",
      "suggestedAllocation": number (percentage, 0-100)
    }
  ]
}`;

function buildRebalancePrompt(
  holdings: Holding[],
  concentration: { largestPct: number; top2Pct: number; score: number; label: string },
  sectorExposure: { sector: string; pct: number }[]
): string {
  const formatHolding = (h: Holding) =>
    "- " + h.symbol + ": balance=" + h.balance.toFixed(4) + ", price=$" + h.price.toFixed(2) + ", value=$" + (h.balance * h.price).toFixed(2);

  const formatSector = (s: { sector: string; pct: number }) =>
    "- " + s.sector + ": " + s.pct.toFixed(1) + "%";

  return `Based on your risk analysis above, suggest portfolio rebalancing actions.

Current Portfolio:
${holdings.filter(h => h.balance > 0 && h.type !== "base").map(formatHolding).join("\n") || "None"}

Concentration:
- Largest position: ${concentration.largestPct.toFixed(1)}%
- Top 2 positions: ${concentration.top2Pct.toFixed(1)}%
- Concentration score: ${concentration.score}/100 (${concentration.label})

Sector Exposure:
${sectorExposure.map(formatSector).join("\n") || "N/A"}

Suggest 2-4 specific rebalancing actions to improve the portfolio's risk profile.`;
}

function buildUserPrompt(
  holdings: Holding[],
  tokenizedContext: any[],
  preIpoContext: any[],
  portfolioValue: number,
  concentration: { largestPct: number; top2Pct: number; score: number; label: string }
): string {
  const base = holdings.filter((h) => h.type === "base");

  const formatBase = (h: Holding) =>
    "- " + h.symbol + ": balance=" + h.balance.toFixed(4) + ", price=$" + h.price.toFixed(2) + ", 24h change=" + h.change24h.toFixed(2) + "%, value=$" + (h.balance * h.price).toFixed(2);

  const formatTokenized = (ctx: any) =>
    "- " + ctx.symbol + " (" + ctx.ticker + "): balance=" + ctx.balance.toFixed(4) + ", price=$" + ctx.price.toFixed(2) + ", value=$" + ctx.value.toFixed(2) + ", volatility=" + ctx.volatility.toFixed(1) + "%, sector=\"" + (ctx.sector || "N/A") + "\", liquidityTier=\"" + ctx.liquidityTier + "\", issuer=\"" + ctx.issuer + "\", issuerRisk=\"" + ctx.issuerRiskLevel + "\", marketCap=$" + (ctx.marketCap?.toLocaleString() || "N/A");

  const formatPreIpo = (ctx: any) =>
    "- " + ctx.symbol + ": balance=" + ctx.balance.toFixed(4) + ", price=$" + ctx.price.toFixed(2) + ", value=$" + ctx.value.toFixed(2) + ", markPrice=$" + (ctx.markPrice?.toFixed(2) || "N/A") + ", markValuation=$" + (ctx.markValuation?.toLocaleString() || "N/A") + ", issuer=\"" + ctx.issuer + "\", issuerRisk=\"" + ctx.issuerRiskLevel + "\"";

  return `Analyze the following portfolio for risk evaluation.

Portfolio Value: $${portfolioValue.toFixed(2)}

CONCENTRATION (pre-computed, use these exact values):
- Largest position: ${concentration.largestPct.toFixed(1)}%
- Top 2 positions: ${concentration.top2Pct.toFixed(1)}%
- Concentration score: ${concentration.score}/100 (${concentration.label})

TOKENIZED STOCKS (Solana tokens backed by real equities):
${tokenizedContext.map(formatTokenized).join("\n") || "None"}

PRE-IPO TOKENS (pre-IPO equity tokens, limited market data):
${preIpoContext.map(formatPreIpo).join("\n") || "None"}

BASE TOKENS (SOL, USDC, USDT, USDG):
${base.map(formatBase).join("\n") || "None"}

Use the pre-computed concentration values above. Do NOT recalculate them.
For tokenized stocks, consider: equity volatility, sector concentration, market cap, liquidity tier, and issuer risk.
For pre-IPO tokens, consider: limited liquidity, valuation uncertainty, and issuer risk.
For base tokens, consider: stablecoin depeg risk and SOL volatility.

Calculate:
1. Overall risk score (weighted by position size, using the concentration score above)
2. Market risk (equity volatility from OHLCV, sector concentration, correlation)
3. Token/liquidity risk (per-token liquidity tier and issuer risk assessment)`;
}

export const handler: Schema["evaluateRisk"]["functionHandler"] = async (event) => {
  try {
    const { walletAddress, holdings: rawHoldings, portfolioValue = 0 } = event.arguments as any;
    const holdings = typeof rawHoldings === "string" ? JSON.parse(rawHoldings) : rawHoldings;
    console.log("[evaluate-risk] called with:", { walletAddress, holdingsCount: Array.isArray(holdings) ? holdings.length : 0, portfolioValue });

    if (!walletAddress || !holdings || !Array.isArray(holdings)) {
      console.log("[evaluate-risk] missing arguments, returning null");
      return null;
    }

    const OpenAI = (await import("openai")).default;
    const openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: PROVIDER_BASE_URL,
    });
    const { setDefaultOpenAIClient, setTracingDisabled } = await import("@openai/agents");
    setDefaultOpenAIClient(openaiClient);
    setTracingDisabled(true);

    const tokenized = holdings.filter((h) => h.type === "tokenized" && h.balance > 0);
    const preIpo = holdings.filter((h) => h.type === "pre-ipo" && h.balance > 0);
    console.log("[evaluate-risk] tokenized:", tokenized.map((h) => h.symbol));
    console.log("[evaluate-risk] preIpo:", preIpo.map((h) => h.symbol));

    const tokenizedSymbols = tokenized.map((h) => h.symbol);
    const [cmcMetadata, preStockData] = await Promise.all([
      fetchCMCMetadata(tokenizedSymbols),
      fetchPreStockData(),
    ]);
    console.log("[evaluate-risk] cmcMetadata keys:", Object.keys(cmcMetadata));
    console.log("[evaluate-risk] preStockData keys:", Object.keys(preStockData));

    const cryptoIds = tokenizedSymbols
      .map((s) => getCryptoId(s))
      .filter((id): id is number => id != null);
    console.log("[evaluate-risk] cryptoIds:", cryptoIds);

    const [cmcMarketData, ...ohlcvResults] = await Promise.all([
      fetchCMCMarketData(cryptoIds),
      ...cryptoIds.map((id) => fetchCMCOHLCV(id, "1d", 30)),
    ]);
    console.log("[evaluate-risk] cmcMarketData keys:", Object.keys(cmcMarketData));
    console.log("[evaluate-risk] ohlcv counts:", ohlcvResults.map((r) => r.length));

    const allHoldings = holdings.filter((h) => h.balance > 0);
    const totalVal = allHoldings.reduce((sum, h) => sum + h.balance * h.price, 0);

    const sortedByValue = [...allHoldings].sort((a, b) => b.balance * b.price - a.balance * a.price);
    const largestHolding = sortedByValue[0];
    const top2Value = sortedByValue.slice(0, 2).reduce((sum, h) => sum + h.balance * h.price, 0);
    const largestPct = totalVal > 0 && largestHolding ? (largestHolding.balance * largestHolding.price / totalVal) * 100 : 0;
    const top2Pct = totalVal > 0 ? (top2Value / totalVal) * 100 : 0;

    const concentrationScore = Math.min(100, Math.round(largestPct * 0.6 + top2Pct * 0.4));
    const concentrationLabel = concentrationScore <= 20 ? "Low" : concentrationScore <= 40 ? "Moderate" : concentrationScore <= 60 ? "High" : "Very High";

    const tokenizedContext = tokenized.map((h, i) => {
      const meta = getTokenMeta(h.symbol);
      const ticker = toTicker(h.symbol);
      const cmcId = getCryptoId(h.symbol);
      const marketData = cmcId ? cmcMarketData[cmcId] : null;
      const metadata = cmcMetadata[h.symbol] ?? cmcMetadata[ticker];
      const ohlcv = ohlcvResults[i] ?? [];
      const volatility = calculateVolatility(ohlcv);
      const volume24h = marketData?.quote?.USD?.volume_24h ?? 0;
      const liquidityTier = volume24h > 5000000 ? "High" : volume24h > 500000 ? "Moderate" : "Low";
      const issuerRisk = getIssuerRisk(meta?.issuer_name);

      return {
        symbol: h.symbol,
        ticker,
        balance: h.balance,
        price: h.price,
        value: h.balance * h.price,
        volatility,
        sector: metadata?.sector ?? meta?.sector ?? "N/A",
        liquidityTier,
        marketCap: marketData?.quote?.USD?.market_cap,
        description: metadata?.description ?? meta?.description,
        issuer: meta?.issuer_name ?? "Unknown",
        issuerRiskLevel: issuerRisk?.level ?? "Unknown",
        issuerDescription: issuerRisk?.description,
      };
    });

    const preIpoContext = preIpo.map((h) => {
      const meta = getTokenMeta(h.symbol);
      const dbData = preStockData[h.symbol];
      const markPrice = dbData?.markPrice ?? 0;
      const tokenPrice = h.price;
      const issuerRisk = getIssuerRisk(meta?.issuer_name);

      return {
        symbol: h.symbol,
        balance: h.balance,
        price: tokenPrice,
        value: h.balance * tokenPrice,
        markPrice,
        markValuation: dbData?.markValuation,
        impliedValuation: dbData?.impliedValuation,
        description: meta?.description,
        liquidityTier: "Low",
        issuer: meta?.issuer_name ?? "Unknown",
        issuerRiskLevel: issuerRisk?.level ?? "Unknown",
        issuerDescription: issuerRisk?.description,
      };
    });

    const userPrompt = buildUserPrompt(
      holdings,
      tokenizedContext,
      preIpoContext,
      portfolioValue,
      { largestPct, top2Pct, score: concentrationScore, label: concentrationLabel }
    );

    const riskReportSchema = z.object({
      overallScore: z.number(),
      overallLabel: z.string(),
      overallDescription: z.string(),
      concentration: z.object({
        score: z.number(),
        label: z.string(),
        largestPosition: z.object({ symbol: z.string(), percentage: z.number() }).nullable(),
        top2Percentage: z.number(),
      }),
      marketRisk: z.object({
        score: z.number(),
        label: z.string(),
        equityVolatility: z.object({ score: z.number(), label: z.string() }),
        sectorConcentration: z.object({ score: z.number(), label: z.string() }),
        marketCorrelation: z.object({ score: z.number(), label: z.string() }),
      }),
      tokenRisk: z.object({
        score: z.number(),
        label: z.string(),
        tokens: z.array(
          z.object({
            symbol: z.string(),
            liquidityTier: z.string(),
            issuerRisk: z.string(),
          })
        ),
      })
    });

    const session = new MemorySession();
    const agent = new Agent({
      name: "Risk Evaluator",
      model: PROVIDER_MODEL,
      instructions: RISK_SYSTEM_PROMPT,
      outputType: riskReportSchema,
    });

    const result = await run(
      agent,
      [{ role: "user", content: userPrompt }],
      { session, maxTurns: 20 },
    );

    console.log("[evaluate-risk] raw result:", { finalOutput: result.finalOutput, type: typeof result.finalOutput });
    const report: RiskReport = { ...(result.finalOutput as RiskReport), updatedAt: new Date().toISOString() };
    console.log("[evaluate-risk] report generated:", { overallScore: report.overallScore, overallLabel: report.overallLabel });

    let rebalanceSuggestions: Array<{ action: string; symbol: string; reason: string; suggestedAllocation: number }> | undefined;
    try {
      const sectorExposure = tokenizedContext
        .filter((t) => t.sector && t.sector !== "N/A")
        .reduce((acc: { sector: string; pct: number }[], t) => {
          const existing = acc.find((s) => s.sector === t.sector);
          const pct = portfolioValue > 0 ? (t.value / portfolioValue) * 100 : 0;
          if (existing) {
            existing.pct += pct;
          } else {
            acc.push({ sector: t.sector, pct });
          }
          return acc;
        }, [])
        .sort((a, b) => b.pct - a.pct);

      const rebalanceAgent = new Agent({
        name: "Rebalance Advisor",
        model: PROVIDER_MODEL,
        instructions: REBALANCE_SYSTEM_PROMPT,
        outputType: z.object({
          suggestions: z.array(
            z.object({
              action: z.enum(["reduce", "add", "diversify", "hedge"]),
              symbol: z.string(),
              reason: z.string(),
              suggestedAllocation: z.number(),
            })
          ),
        }),
      });

      const rebalancePrompt = buildRebalancePrompt(
        holdings,
        { largestPct, top2Pct, score: concentrationScore, label: concentrationLabel },
        sectorExposure
      );

        const rebalanceResult = await run(
          rebalanceAgent,
          [{ role: "user", content: rebalancePrompt }],
          { session, maxTurns: 20 },
        );

      console.log("[evaluate-risk] rebalance result:", rebalanceResult.finalOutput);
      const rebalanceOutput = rebalanceResult.finalOutput as any;
      if (rebalanceOutput?.suggestions) {
        rebalanceSuggestions = rebalanceOutput.suggestions;
        report.rebalanceSuggestions = rebalanceSuggestions;
      }
    } catch (rebalErr) {
      console.error("[evaluate-risk] rebalance step failed:", rebalErr);
    }

    let yieldStrategies: any[] | undefined;
    try {
      const kaminoMap = new Map<string, any>();
      for (const item of (kaminoData as any).results ?? []) {
        if (item.symbol) kaminoMap.set(item.symbol.toUpperCase(), item);
      }
      const byrealMap = new Map<string, any[]>();
      for (const item of (byrealData as any).matches ?? []) {
        if (item.symbol) {
          const key = item.symbol.toUpperCase();
          if (!byrealMap.has(key)) byrealMap.set(key, []);
          byrealMap.get(key)!.push(item);
        }
      }

      const heldSymbols = new Set(holdings.filter(h => h.balance > 0 && h.type !== "base").map(h => h.symbol.toUpperCase()));
      const allYieldSymbols = new Set([...kaminoMap.keys(), ...byrealMap.keys()]);

      const yieldContext: string[] = [];
      for (const symbol of allYieldSymbols) {
        const kamino = kaminoMap.get(symbol);
        const byrealPools = byrealMap.get(symbol) ?? [];
        const held = heldSymbols.has(symbol);

        let entry = `- ${symbol}${held ? " (HELD)" : ""}: `;

        if (kamino) {
          const supplyApy = parseFloat(kamino.market?.supplyApy ?? "0") * 100;
          const borrowApy = parseFloat(kamino.market?.borrowApy ?? "0") * 100;
          entry += `Kamino supply=${supplyApy.toFixed(2)}%, borrow=${borrowApy.toFixed(2)}%. `;
        }

        if (byrealPools.length > 0) {
          const bestPool = byrealPools.reduce((a, b) => (b.apr24h > a.apr24h ? b : a));
          entry += `Byreal best APR=${bestPool.apr24h.toFixed(2)}% (TVL=$${bestPool.tvl.toLocaleString()}).`;
        }

        yieldContext.push(entry);
      }

      if (yieldContext.length > 0) {
        const yieldStrategyAgent = new Agent({
          name: "Yield Strategist",
          model: PROVIDER_MODEL,
          instructions: `You are Zivic's yield and DeFi strategy advisor. Based on yield data and what the user holds, suggest practical DeFi strategies.

Rules:
- Only suggest strategies for tokens in the data
- If user holds a token: suggest earning yield (supply/LP) or borrow-to-accumulate if bullish
- If user doesn't hold a token: only mention if it has exceptional yield opportunities
- Be specific: mention exact APY/APR percentages and platforms
- Keep it concise: 2-4 suggestions max
- Output ONLY valid JSON: { "strategies": [{ "token": "SYM", "action": "earn" | "borrow_accumulate", "reason": "why", "platform": "Kamino | Byreal | both", "apy": number }] }`,
          outputType: z.object({
            strategies: z.array(
              z.object({
                token: z.string(),
                action: z.enum(["earn", "borrow_accumulate"]),
                reason: z.string(),
                platform: z.string(),
                apy: z.number(),
              })
            ),
          }),
        });

        const yieldPrompt = `User holds: ${[...heldSymbols].join(", ") || "no tokenized stocks"}.

Available yield opportunities:
${yieldContext.join("\n")}

Suggest DeFi strategies for this user.`;

        const yieldResult = await run(
          yieldStrategyAgent,
          [{ role: "user", content: yieldPrompt }],
          { session, maxTurns: 20 },
        );

        console.log("[evaluate-risk] yield result:", yieldResult.finalOutput);
        const yieldOutput = yieldResult.finalOutput as any;
        if (yieldOutput?.strategies) {
          yieldStrategies = yieldOutput.strategies;
          report.yieldStrategies = yieldStrategies;
        }
      }
    } catch (yieldErr) {
      console.error("[evaluate-risk] yield strategy step failed:", yieldErr);
    }

    try {
      const saveData = {
        id: walletAddress,
        report: JSON.stringify(report),
        overallScore: report.overallScore,
        ...(rebalanceSuggestions ? { rebalanceSuggestions: JSON.stringify(rebalanceSuggestions!) } : {}),
        ...(yieldStrategies ? { yieldStrategies: JSON.stringify(yieldStrategies!) } : {}),
      };
      const existing = await dataClient.models.RiskEvaluation.get({ id: walletAddress });
      if (existing.data) {
        await dataClient.models.RiskEvaluation.update(saveData);
        console.log("[evaluate-risk] report updated in DB");
      } else {
        await dataClient.models.RiskEvaluation.create(saveData);
        console.log("[evaluate-risk] report created in DB");
      }
    } catch (saveErr) {
      console.error("[evaluate-risk] failed to save report:", saveErr);
    }

    try {
      const { data: profiles } = await dataClient.models.UserProfile.list({
        filter: { walletAddress: { eq: walletAddress } },
      });
      const profile = profiles?.[0];
      if (profile) {
        const inputTokens = Math.ceil(userPrompt.length / 4);
        const outputTokens = Math.ceil(JSON.stringify(result.finalOutput ?? {}).length / 4);
        const rebalanceInputTokens = rebalanceSuggestions ? Math.ceil(JSON.stringify(rebalanceSuggestions!).length / 4) : 0;
        const rebalanceOutputTokens = rebalanceSuggestions ? Math.ceil(JSON.stringify(rebalanceSuggestions!).length / 4) : 0;
        const yieldInputTokens = yieldStrategies ? Math.ceil(JSON.stringify(yieldStrategies!).length / 4) : 0;
        const yieldOutputTokens = yieldStrategies ? Math.ceil(JSON.stringify(yieldStrategies!).length / 4) : 0;
        const creditsUsed = (inputTokens + outputTokens + rebalanceInputTokens + rebalanceOutputTokens + yieldInputTokens + yieldOutputTokens) * CREDIT_RATE;
        const newCredits = Math.max(0, (profile.credits ?? 0) - creditsUsed);
        await dataClient.models.UserProfile.update({
          id: profile.id,
          credits: newCredits,
        });
        console.log("[evaluate-risk] credits deducted:", creditsUsed, "remaining:", newCredits);
      }
    } catch (creditErr) {
      console.error("[evaluate-risk] credits deduction failed:", creditErr);
    }

    return report;
  } catch (err) {
    console.error("[evaluate-risk] error:", err);
    if (err instanceof Error) {
      console.error("[evaluate-risk] error name:", err.name);
      console.error("[evaluate-risk] error message:", err.message);
      console.error("[evaluate-risk] error stack:", err.stack);
    }
    return null;
  }
};
