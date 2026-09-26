'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Section from './Section';

const faqs = [
  { q: 'What is Wayfind?', a: 'Wayfind is an AI-powered risk intelligence platform for tokenized equities. It helps you understand what you hold, evaluate portfolio risk against your personal profile, and find personalized ways to rebalance or put eligible assets to work.', }, { q: 'How does Wayfind personalize my risk?', a: 'Wayfind combines your portfolio with your goals, time horizon, and risk tolerance. After connecting your wallet or simulating a portfolio, you answer a short questionnaire so the AI can evaluate risk in the context of what matters to you.', }, { q: 'How does the AI Risk Engine work?', a: 'The AI Risk Engine evaluates your portfolio across factors such as company fundamentals, market exposure, concentration, liquidity, issuer risk, and onchain considerations. It combines these signals with your personal risk profile to produce a personalized risk assessment and explain what is driving it.', }, { q: 'What are tokenized equities?', a: 'Tokenized equities are onchain assets that provide exposure to real-world companies and stocks. They bring traditional equity exposure into Web3, while adding considerations such as issuer structure, liquidity, and onchain infrastructure.', }, { q: 'Can I use Wayfind without connecting my wallet?', a: 'Yes. You can simulate a portfolio by adding tokenized equities you want to explore. This lets you evaluate potential holdings and see how they could affect your portfolio risk without connecting a wallet.', }, { q: 'What does the risk score mean?', a: 'Your risk score is a personalized view of the risk in your portfolio based on your holdings, market conditions, and risk profile. Wayfind also breaks the score down into the factors contributing to it, so you can understand what is driving your portfolio risk.', }, { q: 'What can I do with Wayfind after the risk analysis?', a: 'Wayfind turns the risk analysis into actionable options. Depending on your portfolio and goals, you may see ways to reduce concentration, rebalance your holdings, diversify exposure, or put eligible assets to work through available DeFi opportunities.', }, { q: 'What are Yield & DeFi opportunities?', a: 'Wayfind can identify ways eligible tokenized assets may be used in DeFi, including lending or liquidity opportunities. Each opportunity can be evaluated alongside its potential yield and associated risks so you can decide whether it fits your portfolio.', }, { q: 'How do AI credits work?', a: 'AI credits power deeper analysis and AI-powered features in Wayfind. Credit usage depends on the complexity of the analysis, and available credits can be managed from your dashboard.', },
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
