// ===== SolarVerse Calculation Engine =====
// Ported from v7 HTML — 60 combinations (3 sizes × 5 battery strategies × 4 rate scenarios)

export const C = {
  mKWh: 2829, dKWh: 94.3, rate0: 4.50, psh: 4.0, deg: 0.008, invReplace: 80000, maintPerKW: 800,
};

export interface SystemSpec { name: string; kw: number; inv: string; cost: number; self0: number; color: string; }

export const SYS: Record<number, SystemSpec> = {
  20: { name: '20KW', kw: 20, inv: 'SUN2000-20K-MB0', cost: 510000, self0: 0.55, color: '#3498db' },
  25: { name: '25KW', kw: 25, inv: 'SUN2000-25K-MB0', cost: 615000, self0: 0.52, color: '#e67e22' },
  30: { name: '30KW', kw: 30, inv: 'SUN2000-30KTL-M3+SEC', cost: 720000, self0: 0.48, color: '#27ae60' },
};

export const SELF_MAP: Record<number, Record<number, number>> = {
  20: { 0: 0.55, 6.9: 0.72, 13.8: 0.86, 20.7: 0.93 },
  25: { 0: 0.52, 6.9: 0.68, 13.8: 0.83, 20.7: 0.91 },
  30: { 0: 0.48, 6.9: 0.64, 13.8: 0.79, 20.7: 0.89 },
};

export const MODULE_PRICE_TODAY = 153000;

export const BATT_DECLINE: Record<string, number[]> = {
  optimistic:  [153000, 137000, 119000, 103000, 89000, 77000, 67000, 60000, 54000, 49000],
  moderate:    [153000, 140000, 126000, 115000, 105000, 96000, 88000, 81000, 75000, 70000],
  pessimistic: [153000, 145000, 138000, 131000, 125000, 119000, 114000, 109000, 104000, 100000],
};

export interface RateScenario { l: string; g: number; spike?: boolean; sy?: number[]; sr?: number; psr?: number; }

export const RS: Record<string, RateScenario> = {
  conservative: { l: 'Conservative 2%', g: 0.02 },
  base: { l: 'Base 3%', g: 0.03 },
  aggressive: { l: 'Aggressive 5%', g: 0.05 },
  iranSpike: { l: 'Iran Spike', g: 0.03, spike: true, sy: [1, 2], sr: 6.50, psr: 5.20 },
};

export const STRAT_NAMES: Record<string, string> = {
  none: 'ไม่ซื้อ Battery',
  buy1now: 'ซื้อ 1 ก้อนวันนี้ + ปี3,5',
  phased: 'ทยอยซื้อ ปี3+5+7',
  phase2only: 'ทยอยซื้อ 2 ก้อน ปี3+5',
  allnow: 'ซื้อ 3 ก้อนวันนี้',
};

export const STRATEGIES = ['none', 'buy1now', 'phased', 'phase2only', 'allnow'] as const;
export const SIZES = [20, 25, 30] as const;
export const RATES = ['conservative', 'base', 'aggressive', 'iranSpike'] as const;

export function gRate(rk: string, y: number): number {
  const s = RS[rk];
  if (s.spike && s.sy && s.sy.includes(y)) return s.sr!;
  if (s.spike && y <= 3) return (s.psr || 5.20) * Math.pow(1 + s.g, y - 3);
  return C.rate0 * Math.pow(1 + s.g, y);
}

interface StratStep { y: number; mod: number; }

export function getStrat(name: string): StratStep[] {
  switch (name) {
    case 'phased': return [{ y: 3, mod: 1 }, { y: 5, mod: 1 }, { y: 7, mod: 1 }];
    case 'buy1now': return [{ y: 1, mod: 1 }, { y: 3, mod: 1 }, { y: 5, mod: 1 }];
    case 'allnow': return [{ y: 1, mod: 3 }];
    case 'none': return [];
    case 'phase2only': return [{ y: 3, mod: 1 }, { y: 5, mod: 1 }];
    default: return [];
  }
}

export function getBattCost(year: number, scenario = 'moderate'): number {
  const idx = Math.min(year - 1, BATT_DECLINE[scenario].length - 1);
  return BATT_DECLINE[scenario][Math.max(0, idx)];
}

export interface CashFlowRow { y: number; rate: number; battKWh: number; sr: number; prod: number; usable: number; saving: number; costs: number; battCost: number; net: number; cum: number; }

