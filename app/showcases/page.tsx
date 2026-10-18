'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import PageHero from '@/components/landing/PageHero';
import { chainIcons } from '@/lib/chains';

const filters = ['Featured', 'Latest'] as const;
type Filter = (typeof filters)[number];
const allChains = Object.keys(chainIcons);

export default function ShowcasesPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>('Featured');
  const [search, setSearch] = useState('');
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setChainDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      <Header />
      <main>
        <PageHero title="Showcases" subtitle="Discover what the community has built with Wayfind" />

        <div className="max-w-[1200px] mx-auto px-6 pb-20">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-white/[0.04] rounded-lg p-1">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1.5 text-[13px] rounded-md transition-colors ${
                      activeFilter === f
                        ? 'bg-accent text-white font-medium'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setChainDropdownOpen(!chainDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/60 hover:border-white/[0.12] transition-colors"
                >
                  {selectedChain && chainIcons[selectedChain] && (
                    <img src={chainIcons[selectedChain]} alt={selectedChain} className="w-4 h-4 rounded-full" />
                  )}
                  <span>{selectedChain || 'Chains'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${chainDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {chainDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-52 max-h-72 overflow-y-auto bg-surface border border-white/[0.08] rounded-lg shadow-xl z-20 py-1">
                    <button
                      onClick={() => { setSelectedChain(null); setChainDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-md transition-colors ${
                        !selectedChain ? 'bg-accent/10 text-white' : 'text-white/50 hover:bg-white/[0.04]'
                      }`}
                    >
                      All Chains
                    </button>
                    {allChains.map((chain) => {
                      const icon = chainIcons[chain];
                      const isSelected = selectedChain === chain;
                      return (
                        <button
                          key={chain}
                          onClick={() => { setSelectedChain(chain); setChainDropdownOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-md transition-colors ${
                            isSelected ? 'bg-accent/10 text-white' : 'text-white/50 hover:bg-white/[0.04]'
                          }`}
                        >
                          {icon ? (
                            <img src={icon} alt={chain} className="w-4 h-4 rounded-full" />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-white/[0.06]" />
                          )}
                          <span>{chain}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="relative flex-1 md:max-w-xs md:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search showcases..."
                className="w-full pl-9 pr-4 py-2 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h3 className="text-[18px] font-display font-semibold mb-2">No showcases yet</h3>
            <p className="text-[14px] text-white/40 max-w-md mb-6">
              Be the first to share your Web3 service. Find a template, build your bot, and publish it here for the community to discover.
            </p>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
            >
              Browse Templates
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
