import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Section from './Section';

export default function CTA() {
  return (
    <section className="py-24 grid-bg">
      <div className="max-w-2xl mx-auto px-6">
        <Section>
          <div className="relative p-4">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] h-[60%] bg-accent/10 blur-[100px] rounded-full" />
            </div>
            <div className="relative bg-surface rounded-2xl p-10 text-center z-10">
              <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                Find your way forward
              </h2>
              <p className="mt-4 text-[15px] text-white/45">
                Understand your tokenized equity portfolio with personalized AI risk intelligence, then discover clearer paths to rebalance and put your assets to work.
              </p>
              <Link
                href="/dashboard"
                className="mt-8 inline-block text-[15px] font-medium bg-accent text-white px-8 py-4 rounded-lg hover:bg-accent/80 transition-colors"
              >
                Start with Free AI Credits <ArrowRight className="inline-block w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </Section>
      </div>
    </section>
  );
}
