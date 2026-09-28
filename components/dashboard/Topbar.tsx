"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { Wallet, ChevronDown, ExternalLink } from "lucide-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import type { AppClient } from "../SolanaWalletProvider";
import { getGradient } from "@/lib/wallet";
import { WalletModal } from "./WalletModal";
import { ConnectedPopover } from "./ConnectedPopover";
import { CreditsModal } from "./CreditsModal";
import { useWallet } from "@/contexts/WalletContext";
import { SUPPORTED_CHAINS, type ChainConfig } from "@/lib/chains";
import Link from "next/link";
import { usePathname } from "next/navigation";
import listData from "@/lib/data/rwa-v1-list.json";
import { usePrices } from "@/contexts/PriceContext";

const tokenMetaMap = new Map<string, { logo: string | null; name: string; symbol: string; rwaRank: number | null }>();
for (const asset of (listData as any).assets) {
  for (const token of asset.tokens ?? []) {
    if (!tokenMetaMap.has(token.symbol)) {
      tokenMetaMap.set(token.symbol, {
        logo: token.logo ?? null,
        name: token.name,
        symbol: token.symbol,
        rwaRank: asset.rwa_rank ?? null,
      });
    }
  }
}

const CHAIN_LOGOS: Record<number, string> = {
  5426: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
  1027: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  1839: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
  11841: "https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png",
  3897: "https://s2.coinmarketcap.com/static/img/coins/64x64/3897.png",
};

const dataClient = generateClient<Schema>();

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "New Portfolio Review",
  "/dashboard/portfolio": "Portfolio Overview",
  "/dashboard/explore": "Explore Tokenized Stocks Across Web3",
  "/dashboard/pre-ipo": "Pre-IPO Markets via PreStocks",
  "/dashboard/alerts": "Stay Notified",
  "/dashboard/strategies": "Strategies",
};

