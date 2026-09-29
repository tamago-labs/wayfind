'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, Info, Plus, X, Wallet } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import type { AppClient } from '@/components/SolanaWalletProvider';
import { useWallet } from '@/contexts/WalletContext';
import { usePrices } from '@/contexts/PriceContext';
import { useBaseTokenPrices } from '@/contexts/BaseTokenPriceProvider';
import { useSolanaBalances } from '@/hooks/useSolanaBalances';
import { useEVMBalances } from '@/hooks/useEVMBalances';
import { useKnownTokens } from '@/hooks/useKnownTokens';
import { useEVMTokens } from '@/hooks/useEVMTokens';
import { BASE_TOKENS } from '@/lib/tokens/base-tokens';
import rwaList from '@/lib/data/rwa-v1-list.json';

const dataClient = generateClient<Schema>();

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

// ─── New Chat Page ───────────────────────────────────────────────────────────

interface PortfolioOption {
  id: string | null;
  name: string;
}

function NewChatInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const { type: evmType, address: evmAddress, chainId } = useWallet();
  const { prices } = usePrices();
  const { getPrice } = useBaseTokenPrices();

  const solanaAddress = connected ? String(connected.account.address) : null;
  const isSolana = !!solanaAddress;
  const isEVM = evmType === 'evm' && !!evmAddress;
  const walletAddress = solanaAddress || evmAddress;

  const initialPrompt = searchParams.get('prompt');
  const [input, setInput] = useState(initialPrompt ?? 'What are the hidden risks in my portfolio?');
  const [mounted, setMounted] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [profileId, setProfileId] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioOption[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioOption | null>(null);
  const [portfolioPopoverOpen, setPortfolioPopoverOpen] = useState(false);
  const [portfoliosLoading, setPortfoliosLoading] = useState(false);
  const portfolioPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [input]);

  // Load or create UserProfile (same as portfolio page)
  useEffect(() => {
    if (!walletAddress) { setProfileId(null); setPortfolios([]); return; }
    let cancelled = false;
    void (async () => {
      try {
        const { data: profiles } = await dataClient.models.UserProfile.list({
          filter: { walletAddress: { eq: walletAddress } },
        });
        if (cancelled) return;
        if (profiles.length > 0) {
          setProfileId(profiles[0].id);
        } else {
          const { data: created } = await dataClient.models.UserProfile.create({
            walletAddress,
            credits: 1000,
          });
          if (!cancelled && created) setProfileId(created.id);
        }
      } catch (err) {
        console.error('[NewChat] profile load failed:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [walletAddress]);

  // Load portfolios list
  useEffect(() => {
    if (!profileId) { setPortfolios([]); return; }
    let cancelled = false;
    setPortfoliosLoading(true);
    void (async () => {
      try {
        const { data } = await dataClient.models.Portfolio.list({
          filter: { userProfileId: { eq: profileId } },
        });
        if (!cancelled) setPortfolios((data ?? []).map((p) => ({ id: p.id, name: p.name })));
      } catch (err) {
        console.error('[NewChat] load portfolios failed:', err);
      } finally {
        if (!cancelled) setPortfoliosLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profileId]);

  // Click-outside for portfolio popover
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (portfolioPopoverRef.current && !portfolioPopoverRef.current.contains(e.target as Node)) {
        setPortfolioPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handlePortfolioSelect = (p: PortfolioOption) => {
    setSelectedPortfolio(p);
    setPortfolioPopoverOpen(false);
  };

  // Balance hooks for connected wallet holdings
  const { balances: solanaBalances } = useSolanaBalances(isSolana ? solanaAddress : null);
  const { balances: evmBalances } = useEVMBalances(isEVM ? evmAddress : null, isEVM ? (chainId ?? null) : null);
  const { tokens: solanaKnownTokens } = useKnownTokens(isSolana ? walletAddress : null);
  const { tokens: evmTokens } = useEVMTokens(
    isEVM ? evmAddress : null,
    isEVM ? profileId : null,
    isEVM ? (chainId ?? null) : null,
    0
  );

  const gatherHoldings = async (): Promise<Array<{ symbol: string; name?: string; balance: number; price: number }>> => {
    if (selectedPortfolio?.id) {
      // Simulated: fetch PortfolioToken + prices
      const { data: tokens } = await dataClient.models.PortfolioToken.list({
        filter: { portfolioId: { eq: selectedPortfolio.id } },
      });
      const result = (tokens ?? []).map((t) => {
        const meta = rwaTokenMap.get(t.symbol);
        const live = prices.find((p) => p.token_symbol === t.symbol);
        const base = BASE_TOKENS.find((bt) => bt.symbol === t.symbol);
        const price = live?.price ?? meta?.price ?? (base ? getPrice(t.symbol) : 0);
        return {
          symbol: t.symbol,
          name: t.name ?? meta?.name ?? t.symbol,
          balance: t.customValue ?? 0,
          price,
        };
      });
      return result;
    }

    // Connected wallet
    const holdings: Array<{ symbol: string; name?: string; balance: number; price: number }> = [];
    const balances = isEVM ? evmBalances : solanaBalances;
    for (const bt of BASE_TOKENS) {
      const balance = parseFloat(balances[bt.symbol] ?? '0');
      holdings.push({ symbol: bt.symbol, name: bt.name, balance, price: getPrice(bt.symbol) });
    }
    const knownTokens = isEVM ? evmTokens : solanaKnownTokens;
    for (const t of knownTokens ?? []) {
      const live = prices.find((p) => p.token_symbol === t.symbol);
      holdings.push({ symbol: t.symbol, name: t.name, balance: t.balance, price: live?.price ?? t.price ?? 0 });
    }
    return holdings;
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !walletAddress || !selectedPortfolio || !profileId) return;
    const message = input.trim();
    setSending(true);

    try {
      const holdings = await gatherHoldings();
      if (holdings.length === 0) {
        console.error('[handleSend] no holdings found');
        return;
      }

      const { data, errors } = await dataClient.queries.riskReview({
        userProfileId: profileId,
        prompt: message,
        holdings: JSON.stringify(holdings),
      });
      if (errors?.length) console.error('[handleSend] riskReview errors:', errors);
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result?.questions?.length) {
        sessionStorage.setItem('wayfind-review', JSON.stringify({
          prompt: message,
          userProfileId: profileId,
          portfolioName: selectedPortfolio.name,
          holdings,
          questions: result.questions,
        }));
        router.push('/dashboard/review');
      } else {
        console.error('[handleSend] no questions returned');
      }
    } catch (err) {
      console.error('[handleSend] riskReview failed:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden grid-bg">
      {/* Glows */}
      <div className="absolute w-[500px] h-[500px] top-1/2 -translate-y-1/2 -left-48 rounded-full blur-[120px] opacity-25 bg-accent pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] top-1/2 -translate-y-1/2 -right-40 rounded-full blur-[120px] opacity-25 bg-zenpurple pointer-events-none" />

      {/* Content */}
      <div className="relative z-1 h-full flex flex-col items-center justify-center px-6 max-w-3xl mx-auto"> 
        <p className="font-display text-2xl md:text-3xl font-semibold text-center text-white/70 mb-8">
          &ldquo;Let&apos;s Uncover Your Portfolio Risk&rdquo;
        </p>

        {/* Input with glow */}
        <div className="w-full bg-surface border border-border3 rounded-2xl shadow-2xl glow-blue overflow-visible">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Wayfind anything about your portfolio…"
            rows={1}
            className="w-full bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none resize-none min-h-[60px] p-4"
          />
          <div className="flex items-center justify-between px-4 pb-4">
            <div ref={portfolioPopoverRef} className="relative">
              {selectedPortfolio ? (
                <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-accent/15 border border-accent/30 text-[12px] text-white/80">
                  {selectedPortfolio.id === null ? (
                    <Wallet className="w-3.5 h-3.5 text-accent2 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-accent2 shrink-0" />
                  )}
                  <span className="font-medium">{selectedPortfolio.name}</span>
                  <button
                    onClick={() => setSelectedPortfolio(null)}
                    className="ml-0.5 text-white/40 hover:text-white transition-colors"
                    title="Remove portfolio"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!walletAddress) return;
                    setPortfolioPopoverOpen((v) => !v);
                  }}
                  disabled={!walletAddress}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    walletAddress
                      ? 'bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1] border border-border3/50'
                      : 'bg-white/[0.03] text-white/20 border border-border3/30 cursor-not-allowed'
                  }`}
                  title={walletAddress ? 'Choose portfolio' : 'Connect wallet to choose portfolio'}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}

              {portfolioPopoverOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-surface border border-border3/60 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-border3/40 text-[11px] font-semibold tracking-wider text-white/40">
                    Choose a Portfolio
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <button
                      onClick={() => handlePortfolioSelect({ id: null, name: 'Connected Wallet' })}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors border-b border-border3/20 ${
                        selectedPortfolio?.id === null ? 'bg-accent/10' : ''
                      }`}
                    >
                      <Wallet className="w-4 h-4 text-accent2 shrink-0" />
                      <span className="text-[13px] font-medium text-white/90">Connected Wallet</span>
                    </button>
                    {portfoliosLoading ? (
                      <div className="px-3 py-3 space-y-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-8 bg-white/[0.04] rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : portfolios.length === 0 ? (
                      <div className="px-3 py-3 text-[12px] text-white/40">
                        No simulated portfolios — create one on the Portfolio page
                      </div>
                    ) : (
                      portfolios.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handlePortfolioSelect(p)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors border-b border-border3/20 last:border-b-0 ${
                            selectedPortfolio?.id === p.id ? 'bg-accent/10' : ''
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-accent2 shrink-0" />
                          <span className="text-[13px] font-medium text-white/90 truncate">{p.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {walletAddress ? (
              <button
                onClick={handleSend}
                disabled={sending || !selectedPortfolio}
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  selectedPortfolio
                    ? 'bg-accent hover:bg-accent/80'
                    : 'bg-white/[0.06] border border-border3/50 cursor-not-allowed'
                }`}
              >
                {sending ? (
                  <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <ArrowRight className={`w-4 h-4 ${selectedPortfolio ? 'text-white' : 'text-white/30'}`} />
                )}
              </button>
            ) : (
              <span className="text-[12px] text-white/30">Connect wallet to check</span>
            )}
          </div>
        </div>

        {/* How to use */}
        <div className="w-full mt-8 pt-6 border-t border-border3/30">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-2.5">
                <span className="text-[13px] font-semibold text-accent">1</span>
              </div>
              <p className="text-[12px] font-medium text-white/70 mb-0.5">Select Portfolio</p>
              <p className="text-[11px] text-white/30 leading-snug">Use real holdings or simulate one</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-2.5">
                <span className="text-[13px] font-semibold text-accent">2</span>
              </div>
              <p className="text-[12px] font-medium text-white/70 mb-0.5">Ask Your Question</p>
              <p className="text-[11px] text-white/30 leading-snug">Ask about risks or anything on your mind</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-2.5">
                <span className="text-[13px] font-semibold text-accent">3</span>
              </div>
              <p className="text-[12px] font-medium text-white/70 mb-0.5">Review & Chat</p>
              <p className="text-[11px] text-white/30 leading-snug">Review results, then chat further about risks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewChat() {
  return (
    <Suspense fallback={null}>
      <NewChatInner />
    </Suspense>
  );
}
