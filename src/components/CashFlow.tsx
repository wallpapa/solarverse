'use client';
import { useState, useMemo } from 'react';
import { SYS, calcCF, fmt, C } from '@/lib/solar-engine';
import { Card, TableWrap, SelectorRow, Select } from './ui';
import ChartWrapper from './ChartWrapper';
import type { ChartConfiguration } from 'chart.js';

export default function CashFlow() {
  const [kw, setKw] = useState('25');
  const [strat, setStrat] = useState('buy1now');
  const [rk, setRk] = useState('base');
  const sysKW = parseInt(kw);
  const cf = useMemo(() => calcCF(sysKW, strat, rk), [sysKW, strat, rk]);
  const sys = SYS[sysKW];
  const labels25 = cf.map(c => `ปี ${c.y}`);
  const annConfig: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: labels25,
      datasets: [
        { label: 'Net CF/ปี', data: cf.map(c => c.net), backgroundColor: cf.map(c => c.net >= 0 ? '#30d15888' : '#ff453a88') },
        { label: 'Cumulative', data: cf.map(c => c.cum), type: 'line', borderColor: sys.color, borderWidth: 2, pointRadius: 1, yAxisID: 'y1', tension: 0.3 },
      ],
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y: { title: { display: true, text: 'บาท/ปี' }, ticks: { callback: (v) => fmt(v as number) } },
        y1: { position: 'right', title: { display: true, text: 'Cumulative' }, ticks: { callback: (v) => fmt(v as number) }, grid: { drawOnChartArea: false } },
      },
    },
  };
  const billNo = cf.map(c => C.mKWh * c.rate);
  const billSolar = cf.map(c => (C.mKWh - c.usable / 12) * c.rate);
  const billConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: labels25,
      datasets: [
        { label: 'ไม่มี Solar', data: billNo.map(v => Math.round(v)), borderColor: '#ff453a', borderWidth: 2, pointRadius: 0, tension: 0.3, backgroundColor: '#ff453a22', fill: true },
        { label: 'มี Solar+Battery', data: billSolar.map(v => Math.round(Math.max(v, 0))), borderColor: '#30d158', borderWidth: 2, pointRadius: 0, tension: 0.3, backgroundColor: '#30d15822', fill: true },
      ],
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { title: { display: true, text: 'บาท/เดือน' }, ticks: { callback: (v) => fmt(v as number) } } } },
  };
  const rows = cf.map(c => [String(c.y), String(c.rate), String(c.battKWh), `${c.sr}%`, fmt(c.prod), fmt(c.usable), fmt(c.saving), fmt(c.costs), fmt(c.net), fmt(c.cum)]);
  return (
    <div>
      <SelectorRow>
        <Select label="ขนาด:" value={kw} onChange={setKw} options={[{ value: '20', label: '20KW' }, { value: '25', label: '25KW' }, { value: '30', label: '30KW' }]} />
        <Select label="กลยุทธ์ Battery:" value={strat} onChange={setStrat} options={[
          { value: 'buy1now', label: 'ซื้อ 1 ก้อนวันนี้ + เพิ่มปี3,5' }, { value: 'phased', label: 'ทยอยซื้อ (ปี3+5+7)' },
          { value: 'allnow', label: 'ซื้อ 3 ก้อนวันนี้' }, { value: 'none', label: 'ไม่ซื้อ Battery' }, { value: 'phase2only', label: 'ซื้อ 2 ก้อน (ปี3+5)' },
        ]} />
        <Select label="ค่าไฟ:" value={rk} onChange={setRk} options={[
          { value: 'base', label: 'Base 3%/ปี' }, { value: 'conservative', label: 'Conservative 2%/ปี' },
          { value: 'aggressive', label: 'Aggressive 5%/ปี' }, { value: 'iranSpike', label: 'Iran War Spike' },
        ]} />
      </SelectorRow>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="Annual + Cumulative Cash Flow"><ChartWrapper config={annConfig} /></Card>
        <Card title="ค่าไฟ/เดือน: มี Solar vs ไม่มี"><ChartWrapper config={billConfig} /></Card>
      </div>
      <Card title="Cash Flow 25 ปี">
        <div className="max-h-[500px] overflow-auto">
          <TableWrap headers={['ปี', 'ค่าไฟ/หน่วย', 'Batt kWh', 'Self-Use%', 'ผลิต', 'ใช้ได้', 'ประหยัด', 'ค่าใช้จ่าย', 'Net CF', 'Cumulative']} rows={rows} />
        </div>
      </Card>
    </div>
  );
}
