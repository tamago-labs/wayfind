import CopyButton from '../CopyButton';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40">{label}</span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}

interface PreIpoInfoProps {
  industry: string;
  employees: string;
  website: string;
  mint: string;
  tokenPrice: number;
  markPrice: number;
  premium: number;
  markValuation: number;
  impliedValuation: number;
  supply: number;
  assetSymbol: string;
}

function formatValuation(value: number): string {
  if (value <= 0) return '—';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

export default function PreIpoInfo({ industry, employees, website, mint, tokenPrice, markPrice, premium, markValuation, impliedValuation, supply, assetSymbol }: PreIpoInfoProps) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-white/70 mb-4">Token Info</h2>
      <div className="grid grid-cols-1 gap-4 text-sm">
        <div className="space-y-3">
          <DetailRow label="Industry" value={industry.length > 40 ? industry.slice(0, 40) + '…' : industry} />
          <DetailRow label="Employees" value={employees} />
          <DetailRow label="Website" value={website} />
        </div>
        <div className="space-y-3">
          <DetailRow label="Token Price" value={tokenPrice > 0 ? `$${tokenPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'} />
          <DetailRow label="Mark Price" value={markPrice > 0 ? `$${markPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'} />
          <DetailRow label="Premium" value={premium !== 0 ? `${premium >= 0 ? '+' : ''}${premium.toFixed(2)}%` : '—'} />
          <DetailRow label="Mark Valuation" value={formatValuation(markValuation)} />
          <DetailRow label="Implied Valuation" value={formatValuation(impliedValuation)} />
          <DetailRow label="Supply" value={supply > 0 ? `${supply.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${assetSymbol}` : '—'} />
          <div className="flex items-center justify-between">
            <span className="text-white/40">Mint Address</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-white/70 text-xs">
                {mint ? `${mint.slice(0, 8)}...${mint.slice(-6)}` : '—'}
              </span>
              {mint && <CopyButton text={mint} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
