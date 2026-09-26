'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import preIpoData from '@/lib/data/pre-ipo-list.json';

const client = generateClient<Schema>();

interface Snapshot {
  symbol: string;
  markPrice: number;
  tokenPrice: number;
  markValuation: number;
  impliedValuation: number;
  supply: number;
  createdAt?: string;
}

interface MarketData {
  symbol: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  tokenPrice: number;
  markPrice: number;
  premium: number;
  markValuation: number;
  impliedValuation: number;
  supply: number;
  change24h: number;
}

export default function PreIpoList() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const { data } = await client.models.PreStock.list({
          filter: { createdAt: { ge: oneDayAgo.toISOString() } },
          limit: 1000,
        });

        const snapshotsBySymbol: Record<string, Snapshot[]> = {};
        for (const s of data) {
          if (!snapshotsBySymbol[s.symbol]) snapshotsBySymbol[s.symbol] = [];
          snapshotsBySymbol[s.symbol].push({
            symbol: s.symbol,
            markPrice: s.markPrice ?? 0,
            tokenPrice: s.tokenPrice ?? 0,
            markValuation: s.markValuation ?? 0,
            impliedValuation: s.impliedValuation ?? 0,
            supply: s.supply ?? 0,
          });
        }

        const marketData: MarketData[] = preIpoData.assets.map((asset) => {
          const snapshots = snapshotsBySymbol[asset.symbol] ?? [];
          const sorted = [...snapshots].sort(
            (a, b) => new Date(a.createdAt ?? '').getTime() - new Date(b.createdAt ?? '').getTime()
          );
          const first = sorted[0];
          const latest = sorted[sorted.length - 1];

          const change24h = first && latest && first.markPrice > 0
            ? ((latest.markPrice - first.markPrice) / first.markPrice) * 100
            : 0;

          const premium = latest && latest.markPrice > 0
            ? ((latest.tokenPrice - latest.markPrice) / latest.markPrice) * 100
            : 0;

          return {
            symbol: asset.symbol,
            name: asset.name,
            slug: asset.slug,
            image: asset.image,
            description: asset.description,
            tokenPrice: latest?.tokenPrice ?? 0,
            markPrice: latest?.markPrice ?? 0,
            premium,
            markValuation: latest?.markValuation ?? 0,
            impliedValuation: latest?.impliedValuation ?? 0,
            supply: latest?.supply ?? 0,
            change24h,
          };
        });

        setMarkets(marketData.sort((a, b) => b.impliedValuation - a.impliedValuation));
      } catch (err) {
        console.error('[PreIpoList] fetch error:', err);
        setMarkets(preIpoData.assets.map((a) => ({
          symbol: a.symbol,
          name: a.name,
          slug: a.slug,
          image: a.image,
          description: a.description,
          tokenPrice: 0,
          markPrice: 0,
          premium: 0,
          markValuation: 0,
          impliedValuation: 0,
          supply: 0,
          change24h: 0,
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshots();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map((market) => (
        <Link
          key={market.symbol}
          href={`/dashboard/pre-ipo/${market.slug}`}
          className="group bg-surface border border-border3/50 rounded-xl p-5 hover:border-accent/30 transition-all block"
        >
          <div className="flex items-start gap-3 mb-4">
            <img
              src={market.image}
              alt={market.name}
              className="w-10 h-10 rounded-lg object-contain bg-white/5 p-1"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-white/90 truncate">
                {market.name}
              </h3>
              <p className="text-[12px] text-white/40">{market.symbol}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-white/30 uppercase tracking-wider">Token Price</span>
              <span className="text-[18px] font-semibold text-white/90">
                {market.tokenPrice > 0 ? `$${market.tokenPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-white/30 uppercase tracking-wider">Premium</span>
              <span className={`text-[13px] font-medium ${market.premium >= 0 ? 'text-warn2' : 'text-accent2'}`}>
                {market.premium >= 0 ? '+' : ''}{market.premium.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-white/30 uppercase tracking-wider">24h Change</span>
              <span className={`text-[13px] font-medium ${market.change24h >= 0 ? 'text-accent2' : 'text-warn2'}`}>
                {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-white/30 uppercase tracking-wider">Implied Valuation</span>
              <span className="text-[13px] text-white/60">
                {market.impliedValuation > 0
                  ? market.impliedValuation >= 1e12
                    ? `$${(market.impliedValuation / 1e12).toFixed(2)}T`
                    : `$${(market.impliedValuation / 1e9).toFixed(2)}B`
                  : '—'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border3/30">
            <a
              href={`https://prestocks.com/${market.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
            >
              Trade
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </Link>
      ))}
    </div>
  );
}
