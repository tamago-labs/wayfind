import rwaList from "./rwa-v1-list.json";
import preIpoList from "./pre-ipo-list.json";

export interface TokenConfig {
  symbol: string;
  mint: string;
  decimals: number;
}

const tokens = new Map<string, TokenConfig>();

function add(symbol: string, mint: string, decimals: number) {
  if (mint && symbol) {
    tokens.set(symbol.toUpperCase(), { symbol: symbol.toUpperCase(), mint, decimals: decimals ?? 6 });
  }
}

add("SOL", "11111111111111111111111111111111", 9);
add("USDC", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 6);
add("USDT", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", 6);
add("USDG", "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH", 6);

for (const asset of (rwaList as any).assets ?? []) {
  for (const token of asset.tokens ?? []) {
    add(token.symbol, token.mint, token.decimals ?? 6);
  }
}

for (const asset of (preIpoList as any).assets ?? []) {
  add(asset.symbol, asset.mint, 6);
}

export const ALL_TOKENS: TokenConfig[] = Array.from(tokens.values());

export const KNOWN_MINTS: Record<string, { mint: string; decimals: number }> = {};
export const KNOWN_SYMBOLS: Record<string, string> = {};

for (const t of ALL_TOKENS) {
  KNOWN_MINTS[t.symbol] = { mint: t.mint, decimals: t.decimals };
  KNOWN_SYMBOLS[t.symbol] = t.mint;
}

export function getToken(symbol: string): TokenConfig | undefined {
  return tokens.get(symbol.toUpperCase());
}
