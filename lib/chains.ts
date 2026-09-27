export interface ChainConfig {
  id: number;
  name: string;
  shortName: string;
  rpcUrl: string;
  fallbackRpcs?: string[];
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  color: string;
  cmcId: number;
}

export const ETHEREUM: ChainConfig = {
  id: 1,
  name: "Ethereum",
  shortName: "ETH",
  rpcUrl: "https://eth.blockrazor.xyz",
  explorerUrl: "https://etherscan.io",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  color: "#627EEA",
  cmcId: 1027,
};

export const BNB_CHAIN: ChainConfig = {
  id: 56,
  name: "BNB Chain",
  shortName: "BNB",
  rpcUrl: "https://bsc-dataseed.bnbchain.org",
  explorerUrl: "https://bscscan.com",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  color: "#F3BA2F",
  cmcId: 1839,
};

export const X_LAYER: ChainConfig = {
  id: 196,
  name: "X Layer",
  shortName: "X Layer",
  rpcUrl: "https://rpc.xlayer.tech",
  explorerUrl: "https://www.okx.com/web3/explorer/xlayer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  color: "#275FEE",
  cmcId: 3897,
};

export const ARBITRUM: ChainConfig = {
  id: 42161,
  name: "Arbitrum One",
  shortName: "ARB",
  rpcUrl: "https://arb1.arbitrum.io/rpc",
  explorerUrl: "https://arbiscan.io",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  color: "#28A0F0",
  cmcId: 11841,
};

export const SUPPORTED_CHAINS: ChainConfig[] = [ETHEREUM, BNB_CHAIN, ARBITRUM, X_LAYER];

export function getChainById(id: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find((c) => c.id === id);
}

export function getAddChainParams(chain: ChainConfig) {
  return {
    chainId: `0x${chain.id.toString(16)}`,
    chainName: chain.name,
    rpcUrls: [chain.rpcUrl],
    nativeCurrency: chain.nativeCurrency,
    blockExplorerUrls: [chain.explorerUrl],
  };
}
