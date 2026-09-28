import rwaList from "./rwa-v1-list.json";

export interface TokenMeta {
  symbol: string;
  name: string;
  stockSymbol?: string;
  stockName?: string;
  slug: string;
  crypto_id?: number;
  type: "tokenized";
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  exchange?: string;
  tags?: string[];
  issuer_name?: string;
  issuer_id?: string;
  volume_24h?: number;
  market_cap?: number;
}

interface IssuerRisk {
  level: "Low" | "Low-Moderate" | "Moderate" | "Moderate-High" | "High";
  custody: string;
  description: string;
}

const ISSUER_RISK_TABLE: Record<string, IssuerRisk> = {
  "Backed Assets": {
    level: "Low",
    custody: "Custodied (regulated)",
    description: "Backed Finance is a regulated issuer with transparent custody and redemption rights.",
  },
  "Ondo Assets": {
    level: "Low-Moderate",
    custody: "Custodied (structured)",
    description: "Ondo Finance uses structured custody with established market presence.",
  },
  "Robinhood": {
    level: "Low-Moderate",
    custody: "Custodied (regulated broker)",
    description: "Robinhood issues tokenized stocks as a regulated broker with custody arrangements.",
  },
  "Backpack": {
    level: "Moderate",
    custody: "Custodied (exchange)",
    description: "Backpack issues tokenized stocks through its exchange infrastructure.",
  },
  "Hyperliquid Assets": {
    level: "Moderate",
    custody: "Custodied (exchange)",
    description: "Hyperliquid Assets issues tokenized stocks through its platform.",
  },
};

export function getIssuerRisk(issuerName?: string): IssuerRisk | null {
  if (!issuerName) return null;
  return ISSUER_RISK_TABLE[issuerName] ?? null;
}

const tokenIndex = new Map<string, TokenMeta>();

for (const asset of (rwaList as any).assets ?? []) {
  for (const token of asset.tokens ?? []) {
    if (token.symbol && !tokenIndex.has(token.symbol.toUpperCase())) {
      const meta: TokenMeta = {
        symbol: token.symbol,
        name: token.name ?? asset.name,
        stockSymbol: asset.symbol,
        stockName: asset.name,
        slug: asset.slug ?? "",
        crypto_id: token.crypto_id,
        type: "tokenized",
        sector: asset.industry,
        industry: asset.industry,
        description: token.description ?? asset.description,
        website: token.website ?? asset.website,
        exchange: asset.exchange,
        tags: token.tags ?? asset.tags,
        issuer_name: token.issuer_name ?? asset.issuer_name,
        issuer_id: token.issuer_id ?? asset.issuer_id,
        volume_24h: token.volume_24h,
        market_cap: token.market_cap,
      };
      tokenIndex.set(token.symbol.toUpperCase(), meta);
    }
  }
}

export function getTokenMeta(symbol: string): TokenMeta | undefined {
  return tokenIndex.get(symbol.toUpperCase());
}
