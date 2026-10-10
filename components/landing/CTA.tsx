import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Section from './Section';

export default function CTA() {
  return (
    <section className="py-12 md:py-24 grid-bg">
      <div className="max-w-2xl mx-auto px-4 md:px-6">
        <Section>
          <div className="relative p-4">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] h-[60%] bg-accent/10 blur-[100px] rounded-full" />
            </div>
            <div className="relative bg-surface rounded-2xl p-6 md:p-10 text-center z-10">
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
                Deploy your Wayfind bot in minutes
              </h2>
              <p className="mt-4 text-[15px] text-white/45">
                Pick a Grok Bot template, set your keys, and let your bot trade with real-time data and personalized risk intelligence.
              </p>
              <Link
                href="/dashboard"
                className="mt-8 inline-flex items-center justify-center gap-2 w-full md:w-auto text-[15px] font-medium bg-accent text-white px-8 py-4 rounded-lg hover:bg-accent/80 transition-colors"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Section>
      </div>
    </section>
  );
}
