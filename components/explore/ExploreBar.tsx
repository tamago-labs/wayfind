"use client";

import { Search } from "lucide-react";
import ChainFilter from "./ChainFilter";
import DataTypeFilter from "./DataTypeFilter";

interface ExploreBarProps {
  search: string;
  onSearch: (value: string) => void;
  chainFilter: "solana" | "ethereum" | "bnb" | "arbitrum" | "all";
  onChainFilter: (value: "solana" | "ethereum" | "bnb" | "arbitrum" | "all") => void;
}

export default function ExploreBar({ search, onSearch, chainFilter, onChainFilter }: ExploreBarProps) {
  return (
    <div className="flex items-center gap-4">
      <DataTypeFilter />
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, ticker, or issuer…"
          className="w-full bg-surface border border-border3 rounded-lg pl-10 pr-4 py-2.5 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-accent/50 transition-colors"
        />
      </div>
      <ChainFilter value={chainFilter} onChange={onChainFilter} />
    </div>
  );
}
