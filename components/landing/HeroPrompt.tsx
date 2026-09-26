'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function HeroPrompt() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('What are the top stock tokens on Solana by volume?');

  const handleSubmit = () => {
    if (inputValue.trim()) {
      router.push(`/dashboard?prompt=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
    <div className="bg-surface border border-border3 rounded-2xl shadow-2xl glow-blue overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border3 bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <span className="w-3 h-3 rounded-full bg-green-400/70" />
        </div>
        <span className="text-[12px] text-white/60 font-medium">Wayfind AI</span>
      </div>

      <div className="p-5">
        <div className="bg-white/[0.03] border border-border3 rounded-xl p-4 relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Wayfind anything about the market…"
            className="w-full bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none resize-none min-h-[80px] pr-[100px]"
          />
          <button
            onClick={handleSubmit}
            className="absolute bottom-4 right-4 w-9 h-9 rounded-lg bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors shrink-0"
          >
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
