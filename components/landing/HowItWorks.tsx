'use client';

import Section from './Section';

const steps = [
  {
    num: '01',
    title: 'Build your risk profile',
    description: (
      <>
        Answer a short AI questionnaire about your <span className="text-white/70 font-medium">goals, time horizon, and risk tolerance</span>. Wayfind creates a personalized risk profile that defines what risk means <span className="text-accent font-semibold">for you</span>.
      </>
    ),
    example: null,
  },
  {
    num: '02',
    title: 'Get your API key',
    description: (
      <>
        Your API key is tied to your risk profile. Set it as the default so every bot you deploy inherits your <span className="text-white/70 font-medium">risk intelligence</span> automatically.
      </>
    ),
    example: null,
  },
  {
    num: '03',
    title: 'Set up your bot',
    description: (
      <>
        Import a template, set your API key, and create an <span className="text-white/70 font-medium">agentic wallet</span> on the bot's computer. Then ask your agent anything — from listing every <span className="text-white/70 font-medium">TSLA</span> token to fetching live prices.
      </>
    ),
    example: null,
  },
  {
    num: '04',
    title: 'Auto-rebalance to risk profile',
    description: (
      <>
        Your bot monitors your portfolio and <span className="text-white/70 font-medium">rebalances automatically</span> to match your risk profile — swapping through the <span className="text-white/70 font-medium">OKX DEX Router</span> when positions drift.
      </>
    ),
    example: null,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 grid-bg scroll-mt-14 relative overflow-hidden">
      <div className="absolute w-[400px] h-[400px] top-1/2 -translate-y-1/2 -left-40 rounded-full blur-[100px] opacity-30 bg-accent pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] top-1/2 -translate-y-1/2 -right-32 rounded-full blur-[100px] opacity-30 bg-zenpurple pointer-events-none" />
      <div className="max-w-3xl mx-auto px-6">
        <Section>
          <p className="text-[13px] text-accent uppercase tracking-wider text-center mb-4">How it works</p>
        </Section>

        <Section>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center tracking-tight mb-12">
            Your path starts here
          </h2>
        </Section>

        <div className="max-w-lg mx-auto">
          <Section>
          <div className="relative pl-16">
            <div className="absolute left-[18px] top-4 bottom-4 w-px bg-border3" />

            <div className="space-y-10">
              {steps.map((step) => (
                <div key={step.num} className="relative">
                  <div className="absolute -left-16 top-1 w-9 h-9 flex items-center justify-center">
                    <span className="text-[18px] font-mono text-accent">{step.num}</span>
                  </div>

                  <h3 className="text-[16px] font-semibold mb-1">{step.title}</h3>
                  <p className="text-[14px] text-white/45 leading-relaxed">{step.description}</p>
                  {step.example && (
                    <p className="mt-2 text-[13px] text-accent/70 italic">{step.example}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>
        </div>

        
      </div>
    </section>
  );
}
