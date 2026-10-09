'use client';

import Section from './Section';

export default function Problem() {
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-12 items-start">
          {/* Left — 40% */}
          <div className="md:col-span-2">
            <Section>
              <p className="text-[13px] text-accent uppercase tracking-wider mb-6">The Problem</p>
            </Section>
            <Section>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                Using AI to Trade Tokenized Stocks Is Still Incomplete
              </h2>
            </Section>
          </div>

          {/* Right — 60% */}
          <div className="md:col-span-3">
            <Section>
              <p className="text-[15px] text-white/50 leading-relaxed">
                One company like <span className="text-accent font-semibold">Tesla</span> can have multiple onchain representations — <span className="text-accent font-semibold">TSLAx</span>, <span className="text-accent font-semibold">TSLAon</span>, <span className="text-accent font-semibold">rTSLA</span>, and more. Each can have different prices, liquidity, issuers, and onchain dynamics. Knowing the stock isn't enough.
              </p>
            </Section>

            <Section>
              <p className="mt-6 text-lg md:text-xl font-display font-semibold text-white/80 leading-snug">
                Tokenized stock trading lacks a data layer for AI until now.
              </p>
            </Section>

            <Section>
              <p className="mt-6 text-[15px] text-white/50 leading-relaxed">
                Wayfind provides the data layer and trading tools for AI agents. Connect a wallet, get <span className="text-accent font-semibold">personalized risk intelligence</span>, and let your bot trade with context — see the risks, then <span className="text-accent font-semibold">rebalance</span> or put assets to work.
              </p>
            </Section>
          </div>
        </div>
      </div>
    </section>
  );
}
