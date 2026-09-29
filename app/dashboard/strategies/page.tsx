'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, ChevronDown, X, ExternalLink } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import type { AppClient } from '@/components/SolanaWalletProvider';
import { checkConcentration, matchRisk, checkPreIpo, type StrategyResult, type Holding, type PreStockMarket } from '@/lib/strategies';

const dataClient = generateClient<Schema>();

function StatusDot({ status }: { status: 'triggered' | 'ok' }) {
  return (
    <span className={`w-2 h-2 rounded-full ${status === 'triggered' ? 'bg-orange-400' : 'bg-emerald-400'}`} />
  );
}

export default function StrategiesPage() {
  const router = useRouter();
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const walletAddress = connected ? String(connected.account.address) : null;
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Array<{ id: string; portfolioName: string; overallScore: number; overallLabel: string }>>([]);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [strategies, setStrategies] = useState<StrategyResult[]>([]);
  const [drawer, setDrawer] = useState<StrategyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!walletAddress) return;
    void (async () => {
      try {
        const { data: profiles } = await dataClient.models.UserProfile.list({ filter: { walletAddress: { eq: walletAddress } } });
        const profile = profiles?.[0];
        if (profile) {
          setUserProfileId(profile.id);
          const { data: revs } = await dataClient.models.SavedReview.list({ filter: { userProfileId: { eq: profile.id } } });
          if (revs) {
            setReviews(revs.map(r => ({ id: r.id!, portfolioName: r.portfolioName, overallScore: r.overallScore, overallLabel: r.overallLabel })));
          }
        }
      } catch (err) { console.error('[Strategies] load failed:', err); }
    })();
  }, [walletAddress]);

  const loadReview = async (reviewId: string, name: string) => {
    setLoading(true);
    setSelectedReview(reviewId);
    setSelectedName(name);
    setDropdownOpen(false);
    try {
      const { data: review } = await dataClient.models.SavedReview.get({ id: reviewId });
      if (!review) return;

      const holdings: Holding[] = JSON.parse(review.holdings as string);
      const score = review.overallScore;

      const { data: markets } = await dataClient.models.PreStock.list({ limit: 1000 });
      const preStockMarkets: PreStockMarket[] = (markets ?? [])
        .filter(m => m.markPrice && m.markPrice > 0)
        .map(m => ({
          symbol: m.symbol ?? '',
          tokenPrice: m.tokenPrice ?? null,
          markPrice: m.markPrice ?? null,
          markValuation: m.markValuation ?? null,
          supply: m.supply ?? null,
        }));

      const results = [
        checkConcentration(holdings),
        matchRisk(score),
        checkPreIpo(holdings, preStockMarkets),
      ];
      setStrategies(results);
    } catch (err) {
      console.error('[Strategies] load review failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden grid-bg">
      <div className="absolute w-[500px] h-[500px] top-1/2 -translate-y-1/2 -left-48 rounded-full blur-[120px] opacity-25 bg-accent pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] top-1/2 -translate-y-1/2 -right-40 rounded-full blur-[120px] opacity-25 bg-zenpurple pointer-events-none" />

      <div className="relative z-1 h-full flex flex-col px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 h-9 rounded-lg border border-border3/50 bg-surface text-[13px] text-white/70 hover:bg-white/[0.04] transition-colors"
            >
              {selectedName || 'Select Review'}
              <ChevronDown className="w-3.5 h-3.5 text-white/40" />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute left-0 top-full mt-1 w-64 rounded-lg border border-border3/50 bg-surface shadow-xl z-20 overflow-hidden"
                  >
                    {reviews.length === 0 ? (
                      <div className="px-3 py-2.5 text-[12px] text-white/30">No reviews</div>
                    ) : (
                      reviews.map(r => (
                        <button
                          key={r.id}
                          onClick={() => loadReview(r.id!, r.portfolioName)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] hover:bg-white/[0.04] transition-colors ${
                            selectedReview === r.id ? 'text-accent bg-accent/5' : 'text-white/60'
                          }`}
                        >
                          <span>{r.portfolioName}</span>
                          <span className="text-[11px] text-white/30">Risk Score: {r.overallScore}</span>
                        </button>
                      ))
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Table */}
        {!selectedReview ? (
          <div className="bg-surface border border-border3/50 rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border3/50 text-[11px] text-white/30 font-medium uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium w-10"></th>
                  <th className="text-left px-4 py-3 font-medium">Strategy</th>
                  <th className="text-left px-4 py-3 font-medium">Summary</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {['Concentration Risk', 'Risk Match', 'Pre-IPO Exposure'].map((name) => (
                  <tr key={name} className="border-b border-border3/20">
                    <td className="px-4 py-3.5"><span className="w-2 h-2 rounded-full bg-white/20 block" /></td>
                    <td className="px-4 py-3.5"><span className="font-mono font-semibold text-white/40">{name}</span></td>
                    <td className="px-4 py-3.5 text-white/20">Select a review to analyze</td>
                    <td className="px-4 py-3.5 text-right text-white/20">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-surface border border-border3/50 rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border3/50 text-[11px] text-white/30 font-medium uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium w-10"></th>
                  <th className="text-left px-4 py-3 font-medium">Strategy</th>
                  <th className="text-left px-4 py-3 font-medium">Summary</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border3/20 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setDrawer(s)}
                  >
                    <td className="px-4 py-3.5">
                      <StatusDot status={s.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-semibold text-white/90">{s.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-white/50 max-w-xs truncate">
                      {s.summary}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {s.actions.length > 0 ? (
                        <span className="text-[12px] text-white/40 font-medium">
                          {s.actions.length} action{s.actions.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[12px] text-emerald-400/60 font-medium">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <p className="text-[12px] text-white/30 text-center mt-4 leading-relaxed">
              Wayfind provides a suite of trading strategies you can run against any saved review. Select a review above to see which strategies are triggered for your portfolio.
            </p>
          </>
        )}
      </div>

      <p className="text-[12px] text-white/25 text-center mt-6 pb-4 leading-relaxed max-w-lg mx-auto">
        Wayfind provides a suite of trading strategies you can run against any saved review. Select a review above to see which strategies are triggered for your portfolio.
      </p>

      {/* Drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setDrawer(null)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-surface border-l border-border3/50 z-50 flex flex-col"
            >
              <div className="p-4 border-b border-border3/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={drawer.status} />
                  <p className="text-[14px] font-semibold">{drawer.name}</p>
                </div>
                <button onClick={() => setDrawer(null)} className="p-1 rounded text-white/40 hover:text-white/70">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">Summary</p>
                  <p className="text-[13px] text-white/60 leading-relaxed">{drawer.summary}</p>
                </div>
                {drawer.actions.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Recommended Actions</p>
                    <div className="space-y-2">
                      {drawer.actions.map((a, i) => (
                        <div key={i} className="rounded-lg border border-border3/30 bg-white/[0.02] p-3">
                          <p className="text-[12px] font-medium text-white/70">{a.label}</p>
                          <p className="text-[11px] text-white/40 mt-0.5">{a.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {drawer.id === 'pre-ipo' && drawer.actions.length > 0 && (
                  <button
                    onClick={() => router.push('/dashboard/pre-ipo')}
                    className="flex items-center gap-2 text-[12px] text-accent hover:text-accent/80 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Go to Pre-IPO page
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
