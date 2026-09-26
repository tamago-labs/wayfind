'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import type { Schema } from '@/amplify/data/resource';
import type { AppClient } from '@/components/SolanaWalletProvider';
import PreIpoPriceChart from './PreIpoPriceChart';
import PreIpoAbout from './PreIpoAbout';
import PreIpoStats from './PreIpoStats';
import PreIpoInfo from './PreIpoInfo';
import PreIpoLinks from './PreIpoLinks';
import PreIpoSwapPanel from './PreIpoSwapPanel';

const dataClient = generateClient<Schema>();

interface Asset {
  symbol: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  website: string;
  industry: string;
  founded: number;
  employees: string;
  mint: string;
}

interface Snapshot {
  tokenPrice: number;
  markPrice: number;
  markValuation: number;
  impliedValuation: number;
  supply: number;
  createdAt?: string;
}

export default function PreIpoDetailClient({ asset }: { asset: Asset }) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);

  useEffect(() => {
    dataClient.models.PreStock.list({
      filter: { symbol: { eq: asset.symbol } },
      limit: 1000,
    }).then((res) => {
      const sorted = (res.data ?? [])
        .sort((a, b) => new Date(a.createdAt ?? '').getTime() - new Date(b.createdAt ?? '').getTime())
        .map((s) => ({
          tokenPrice: s.tokenPrice ?? 0,
          markPrice: s.markPrice ?? 0,
          markValuation: s.markValuation ?? 0,
          impliedValuation: s.impliedValuation ?? 0,
          supply: s.supply ?? 0,
          createdAt: s.createdAt,
        }));
      setSnapshots(sorted);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [asset.symbol]);

  const latest = snapshots[snapshots.length - 1];
  const first = snapshots[0];

  const tokenPrice = latest?.tokenPrice ?? 0;
  const markPrice = latest?.markPrice ?? 0;
  const premium = markPrice > 0 ? ((tokenPrice - markPrice) / markPrice) * 100 : 0;
  const change24h = first && latest && first.markPrice > 0
    ? ((latest.markPrice - first.markPrice) / first.markPrice) * 100
    : 0;

  const chartData = snapshots.map((s) => ({
    time: s.createdAt ?? '',
    tokenPrice: s.tokenPrice,
    markPrice: s.markPrice,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {asset.image ? (
          <img src={asset.image} alt={asset.name} className="w-14 h-14 rounded-2xl" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-lg font-bold text-white/40">
            {asset.symbol.slice(0, 2)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-white/95">{asset.name} ({asset.symbol})</h1>
          </div>
          <p className="text-sm text-white/40 mt-1">
            {asset.website && (
              <a href={asset.website} target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
                {asset.website}
              </a>
            )}
            {asset.industry && <span className="text-white/30"> · {asset.industry}</span>}
            {asset.employees && <span className="text-white/30"> · {asset.employees} employees</span>}
          </p>
        </div>
      </div>

      {/* Stats + Trade (left) | Chart + About + Info (right) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-2 space-y-6">
          <PreIpoStats tokenPrice={tokenPrice} markPrice={markPrice} change24h={change24h} />

          <PreIpoSwapPanel
            mint={asset.mint}
            symbol={asset.symbol}
            image={asset.image}
            name={asset.name}
            walletAccount={connected?.account ?? null}
          />

          <PreIpoInfo
            industry={asset.industry}
            employees={asset.employees}
            website={asset.website}
            mint={asset.mint}
            tokenPrice={tokenPrice}
            markPrice={markPrice}
            premium={premium}
            markValuation={latest?.markValuation ?? 0}
            impliedValuation={latest?.impliedValuation ?? 0}
            supply={latest?.supply ?? 0}
            assetSymbol={asset.symbol}
          />
        </div>

        {/* Chart + About (right) */}
        <div className="md:col-span-3 space-y-6">
          <PreIpoPriceChart data={chartData} />
          <PreIpoAbout name={asset.name} description={asset.description} />
          <PreIpoLinks />
        </div>
      </div>
    </div>
  );
}
