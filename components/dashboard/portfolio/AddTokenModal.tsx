'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus, Check } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import rwaList from '@/lib/data/rwa-v1-list.json';
import { SUPPORTED_CHAINS } from '@/lib/chains';

const dataClient = generateClient<Schema>();

interface AddTokenModalProps {
  open: boolean;
  onClose: () => void;
  profileId: string | null;
  walletAddress: string | null;
  chainId: number | null;
  onAdded: () => void;
}

type ChainName = 'ethereum' | 'bnb' | 'arbitrum' | 'xlayer';

export default function AddTokenModal({ open, onClose, profileId, walletAddress, chainId, onAdded }: AddTokenModalProps) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const chainConfig = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  const chainName: ChainName | null = chainConfig
    ? chainConfig.shortName === 'BNB' ? 'bnb'
      : chainConfig.shortName === 'ETH' ? 'ethereum'
      : chainConfig.shortName === 'ARB' ? 'arbitrum'
      : 'xlayer'
    : null;

  const availableTokens = useMemo(() => {
    if (!chainName) return [];
    const list: { symbol: string; name: string; address: string; logo: string | null; slug: string; crypto_id?: string }[] = [];
    for (const asset of (rwaList as any).assets ?? []) {
      for (const token of asset.tokens ?? []) {
        const addr = token.addresses?.[chainName];
        if (addr) {
          list.push({
            symbol: token.symbol ?? asset.symbol,
            name: token.name ?? asset.name,
            address: addr,
            logo: token.logo ?? asset.logo ?? null,
            slug: asset.slug ?? '',
            crypto_id: token.crypto_id != null ? String(token.crypto_id) : undefined,
          });
        }
      }
    }
    return list;
  }, [chainName]);

  const filtered = useMemo(() => {
    if (!search) return availableTokens;
    const q = search.toLowerCase();
    return availableTokens.filter(
      (t) => t.symbol?.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q)
    );
  }, [availableTokens, search]);

  const handleAdd = async (token: typeof availableTokens[0]) => {
    if (!profileId || !chainName) return;
    setAdding(token.address);
    try {
      await dataClient.models.UserTokenRegistry.create({
        userProfileId: profileId,
        tokenAddress: token.address,
        symbol: token.symbol,
        name: token.name,
        chain: chainName,
      });
      setAdded((prev) => new Set(prev).add(token.address));
      onAdded();
    } catch (err) {
      console.error('[AddTokenModal] failed to add token:', err);
    } finally {
      setAdding(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-surface border border-border3/50 rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border3/30">
              <h3 className="text-[14px] font-semibold">Track Tokens on {chainConfig?.name}</h3>
              <button onClick={onClose} className="p-1 rounded-md text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search token…"
                  className="w-full bg-white/[0.03] border border-border3/40 rounded-lg pl-9 pr-3 py-2 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-accent/50 transition-colors"
                />
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto px-2 pb-2">
              {filtered.length === 0 ? (
                <p className="text-[12px] text-white/30 px-4 py-6 text-center">
                  No tokens available on {chainConfig?.name ?? 'this chain'}.
                </p>
              ) : (
                filtered.map((t) => {
                  const isAdded = added.has(t.address);
                  return (
                    <div
                      key={t.address}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
                    >
                      {t.logo ? (
                        <img src={t.logo} alt="" className="w-7 h-7 rounded-full shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white/40 shrink-0">
                          {t.symbol?.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-white/80">{t.symbol}</p>
                        <p className="text-[11px] text-white/40 truncate">{t.name}</p>
                      </div>
                      <button
                        onClick={() => !isAdded && !adding && handleAdd(t)}
                        disabled={isAdded || adding === t.address}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                          isAdded
                            ? 'bg-accent/20 text-accent cursor-default'
                            : 'border border-border3/50 text-white/60 hover:border-accent/40 hover:text-white cursor-pointer'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3" /> Tracked
                          </>
                        ) : adding === t.address ? (
                          'Adding…'
                        ) : (
                          <>
                            <Plus className="w-3 h-3" /> Track
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
