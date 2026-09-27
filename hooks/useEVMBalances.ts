'use client';

import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { BASE_TOKENS } from '@/lib/tokens/base-tokens';
import { SUPPORTED_CHAINS } from '@/lib/chains';

export function useEVMBalances(address: string | null, chainId: number | null) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!address || !chainId) {
      setBalances({});
      fetchedRef.current = null;
      return;
    }
    if (fetchedRef.current === `${chainId}:${address}`) return;
    fetchedRef.current = `${chainId}:${address}`;

    const fetchBalances = async () => {
      setLoading(true);
      try {
        const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
        if (!chain) { setBalances({}); return; }

        const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
        const result: Record<string, string> = {};

        // Native balance
        const nativeBal = await provider.getBalance(address);
        result[chain.nativeCurrency.symbol] = ethers.formatUnits(nativeBal, chain.nativeCurrency.decimals);

        // ERC-20 tokens
        const erc20Abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
        const iface = new ethers.Interface(erc20Abi);

        await Promise.all(
          BASE_TOKENS.map(async (token) => {
            const tokenAddr = token.addresses[chain.shortName.toLowerCase() as keyof typeof token.addresses];
            if (!tokenAddr || token.symbol === chain.nativeCurrency.symbol) return;
            try {
              const callData = iface.encodeFunctionData('balanceOf', [address]);
              const raw = await provider.call({ to: tokenAddr, data: callData });
              const decoded = iface.decodeFunctionResult('balanceOf', raw);
              const balance = BigInt(decoded[0]);
              if (balance === BigInt(0)) return;

              let decimals = 18;
              try {
                const decData = await provider.call({ to: tokenAddr, data: '0x313ce567' });
                decimals = Number(ethers.AbiCoder.defaultAbiCoder().decode(['uint8'], decData)[0]);
              } catch { /* default 18 */ }

              result[token.symbol] = ethers.formatUnits(balance, decimals);
            } catch { /* skip token */ }
          })
        );

        setBalances(result);
      } catch (err) {
        console.error('[useEVMBalances] fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [address, chainId]);

  return { balances, loading };
}
