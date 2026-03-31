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
    salesperson: 'รัตติมา ย่ำคม',
    systemKW: 30,
    panels: { model: 'Aiko 645W (Tier 1)', qty: 48, totalW: 30960 },
    inverter: { model: 'HUAWEI SUN2000-M3', power: '30kW', phase: '3 Phase' },
    priceBeforeVAT: 462616.82,
    vat: 32383.18,
    totalPrice: 495000,
    hasOptimizer: false,
    warranty: {
      panel: '15 ปี อุปกรณ์ / 30 ปี ผลิตไฟ 80%',
      inverter: '10 ปี จาก Huawei',
      installation: '5 ปี',
      roof: '5 ปี',
    },
    includes: [
      'Smart Meter DTSU666-H (3 phase)',
      'Solar Combiner 3 Phase + SPD',
      'ติดตั้ง Solar Rooftop + เดินสาย',
      'SLD + วิศวกรลงนาม',
      'ขออนุญาต MEA/PEA',
      'ล้างแผง + PM 5 ปี (ปีละ 1 ครั้ง)',
      'ตาข่ายกันนกสำหรับแผง',
      'Zero Export (กันย้อน)',
    ],
  },
  B: {
    id: 'QT2026030503',
    name: 'String 30kW 3P + Optimizer',
    vendor: 'TCS Power Plus Co., Ltd.',
    date: '23/03/2026',
    salesperson: 'รัตติมา ย่ำคม',
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
        'แก้ปัญหาเงาบัง เพิ่มผลผลิตได้ถึง 25%',
        'Rapid Stopper (NEC2017) — ปลอดภัยขึ้น',
        'ตรวจสอบผลผลิตรายแผงผ่าน FusionSolar',
        'แก้ mismatch loss จากหลังคาไม่เท่ากัน',
        'Long String Design — ลดจำนวน String',
        'IP68 — ทนน้ำ/ฝุ่น',
      ],
      warranty: '25 ปี',
    },
    warranty: {
      panel: '15 ปี อุปกรณ์ / 30 ปี ผลิตไฟ 80%',
      inverter: '10 ปี จาก Huawei',
      installation: '5 ปี',
      roof: '5 ปี',
      optimizer: '25 ปี',
    },
    includes: [
      'Smart Meter DTSU666-H (3 phase)',
      'Solar Combiner 3 Phase + SPD',
      'ติดตั้ง Solar Rooftop + เดินสาย',
      'SLD + วิศวกรลงนาม',
      'ขออนุญาต MEA/PEA',
      'ล้างแผง + PM 5 ปี (ปีละ 1 ครั้ง)',
      'ตาข่ายกันนกสำหรับแผง',
      'Zero Export (กันย้อน)',
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
  const labels25 = Array.from({ length: 25 }, (_, i) => `ปี ${i + 1}`);

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
            label: `ราคาตลาด (${fmt(MARKET.engineDefault)} ฿)`,
            data: cfEngine.map(c => c.cum),
            borderColor: '#ff453a',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            borderDash: [5, 5],
          },
          {
            label: `ใบเสนอราคา TCS (${fmt(quotePrice)} ฿)`,
            data: cfQuote.map(c => c.cum),
            borderColor: '#30d158',
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.3,
          },
          {
            label: 'จุดคุ้มทุน',
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
          y: { title: { display: true, text: 'บาท (สะสม)' }, ticks: { callback: (v: unknown) => fmt(v as number) } },
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
        y: { title: { display: true, text: 'กำไรสะสม (บาท)' }, ticks: { callback: (v: unknown) => fmt(v as number) } },
      },
    },
  }), [selectedRate, quotePrice]);

  // Chart 3: Price per watt comparison bar
  const priceCompareConfig: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: ['ตลาด ต่ำสุด', 'TCS Power Plus', 'ตลาด เฉลี่ย', 'ราคา Engine', 'ตลาด สูงสุด'],
      datasets: [{
        label: 'บาท/วัตต์',
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
        y: { title: { display: true, text: 'บาท/วัตต์' }, beginAtZero: true },
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
          label: 'IRR ราคาตลาด',
          data: filtered.map(s => +(s.irr * 100).toFixed(1)),
          backgroundColor: 'rgba(255,69,58,0.4)',
          borderColor: '#ff453a',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: 'IRR ใบเสนอราคา TCS',
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
        y: { title: { display: true, text: 'IRR (%/ปี)' }, beginAtZero: true },
      },
    },
  }), [filtered]);

  return (
    <div>
      {/* Header */}
      <div className="rounded-3xl p-6 mb-6" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.12), rgba(191,90,242,0.08))' }}>
        <h2 className="text-[#ff9f0a] font-bold text-base mb-3">
          📋 วิเคราะห์ใบเสนอราคา — TCS Power Plus
        </h2>
        <p className="text-[14px] text-[#c8c8cc] leading-relaxed">
          เปรียบเทียบ <strong className="text-[#f5f5f7]">2 ใบเสนอราคา</strong> จาก TCS Power Plus (23 มี.ค. 2026) กับราคาตลาดและ Engine Model —{' '}
          ราคาจริง <strong className="text-[#30d158]">{fmt(quotePrice)} บาท</strong>{' '}
          ถูกกว่าราคา Model <strong className="text-[#ff453a]">{savingsPct}%</strong> ({fmt(savings)} บาท){' '}
          ทำให้ <strong className="text-[#bf5af2]">IRR สูงขึ้น</strong> และ <strong className="text-[#30d158]">คืนทุนเร็วขึ้น</strong> ทุก Scenario
        </p>
      </div>

      {/* ===== SECTION 1: Quote Cards ===== */}
      <h3 className="text-sm font-semibold mb-4 text-[#86868b] tracking-wider uppercase">เปรียบเทียบ 2 ใบเสนอราคา</h3>
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
                <div className="text-xs opacity-70">บาท (รวม VAT)</div>
              </div>
            </div>
          </div>
          <div className="p-5 bg-[#111] space-y-0 text-[13px]">
            {[
              ['แผงโซลาร์', `${QUOTES.A.panels.model} × ${QUOTES.A.panels.qty}`],
              ['กำลังผลิตจริง', `${(QUOTES.A.panels.totalW / 1000).toFixed(1)} kW`],
              ['Inverter', QUOTES.A.inverter.model],
              ['Optimizer', '❌ ไม่มี'],
              ['ราคา/วัตต์', `${(QUOTES.A.totalPrice / QUOTES.A.panels.totalW).toFixed(1)} บาท/W`],
              ['ประกันแผง', QUOTES.A.warranty.panel],
              ['ประกัน Inverter', QUOTES.A.warranty.inverter],
            ].map(([label, val], i) => (
              <div key={i} className="flex justify-between py-2.5 border-b border-[#1a1a1a]">
                <span className="text-[#6e6e73]">{label}</span>
                <span className="text-[#f5f5f7] font-medium text-right max-w-[60%]">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quote B — Recommended */}
        <div className="rounded-2xl overflow-hidden border-2 border-[#30d158] relative">
          <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: '#30d158', color: '#000' }}>
            แนะนำ
          </div>
          <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #30d158, #1e8449)' }}>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs opacity-70">Quote B</div>
                <h3 className="font-bold text-white">{QUOTES.B.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">{fmt(QUOTES.B.totalPrice)}</div>
                <div className="text-xs opacity-70">บาท (รวม VAT)</div>
              </div>
            </div>
          </div>
          <div className="p-5 bg-[#111] space-y-0 text-[13px]">
            {[
              ['แผงโซลาร์', `${QUOTES.B.panels.model} × ${QUOTES.B.panels.qty}`],
              ['กำลังผลิตจริง', `${(QUOTES.B.panels.totalW / 1000).toFixed(1)} kW`],
              ['Inverter', QUOTES.B.inverter.model],
              ['Optimizer', `✅ ${QUOTES.B.optimizer!.model}`],
              ['ราคา/วัตต์', `${(QUOTES.B.totalPrice / QUOTES.B.panels.totalW).toFixed(1)} บาท/W`],
              ['ประกันแผง', QUOTES.B.warranty.panel],
              ['ประกัน Optimizer', QUOTES.B.warranty.optimizer || '-'],
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
      <Alert type="info" title="สภาพพื้นที่ติดตั้ง — ไม่มีเงาบัง">
        แผงจะวางโดย<strong className="text-[#f5f5f7]">ไม่มีส่วนที่จะโดนเงาบัง</strong> — Optimizer ช่วยเรื่องเงาจะไม่ได้ใช้ประโยชน์หลัก แต่ยังมีข้อดี: ตรวจสอบผลผลิตรายแผงผ่าน FusionSolar, Rapid Stopper (ปลอดภัย), แก้ mismatch loss.{' '}
        ราคาเท่ากันทั้งสองใบ ({fmt(quotePrice)} บาภ) — <strong className="text-[#30d158]">ได้ฟรี ไม่ต้องจ่ายเพิ่ม</strong>
      </Alert>

      {/* 20kW + Battery recommendation */}
      <Alert type="warn" title="คำแนะนำจาก CEO — ถ้าใส่ Battery แนะนำ 20kW MBO">
        <strong className="text-[#f5f5f7]">ถ้าต้องการใส่ Battery ด้วย → แนะนำระบบ 20kW (SUN2000-20K-MB0)</strong> เหตุผฤ: ระบบ 20kW มี Self-Use Rate สูงกว่า (55% vs 48%) เมื่อรวมกับ Battery จะใช้ไฟที่ผลิตได้คุ้มกว่า ลงทุนน้อยกว่า คืนทุนเร็วกว่า.{' '}
        <strong className="text-[#ff9f0a]">ใบเสนอราคานี้เป็น 30kW</strong> — ควรขอใบเสนอราคา 20kW + Battery จาก TCS Power Plus เพิ่มเพื่อเปรียบเทียบ
      </Alert>

      {/* ===== SECTION 2: Market Price Comparison ===== */}
      <h3 className="text-sm font-semibold mb-4 text-[#86868b] tracking-wider uppercase">เทียบราคาตลาด</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <BentoCard label="ราคาใบเสนอ" value={`${perWattQuote.toFixed(1)}`} sub="บาท/วัตต์" accent="orange" />
        <BentoCard label="ราคาตลาดเฉลี่ย" value={`${MARKET.avg}`} sub="บาท/วัตต์ (30kW)" accent="blue" />
        <BentoCard label="ถูกกว่า Engine" value={`${savingsPct}%`} sub={`ประหยัด ${fmt(savings)} บาท`} accent="green" />
        <BentoCard label="ราคาต่ำกว่าตลาด" value={`${((1 - perWattQuote / MARKET.avg) * 100).toFixed(0)}%`} sub="เทียบราคาเฉลี่ย 30kW" accent="purple" />
      </div>

      <Card title="📊 เทียบราคา/วัตต์ กับตลาด" className="mb-6">
        <ChartWrapper config={priceCompareConfig} height="300px" />
      </Card>

      {/* ===== SECTION 3: Scenario Analysis with Real Quote ===== */}
      <h3 className="text-sm font-semibold mb-4 text-[#86868b] tracking-wider uppercase">วิเคราะห์ Scenarios จากใบเสนอราคาจริง</h3>

      <SelectorRow>
        <Select
          label="สถานการณ์ค่าไฟ"
          value={selectedRate}
          onChange={setSelectedRate}
          options={Object.entries(RS).map(([k, v]) => ({ value: k, label: v.l }))}
        />
      </SelectorRow>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <BentoCard
          label="คืนทุน (ไม่ Battery)"
          value={`${findBEQuote(quotePrice, 'none', selectedRate)} ปี`}
          sub={`ราคาตลาด: ${findBE(calcCF(30, 'none', selectedRate))} ปี`}
          accent="green"
        />
        <BentoCard
          label="กำไร 25 ปี (ไม่ Batt)"
          value={`${fmt(calcCFQuote(quotePrice, 'none', selectedRate)[24].cum)}`}
          sub={`ราคาตลาด: ${fmt(calcCF(30, 'none', selectedRate)[24].cum)} บาท`}
          accent="orange"
        />
        <BentoCard
          label="IRR (ไม่ Battery)"
          value={`${(calcIRRQuote(quotePrice, 'none', selectedRate) * 100).toFixed(1)}%`}
          sub={`ราคาตลาด: ${(calcIRR(30, 'none', selectedRate) * 100).toFixed(1)}%`}
          accent="purple"
        />
        <BentoCard
          label="ดีกว่าฝากประจำ"
          value={`${(calcIRRQuote(quotePrice, 'none', selectedRate) / 0.0072).toFixed(0)}x`}
          sub="เทียบดอกเบี้ย 0.72%/ปี"
          accent="cyan"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card title="📈 ราคาตลาด vs ใบเสนอราคา — Cash Flow 25 ปี">
          <ChartWrapper config={compareConfig} />
        </Card>
        <Card title="📊 IRR Improvement — ทุกกลยุทธ์ Battery">
          <ChartWrapper config={irrCompareConfig} />
        </Card>
      </div>

      <Card title="📈 5 กลยุทธ์ Battery — Cumulative Cash Flow (ราคาใบเสนอ)" className="mb-6">
        <ChartWrapper config={allStratConfig} />
      </Card>

      {/* ===== SECTION 4: Full Comparison Table ===== */}
      <Card title="📋 ตาราง Scenarios ทั้งหมด — 30kW + Optimizer (TCS Quote)" badge={`${filtered.length} strategies`} className="mb-6">
        <TableWrap
          headers={['กลยุทธ์', 'ลงทุนรวม', 'คืนทุน', 'กำไร 25 ปี', 'IRR', 'เทียบราคาตลาด', 'กำไรเพิ่ม']}
          rows={filtered.map((s, i) => [
            s.stratLabel,
            `${fmt(s.totalInvestQuote)} ฿`,
            s.beQuote >= 99 ? '>25 ปี' : `${s.beQuote} ปี`,
            <span key={`p${i}`} className="text-[#30d158] font-bold">{fmt(s.profit25Quote)} ฿</span>,
            <span key={`irr${i}`} className="text-[#bf5af2] font-bold">{(s.irrQuote * 100).toFixed(1)}%</span>,
            `คืนทุน ${s.be >= 99 ? '>25' : s.be} ปี / กำไร ${fmt(s.profit25)} ฿`,
            <span key={`d${i}`} className="text-[#ff9f0a] font-bold">+{fmt(s.profit25Quote - s.profit25)} ฿</span>,
          ])}
          highlightBest={[0]}
        />
        <p className="text-[11px] text-[#6e6e73] mt-3 italic">
          * กลยุทธ์ Battery ยังคงใช้ราคาตลาดจาก BNEF Forecast — เชพาะต้นทุนระบบ Solar ที่ใช้ราคาจริงจากใบเสนอ
        </p>
      </Card>

      {/* ===== SECTION 5: 20kW vs 30kW Comparison ===== */}
      <h3 className="text-sm font-semibold mb-4 text-[#86868b] tracking-wider uppercase">เปรียบเทียบ 20kW + Battery vs 30kW Solar Only</h3>
      <Card title="📊 20kW+Battery vs 30kW — ข้อมูลจาก Engine Model" badge="ใบเสนอราคา vs Model" className="mb-6">
        <TableWrap
          headers={['รายการ', '30kW (ใบเสนอราคา TCS)', '20kW + Battery (Model)']}
          rows={(() => {
            const cf30q = calcCFQuote(quotePrice, 'none', selectedRate);
            const cf20b = calcCF(20, 'phase2only', selectedRate);
            const irr30q = calcIRRQuote(quotePrice, 'none', selectedRate);
            const irr20b = calcIRR(20, 'phase2only', selectedRate);
            const invest20b = getTotalInvest(20, 'phase2only');
            return [
              ['ลงทุน Solar', `${fmt(quotePrice)} ฿ (ใบเสนอจริง)`, `${fmt(SYS[20].cost)} ฿ (ราคาตลาด)`],
              ['ลงทุน Battery', '—', `${fmt(getBattTotal('phase2only'))} ฿ (2 ก้อน ปี3+5)`],
              ['ลงทุนรวม', `${fmt(quotePrice)} ฿`, `${fmt(invest20b)} ฿`],
              ['Self-Use Rate เริ่มต้น', '48%', '52% → 83% (มี Batt)'],
              ['คืนทุน', `${findBEQuote(quotePrice, 'none', selectedRate)} ปี`, `${findBE(cf20b)} ปี`],
              ['กำไร 25 ปี', `${fmt(cf30q[24].cum)} ฿`, `${fmt(cf20b[24].cum)} ฿`],
              ['IRR', `${(irr30q * 100).toFixed(1)}%`, `${(irr20b * 100).toFixed(1)}%`],
              ['เงาบัง', '❌ ไม่มีปัญหา', '❌ ไม่มีปัญหา'],
              ['Inverter', 'SUN2000-M3 (30kW)', 'SUN2000-20K-MB0'],
            ];
          })()}
        />
        <p className="text-[11px] text-[#6e6e73] mt-3 italic">
          * 20kW ใช้ราคาตลาดจาก Model ({fmt(SYS[20].cost)} ฿) — ควรขอใบเสนอราคาจริงจาก TCS เพื่อเปรียบเทียบที่แม่นยำ
        </p>
      </Card>

      {/* ===== SECTION 6: What's Included ===== */}
      <Card title="✅ รายการที่รวมในใบเสนอราคา" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          {QUOTES.B.includes.map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-[#1a1a1a] text-[13px]">
              <span className="text-[#30d158]">✓</span>
              <span className="text-[#c8c8cc]">{item}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ===== SECTION 6: CEO Recommendation ===== */}
      <div className="rounded-3xl p-6 mb-6 border-2 border-[#ff9f0a]" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.08), rgba(255,103,35,0.04))' }}>
        <h3 className="text-[#ff9f0a] font-bold text-base mb-4">CEO Decision — สรุปคำแนะนำ</h3>
        <div className="space-y-3 text-[14px] text-[#c8c8cc] leading-relaxed">
          <div className="flex gap-3 items-start">
            <span className="text-[#30d158] text-lg">A</span>
            <div><strong className="text-[#f5f5f7]">ถ้าไม่ใส่ Battery (Solar Only)</strong> → เลือก <strong className="text-[#ff9f0a]">Quote B (30kW + Optimizer) ราคา {fmt(quotePrice)} บาท</strong>. ราคาเท่า Quote A แต่ได้ Optimizer ฟรี. คืนทุน <strong className="text-[#30d158]">{findBEQuote(quotePrice, 'none', 'base')} ปี</strong> กำไร 25 ปี <strong className="text-[#30d158]">{fmt(calcCFQuote(quotePrice, 'none', 'base')[24].cum)} บาท</strong>. ไม่มีเงาบัง — Optimizer ยังช่วยเรื่อง monitoring รายแผง</div>
          </div>
          <div className="border-t border-[#2a2a2a] my-2"></div>
          <div className="flex gap-3 items-start">
            <span className="text-[#bf5af2] text-lg">B</span>
            <div><strong className="text-[#f5f5f7]">ถ้าใส่ Battery ด้วย</strong> → แนะนำ <strong className="text-[#bf5af2]">ระบบ 20kW (SUN2000-20K-MB0) + Battery</strong> แทน. Self-Use Rate สูงกว่า คุ้มกว่าเมื่อรวม Battery. <strong className="text-[#ff9f0a]">ควรขอใบเสนอราคา 20kW จาก TCS Power Plus เพิ่ม</strong></div>
          </div>
          <div className="border-t border-[#2a2a2a] my-2"></div>
          <div className="flex gap-3 items-start">
            <span className="text-[#86868b] text-lg">C</span>
            <div><strong className="text-[#f5f5f7]">เงื่อนไขชำระเงิน</strong> — ชำระเต็มจำนวนหลังติดตั้งเสร็จ 100% ไม่มีเงินมัดจำ. ราคา {perWattQuote.toFixed(1)} บาท/วัตต์ <strong className="text-[#30d158]">ต่ำกว่าตลาดเฉลี่ย {((1 - perWattQuote / MARKET.avg) * 100).toFixed(0)}%</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
