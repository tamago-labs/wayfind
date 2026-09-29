import { tool } from "@openai/agents";
import { z } from "zod";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/chat-further";
import type { Schema } from "../../data/resource";

export const getPreIpoMarkets = tool({
  name: "get_pre_ipo_markets",
  description: "List all available PreStocks markets with mark price, token price, valuation, and supply.",
  parameters: z.object({}),
  execute: async () => {
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
    Amplify.configure(resourceConfig, libraryOptions);
    const client = generateClient<Schema>();

    const { data } = await client.models.PreStock.list({
      filter: { markPrice: { gt: 0 } },
      limit: 1000,
    });

    const snapshots = data ?? [];
    if (snapshots.length === 0) return JSON.stringify([]);

    const bySymbol = new Map<string, typeof snapshots>();
    for (const s of snapshots) {
      if (!bySymbol.has(s.symbol)) bySymbol.set(s.symbol, []);
      bySymbol.get(s.symbol)!.push(s);
    }

    const markets = Array.from(bySymbol.entries()).map(([symbol, snaps]) => {
      const sorted = snaps.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
      const latest = sorted[sorted.length - 1];
      return {
        symbol,
        tokenPrice: latest.tokenPrice ?? null,
        markPrice: latest.markPrice ?? null,
        markValuation: latest.markValuation ?? null,
        impliedValuation: latest.impliedValuation ?? null,
        supply: latest.supply ?? null,
      };
    });

    return JSON.stringify(markets);
  },
});
