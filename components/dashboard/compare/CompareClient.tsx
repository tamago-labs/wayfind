"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRightLeft, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { usePrices } from "@/contexts/PriceContext";
import rwaList from "@/lib/data/rwa-v1-list.json";
import preIpoList from "@/lib/data/pre-ipo-list.json";
import kaminoData from "@/lib/data/kamino-apy-results.json";
import byrealData from "@/lib/data/byreal-pool-results.json";
import { formatNumber, formatPrice } from "@/lib/utils/format";

const dataClient = generateClient<Schema>();

interface TokenOption {
  symbol: string;
  name: string;
  slug: string;
  mint: string;
  type: "tokenized" | "pre-ipo";
  crypto_id?: string;
  issuer?: string;
  logo?: string;
  image?: string;
  industry?: string;
  website?: string;
  description?: string;
}

interface CompareData {
  token: TokenOption;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  change24h: number | null;
  supply: number | null;
  kaminoSupplyApy: number | null;
  kaminoBorrowApy: number | null;
  byrealApr: number | null;
  byrealTvl: number | null;
  markPrice: number | null;
  markValuation: number | null;
  impliedValuation: number | null;
  premium: number | null;
}

function buildTokenOptions(): TokenOption[] {
  const options: TokenOption[] = [];
  for (const asset of (rwaList as any).assets ?? []) {
    for (const token of asset.tokens ?? []) {
      if (token.mint && token.symbol) {
        options.push({
          symbol: token.symbol,
          name: token.name ?? asset.name,
          slug: asset.slug ?? "",
          mint: token.mint,
          type: "tokenized",
          crypto_id: token.crypto_id ? String(token.crypto_id) : undefined,
          issuer: token.issuer_name === "Backed Assets" ? "xStock" : "Ondo",
          logo: token.logo,
          industry: asset.industry,
          website: asset.website,
          description: token.description ?? asset.description,
        });
      }
    }
  }
  for (const asset of (preIpoList as any).assets ?? []) {
    if (asset.mint && asset.symbol) {
      options.push({
        symbol: asset.symbol,
        name: asset.name,
        slug: asset.slug ?? "",
        mint: asset.mint,
        type: "pre-ipo",
        issuer: "PreStocks",
        image: asset.image,
        industry: asset.industry,
        description: asset.description,
        website: asset.website,
      });
    }
  }
  return options;
}

function formatPercent(val: number | null, decimals = 2): string {
  if (val == null) return "—";
  return (val >= 0 ? "+" : "") + val.toFixed(decimals) + "%";
}

function ChangeBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-white/30">—</span>;
  if (value > 0) return <span className="text-accent2 inline-flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />{formatPercent(value)}</span>;
  if (value < 0) return <span className="text-warn2 inline-flex items-center gap-0.5"><TrendingDown className="w-3 h-3" />{formatPercent(value)}</span>;
  return <span className="text-white/30"><Minus className="w-3 h-3" /></span>;
}

