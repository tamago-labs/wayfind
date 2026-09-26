export const dynamic = "force-dynamic";

import preIpoData from "@/lib/data/pre-ipo-list.json";
import PreIpoDetailClient from "@/components/dashboard/pre-ipo/PreIpoDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return preIpoData.assets.map((a) => ({ slug: a.slug }));
}

export default async function PreIpoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const asset = preIpoData.assets.find((a) => a.slug === slug);

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-white/40 text-lg">PreStock not found</p>
          <Link href="/dashboard/pre-ipo" className="text-accent text-sm mt-2 inline-block hover:underline">
            Back to Pre-IPO
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <nav className="flex items-center gap-1.5 text-xs text-white/30 mb-6">
          <Link href="/dashboard/pre-ipo" className="flex items-center gap-1 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to Pre-IPO
          </Link>
        </nav>

        <PreIpoDetailClient asset={asset} />
      </div>
    </div>
  );
}