export default function Topbar() {
  const pathname = usePathname();
  const { prices } = usePrices();
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const { type: walletType, address: evmAddress, disconnect: disconnectEVM, chain, switchToChain, setSolanaWallet } = useWallet();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);

  const solanaAddress = connected ? String(connected.account.address) : null;
  const gradient = solanaAddress ? getGradient(solanaAddress) : null;
  const displayAddress = solanaAddress || evmAddress;
  const isConnected = !!solanaAddress || (walletType === "evm" && !!evmAddress);
  const currentEVMChain = walletType === "evm" && !solanaAddress ? (chain ?? SUPPORTED_CHAINS[0]) : null;

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when wallet disconnects
  useEffect(() => {
    if (!displayAddress) setPopoverOpen(false);
  }, [displayAddress]);

  // Click-outside to close popover
  useEffect(() => {
    if (!popoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  const handleDisconnect = useCallback(() => {
    setPopoverOpen(false);
    disconnectEVM();
  }, [disconnectEVM]);

  useEffect(() => {
    if (solanaAddress) {
      setSolanaWallet(solanaAddress);
    }
  }, [solanaAddress]);

  useEffect(() => {
    if (!isConnected) { setCredits(null); return; }
    void (async () => {
      try {
        const { data: profiles } = await dataClient.models.UserProfile.list({
          filter: { walletAddress: { eq: displayAddress } },
        });
        setCredits(profiles[0]?.credits ?? null);
      } catch { setCredits(null); }
    })();
  }, [isConnected, displayAddress, creditsModalOpen, pathname]);

  const tokenMatch = pathname.match(/^\/dashboard\/token\/([^/]+)\/([^/]+)$/);
  const tokenSlug = tokenMatch?.[1];
  const tokenCryptoId = tokenMatch?.[2];
  const assetData = (listData as any).assets.find((a: any) => a.slug === tokenSlug);
  const tokenData = assetData?.tokens?.find((t: any) => String(t.crypto_id) === tokenCryptoId);
  const otherTokens = assetData?.tokens?.filter((t: any) => String(t.crypto_id) !== tokenCryptoId) ?? [];
  const tokenPrice = tokenData ? prices.find((p) => p.token_symbol === tokenData.symbol) : undefined;

  const tokenMeta = tokenData ? {
    logo: tokenData.logo ?? null,
    name: tokenData.name,
    symbol: tokenData.symbol,
    rwaRank: assetData?.rwa_rank ?? null,
    mint: tokenData.mint ?? null,
    assetSymbol: assetData?.symbol ?? null,
    assetSlug: assetData?.slug ?? null,
  } : null;

  return (
    <header className="h-14 border-b border-border3/50 bg-surface flex items-center justify-between px-6 pl-0 sticky top-0 z-10">
      {PAGE_TITLES[pathname] ? (
        <motion.h1
          key={pathname}
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-lg font-display font-semibold text-white/70 px-2 ml-5"
        >
          {PAGE_TITLES[pathname]}
        </motion.h1>
      ) : tokenMeta ? (
        <motion.div
          key={pathname}
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-center gap-3 px-2 ml-5 overflow-hidden"
        >
          {tokenMeta.logo ? (
            <img src={tokenMeta.logo} alt="" className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/40">
              {tokenMeta.symbol?.slice(0, 2)}
            </div>
          )}
          <span className="text-sm font-semibold text-white/90 cursor-default" title={tokenMeta.name}>{tokenMeta.symbol}</span>
          {tokenMeta.rwaRank != null && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40 cursor-default" title={`Ranked #${tokenMeta.rwaRank} by CoinMarketCap`}>
              #{tokenMeta.rwaRank}
            </span>
          )}
          {tokenPrice?.price != null && (
            <span className="text-sm font-semibold text-white/80 ml-2">
              ${tokenPrice.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          <div className="flex items-center gap-3 text-[11px]">
            {tokenPrice?.percent_24h != null && (
              <span className="flex items-center gap-0.5">
                <span className="text-white/25">24h</span>
                <span className={`font-medium ${tokenPrice.percent_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tokenPrice.percent_24h >= 0 ? "+" : ""}{tokenPrice.percent_24h.toFixed(2)}%
                </span>
              </span>
            )}
            {tokenPrice?.percent_7d != null && (
              <span className="flex items-center gap-0.5">
                <span className="text-white/25">7d</span>
                <span className={`font-medium ${tokenPrice.percent_7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tokenPrice.percent_7d >= 0 ? "+" : ""}{tokenPrice.percent_7d.toFixed(2)}%
                </span>
              </span>
            )}
            {tokenPrice?.percent_30d != null && (
              <span className="flex items-center gap-0.5">
                <span className="text-white/25">30d</span>
                <span className={`font-medium ${tokenPrice.percent_30d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tokenPrice.percent_30d >= 0 ? "+" : ""}{tokenPrice.percent_30d.toFixed(2)}%
                </span>
              </span>
            )}
          </div>
          {tokenMeta.mint && (
            <a
              href={`https://solscan.io/token/${tokenMeta.mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-colors ml-3"
              title={tokenMeta.mint}
            >
              <span className="text-[11px] font-mono text-white/50">{tokenMeta.mint.slice(0, 6)}...{tokenMeta.mint.slice(-4)}</span>
              <ExternalLink className="w-3 h-3 text-white/30" />
            </a>
          )}
          {otherTokens.length > 0 && (
            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-white/[0.06]">
              <span className="text-[10px] text-white/25 shrink-0">Other {tokenMeta.assetSymbol}</span>
              {otherTokens.map((ot: any) => {
                const otPrice = prices.find((p) => p.token_symbol === ot.symbol);
                return (
                  <Link
                    key={ot.crypto_id}
                    href={`/dashboard/token/${tokenMeta.assetSlug}/${ot.crypto_id}`}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.02] border border-border3/30 shrink-0 hover:border-white/10 transition-colors"
                  >
                    {ot.logo ? (
                      <img src={ot.logo} alt="" className="w-4 h-4 rounded-full" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-bold text-white/40">
                        {ot.symbol?.slice(0, 2)}
                      </div>
                    )}
                    <span className="text-[11px] font-medium text-white/70">{ot.symbol}</span>
                    {otPrice?.price != null && (
                      <span className="text-[11px] font-semibold text-white/90">
                        ${otPrice.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {otPrice?.percent_24h != null && (
                      <span className={`text-[10px] font-medium ${otPrice.percent_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {otPrice.percent_24h >= 0 ? "+" : ""}{otPrice.percent_24h.toFixed(1)}%
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
      ) : null}

      <div className="flex items-center gap-3 relative shrink-0 ml-2">
        <button
          onClick={() => setCreditsModalOpen(true)}
          className="text-[13px] flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-white/80 font-medium">{credits !== null ? credits.toLocaleString() : "—"}</span>
          <span className="text-white/30">credits</span>
        </button>

         {isConnected ? (
          <>
            <div className="relative">
              <button
                onClick={() => walletType === "evm" && setNetworkDropdownOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium border transition-colors ${
                  walletType === "evm"
                    ? "border-border3/50 text-white/70 hover:border-accent/40 hover:text-white cursor-pointer"
                    : "border-border3/30 text-white/30 cursor-default"
                }`}
                title={walletType === "solana" ? "Solana" : currentEVMChain?.name}
              >
                <img
                  src={walletType === "solana" ? CHAIN_LOGOS[5426] : CHAIN_LOGOS[currentEVMChain?.cmcId ?? 1027]}
                  alt=""
                  className="w-4 h-4 rounded-full shrink-0"
                />
                {walletType === "solana" ? "Solana" : currentEVMChain?.name ?? "EVM"}
                {walletType === "evm" && <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${networkDropdownOpen ? "rotate-180" : ""}`} />}
              </button>
              <AnimatePresence>
                {networkDropdownOpen && walletType === "evm" && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full right-0 mt-1 bg-surface border border-border3/50 rounded-lg overflow-hidden min-w-[140px] z-20"
                  >
                    {SUPPORTED_CHAINS.map((c: ChainConfig) => (
                      <button
                        key={c.id}
                        onClick={() => { void switchToChain(c.id); setNetworkDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/[0.04] transition-colors ${
                          currentEVMChain?.id === c.id ? "text-accent" : "text-white/70"
                        }`}
                      >
                      <img
                        src={CHAIN_LOGOS[c.cmcId]}
                        alt=""
                        className="w-4 h-4 rounded-full shrink-0"
                      />
                      {c.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
             <div ref={popoverRef} className="relative flex items-center">
             <button onClick={() => setPopoverOpen((v) => !v)} className="relative flex items-center gap-2">
             <div
               style={{ background: solanaAddress ? `linear-gradient(135deg, ${gradient?.from}, ${gradient?.to})` : "#627EEA" }}
               className="w-7 h-7 rounded-full flex items-center justify-center"
             >
               <span className="text-[10px] font-bold text-white/90">
                 {displayAddress.slice(2, 4).toUpperCase()}
               </span>
             </div>
              <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${popoverOpen ? "rotate-180" : ""}`} />
           </button>

           <AnimatePresence>
             {popoverOpen && displayAddress && (
               <ConnectedPopover
                 address={displayAddress}
                 onDisconnect={walletType === "evm" ? handleDisconnect : undefined}
                 isEVM={walletType === "evm"}
               />
             )}
           </AnimatePresence>
           </div>
           </>
         ) : (
           <button
             onClick={() => setWalletModalOpen(true)}
             className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-accent text-white hover:bg-accent/80 transition-colors"
           >
             <Wallet className="w-3.5 h-3.5" />
             Connect Wallet
           </button>
         )}
       </div>

      <WalletModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
      <CreditsModal open={creditsModalOpen} onClose={() => setCreditsModalOpen(false)} />
    </header>
  );
}
