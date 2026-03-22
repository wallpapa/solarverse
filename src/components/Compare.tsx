'use client';
import { useState, useMemo } from 'react';
import { SYS, STRAT_NAMES, STRATEGIES, calcCF, findBE, getBattCost, MODULE_PRICE_TODAY, fmt } from '@/lib/solar-engine';
import { Card, TableWrap, SelectorRow, Select, Alert } from './ui';
import ChartWrapper from './ChartWrapper';
import type { ChartConfiguration } from 'chart.js';

const COLORS = ['#555', '#bf5af2', '#30d158', '#0a84ff', '#ff453a'];
const RISKS = ['ไม่มี backup กลางคืน', 'มี Battery ใช้ทันที + ค่อยๆ เพิ่ม', 'ค่อยๆ เพิ่ม ลดความเสี่ยง', 'ได้ 2 ก้อน พอใช้', 'ลงทุนสูงตั้งแต่ต้น'];

export default function Compare() {
  const [kw, setKw] = useState('25');
  const [rk, setRk] = useState('base');
  const sysKW = parseInt(kw);
  const data = useMemo(() => {
    const sys = SYS[sysKW]; const strats = [...STRATEGIES];
    const cfs = strats.map(s => calcCF(sysKW, s, rk));
    const labels25 = Array.from({ length: 25 }, (_, i) => `ปี ${i + 1}`);
    const battCosts = [0, MODULE_PRICE_TODAY + getBattCost(3) + getBattCost(5), getBattCost(3) + getBattCost(5) + getBattCost(7), getBattCost(3) + getBattCost(5), MODULE_PRICE_TODAY * 3];
    return { sys, strats, cfs, labels25, battCosts };
  }, [sysKW, rk]);
  const { sys, strats, cfs, labels25, battCosts } = data;
  const labels = strats.map(s => STRAT_NAMES[s]);
  const cumConfig: ChartConfiguration = {
    type: 'line',
    data: { labels: labels25, datasets: [
      ...strats.map((s, i) => ({ label: labels[i], data: cfs[i].map(c => c.cum), borderColor: COLORS[i], borderWidth: i === 1 ? 3 : 2, borderDash: i === 0 ? [5, 5] : [], pointRadius: 0, tension: 0.3 })),
      { label: 'Break-Even', data: Array(25).fill(0), borderColor: '#333', borderDash: [5, 5], borderWidth: 1, pointRadius: 0 },
    ]},
    options: { plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }, scales: { y: { title: { display: true, text: 'บาท' }, ticks: { callback: (v) => fmt(v as number) } } } },
  };
  const profitConfig: ChartConfiguration = {
    type: 'bar',
    data: { labels, datasets: [{ label: 'กำไร 25 ปี', data: cfs.map(cf => cf[24].cum), backgroundColor: COLORS.map(c => c + '88') }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: 'บาท' }, ticks: { callback: (v) => fmt(v as number) } } } },
  };
  let bestP = -Infinity, bestI = -1;
  const rows = strats.map((s, i) => {
    const cf = cfs[i]; const be = findBE(cf); const totalInvest = sys.cost + battCosts[i]; const p25 = cf[24].cum;
    if (p25 > bestP) { bestP = p25; bestI = i; }
    const roi = ((p25 / totalInvest) * 100).toFixed(0);
    return [labels[i], fmt(totalInvest), fmt(battCosts[i]), be >= 99 ? '>25' : String(be), fmt(p25), `${roi}%`, RISKS[i]];
  });
  return (
    <div>
      <Alert type="warn" title="เปรียบเทียบ 5 กลยุทธ์ Battery">
        (A) ไม่ซื้อ Battery (B) ซื้อ 1 ก้อนวันนี้ + ปี3+5 (C) ทยอยซื้อ ปี3+5+7 (D) ทยอยซื้อ 2 ก้อน ปี3+5 (E) ซื้อ 3 ก้อนวันนี้
      </Alert>
      <SelectorRow>
        <Select label="ขนาดระบบ:" value={kw} onChange={setKw} options={[
          { value: '20', label: '20KW' }, { value: '25', label: '25KW' }, { value: '30', label: '30KW' },
        ]} />
        <Select label="ค่าไฟ:" value={rk} onChange={setRk} options={[
          { value: 'base', label: 'Base 3%/ปี' }, { value: 'conservative', label: 'Conservative 2%/ปี' },
          { value: 'aggressive', label: 'Aggressive 5%/ปี' }, { value: 'iranSpike', label: 'Iran War Spike' },
        ]} />
      </SelectorRow>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="📊 Cumulative Cash Flow"><ChartWrapper config={cumConfig} /></Card>
        <Card title="📊 25-Year Total Profit"><ChartWrapper config={profitConfig} height="300px" /></Card>
      </div>
      <Card><TableWrap headers={['กลยุทธ์', 'ลงทุนรวม', 'Battery Cost', 'คืนทุน (ปี)', 'กำไร 25 ปี', 'ROI %', 'ความเสี่ยง']} rows={rows} highlightBest={bestI >= 0 ? [bestI] : []} /></Card>
    </div>
  );
}
