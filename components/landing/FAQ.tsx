'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Section from './Section';

const faqs = [
  { q: 'What is Wayfind?', a: 'Wayfind is an AI-powered risk intelligence platform for tokenized equities. It helps you understand what you hold, evaluate portfolio risk against your personal profile, and find personalized ways to rebalance or put eligible assets to work.', }, { q: 'How does Wayfind personalize my risk?', a: 'Wayfind combines your portfolio with your goals, time horizon, and risk tolerance. After connecting your wallet or simulating a portfolio, you answer a short questionnaire so the AI can evaluate risk in the context of what matters to you.', }, { q: 'How do I set up Wayfind on Grok Bot?', a: 'Create a Grok Bot, install the Wayfind plugin from the marketplace, then set your WAYFIND_API_KEY and SOLANA_PRIVATE_KEY in the bot\'s environment. Import a template and your bot is ready to trade.', }, { q: 'How is TSLAx different from TSLAon?', a: 'One company like Tesla can have multiple onchain representations — TSLAx, TSLAon, rTSLA — each with different prices, liquidity, and issuers. Wayfind lists every version so you can compare and trade the best option.', }, { q: 'Is my private key safe?', a: 'Your Solana private key stays on your bot\'s computer. It is never shared, logged, or sent to Wayfind. Anyone with access to that machine can move funds, so keep your bot environment secure.', },{ q: 'What does the risk score mean?', a: 'Your risk score is a personalized view of the risk in your portfolio based on your holdings, market conditions, and risk profile. Wayfind also breaks the score down into the factors contributing to it, so you can understand what is driving your portfolio risk.', }, { q: 'What can I do with Wayfind after the risk analysis?', a: 'Wayfind turns the risk analysis into actionable options. Depending on your portfolio and goals, you may see ways to reduce concentration, rebalance your holdings, diversify exposure, or put eligible assets to work through available DeFi opportunities.', }, { q: 'How do AI credits work?', a: 'AI credits power deeper analysis and AI-powered features in Wayfind. Credit usage depends on the complexity of the analysis, and available credits can be managed from your dashboard.', },
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
