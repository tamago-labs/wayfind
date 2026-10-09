'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useWallet } from '@/contexts/WalletContext';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { Copy, Check, Power, Star, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppClient } from '@/components/SolanaWalletProvider';

const dataClient = generateClient<Schema>();

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ApiKeysPage() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const { address: evmAddress } = useWallet();

  const solanaAddress = connected ? String(connected.account.address) : null;
  const walletAddress = solanaAddress || evmAddress;

  const [profileId, setProfileId] = useState<string | null>(null);
  const [apiKeyActive, setApiKeyActive] = useState<boolean>(true);
  const [totalRequests, setTotalRequests] = useState<number>(0);
  const [defaultReviewId, setDefaultReviewId] = useState<string | null>(null);
  const [defaultReviewName, setDefaultReviewName] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Array<{ id: string; portfolioName: string; createdAt: string }>>([]);
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  useEffect(() => {
    if (!walletAddress) { setProfileId(null); return; }
    void (async () => {
      try {
        const { data: profiles } = await dataClient.models.UserProfile.list({
          filter: { walletAddress: { eq: walletAddress } },
        });
        if (profiles.length > 0) {
          setProfileId(profiles[0].id);
          setApiKeyActive(profiles[0].apiKeyActive ?? true);
          setTotalRequests(profiles[0].totalRequests ?? 0);
          setDefaultReviewId(profiles[0].defaultReviewId ?? null);
        } else {
          const { data: created } = await dataClient.models.UserProfile.create({
            walletAddress,
            credits: 1000,
          });
          if (created) {
            setProfileId(created.id);
            setApiKeyActive(true);
            setTotalRequests(0);
          }
        }
      } catch {}
    })();
  }, [walletAddress]);

  const loadReviews = useCallback(async () => {
    if (!profileId) { setReviews([]); return; }
    try {
      const { data } = await dataClient.models.SavedReview.list({
        filter: { userProfileId: { eq: profileId } },
      });
      setReviews((data ?? []).map((r) => ({ id: r.id, portfolioName: r.portfolioName, createdAt: r.createdAt })));
    } catch { setReviews([]); }
  }, [profileId]);

  useEffect(() => { void loadReviews(); }, [loadReviews]);

  useEffect(() => {
    if (defaultReviewId && reviews.length > 0) {
      const found = reviews.find((r) => r.id === defaultReviewId);
      setDefaultReviewName(found?.portfolioName ?? null);
    }
  }, [defaultReviewId, reviews]);

  const handleCopy = () => {
    if (!profileId) return;
    navigator.clipboard.writeText(profileId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = async () => {
    if (!profileId) return;
    const newStatus = !apiKeyActive;
    try {
      await dataClient.models.UserProfile.update({
        id: profileId,
        apiKeyActive: newStatus,
      });
      setApiKeyActive(newStatus);
    } catch {}
  };

  const handleSetDefault = async (reviewId: string) => {
    if (!profileId) return;
    try {
      await dataClient.models.UserProfile.update({
        id: profileId,
        defaultReviewId: reviewId,
      });
      setDefaultReviewId(reviewId);
      setModalOpen(false);
    } catch {}
  };

  const filteredReviews = modalSearch
    ? reviews.filter((r) => r.portfolioName.toLowerCase().includes(modalSearch.toLowerCase()))
    : reviews;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-white tracking-tight mb-3">API Keys</h1>
      <p className="text-white/50 text-sm leading-relaxed mb-8">
        Use it to integrate with Grok Bot for tokenized stock trading.
      </p>

      <div className="bg-white/[0.03] border border-border3 rounded-xl p-6 space-y-5">
        {/* API Key */}
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-white text-lg">Your API Key</h2>
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
            apiKeyActive
              ? 'bg-emerald-400/15 text-emerald-400'
              : 'bg-white/[0.06] text-white/30'
          }`}>
            {apiKeyActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {profileId ? (
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-black/30 border border-border3 rounded-lg px-4 py-3 text-[13px] font-mono text-accent truncate">
              {profileId}
            </code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-white/[0.06] border border-border3 text-white/70 text-sm font-medium px-4 py-3 rounded-lg hover:bg-white/[0.1] transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : (
          <p className="text-white/40 text-sm">Connect wallet to see your API key.</p>
        )}

        {/* Default Risk Profile */}
        <div className="border-t border-border3/30 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-white/50 mb-0.5">Default Risk Profile</p>
              <p className="text-[13px] text-white/80">
                {defaultReviewName ?? 'No profile selected'}
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              disabled={reviews.length === 0}
              className="text-[12px] font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Change
            </button>
          </div>
        </div>

        {/* Activate/Deactivate */}
        <div className="border-t border-border3/30 pt-4 flex items-center justify-between">
          <button
            onClick={handleToggle}
            disabled={!profileId}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              apiKeyActive
                ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Power className="w-4 h-4" />
            {apiKeyActive ? 'Deactivate' : 'Activate'}
          </button>
          <p className="text-[12px] text-white/30">Total requests: {totalRequests.toLocaleString()}</p>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-surface border border-border3 rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border3/40">
                <h3 className="font-display font-semibold text-white mb-3">Select Risk Profile</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Search risk profiles…"
                    className="w-full bg-black/20 border border-border3 rounded-lg pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {filteredReviews.length === 0 ? (
                  <p className="px-3 py-4 text-[12px] text-white/30 text-center">No risk profiles found</p>
                ) : (
                  filteredReviews.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSetDefault(r.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                        defaultReviewId === r.id
                          ? 'bg-accent/10 text-accent'
                          : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <span className="text-[13px] truncate">{r.portfolioName}</span>
                      <span className="text-[11px] text-white/30 shrink-0 ml-2">{relativeTime(r.createdAt)}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}