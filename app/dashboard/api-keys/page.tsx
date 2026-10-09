'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useWallet } from '@/contexts/WalletContext';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { Copy, Check, Power, Star } from 'lucide-react';
import type { AppClient } from '@/components/SolanaWalletProvider';

const dataClient = generateClient<Schema>();

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
  const [reviews, setReviews] = useState<Array<{ id: string; portfolioName: string }>>([]);
  const [copied, setCopied] = useState(false);

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
      setReviews((data ?? []).map((r) => ({ id: r.id, portfolioName: r.portfolioName })));
    } catch { setReviews([]); }
  }, [profileId]);

  useEffect(() => { void loadReviews(); }, [loadReviews]);

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
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-white tracking-tight mb-3">API Keys</h1>
      <p className="text-white/50 text-sm leading-relaxed mb-8">
        Your API key is tied to your wallet profile. Use it to integrate with Grok Bot for tokenized stock trading.
      </p>

      <div className="bg-white/[0.03] border border-border3 rounded-xl p-6 space-y-4">
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

        <div className="flex items-center gap-4 pt-2">
          <p className="text-[12px] text-white/30">Total requests: {totalRequests.toLocaleString()}</p>
          <p className="text-[12px] text-white/30">Total reviews: {reviews.length}</p>
        </div>

        <div className="pt-2">
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
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="bg-white/[0.03] border border-border3 rounded-xl p-6 mt-6">
          <h2 className="font-display font-semibold text-white text-lg mb-4">Risk Profiles</h2>
          <p className="text-white/40 text-sm mb-4">Select which risk profile Grok Bot should use.</p>
          <div className="space-y-2">
            {reviews.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                  defaultReviewId === r.id
                    ? 'border-accent/30 bg-accent/5'
                    : 'border-border3/30 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-[13px] text-white/80">{r.portfolioName}</span>
                {defaultReviewId === r.id ? (
                  <span className="flex items-center gap-1 text-[11px] text-accent font-medium">
                    <Star className="w-3 h-3" /> Default
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(r.id)}
                    className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
                  >
                    Set as default
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}