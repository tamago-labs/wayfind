'use client';

import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { useBaseTokenPrices } from '../../../contexts/BaseTokenPriceProvider';
import { usePrices } from '../../../contexts/PriceContext';
import { BASE_TOKENS } from '@/lib/tokens/base-tokens';
import rwaList from '@/lib/data/rwa-v1-list.json';
import type { KnownToken } from '@/hooks/useKnownTokens';

// Symbol → logo map from RWA list (for simulated tokens without image in DB)
const rwaLogoMap = new Map<string, string | null>();
for (const asset of (rwaList as any).assets ?? []) {
  for (const token of asset.tokens ?? []) {
    if (token.symbol && !rwaLogoMap.has(token.symbol)) {
      rwaLogoMap.set(token.symbol, token.logo ?? asset.logo ?? null);
    }
  }
}

interface HoldingsListProps {
  balances: Record<string, string>;
  knownTokens: KnownToken[];
  loading: boolean;
  knownLoading: boolean;
  walletAddress: string | null;
  walletType?: 'solana' | 'evm' | null;
  showTrackTokens?: boolean;
  onTrackTokens?: () => void;
  isSimulated?: boolean;
  onAddSimulatedToken?: () => void;
  onRemoveSimulatedToken?: (symbol: string) => void;
}

export default function HoldingsList({
  balances,
  knownTokens,
  loading,
  knownLoading,
  walletAddress,
  walletType,
  showTrackTokens,
  onTrackTokens,
  isSimulated,
  onAddSimulatedToken,
  onRemoveSimulatedToken,
}: HoldingsListProps) {
  const router = useRouter();
  const { getPrice, getChange24h, loading: pricesLoading } = useBaseTokenPrices();
  const { prices: livePrices } = usePrices();
  const livePriceMap = new Map(livePrices.map((p) => [p.token_symbol, p]));

  // === Simulated portfolio view ===
  if (isSimulated) {
    const simTokens = knownTokens.filter((t: any) => t._simulated);
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold">Holdings</h3>
          {onAddSimulatedToken && (
            <button
              onClick={onAddSimulatedToken}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border3/50 text-white/60 hover:border-accent/40 hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Tokens
            </button>
          )}
        </div>
        <div className="space-y-2">
          {simTokens.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[13px] text-white/40 mb-1">No tokens in this portfolio</p>
              <p className="text-[11px] text-white/25">Click "Add Tokens" to simulate holdings</p>
            </div>
          ) : (
            simTokens.map((t: any) => {
              const baseToken = BASE_TOKENS.find((bt) => bt.symbol === t.symbol);
              const isBase = !!baseToken;
              const live = livePriceMap.get(t.symbol);
              const price = isBase ? getPrice(t.symbol) : (live?.price ?? 0);
              const change = isBase ? getChange24h(t.symbol) : (live?.percent_24h ?? 0);
              const amount = t.customValue ?? 0;
              const value = amount * price;
              const logo = isBase ? baseToken.logo : (t.image ?? rwaLogoMap.get(t.symbol) ?? null);
              const name = isBase ? baseToken.name : (t.name ?? t.symbol);

              return (
                <div
                  key={t.id ?? t.symbol}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  {logo ? (
                    <img src={logo} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-bold text-white/40">
                      {t.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-white/80">{t.symbol}</p>
                    <p className="text-[11px] text-white/40">
                      {amount > 0 && amount <= 1 ? amount.toFixed(6) : amount.toLocaleString()} {t.symbol}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[13px] font-medium text-white/80">
                      ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-white/40">
                      <span className={change >= 0 ? 'text-accent2' : 'text-warn2'}>
                        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                      </span>
                      {' · '}${price < 1 ? price.toFixed(6) : price.toFixed(2)}
                    </p>
                  </div>
                  {onRemoveSimulatedToken && (
                    <button
                      onClick={() => onRemoveSimulatedToken(t.symbol)}
                      className="p-1.5 rounded-md text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Remove token"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // === Connected wallet view ===
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold">Holdings</h3>
        {showTrackTokens && onTrackTokens && (
          <button
            onClick={onTrackTokens}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border3/50 text-white/60 hover:border-accent/40 hover:text-white transition-colors"
          >
            <Plus className="w-3 h-3" /> Track Tokens
          </button>
        )}
      </div>
      {holdings.length === 0 && knownTokens.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-[13px] text-white/40 mb-1">No holdings found</p>
          <p className="text-[11px] text-white/25">Connect your wallet to use your real portfolio or create a simulated portfolio</p>
        </div>
      ) : (
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
          const live = livePriceMap.get(t.symbol);
          const price = live?.price ?? t.price ?? 0;
          const change = live?.percent_24h ?? t.change ?? 0;
          const value = t.balance * price;
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
                ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-white/40">
                <span className={change >= 0 ? 'text-accent2' : 'text-warn2'}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
                {' · '}${price < 1 ? price.toFixed(6) : price.toFixed(2)}
              </p>
            </div>
          </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
