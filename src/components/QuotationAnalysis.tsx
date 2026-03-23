'use client';
import { useMemo, useState } from 'react';
import { C, SYS, STRAT_NAMES, STRATEGIES, RS, calcCF, findBE, calcIRR, getTotalInvest, getBattTotal, fmt } from '@/lib/solar-engine';
import { Card, BentoCard, TableWrap, Alert, MetricBox, Select, SelectorRow } from './ui';
import ChartWrapper from './ChartWrapper';
import type { ChartConfiguration } from 'chart.js';

// ===== QUOTATION DATA FROM TCS POWER PLUS (23/03/2026) =====
const QUOTES = {
  A: {
    id: 'QT2026030502',
    name: 'String 30kW 3P',
    vendor: 'TCS Power Plus Co., Ltd.',
    date: '23/03/2026',
    salesperson: 'à¸£à¸±à¸à¸à¸´à¸¡à¸² à¸¢à¹à¸³à¸à¸¡',
    systemKW: 30,
    panels: { model: 'Aiko 645W (Tier 1)', qty: 48, totalW: 30960 },
    inverter: { model: 'HUAWEI SUN2000-M3', power: '30kW', phase: '3 Phase' },
    priceBeforeVAT: 462616.82,
    vat: 32383.18,
    totalPrice: 495000,
    hasOptimizer: false,
    warranty: {
      panel: '15 à¸à¸µ à¸­à¸¸à¸à¸à¸£à¸à¹ / 30 à¸à¸µ à¸à¸¥à¸´à¸à¹à¸ 80%',
      inverter: '10 à¸à¸µ à¸à¸²à¸ Huawei',
      installation: '5 à¸à¸µ',
      roof: '5 à¸à¸µ',
    },
    includes: [
      'Smart Meter DTSU666-H (3 phase)',
      'Solar Combiner 3 Phase + SPD',
      'à¸à¸´à¸à¸à¸±à¹à¸ Solar Rooftop + à¹à¸à¸´à¸à¸ªà¸²à¸¢',
      'SLD + à¸§à¸´à¸¨à¸§à¸à¸£à¸¥à¸à¸à¸²à¸¡',
      'à¸à¸­à¸­à¸à¸¸à¸à¸²à¸ MEA/PEA',
      'à¸¥à¹à¸²à¸à¹à¸à¸ + PM 5 à¸à¸µ (à¸à¸µà¸¥à¸° 1 à¸à¸£à¸±à¹à¸)',
      'à¸à¸²à¸à¹à¸²à¸¢à¸à¸±à¸à¸à¸à¸ªà¸³à¸«à¸£à¸±à¸à¹à¸à¸',
      'Zero Export (à¸à¸±à¸à¸¢à¹à¸­à¸)',
    ],
  },
  B: {
    id: 'QT2026030503',
    name: 'String 30kW 3P + Optimizer',
    vendor: 'TCS Power Plus Co., Ltd.',
    date: '23/03/2026',
    salesperson: 'à¸£à¸±à¸à¸à¸´à¸¡à¸² à¸¢à¹à¸³à¸à¸¡',
    systemKW: 30,
    panels: { model: 'Aiko 645W (Tier 1)', qty: 48, totalW: 30960 },
    inverter: { model: 'HUAWEI SUN2000-M3', power: '30kW', phase: '3 Phase' },
    priceBeforeVAT: 462616.82,
    vat: 32383.18,
    totalPrice: 495000,
    hasOptimizer: true,
    optimizer: {
      model: 'Huawei SUN2000-600W-P',
      benefits: [
        'à¹à¸à¹à¸à¸±à¸à¸«à¸²à¹à¸à¸²à¸à¸±à¸ à¹à¸à¸´à¹à¸¡à¸à¸¥à¸à¸¥à¸´à¸à¹à¸à¹à¸à¸¶à¸ 25%',
        'Rapid Stopper (NEC2017) â à¸à¸¥à¸­à¸à¸ à¸±à¸¢à¸à¸¶à¹à¸',
        'à¸à¸£à¸§à¸à¸ªà¸­à¸à¸à¸¥à¸à¸¥à¸´à¸à¸£à¸²à¸¢à¹à¸à¸à¸à¹à¸²à¸ FusionSolar',
        'à¹à¸à¹ mismatch loss à¸à¸²à¸à¸«à¸¥à¸±à¸à¸à¸²à¹à¸¡à¹à¹à¸à¹à¸²à¸à¸±à¸',
        'Long String Design â à¸¥à¸à¸à¸³à¸à¸§à¸ String',
        'IP68 â à¸à¸à¸à¹à¸³/à¸à¸¸à¹à¸',
      ],
      warranty: '25 à¸à¸µ',
    },
    warranty: {
      panel: '15 à¸à¸µ à¸­à¸¸à¸à¸à¸£à¸à¹ / 30 à¸à¸µ à¸à¸¥à¸´à¸à¹à¸ 80%',
      inverter: '10 à¸à¸µ à¸à¸²à¸ Huawei',
      installation: '5 à¸à¸µ',
      roof: '5 à¸à¸µ',
      optimizer: '25 à¸à¸µ',
    },
    includes: [
      'Smart Meter DTSU666-H (3 phase)',
      'Solar Combiner 3 Phase + SPD',
      'à¸à¸´à¸à¸à¸±à¹à¸ Solar Rooftop + à¹à¸à¸´à¸à¸ªà¸²à¸¢',
      'SLD + à¸§à¸´à¸¨à¸§à¸à¸£à¸¥à¸à¸à¸²à¸¡',
      'à¸à¸­à¸­à¸à¸¸à¸à¸²à¸ MEA/PEA',
      'à¸¥à¹à¸²à¸à¹à¸à¸ + PM 5 à¸à¸µ (à¸à¸µà¸¥à¸° 1 à¸à¸£à¸±à¹à¸)',
      'à¸à¸²à¸à¹à¸²à¸¢à¸à¸±à¸à¸à¸à¸ªà¸³à¸«à¸£à¸±à¸à¹à¸à¸',
      'Zero Export (à¸à¸±à¸à¸¢à¹à¸­à¸)',
      'Huawei Smart PV Optimizer',
    ],
  },
};

