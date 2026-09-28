'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSolanaBalances } from '@/hooks/useSolanaBalances';
import { useEVMBalances } from '@/hooks/useEVMBalances';
import { useKnownTokens } from '@/hooks/useKnownTokens';
import { useEVMTokens } from '@/hooks/useEVMTokens';
import PortfolioStats, { type PortfolioInfo } from '@/components/dashboard/portfolio/PortfolioStats';
import HoldingsList from '@/components/dashboard/portfolio/HoldingsList';
import AddTokenModal from '@/components/dashboard/portfolio/AddTokenModal';
import { useWallet } from '@/contexts/WalletContext';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { useClient } from '@solana/react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import type { AppClient } from '@/components/SolanaWalletProvider';

const dataClient = generateClient<Schema>();

export default function Portfolio() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const { type, address: evmAddress, chainId } = useWallet();

  const solanaAddress = connected ? String(connected.account.address) : null;
  const isSolana = !!solanaAddress;
  const isEVM = type === 'evm' && !!evmAddress;

  const walletAddress = solanaAddress || evmAddress;
  const [profileId, setProfileId] = useState<string | null>(null);
  const [addTokenOpen, setAddTokenOpen] = useState(false);
  const [registryVersion, setRegistryVersion] = useState(0);

  // Portfolio management
  const [portfolios, setPortfolios] = useState<PortfolioInfo[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [simTokens, setSimTokens] = useState<any[]>([]);

  // Load or create UserProfile
  useEffect(() => {
    if (!walletAddress) { setProfileId(null); return; }
    let cancelled = false;
    void (async () => {
      try {
        const { data: profiles } = await dataClient.models.UserProfile.list({
          filter: { walletAddress: { eq: walletAddress } },
        });
        if (cancelled) return;
        if (profiles.length > 0) {
          setProfileId(profiles[0].id);
        } else {
          const { data: created } = await dataClient.models.UserProfile.create({
            walletAddress,
            credits: 100,
          });
          if (!cancelled && created) setProfileId(created.id);
        }
      } catch (err) {
        console.error('[Portfolio] profile load failed:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [walletAddress]);

  // Load portfolios list
  const loadPortfolios = useCallback(async () => {
    if (!profileId) { setPortfolios([]); return; }
    try {
      const { data } = await dataClient.models.Portfolio.list({
        filter: { userProfileId: { eq: profileId } },
      });
      setPortfolios((data ?? []).map((p) => ({ id: p.id, name: p.name })));
    } catch (err) {
      console.error('[Portfolio] load portfolios failed:', err);
    }
  }, [profileId]);

  useEffect(() => { void loadPortfolios(); }, [loadPortfolios]);

  // Load simulated portfolio tokens
  useEffect(() => {
    if (!selectedPortfolioId || !profileId) { setSimTokens([]); return; }
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await dataClient.models.PortfolioToken.list({
          filter: { portfolioId: { eq: selectedPortfolioId } },
        });
        if (!cancelled) setSimTokens(data ?? []);
      } catch (err) {
        console.error('[Portfolio] load sim tokens failed:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedPortfolioId, profileId, registryVersion]);

  const handleCreatePortfolio = useCallback(async (name: string) => {
    if (!profileId) return;
    try {
      const { data } = await dataClient.models.Portfolio.create({
        userProfileId: profileId,
        name,
      });
      if (data) {
        setSelectedPortfolioId(data.id);
        await loadPortfolios();
      }
    } catch (err) {
      console.error('[Portfolio] create portfolio failed:', err);
    }
  }, [profileId, loadPortfolios]);

  const handleDeletePortfolio = useCallback(async (id: string) => {
    try {
      // Delete tokens in portfolio first
      const { data: tokens } = await dataClient.models.PortfolioToken.list({
        filter: { portfolioId: { eq: id } },
      });
      for (const t of tokens ?? []) {
        await dataClient.models.PortfolioToken.delete({ id: t.id });
      }
      await dataClient.models.Portfolio.delete({ id });
      if (selectedPortfolioId === id) setSelectedPortfolioId(null);
      await loadPortfolios();
    } catch (err) {
      console.error('[Portfolio] delete portfolio failed:', err);
    }
  }, [selectedPortfolioId, loadPortfolios]);

  const { balances: solanaBalances, loading: solanaLoading } = useSolanaBalances(isSolana ? solanaAddress : null);
  const { balances: evmBalances, loading: evmLoading } = useEVMBalances(isEVM ? evmAddress : null, isEVM ? (chainId ?? null) : null);
  const { tokens: solanaKnownTokens, loading: solanaKnownLoading } = useKnownTokens(isSolana ? walletAddress : null);
  const { tokens: evmTokens, loading: evmTokensLoading } = useEVMTokens(
    isEVM ? evmAddress : null,
    isEVM ? profileId : null,
    isEVM ? (chainId ?? null) : null,
    registryVersion
  );

  const isSimulated = !!selectedPortfolioId;

  const balances = isSimulated ? {} : (isEVM ? evmBalances : solanaBalances);
  const loading = isSimulated ? false : (isEVM ? evmLoading : solanaLoading);
  const knownTokens = isSimulated
    ? simTokens.map((t) => ({ ...t, _simulated: true }))
    : (isEVM ? evmTokens : solanaKnownTokens);
  const knownLoading = isSimulated ? false : (isEVM ? evmTokensLoading : solanaKnownLoading);

  const handleTokenAdded = useCallback(() => {
    setRegistryVersion((v) => v + 1);
  }, []);

  return (
    <div className="flex gap-4 h-[calc(100vh-6.5rem)] min-h-0">
      <PortfolioStats
        balances={balances}
        knownTokens={knownTokens}
        loading={loading}
        knownLoading={knownLoading}
        walletAddress={walletAddress}
        walletType={type}
        portfolios={portfolios}
        selectedPortfolioId={selectedPortfolioId}
        onSelectPortfolio={setSelectedPortfolioId}
        onCreatePortfolio={handleCreatePortfolio}
        onDeletePortfolio={handleDeletePortfolio}
      />
      <div className="flex-1 bg-surface border border-border3/50 rounded-xl p-5 flex flex-col min-h-0 overflow-hidden">
        <HoldingsList
          balances={balances}
          knownTokens={knownTokens}
          loading={loading}
          knownLoading={knownLoading}
          walletAddress={walletAddress}
          walletType={type}
          showTrackTokens={isEVM && !isSimulated}
          onTrackTokens={() => setAddTokenOpen(true)}
        />
      </div>
      <AddTokenModal
        open={addTokenOpen}
        onClose={() => setAddTokenOpen(false)}
        profileId={profileId}
        walletAddress={walletAddress}
        chainId={isEVM ? (chainId ?? null) : null}
        onAdded={handleTokenAdded}
      />
    </div>
  );
}
