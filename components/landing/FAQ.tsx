'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Section from './Section';

const faqs = [
  {
    q: 'What is Zivic?',
    a: 'Zivic is an AI-powered risk engine for tokenized equities on Solana. It analyzes your portfolio across concentration, market volatility, and token liquidity to give you a risk score and actionable recommendations.',
  },
  {
    q: 'How does Zivic personalize my experience?',
    a: 'Zivic connects to your wallet, reads your on-chain holdings, and uses your portfolio composition to power AI analysis. Risk scores, rebalancing suggestions, and yield opportunities are all tailored to the assets you actually hold.',
  },
  {
    q: 'What are tokenized stocks?',
    a: 'Tokenized stocks are on-chain tokens backed by real-world equities. On Solana, xStocks (by Backed Assets) and Ondo Stocks track stocks like NVIDIA, Apple, Tesla, and Circle. Zivic tracks prices, market cap, and volume via CoinMarketCap data.',
  },
  {
    q: 'What are PreStocks?',
    a: 'PreStocks are tokens representing economic exposure to private companies (pre-IPO) like Anthropic, OpenAI, SpaceX, and Neuralink. Each PreStock is independently attested by BlockOffice (ACCA-certified) to verify token supply against offchain backing.',
  },
  {
    q: 'How do credits work?',
    a: 'Zivic uses AI credits to power analysis. Running a risk evaluation or asking complex questions consumes credits based on token usage. You can purchase credits via the dashboard.',
  },
  {
    q: 'What is the AI Risk Engine?',
    a: 'The Risk Engine evaluates your portfolio across three dimensions: concentration risk (position sizing), market risk (equity volatility, sector concentration), and token/liquidity risk (issuer quality, trading volume). It produces a 0-100 risk score.',
  },
  {
    q: 'What are Yield & DeFi opportunities?',
    a: 'Zivic shows you how to earn yield on tokens you hold via Kamino lending and Byreal liquidity pools, with real-time APY and APR data.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-6">
        <Section>
          <div className="text-center mb-12">
            <p className="text-[13px] text-accent uppercase tracking-wider text-center mb-4">FAQ</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              Frequently asked questions
            </h2>
          </div>
        </Section>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Section key={i}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-surface rounded-xl border border-border3/50 hover:border-border3 transition-colors text-left"
              >
                <span className="text-[14px] font-medium text-white/80">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 pt-2 text-[13px] text-white/45 leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Section>
          ))}
        </div>
      </div>
    </section>
  );
}
