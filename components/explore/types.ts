export interface TokenRow {
  token_symbol: string;
  stock_symbol: string;
  name: string;
  slug: string;
  crypto_id: string;
  issuer: string;
  logo: string | null;
  industry: string | null;
  price: number | null;
  percent_24h: number | null;
  percent_7d: number | null;
  percent_30d: number | null;
  market_cap: number | null;
  volume_24h: number | null;
}

export type SortKey = "token_symbol" | "stock_symbol" | "issuer" | "price" | "percent_24h" | "percent_7d" | "percent_30d" | "market_cap" | "volume_24h";
export type SortDir = "asc" | "desc";
