import rwaList from "./rwa-v1-list.json";
import preIpoList from "./pre-ipo-list.json";

export interface TokenMeta {
  symbol: string;
  name: string;
  slug: string;
  mint: string;
  crypto_id?: number;
  type: "tokenized" | "pre-ipo";
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  tags?: string[];
  issuer_name?: string;
  issuer_id?: string;
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
  "PreStocks": {
    level: "Moderate-High",
    custody: "Attested (independent review)",
    description: "PreStocks tokens have independently attested supply verification. Each token's minted supply is verified by BlockOffice (ACCA-certified) against offchain backing. Pre-IPO tokens still carry limited liquidity, valuation uncertainty, and lock-up period risks.",
  },
};

export function getIssuerRisk(issuerName?: string): IssuerRisk | null {
  if (!issuerName) return null;
  return ISSUER_RISK_TABLE[issuerName] ?? null;
}

const tokenIndex = new Map<string, TokenMeta>();
const mintIndex = new Map<string, TokenMeta>();

for (const asset of (rwaList as any).assets ?? []) {
  for (const token of asset.tokens ?? []) {
    if (token.mint && token.symbol) {
      const meta: TokenMeta = {
        symbol: token.symbol,
        name: token.name ?? asset.name,
        slug: asset.slug ?? "",
        mint: token.mint,
        crypto_id: token.crypto_id,
        type: "tokenized",
        sector: asset.industry,
        description: token.description ?? asset.description,
        website: token.website ?? asset.website,
        tags: token.tags ?? asset.tags,
        issuer_name: token.issuer_name ?? asset.issuer_name,
        issuer_id: token.issuer_id ?? asset.issuer_id,
      };
      tokenIndex.set(token.symbol.toUpperCase(), meta);
      mintIndex.set(token.mint, meta);
    }
  }
}

  for (const asset of (preIpoList as any).assets ?? []) {
    if (asset.mint && asset.symbol) {
      const meta: TokenMeta = {
        symbol: asset.symbol,
        name: asset.name,
        slug: asset.slug ?? "",
        mint: asset.mint,
        type: "pre-ipo",
        industry: asset.industry ?? undefined,
        description: asset.description,
        website: asset.website,
        tags: asset.tags,
        issuer_name: "PreStocks",
      };
      tokenIndex.set(asset.symbol.toUpperCase(), meta);
      mintIndex.set(asset.mint, meta);
    }
  }

export function getTokenMeta(symbol: string): TokenMeta | undefined {
  return tokenIndex.get(symbol.toUpperCase());
}

export function getTokenMetaByMint(mint: string): TokenMeta | undefined {
  return mintIndex.get(mint);
}

export function toTicker(symbol: string): string {
  return symbol.replace(/X$/, "").replace(/on$/, "").toUpperCase();
}

export function getCryptoId(symbol: string): number | undefined {
  const meta = tokenIndex.get(symbol.toUpperCase());
  return meta?.crypto_id;
}