export function calcCF(sysKW: number, stratName: string, rk: string, battScenario = 'moderate'): CashFlowRow[] {
  const sys = SYS[sysKW];
  const strat = getStrat(stratName);
  const cf: CashFlowRow[] = [];
  let cum = -sys.cost;
  const dp = sys.kw * C.psh;
  let totalBattKWh = 0;
  const battPurchases: { year: number; kWh: number; cost: number }[] = [];

  strat.forEach(s => {
    for (let m = 0; m < s.mod; m++) {
      battPurchases.push({ year: s.y, kWh: 6.9, cost: getBattCost(s.y, battScenario) });
    }
  });

  for (let y = 1; y <= 25; y++) {
    const deg = Math.pow(1 - C.deg, y - 1);
    const prod = dp * deg * 365;
    const need = C.mKWh * 12;
    let battCostThisYear = 0;
    battPurchases.forEach(bp => {
      if (bp.year === y) { totalBattKWh += bp.kWh; battCostThisYear += bp.cost; }
    });
    cum -= battCostThisYear;
    const sm = SELF_MAP[sysKW];
    const keys = Object.keys(sm).map(Number).sort((a, b) => a - b);
    let selfRate = sm[0];
    for (const k of keys) { if (totalBattKWh >= k) selfRate = sm[k]; }
    for (let i = 0; i < keys.length - 1; i++) {
      if (totalBattKWh >= keys[i] && totalBattKWh <= keys[i + 1]) {
        const frac = (totalBattKWh - keys[i]) / (keys[i + 1] - keys[i]);
        selfRate = sm[keys[i]] + (sm[keys[i + 1]] - sm[keys[i]]) * frac;
        break;
      }
    }
    const usable = Math.min(prod * selfRate, need);
    const rate = gRate(rk, y);
    const saving = usable * rate;
    const maint = sys.kw * C.maintPerKW;
    let extra = 0;
    if (y === 12) extra = C.invReplace;
    battPurchases.forEach(bp => { if (y === bp.year + 10) extra += getBattCost(y, 'moderate'); });
    const net = saving - maint - extra;
    cum += net;
    cf.push({
      y, rate: +rate.toFixed(2), battKWh: +totalBattKWh.toFixed(1),
      sr: Math.round(selfRate * 100), prod: Math.round(prod), usable: Math.round(usable),
      saving: Math.round(saving), costs: Math.round(maint + extra + battCostThisYear),
      battCost: Math.round(battCostThisYear), net: Math.round(net - battCostThisYear), cum: Math.round(cum),
    });
  }
  return cf;
}

export function findBE(cf: CashFlowRow[]): number {
  for (const c of cf) { if (c.cum >= 0) return c.y; }
  return 99;
}

export function calcIRR(sysKW: number, stratName: string, rk: string): number {
  const sys = SYS[sysKW];
  const stratDef = getStrat(stratName);
  const cf = calcCF(sysKW, stratName, rk);
  const flows: number[] = [-sys.cost];
  stratDef.forEach(s => {
    for (let m = 0; m < s.mod; m++) {
      while (flows.length < s.y) flows.push(0);
      flows[s.y - 1] -= (s.y === 1 ? MODULE_PRICE_TODAY : getBattCost(s.y));
    }
  });
  for (let y = 1; y <= 25; y++) {
    while (flows.length < y + 1) flows.push(0);
    flows[y] = (flows[y] || 0) + cf[y - 1].net + (cf[y - 1].battCost || 0);
  }
  function calcNPV(rate: number, fl: number[]): number {
    let npv = 0;
    fl.forEach((f, i) => { npv += f / Math.pow(1 + rate, i); });
    return npv;
  }
  let irr = 0.10;
  for (let iter = 0; iter < 100; iter++) {
    const npv = calcNPV(irr, flows);
    const npv2 = calcNPV(irr + 0.001, flows);
    const deriv = (npv2 - npv) / 0.001;
    if (Math.abs(deriv) < 0.001) break;
    irr = irr - npv / deriv;
    if (irr < -0.5) irr = -0.5;
    if (irr > 2) irr = 2;
  }
  return irr;
}

export function getTotalInvest(sysKW: number, stratName: string): number {
  const sys = SYS[sysKW]; const strat = getStrat(stratName);
  let total = sys.cost;
  strat.forEach(s => { for (let m = 0; m < s.mod; m++) { total += (s.y === 1 ? MODULE_PRICE_TODAY : getBattCost(s.y)); } });
  return total;
}

export function getBattTotal(stratName: string): number {
  const strat = getStrat(stratName); let total = 0;
  strat.forEach(s => { for (let m = 0; m < s.mod; m++) { total += (s.y === 1 ? MODULE_PRICE_TODAY : getBattCost(s.y)); } });
  return total;
}

export interface ScoreResult {
  profit25: number; be: number; irr: number; totalInvest: number; score: number;
  sysKW: number; stratName: string; profitScore: number; irrScore: number; beScore: number;
}

export function calcScore(sysKW: number, stratName: string, rk: string): ScoreResult {
  const cf = calcCF(sysKW, stratName, rk);
  const profit25 = cf[24].cum; const be = findBE(cf);
  const irr = calcIRR(sysKW, stratName, rk);
  const totalInvest = getTotalInvest(sysKW, stratName);
  const profitScore = Math.min(100, Math.max(0, (profit25 / 3000000) * 100));
  const irrScore = Math.min(100, Math.max(0, irr * 100 / 20 * 100));
  const beScore = be >= 99 ? 0 : Math.min(100, Math.max(0, (15 - be) / 15 * 100));
  const investScore = Math.min(100, Math.max(0, (1000000 - totalInvest) / 500000 * 100));
  const strat = getStrat(stratName);
  const totalMod = strat.reduce((a, s) => a + s.mod, 0);
  const riskScore = (3 - totalMod) / 3 * 100 * 0.5 + 50;
  const score = profitScore * 0.35 + irrScore * 0.25 + beScore * 0.20 + investScore * 0.10 + riskScore * 0.10;
  return { profit25, be, irr, totalInvest, score, sysKW, stratName, profitScore, irrScore, beScore };
}

export function getAllScores(rk: string = 'base'): ScoreResult[] {
  const all: ScoreResult[] = [];
  SIZES.forEach(kw => { STRATEGIES.forEach(s => { all.push(calcScore(kw, s, rk)); }); });
  all.sort((a, b) => b.score - a.score);
  return all;
}

export const fmt = (n: number) => n.toLocaleString('th-TH');

export const BATT_HIST_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
export const BATT_HIST_PRICES = [380, 290, 220, 185, 160, 140, 132, 150, 139, 115, 108];
export const PACK_FORECAST = [70, 65, 58, 52, 47, 43, 39, 36, 33, 31];
