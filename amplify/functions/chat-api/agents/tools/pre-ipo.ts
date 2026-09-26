import { tool } from "@openai/agents";
import { z } from "zod";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/chat-api";
import type { Schema } from "../../../../data/resource";
import listData from "./pre-ipo-list.json";

const EXCLUDED_SYMBOLS = ["SPACEX"];

function getAssetMeta(symbol: string) {
  const assets = (listData as any).assets || [];
  return assets.find((a: any) => a.symbol === symbol);
}

export const getPreIpoMarkets = tool({
  name: "get_pre_ipo_markets",
  description: "List all available PreStocks markets with mark price, token price, mark valuation, implied valuation, and supply.",
  parameters: z.object({}),
  execute: async () => {
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
    Amplify.configure(resourceConfig, libraryOptions);
    const client = generateClient<Schema>();

    const { data } = await client.models.PreStock.list({
      filter: { markPrice: { gt: 0 } },
      limit: 1000,
    });

    const snapshots = data
      ? data.filter((s) => !EXCLUDED_SYMBOLS.includes(s.symbol))
      : [];

    if (snapshots.length === 0) {
      return JSON.stringify([]);
    }

    const bySymbol = new Map<string, typeof snapshots>();
    for (const s of snapshots) {
      if (!bySymbol.has(s.symbol)) bySymbol.set(s.symbol, []);
      bySymbol.get(s.symbol)!.push(s);
    }

    const markets = Array.from(bySymbol.entries()).map(([symbol, snaps]) => {
      const sorted = snaps.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
      const latest = sorted[sorted.length - 1];
      const meta = getAssetMeta(symbol);

      return {
        symbol,
        name: meta?.name ?? symbol,
        website: meta?.website ?? null,
        industry: meta?.industry ?? null,
        tokenPrice: latest.tokenPrice ?? null,
        markPrice: latest.markPrice ?? null,
        markValuation: latest.markValuation ?? null,
        impliedValuation: latest.impliedValuation ?? null,
        supply: latest.supply ?? null,
        mint: meta?.mint ?? null,
      };
    });

    return JSON.stringify(markets);
  },
});
