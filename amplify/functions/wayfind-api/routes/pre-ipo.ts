import { getClient } from "../middleware/auth";

export async function handlePreIpo() {
  const client = await getClient() as any;
  const { data } = await client.models.PreStock.list({
    filter: { markPrice: { gt: 0 } },
    limit: 1000,
  });

  const snapshots = data ?? [];
  if (snapshots.length === 0) return [];

  const bySymbol = new Map<string, any[]>();
  for (const s of snapshots) {
    if (!bySymbol.has(s.symbol)) bySymbol.set(s.symbol, []);
    bySymbol.get(s.symbol)!.push(s);
  }

  return Array.from(bySymbol.entries()).map(([symbol, snaps]) => {
    const sorted = snaps.sort((a: any, b: any) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
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
}
