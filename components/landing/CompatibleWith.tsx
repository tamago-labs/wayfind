'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

const cards = [
  { name: 'Grok Bot', tagline: 'Download a bot template', url: 'https://x.ai/bot', image: 'https://cdn.prod.website-files.com/689f5720d02bfbed3bbc3f87/6ac39e979d9600aaa9ef21b7_grok_card.avif' },
  { name: 'Muse', tagline: 'Via Agent Skills', url: 'https://ai.meta.com/muse/', image: 'https://cdn.prod.website-files.com/689f5720d02bfbed3bbc3f87/6ac39e98acc823c4b1f2796c_muse_card.avif' },
  { name: 'Dots', tagline: 'Via Agent Skills', url: 'https://openai.com/index/introducing-dots/', image: 'https://cdn.prod.website-files.com/689f5720d02bfbed3bbc3f87/6ac39e98669dae1a60fcbae8_dots_card.avif' },
];

export default function CompatibleWith() {
  const [active, setActive] = useState(0);

  const next = () => setActive((prev) => (prev + 1) % cards.length);
  const prev = () => setActive((prev) => (prev - 1 + cards.length) % cards.length);

  return (
    <section className="relative grid-bg py-24">
      <div className="absolute w-[400px] h-[400px] top-1/2 -translate-y-1/2 -left-40 rounded-full blur-[100px] opacity-30 bg-accent pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] top-1/2 -translate-y-1/2 -right-32 rounded-full blur-[100px] opacity-30 bg-zenpurple pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-[13px] text-accent uppercase tracking-wider mb-4">Compatibility</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Works with any AI you use
          </h2>
        </motion.div>

        {/* Desktop — show all cards */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <motion.a
              key={card.name}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer block"
            >
              <img
                src={card.image}
                alt={card.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
              <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                <span className="text-[15px] font-display font-semibold text-white">{card.name}</span>
                <div className="w-7 h-7 rounded-full  flex items-center justify-center  group-hover:bg-white/20 transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/70" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-[12px] text-white/60">{card.tagline}</span>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Mobile — one card at a time with navigation */}
        <div className="sm:hidden relative">
          <AnimatePresence mode="wait">
            <motion.a
              key={active}
              href={cards[active].url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="relative aspect-square rounded-2xl overflow-hidden group block"
            >
              <img
                src={cards[active].image}
                alt={cards[active].name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
              <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                <span className="text-[15px] font-display font-semibold text-white">{cards[active].name}</span>
                <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/[0.08]">
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/70" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-[12px] text-white/60">{cards[active].tagline}</span>
              </div>
            </motion.a>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-3 mt-5">
            <button onClick={prev} className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {cards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === active ? 'bg-accent' : 'bg-white/20'}`}
                />
              ))}
            </div>
            <button onClick={next} className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
