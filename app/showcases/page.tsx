'use client';

import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import PageHero from '@/components/landing/PageHero';

export default function ShowcasesPage() {
  return (
    <>
      <Header />
      <main>
        <PageHero title="Showcases" subtitle="Discover what the community has built with Wayfind" />
      </main>
      <Footer />
    </>
  );
}
