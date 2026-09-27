'use client';

import { useBaseTokenPrices } from '../../../contexts/BaseTokenPriceProvider';
import { usePrices } from '../../../contexts/PriceContext';
import { BASE_TOKENS } from '@/lib/tokens/base-tokens';

interface PortfolioStatsProps {
  balances: Record<string, string>;
  knownTokens: any[];
  loading: boolean;
  knownLoading: boolean;
  walletAddress: string | null;
  walletType: 'solana' | 'evm' | null;
}

export default function PortfolioStats({ balances, knownTokens, loading, knownLoading, walletAddress, walletType }: PortfolioStatsProps) {
  const { getPrice, getChange24h } = useBaseTokenPrices();
  const { prices: livePrices } = usePrices();
  const livePriceMap = new Map(livePrices.map((p) => [p.token_symbol, p]));

  if (loading || knownLoading) {
    return (
      <div className="w-72 shrink-0 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col gap-4">
        <div>
          <p className="text-[12px] text-white/40 mb-1">Portfolio Value</p>
          <div className="h-6 w-24 bg-white/[0.05] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const baseValue = BASE_TOKENS.reduce((sum, token) => {
    const balance = parseFloat(balances[token.symbol] ?? '0');
    return sum + balance * getPrice(token.symbol);
  }, 0);

  const knownValue = knownTokens.reduce((sum, t) => {
    const live = livePriceMap.get(t.symbol);
    const price = live?.price ?? t.price ?? 0;
    return sum + t.balance * price;
  }, 0);
  const totalValue = baseValue + knownValue;

  const baseChange = BASE_TOKENS.reduce((sum, token) => {
    const balance = parseFloat(balances[token.symbol] ?? '0');
    return sum + balance * getChange24h(token.symbol);
  }, 0);

  const knownChange = knownTokens.reduce((sum, t) => {
    const live = livePriceMap.get(t.symbol);
    const price = live?.price ?? t.price ?? 0;
    const change = live?.percent_24h ?? t.change ?? 0;
    return sum + t.balance * price * change / 100;
  }, 0);
  const portfolioChange = totalValue > 0 ? (baseChange + knownChange) / totalValue * 100 : 0;

  const industryMap = new Map<string, number>();
  for (const t of knownTokens) {
    const live = livePriceMap.get(t.symbol);
    const price = live?.price ?? t.price ?? 0;
    const value = t.balance * price;
    if (value > 0 && t.industry) {
      const current = industryMap.get(t.industry) ?? 0;
      industryMap.set(t.industry, current + value);
    }
  }
  const knownTokensTotalValue = knownTokens.reduce((sum, t) => {
    const live = livePriceMap.get(t.symbol);
    const price = live?.price ?? t.price ?? 0;
    return sum + t.balance * price;
  }, 0);
  const industries = Array.from(industryMap.entries())
    .map(([name, value]) => ({ name, pct: knownTokensTotalValue > 0 ? Math.round((value / knownTokensTotalValue) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  return (
    <div className="w-72 shrink-0 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col gap-4">
      <div>
        <p className="text-[12px] text-white/40 mb-1">Portfolio Value</p>
        <p className="text-[24px] font-display font-bold">
          ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p className={`text-[13px] mt-1 ${portfolioChange >= 0 ? 'text-accent2' : 'text-warn2'}`}>
          {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}% today
        </p>
      </div>
      {industries.length > 0 && (
        <div className="mt-auto">
          <p className="text-[12px] text-white/40 mb-3">Underlying Exposure</p>
          <div className="space-y-3">
            {industries.map((ind) => (
              <div key={ind.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-white/60 truncate max-w-[160px]" title={ind.name}>{ind.name}</span>
                  <span className="text-[12px] font-medium text-white/80 shrink-0 ml-2">{ind.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${ind.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
