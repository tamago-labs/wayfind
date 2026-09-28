'use client';

import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { SUPPORTED_CHAINS } from '@/lib/chains';
import rwaList from '@/lib/data/rwa-v1-list.json';
import { usePrices } from '@/contexts/PriceContext';

const dataClient = generateClient<Schema>();

export interface TrackedToken {
  mint: string;
  tokenAddress: string;
  symbol: string;
  name: string;
  balance: number;
  price: number;
  value: number;
  change: number;
  type: 'tokenized' | 'pre-ipo';
  slug: string;
  crypto_id?: string;
  industry?: string;
  image: string;
}

type ChainName = 'ethereum' | 'bnb' | 'arbitrum' | 'xlayer';

const ERC20_ABI = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];

function buildTokenMetaIndex(chain: ChainName) {
  const index: Record<string, { symbol: string; name: string; slug: string; crypto_id?: string; industry?: string; image?: string; type: 'tokenized' | 'pre-ipo' }> = {};
  for (const asset of (rwaList as any).assets ?? []) {
    for (const token of asset.tokens ?? []) {
      const addr = token.addresses?.[chain];
      if (addr) {
        index[addr.toLowerCase()] = {
          symbol: token.symbol ?? asset.symbol,
          name: token.name ?? asset.name,
          slug: asset.slug ?? '',
          crypto_id: token.crypto_id != null ? String(token.crypto_id) : undefined,
          industry: asset.industry ?? undefined,
          image: token.logo ?? asset.logo ?? undefined,
          type: 'tokenized',
        };
      }
    }
  }
  return index;
}

export function useEVMTokens(walletAddress: string | null, profileId: string | null, chainId: number | null, refreshKey: number = 0) {
  const [tokens, setTokens] = useState<TrackedToken[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<string | null>(null);
  const { prices } = usePrices();

  useEffect(() => {
    if (!walletAddress || !profileId || !chainId) {
      setTokens([]);
      fetchedRef.current = null;
      return;
    }
    const key = `${chainId}:${walletAddress}:${refreshKey}`;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    const chainConfig = SUPPORTED_CHAINS.find((c) => c.id === chainId);
    if (!chainConfig) { setTokens([]); return; }

    const chainName = chainConfig.shortName === 'BNB' ? 'bnb'
      : chainConfig.shortName === 'ETH' ? 'ethereum'
      : chainConfig.shortName === 'ARB' ? 'arbitrum'
      : 'xlayer';

    const fetchTokens = async () => {
      setLoading(true);
      try {
        // 1. Get tracked tokens from DB
        const registryRes = await dataClient.models.UserTokenRegistry.list({
          filter: { userProfileId: { eq: profileId }, chain: { eq: chainName } },
        });
        const tracked = registryRes.data ?? [];
        if (tracked.length === 0) { setTokens([]); return; }

        // 2. Fetch real balances via ethers
        const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
        const iface = new ethers.Interface(ERC20_ABI);
        const metaIndex = buildTokenMetaIndex(chainName as ChainName);

        const priceMap = new Map(prices.map((p) => [p.token_symbol, p]));

        const results = await Promise.all(
          tracked.map(async (t) => {
            try {
              const callData = iface.encodeFunctionData('balanceOf', [walletAddress]);
              const raw = await provider.call({ to: t.tokenAddress, data: callData });
              const decoded = iface.decodeFunctionResult('balanceOf', raw);
              const balance = BigInt(decoded[0]);
              if (balance === BigInt(0)) return null;

              let decimals = t.decimals ?? 18;
              if (decimals == null) {
                try {
                  const decData = await provider.call({ to: t.tokenAddress, data: '0x313ce567' });
                  decimals = Number(ethers.AbiCoder.defaultAbiCoder().decode(['uint8'], decData)[0]);
                } catch { decimals = 18; }
              }

              const bal = Number(ethers.formatUnits(balance, decimals));
              const meta = metaIndex[t.tokenAddress.toLowerCase()];
              const livePrice = priceMap.get(t.symbol);
              const price = livePrice?.price ?? 0;
              const change = livePrice?.percent_24h ?? 0;

              return {
                mint: t.tokenAddress,
                tokenAddress: t.tokenAddress,
                symbol: t.symbol,
                name: meta?.name ?? t.name ?? t.symbol,
                balance: bal,
                price,
                value: bal * price,
                change,
                type: (meta?.type ?? 'tokenized') as 'tokenized' | 'pre-ipo',
                slug: meta?.slug ?? '',
                crypto_id: meta?.crypto_id,
                industry: meta?.industry,
                image: meta?.image ?? '',
              } as TrackedToken;
            } catch {
              return null;
            }
          })
        );

        const valid = results.filter((r): r is TrackedToken => r !== null);
        valid.sort((a, b) => b.value - a.value);
        setTokens(valid);
      } catch (err) {
        console.error('[useEVMTokens] fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [walletAddress, profileId, chainId, prices, refreshKey]);

  return { tokens, loading };
}
