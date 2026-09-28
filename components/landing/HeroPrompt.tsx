'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, X } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { usePrices } from '@/contexts/PriceContext';
import { BASE_TOKENS } from '@/lib/tokens/base-tokens';
import rwaList from '@/lib/data/rwa-v1-list.json';

const dataClient = generateClient<Schema>();

const DEMO_PORTFOLIO_IDS = [
  '4e9cfacb-6e19-4da7-b9e7-f539ac7625de',
  '450ab724-c36f-40e7-9968-fcff4987cc4d',
];

interface DemoToken {
  symbol: string;
  name: string;
  amount: number;
  logo: string | null;
  price: number | null;
}

interface DemoPortfolio {
  id: string;
  name: string;
  userProfileId: string;
  tokens: DemoToken[];
}

// Symbol → logo/price lookup from RWA list + base tokens fallback
const rwaTokenMap = new Map<string, { logo: string | null; price: number | null; name: string }>();
for (const asset of (rwaList as any).assets ?? []) {
  for (const token of asset.tokens ?? []) {
    if (token.symbol && !rwaTokenMap.has(token.symbol)) {
      rwaTokenMap.set(token.symbol, {
        logo: token.logo ?? null,
        price: token.price ?? null,
        name: token.name,
      });
    }
  }
}
for (const bt of BASE_TOKENS) {
  if (!rwaTokenMap.has(bt.symbol)) {
    rwaTokenMap.set(bt.symbol, {
      logo: bt.logo,
      price: null,
      name: bt.name,
    });
  }
}

export default function HeroPrompt() {
  const router = useRouter();
  const { prices, loading: pricesLoading } = usePrices();
  const [inputValue, setInputValue] = useState('What are the hidden risks in my portfolio?');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [demoPortfolios, setDemoPortfolios] = useState<DemoPortfolio[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [attached, setAttached] = useState<DemoPortfolio | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const loadDemoPortfolios = useCallback(async () => {
    if (demoPortfolios.length > 0 || loadingDemo) return;
    setLoadingDemo(true);
    try {
      const results: DemoPortfolio[] = [];
      for (const id of DEMO_PORTFOLIO_IDS) {
        const { data: portfolio } = await dataClient.models.Portfolio.get({ id });
        if (!portfolio) continue;
        const { data: tokens } = await dataClient.models.PortfolioToken.list({
          filter: { portfolioId: { eq: id } },
        });
        results.push({
          id,
          name: portfolio.name,
          userProfileId: portfolio.userProfileId,
          tokens: (tokens ?? []).map((t) => {
            const meta = rwaTokenMap.get(t.symbol);
            const live = prices.find((p) => p.token_symbol === t.symbol);
            return {
              symbol: t.symbol,
              name: t.name ?? meta?.name ?? t.symbol,
              amount: t.customValue ?? 0,
              logo: meta?.logo ?? null,
              price: live?.price ?? meta?.price ?? null,
            };
          }),
        });
      }
      setDemoPortfolios(results);
    } catch (err) {
      console.error('[HeroPrompt] demo portfolio load failed:', err);
    } finally {
      setLoadingDemo(false);
    }
  }, [demoPortfolios.length, loadingDemo, prices]);

  const handleAttachClick = () => {
    const next = !popoverOpen;
    setPopoverOpen(next);
    if (next) void loadDemoPortfolios();
  };

  const handleSubmit = async () => {
    const prompt = inputValue.trim();
    if (!prompt || !attached || submitting || pricesLoading) return;
    setSubmitting(true);
    try {
      const holdings = attached.tokens.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        balance: t.amount,
        price: t.price ?? 0,
        type: 'simulated' as const,
      }));
      const { data, errors } = await dataClient.queries.riskReview({
        userProfileId: attached.userProfileId,
        prompt,
        holdings: JSON.stringify(holdings),
      });
      if (errors?.length) console.error('[HeroPrompt] riskReview errors:', errors);
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result?.questions?.length) {
        sessionStorage.setItem('wayfind-review', JSON.stringify({
          prompt,
          portfolioName: attached.name,
          holdings,
          questions: result.questions,
        }));
        router.push('/dashboard/review');
      } else {
        console.error('[HeroPrompt] no questions returned');
      }
    } catch (err) {
      console.error('[HeroPrompt] riskReview failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
      <div className="bg-surface border border-border3 rounded-2xl shadow-2xl glow-blue">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border3 bg-white/[0.02] rounded-t-2xl">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <span className="w-3 h-3 rounded-full bg-green-400/70" />
          </div>
          <span className="text-[12px] text-white/60 font-medium">Wayfind AI</span>
        </div>

        <div className="p-5">
          <div className="bg-white/[0.03] border border-border3 rounded-xl p-4">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Wayfind anything about the market…"
              className="w-full bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none resize-none min-h-[32px]"
            />
            <div className="flex items-center justify-between mt-2">
              <div ref={popoverRef} className="relative">
                {attached ? (
                  <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-accent/15 border border-accent/30 text-[12px] text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
                    <span className="font-medium">{attached.name}</span>
                    <span className="text-white/40">({attached.tokens.length} tokens)</span>
                    <button
                      onClick={() => setAttached(null)}
                      className="ml-0.5 text-white/40 hover:text-white transition-colors"
                      title="Remove portfolio"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                <button
                  onClick={handleAttachClick}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    attached ? 'bg-accent/20 text-accent border border-accent/40' : 'bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1] border border-border3/50'
                  }`}
                  title="Attach portfolio"
                >
                  <Plus className="w-4 h-4" />
                </button>
                )}

              {popoverOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-96 bg-surface border border-border3/60 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-border3/40 text-[11px] font-semibold tracking-wider text-white/40">
                    Choose a Demo Portfolio
                  </div>
                  {loadingDemo ? (
                    <div className="px-3 py-4 space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-9 bg-white/[0.04] rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : demoPortfolios.length === 0 ? (
                    <div className="px-3 py-4 text-[12px] text-white/40">No demo portfolios available</div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {demoPortfolios.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setAttached(p);
                            setPopoverOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-border3/20 last:border-b-0 ${
                            attached?.id === p.id ? 'bg-accent/10' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[13px] font-medium text-white/90">{p.name}</span>
                            <span className="text-[11px] text-white/40">{p.tokens.length} tokens</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {p.tokens.slice(0, 6).map((t) => (
                              <span key={t.symbol} className="flex items-center gap-1 text-[11px] text-white/50">
                                {t.logo && <img src={t.logo} alt="" className="w-3.5 h-3.5 rounded-full" />}
                                {t.symbol}
                              </span>
                            ))}
                            {p.tokens.length > 6 && (
                              <span className="text-[11px] text-white/30">+{p.tokens.length - 6} more</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="px-3 py-2 border-t border-border3/40 text-[11px] text-white/35 leading-relaxed">
                    Or use your own portfolio or a simulated one in the app
                  </div>
                </div>
              )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={!attached || submitting || pricesLoading}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  attached
                    ? 'bg-accent hover:bg-accent/80'
                    : 'bg-white/[0.06] border border-border3/50 cursor-not-allowed'
                }`}
              >
                {submitting || pricesLoading ? (
                  <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <ArrowRight className={`w-4 h-4 ${attached ? 'text-white' : 'text-white/30'}`} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