function TokenSelector({ selected, onSelect, options, label }: {
  selected: TokenOption | null;
  onSelect: (t: TokenOption | null) => void;
  options: TokenOption[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return options.slice(0, 50);
    const q = search.toLowerCase();
    return options.filter((o) => o.symbol.toLowerCase().includes(q) || o.name.toLowerCase().includes(q)).slice(0, 50);
  }, [search, options]);

  return (
    <div className="relative">
      <p className="text-[11px] text-white/40 mb-1.5 uppercase tracking-wider">{label}</p>
      {selected ? (
        <div className="bg-surface border border-border3/50 rounded-xl p-3 flex items-center gap-3">
          {selected.logo || selected.image ? (
            <img src={selected.logo || selected.image} alt="" className="w-8 h-8 rounded-full bg-white/10" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/60">{selected.symbol.slice(0, 2)}</div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-white/90">{selected.symbol}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${selected.type === "tokenized" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}`}>
                {selected.type === "tokenized" ? "Tokenized" : "Pre-IPO"}
              </span>
            </div>
            <p className="text-[12px] text-white/50 truncate">{selected.name}</p>
          </div>
          <button onClick={() => onSelect(null)} className="p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04]"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="w-full bg-surface border border-border3/50 rounded-xl p-4 text-center text-[13px] text-white/40 hover:text-white/60 hover:border-accent/30 transition-colors">+ Select Token</button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-surface border border-border3/50 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-border3/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tokens..." className="w-full bg-white/[0.03] border border-border3/50 rounded-lg pl-10 pr-4 py-2 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-accent/50" />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-white/30">No tokens found</div>
              ) : (
                filtered.map((opt, i) => (
                  <motion.button
                    key={`${opt.symbol}-${opt.mint}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.1, delay: Math.min(i * 0.02, 0.3) }}
                    onClick={() => { onSelect(opt); setOpen(false); setSearch(""); }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors text-left"
                  >
                    {opt.logo || opt.image ? (
                      <img src={opt.logo || opt.image} alt="" className="w-7 h-7 rounded-full bg-white/10" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/60">{opt.symbol.slice(0, 2)}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-white/90">{opt.symbol}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${opt.type === "tokenized" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}`}>
                          {opt.type === "tokenized" ? "Tokenized" : "Pre-IPO"}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 truncate">{opt.name}</p>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TokenCard({ data, onNavigate }: { data: CompareData; onNavigate: () => void }) {
  return (
    <div className="bg-surface border border-border3/50 rounded-xl p-5 space-y-4">
      <div className="space-y-2">
        {data.token.description && (
          <p className="text-[12px] text-white/50 leading-relaxed line-clamp-3">{data.token.description.replace(/##?\s*/g, "").slice(0, 300)}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          {data.token.industry && (
            <p className="text-[11px] text-white/35 truncate flex-1">{data.token.industry}</p>
          )}
          {data.token.website && (
            <a href={data.token.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 shrink-0"><ExternalLink className="w-3 h-3" />Website</a>
          )}
        </div>
      </div>
      <div className="bg-white/[0.02] border border-border3/30 rounded-lg p-4">
        <p className="text-[11px] text-white/40 mb-1">Price</p>
        <p className="text-[20px] font-display font-bold text-white/90">{formatPrice(data.price)}</p>
        <div className="mt-1"><ChangeBadge value={data.change24h} /></div>
      </div>
      <div className="space-y-0">
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-border3/20"><div className="text-[12px] text-white/50">Market Cap</div><div className="text-[13px] text-white/80 text-right col-span-2">{formatNumber(data.marketCap, "$")}</div></div>
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-border3/20"><div className="text-[12px] text-white/50">24h Volume</div><div className="text-[13px] text-white/80 text-right col-span-2">{formatNumber(data.volume24h, "$")}</div></div>
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-border3/20"><div className="text-[12px] text-white/50">Supply</div><div className="text-[13px] text-white/80 text-right col-span-2">{formatNumber(data.supply)}</div></div>
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-border3/20"><div className="text-[12px] text-white/50">Mark Price</div><div className="text-[13px] text-white/80 text-right col-span-2">{formatPrice(data.markPrice)}</div></div>
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-border3/20"><div className="text-[12px] text-white/50">Implied Val.</div><div className="text-[13px] text-white/80 text-right col-span-2">{formatNumber(data.impliedValuation, "$")}</div></div>
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-border3/20"><div className="text-[12px] text-white/50">Premium</div><div className="text-[13px] text-white/80 text-right col-span-2">{data.premium != null ? `${data.premium >= 0 ? "+" : ""}${data.premium.toFixed(2)}%` : "—"}</div></div>
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-border3/20"><div className="text-[12px] text-white/50">Kamino Supply</div><div className="text-[13px] text-white/80 text-right col-span-2">{data.kaminoSupplyApy != null ? `${data.kaminoSupplyApy.toFixed(2)}%` : "—"}</div></div>
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-border3/20"><div className="text-[12px] text-white/50">Kamino Borrow</div><div className="text-[13px] text-white/80 text-right col-span-2">{data.kaminoBorrowApy != null ? `${data.kaminoBorrowApy.toFixed(2)}%` : "—"}</div></div>
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-border3/20"><div className="text-[12px] text-white/50">Byreal APR</div><div className="text-[13px] text-white/80 text-right col-span-2">{data.byrealApr != null ? `${data.byrealApr.toFixed(2)}%` : "—"}</div></div>
        <div className="grid grid-cols-3 gap-4 py-3"><div className="text-[12px] text-white/50">Byreal TVL</div><div className="text-[13px] text-white/80 text-right col-span-2">{formatNumber(data.byrealTvl, "$")}</div></div>
      </div>
      <button onClick={onNavigate} className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
        View Details <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function CompareClient() {
  const router = useRouter();
  const { prices } = usePrices();
  const options = useMemo(() => buildTokenOptions(), []);
  const [leftToken, setLeftToken] = useState<TokenOption | null>(null);
  const [rightToken, setRightToken] = useState<TokenOption | null>(null);
  const [preStocks, setPreStocks] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const priceMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of prices) {
      if (!map.has(p.token_symbol)) map.set(p.token_symbol, p);
    }
    return map;
  }, [prices]);

  useEffect(() => {
    let current = true;
    async function fetchPreStocks() {
      try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const { data } = await dataClient.models.PreStock.list({
          filter: { createdAt: { ge: oneDayAgo.toISOString() } },
          limit: 1000,
        });
        if (current) setPreStocks(data ?? []);
      } catch (err) {
        console.error("[Compare] PreStock fetch failed:", err);
      } finally {
        if (current) setDataLoading(false);
      }
    }
    fetchPreStocks();
    return () => { current = false; };
  }, []);

  const latestPreStockMap = useMemo(() => {
    const bySymbol = new Map<string, any[]>();
    for (const item of preStocks) {
      if (!item.symbol) continue;
      if (!bySymbol.has(item.symbol)) bySymbol.set(item.symbol, []);
      bySymbol.get(item.symbol)!.push(item);
    }
    const map = new Map<string, any>();
    bySymbol.forEach((items, sym) => {
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      map.set(sym, { first: items[0], latest: items[items.length - 1] });
    });
    return map;
  }, [preStocks]);

  const kaminoMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const item of (kaminoData as any).results ?? []) {
      if (item.symbol) map.set(item.symbol.toUpperCase(), item);
    }
    return map;
  }, []);

  const byrealMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of (byrealData as any).matches ?? []) {
      if (item.symbol) {
        const key = item.symbol.toUpperCase();
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
      }
    }
    return map;
  }, []);

  const getCompareData = (token: TokenOption): CompareData => {
    let price: number | null = null;
    let marketCap: number | null = null;
    let volume24h: number | null = null;
    let change24h: number | null = null;
    let supply: number | null = null;
    let markPrice: number | null = null;
    let markValuation: number | null = null;
    let impliedValuation: number | null = null;
    let premium: number | null = null;

    if (token.type === "tokenized") {
      const live = priceMap.get(token.symbol);
      if (live) {
        price = live.price ?? null;
        marketCap = live.market_cap ?? null;
        volume24h = live.volume_24h ?? null;
        change24h = live.percent_24h ?? null;
        supply = live.circulating_supply ?? live.total_supply ?? null;
      }
    } else {
      const psData = latestPreStockMap.get(token.symbol);
      if (psData) {
        const { first, latest } = psData;
        price = latest.tokenPrice ?? null;
        markPrice = latest.markPrice ?? null;
        markValuation = latest.markValuation ?? null;
        impliedValuation = latest.impliedValuation ?? null;
        supply = latest.supply ?? null;
        if (first?.markPrice > 0 && latest?.markPrice) {
          change24h = ((latest.markPrice - first.markPrice) / first.markPrice) * 100;
        }
        if (latest.markPrice > 0 && latest.tokenPrice) {
          premium = ((latest.tokenPrice - latest.markPrice) / latest.markPrice) * 100;
        }
      }
    }

    const kamino = kaminoMap.get(token.symbol.toUpperCase());
    const byrealPools = byrealMap.get(token.symbol.toUpperCase()) ?? [];
    const bestByreal = byrealPools.length > 0 ? byrealPools.reduce((a, b) => (b.apr24h > a.apr24h ? b : a)) : null;

    return {
      token, price, marketCap, volume24h, change24h, supply,
      kaminoSupplyApy: kamino ? parseFloat(kamino.market?.supplyApy ?? "0") * 100 : null,
      kaminoBorrowApy: kamino ? parseFloat(kamino.market?.borrowApy ?? "0") * 100 : null,
      byrealApr: bestByreal ? bestByreal.apr24h : null,
      byrealTvl: bestByreal ? bestByreal.tvl : null,
      markPrice, markValuation, impliedValuation, premium,
    };
  };

  const leftData = leftToken ? getCompareData(leftToken) : null;
  const rightData = rightToken ? getCompareData(rightToken) : null;

  if (dataLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[13px] text-white/40">Loading token data...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <TokenSelector selected={leftToken} onSelect={setLeftToken} options={options} label="Token A" />
        <TokenSelector selected={rightToken} onSelect={setRightToken} options={options} label="Token B" />
      </div>
      {leftData && rightData ? (
        <div className="grid grid-cols-2 gap-6">
          <TokenCard data={leftData} onNavigate={() => leftData.token.type === "tokenized" && leftData.token.crypto_id ? router.push(`/dashboard/token/${leftData.token.slug}/${leftData.token.crypto_id}`) : router.push(`/dashboard/pre-ipo/${leftData.token.slug}`)} />
          <TokenCard data={rightData} onNavigate={() => rightData.token.type === "tokenized" && rightData.token.crypto_id ? router.push(`/dashboard/token/${rightData.token.slug}/${rightData.token.crypto_id}`) : router.push(`/dashboard/pre-ipo/${rightData.token.slug}`)} />
        </div>
      ) : (
        <div className="bg-surface border border-border3/50 rounded-xl p-12 text-center">
          <ArrowRightLeft className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-[14px] text-white/40">Select two tokens to compare</p>
          <p className="text-[12px] text-white/25 mt-1">Choose tokenized stocks or pre-IPO tokens from either side</p>
        </div>
      )}
    </div>
  );
}
