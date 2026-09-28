'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Check, Trash2, Wallet } from 'lucide-react';
import { useBaseTokenPrices } from '../../../contexts/BaseTokenPriceProvider';
import { usePrices } from '../../../contexts/PriceContext';
import { BASE_TOKENS } from '@/lib/tokens/base-tokens';
import rwaList from '@/lib/data/rwa-v1-list.json';

// Symbol → industry map from RWA list (chain-agnostic)
const rwaIndustryMap = new Map<string, string>();
for (const asset of (rwaList as any).assets ?? []) {
  if (asset.industry) {
    for (const token of asset.tokens ?? []) {
      if (token.symbol && !rwaIndustryMap.has(token.symbol)) {
        rwaIndustryMap.set(token.symbol, asset.industry);
      }
    }
  }
}

export interface PortfolioInfo {
  id: string;
  name: string;
}

interface PortfolioStatsProps {
  balances: Record<string, string>;
  knownTokens: any[];
  loading: boolean;
  knownLoading: boolean;
  walletAddress: string | null;
  walletType: 'solana' | 'evm' | null;
  portfolios: PortfolioInfo[];
  selectedPortfolioId: string | null;
  onSelectPortfolio: (id: string | null) => void;
  onCreatePortfolio: (name: string) => Promise<void>;
  onDeletePortfolio: (id: string) => Promise<void>;
}

