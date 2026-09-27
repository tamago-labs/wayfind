'use client';

import { useSolanaBalances } from '@/hooks/useSolanaBalances';
import { useKnownTokens } from '@/hooks/useKnownTokens';
import PortfolioStats from '@/components/dashboard/portfolio/PortfolioStats';
import HoldingsList from '@/components/dashboard/portfolio/HoldingsList';
import { useWallet } from '@/contexts/WalletContext';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { useClient } from '@solana/react';
import type { AppClient } from '@/components/SolanaWalletProvider';

export default function Portfolio() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const solanaAddress = connected ? String(connected.account.address) : null;
  const { address: evmAddress } = useWallet();

  const walletAddress = solanaAddress || evmAddress;

  const { balances, loading } = useSolanaBalances(walletAddress);
  const { tokens: knownTokens, loading: knownLoading } = useKnownTokens(walletAddress);

  return (
    <div className="flex gap-4 h-[calc(100vh-6.5rem)] min-h-0">
      <PortfolioStats
        balances={balances}
        knownTokens={knownTokens}
        loading={loading}
        knownLoading={knownLoading}
      />
      <div className="flex-1 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col min-h-0 overflow-hidden">
        <HoldingsList
          balances={balances}
          knownTokens={knownTokens}
          loading={loading}
          knownLoading={knownLoading}
          walletAddress={walletAddress}
        />
      </div>
    </div>
  );
}
