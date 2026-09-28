'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, AlertTriangle, Activity } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const dataClient = generateClient<Schema>();

interface ReviewQuestion {
  id: string;
  question: string;
  options: Array<{ label: string; value: string }>;
}

interface ReviewData {
  prompt: string;
  userProfileId: string;
  portfolioName: string;
  holdings: Array<{ symbol: string; name?: string; balance: number; price: number; type?: string }>;
  questions: ReviewQuestion[];
}

interface AnalysisResult {
  overallScore: number;
  overallLabel: string;
  overallSummary: string;
  fundamentalsScore: number;
  fundamentalsExplanation: string;
  onchainScore: number;
  onchainExplanation: string;
  factorExplanations: {
    concentration: string;
    marketExposure: string;
    liquidity: string;
    issuer: string;
  };
  personalizationNote: string;
  hiddenRisks: string[];
  deterministicFactors: {
    concentration: number;
    marketExposure: number;
    liquidity: number;
    issuer: number;
  };
  portfolioStats: {
    totalValue: number;
    largestPct: number;
    top3Pct: number;
    topSectors: Array<{ sector: string; pct: number }>;
  };
}

type Phase = 'questions' | 'analyzing' | 'results';

function scoreColor(score: number): string {
  if (score <= 30) return 'text-emerald-400';
  if (score <= 60) return 'text-yellow-400';
  if (score <= 80) return 'text-orange-400';
  return 'text-red-400';
}

function scoreBarColor(score: number): string {
  if (score <= 30) return 'bg-emerald-400';
  if (score <= 60) return 'bg-yellow-400';
  if (score <= 80) return 'bg-orange-400';
  return 'bg-red-400';
}

