'use client';

import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import PageHero from '@/components/landing/PageHero';

export default function TemplatesPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero title="Templates" subtitle="Find bot templates that launch your AI teammate to operate on-chain" />
      </main>
      <Footer />
    </>
  );
}
