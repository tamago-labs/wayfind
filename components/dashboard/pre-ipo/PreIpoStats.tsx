interface PreIpoStatsProps {
  tokenPrice: number;
  markPrice: number;
  change24h: number;
}

export default function PreIpoStats({ tokenPrice, markPrice, change24h }: PreIpoStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-surface border border-border3/50 rounded-xl p-4">
        <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Token Price</p>
        <p className="text-[18px] font-semibold text-white/80">
          {tokenPrice > 0 ? `$${tokenPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
        </p>
      </div>
      <div className="bg-surface border border-border3/50 rounded-xl p-4">
        <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Mark Price</p>
        <p className="text-[18px] font-semibold text-white/80">
          {markPrice > 0 ? `$${markPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
        </p>
      </div>
      <div className="bg-surface border border-border3/50 rounded-xl p-4">
        <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">24h Change</p>
        <p className={`text-[18px] font-semibold ${change24h >= 0 ? 'text-accent2' : 'text-warn2'}`}>
          {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
