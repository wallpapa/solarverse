'use client';
import { useState, useMemo } from 'react';
import { SIZES, STRATEGIES, SYS, STRAT_NAMES, calcScore, calcCF, fmt, ScoreResult } from '@/lib/solar-engine';
import { Card, TableWrap, SelectorRow, Select, Alert } from './ui';
import ChartWrapper from './ChartWrapper';
import type { ChartConfiguration } from 'chart.js';

interface ExtendedScore extends ScoreResult {
  profitCon: number; profitBase: number; profitAgg: number; profitIran: number;
}

export default function FullMatrix() {
  const [rk, setRk] = useState('base');
  const all = useMemo(() => {
    const results: ExtendedScore[] = [];
    SIZES.forEach(kw => {
      STRATEGIES.forEach(s => {
        const sc = calcScore(kw, s, rk) as ExtendedScore;
        sc.profitCon = calcCF(kw, s, 'conservative')[24].cum;
        sc.profitBase = calcCF(kw, s, 'base')[24].cum;
        sc.profitAgg = calcCF(kw, s, 'aggressive')[24].cum;
        sc.profitIran = calcCF(kw, s, 'iranSpike')[24].cum;
        results.push(sc);
      });
    });
    results.sort((a, b) => b.score - a.score);
    return results;
  }, [rk]);

  const stratLabels = [...STRATEGIES].map(s => STRAT_NAMES[s]);
  const barConfig: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: stratLabels,
      datasets: SIZES.map(kw => ({
        label: SYS[kw].name,
        data: [...STRATEGIES].map(s => calcCF(kw, s, rk)[24].cum),
        backgroundColor: SYS[kw].color + '88',
        borderColor: SYS[kw].color,
        borderWidth: 1,
      })),
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { title: { display: true, text: 'กำไร 25 ปี (บาท)' }, ticks: { callback: (v) => fmt(v as number) } } } },
  };

  const rows = all.map((opt, i) => {
    const roi = ((opt.profit25 / opt.totalInvest) * 100).toFixed(0);
    const be = opt.be >= 99 ? '>25' : String(opt.be);
    const irrPct = (opt.irr * 100).toFixed(1);
    return [String(i + 1), SYS[opt.sysKW].name, STRAT_NAMES[opt.stratName], fmt(opt.totalInvest), be, fmt(opt.profit25), `${irrPct}%`, `${roi}%`, fmt(opt.profitCon), fmt(opt.profitBase), fmt(opt.profitAgg), fmt(opt.profitIran), opt.score.toFixed(1)];
  });

  return (
    <div>
      <Alert type="info" title="📊 Full Optimization Matrix — ทุก Combination">
        ตาราง 15 combinations (3 ขนาด × 5 กลยุทธ์) คำนวณ 4 สถานการณ์ค่าไฟ | เรียงตาม Optimization Score
      </Alert>
      <SelectorRow>
        <Select label="สถานการณ์ค่าไฟ:" value={rk} onChange={setRk} options={[
          { value: 'base', label: 'Base 3%/ปี' }, { value: 'conservative', label: 'Conservative 2%/ปี' },
          { value: 'aggressive', label: 'Aggressive 5%/ปี' }, { value: 'iranSpike', label: 'Iran War Spike' },
        ]} />
      </SelectorRow>
      <Card title="📊 กำไร 25 ปี — ขนาด × กลยุทธ์" className="mb-5"><ChartWrapper config={barConfig} /></Card>
      <Card title="Full Matrix" badge={`${all.length} combinations`}>
        <TableWrap headers={['#', 'ขนาด', 'กลยุทธ์', 'ลงทุนรวม', 'คืนทุน', 'กำไร 25ปี', 'IRR', 'ROI', 'Con 2%', 'Base 3%', 'Agg 5%', 'Iran', 'Score']} rows={rows} highlightBest={[0, 1, 2]} />
      </Card>
    </div>
  );
}
