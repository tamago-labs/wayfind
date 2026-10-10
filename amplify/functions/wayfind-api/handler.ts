import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/wayfind-api";
import type { Schema } from "../../data/resource";
import listData from "./data/rwa-v1-list.json";
import baseTokens from "./data/base-tokens.json";
import crypto from "crypto";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
Amplify.configure(resourceConfig, libraryOptions);
const dataClient = generateClient<Schema>();



interface ConfigToken {
  symbol: string;
  name: string;
  crypto_id: number;
  issuer_name: string;
  logo: string | null;
  addresses: { solana?: string; ethereum?: string; arbitrum?: string; bnb?: string; xlayer?: string; [key: string]: string | undefined };
}

const assets = (listData as any).assets;

function getTokensByTicker(ticker: string): ConfigToken[] {
  const upper = ticker.toUpperCase();
  for (const asset of assets) {
    if (asset.symbol.toUpperCase() === upper) return asset.tokens;
  }
  return [];
}

function getAllTokens(chain?: string): ConfigToken[] {
  const tokens: ConfigToken[] = [];
  for (const asset of assets) tokens.push(...asset.tokens);
  if (!chain) return tokens;
  return tokens.filter((t) => t.addresses?.[chain.toLowerCase()]);
}

function mergeSnapshot(ct: ConfigToken, snapshot: any) {
  if (!snapshot) return null;
  return {
    token_symbol: snapshot.token_symbol,
    symbol: snapshot.symbol,
    price: snapshot.price,
    market_cap: snapshot.market_cap,
    volume_24h: snapshot.volume_24h,
    percent_1h: snapshot.percent_1h,
    percent_24h: snapshot.percent_24h,
    percent_7d: snapshot.percent_7d,
    percent_30d: snapshot.percent_30d,
    name: ct.name,
    logo: ct.logo,
    issuer_name: ct.issuer_name,
    crypto_id: ct.crypto_id,
    addresses: ct.addresses,
  };
}

function resolveSolanaAddress(symbol: string): string | null {
  const upper = symbol.toUpperCase();

  const base = (baseTokens as any[]).find((t) => t.symbol.toUpperCase() === upper);
  if (base?.addresses?.solana) return base.addresses.solana;

  for (const asset of assets) {
    for (const token of asset.tokens) {
      if (token.symbol?.toUpperCase() === upper) {
        if (token.addresses?.solana) return token.addresses.solana;
      }
    }
  }

  for (const asset of assets) {
    if (asset.symbol.toUpperCase() === upper) {
      const withSolana = asset.tokens.filter((t: any) => t.addresses?.solana);
      if (withSolana.length === 0) return null;
      withSolana.sort((a: any, b: any) => (b.market_cap ?? 0) - (a.market_cap ?? 0));
      return withSolana[0].addresses.solana;
    }
  }

  return null;
}

function json(statusCode: number, body: any): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

async function validateApiKey(apiKey: string): Promise<{ valid: boolean; profileId?: string; error?: string }> {
  if (!apiKey) return { valid: false, error: "API key required" };
  try {
    const { data: profile } = await dataClient.models.UserProfile.get({ id: apiKey });
    if (!profile) return { valid: false, error: "Invalid API key" };
    if (profile.apiKeyActive === false) return { valid: false, error: "API key deactivated" };
    return { valid: true, profileId: profile.id };
  } catch {
    return { valid: false, error: "Invalid API key" };
  }
}


