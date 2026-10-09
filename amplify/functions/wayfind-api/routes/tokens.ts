import { getClient } from "../middleware/auth";
import { getTokensByTicker, getAllTokensFiltered } from "../lib/config";

function mergeSnapshot(ct: any, snapshot: any) {
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

export async function handleTokens(chain?: string) {
  const client = await getClient() as any;
  const configTokens = getAllTokensFiltered(chain);
  if (configTokens.length === 0) return [];

  const results = [];
  for (const ct of configTokens) {
    try {
      const { data } = await client.models.PriceSnapshot.byTokenSymbol({ token_symbol: ct.symbol });
      const snapshot = data?.[0];
      const merged = mergeSnapshot(ct, snapshot);
      if (merged) results.push(merged);
    } catch {}
  }

  return results;
}

export async function handleTokenTicker(ticker: string) {
  const client = await getClient() as any;

  const configTokens = getTokensByTicker(ticker);
  if (configTokens.length === 0) return [];

  const results = [];
  for (const ct of configTokens) {
    try {
      const { data } = await client.models.PriceSnapshot.byTokenSymbol({ token_symbol: ct.symbol });
      const snapshot = data?.[0];
      const merged = mergeSnapshot(ct, snapshot);
      if (merged) results.push(merged);
    } catch {}
  }

  return results;
}
