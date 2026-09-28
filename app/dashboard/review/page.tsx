'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

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
  const [currentStep, setCurrentStep] = useState(0);

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

  const totalSteps = data?.questions.length ?? 0;
  const isLastStep = data ? currentStep === data.questions.length - 1 : false;
  const currentQuestion = data?.questions[currentStep];
  const currentAnswered = currentQuestion ? !!answers[currentQuestion.id] : false;
  const allAnswered = data ? data.questions.every((q) => answers[q.id]) : false;

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (!currentAnswered) return;
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((s) => s + 1);
    }
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
      <div className="relative z-1 h-full flex flex-col items-center justify-center px-6 max-w-2xl mx-auto">
        <p className="font-display text-2xl md:text-3xl font-semibold text-center text-white/70 mb-6">
          Help us understand you better
        </p>

        {/* Progress */}
        {data && (
          <div className="flex items-center gap-2 mb-8">
            {data.questions.map((q, idx) => (
              <span
                key={q.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-accent'
                    : idx < currentStep
                      ? 'w-1.5 bg-accent/50'
                      : 'w-1.5 bg-white/10'
                }`}
              />
            ))}
            <span className="text-[11px] text-white/30 ml-2">
              {currentStep + 1} / {totalSteps}
            </span>
          </div>
        )}

        {!data || !currentQuestion ? (
          <div className="w-full bg-surface border border-border3/50 rounded-xl p-5 space-y-3 animate-pulse">
            <div className="h-4 w-2/3 bg-white/[0.05] rounded" />
            <div className="h-10 bg-white/[0.03] rounded-lg" />
            <div className="h-10 bg-white/[0.03] rounded-lg" />
          </div>
        ) : (
          <div className="w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-surface border border-border3 rounded-xl p-6"
              >
                <p className="text-[15px] font-medium text-white/85 mb-4">
                  {currentQuestion.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentQuestion.options.map((opt) => {
                    const selected = answers[currentQuestion.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelect(currentQuestion.id, opt.value)}
                        className={`flex items-center gap-2 px-3 py-3 rounded-lg border text-[13px] text-left transition-colors ${
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
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className={`flex items-center gap-1.5 px-4 h-10 rounded-lg text-[13px] font-medium transition-colors ${
                  currentStep > 0
                    ? 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                    : 'text-white/20 cursor-not-allowed'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!currentAnswered}
                className={`flex items-center gap-2 px-5 h-10 rounded-lg text-[13px] font-medium transition-colors ${
                  currentAnswered
                    ? 'bg-accent text-white hover:bg-accent/80'
                    : 'bg-white/[0.06] border border-border3/50 text-white/30 cursor-not-allowed'
                }`}
              >
                {isLastStep ? 'Run Analysis' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
