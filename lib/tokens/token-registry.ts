import rwaList from '@/lib/data/rwa-v1-list.json';
import preIpoList from '@/lib/data/pre-ipo-list.json';
import { BASE_TOKENS, type BaseToken } from './base-tokens';

export interface TokenInfo {
  symbol: string;
  mint: string;
  decimals: number;
}

const registry = new Map<string, TokenInfo>();

function register(symbol: string, mint: string, decimals: number) {
  registry.set(symbol.toUpperCase(), { symbol: symbol.toUpperCase(), mint, decimals });
}

for (const token of BASE_TOKENS) {
  register(token.symbol, token.address, token.decimals);
}

for (const asset of (rwaList as any).assets ?? []) {
  for (const token of asset.tokens ?? []) {
    if (token.mint && token.symbol) {
      register(token.symbol, token.mint, token.decimals ?? 6);
    }
  }
}

for (const asset of (preIpoList as any).assets ?? []) {
  if (asset.mint && asset.symbol) {
    register(asset.symbol, asset.mint, 6);
  }
}

export function getToken(symbol: string): TokenInfo | undefined {
  return registry.get(symbol.toUpperCase());
}

export function getAllTokens(): TokenInfo[] {
  return Array.from(registry.values());
}
