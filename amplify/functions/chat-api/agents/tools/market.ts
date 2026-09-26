import { tool } from "@openai/agents";
import { z } from "zod";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/chat-api";
import type { Schema } from "../../../../data/resource";
import listData from "./rwa-v1-list.json";

async function getClient() {
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
  Amplify.configure(resourceConfig, libraryOptions);
  return generateClient<Schema>();
}

function mergeWithConfig(tokenSymbol: string, snapshot: any) {
  const assets = (listData as any).assets || [];
  for (const asset of assets) {
    const match = asset.tokens?.find((t: any) => t.symbol === tokenSymbol);
    if (match) {
      return {
        symbol: asset.symbol ?? null,
        name: asset.name ?? null,
        industry: asset.industry ?? null,
        website: asset.website ?? null,
        token_symbol: snapshot.token_symbol,
        price: snapshot.price ?? null,
        market_cap: snapshot.market_cap ?? null,
        volume_24h: snapshot.volume_24h ?? null,
        percent_1h: snapshot.percent_1h ?? null,
        percent_24h: snapshot.percent_24h ?? null,
        percent_7d: snapshot.percent_7d ?? null,
        percent_30d: snapshot.percent_30d ?? null,
        circulating_supply: snapshot.circulating_supply ?? null,
        total_supply: snapshot.total_supply ?? null,
      };
    }
  }
  return {
    symbol: null,
    name: tokenSymbol,
    industry: null,
    website: null,
    token_symbol: snapshot.token_symbol,
    price: snapshot.price ?? null,
    market_cap: snapshot.market_cap ?? null,
    volume_24h: snapshot.volume_24h ?? null,
    percent_1h: snapshot.percent_1h ?? null,
    percent_24h: snapshot.percent_24h ?? null,
    percent_7d: snapshot.percent_7d ?? null,
    percent_30d: snapshot.percent_30d ?? null,
    circulating_supply: snapshot.circulating_supply ?? null,
    total_supply: snapshot.total_supply ?? null,
  };
}

export const searchTokens = tool({
  name: "search_tokens",
  description: "Search tokenized stocks by stock name, stock ticker, or token symbol. Returns matching assets with price, market cap, and volume.",
  parameters: z.object({
    query: z.string().describe("Search query (stock name, ticker, or token symbol)"),
  }),
  execute: async ({ query }: { query: string }) => {
    const client = await getClient();
    const q = query.toLowerCase();

    const assets = (listData as any).assets || [];
    const matchingAssets = assets.filter((a: any) =>
      a.symbol?.toLowerCase().includes(q) ||
      a.name?.toLowerCase().includes(q) ||
      a.tokens?.some((t: any) => t.symbol.toLowerCase().includes(q))
    );

    if (matchingAssets.length === 0) {
      return JSON.stringify([]);
    }

    const tokenSymbols = matchingAssets.flatMap((a: any) => a.tokens?.map((t: any) => t.symbol) ?? []);
    const { data: snapshots } = await client.models.PriceSnapshot.list({ limit: 1000 });

    if (!snapshots) return JSON.stringify([]);

    const latestByToken = new Map<string, any>();
    for (const s of snapshots) {
      if (!tokenSymbols.includes(s.token_symbol)) continue;
      const existing = latestByToken.get(s.token_symbol);
      if (!existing || (s.createdAt ?? "") > (existing.createdAt ?? "")) {
        latestByToken.set(s.token_symbol, s);
      }
    }

    const results = matchingAssets.map((asset: any) => ({
      symbol: asset.symbol,
      name: asset.name,
      industry: asset.industry,
      website: asset.website,
      tokens: (asset.tokens ?? []).map((t: any) => {
        const snap = latestByToken.get(t.symbol);
        return snap ? mergeWithConfig(t.symbol, snap) : { token_symbol: t.symbol, price: null };
      }),
    }));

    return JSON.stringify(results);
  },
});

export const getTokenDetails = tool({
  name: "get_token_details",
  description: "Get detailed information for a specific tokenized stock including price, market data, and fundamentals.",
  parameters: z.object({
    symbol: z.string().describe("Stock ticker (e.g., TSLA) or token symbol"),
  }),
  execute: async ({ symbol }: { symbol: string }) => {
    const client = await getClient();
    const s = symbol.toUpperCase();

    const assets = (listData as any).assets || [];
    const asset = assets.find((a: any) =>
      a.symbol?.toUpperCase() === s ||
      a.tokens?.some((t: any) => t.symbol.toUpperCase() === s)
    );

    if (!asset) return JSON.stringify({ error: `Token ${symbol} not found` });

    const tokenSymbols = asset.tokens?.map((t: any) => t.symbol) ?? [];
    const { data: snapshots } = await client.models.PriceSnapshot.list({ limit: 1000 });

    if (!snapshots) return JSON.stringify({ error: "No price data available" });

    const latestByToken = new Map<string, any>();
    for (const snap of snapshots) {
      if (!tokenSymbols.includes(snap.token_symbol)) continue;
      const existing = latestByToken.get(snap.token_symbol);
      if (!existing || (snap.createdAt ?? "") > (existing.createdAt ?? "")) {
        latestByToken.set(snap.token_symbol, snap);
      }
    }

    return JSON.stringify({
      symbol: asset.symbol,
      name: asset.name,
      industry: asset.industry,
      website: asset.website,
      tokens: (asset.tokens ?? []).map((t: any) => {
        const snap = latestByToken.get(t.symbol);
        return snap ? mergeWithConfig(t.symbol, snap) : { token_symbol: t.symbol, price: null };
      }),
    });
  },
});

