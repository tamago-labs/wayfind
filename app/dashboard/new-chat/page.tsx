'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, Check, Info, Plus, X, Wallet } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import type { AppClient } from '@/components/SolanaWalletProvider';

const dataClient = generateClient<Schema>();

const experienceOptions = [
  { value: 'newcomer', label: 'Newcomer', desc: 'New to crypto. Plain language, more explanations.' },
  { value: 'regular', label: 'Regular', desc: 'Comfortable with basics. Balanced detail.' },
  { value: 'lite_degen', label: 'Lite Degen', desc: 'Familiar with DeFi. Technical but accessible.' },
  { value: 'full_degen', label: 'Full Degen', desc: 'Crypto native. Max degen, no hand-holding.' },
];

const writingStyleOptions = [
  { value: 'default', label: 'Default', desc: 'Balanced tone, clear and direct.' },
  { value: 'journalist', label: 'Journalist', desc: 'Fact-driven, neutral reporting style.' },
  { value: 'storytelling', label: 'Storytelling', desc: 'Narrative flow, explains the why.' },
  { value: 'ct_vibes', label: 'CT Vibes', desc: 'Crypto Twitter slang, memes, vibes.' },
  { value: 'concise', label: 'Concise', desc: 'Short and to the point. No fluff.' },
];

const sourceOptions = [
  { value: 'cmc', label: 'CMC Data', desc: 'CoinMarketCap price data' },
  { value: 'news', label: 'News Sites', desc: 'Crypto & financial news' },
  { value: 'exchange', label: 'Exchange Feeds', desc: 'CEX/DEX order book data' },
  { value: 'tradfi', label: 'TradFi Data', desc: 'Traditional market data' },
];

// ─── Single-select Dropdown ──────────────────────────────────────────────────

function Dropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; desc: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border3/50 bg-white/[0.02] text-[13px] text-white/60 hover:text-white/80 hover:border-border3 transition-colors"
      >
        <span>{selected?.label ?? label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-border3/50 bg-surface shadow-xl overflow-hidden z-20">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 transition-colors ${
                value === opt.value
                  ? 'bg-accent/5'
                  : 'hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[13px] ${value === opt.value ? 'text-accent font-medium' : 'text-white/70'}`}>
                  {opt.label}
                </span>
              </div>
              <p className="text-[11px] text-white/30 mt-0.5 leading-snug">
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Multi-select Toggle Dropdown ────────────────────────────────────────────

function ToggleDropdown({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; desc: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const count = values.length;
  const total = options.length;
  const display = count === total ? 'All sources' : `${count}/${total} sources`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border3/50 bg-white/[0.02] text-[13px] text-white/60 hover:text-white/80 hover:border-border3 transition-colors"
      >
        <span>{display}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-border3/50 bg-surface shadow-xl overflow-hidden z-20">
          {options.map((opt) => {
            const active = values.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                  active ? 'bg-accent' : 'border border-border3/50'
                }`}>
                  {active && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="min-w-0">
                  <span className={`text-[13px] ${active ? 'text-white/80 font-medium' : 'text-white/50'}`}>
                    {opt.label}
                  </span>
                  <p className="text-[11px] text-white/25 truncate">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
  const walletAddress = connected ? String(connected.account.address) : null;
  const initialPrompt = searchParams.get('prompt');
  const [input, setInput] = useState(initialPrompt ?? 'What are the hidden risks in my portfolio?');
  const [mounted, setMounted] = useState(false);
  const [sending, setSending] = useState(false);
  const [experience, setExperience] = useState('regular');

  const [writingStyle, setWritingStyle] = useState('default');
  const [sources, setSources] = useState(['cmc', 'news', 'exchange', 'tradfi']);
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

  const handleSend = async () => {
    if (!input.trim() || sending || !walletAddress || !selectedPortfolio) return;
    const message = input.trim();
    setInput('');
    setSending(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL || '';
      console.log('[handleSend] URL:', apiUrl);
      console.log('[handleSend] message:', message);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionName: message.slice(0, 30),
          message,
          walletAddress,
          portfolioId: selectedPortfolio.id,
        }),
      });

      console.log('[handleSend] status:', res.status, 'ok:', res.ok);

      if (!res.ok) {
        const errText = await res.text();
        console.error('[handleSend] error body:', errText);
        throw new Error('Failed to create session');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      let sessionId = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        console.log('[handleSend] chunk:', text);
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            console.log('[handleSend] parsed:', json);
            if (json.sessionId) sessionId = json.sessionId;
          } catch {}
        }
      }

      console.log('[handleSend] sessionId:', sessionId);

      if (sessionId) {
        router.push(`/dashboard/chats/${sessionId}?prompt=${encodeURIComponent(message)}`);
      }
    } catch (err) {
      console.error('[handleSend] failed:', err);
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

        {/* Config */}
        <div className="w-full grid grid-cols-3 gap-3 mt-4">
          <div className="bg-surface border border-border3 rounded-xl p-3">
            <label className="text-[11px] text-white/30 mb-1.5 block">Crypto Experience</label>
            <Dropdown
              label="Crypto Experience"
              options={experienceOptions}
              value={experience}
              onChange={setExperience}
            />
          </div>
          <div className="bg-surface border border-border3 rounded-xl p-3">
            <label className="text-[11px] text-white/30 mb-1.5 block">Writing Style</label>
            <Dropdown
              label="Writing Style"
              options={writingStyleOptions}
              value={writingStyle}
              onChange={setWritingStyle}
            />
          </div>
          <div className="bg-surface border border-border3 rounded-xl p-3">
            <label className="text-[11px] text-white/30 mb-1.5 block">Sources</label>
            <ToggleDropdown
              label="Sources"
              options={sourceOptions}
              values={sources}
              onChange={setSources}
            />
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
