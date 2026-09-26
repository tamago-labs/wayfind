"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDisconnect } from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { Copy, Check, LogOut } from "lucide-react";
import type { AppClient } from "../SolanaWalletProvider";

const popover = {
  hidden: { opacity: 0, scale: 0.95, y: -8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, damping: 25, stiffness: 350 } },
  exit: { opacity: 0, scale: 0.95, y: -8 },
};

export function ConnectedPopover({ address }: { address: string }) {
  const client = useClient<AppClient>();
  const disconnect = useDisconnect(client);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [address]);

  return (
    <motion.div
      variants={popover}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-border3/50 bg-surface shadow-2xl overflow-hidden z-20"
    >
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-between px-4 py-3 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors"
      >
        <span>Copy address</span>
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-green-400">
              <Check className="w-3.5 h-3.5" />
            </motion.div>
          ) : (
            <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Copy className="w-3.5 h-3.5 text-white/25" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <button
        onClick={() => void disconnect.dispatch()}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-red-400 hover:bg-red-500/5 transition-colors border-t border-border3/30"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Disconnect</span>
      </button>
    </motion.div>
  );
}
