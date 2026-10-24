"use client";

import { useState, useRef, useEffect } from "react";
import { BarChart3, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const dataTypes = [
  { value: "tokenized-stocks" as const, label: "Tokenized Stocks" },
];

export default function DataTypeFilter() {
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

  const selected = dataTypes[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-surface border border-border3 rounded-lg px-3 py-2.5 text-[13px] text-white/60 hover:border-accent/50 transition-colors cursor-pointer"
      > 
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
            className="absolute left-0 top-full mt-1 bg-surface border border-border3 rounded-lg overflow-hidden z-50 min-w-[160px]"
          >
            {dataTypes.map((dt) => (
              <button
                key={dt.value}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-white/50 hover:text-white hover:bg-white/[0.03] transition-colors"
              > 
                <span>{dt.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
