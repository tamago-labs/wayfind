export interface BaseToken {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  cmcId: number;
  logo: string;
}

export const BASE_TOKENS: BaseToken[] = [
  {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    address: "11111111111111111111111111111111",
    cmcId: 5426,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    cmcId: 3408,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    cmcId: 825,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
  },
  {
    symbol: "USDG",
    name: "Global Dollar",
    decimals: 6,
    address: "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH",
    cmcId: 33793,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/33793.png",
  },
];
