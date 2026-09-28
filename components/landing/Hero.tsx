'use client';

import HeroPrompt from './HeroPrompt';
import TokenShowcase from './TokenShowcase';
import Section from './Section';

export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-10 pb-24 relative grid-bg">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-accent/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative flex flex-col items-center text-center">
        <Section className="max-w-2xl">
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
            Find Your Way Through<br />
            <span className="bg-gradient-to-r from-zenblue via-accent to-accent2 bg-clip-text text-transparent">
              Tokenized Equities
            </span>
          </h1>
        </Section>

        <Section className="max-w-2xl">
          <p className="mt-5 text-[12px] sm:text-[15px] text-white/50 leading-relaxed">
            Hyper-personalized AI risk intelligence for <span className="text-accent font-semibold">tokenized equities</span>. Understand your portfolio, uncover hidden risks, find personalized ways to rebalance and put your assets to work.
          </p>
        </Section>

        <Section className="w-full max-w-3xl mx-auto mt-5">
          <HeroPrompt />
        </Section>

        <Section>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-white/35">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
              <span className="group relative inline-flex items-center gap-1 cursor-default">
                Connected across <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png" alt="Solana" className="w-4 h-4 inline-block rounded-full relative z-30" /> <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" alt="Ethereum" className="w-4 h-4 inline-block rounded-full -ml-2.5 relative z-20" /> <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png" alt="BNB Chain" className="w-4 h-4 inline-block rounded-full -ml-2.5 relative z-10" /> <span className="text-accent font-semibold">5+ chains</span>
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50">
                  <span className="block bg-surface border border-border3/60 rounded-lg shadow-xl px-3 py-2.5">
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-surface border-r border-b border-border3/60" />
                    <span className="block text-[10px] font-semibold tracking-wider text-white/40 uppercase mb-2 text-center">Supported Chains</span>
                    <span className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                      {[
                        { name: "Solana", cmcId: 5426 },
                        { name: "Ethereum", cmcId: 1027 },
                        { name: "BNB Chain", cmcId: 1839 },
                        { name: "Arbitrum One", cmcId: 11841 },
                        { name: "X Layer", cmcId: 3897 },
                      ].map((chain) => (
                        <span key={chain.name} className="flex items-center gap-2 text-[12px] text-white/70">
                          <img src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${chain.cmcId}.png`} alt={chain.name} className="w-4 h-4 rounded-full" />
                          {chain.name}
                        </span>
                      ))}
                    </span>
                  </span>
                </span>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
              Data supplied by <img src="data:image/webp;base64,UklGRpABAABXRUJQVlA4IIQBAACQCACdASocABwAPtEutFooIagoGAEAGglsAJ0yhHVmgr0u2A3AG8jbyMSqrxp/Q2/A/YAVxwJw+yloJ8smrpKqFYWRvVgPnY0CG+B4AAD+Ctjsye/cX1TUx/xyKUIg9Ud32p9rJksmCygByiPDZFVXIusKLNlU/ZYW654rHaxRl+81N+ap6z5/+JUP85O4X9LOTiHyYhIS+Uv0SbUMOlRY5nwz++/kUpwVj7HrZvaoS6CMjojqhvH70H0o2n+lj1mVb8fn4F//afX8GlQuLQ++sH/FV/wsDf0/sw7GHQkWO9SfjH5O7wBfAYag/NcAisPc06GbPrnCrictkX8eI2RAd6t4KuNhlUlp2SGRV1LTnkMrY8Weg17US9j97ZZMSCoqc37qX4VhuMeYDv/xXYCbiJwHo/7m/9tn1N/6Lxa0GzOaixvJugxQ1/fMJncLK31Qx0a/dRjeeaySYZCWqSBrAU4Gn9gwt+x/z/zSoUNDUfjex7f0/z6I3nYWKUpL+weT4AAA" alt="CoinMarketCap" className="w-4 h-4 inline-block rounded-full" /> <span className="text-accent font-semibold">CoinMarketCap</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
              Frontier AI reasoning with <span className="w-4 h-4 rounded-full bg-white inline-flex items-center justify-center"><img src="https://openrouter.ai/images/icons/OpenAI.svg" alt="OpenAI" className="w-3 h-3" /></span> <span className="text-accent font-semibold">GPT-6 Astra</span>
            </li>
          </ul>
        </Section>
      </div>
 
    </section>
  );
}