// Market price benchmark (THB/Watt) for 30kW rooftop in Thailand Q1-2026
const MARKET = {
  low: 14.0,
  avg: 17.0,
  high: 22.0,
  engineDefault: SYS[30].cost, // 720,000
};

// ===== CUSTOM CALC FUNCTIONS WITH REAL QUOTE PRICE =====
function calcCFQuote(quoteCost: number, stratName: string, rk: string, battScenario = 'moderate') {
  // Clone the CF logic but override system cost
  const sysKW = 30;
  const origCF = calcCF(sysKW, stratName, rk, battScenario);
  const costDiff = SYS[sysKW].cost - quoteCost;
  // Adjust cumulative: shift up by costDiff (cheaper system = more cum profit)
  return origCF.map(row => ({
    ...row,
    cum: row.cum + costDiff,
  }));
}

function findBEQuote(quoteCost: number, stratName: string, rk: string) {
  const cf = calcCFQuote(quoteCost, stratName, rk);
  for (const c of cf) { if (c.cum >= 0) return c.y; }
  return 99;
}

function calcIRRQuote(quoteCost: number, stratName: string, rk: string) {
  // Recalculate IRR with real quote cost
  const sysKW = 30;
  const cf = calcCF(sysKW, stratName, rk);
  const strat = getStratLocal(stratName);

  const flows: number[] = [-quoteCost]; // Use real quote cost
  strat.forEach((s: {y:number;mod:number}) => {
    for (let m = 0; m < s.mod; m++) {
      while (flows.length < s.y) flows.push(0);
      flows[s.y - 1] -= (s.y === 1 ? 153000 : getBattCostLocal(s.y));
    }
  });
  for (let y = 1; y <= 25; y++) {
    while (flows.length < y + 1) flows.push(0);
    flows[y] = (flows[y] || 0) + cf[y - 1].net + (cf[y - 1].battCost || 0);
  }

  function calcNPV(rate: number, fl: number[]) {
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

function getStratLocal(name: string) {
  switch (name) {
    case 'phased': return [{ y: 3, mod: 1 }, { y: 5, mod: 1 }, { y: 7, mod: 1 }];
    case 'buy1now': return [{ y: 1, mod: 1 }, { y: 3, mod: 1 }, { y: 5, mod: 1 }];
    case 'allnow': return [{ y: 1, mod: 3 }];
    case 'none': return [];
    case 'phase2only': return [{ y: 3, mod: 1 }, { y: 5, mod: 1 }];
    default: return [];
  }
}

function getBattCostLocal(year: number) {
  const decline = [153000, 140000, 126000, 115000, 105000, 96000, 88000, 81000, 75000, 70000];
  const idx = Math.min(year - 1, decline.length - 1);
  return decline[Math.max(0, idx)];
}

export default function QuotationAnalysis() {
  const [selectedRate, setSelectedRate] = useState('base');
  const quotePrice = QUOTES.B.totalPrice; // Use optimizer version (same price, more features)

  // === Compute all scenarios with real quote price ===
  const scenarios = useMemo(() => {
    const results: {
      strat: string; stratLabel: string; rateKey: string; rateLabel: string;
      be: number; beQuote: number; profit25: number; profit25Quote: number;
      irr: number; irrQuote: number; totalInvest: number; totalInvestQuote: number;
    }[] = [];

    STRATEGIES.forEach(strat => {
      (['conservative', 'base', 'aggressive', 'iranSpike'] as const).forEach(rk => {
        const origBE = findBE(calcCF(30, strat, rk));
        const quoteBE = findBEQuote(quotePrice, strat, rk);
        const origCF = calcCF(30, strat, rk);
        const quoteCF = calcCFQuote(quotePrice, strat, rk);
        const origIRR = calcIRR(30, strat, rk);
        const quoteIRR = calcIRRQuote(quotePrice, strat, rk);
        const origInvest = getTotalInvest(30, strat);
        const battCost = getBattTotal(strat);
        results.push({
          strat, stratLabel: STRAT_NAMES[strat],
          rateKey: rk, rateLabel: RS[rk].l,
          be: origBE, beQuote: quoteBE,
          profit25: origCF[24].cum, profit25Quote: quoteCF[24].cum,
          irr: origIRR, irrQuote: quoteIRR,
          totalInvest: origInvest, totalInvestQuote: quotePrice + battCost,
        });
      });
    });
    return results;
  }, [quotePrice]);

  // Filter by selected rate
  const filtered = scenarios.filter(s => s.rateKey === selectedRate);

  // Best option with quote price
  const best = [...filtered].sort((a, b) => b.profit25Quote - a.profit25Quote)[0];

  // === Per-watt analysis ===
  const perWattQuote = quotePrice / (QUOTES.B.panels.totalW);
  const perWattEngine = MARKET.engineDefault / 30000;
  const savings = MARKET.engineDefault - quotePrice;
  const savingsPct = ((savings / MARKET.engineDefault) * 100).toFixed(1);

  // === Charts ===
  const labels25 = Array.from({ length: 25 }, (_, i) => `à¸à¸µ ${i + 1}`);

  // Chart 1: Quote vs Engine default cumulative (no battery)
  const compareConfig: ChartConfiguration = useMemo(() => {
    const cfEngine = calcCF(30, 'none', selectedRate);
    const cfQuote = calcCFQuote(quotePrice, 'none', selectedRate);
    return {
      type: 'line',
      data: {
        labels: labels25,
        datasets: [
          {
            label: `à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸ (${fmt(MARKET.engineDefault)} à¸¿)`,
            data: cfEngine.map(c => c.cum),
            borderColor: '#ff453a',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            borderDash: [5, 5],
          },
          {
            label: `à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸² TCS (${fmt(quotePrice)} à¸¿)`,
            data: cfQuote.map(c => c.cum),
            borderColor: '#30d158',
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.3,
          },
          {
            label: 'à¸à¸¸à¸à¸à¸¸à¹à¸¡à¸à¸¸à¸',
            data: Array(25).fill(0),
            borderColor: '#333',
            borderDash: [5, 5],
            borderWidth: 1,
            pointRadius: 0,
          },
        ],
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: { title: { display: true, text: 'à¸à¸²à¸ (à¸ªà¸°à¸ªà¸¡)' }, ticks: { callback: (v: unknown) => fmt(v as number) } },
        },
      },
    };
  }, [selectedRate, quotePrice]);

  // Chart 2: All strategies with quote price
  const stratColors = ['#ff9f0a', '#30d158', '#0a84ff', '#bf5af2', '#ff453a'];
  const allStratConfig: ChartConfiguration = useMemo(() => ({
    type: 'line',
    data: {
      labels: labels25,
      datasets: STRATEGIES.map((strat, i) => {
        const cf = calcCFQuote(quotePrice, strat, selectedRate);
        return {
          label: STRAT_NAMES[strat],
          data: cf.map(c => c.cum),
          borderColor: stratColors[i],
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
        };
      }),
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y: { title: { display: true, text: 'à¸à¸³à¹à¸£à¸ªà¸°à¸ªà¸¡ (à¸à¸²à¸)' }, ticks: { callback: (v: unknown) => fmt(v as number) } },
      },
    },
  }), [selectedRate, quotePrice]);

  // Chart 3: Price per watt comparison bar
  const priceCompareConfig: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: ['à¸à¸¥à¸²à¸ à¸à¹à¸³à¸ªà¸¸à¸', 'TCS Power Plus', 'à¸à¸¥à¸²à¸ à¹à¸à¸¥à¸µà¹à¸¢', 'à¸£à¸²à¸à¸² Engine', 'à¸à¸¥à¸²à¸ à¸ªà¸¹à¸à¸ªà¸¸à¸'],
      datasets: [{
        label: 'à¸à¸²à¸/à¸§à¸±à¸à¸à¹',
        data: [MARKET.low, +perWattQuote.toFixed(1), MARKET.avg, +perWattEngine.toFixed(1), MARKET.high],
        backgroundColor: [
          'rgba(48,209,88,0.3)', 'rgba(255,159,10,0.8)', 'rgba(134,134,139,0.3)',
          'rgba(255,69,58,0.3)', 'rgba(134,134,139,0.3)',
        ],
        borderColor: ['#30d158', '#ff9f0a', '#86868b', '#ff453a', '#86868b'],
        borderWidth: 2,
        borderRadius: 8,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { title: { display: true, text: 'à¸à¸²à¸/à¸§à¸±à¸à¸à¹' }, beginAtZero: true },
      },
    },
  };

  // Chart 4: IRR improvement bar
  const irrCompareConfig: ChartConfiguration = useMemo(() => ({
    type: 'bar',
    data: {
      labels: filtered.map(s => s.stratLabel),
      datasets: [
        {
          label: 'IRR à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸',
          data: filtered.map(s => +(s.irr * 100).toFixed(1)),
          backgroundColor: 'rgba(255,69,58,0.4)',
          borderColor: '#ff453a',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: 'IRR à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸² TCS',
          data: filtered.map(s => +(s.irrQuote * 100).toFixed(1)),
          backgroundColor: 'rgba(48,209,88,0.6)',
          borderColor: '#30d158',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y: { title: { display: true, text: 'IRR (%/à¸à¸µ)' }, beginAtZero: true },
      },
    },
  }), [filtered]);

  return (
    <div>
      {/* Header */}
      <div className="rounded-3xl p-6 mb-6" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.12), rgba(191,90,242,0.08))' }}>
        <h2 className="text-[#ff9f0a] font-bold text-base mb-3">
          ð à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸² â TCS Power Plus
        </h2>
        <p className="text-[14px] text-[#c8c8cc] leading-relaxed">
          à¹à¸à¸£à¸µà¸¢à¸à¹à¸à¸µà¸¢à¸ <strong className="text-[#f5f5f7]">2 à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸²</strong> à¸à¸²à¸ TCS Power Plus (23 à¸¡à¸µ.à¸. 2026) à¸à¸±à¸à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸à¹à¸¥à¸° Engine Model â{' '}
          à¸£à¸²à¸à¸²à¸à¸£à¸´à¸ <strong className="text-[#30d158]">{fmt(quotePrice)} à¸à¸²à¸</strong>{' '}
          à¸à¸¹à¸à¸à¸§à¹à¸²à¸£à¸²à¸à¸² Model <strong className="text-[#ff453a]">{savingsPct}%</strong> ({fmt(savings)} à¸à¸²à¸){' '}
          à¸à¸³à¹à¸«à¹ <strong className="text-[#bf5af2]">IRR à¸ªà¸¹à¸à¸à¸¶à¹à¸</strong> à¹à¸¥à¸° <strong className="text-[#30d158]">à¸à¸·à¸à¸à¸¸à¸à¹à¸£à¹à¸§à¸à¸¶à¹à¸</strong> à¸à¸¸à¸ Scenario
        </p>
      </div>

      {/* ===== SECTION 1: Quote Cards ===== */}
      <h3 className="text-sm font-semibold mb-4 text-[#86868b] tracking-wider uppercase">à¹à¸à¸£à¸µà¸¢à¸à¹à¸à¸µà¸¢à¸ 2 à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸²</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Quote A */}
        <div className="rounded-2xl overflow-hidden border border-[#2a2a2a]">
          <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #86868b, #555)' }}>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs opacity-70">Quote A</div>
                <h3 className="font-bold text-white">{QUOTES.A.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">{fmt(QUOTES.A.totalPrice)}</div>
                <div className="text-xs opacity-70">à¸à¸²à¸ (à¸£à¸§à¸¡ VAT)</div>
              </div>
            </div>
          </div>
          <div className="p-5 bg-[#111] space-y-0 text-[13px]">
            {[
              ['à¹à¸à¸à¹à¸à¸¥à¸²à¸£à¹', `${QUOTES.A.panels.model} Ã ${QUOTES.A.panels.qty}`],
              ['à¸à¸³à¸¥à¸±à¸à¸à¸¥à¸´à¸à¸à¸£à¸´à¸', `${(QUOTES.A.panels.totalW / 1000).toFixed(1)} kW`],
              ['Inverter', QUOTES.A.inverter.model],
              ['Optimizer', 'â à¹à¸¡à¹à¸¡à¸µ'],
              ['à¸£à¸²à¸à¸²/à¸§à¸±à¸à¸à¹', `${(QUOTES.A.totalPrice / QUOTES.A.panels.totalW).toFixed(1)} à¸à¸²à¸/W`],
              ['à¸à¸£à¸°à¸à¸±à¸à¹à¸à¸', QUOTES.A.warranty.panel],
              ['à¸à¸£à¸°à¸à¸±à¸ Inverter', QUOTES.A.warranty.inverter],
            ].map(([label, val], i) => (
              <div key={i} className="flex justify-between py-2.5 border-b border-[#1a1a1a]">
                <span className="text-[#6e6e73]">{label}</span>
                <span className="text-[#f5f5f7] font-medium text-right max-w-[60%]">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quote B â Recommended */}
        <div className="rounded-2xl overflow-hidden border-2 border-[#30d158] relative">
          <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: '#30d158', color: '#000' }}>
            à¹à¸à¸°à¸à¸³
          </div>
          <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #30d158, #1e8449)' }}>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs opacity-70">Quote B</div>
                <h3 className="font-bold text-white">{QUOTES.B.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">{fmt(QUOTES.B.totalPrice)}</div>
                <div className="text-xs opacity-70">à¸à¸²à¸ (à¸£à¸§à¸¡ VAT)</div>
              </div>
            </div>
          </div>
          <div className="p-5 bg-[#111] space-y-0 text-[13px]">
            {[
              ['à¹à¸à¸à¹à¸à¸¥à¸²à¸£à¹', `${QUOTES.B.panels.model} Ã ${QUOTES.B.panels.qty}`],
              ['à¸à¸³à¸¥à¸±à¸à¸à¸¥à¸´à¸à¸à¸£à¸´à¸', `${(QUOTES.B.panels.totalW / 1000).toFixed(1)} kW`],
              ['Inverter', QUOTES.B.inverter.model],
              ['Optimizer', `â ${QUOTES.B.optimizer!.model}`],
              ['à¸£à¸²à¸à¸²/à¸§à¸±à¸à¸à¹', `${(QUOTES.B.totalPrice / QUOTES.B.panels.totalW).toFixed(1)} à¸à¸²à¸/W`],
              ['à¸à¸£à¸°à¸à¸±à¸à¹à¸à¸', QUOTES.B.warranty.panel],
              ['à¸à¸£à¸°à¸à¸±à¸ Optimizer', QUOTES.B.warranty.optimizer || '-'],
            ].map(([label, val], i) => (
              <div key={i} className="flex justify-between py-2.5 border-b border-[#1a1a1a]">
                <span className="text-[#6e6e73]">{label}</span>
                <span className="text-[#f5f5f7] font-medium text-right max-w-[60%]">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Site condition */}
      <Alert type="info" title="à¸ªà¸ à¸²à¸à¸à¸·à¹à¸à¸à¸µà¹à¸à¸´à¸à¸à¸±à¹à¸ â à¹à¸¡à¹à¸¡à¸µà¹à¸à¸²à¸à¸±à¸">
        à¹à¸à¸à¸à¸°à¸§à¸²à¸à¹à¸à¸¢<strong className="text-[#f5f5f7]">à¹à¸¡à¹à¸¡à¸µà¸ªà¹à¸§à¸à¸à¸µà¹à¸à¸°à¹à¸à¸à¹à¸à¸²à¸à¸±à¸</strong> â Optimizer à¸à¹à¸§à¸¢à¹à¸£à¸·à¹à¸­à¸à¹à¸à¸²à¸à¸°à¹à¸¡à¹à¹à¸à¹à¹à¸à¹à¸à¸£à¸°à¹à¸¢à¸à¸à¹à¸«à¸¥à¸±à¸ à¹à¸à¹à¸¢à¸±à¸à¸¡à¸µà¸à¹à¸­à¸à¸µ: à¸à¸£à¸§à¸à¸ªà¸­à¸à¸à¸¥à¸à¸¥à¸´à¸à¸£à¸²à¸¢à¹à¸à¸à¸à¹à¸²à¸ FusionSolar, Rapid Stopper (à¸à¸¥à¸­à¸à¸ à¸±à¸¢), à¹à¸à¹ mismatch loss.{' '}
        à¸£à¸²à¸à¸²à¹à¸à¹à¸²à¸à¸±à¸à¸à¸±à¹à¸à¸ªà¸­à¸à¹à¸ ({fmt(quotePrice)} à¸à¸²à¸) â <strong className="text-[#30d158]">à¹à¸à¹à¸à¸£à¸µ à¹à¸¡à¹à¸à¹à¸­à¸à¸à¹à¸²à¸¢à¹à¸à¸´à¹à¸¡</strong>
      </Alert>

      {/* 20kW + Battery recommendation */}
      <Alert type="warn" title="à¸à¸³à¹à¸à¸°à¸à¸³à¸à¸²à¸ CEO â à¸à¹à¸²à¹à¸ªà¹ Battery à¹à¸à¸°à¸à¸³ 20kW MBO">
        <strong className="text-[#f5f5f7]">à¸à¹à¸²à¸à¹à¸­à¸à¸à¸²à¸£à¹à¸ªà¹ Battery à¸à¹à¸§à¸¢ â à¹à¸à¸°à¸à¸³à¸£à¸°à¸à¸ 20kW (SUN2000-20K-MB0)</strong> à¹à¸«à¸à¸¸à¸à¸¥: à¸£à¸°à¸à¸ 20kW à¸¡à¸µ Self-Use Rate à¸ªà¸¹à¸à¸à¸§à¹à¸² (55% vs 48%) à¹à¸¡à¸·à¹à¸­à¸£à¸§à¸¡à¸à¸±à¸ Battery à¸à¸°à¹à¸à¹à¹à¸à¸à¸µà¹à¸à¸¥à¸´à¸à¹à¸à¹à¸à¸¸à¹à¸¡à¸à¸§à¹à¸² à¸¥à¸à¸à¸¸à¸à¸à¹à¸­à¸¢à¸à¸§à¹à¸² à¸à¸·à¸à¸à¸¸à¸à¹à¸£à¹à¸§à¸à¸§à¹à¸².{' '}
        <strong className="text-[#ff9f0a]">à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸²à¸à¸µà¹à¹à¸à¹à¸ 30kW</strong> â à¸à¸§à¸£à¸à¸­à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸² 20kW + Battery à¸à¸²à¸ TCS Power Plus à¹à¸à¸´à¹à¸¡à¹à¸à¸·à¹à¸­à¹à¸à¸£à¸µà¸¢à¸à¹à¸à¸µà¸¢à¸
      </Alert>

      {/* ===== SECTION 2: Market Price Comparison ===== */}
      <h3 className="text-sm font-semibold mb-4 text-[#86868b] tracking-wider uppercase">à¹à¸à¸µà¸¢à¸à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <BentoCard label="à¸£à¸²à¸à¸²à¹à¸à¹à¸ªà¸à¸­" value={`${perWattQuote.toFixed(1)}`} sub="à¸à¸²à¸/à¸§à¸±à¸à¸à¹" accent="orange" />
        <BentoCard label="à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸à¹à¸à¸¥à¸µà¹à¸¢" value={`${MARKET.avg}`} sub="à¸à¸²à¸/à¸§à¸±à¸à¸à¹ (30kW)" accent="blue" />
        <BentoCard label="à¸à¸¹à¸à¸à¸§à¹à¸² Engine" value={`${savingsPct}%`} sub={`à¸à¸£à¸°à¸«à¸¢à¸±à¸ ${fmt(savings)} à¸à¸²à¸`} accent="green" />
        <BentoCard label="à¸£à¸²à¸à¸²à¸à¹à¸³à¸à¸§à¹à¸²à¸à¸¥à¸²à¸" value={`${((1 - perWattQuote / MARKET.avg) * 100).toFixed(0)}%`} sub="à¹à¸à¸µà¸¢à¸à¸£à¸²à¸à¸²à¹à¸à¸¥à¸µà¹à¸¢ 30kW" accent="purple" />
      </div>

      <Card title="ð à¹à¸à¸µà¸¢à¸à¸£à¸²à¸à¸²/à¸§à¸±à¸à¸à¹ à¸à¸±à¸à¸à¸¥à¸²à¸" className="mb-6">
        <ChartWrapper config={priceCompareConfig} height="300px" />
      </Card>

      {/* ===== SECTION 3: Scenario Analysis with Real Quote ===== */}
      <h3 className="text-sm font-semibold mb-4 text-[#86868b] tracking-wider uppercase">à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹ Scenarios à¸à¸²à¸à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸²à¸à¸£à¸´à¸</h3>

      <SelectorRow>
        <Select
          label="à¸ªà¸à¸²à¸à¸à¸²à¸£à¸à¹à¸à¹à¸²à¹à¸"
          value={selectedRate}
          onChange={setSelectedRate}
          options={Object.entries(RS).map(([k, v]) => ({ value: k, label: v.l }))}
        />
      </SelectorRow>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <BentoCard
          label="à¸à¸·à¸à¸à¸¸à¸ (à¹à¸¡à¹ Battery)"
          value={`${findBEQuote(quotePrice, 'none', selectedRate)} à¸à¸µ`}
          sub={`à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸: ${findBE(calcCF(30, 'none', selectedRate))} à¸à¸µ`}
          accent="green"
        />
        <BentoCard
          label="à¸à¸³à¹à¸£ 25 à¸à¸µ (à¹à¸¡à¹ Batt)"
          value={`${fmt(calcCFQuote(quotePrice, 'none', selectedRate)[24].cum)}`}
          sub={`à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸: ${fmt(calcCF(30, 'none', selectedRate)[24].cum)} à¸à¸²à¸`}
          accent="orange"
        />
        <BentoCard
          label="IRR (à¹à¸¡à¹ Battery)"
          value={`${(calcIRRQuote(quotePrice, 'none', selectedRate) * 100).toFixed(1)}%`}
          sub={`à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸: ${(calcIRR(30, 'none', selectedRate) * 100).toFixed(1)}%`}
          accent="purple"
        />
        <BentoCard
          label="à¸à¸µà¸à¸§à¹à¸²à¸à¸²à¸à¸à¸£à¸°à¸à¸³"
          value={`${(calcIRRQuote(quotePrice, 'none', selectedRate) / 0.0072).toFixed(0)}x`}
          sub="à¹à¸à¸µà¸¢à¸à¸à¸­à¸à¹à¸à¸µà¹à¸¢ 0.72%/à¸à¸µ"
          accent="cyan"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card title="ð à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸ vs à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸² â Cash Flow 25 à¸à¸µ">
          <ChartWrapper config={compareConfig} />
        </Card>
        <Card title="ð IRR Improvement â à¸à¸¸à¸à¸à¸¥à¸¢à¸¸à¸à¸à¹ Battery">
          <ChartWrapper config={irrCompareConfig} />
        </Card>
      </div>

      <Card title="ð 5 à¸à¸¥à¸¢à¸¸à¸à¸à¹ Battery â Cumulative Cash Flow (à¸£à¸²à¸à¸²à¹à¸à¹à¸ªà¸à¸­)" className="mb-6">
        <ChartWrapper config={allStratConfig} />
      </Card>

      {/* ===== SECTION 4: Full Comparison Table ===== */}
      <Card title="ð à¸à¸²à¸£à¸²à¸ Scenarios à¸à¸±à¹à¸à¸«à¸¡à¸ â 30kW + Optimizer (TCS Quote)" badge={`${filtered.length} strategies`} className="mb-6">
        <TableWrap
          headers={['à¸à¸¥à¸¢à¸¸à¸à¸à¹', 'à¸¥à¸à¸à¸¸à¸à¸£à¸§à¸¡', 'à¸à¸·à¸à¸à¸¸à¸', 'à¸à¸³à¹à¸£ 25 à¸à¸µ', 'IRR', 'à¹à¸à¸µà¸¢à¸à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸', 'à¸à¸³à¹à¸£à¹à¸à¸´à¹à¸¡']}
          rows={filtered.map((s, i) => [
            s.stratLabel,
            `${fmt(s.totalInvestQuote)} à¸¿`,
            s.beQuote >= 99 ? '>25 à¸à¸µ' : `${s.beQuote} à¸à¸µ`,
            <span key={`p${i}`} className="text-[#30d158] font-bold">{fmt(s.profit25Quote)} à¸¿</span>,
            <span key={`irr${i}`} className="text-[#bf5af2] font-bold">{(s.irrQuote * 100).toFixed(1)}%</span>,
            `à¸à¸·à¸à¸à¸¸à¸ ${s.be >= 99 ? '>25' : s.be} à¸à¸µ / à¸à¸³à¹à¸£ ${fmt(s.profit25)} à¸¿`,
            <span key={`d${i}`} className="text-[#ff9f0a] font-bold">+{fmt(s.profit25Quote - s.profit25)} à¸¿</span>,
          ])}
          highlightBest={[0]}
        />
        <p className="text-[11px] text-[#6e6e73] mt-3 italic">
          * à¸à¸¥à¸¢à¸¸à¸à¸à¹ Battery à¸¢à¸±à¸à¸à¸à¹à¸à¹à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸à¸à¸²à¸ BNEF Forecast â à¹à¸à¸à¸²à¸°à¸à¹à¸à¸à¸¸à¸à¸£à¸°à¸à¸ Solar à¸à¸µà¹à¹à¸à¹à¸£à¸²à¸à¸²à¸à¸£à¸´à¸à¸à¸²à¸à¹à¸à¹à¸ªà¸à¸­
        </p>
      </Card>

      {/* ===== SECTION 5: 20kW vs 30kW Comparison ===== */}
      <h3 className="text-sm font-semibold mb-4 text-[#86868b] tracking-wider uppercase">à¹à¸à¸£à¸µà¸¢à¸à¹à¸à¸µà¸¢à¸ 20kW + Battery vs 30kW Solar Only</h3>
      <Card title="ð 20kW+Battery vs 30kW â à¸à¹à¸­à¸¡à¸¹à¸¥à¸à¸²à¸ Engine Model" badge="à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸² vs Model" className="mb-6">
        <TableWrap
          headers={['à¸£à¸²à¸¢à¸à¸²à¸£', '30kW (à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸² TCS)', '20kW + Battery (Model)']}
          rows={(() => {
            const cf30q = calcCFQuote(quotePrice, 'none', selectedRate);
            const cf20b = calcCF(20, 'phase2only', selectedRate);
            const irr30q = calcIRRQuote(quotePrice, 'none', selectedRate);
            const irr20b = calcIRR(20, 'phase2only', selectedRate);
            const invest20b = getTotalInvest(20, 'phase2only');
            return [
              ['à¸¥à¸à¸à¸¸à¸ Solar', `${fmt(quotePrice)} à¸¿ (à¹à¸à¹à¸ªà¸à¸­à¸à¸£à¸´à¸)`, `${fmt(SYS[20].cost)} à¸¿ (à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸)`],
              ['à¸¥à¸à¸à¸¸à¸ Battery', 'â', `${fmt(getBattTotal('phase2only'))} à¸¿ (2 à¸à¹à¸­à¸ à¸à¸µ3+5)`],
              ['à¸¥à¸à¸à¸¸à¸à¸£à¸§à¸¡', `${fmt(quotePrice)} à¸¿`, `${fmt(invest20b)} à¸¿`],
              ['Self-Use Rate à¹à¸£à¸´à¹à¸¡à¸à¹à¸', '48%', '52% â 83% (à¸¡à¸µ Batt)'],
              ['à¸à¸·à¸à¸à¸¸à¸', `${findBEQuote(quotePrice, 'none', selectedRate)} à¸à¸µ`, `${findBE(cf20b)} à¸à¸µ`],
              ['à¸à¸³à¹à¸£ 25 à¸à¸µ', `${fmt(cf30q[24].cum)} à¸¿`, `${fmt(cf20b[24].cum)} à¸¿`],
              ['IRR', `${(irr30q * 100).toFixed(1)}%`, `${(irr20b * 100).toFixed(1)}%`],
              ['à¹à¸à¸²à¸à¸±à¸', 'â à¹à¸¡à¹à¸¡à¸µà¸à¸±à¸à¸«à¸²', 'â à¹à¸¡à¹à¸¡à¸µà¸à¸±à¸à¸«à¸²'],
              ['Inverter', 'SUN2000-M3 (30kW)', 'SUN2000-20K-MB0'],
            ];
          })()}
        />
        <p className="text-[11px] text-[#6e6e73] mt-3 italic">
          * 20kW à¹à¸à¹à¸£à¸²à¸à¸²à¸à¸¥à¸²à¸à¸à¸²à¸ Model ({fmt(SYS[20].cost)} à¸¿) â à¸à¸§à¸£à¸à¸­à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸²à¸à¸£à¸´à¸à¸à¸²à¸ TCS à¹à¸à¸·à¹à¸­à¹à¸à¸£à¸µà¸¢à¸à¹à¸à¸µà¸¢à¸à¸à¸µà¹à¹à¸¡à¹à¸à¸¢à¸³
        </p>
      </Card>

      {/* ===== SECTION 6: What's Included ===== */}
      <Card title="â à¸£à¸²à¸¢à¸à¸²à¸£à¸à¸µà¹à¸£à¸§à¸¡à¹à¸à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸²" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          {QUOTES.B.includes.map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-[#1a1a1a] text-[13px]">
              <span className="text-[#30d158]">â</span>
              <span className="text-[#c8c8cc]">{item}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ===== SECTION 6: CEO Recommendation ===== */}
      <div className="rounded-3xl p-6 mb-6 border-2 border-[#ff9f0a]" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.08), rgba(255,103,35,0.04))' }}>
        <h3 className="text-[#ff9f0a] font-bold text-base mb-4">CEO Decision â à¸ªà¸£à¸¸à¸à¸à¸³à¹à¸à¸°à¸à¸³</h3>
        <div className="space-y-3 text-[14px] text-[#c8c8cc] leading-relaxed">
          <div className="flex gap-3 items-start">
            <span className="text-[#30d158] text-lg">A</span>
            <div><strong className="text-[#f5f5f7]">à¸à¹à¸²à¹à¸¡à¹à¹à¸ªà¹ Battery (Solar Only)</strong> â à¹à¸¥à¸·à¸­à¸ <strong className="text-[#ff9f0a]">Quote B (30kW + Optimizer) à¸£à¸²à¸à¸² {fmt(quotePrice)} à¸à¸²à¸</strong>. à¸£à¸²à¸à¸²à¹à¸à¹à¸² Quote A à¹à¸à¹à¹à¸à¹ Optimizer à¸à¸£à¸µ. à¸à¸·à¸à¸à¸¸à¸ <strong className="text-[#30d158]">{findBEQuote(quotePrice, 'none', 'base')} à¸à¸µ</strong> à¸à¸³à¹à¸£ 25 à¸à¸µ <strong className="text-[#30d158]">{fmt(calcCFQuote(quotePrice, 'none', 'base')[24].cum)} à¸à¸²à¸</strong>. à¹à¸¡à¹à¸¡à¸µà¹à¸à¸²à¸à¸±à¸ â Optimizer à¸¢à¸±à¸à¸à¹à¸§à¸¢à¹à¸£à¸·à¹à¸­à¸ monitoring à¸£à¸²à¸¢à¹à¸à¸</div>
          </div>
          <div className="border-t border-[#2a2a2a] my-2"></div>
          <div className="flex gap-3 items-start">
            <span className="text-[#bf5af2] text-lg">B</span>
            <div><strong className="text-[#f5f5f7]">à¸à¹à¸²à¹à¸ªà¹ Battery à¸à¹à¸§à¸¢</strong> â à¹à¸à¸°à¸à¸³ <strong className="text-[#bf5af2]">à¸£à¸°à¸à¸ 20kW (SUN2000-20K-MB0) + Battery</strong> à¹à¸à¸. Self-Use Rate à¸ªà¸¹à¸à¸à¸§à¹à¸² à¸à¸¸à¹à¸¡à¸à¸§à¹à¸²à¹à¸¡à¸·à¹à¸­à¸£à¸§à¸¡ Battery. <strong className="text-[#ff9f0a]">à¸à¸§à¸£à¸à¸­à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸² 20kW à¸à¸²à¸ TCS Power Plus à¹à¸à¸´à¹à¸¡</strong></div>
          </div>
          <div className="border-t border-[#2a2a2a] my-2"></div>
          <div className="flex gap-3 items-start">
            <span className="text-[#86868b] text-lg">C</span>
            <div><strong className="text-[#f5f5f7]">à¹à¸à¸·à¹à¸­à¸à¹à¸à¸à¸³à¸£à¸°à¹à¸à¸´à¸</strong> â à¸à¸³à¸£à¸°à¹à¸à¹à¸¡à¸à¸³à¸à¸§à¸à¸«à¸¥à¸±à¸à¸à¸´à¸à¸à¸±à¹à¸à¹à¸ªà¸£à¹à¸ 100% à¹à¸¡à¹à¸¡à¸µà¹à¸à¸´à¸à¸¡à¸±à¸à¸à¸³. à¸£à¸²à¸à¸² {perWattQuote.toFixed(1)} à¸à¸²à¸/à¸§à¸±à¸à¸à¹ <strong className="text-[#30d158]">à¸à¹à¸³à¸à¸§à¹à¸²à¸à¸¥à¸²à¸à¹à¸à¸¥à¸µà¹à¸¢ {((1 - perWattQuote / MARKET.avg) * 100).toFixed(0)}%</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