export const getAllTokens = tool({
  name: "get_all_tokens",
  description: "Get all available tokenized stocks with price, market cap, and volume.",
  parameters: z.object({}),
  execute: async () => {
    const client = await getClient();
    const { data: snapshots } = await client.models.PriceSnapshot.list({ limit: 1000 });

    if (!snapshots) return JSON.stringify([]);

    const latestByToken = new Map<string, any>();
    for (const s of snapshots) {
      const existing = latestByToken.get(s.token_symbol);
      if (!existing || (s.createdAt ?? "") > (existing.createdAt ?? "")) {
        latestByToken.set(s.token_symbol, s);
      }
    }

    const results = Array.from(latestByToken.values()).map((s) => mergeWithConfig(s.token_symbol, s));
    return JSON.stringify(results);
  },
});

export const getMarketOverview = tool({
  name: "get_market_overview",
  description: "Get overall market summary including total market cap, volume, trending, and top movers.",
  parameters: z.object({}),
  execute: async () => {
    const client = await getClient();
    const { data: snapshots } = await client.models.PriceSnapshot.list({ limit: 1000 });

    if (!snapshots) return JSON.stringify({ error: "No data available" });

    const latestByToken = new Map<string, any>();
    for (const s of snapshots) {
      const existing = latestByToken.get(s.token_symbol);
      if (!existing || (s.createdAt ?? "") > (existing.createdAt ?? "")) {
        latestByToken.set(s.token_symbol, s);
      }
    }

    const tokens = Array.from(latestByToken.values()).map((s) => mergeWithConfig(s.token_symbol, s));
    const totalMcap = tokens.reduce((sum, t) => sum + (t.market_cap ?? 0), 0);
    const totalVolume = tokens.reduce((sum, t) => sum + (t.volume_24h ?? 0), 0);

    const sortedByChange = [...tokens].sort((a, b) => (b.percent_24h ?? 0) - (a.percent_24h ?? 0));
    const sortedByVolume = [...tokens].sort((a, b) => (b.volume_24h ?? 0) - (a.volume_24h ?? 0));

    return JSON.stringify({
      totalMarketCap: totalMcap,
      totalVolume24h: totalVolume,
      tokenCount: tokens.length,
      gainers: sortedByChange.slice(0, 3),
      losers: sortedByChange.slice(-3).reverse(),
      trending: sortedByVolume.slice(0, 5),
    });
  },
});

export const compareTokens = tool({
  name: "compare_tokens",
  description: "Compare multiple tokenized stocks side by side on price, market cap, volume, and fundamentals.",
  parameters: z.object({
    symbols: z.array(z.string()).describe("Array of stock tickers or token symbols to compare"),
  }),
  execute: async ({ symbols }: { symbols: string[] }) => {
    const client = await getClient();
    const { data: snapshots } = await client.models.PriceSnapshot.list({ limit: 1000 });

    if (!snapshots) return JSON.stringify([]);

    const latestByToken = new Map<string, any>();
    for (const s of snapshots) {
      const existing = latestByToken.get(s.token_symbol);
      if (!existing || (s.createdAt ?? "") > (existing.createdAt ?? "")) {
        latestByToken.set(s.token_symbol, s);
      }
    }

    const allTokens = Array.from(latestByToken.values()).map((s) => mergeWithConfig(s.token_symbol, s));

    const results = symbols
      .map((sym) => {
        const s = sym.toUpperCase();
        return allTokens.find((t) => t.symbol?.toUpperCase() === s || t.token_symbol?.toUpperCase() === s);
      })
      .filter(Boolean);

    return JSON.stringify(results);
  },
});

export const getTrendingTokens = tool({
  name: "get_trending_tokens",
  description: "Get the most trending tokenized stocks by volume and recent price action.",
  parameters: z.object({
    limit: z.number().optional().describe("Number of trending tokens to return (default 5)"),
  }),
  execute: async ({ limit = 5 }: { limit?: number }) => {
    const client = await getClient();
    const { data: snapshots } = await client.models.PriceSnapshot.list({ limit: 1000 });

    if (!snapshots) return JSON.stringify([]);

    const latestByToken = new Map<string, any>();
    for (const s of snapshots) {
      const existing = latestByToken.get(s.token_symbol);
      if (!existing || (s.createdAt ?? "") > (existing.createdAt ?? "")) {
        latestByToken.set(s.token_symbol, s);
      }
    }

    const sorted = Array.from(latestByToken.values())
      .map((s) => mergeWithConfig(s.token_symbol, s))
      .sort((a, b) => (b.volume_24h ?? 0) - (a.volume_24h ?? 0))
      .slice(0, limit);

    return JSON.stringify(sorted);
  },
});
