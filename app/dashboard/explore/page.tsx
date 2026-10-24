"use client";

import { useState, useMemo } from "react";
import { usePrices } from "@/contexts/PriceContext";
import listData from "@/lib/data/rwa-v1-list.json";
import { ExploreBar, ExploreTable, usePageSize } from "@/components/explore";
import type { TokenRow, SortKey, SortDir } from "@/components/explore";

export default function Explore() {
  const { prices } = usePrices();
  const [search, setSearch] = useState("");
  const [chainFilter, setChainFilter] = useState<"solana" | "ethereum" | "bnb" | "arbitrum" | "all">("solana");
  const [sortKey, setSortKey] = useState<SortKey>("volume_24h");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const pageSize = usePageSize();

  const priceMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of prices) {
      if (!map.has(p.token_symbol)) {
        map.set(p.token_symbol, p);
      }
    }
    return map;
  }, [prices]);

  const rows: TokenRow[] = useMemo(() => {
    const result: TokenRow[] = [];
    for (const asset of (listData as any).assets) {
      for (const token of asset.tokens ?? []) {
        if (chainFilter === "solana" && !token.addresses?.solana) continue;
        if (chainFilter === "ethereum" && !token.addresses?.ethereum) continue;
        if (chainFilter === "bnb" && !token.addresses?.bnb) continue;
        if (chainFilter === "arbitrum" && !token.addresses?.arbitrum) continue;
        const price = priceMap.get(token.symbol);
        result.push({
          token_symbol: token.symbol,
          stock_symbol: asset.symbol,
          name: asset.name,
          slug: asset.slug,
          crypto_id: token.crypto_id,
          issuer: token.issuer_name,
          logo: token.logo ?? null,
          industry: asset.industry ?? null,
          price: price?.price ?? null,
          percent_24h: price?.percent_24h ?? null,
          percent_7d: price?.percent_7d ?? null,
          percent_30d: price?.percent_30d ?? null,
          market_cap: price?.market_cap ?? null,
          volume_24h: price?.volume_24h ?? null,
        });
      }
    }
    return result;
  }, [priceMap, chainFilter]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.token_symbol?.toLowerCase().includes(q) ||
        r.stock_symbol?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.issuer?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <ExploreBar
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        chainFilter={chainFilter}
        onChainFilter={(v) => { setChainFilter(v); setPage(1); }}
      />
      <ExploreTable
        rows={paginated}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        page={page}
        totalPages={totalPages}
        totalCount={sorted.length}
        onPageChange={setPage}
      />
    </div>
  );
}
