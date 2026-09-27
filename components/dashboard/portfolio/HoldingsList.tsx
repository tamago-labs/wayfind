'use client';

import { useRouter } from 'next/navigation';
import { useBaseTokenPrices } from '../../../contexts/BaseTokenPriceProvider';
import { BASE_TOKENS } from '@/lib/tokens/base-tokens';
import type { KnownToken } from '@/hooks/useKnownTokens';

interface HoldingsListProps {
  balances: Record<string, string>;
  knownTokens: KnownToken[];
  loading: boolean;
  knownLoading: boolean;
  walletAddress: string | null;
  walletType?: 'solana' | 'evm' | null;
}

export default function HoldingsList({ balances, knownTokens, loading, knownLoading, walletAddress, walletType }: HoldingsListProps) {
  const router = useRouter();
  const { getPrice, getChange24h, loading: pricesLoading } = useBaseTokenPrices();

  const holdings = BASE_TOKENS
    .map((token) => {
      const balance = parseFloat(balances[token.symbol] ?? '0');
      const price = getPrice(token.symbol);
      return {
        symbol: token.symbol,
        name: token.name,
        logo: token.logo,
        balance,
        value: balance * price,
        price,
        change: getChange24h(token.symbol),
      };
    })
    .filter((h) => walletAddress === null || h.balance > 0);

  if (loading || pricesLoading) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <h3 className="text-[14px] font-semibold mb-4">Holdings</h3>
        <div className="space-y-2">
          {BASE_TOKENS.map((token) => (
            <div key={token.symbol} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-white/[0.05] animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-24 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-2 w-16 bg-white/[0.05] rounded animate-pulse" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-3 w-20 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-2 w-14 bg-white/[0.05] rounded animate-pulse ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <h3 className="text-[14px] font-semibold mb-4">Holdings</h3>
      <div className="space-y-2">
        {holdings.map((h) => {
          const token = BASE_TOKENS.find((t) => t.symbol === h.symbol);
          if (!token) return null;
          return (
            <div
              key={h.symbol}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
            >
              <img src={token.logo} alt={token.name} className="w-8 h-8 rounded-full" />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white/80">{token.name}</p>
                <p className="text-[11px] text-white/40">
                  {h.balance > 0 && h.balance <= 1 ? h.balance.toFixed(6) : h.balance.toLocaleString()} {token.symbol}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[13px] font-medium text-white/80">
                  ${h.value.toLocaleString()}
                </p>
                <p className="text-[11px] text-white/40">
                  <span className={h.change >= 0 ? 'text-accent2' : 'text-warn2'}>
                    {h.change >= 0 ? '+' : ''}{h.change.toFixed(1)}%
                  </span>
                  {' · '}${h.price < 1 ? h.price.toFixed(6) : h.price.toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}

        {knownTokens.map((t) => {
          const href = t.type === 'pre-ipo'
            ? `/dashboard/pre-ipo/${t.slug}`
            : `/dashboard/token/${t.slug}/${t.crypto_id}`;
          return (
          <div
            key={t.mint}
            onClick={() => router.push(href)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            {t.image ? (
              <img src={t.image} alt={t.symbol} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-bold text-white/40">
                {t.symbol.slice(0, 2)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-white/80">{t.symbol}</p>
              <p className="text-[11px] text-white/40">
                {t.balance > 0 && t.balance <= 1 ? t.balance.toFixed(6) : t.balance.toLocaleString()} {t.symbol}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[13px] font-medium text-white/80">
                ${t.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-white/40">
                <span className={t.change >= 0 ? 'text-accent2' : 'text-warn2'}>
                  {t.change >= 0 ? '+' : ''}{t.change.toFixed(1)}%
                </span>
                {' · '}${t.price < 1 ? t.price.toFixed(6) : t.price.toFixed(2)}
              </p>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
