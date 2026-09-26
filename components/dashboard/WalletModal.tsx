"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWallets,
  useWalletStatus,
} from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { Wallet, X } from "lucide-react";
import type { AppClient } from "../SolanaWalletProvider";
import { truncate } from "@/lib/wallet";
import { useWallet } from "@/contexts/WalletContext";

const backdrop = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modal = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

type Tab = "solana" | "evm";

export function WalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("solana");
  const [mounted, setMounted] = useState(false);

  const client = useClient<AppClient>();
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);
  const status = useWalletStatus(client);

  const { evmWallets, connectEVM, isConnecting: evmConnecting, error: evmError, type } = useWallet();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (type === "evm") setTab("evm");
    if (type === "solana") setTab("solana");
  }, [type]);

  const solanaAddress = connected ? String(connected.account.address) : null;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm mx-4 rounded-2xl border border-border3/50 bg-surface p-6 shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold">Connect Wallet</h3>
            </div>

            <div className="flex gap-1 mb-5 p-1 rounded-lg bg-white/[0.03]">
              <button
                onClick={() => setTab("solana")}
                className={`flex-1 py-2 text-[12px] font-medium rounded-md transition-colors ${tab === "solana" ? "bg-accent/20 text-accent" : "text-white/40 hover:text-white/60"}`}
              >
                Solana
              </button>
              <button
                onClick={() => setTab("evm")}
                className={`flex-1 py-2 text-[12px] font-medium rounded-md transition-colors ${tab === "evm" ? "bg-accent/20 text-accent" : "text-white/40 hover:text-white/60"}`}
              >
                EVM
              </button>
            </div>

            {tab === "solana" && (
              <>
                {connected ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border3/50 bg-white/[0.02] p-4">
                      <p className="text-[11px] uppercase tracking-wider text-white/30 mb-1">Connected</p>
                      <p className="font-mono text-[14px] text-white/80">{truncate(solanaAddress!)}</p>
                    </div>
                    <button
                      onClick={() => { void disconnect.dispatch(); onClose(); }}
                      disabled={status === "pending"}
                      className="w-full rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {wallets.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-[13px] text-white/40">No wallets detected.</p>
                        <p className="text-[12px] text-white/25 mt-1">Install Phantom or another Solana wallet.</p>
                      </div>
                    ) : (
                      wallets.map((wallet) => (
                        <button
                          key={wallet.name}
                          disabled={connect.isRunning || status === "pending"}
                          onClick={() => { void connect.dispatch(wallet); onClose(); }}
                          className="w-full flex items-center gap-3 rounded-xl border border-border3/50 bg-white/[0.02] px-4 py-3.5 text-[14px] text-white/70 hover:text-white hover:border-accent/40 hover:bg-accent/[0.04] transition-all disabled:opacity-50"
                        >
                          {wallet.icon ? (
                            <img src={wallet.icon} alt={wallet.name} className="w-5 h-5 rounded" />
                          ) : (
                            <Wallet className="w-5 h-5 text-white/30" />
                          )}
                          <span className="font-medium">{wallet.name}</span>
                          <span className="ml-auto text-[11px] text-accent">Connect</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}

            {tab === "evm" && (
              <div className="space-y-2">
                {evmWallets.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[13px] text-white/40">No EVM wallets detected.</p>
                    <p className="text-[12px] text-white/25 mt-1">Install MetaMask or OKX Wallet.</p>
                  </div>
                ) : (
                  evmWallets.map((wallet) => (
                    <button
                      key={wallet.info.uuid}
                      disabled={evmConnecting}
                      onClick={() => { void connectEVM(wallet).then(onClose); }}
                      className="w-full flex items-center gap-3 rounded-xl border border-border3/50 bg-white/[0.02] px-4 py-3.5 text-[14px] text-white/70 hover:text-white hover:border-accent/40 hover:bg-accent/[0.04] transition-all disabled:opacity-50"
                    >
                      {wallet.info.icon ? (
                        <img src={wallet.info.icon} alt={wallet.info.name} className="w-5 h-5 rounded" />
                      ) : (
                        <Wallet className="w-5 h-5 text-white/30" />
                      )}
                      <span className="font-medium">{wallet.info.name}</span>
                      <span className="ml-auto text-[11px] text-accent">Connect</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {!!evmError && tab === "evm" && (
              <p className="mt-4 text-[12px] text-red-400 text-center">{evmError}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
