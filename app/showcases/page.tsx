'use client';

import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import PageHero from '@/components/landing/PageHero';

export default function ShowcasesPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero title="Showcases" subtitle="Discover what the community has built with Wayfind" />

        <div className="max-w-[1200px] mx-auto px-6 pb-20">
          <div className="flex flex-col gap-3 mb-8">
            <div className="flex items-center gap-3 opacity-40 pointer-events-none">
              <div className="flex gap-1 bg-white/[0.04] rounded-lg p-1">
                <button className="px-3 py-1.5 text-[13px] rounded-md bg-accent text-white font-medium">Featured</button>
                <button className="px-3 py-1.5 text-[13px] rounded-md text-white/50">Latest</button>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/60">
                All Chains
              </button>
            </div>
            <div className="relative opacity-40 pointer-events-none">
              <input
                type="text"
                placeholder="Search showcases..."
                disabled
                className="w-full pl-9 pr-4 py-2 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30"
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
