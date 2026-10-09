import { getClient } from "../middleware/auth";

export async function handleMarketOverview() {
  const client = await getClient() as any;
  const { data: snapshots } = await client.models.PriceSnapshot.list({ limit: 1000 });
  if (!snapshots) return { error: "No data" };

  const latestByToken = new Map<string, any>();
  for (const s of snapshots) {
    const existing = latestByToken.get(s.token_symbol);
    if (!existing || (s.createdAt ?? "") > (existing.createdAt ?? "")) {
      latestByToken.set(s.token_symbol, s);
    }
  }

  const tokens = Array.from(latestByToken.values());
  const totalMcap = tokens.reduce((sum: number, t: any) => sum + (t.market_cap ?? 0), 0);
  const totalVolume = tokens.reduce((sum: number, t: any) => sum + (t.volume_24h ?? 0), 0);
  const sortedByChange = [...tokens].sort((a: any, b: any) => (b.percent_24h ?? 0) - (a.percent_24h ?? 0));
  const sortedByVolume = [...tokens].sort((a: any, b: any) => (b.volume_24h ?? 0) - (a.volume_24h ?? 0));

  return {
    totalMarketCap: totalMcap,
    totalVolume24h: totalVolume,
    tokenCount: tokens.length,
    gainers: sortedByChange.slice(0, 5),
    losers: sortedByChange.slice(-5).reverse(),
    trending: sortedByVolume.slice(0, 10),
  };
}