export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.requestContext.http.method === "OPTIONS") return json(200, {});

  const apiKey = event.headers["x-api-key"] || event.queryStringParameters?.apiKey;
  const auth = await validateApiKey(apiKey ?? "");
  if (!auth.valid) return json(401, { error: auth.error });

  const profileId = auth.profileId!;
  const path = event.rawPath || event.requestContext.http.path;
  const qs = event.queryStringParameters || {};

  try {
    // GET /api/v1/tokens
    if (path.endsWith("/tokens") || path.endsWith("/tokens/")) {
      const configTokens = getAllTokens(qs.chain);
      const results = [];
      for (const ct of configTokens) {
        try {
          const { data } = await dataClient.models.PriceSnapshot.byTokenSymbol({ token_symbol: ct.symbol });
          const merged = mergeSnapshot(ct, data?.[0]);
          if (merged) results.push(merged);
        } catch {}
      }
      return json(200, { data: results });
    }

    // GET /api/v1/tokens/:ticker
    const tokensMatch = path.match(/\/tokens\/(.+)$/);
    if (tokensMatch) {
      const ticker = decodeURIComponent(tokensMatch[1]);
      const configTokens = getTokensByTicker(ticker);
      const results = [];
      for (const ct of configTokens) {
        try {
          const { data } = await dataClient.models.PriceSnapshot.byTokenSymbol({ token_symbol: ct.symbol });
          const merged = mergeSnapshot(ct, data?.[0]);
          if (merged) results.push(merged);
        } catch {}
      }
      return json(200, { data: results });
    }

    // GET /api/v1/risk-profile
    if (path.endsWith("/risk-profile")) {
      const { data: profile } = await dataClient.models.UserProfile.get({ id: profileId });
      if (!profile) return json(404, { error: "Profile not found" });
      const defaultReviewId = profile.defaultReviewId;
      if (!defaultReviewId) return json(404, { error: "No default risk profile set" });
      const { data: review } = await dataClient.models.SavedReview.get({ id: defaultReviewId });
      if (!review) return json(404, { error: "Risk profile not found" });
      const r = review as any;
      const report = JSON.parse(r.report as string);
      const answers = JSON.parse(r.answers as string);
      return json(200, { data: { overallScore: report.overallScore, overallLabel: report.overallLabel, answers } });
    }

    // GET /api/v1/market-overview
    if (path.endsWith("/market-overview")) {
      const { data: snapshots } = await dataClient.models.PriceSnapshot.list({ limit: 1000 });
      if (!snapshots) return json(200, { data: { error: "No data" } });
      const latestByToken = new Map<string, any>();
      for (const s of snapshots) {
        const existing = latestByToken.get(s.token_symbol);
        if (!existing || (s.createdAt ?? "") > (existing.createdAt ?? "")) latestByToken.set(s.token_symbol, s);
      }
      const tokens = Array.from(latestByToken.values());
      const totalMcap = tokens.reduce((sum: number, t: any) => sum + (t.market_cap ?? 0), 0);
      const totalVolume = tokens.reduce((sum: number, t: any) => sum + (t.volume_24h ?? 0), 0);
      const sortedByChange = [...tokens].sort((a: any, b: any) => (b.percent_24h ?? 0) - (a.percent_24h ?? 0));
      const sortedByVolume = [...tokens].sort((a: any, b: any) => (b.volume_24h ?? 0) - (a.volume_24h ?? 0));
      return json(200, { data: { totalMarketCap: totalMcap, totalVolume24h: totalVolume, tokenCount: tokens.length, gainers: sortedByChange.slice(0, 5), losers: sortedByChange.slice(-5).reverse(), trending: sortedByVolume.slice(0, 10) } });
    }

    // GET /api/v1/pre-ipo
    if (path.endsWith("/pre-ipo")) {
      const { data } = await dataClient.models.PreStock.list({ filter: { markPrice: { gt: 0 } }, limit: 1000 });
      const snapshots = data ?? [];
      if (snapshots.length === 0) return json(200, { data: [] });
      const bySymbol = new Map<string, any[]>();
      for (const s of snapshots) {
        if (!bySymbol.has(s.symbol)) bySymbol.set(s.symbol, []);
        bySymbol.get(s.symbol)!.push(s);
      }
      const markets = Array.from(bySymbol.entries()).map(([symbol, snaps]) => {
        const sorted = snaps.sort((a: any, b: any) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
        const latest = sorted[sorted.length - 1];
        return { symbol, tokenPrice: latest.tokenPrice ?? null, markPrice: latest.markPrice ?? null, markValuation: latest.markValuation ?? null, impliedValuation: latest.impliedValuation ?? null, supply: latest.supply ?? null };
      });
      return json(200, { data: markets });
    }

    // GET /api/v1/swap-quote
    if (path.endsWith("/swap-quote")) {
      const OKX_API_KEY = env.OKX_API_KEY;
      const OKX_SECRET_KEY = env.OKX_SECRET_KEY;
      const OKX_PASSPHRASE = env.OKX_PASSPHRASE;

      const fromTokenAddress = qs.fromTokenAddress ?? (qs.fromSymbol ? resolveSolanaAddress(qs.fromSymbol) : null);
      const toTokenAddress = qs.toTokenAddress ?? (qs.toSymbol ? resolveSolanaAddress(qs.toSymbol) : null);
      const amount = qs.amount;

      if (!fromTokenAddress || !toTokenAddress || !amount) {
        return json(400, { error: "Missing required parameters: fromTokenAddress/fromSymbol, toTokenAddress/toSymbol, amount" });
      }

      const url = new URL("https://web3.okx.com/api/v6/dex/aggregator/quote");
      url.searchParams.set("chainIndex", "501");
      url.searchParams.set("amount", amount);
      url.searchParams.set("fromTokenAddress", fromTokenAddress);
      url.searchParams.set("toTokenAddress", toTokenAddress);

      const path = url.pathname + url.search;
      const timestamp = new Date().toISOString();
      const signature = crypto.createHmac("sha256", OKX_SECRET_KEY).update(timestamp + "GET" + path).digest("base64");

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "OK-ACCESS-KEY": OKX_API_KEY,
          "OK-ACCESS-SIGN": signature,
          "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE,
          "OK-ACCESS-TIMESTAMP": timestamp,
        },
      });

      if (!res.ok) return json(res.status, { error: `OKX API HTTP ${res.status}` });

      const data = await res.json();
      if (data.code !== "0") return json(400, { error: data.msg || "OKX API error" });

      const quote = data.data?.[0];
      if (!quote) return json(404, { error: "No quote available" });

      return json(200, { data: quote });
    }

    // GET /api/v1/swap-instruction
    if (path.endsWith("/swap-instruction")) {
      const OKX_API_KEY = env.OKX_API_KEY;
      const OKX_SECRET_KEY = env.OKX_SECRET_KEY;
      const OKX_PASSPHRASE = env.OKX_PASSPHRASE;

      const fromTokenAddress = qs.fromTokenAddress ?? (qs.fromSymbol ? resolveSolanaAddress(qs.fromSymbol) : null);
      const toTokenAddress = qs.toTokenAddress ?? (qs.toSymbol ? resolveSolanaAddress(qs.toSymbol) : null);
      const amount = qs.amount;
      const userWalletAddress = qs.userWalletAddress;
      const slippagePercent = qs.slippagePercent ?? "0.5";

      if (!fromTokenAddress || !toTokenAddress || !amount || !userWalletAddress) {
        return json(400, { error: "Missing required parameters: fromTokenAddress/fromSymbol, toTokenAddress/toSymbol, amount, userWalletAddress" });
      }

      const url = new URL("https://web3.okx.com/api/v6/dex/aggregator/swap");
      url.searchParams.set("chainIndex", "501");
      url.searchParams.set("amount", amount);
      url.searchParams.set("fromTokenAddress", fromTokenAddress);
      url.searchParams.set("toTokenAddress", toTokenAddress);
      url.searchParams.set("userWalletAddress", userWalletAddress);
      url.searchParams.set("slippagePercent", slippagePercent);
      url.searchParams.set("autoSlippage", "true");

      const path = url.pathname + url.search;
      const timestamp = new Date().toISOString();
      const signature = crypto.createHmac("sha256", OKX_SECRET_KEY).update(timestamp + "GET" + path).digest("base64");

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "OK-ACCESS-KEY": OKX_API_KEY,
          "OK-ACCESS-SIGN": signature,
          "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE,
          "OK-ACCESS-TIMESTAMP": timestamp,
        },
      });

      if (!res.ok) return json(res.status, { error: `OKX API HTTP ${res.status}` });

      const data = await res.json();
      if (data.code !== "0") return json(400, { error: data.msg || "OKX API error" });

      const swapData = data.data?.[0];
      if (!swapData) return json(404, { error: "No swap data available" });

      return json(200, {
        data: {
          base58Transaction: swapData.tx?.data ?? "",
          routerResult: swapData.routerResult,
          minReceiveAmount: swapData.tx?.minReceiveAmount ?? "0",
        },
      });
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    console.error("[wayfind-api] error:", err);
    return json(500, { error: "Internal server error" });
  }
};
