'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, X, Download, Check } from 'lucide-react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import PageHero from '@/components/landing/PageHero';
import { templates } from '@/lib/templates';
import { chainIcons } from '@/lib/chains';

const filters = ['Featured', 'Latest'] as const;
type Filter = (typeof filters)[number];

const allChains = Object.keys(chainIcons);

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return 'New';
  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? '1 mo ago' : `${months} mos ago`;
  }
  return '1 yr+ ago';
}

export default function TemplatesPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>('Featured');
  const [search, setSearch] = useState('');
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<typeof templates[number] | null>(null);
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

  useEffect(() => {
    if (activeTemplate) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activeTemplate]);

  let filtered = templates.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.title.toLowerCase().includes(q) &&
        !t.tags.some((tag) => tag.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    if (selectedChain && !t.chains.includes(selectedChain)) {
      return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (activeFilter === 'Featured') {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return (
    <>
      <Header />
      <main>
        <PageHero title="Templates" subtitle="Find bot templates that launch your AI teammate to operate on-chain" />

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
                placeholder="Search templates..."
                className="w-full pl-9 pr-4 py-2 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => setActiveTemplate(t)}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/[0.1] transition-colors group cursor-pointer"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={t.image}
                    alt={t.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {t.featured && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-accent/90 text-white rounded-full backdrop-blur-sm">
                      Featured
                    </span>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    {t.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[11px] font-medium bg-black/50 text-white/80 rounded-full backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-[15px] font-display font-semibold mb-2 leading-snug">{t.title}</h3>
                  <p className="text-[13px] text-white/45 leading-relaxed line-clamp-2">{t.description}</p>

                  <div className="flex items-center gap-2 mt-3 text-[12px] text-white/40">
                    <span>{t.creator}</span>
                    <span className="text-white/15">{'·'}</span>
                    <span>{timeAgo(t.publishedAt)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3">
                    {t.chains.map((chain) => {
                      const icon = chainIcons[chain];
                      return (
                        <div key={chain} className="relative group/icon">
                          {icon ? (
                            <img
                              src={icon}
                              alt={chain}
                              className="w-4 h-4 rounded-full"
                            />
                          ) : (
                            <span className="text-[11px] text-white/50 bg-white/[0.04] px-1.5 py-0.5 rounded">
                              {chain}
                            </span>
                          )}
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-medium bg-white/10 text-white/80 rounded whitespace-nowrap pointer-events-none backdrop-blur-sm opacity-0 group-hover/icon:opacity-100 transition-opacity">
                            {chain}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-[14px] text-white/40 py-16">No templates found.</p>
          )}
        </div>
      </main>
      <Footer />

      <AnimatePresence>
        {activeTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveTemplate(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface border border-white/[0.08] rounded-2xl shadow-2xl"
            >
              <button
                onClick={() => setActiveTemplate(null)}
                className="absolute top-4 right-4 p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 md:p-8">
                <h2 className="text-[22px] font-display font-bold mb-3 pr-10">{activeTemplate.title}</h2>
                <p className="text-[14px] text-white/50 leading-relaxed mb-6">{activeTemplate.description}</p>

                <div className="mb-6">
                  <h4 className="text-[13px] font-medium text-white/70 mb-3">What's included</h4>
                  <ul className="space-y-2">
                    {activeTemplate.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[13px] text-white/50">
                        <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-8">
                  <h4 className="text-[13px] font-medium text-white/70 mb-3">Supported chains</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {activeTemplate.chains.map((chain) => {
                      const icon = chainIcons[chain];
                      return (
                        <div key={chain} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full">
                          {icon ? (
                            <img src={icon} alt={chain} className="w-3.5 h-3.5 rounded-full" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full bg-white/[0.08]" />
                          )}
                          <span className="text-[12px] text-white/70">{chain}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <a
                  href={activeTemplate.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 text-[14px] font-medium bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
