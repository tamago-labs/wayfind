export interface TokenAddresses {
  solana?: string;
  ethereum?: string;
  bnb?: string;
  arbitrum?: string;
  xlayer?: string;
}

export interface BaseToken {
  symbol: string;
  name: string;
  decimals: number;
  addresses: TokenAddresses;
  cmcId: number;
  logo: string;
}

export const BASE_TOKENS: BaseToken[] = [
  {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    addresses: {
      solana: "11111111111111111111111111111111",
      bnb: "0x570A5D26f7765Ecb712C0924E4De545B89fD43dF",
      xlayer: "0x505000008de8748dbd4422ff4687a4fc9beba15b",
    },
    cmcId: 5426,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    addresses: {
      solana: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      bnb: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
      arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      xlayer: "0xb6ceceab302e2e4948951ee7843fc24e92933061",
    },
    cmcId: 3408,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    addresses: {
      solana: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      arbitrum: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
      xlayer: "0x779ded0c9e1022225f8e0630b35a9b54be713736",
    },
    cmcId: 825,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
  },
  {
    symbol: "USDG",
    name: "Global Dollar",
    decimals: 6,
    addresses: {
      solana: "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH",
      ethereum: "0xe343167631d89B6Ffc58B88d6b7fB0228795491D",
      arbitrum: "0x004b506865409877c9fa29bfb1eba929984b9bbc",
      xlayer: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
    },
    cmcId: 33793,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/33793.png",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    addresses: {
      ethereum: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      arbitrum: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      xlayer: "0xe7b000003a45145decf8a28fc755ad5ec5ea025a",
    },
    cmcId: 1027,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  },
  {
    symbol: "OKB",
    name: "X Layer",
    decimals: 18,
    addresses: {
      xlayer: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    },
    cmcId: 3897,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3897.png",
  },
];

export type ChainKey = keyof TokenAddresses;

export const CHAIN_KEYS: ChainKey[] = ["solana", "ethereum", "bnb", "arbitrum", "xlayer"];

export function getTokenAddress(token: BaseToken, chain: ChainKey, fallback = ''): string {
  return token.addresses[chain] ?? fallback;
}

export function getTokensByChain(chain: ChainKey): BaseToken[] {
  return BASE_TOKENS.filter((t) => t.addresses[chain] != null);
}
