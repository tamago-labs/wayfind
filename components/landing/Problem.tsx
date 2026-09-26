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
                Crypto habits meet real-world assets
              </h2>
            </Section>
          </div>

          {/* Right — 60% */}
          <div className="md:col-span-3">
            <Section>
              <p className="text-[15px] text-white/50 leading-relaxed">
                Crypto markets have trained investors to make decisions around price, liquidity, and narrative. But a <span className="text-accent font-semibold">tokenized stock</span> represents exposure to a <span className="text-accent font-semibold">real company</span> with revenue, earnings, valuation, and traditional market dynamics behind it.
              </p>
            </Section>

            <Section>
              <p className="mt-6 text-lg md:text-xl font-display font-semibold text-white/80 leading-snug">
                The tools shouldn't treat them the same way.
              </p>
            </Section>

            <Section>
              <p className="mt-6 text-[15px] text-white/50 leading-relaxed">
                Wayfind looks beyond what you hold. Connect your wallet, answer questions, and get a <span className="text-accent font-semibold">personalized</span> understanding of your holdings. See the risks that matter, then find paths to <span className="text-accent font-semibold">rebalance</span> or put assets to work.
              </p>
            </Section>
          </div>
        </div>
      </div>
    </section>
  );
}
