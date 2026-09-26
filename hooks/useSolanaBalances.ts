'use client';

import { useState, useEffect } from 'react';
import { BASE_TOKENS } from '@/lib/tokens/base-tokens';

export function useSolanaBalances(address: string | null) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setBalances({});
      return;
    }

    const fetchBalances = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/solana-balance?address=${address}`);
        const data = await res.json();

        const result: Record<string, string> = {};

        // SOL
        result['SOL'] = String(data?.sol ?? 0);

        // SPL tokens
        for (const token of BASE_TOKENS) {
          if (token.symbol === 'SOL') continue;
          for (const [mint, amount] of Object.entries(data?.spl ?? {})) {
            if (mint === token.address) {
              result[token.symbol] = String(amount);
            }
          }
        }

        setBalances(result);
      } catch (err) {
        console.error('[useSolanaBalances] fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [address]);

  return { balances, loading };
}
