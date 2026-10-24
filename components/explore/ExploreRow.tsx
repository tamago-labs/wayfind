"use client";

import { useRouter } from "next/navigation";
import { TokenRow } from "./types";

interface ExploreRowProps {
  row: TokenRow;
}

export default function ExploreRow({ row }: ExploreRowProps) {
  const router = useRouter();

  return (
    <tr
      className="border-b border-border3/20 hover:bg-white/[0.02] transition-colors cursor-pointer"
      onClick={() => router.push(`/dashboard/token/${row.slug}/${row.crypto_id}`)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          {row.logo ? (
            <img src={row.logo} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white/40">
              {row.token_symbol.slice(0, 2)}
            </div>
          )}
          <span className="font-mono font-semibold text-white/90">{row.token_symbol}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-white/60 cursor-default" title={row.name}>{row.stock_symbol}</td>
      <td className="px-4 py-3">
        <span className="text-[12px] text-white/50 font-medium">{row.issuer}</span>
      </td>
      <td className="px-4 py-3 text-right text-white/70">
        {row.price != null ? `$${row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
      </td>
      <td className={`px-4 py-3 text-right font-medium ${
        row.percent_24h != null
          ? row.percent_24h >= 0 ? "text-emerald-400" : "text-red-400"
          : "text-white/30"
      }`}>
        {row.percent_24h != null ? `${row.percent_24h >= 0 ? "+" : ""}${row.percent_24h.toFixed(2)}%` : "—"}
      </td>
      <td className={`px-4 py-3 text-right font-medium ${
        row.percent_7d != null
          ? row.percent_7d >= 0 ? "text-emerald-400" : "text-red-400"
          : "text-white/30"
      }`}>
        {row.percent_7d != null ? `${row.percent_7d >= 0 ? "+" : ""}${row.percent_7d.toFixed(2)}%` : "—"}
      </td>
      <td className={`px-4 py-3 text-right font-medium ${
        row.percent_30d != null
          ? row.percent_30d >= 0 ? "text-emerald-400" : "text-red-400"
          : "text-white/30"
      }`}>
        {row.percent_30d != null ? `${row.percent_30d >= 0 ? "+" : ""}${row.percent_30d.toFixed(2)}%` : "—"}
      </td>
      <td className="px-4 py-3 text-right text-white/40">
        {row.market_cap != null ? `$${row.market_cap.toLocaleString()}` : "—"}
      </td>
      <td className="px-4 py-3 text-right text-white/40">
        {row.volume_24h != null ? `$${row.volume_24h.toLocaleString()}` : "—"}
      </td>
    </tr>
  );
}
