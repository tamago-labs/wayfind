export interface Holding {
  symbol: string;
  name?: string;
  balance: number;
  price: number;
}

export interface PreStockMarket {
  symbol: string;
  tokenPrice: number | null;
  markPrice: number | null;
  markValuation: number | null;
  supply: number | null;
}

export interface StrategyAction {
  label: string;
  detail: string;
}

export interface StrategyResult {
  id: string;
  name: string;
  status: 'triggered' | 'ok';
  icon: string;
  summary: string;
  actions: StrategyAction[];
}

// --- Concentration ---
export function checkConcentration(holdings: Holding[]): StrategyResult {
  const total = holdings.reduce((sum, h) => sum + h.balance * h.price, 0);
  if (total === 0) {
    return {
      id: 'concentration',
      name: 'Concentration Risk',
      status: 'ok',
      icon: 'shield-check',
      summary: 'No holdings to analyze.',
      actions: [],
    };
  }

  const sorted = [...holdings].sort((a, b) => b.balance * b.price - a.balance * a.price);
  const top1Pct = (sorted[0].balance * sorted[0].price / total) * 100;
  const top2Pct = sorted.length > 1
    ? ((sorted[0].balance * sorted[0].price + sorted[1].balance * sorted[1].price) / total) * 100
    : top1Pct;

  const actions: StrategyAction[] = [];
  if (top1Pct > 40) {
    actions.push({
      label: `Trim ${sorted[0].symbol}`,
      detail: `Reduce from ${top1Pct.toFixed(1)}% to ~25%`,
    });
  }
  if (top2Pct > 65) {
    actions.push({
      label: 'Diversify top 2',
      detail: `Top 2 assets are ${top2Pct.toFixed(1)}% — spread into other sectors`,
    });
  }

  if (actions.length > 0) {
    return {
      id: 'concentration',
      name: 'Concentration Risk',
      status: 'triggered',
      icon: 'alert-triangle',
      summary: `Top asset: ${top1Pct.toFixed(1)}%. Top 2: ${top2Pct.toFixed(1)}%.`,
      actions,
    };
  }

  return {
    id: 'concentration',
    name: 'Concentration Risk',
    status: 'ok',
    icon: 'shield-check',
    summary: `Well distributed. Top: ${top1Pct.toFixed(1)}%, Top 2: ${top2Pct.toFixed(1)}%.`,
    actions: [],
  };
}

// --- Risk Match ---
const RISK_TEMPLATES = [
  { max: 30, label: 'Conservative', name: 'Capital Preservation', rationale: 'Low risk score. Focus on stable assets and gradual growth.' },
  { max: 60, label: 'Balanced', name: 'Balanced Growth', rationale: 'Moderate risk. Diversify across sectors with periodic rebalancing.' },
  { max: 80, label: 'Growth', name: 'Active Growth', rationale: 'Elevated risk. Concentrated positions need active monitoring.' },
  { max: 101, label: 'Aggressive', name: 'Aggressive Strategy', rationale: 'High risk. Consider defensive positions to reduce exposure.' },
];

export function matchRisk(overallScore: number): StrategyResult {
  const template = RISK_TEMPLATES.find(t => overallScore <= t.max) ?? RISK_TEMPLATES[RISK_TEMPLATES.length - 1];

  const actions: StrategyAction[] = [];
  if (overallScore <= 30) {
    actions.push({ label: 'Maintain stablecoin reserve', detail: 'Keep 20-30% in USDC/USDT' });
    actions.push({ label: 'Diversify sectors', detail: 'Avoid >50% in single sector' });
  } else if (overallScore <= 60) {
    actions.push({ label: 'Rebalance quarterly', detail: 'Review allocation every 3 months' });
    actions.push({ label: 'Trim top performers', detail: 'Take profits when single asset >35%' });
  } else if (overallScore <= 80) {
    actions.push({ label: 'Set stop-losses', detail: 'Define exit points for top 3 holdings' });
    actions.push({ label: 'Add defensive assets', detail: 'Allocate 10-15% to stables' });
  } else {
    actions.push({ label: 'Reduce concentration', detail: 'Trim positions >30% immediately' });
    actions.push({ label: 'Increase stable allocation', detail: 'Move 20%+ to USDC/USDT' });
    actions.push({ label: 'Review issuer risk', detail: 'Check backing and custody for all positions' });
  }

  return {
    id: 'risk-match',
    name: template.name,
    status: overallScore > 60 ? 'triggered' : 'ok',
    icon: overallScore > 60 ? 'alert-triangle' : 'shield-check',
    summary: `${template.label} profile (score: ${overallScore}). ${template.rationale}`,
    actions,
  };
}

// --- Pre-IPO Exposure ---
const PRE_IPO_SYMBOLS = ['SPCXx', 'PLTRx', 'CRCLx', 'SNAPx', 'UBERx'];

export function checkPreIpo(holdings: Holding[], markets: PreStockMarket[]): StrategyResult {
  const hasExposure = holdings.some(h => PRE_IPO_SYMBOLS.some(s => h.symbol?.toUpperCase().includes(s.toUpperCase())));
  const availableMarkets = markets.filter(m => m.markPrice && m.markPrice > 0);

  if (hasExposure) {
    return {
      id: 'pre-ipo',
      name: 'Pre-IPO Exposure',
      status: 'ok',
      icon: 'shield-check',
      summary: `You have pre-IPO exposure. ${availableMarkets.length} markets available.`,
      actions: [],
    };
  }

  const actions: StrategyAction[] = [];
  if (availableMarkets.length > 0) {
    const top = availableMarkets.slice(0, 3).map(m => m.symbol).join(', ');
    actions.push({
      label: 'Explore PreStocks markets',
      detail: `${availableMarkets.length} markets available. Top: ${top}`,
    });
    actions.push({
      label: 'Learn about PreStocks',
      detail: 'Each token = economic exposure to one share of the company',
    });
  }

  return {
    id: 'pre-ipo',
    name: 'Pre-IPO Exposure',
    status: 'triggered',
    icon: 'alert-triangle',
    summary: 'No pre-IPO exposure detected. Consider diversifying into PreStocks.',
    actions,
  };
}
