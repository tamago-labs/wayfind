'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useWallet } from '@/contexts/WalletContext';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { Copy, Check, Key } from 'lucide-react';
import type { AppClient } from '@/components/SolanaWalletProvider';

const dataClient = generateClient<Schema>();

export default function ApiKeysPage() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const { address: evmAddress } = useWallet();

  const solanaAddress = connected ? String(connected.account.address) : null;
  const walletAddress = solanaAddress || evmAddress;

  const [profileId, setProfileId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Array<{ id: string; portfolioName: string }>>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<string>('');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) { setProfileId(null); return; }
    void (async () => {
      try {
        const { data: profiles } = await dataClient.models.UserProfile.list({
          filter: { walletAddress: { eq: walletAddress } },
        });
        if (profiles.length > 0) {
          setProfileId(profiles[0].id);
        } else {
          const { data: created } = await dataClient.models.UserProfile.create({
            walletAddress,
            credits: 1000,
          });
          if (created) setProfileId(created.id);
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

  const handleCreateKey = async () => {
    if (!selectedReviewId) return;
    setLoading(true);
    try {
      const { data } = await dataClient.models.ApiKey.create({
        savedReviewId: selectedReviewId,
        active: true,
        totalRequests: 0,
      });
      if (data) {
        setApiKey(data.id);
      }
    } catch {}
    setLoading(false);
  };

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-white tracking-tight mb-3">API Keys</h1>
      <p className="text-white/50 text-sm leading-relaxed mb-8">
        Create API keys for Grok Bot integration. Select a saved risk profile to generate a key.
      </p>

      <div className="bg-white/[0.03] border border-border3 rounded-xl p-6 mb-6 space-y-4">
        <div>
          <label className="block text-[12px] font-medium text-white/50 mb-2">Select Risk Profile</label>
          <select
            value={selectedReviewId}
            onChange={(e) => setSelectedReviewId(e.target.value)}
            className="w-full bg-surface border border-border3 rounded-lg px-3 py-2.5 text-[13px] text-white/80 outline-none focus:border-accent/50 transition-colors cursor-pointer"
          >
            <option value="">Choose a saved review…</option>
            {reviews.map((r) => (
              <option key={r.id} value={r.id}>{r.portfolioName}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreateKey}
          disabled={!selectedReviewId || loading}
          className="flex items-center gap-2 bg-gradient-to-r from-zenblue to-zenpurple text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Key className="w-4 h-4" />
          Create API Key
        </button>
      </div>

      {apiKey && (
        <div className="bg-white/[0.03] border border-border3 rounded-xl p-6">
          <h2 className="font-display font-semibold text-white text-lg mb-3">Your API Key</h2>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-black/30 border border-border3 rounded-lg px-4 py-3 text-[13px] font-mono text-accent truncate">
              {apiKey}
            </code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-white/[0.06] border border-border3 text-white/70 text-sm font-medium px-4 py-3 rounded-lg hover:bg-white/[0.1] transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}