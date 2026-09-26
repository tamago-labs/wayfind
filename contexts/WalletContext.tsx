"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { discoverWallets, connectEVMWallet, switchChain, type EVMWallet } from "@/lib/evm-wallets";
import { SUPPORTED_CHAINS, type ChainConfig } from "@/lib/chains";

type WalletType = "solana" | "evm" | null;

interface WalletState {
  type: WalletType;
  address: string;
  chainId?: number;
  chain?: ChainConfig;
  evmWallets: EVMWallet[];
  isConnecting: boolean;
  error: string | null;
}

interface WalletContextValue extends WalletState {
  connectEVM: (wallet: EVMWallet) => Promise<void>;
  disconnect: () => void;
  switchToChain: (chainId: number) => Promise<void>;
  setSolanaWallet: (address: string) => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    type: null,
    address: "",
    evmWallets: [],
    isConnecting: false,
    error: null,
  });

  useEffect(() => {
    discoverWallets().then((wallets) => {
      setState((s) => ({ ...s, evmWallets: wallets }));
    });
  }, []);

  const connectEVM = useCallback(async (wallet: EVMWallet) => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const { address, chainId } = await connectEVMWallet(wallet);
      const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
      setState((s) => ({
        ...s,
        type: "evm",
        address,
        chainId,
        chain,
        isConnecting: false,
      }));
      try { localStorage.setItem("wayfind:wallet-type", "evm"); } catch {}
    } catch (err) {
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: err instanceof Error ? err.message : "Connection failed",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState((s) => ({ ...s, type: null, address: "", chainId: undefined, chain: undefined }));
    try { localStorage.removeItem("wayfind:wallet-type"); } catch {}
  }, []);

  const switchToChain = useCallback(async (chainId: number) => {
    const wallet = state.evmWallets[0];
    if (!wallet) return;
    await switchChain(wallet.provider, chainId);
    const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
    setState((s) => ({ ...s, chainId, chain }));
  }, [state.evmWallets]);

  const setSolanaWallet = useCallback((address: string) => {
    setState((s) => ({ ...s, type: "solana", address }));
    try { localStorage.setItem("wayfind:wallet-type", "solana"); } catch {}
  }, []);

  return (
    <WalletContext.Provider value={{ ...state, connectEVM, disconnect, switchToChain, setSolanaWallet }}>
      {children}
    </WalletContext.Provider>
  );
}
