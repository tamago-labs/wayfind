'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MessageSquare, PieChart, Compass, Rocket, Bell, Newspaper, List, ChevronDown, Columns2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import type { AppClient } from '@/components/SolanaWalletProvider';

const navItems = [
  { href: '/dashboard', label: 'New Chat', icon: MessageSquare },
  { href: '/dashboard/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/dashboard/explore', label: 'Explore', icon: Compass },
  { href: '/dashboard/pre-ipo', label: 'Pre-IPO', icon: Rocket },
  { href: '/dashboard/compare', label: 'Compare', icon: Columns2 },
  // { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  // { href: '/dashboard/top-news', label: 'Top News', icon: Newspaper },
];

const dataClient = generateClient<Schema>();

export default function Sidebar() {
  const pathname = usePathname();
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const walletAddress = connected ? String(connected.account.address) : null;
  const [chatsOpen, setChatsOpen] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; sessionName: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = () => {
    if (!walletAddress) { setSessions([]); return; }
    setLoading(true);
    dataClient.models.AgentSession.list({
      filter: { walletAddress: { eq: walletAddress } },
    }).then((res) => {
      setSessions((res.data ?? []).map((s) => ({ id: s.id, sessionName: s.sessionName })));
    }).catch(() => {
      setSessions([]);
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchSessions();
  }, [walletAddress, pathname]);

  return (
    <aside className="w-56 h-screen border-r border-border3/50 bg-surface flex flex-col fixed left-0 top-0">
      <Link href="/" className="px-5 h-14 flex items-center gap-2 border-b border-border3/50 hover:bg-white/[0.02] transition-colors">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zenblue to-zenpurple flex items-center justify-center">
          <span className="text-[18px] font-brand">Z</span>
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">Zivic</span>
      </Link>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard/explore"
            ? pathname === item.href || pathname?.startsWith("/dashboard/token/")
            : item.href === "/dashboard/pre-ipo"
              ? pathname === item.href || pathname?.startsWith("/dashboard/pre-ipo/")
              : pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-display font-medium transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-zenblue/25 via-accent/15 to-accent2/20'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
              <span className={isActive ? 'text-white' : ''}>{item.label}</span>
            </Link>
          );
        })}

        {/* Chats accordion */}
        <div>
          <button
            onClick={() => setChatsOpen(!chatsOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-display font-medium text-white/50 hover:text-white hover:bg-white/[0.03] transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="flex-1 text-left">Chats</span>
            <motion.div
              animate={{ rotate: chatsOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3 h-3" />
            </motion.div>
          </button>

          <AnimatePresence>
            {chatsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pl-10 pr-3 py-1 space-y-0.5">
                  {!walletAddress ? (
                    <p className="px-3 py-1.5 text-[11px] text-white/30">Connect wallet to see chats</p>
                  ) : loading ? (
                    <p className="px-3 py-1.5 text-[11px] text-white/30">Loading...</p>
                  ) : sessions.length === 0 ? (
                    <p className="px-3 py-1.5 text-[11px] text-white/30">No chats yet</p>
                  ) : (
                    sessions.map((session) => {
                      const isActive = pathname === `/dashboard/chats/${session.id}`;
                      return (
                        <Link
                          key={session.id}
                          href={`/dashboard/chats/${session.id}`}
                          className={`block px-3 py-1.5 rounded-md text-[12px] font-display truncate transition-colors ${
                            isActive
                              ? 'bg-accent/10 text-accent'
                              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                          }`}
                        >
                          {session.sessionName}
                        </Link>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </aside>
  );
}