export default function PortfolioStats({
  balances,
  knownTokens,
  loading,
  knownLoading,
  walletAddress,
  walletType,
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onCreatePortfolio,
  onDeletePortfolio,
}: PortfolioStatsProps) {
  const { getPrice, getChange24h } = useBaseTokenPrices();
  const { prices: livePrices } = usePrices();
  const livePriceMap = new Map(livePrices.map((p) => [p.token_symbol, p]));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedPortfolio = portfolios.find((p) => p.id === selectedPortfolioId) ?? null;
  const isSimulated = !!selectedPortfolio;

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await onCreatePortfolio(name);
    setNewName('');
    setCreating(false);
    setDropdownOpen(false);
  };

  if (!isSimulated && (loading || knownLoading)) {
    return (
      <div className="w-72 shrink-0 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col gap-4">
        <PortfolioSelector
          label="Connected Wallet"
          dropdownOpen={dropdownOpen}
          onToggle={() => setDropdownOpen((v) => !v)}
          dropdownRef={dropdownRef}
          portfolios={portfolios}
          selectedPortfolioId={selectedPortfolioId}
          onSelect={(id) => { onSelectPortfolio(id); setDropdownOpen(false); }}
          creating={creating}
          newName={newName}
          onNewNameChange={setNewName}
          onStartCreate={() => setCreating(true)}
          onCancelCreate={() => { setCreating(false); setNewName(''); }}
          onCreate={handleCreate}
          onDelete={onDeletePortfolio}
          canCreate={!!walletAddress}
        />
        <div>
          <p className="text-[12px] text-white/40 mb-1">Portfolio Value</p>
          <div className="h-6 w-24 bg-white/[0.05] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (isSimulated) {
    const simTokens = knownTokens.filter((t: any) => t._simulated);
    const tokenPrice = (symbol: string, fallback: number) => {
      const base = BASE_TOKENS.find((bt) => bt.symbol === symbol);
      if (base) return getPrice(symbol);
      const live = livePriceMap.get(symbol);
      return live?.price ?? fallback ?? 0;
    };
    const totalValue = simTokens.reduce((sum, t) => {
      const price = tokenPrice(t.symbol, t.price);
      return sum + (t.customValue ?? t.balance ?? 0) * price;
    }, 0);

    // Industries for simulated tokens
    const simIndustryMap = new Map<string, number>();
    for (const t of simTokens) {
      const industry = rwaIndustryMap.get(t.symbol);
      const price = tokenPrice(t.symbol, t.price);
      const value = (t.customValue ?? t.balance ?? 0) * price;
      if (industry && value > 0) {
        simIndustryMap.set(industry, (simIndustryMap.get(industry) ?? 0) + value);
      }
    }
    const simIndustries = Array.from(simIndustryMap.entries())
      .map(([name, value]) => ({ name, pct: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0 }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);

    return (
      <div className="w-72 shrink-0 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col gap-4">
        <PortfolioSelector
          label={selectedPortfolio.name}
          dropdownOpen={dropdownOpen}
          onToggle={() => setDropdownOpen((v) => !v)}
          dropdownRef={dropdownRef}
          portfolios={portfolios}
          selectedPortfolioId={selectedPortfolioId}
          onSelect={(id) => { onSelectPortfolio(id); setDropdownOpen(false); }}
          creating={creating}
          newName={newName}
          onNewNameChange={setNewName}
          onStartCreate={() => setCreating(true)}
          onCancelCreate={() => { setCreating(false); setNewName(''); }}
          onCreate={handleCreate}
          onDelete={onDeletePortfolio}
          canCreate={!!walletAddress}
        />
        <div>
          <p className="text-[12px] text-white/40 mb-1">Portfolio Value</p>
          <p className="text-[24px] font-display font-bold">
            ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[13px] text-white/30 mt-1">Simulated portfolio</p>
        </div>
        {simIndustries.length > 0 && (
          <div className="mt-auto">
            <p className="text-[12px] text-white/40 mb-3">Underlying Exposure</p>
            <div className="space-y-3">
              {simIndustries.map((ind) => (
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
    const industry = t.industry ?? rwaIndustryMap.get(t.symbol);
    if (value > 0 && industry) {
      const current = industryMap.get(industry) ?? 0;
      industryMap.set(industry, current + value);
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
      <PortfolioSelector
        label="Connected Wallet"
        dropdownOpen={dropdownOpen}
        onToggle={() => setDropdownOpen((v) => !v)}
        dropdownRef={dropdownRef}
        portfolios={portfolios}
        selectedPortfolioId={selectedPortfolioId}
        onSelect={(id) => { onSelectPortfolio(id); setDropdownOpen(false); }}
        creating={creating}
        newName={newName}
        onNewNameChange={setNewName}
        onStartCreate={() => setCreating(true)}
        onCancelCreate={() => { setCreating(false); setNewName(''); }}
        onCreate={handleCreate}
        onDelete={onDeletePortfolio}
        canCreate={!!walletAddress}
      />
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

interface PortfolioSelectorProps {
  label: string;
  dropdownOpen: boolean;
  onToggle: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  portfolios: PortfolioInfo[];
  selectedPortfolioId: string | null;
  onSelect: (id: string | null) => void;
  creating: boolean;
  newName: string;
  onNewNameChange: (v: string) => void;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onCreate: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  canCreate: boolean;
}

function PortfolioSelector({
  label,
  dropdownOpen,
  onToggle,
  dropdownRef,
  portfolios,
  selectedPortfolioId,
  onSelect,
  creating,
  newName,
  onNewNameChange,
  onStartCreate,
  onCancelCreate,
  onCreate,
  onDelete,
  canCreate,
}: PortfolioSelectorProps) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-border3/40 text-[12px] font-medium text-white/70 hover:border-accent/40 transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedPortfolioId ? (
            <span className="w-2 h-2 rounded-full bg-accent2 shrink-0" />
          ) : (
            <Wallet className="w-3.5 h-3.5 text-white/40 shrink-0" />
          )}
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown className={`w-3 h-3 text-white/30 transition-transform shrink-0 ml-2 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border3/50 rounded-lg overflow-hidden z-20 shadow-xl"
          >
            <button
              onClick={() => onSelect(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/[0.04] transition-colors ${
                selectedPortfolioId === null ? 'text-accent' : 'text-white/70'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 text-left">Connected Wallet</span>
              {selectedPortfolioId === null && <Check className="w-3 h-3 shrink-0" />}
            </button>

            {portfolios.map((p) => (
              <div key={p.id} className="flex items-center group">
                <button
                  onClick={() => onSelect(p.id)}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/[0.04] transition-colors ${
                    selectedPortfolioId === p.id ? 'text-accent' : 'text-white/70'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-accent2 shrink-0" />
                  <span className="flex-1 text-left truncate">{p.name}</span>
                  {selectedPortfolioId === p.id && <Check className="w-3 h-3 shrink-0" />}
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  className="p-2 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Delete portfolio"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {creating ? (
              <div className="px-3 py-2 border-t border-border3/30">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => onNewNameChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void onCreate(); if (e.key === 'Escape') onCancelCreate(); }}
                  placeholder="Portfolio name…"
                  className="w-full bg-white/[0.03] border border-border3/40 rounded-md px-2 py-1.5 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-accent/50"
                />
                <div className="flex gap-1 mt-1.5">
                  <button
                    onClick={() => void onCreate()}
                    className="flex-1 py-1 rounded-md bg-accent/20 text-accent text-[11px] font-medium hover:bg-accent/30 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={onCancelCreate}
                    className="flex-1 py-1 rounded-md text-white/40 text-[11px] hover:text-white/70 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={canCreate ? onStartCreate : undefined}
                disabled={!canCreate}
                title={canCreate ? undefined : 'Connect wallet to create simulated portfolios'}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] border-t border-border3/30 transition-colors ${
                  canCreate
                    ? 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                    : 'text-white/20 cursor-not-allowed'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                New Simulated Portfolio
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
