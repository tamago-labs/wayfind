import { tool } from "@openai/agents";
import { z } from "zod";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/chat-further";
import type { Schema } from "../../data/resource";

let cachedClient: ReturnType<typeof generateClient<Schema>> | null = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
  Amplify.configure(resourceConfig, libraryOptions);
  cachedClient = generateClient<Schema>();
  return cachedClient;
}

export const searchTokens = tool({
  name: "search_tokens",
  description: "Search tokenized stocks by name, ticker, or symbol. Returns matching assets with price, market cap, and volume.",
  parameters: z.object({
    query: z.string().describe("Search query"),
  }),
  execute: async ({ query }: { query: string }) => {
    const client = await getClient();
    const { data: snapshots } = await client.models.PriceSnapshot.list({ limit: 1000 });
    if (!snapshots) return JSON.stringify([]);

    const q = query.toLowerCase();
    const latestByToken = new Map<string, any>();
    for (const s of snapshots) {
      if (!s.token_symbol?.toLowerCase().includes(q) && !s.symbol?.toLowerCase().includes(q)) continue;
      const existing = latestByToken.get(s.token_symbol);
      if (!existing || (s.createdAt ?? "") > (existing.createdAt ?? "")) {
        latestByToken.set(s.token_symbol, s);
      }
    }
    return JSON.stringify(Array.from(latestByToken.values()));
  },
});

export const getTokenDetails = tool({
  name: "get_token_details",
  description: "Get detailed price and market data for a specific tokenized stock.",
  parameters: z.object({
    symbol: z.string().describe("Token symbol (e.g. TSLA, AAPLx)"),
  }),
  execute: async ({ symbol }: { symbol: string }) => {
    const client = await getClient();
    const { data: snapshots } = await client.models.PriceSnapshot.list({ limit: 1000 });
    if (!snapshots) return JSON.stringify({ error: "No data available" });

    const upper = symbol.toUpperCase();
    const latestByToken = new Map<string, any>();
    for (const s of snapshots) {
      const existing = latestByToken.get(s.token_symbol);
      if (!existing || (s.createdAt ?? "") > (existing.createdAt ?? "")) {
        latestByToken.set(s.token_symbol, s);
      }
    }

    for (const [, snap] of latestByToken) {
      if (snap.token_symbol?.toUpperCase() === upper || snap.symbol?.toUpperCase() === upper) {
        return JSON.stringify(snap);
      }
    }
    return JSON.stringify({ error: `Token ${symbol} not found` });
  },
});

export const getAllTokens = tool({
  name: "get_all_tokens",
  description: "Get all available tokenized stocks with price data.",
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
    return JSON.stringify(Array.from(latestByToken.values()));
  },
});

export const getMarketOverview = tool({
  name: "get_market_overview",
  description: "Get overall market summary: total market cap, volume, top movers.",
  parameters: z.object({}),
  execute: async () => {
    const client = await getClient();
    const { data: snapshots } = await client.models.PriceSnapshot.list({ limit: 1000 });
    if (!snapshots) return JSON.stringify({ error: "No data" });

    const latestByToken = new Map<string, any>();
    for (const s of snapshots) {
      const existing = latestByToken.get(s.token_symbol);
      if (!existing || (s.createdAt ?? "") > (existing.createdAt ?? "")) {
        latestByToken.set(s.token_symbol, s);
      }
    }

    const tokens = Array.from(latestByToken.values());
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
  description: "Compare multiple tokenized stocks side by side.",
  parameters: z.object({
    symbols: z.array(z.string()),
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

    const allTokens = Array.from(latestByToken.values());
    const results = symbols
      .map((sym) => {
        const upper = sym.toUpperCase();
        return allTokens.find((t) => t.token_symbol?.toUpperCase() === upper || t.symbol?.toUpperCase() === upper);
      })
      .filter(Boolean);

    return JSON.stringify(results);
  },
});

export const getTrendingTokens = tool({
  name: "get_trending_tokens",
  description: "Get trending tokenized stocks by volume.",
  parameters: z.object({
    limit: z.number().optional(),
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
      .sort((a, b) => (b.volume_24h ?? 0) - (a.volume_24h ?? 0))
      .slice(0, limit);
    return JSON.stringify(sorted);
  },
});
