import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/wayfind-api";
import type { Schema } from "../../data/resource";
import listData from "./data/rwa-v1-list.json";

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

    return json(404, { error: "Not found" });
  } catch (err) {
    console.error("[wayfind-api] error:", err);
    return json(500, { error: "Internal server error" });
  }
};