export default function ReviewPage() {
  const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('questions');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzingMsg, setAnalyzingMsg] = useState(0);

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

  // Rotating analyzing messages
  useEffect(() => {
    if (phase !== 'analyzing') return;
    const msgs = ['Analyzing holdings…', 'Assessing fundamentals…', 'Evaluating concentration…', 'Checking issuer risk…', 'Synthesizing score…'];
    const timer = setInterval(() => setAnalyzingMsg((m) => (m + 1) % msgs.length), 2500);
    return () => clearInterval(timer);
  }, [phase]);

  const totalSteps = data?.questions.length ?? 0;
  const isLastStep = data ? currentStep === data.questions.length - 1 : false;
  const currentQuestion = data?.questions[currentStep];
  const currentAnswered = currentQuestion ? !!answers[currentQuestion.id] : false;
  const allAnswered = data ? data.questions.every((q) => answers[q.id]) : false;

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const runAnalysis = async () => {
    if (!allAnswered || !data?.userProfileId || !data.holdings?.length) return;
    setPhase('analyzing');
    try {
      const { data: resData, errors } = await dataClient.queries.riskReview({
        action: 'runAnalysis',
        userProfileId: data.userProfileId,
        prompt: data.prompt,
        holdings: JSON.stringify(data.holdings),
        answers: JSON.stringify(answers),
      });
      if (errors?.length) console.error('[Review] runAnalysis errors:', errors);
      const parsed = typeof resData === 'string' ? JSON.parse(resData) : resData;
      if (parsed?.overallScore != null) {
        setResult(parsed);
        setPhase('results');
      } else {
        console.error('[Review] no analysis returned');
        setPhase('questions');
      }
    } catch (err) {
      console.error('[Review] runAnalysis failed:', err);
      setPhase('questions');
    }
  };

  const handleNext = () => {
    if (!currentAnswered) return;
    if (isLastStep) {
      void runAnalysis();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  if (loaded && !data) {
    return (
      <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden grid-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-[15px] text-white/50 mb-4">No review in progress</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-accent/80 transition-colors"
          >
            Start a New Review
          </button>
        </div>
      </div>
    );
  }

  const analyzingMessages = ['Analyzing holdings…', 'Assessing fundamentals…', 'Evaluating concentration…', 'Checking issuer risk…', 'Synthesizing score…'];

  return (
    <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden grid-bg">
      {/* Glows */}
      <div className="absolute w-[500px] h-[500px] top-1/2 -translate-y-1/2 -left-48 rounded-full blur-[120px] opacity-25 bg-accent pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] top-1/2 -translate-y-1/2 -right-40 rounded-full blur-[120px] opacity-25 bg-zenpurple pointer-events-none" />

      <div className="relative z-1 h-full overflow-y-auto flex flex-col items-center px-6 py-10 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {phase === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[50vh]"
            >
              <div className="w-14 h-14 rounded-full border-2 border-accent/30 border-t-accent animate-spin mb-6" />
              <p className="text-[15px] text-white/60 font-medium mb-2">{analyzingMessages[analyzingMsg]}</p>
              <p className="text-[12px] text-white/30">{data?.portfolioName}</p>
            </motion.div>
          )}

          {phase === 'results' && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              {/* Score header */}
              <div className="bg-surface border border-border3 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[12px] text-white/40 mb-1">Portfolio Risk Score</p>
                    <p className={`font-display text-5xl font-bold ${scoreColor(result.overallScore)}`}>
                      {result.overallScore}
                      <span className="text-lg text-white/30 font-normal"> / 100</span>
                    </p>
                    <p className={`text-[14px] font-medium mt-1 ${scoreColor(result.overallScore)}`}>
                      {result.overallLabel} Risk
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-white/40 mb-1">Portfolio Value</p>
                    <p className="text-[18px] font-display font-semibold">
                      ${result.portfolioStats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-white/30 mt-1">{data?.portfolioName}</p>
                  </div>
                </div>
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.overallScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${scoreBarColor(result.overallScore)}`}
                  />
                </div>
                <p className="text-[13px] text-white/60 mt-4 leading-relaxed">{result.overallSummary}</p>
                {result.personalizationNote && (
                  <p className="text-[12px] text-white/35 mt-2 leading-relaxed italic">{result.personalizationNote}</p>
                )}
              </div>

              {/* Factor breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  { name: 'Concentration', score: result.deterministicFactors.concentration, explanation: result.factorExplanations.concentration },
                  { name: 'Market Exposure', score: result.deterministicFactors.marketExposure, explanation: result.factorExplanations.marketExposure },
                  { name: 'Liquidity', score: result.deterministicFactors.liquidity, explanation: result.factorExplanations.liquidity },
                  { name: 'Issuer Risk', score: result.deterministicFactors.issuer, explanation: result.factorExplanations.issuer },
                  { name: 'Fundamentals', score: result.fundamentalsScore, explanation: result.fundamentalsExplanation },
                  { name: 'On-chain Factors', score: result.onchainScore, explanation: result.onchainExplanation },
                ].map((f, idx) => (
                  <motion.div
                    key={f.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.06 }}
                    className="bg-surface border border-border3/60 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-medium text-white/80">{f.name}</span>
                      <span className={`text-[14px] font-semibold ${scoreColor(f.score)}`}>{f.score}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${f.score}%` }}
                        transition={{ duration: 0.6, delay: 0.2 + idx * 0.06 }}
                        className={`h-full rounded-full ${scoreBarColor(f.score)}`}
                      />
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed">{f.explanation}</p>
                  </motion.div>
                ))}
              </div>

              {/* Hidden risks */}
              <div className="bg-surface border border-border3/60 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-[13px] font-semibold text-white/80">Hidden Risks</span>
                </div>
                <ul className="space-y-2">
                  {result.hiddenRisks.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[12px] text-white/55 leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next steps */}
              <div className="flex items-center justify-center gap-3 pb-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 px-5 h-10 rounded-lg text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <Activity className="w-4 h-4" />
                  Chat about this
                </button>
                <button
                  onClick={() => router.push('/dashboard/portfolio')}
                  className="flex items-center gap-2 px-5 h-10 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-accent/80 transition-colors"
                >
                  View Portfolio
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
