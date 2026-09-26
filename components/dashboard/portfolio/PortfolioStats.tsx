'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useBaseTokenPrices } from '../../../contexts/BaseTokenPriceProvider';
import { BASE_TOKENS } from '@/lib/tokens/base-tokens';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { useClient } from '@solana/react';
import { useSolanaBalances } from '@/hooks/useSolanaBalances';
import { useKnownTokens } from '@/hooks/useKnownTokens';
import RiskDrawer from './RiskDrawer';
import RebalanceDrawer from '../../portfolio/RebalanceDrawer';
import YieldDrawer from '../../portfolio/YieldDrawer';
import type { AppClient } from '@/components/SolanaWalletProvider';

interface PortfolioStatsProps {
  balances: Record<string, string>;
  knownTokens: any[];
  loading: boolean;
  knownLoading: boolean;
}

const dataClient = generateClient<Schema>();

export default function PortfolioStats({ balances, knownTokens, loading, knownLoading }: PortfolioStatsProps) {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const walletAddress = connected ? String(connected.account.address) : null;
  const { getPrice, getChange24h } = useBaseTokenPrices();
  const [riskReport, setRiskReport] = useState<any>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
const [rebalanceDrawerOpen, setRebalanceDrawerOpen] = useState(false);
  const [yieldDrawerOpen, setYieldDrawerOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;
    dataClient.models.RiskEvaluation.get({ id: walletAddress }).then((res) => {
      if (res.data) {
        const report = typeof res.data.report === "string" ? JSON.parse(res.data.report) : res.data.report;
        if (res.data.rebalanceSuggestions) {
          try {
            report.rebalanceSuggestions = typeof res.data.rebalanceSuggestions === "string" ? JSON.parse(res.data.rebalanceSuggestions) : res.data.rebalanceSuggestions;
          } catch {}
        }
        if (res.data.yieldStrategies) {
          try {
            report.yieldStrategies = typeof res.data.yieldStrategies === "string" ? JSON.parse(res.data.yieldStrategies) : res.data.yieldStrategies;
          } catch {}
        }
        setRiskReport({ ...report, updatedAt: res.data.updatedAt });
      }
    }).catch(() => {});
  }, [walletAddress]);

  const handleEvaluateAgain = () => {
    setDrawerOpen(false);
    setEvalModalOpen(true);
    handleEvaluate();
  };

  const handleEvaluate = async () => { 
    if (!walletAddress) return;
    setRiskLoading(true);
    try {
      if (loading || knownLoading) {
        return;
      }
      const holdings = [
        ...BASE_TOKENS.map((t) => {
          const balance = parseFloat(balances[t.symbol] ?? '0');
          return {
            symbol: t.symbol,
            balance,
            price: getPrice(t.symbol),
            change24h: getChange24h(t.symbol),
            type: 'base' as const,
          };
        }),
        ...knownTokens.map((t) => ({
          symbol: t.symbol,
          balance: t.balance,
          price: t.price,
          change24h: t.change,
          type: t.type,
          mint: t.mint,
        })),
      ].filter((h) => h.balance > 0);


      const portfolioValue = holdings.reduce((sum, h) => sum + h.balance * h.price, 0);

      dataClient.mutations.evaluateRisk({
        walletAddress,
        holdings: JSON.stringify(holdings),
        portfolioValue,
      }).catch(() => {});

      let dbRes;
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        dbRes = await dataClient.models.RiskEvaluation.get({ id: walletAddress });
        if (dbRes.data?.report) {
          const parsed = typeof dbRes.data.report === "string" ? JSON.parse(dbRes.data.report) : dbRes.data.report;
          if (parsed?.overallScore != null) break;
        }
      }

      if (dbRes?.data?.report) {
        const dbReport = typeof dbRes.data.report === "string" ? JSON.parse(dbRes.data.report) : dbRes.data.report;
        if (dbRes.data.rebalanceSuggestions) {
          try {
            dbReport.rebalanceSuggestions = typeof dbRes.data.rebalanceSuggestions === "string" ? JSON.parse(dbRes.data.rebalanceSuggestions) : dbRes.data.rebalanceSuggestions;
          } catch {}
        }
        if (dbRes.data.yieldStrategies) {
          try {
            dbReport.yieldStrategies = typeof dbRes.data.yieldStrategies === "string" ? JSON.parse(dbRes.data.yieldStrategies) : dbRes.data.yieldStrategies;
          } catch {}
        }
        setRiskReport({ ...dbReport, updatedAt: dbRes.data.updatedAt });
        setDrawerOpen(true);
      } else {
        setEvalError('Risk evaluation timed out. Please try again.');
        setDrawerOpen(true);
      }
    } catch (err) {
      console.error('[PortfolioStats] risk eval failed:', err);
      setEvalError(err instanceof Error ? err.message : 'Unknown error');
      setDrawerOpen(true);
    } finally {
      setRiskLoading(false);
    }
  };

  if (loading || knownLoading) {
    return (
      <div className="w-72 shrink-0 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col gap-4">
        <div>
          <p className="text-[12px] text-white/40 mb-1">Portfolio Value</p>
          <div className="h-6 w-24 bg-white/[0.05] rounded animate-pulse" />
          <div className="h-3 w-16 bg-white/[0.05] rounded animate-pulse mt-2" />
        </div>
        <div>
          <p className="text-[12px] text-white/40 mb-1">Risk Score</p>
          <div className="h-5 w-20 bg-white/[0.05] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const baseValue = BASE_TOKENS.reduce((sum, token) => {
    const balance = parseFloat(balances[token.symbol] ?? '0');
    return sum + balance * getPrice(token.symbol);
  }, 0);

  const knownValue = knownTokens.reduce((sum, t) => sum + (t.value ?? 0), 0);
  const totalValue = baseValue + knownValue;

  const baseChange = BASE_TOKENS.reduce((sum, token) => {
    const balance = parseFloat(balances[token.symbol] ?? '0');
    return sum + balance * getChange24h(token.symbol);
  }, 0);

  const knownChange = knownTokens.reduce((sum, t) => sum + (t.value ?? 0) * (t.change ?? 0) / 100, 0);
  const portfolioChange = totalValue > 0 ? (baseChange + knownChange) / totalValue * 100 : 0;

  const industryMap = new Map<string, number>();
  for (const t of knownTokens) {
    if (t.value > 0 && t.industry) {
      const current = industryMap.get(t.industry) ?? 0;
      industryMap.set(t.industry, current + t.value);
    }
  }
  const knownTokensTotalValue = knownTokens.reduce((sum, t) => sum + (t.value ?? 0), 0);
  const industries = Array.from(industryMap.entries())
    .map(([name, value]) => ({ name, pct: knownTokensTotalValue > 0 ? Math.round((value / knownTokensTotalValue) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  return (
    <>
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
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] text-white/40">Risk Score</p>
            {!riskReport && (
              <button
                onClick={handleEvaluate}
                disabled={riskLoading}
                className={`text-[11px] font-medium text-white px-3 py-1.5 rounded-lg btn-gradient ${riskLoading ? 'loading-dots' : ''}`}
              >
                {riskLoading ? 'Evaluating' : 'Evaluate'}
              </button>
            )}
          </div>
          <p className="text-[20px] font-display font-bold">
            {riskReport ? riskReport.overallScore : '--'}<span className="text-[14px] text-white/30">/100</span>
          </p>
          {riskReport ? (
            <div className="space-y-1">
              <button
                onClick={() => setDrawerOpen(true)}
                className="text-[12px] text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1"
              >
                View Risk Analysis <ArrowRight className="w-3 h-3" />
              </button>
              {riskReport?.rebalanceSuggestions && (
                <button
                  onClick={() => setRebalanceDrawerOpen(true)}
                  className="text-[12px] text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1"
                >
                  Rebalance Suggestions <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {riskReport?.yieldStrategies && (
                <button
                  onClick={() => setYieldDrawerOpen(true)}
                  className="text-[12px] text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1"
                >
                  Yield Strategies <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-white/30 mt-1">
              Evaluate your portfolio to see risk insights. Requires AI credits.
            </p>
          )}
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
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${ind.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <RiskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        report={riskReport}
        loading={riskLoading}
        evalError={evalError}
        onEvaluate={handleEvaluateAgain}
      />
      <RebalanceDrawer
        open={rebalanceDrawerOpen}
        onClose={() => setRebalanceDrawerOpen(false)}
        suggestions={riskReport?.rebalanceSuggestions ?? null}
      />
      <YieldDrawer
        open={yieldDrawerOpen}
        onClose={() => setYieldDrawerOpen(false)}
        strategies={riskReport?.yieldStrategies ?? null}
      />

      <AnimatePresence>
        {evalModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEvalModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-surface border border-border3/50 rounded-2xl p-8 max-w-sm w-full mx-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full"
                />
              </div>
              <h3 className="text-[16px] font-display font-semibold text-white/90 mb-2">New Evaluation In Progress</h3>
              <p className="text-[13px] text-white/50 leading-relaxed mb-6">
                AI is analyzing your portfolio across risk, rebalancing, and yield opportunities. This usually takes 2-3 minutes.
              </p>
              <button
                onClick={() => setEvalModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-accent text-sm font-medium text-white hover:bg-accent/80 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


