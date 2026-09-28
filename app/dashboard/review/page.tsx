'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

interface ReviewQuestion {
  id: string;
  question: string;
  options: Array<{ label: string; value: string }>;
}

interface ReviewData {
  prompt: string;
  portfolioName: string;
  questions: ReviewQuestion[];
}

export default function ReviewPage() {
  const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('wayfind-review');
    if (raw) {
      try {
        setData(JSON.parse(raw));
      } catch {
        setData(null);
      }
    }
    setLoaded(true);
  }, []);

  const allAnswered = data ? data.questions.every((q) => answers[q.id]) : false;

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (!allAnswered || !data) return;
    // Turn 2 (analysis) comes later — for now store answers
    sessionStorage.setItem('wayfind-review-answers', JSON.stringify(answers));
    console.log('[Review] answers:', answers);
  };

  if (loaded && !data) {
    return (
      <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden grid-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-[15px] text-white/50 mb-4">No review in progress</p>
          <button
            onClick={() => router.push('/dashboard/new-chat')}
            className="px-4 py-2 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-accent/80 transition-colors"
          >
            Start a New Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden grid-bg">
      {/* Glows */}
      <div className="absolute w-[500px] h-[500px] top-1/2 -translate-y-1/2 -left-48 rounded-full blur-[120px] opacity-25 bg-accent pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] top-1/2 -translate-y-1/2 -right-40 rounded-full blur-[120px] opacity-25 bg-zenpurple pointer-events-none" />

      {/* Content */}
      <div className="relative z-1 h-full overflow-y-auto flex flex-col items-center px-6 py-10 max-w-3xl mx-auto">
        <p className="font-display text-2xl md:text-3xl font-semibold text-center text-white/70 mb-2">
          A few questions first
        </p>
        <p className="text-[13px] text-white/35 text-center mb-8">
          {data?.portfolioName} — help us personalize your risk review
        </p>

        {!data ? (
          <div className="w-full space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border border-border3/50 rounded-xl p-5 space-y-3 animate-pulse">
                <div className="h-4 w-2/3 bg-white/[0.05] rounded" />
                <div className="h-9 bg-white/[0.03] rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full space-y-4">
            {data.questions.map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.35 }}
                className="bg-surface border border-border3 rounded-xl p-5"
              >
                <p className="text-[14px] font-medium text-white/85 mb-3">
                  <span className="text-white/30 mr-1.5">{idx + 1}.</span>
                  {q.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelect(q.id, opt.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[13px] text-left transition-colors ${
                          selected
                            ? 'bg-accent/15 border-accent/50 text-white'
                            : 'bg-white/[0.02] border-border3/50 text-white/60 hover:text-white/80 hover:border-border3'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            selected ? 'border-accent bg-accent' : 'border-border3'
                          }`}
                        >
                          {selected && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: data.questions.length * 0.08 }}
              className="flex justify-end pt-2"
            >
              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className={`flex items-center gap-2 px-5 h-10 rounded-lg text-[13px] font-medium transition-colors ${
                  allAnswered
                    ? 'bg-accent text-white hover:bg-accent/80'
                    : 'bg-white/[0.06] border border-border3/50 text-white/30 cursor-not-allowed'
                }`}
              >
                Run Analysis
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
