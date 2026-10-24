import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center ">
      <div className="text-center space-y-6 max-w-3xl px-6 pt-[60px]">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zenblue to-zenpurple flex items-center justify-center mx-auto">
          <span className="text-2xl font-brand rotate-[-10deg]">W</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-white/90">Welcome to Wayfind</h1>
        <p className="text-sm text-white/40 max-w-md mx-auto">
          Equip your AI agents with market data, risk tools, and onchain trading across 10+ networks.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <Link
            href="/dashboard/explore"
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 transition-all text-left group"
          >
            <h3 className="text-[14px] font-semibold text-white/90 mb-2 group-hover:text-accent transition-colors">Explore Real-Time Data</h3>
            <p className="text-[12px] text-white/40">Browse tokenized stocks with live prices and risk metrics.</p>
          </Link>
          <Link
            href="/dashboard/api-keys"
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 transition-all text-left group"
          >
            <h3 className="text-[14px] font-semibold text-white/90 mb-2 group-hover:text-accent transition-colors">Get API Key</h3>
            <p className="text-[12px] text-white/40">To power bots with market data and trading.</p>
          </Link>
          <Link
            href="/dashboard/new-chat"
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 transition-all text-left group"
          >
            <h3 className="text-[14px] font-semibold text-white/90 mb-2 group-hover:text-accent transition-colors">Create Risk Profile</h3>
            <p className="text-[12px] text-white/40">Assess your portfolio risk with multi-factor analysis.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
