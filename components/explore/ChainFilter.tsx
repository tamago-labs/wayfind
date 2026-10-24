"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CHAIN_LOGOS } from "@/components/dashboard/Topbar";

interface ChainFilterProps {
  value: "solana" | "ethereum" | "bnb" | "arbitrum" | "all";
  onChange: (value: "solana" | "ethereum" | "bnb" | "arbitrum" | "all") => void;
}

const options = [
  { value: "solana" as const, label: "Solana", logo: CHAIN_LOGOS[5426] },
  { value: "bnb" as const, label: "BNB", logo: CHAIN_LOGOS[1839] },
  { value: "ethereum" as const, label: "Ethereum", logo: CHAIN_LOGOS[1027] },
  { value: "arbitrum" as const, label: "Arbitrum", logo: CHAIN_LOGOS[11841] },
  { value: "all" as const, label: "All Chains", logo: null },
];

function ChainLogo({ logo, label }: { logo: string | null; label: string }) {
  if (logo) {
    return <img src={logo} alt={label} className="w-4 h-4 rounded-full" />;
  }
  return <span className="w-4 h-4 flex items-center justify-center text-[10px]">🌐</span>;
}

export default function ChainFilter({ value, onChange }: ChainFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find((o) => o.value === value)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-surface border border-border3 rounded-lg px-3 py-2.5 text-[13px] text-white/60 hover:border-accent/50 transition-colors cursor-pointer min-w-[120px]"
      >
        <ChainLogo logo={selected.logo} label={selected.label} />
        <span>{selected.label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3 h-3" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 bg-surface border border-border3 rounded-lg overflow-hidden z-50 min-w-[140px]"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-[13px] transition-colors ${
                  value === opt.value
                    ? "bg-accent/10 text-accent"
                    : "text-white/50 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <ChainLogo logo={opt.logo} label={opt.label} />
                <span>{opt.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
