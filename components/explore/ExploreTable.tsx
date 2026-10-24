"use client";

import { ChevronUp, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { TokenRow, SortKey, SortDir } from "./types";
import ExploreRow from "./ExploreRow";

interface ExploreTableProps {
  rows: TokenRow[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return <ChevronUp className="w-3 h-3 text-white/10" />;
  return sortDir === "asc" ? (
    <ChevronUp className="w-3 h-3 text-accent" />
  ) : (
    <ChevronDown className="w-3 h-3 text-accent" />
  );
}

export default function ExploreTable({ rows, sortKey, sortDir, onSort, page, totalPages, totalCount, onPageChange }: ExploreTableProps) {
  return (
    <div className="bg-surface border border-border3/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border3/50 text-[11px] text-white/30 font-medium uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-medium normal-case">
                <button onClick={() => onSort("token_symbol")} className="flex items-center gap-1 hover:text-white/50 transition-colors">
                  Token <SortIcon column="token_symbol" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium normal-case">
                <button onClick={() => onSort("stock_symbol")} className="flex items-center gap-1 hover:text-white/50 transition-colors">
                  Ticker <SortIcon column="stock_symbol" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium">
                <button onClick={() => onSort("issuer")} className="flex items-center gap-1 hover:text-white/50 transition-colors">
                  Issuer <SortIcon column="issuer" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="text-right px-4 py-3 font-medium">
                <button onClick={() => onSort("price")} className="flex items-center gap-1 justify-end w-full hover:text-white/50 transition-colors">
                  Price <SortIcon column="price" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="text-right px-4 py-3 font-medium">
                <button onClick={() => onSort("percent_24h")} className="flex items-center gap-1 justify-end w-full hover:text-white/50 transition-colors">
                  24h% <SortIcon column="percent_24h" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="text-right px-4 py-3 font-medium">
                <button onClick={() => onSort("percent_7d")} className="flex items-center gap-1 justify-end w-full hover:text-white/50 transition-colors">
                  7d% <SortIcon column="percent_7d" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="text-right px-4 py-3 font-medium">
                <button onClick={() => onSort("percent_30d")} className="flex items-center gap-1 justify-end w-full hover:text-white/50 transition-colors">
                  30d% <SortIcon column="percent_30d" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="text-right px-4 py-3 font-medium">
                <button onClick={() => onSort("market_cap")} className="flex items-center gap-1 justify-end w-full hover:text-white/50 transition-colors">
                  MCap <SortIcon column="market_cap" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              <th className="text-right px-4 py-3 font-medium">
                <button onClick={() => onSort("volume_24h")} className="flex items-center gap-1 justify-end w-full hover:text-white/50 transition-colors">
                  Volume <SortIcon column="volume_24h" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <ExploreRow key={row.crypto_id} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border3/50">
          <p className="text-[12px] text-white/30">
            Page {page} of {totalPages} ({totalCount} tokens)
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.03] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.03] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[12px] text-white/50 px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.03] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages}
              className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.03] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
