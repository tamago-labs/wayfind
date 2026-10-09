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
                Using AI to trade tokenized stocks is still incomplete
              </h2>
            </Section>
          </div>

          {/* Right — 60% */}
          <div className="md:col-span-3">
            <Section>
              <p className="text-[15px] text-white/50 leading-relaxed">
                AI agents can execute trades but lack the data and risk intelligence to evaluate <span className="text-accent font-semibold">tokenized stocks</span> — real companies with revenue, earnings, valuation, and onchain dynamics behind them.
              </p>
            </Section>

            <Section>
              <p className="mt-6 text-lg md:text-xl font-display font-semibold text-white/80 leading-snug">
                The data layer for AI trading doesn't exist yet.
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
