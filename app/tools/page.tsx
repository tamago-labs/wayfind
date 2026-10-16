'use client';

import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import PageHero from '@/components/landing/PageHero';

export default function ToolsPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero title="Tools" subtitle="Handpicked tools for building and growing your Web3 agent" />
      </main>
      <Footer />
    </>
  );
}
