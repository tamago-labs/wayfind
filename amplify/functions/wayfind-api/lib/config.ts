import listData from "../data/rwa-v1-list.json";

export interface ConfigToken {
  symbol: string;
  name: string;
  crypto_id: number;
  issuer_name: string;
  logo: string | null;
  addresses: { solana?: string; ethereum?: string; arbitrum?: string; bnb?: string; xlayer?: string };
}

export interface ConfigAsset {
  symbol: string;
  name: string;
  slug: string;
  tokens: ConfigToken[];
}

const assets: ConfigAsset[] = (listData as any).assets;

export function getTokensByTicker(ticker: string): ConfigToken[] {
  const upper = ticker.toUpperCase();
  for (const asset of assets) {
    if (asset.symbol.toUpperCase() === upper) {
      return asset.tokens;
    }
  }
  return [];
}

export function getAllTokens(): ConfigToken[] {
  const tokens: ConfigToken[] = [];
  for (const asset of assets) {
    tokens.push(...asset.tokens);
  }
  return tokens;
}

export function getTokensByTickerFiltered(ticker: string, chain?: string): ConfigToken[] {
  const tokens = getTokensByTicker(ticker);
  if (!chain) return tokens;
  return tokens.filter((t) => t.addresses?.[chain.toLowerCase()]);
}

export function getAllTokensFiltered(chain?: string): ConfigToken[] {
  const tokens = getAllTokens();
  if (!chain) return tokens;
  return tokens.filter((t) => t.addresses?.[chain.toLowerCase()]);
}
