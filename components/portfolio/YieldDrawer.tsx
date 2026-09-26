"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp } from "lucide-react";

interface YieldStrategy {
  token: string;
  action: string;
  reason: string;
  platform: string;
  apy: number;
}

interface YieldDrawerProps {
  open: boolean;
  onClose: () => void;
  strategies: YieldStrategy[] | null;
}

export default function YieldDrawer({ open, onClose, strategies }: YieldDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-surface border-l border-border3/50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-[18px] font-display font-bold text-white/90">Yield & DeFi Opportunities</h2>
                  <p className="text-[12px] text-white/40 mt-0.5">Earn yield or borrow to accumulate</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {strategies && strategies.length > 0 ? (
                <div className="space-y-4">
                  {strategies.map((s, i) => (
                    <div key={i} className="bg-white/[0.03] border border-border3/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-accent" />
                          <span className="text-[14px] font-semibold text-white/90">{s.token}</span>
                        </div>
                        <span className={`text-[11px] font-medium uppercase px-2 py-0.5 rounded-full ${
                          s.action === "earn"
                            ? "bg-accent2/10 text-accent2"
                            : "bg-blue-400/10 text-blue-400"
                        }`}>
                          {s.action === "earn" ? "Earn" : "Borrow"}
                        </span>
                      </div>
                      <p className="text-[12px] text-white/60 leading-relaxed mb-3">{s.reason}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/40">{s.platform}</span>
                        <span className="text-[14px] font-display font-bold text-accent2">{s.apy.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/[0.03] border border-border3/50 rounded-xl p-4">
                  <p className="text-[12px] text-white/50">
                    No yield opportunities available. Run a risk evaluation first.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
