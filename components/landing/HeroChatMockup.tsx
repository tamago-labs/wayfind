'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const chatSteps = [
  { type: 'user', text: 'Set up payroll for my team in USDC' },
  { type: 'ai', text: 'Connected to Circle — unified balance ready across 10+ chains.' },
  { type: 'ai', text: 'HR bot configured. Freelancer payments, onchain payslips, and USDC transfers are now automated. I\'ll coordinate with your CFO bot for treasury oversight.' },
];

export default function HeroChatMockup() {
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    chatSteps.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleSteps(i + 1), (i + 1) * 1200));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="relative rounded-[28px] border border-white/[0.08] bg-[#0a0a0f] p-2 shadow-2xl">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#0a0a0f] rounded-b-xl z-10" />

        <div className="rounded-[20px] bg-gradient-to-b from-[#0f1019] to-[#080810] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-3 pb-2">
            <span className="text-[10px] text-white/40 font-medium">9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-1.5 rounded-sm bg-white/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            </div>
          </div>

          <div className="px-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-zenblue to-zenpurple flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">W</span>
              </div>
              <div>
                 <p className="text-[11px] font-semibold text-white/90">Wayfind Demo</p>
                <p className="text-[9px] text-accent">online</p>
              </div>
            </div>
          </div>

<div ref={chatRef} className="px-3 py-4 space-y-2 h-[340px] overflow-y-auto scrollbar-hide">
            {visibleSteps > 0 && chatSteps.slice(0, visibleSteps).map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`flex ${step.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
                        step.type === 'user'
                          ? 'bg-gradient-to-r from-zenblue to-zenpurple text-white rounded-br-sm'
                          : 'bg-white/[0.06] text-white/70 rounded-bl-sm'
                      }`}
                    >
                      {step.text}
                    </div>
                  </motion.div>
                ))}
            {visibleSteps > 0 && visibleSteps < chatSteps.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/[0.06] rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
          </div>
        </div>
      </div>
    </div>
  );
}
