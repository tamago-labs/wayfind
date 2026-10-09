'use client';

import TokenShowcase from './TokenShowcase';
import Section from './Section';
import TemplateCards from './TemplateCards';

export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-10 pb-24 relative grid-bg">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-accent/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative flex flex-col items-center text-center">
        <Section className="max-w-2xl">
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
            Grok Bot Templates for<br />
            <span className="bg-gradient-to-r from-zenblue via-accent to-accent2 bg-clip-text text-transparent">
              Solana Trading
            </span>
          </h1>
        </Section>

        <Section className="max-w-2xl">
          <p className="mt-5 text-[11px] sm:text-[15px] text-white/50 leading-relaxed">
            Download bot templates to trade, rebalance, and manage <span className="text-accent font-semibold">tokenized stocks</span> using Wayfind's data layer and trading tools for AI agents.
          </p>
        </Section>

        <Section className="w-full max-w-3xl mx-auto mt-5">
          <TemplateCards />
        </Section>

        <Section>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-white/35">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
              <span className="flex items-center gap-1 text-[13px] text-white/35">
                One-Click Import for <img src="/grok-bot-circle-neutral-blue.png" alt="Solana" className="w-4 h-4 inline-block rounded-full" /> <img src="/grok-bot-circle-neutral-orange.png" alt="Ethereum" className="w-4 h-4 inline-block rounded-full -ml-2.5" /> <img src="/grok-bot-circle-neutral-turquoise.png" alt="BNB Chain" className="w-4 h-4 inline-block rounded-full -ml-2.5" /> <span className="text-accent font-semibold">Grok Bot</span>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
              Real-Time Data by <img src="data:image/webp;base64,UklGRpABAABXRUJQVlA4IIQBAACQCACdASocABwAPtEutFooIagoGAEAGglsAJ0yhHVmgr0u2A3AG8jbyMSqrxp/Q2/A/YAVxwJw+yloJ8smrpKqFYWRvVgPnY0CG+B4AAD+Ctjsye/cX1TUx/xyKUIg9Ud32p9rJksmCygByiPDZFVXIusKLNlU/ZYW654rHaxRl+81N+ap6z5/+JUP85O4X9LOTiHyYhIS+Uv0SbUMOlRY5nwz++/kUpwVj7HrZvaoS6CMjojqhvH70H0o2n+lj1mVb8fn4F//afX8GlQuLQ++sH/FV/wsDf0/sw7GHQkWO9SfjH5O7wBfAYag/NcAisPc06GbPrnCrictkX8eI2RAd6t4KuNhlUlp2SGRV1LTnkMrY8Weg17US9j97ZZMSCoqc37qX4VhuMeYDv/xXYCbiJwHo/7m/9tn1N/6Lxa0GzOaixvJugxQ1/fMJncLK31Qx0a/dRjeeaySYZCWqSBrAU4Gn9gwt+x/z/zSoUNDUfjex7f0/z6I3nYWKUpL+weT4AAA" alt="CoinMarketCap" className="w-4 h-4 inline-block rounded-full" /> <span className="text-accent font-semibold">CoinMarketCap</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent2" />
              Risk Analysis with <span className="w-4 h-4 rounded-full bg-white inline-flex items-center justify-center"><img src="https://openrouter.ai/images/icons/OpenAI.svg" alt="OpenAI" className="w-3 h-3" /></span> <span className="text-accent font-semibold">GPT-6 Astra</span>
            </li>
          </ul>
        </Section>
      </div>
 
    </section>
  );
}
