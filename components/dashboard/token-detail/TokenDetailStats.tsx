"use client";

import type { Token } from "@/lib/types/token";
import type { PriceData } from "@/contexts/PriceContext";
import { usePrices } from "@/contexts/PriceContext";
import { formatNumber } from "@/lib/utils/format";
import StatCard from "../StatCard";

export default function TokenDetailStats({ token, price, asset }: { token: Token; price: PriceData | undefined; asset: any }) {
  const { getStockPrice } = usePrices();
  const hasSolana = !!token.addresses?.solana;
  const stockPrice = asset.symbol ? getStockPrice(asset.symbol) : null;
  const tokenPrice = price?.price ?? null;

  if (hasSolana) {
    const premium = tokenPrice && stockPrice ? ((tokenPrice - stockPrice) / stockPrice) * 100 : null;
    return (
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={`${token.symbol} Price`} value={formatNumber(tokenPrice, "$")} />
        <StatCard label={`${asset.symbol} Price`} value={formatNumber(stockPrice, "$")} />
        <StatCard
          label="Premium"
          value={premium !== null ? `${premium >= 0 ? "+" : ""}${premium.toFixed(2)}%` : "—"}
          valueColor={premium !== null ? (premium >= 0 ? "text-red-400" : "text-emerald-400") : undefined}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Issuer" value={token.issuer_name ?? "—"} />
      <StatCard label="Market Cap" value={formatNumber(price?.market_cap ?? null, "$")} />
      <StatCard label="Volume (24h)" value={formatNumber(price?.volume_24h ?? null, "$")} />
    </div>
  );
}