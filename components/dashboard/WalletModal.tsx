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

const backdrop = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

const modal = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

export function WalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const client = useClient<AppClient>();
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);
  const status = useWalletStatus(client);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const address = connected ? String(connected.account.address) : null;
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

            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold">Connect Wallet</h3>
              <p className="text-[13px] text-white/40 mt-1">Choose a wallet to connect to Zivic</p>
            </div>

            {connected ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-border3/50 bg-white/[0.02] p-4">
                  <p className="text-[11px] uppercase tracking-wider text-white/30 mb-1">Connected</p>
                  <p className="font-mono text-[14px] text-white/80">{truncate(address!)}</p>
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
                    <p className="text-[12px] text-white/25 mt-1">Install Phantom or another Solana wallet to continue.</p>
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

            {!!connect.error && (
              <p className="mt-4 text-[12px] text-red-400 text-center">
                {connect.error instanceof Error ? connect.error.message : String(connect.error)}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
