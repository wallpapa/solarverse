'use client';
import { STRAT_NAMES, STRATEGIES, calcCF, findBE, fmt } from '@/lib/solar-engine';
import { Card, TableWrap } from './ui';
import ChartWrapper from './ChartWrapper';
import type { ChartConfiguration } from 'chart.js';

const KW = 25;
const COLORS = ['#555', '#bf5af2', '#30d158', '#0a84ff', '#ff453a'];
const RATES = ['conservative', 'base', 'aggressive', 'iranSpike'] as const;

export default function Sensitivity() {
  const strats = [...STRATEGIES];
  const stratLabels = strats.map(s => STRAT_NAMES[s]);
  let bestIdx = -1, bestVal = -Infinity;
  const rows = strats.map((s, i) => {
    const vals = [...RATES].map(r => calcCF(KW, s, r)[24].cum);
    if (vals[1] > bestVal) { bestVal = vals[1]; bestIdx = i; }
    return [stratLabels[i], ...vals.map(v => fmt(v))];
  });
  const beData = strats.map(s => { const be = findBE(calcCF(KW, s, 'base')); return be >= 99 ? 26 : be; });
  const beConfig: ChartConfiguration = {
    type: 'bar',
    data: { labels: stratLabels, datasets: [{ label: 'ปีคืนทุน (Base 3%)', data: beData, backgroundColor: COLORS.map(c => c + '88') }] },
    options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'ปี' }, max: 16 } } },
  };
  const scenarios = ['optimistic', 'moderate', 'pessimistic'];
  const scLabels = ['Battery ลดเร็ว', 'Moderate', 'Battery ลดช้า'];
  const scColors = ['#30d158', '#0a84ff', '#ff9f0a'];
  const pessConfig: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: scLabels,
      datasets: [{ label: 'กำไร 25 ปี (25KW ทยอย Base 3%)', data: scenarios.map(s => calcCF(KW, 'phased', 'base', s)[24].cum), backgroundColor: scColors.map(c => c + '88') }],
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: 'บาท' }, ticks: { callback: (v) => fmt(v as number) } } } },
  };
  return (
    <div>
      <Card title="Sensitivity: กำไร 25 ปี — กลยุทธ์ × ค่าไฟ (25KW)" className="mb-5">
        <TableWrap headers={['กลยุทธ์', 'Conservative 2%', 'Base 3%', 'Aggressive 5%', 'Iran Spike']} rows={rows} highlightBest={bestIdx >= 0 ? [bestIdx] : []} />
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Break-Even by Strategy"><ChartWrapper config={beConfig} height="300px" /></Card>
        <Card title="ถ้า Battery ลดช้ากว่าคาด? (Pessimistic)"><ChartWrapper config={pessConfig} height="300px" /></Card>
      </div>
    </div>
  );
}
