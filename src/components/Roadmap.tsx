'use client';
import { useState, useMemo } from 'react';
import { SYS, SELF_MAP, calcCF, getBattCost, MODULE_PRICE_TODAY, fmt, C } from '@/lib/solar-engine';
import { Card, SelectorRow, Select } from './ui';
import ChartWrapper from './ChartWrapper';
import type { ChartConfiguration } from 'chart.js';

export default function Roadmap() {
  const [kw, setKw] = useState('25');
  const [rk, setRk] = useState('base');
  const sysKW = parseInt(kw);
  const data = useMemo(() => {
    const sys = SYS[sysKW]; const sm = SELF_MAP[sysKW];
    const cf1 = calcCF(sysKW, 'none', rk); const cfP = calcCF(sysKW, 'phased', rk);
    const p2cost = getBattCost(3); const p3cost = getBattCost(5); const p4cost = getBattCost(7);
    const cfNone = calcCF(sysKW, 'none', rk); const cfPhased = calcCF(sysKW, 'phased', rk); const cfAll = calcCF(sysKW, 'allnow', rk);
    return { sys, sm, cf1, cfP, p2cost, p3cost, p4cost, cfNone, cfPhased, cfAll };
  }, [sysKW, rk]);
  const { sys, sm, cf1, cfP, p2cost, p3cost, p4cost, cfNone, cfPhased, cfAll } = data;
  const phases = [
    { phase: 1, year: '2569', title: `ติดตั้ง ${sys.name} On-Grid`, color: '#30d158', details: [
      { label: 'ลงทุน', value: `${fmt(sys.cost)} ฿` }, { label: 'kWh/วัน', value: String(Math.round(sys.kw * C.psh)) },
      { label: 'Self-Use', value: `${Math.round(sys.self0 * 100)}%` }, { label: 'ประหยัด ปี1', value: `${fmt(cf1[0].saving)} ฿` },
    ]},
    { phase: 2, year: '2571', title: '+ LUNA2000 ก้อนที่ 1 (6.9 kWh)', color: '#0a84ff', savings: fmt(MODULE_PRICE_TODAY - p2cost), details: [
      { label: 'ราคา Battery', value: `${fmt(p2cost)} ฿` }, { label: 'vs วันนี้', value: `${fmt(MODULE_PRICE_TODAY)} ฿` },
      { label: 'Self-Use ใหม่', value: `${Math.round(sm[6.9] * 100)}%` }, { label: 'ประหยัดเพิ่ม/ปี', value: `${fmt(cfP[2].saving - cf1[2].saving)} ฿` },
    ]},
    { phase: 3, year: '2573', title: '+ LUNA2000 ก้อนที่ 2 (13.8 kWh)', color: '#ff9f0a', savings: fmt(MODULE_PRICE_TODAY - p3cost), details: [
      { label: 'ราคา Battery', value: `${fmt(p3cost)} ฿` }, { label: 'vs วันนี้', value: `${fmt(MODULE_PRICE_TODAY)} ฿` },
      { label: 'Self-Use ใหม่', value: `${Math.round(sm[13.8] * 100)}%` }, { label: 'ประหยัดเพิ่ม/ปี', value: `${fmt(cfP[4].saving - cf1[4].saving)} ฿` },
    ]},
    { phase: 4, year: '2575', title: '+ LUNA2000 ก้อนที่ 3 (20.7 kWh) [Optional]', color: '#ff453a', savings: fmt(MODULE_PRICE_TODAY - p4cost), details: [
      { label: 'ราคา Battery', value: `${fmt(p4cost)} ฿` }, { label: 'vs วันนี้', value: `${fmt(MODULE_PRICE_TODAY)} ฿` },
      { label: 'Self-Use ใหม่', value: `${Math.round(sm[20.7] * 100)}%` }, { label: 'ประหยัดเพิ่ม/ปี', value: `${fmt(cfP[6].saving - cf1[6].saving)} ฿` },
    ]},
  ];
  const selfConfig: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: ['Phase 1\n(ไม่มี Batt)', 'Phase 2\n(+6.9 kWh)', 'Phase 3\n(+13.8 kWh)', 'Phase 4\n(+20.7 kWh)'],
      datasets: [
        { label: 'Self-Use %', data: [sm[0], sm[6.9], sm[13.8], sm[20.7]].map(v => Math.round(v * 100)), backgroundColor: ['#55555588', '#0a84ff88', '#ff9f0a88', '#30d15888'] },
        { label: 'Grid %', data: [sm[0], sm[6.9], sm[13.8], sm[20.7]].map(v => 100 - Math.round(v * 100)), backgroundColor: ['#55555533', '#0a84ff33', '#ff9f0a33', '#30d15833'] },
      ],
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true, max: 100, title: { display: true, text: '%' } } } },
  };
  const labels25 = Array.from({ length: 25 }, (_, i) => `ปี ${i + 1}`);
  const cumConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: labels25,
      datasets: [
        { label: 'ไม่มี Battery', data: cfNone.map(c => c.cum), borderColor: '#555', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, tension: 0.3 },
        { label: 'ทยอยซื้อ (ปี3+5+7)', data: cfPhased.map(c => c.cum), borderColor: '#30d158', borderWidth: 3, pointRadius: 0, tension: 0.3 },
        { label: 'ซื้อ 3 ก้อนวันนี้', data: cfAll.map(c => c.cum), borderColor: '#ff453a', borderWidth: 2, pointRadius: 0, tension: 0.3 },
        { label: 'Break-Even', data: Array(25).fill(0), borderColor: '#333', borderDash: [5, 5], borderWidth: 1, pointRadius: 0 },
      ],
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { title: { display: true, text: 'บาท' }, ticks: { callback: (v) => fmt(v as number) } } } },
  };
  return (
    <div>
      <SelectorRow>
        <Select label="ขนาดระบบ:" value={kw} onChange={setKw} options={[
          { value: '20', label: '20KW' }, { value: '25', label: '25KW — แนะนำ' }, { value: '30', label: '30KW' },
        ]} />
        <Select label="ค่าไฟ:" value={rk} onChange={setRk} options={[
          { value: 'base', label: 'Base 3%/ปี' }, { value: 'conservative', label: 'Conservative 2%/ปี' },
          { value: 'aggressive', label: 'Aggressive 5%/ปี' }, { value: 'iranSpike', label: 'Iran War Spike' },
        ]} />
      </SelectorRow>
      <div className="relative pl-10 mb-8">
        <div className="absolute left-[18px] top-0 bottom-0 w-[2px]" style={{ background: 'linear-gradient(180deg,#30d158,#0a84ff,#ff9f0a,#ff453a)' }} />
        {phases.map((p, i) => (
          <div key={i} className="relative mb-7 p-5 bg-[#111] border border-[#2a2a2a] rounded-2xl">
            <div className="absolute -left-[30px] top-6 w-4 h-4 rounded-full border-2 border-black z-10" style={{ background: p.color }} />
            <div className="text-xs font-bold rounded-full px-4 py-1.5 inline-block text-white mb-3" style={{ background: p.color }}>PHASE {p.phase} — ปี {p.year}</div>
            {p.savings && <span className="ml-2 text-xs font-semibold text-[#30d158] bg-[#30d15815] px-3 py-1 rounded-full">ประหยัด ~{p.savings}</span>}
            <h3 className="font-bold text-base mb-3" style={{ color: p.color }}>{p.title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {p.details.map((d, j) => (<div key={j} className="text-center p-3 bg-[#0a0a0a] rounded-xl"><div className="text-lg font-bold">{d.value}</div><div className="text-[11px] text-[#6e6e73]">{d.label}</div></div>))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="📊 Self-Use % ทีละ Phase"><ChartWrapper config={selfConfig} height="300px" /></Card>
        <Card title="📊 Cumulative Cash Flow — Phase 1 vs ทยอย Battery"><ChartWrapper config={cumConfig} /></Card>
      </div>
    </div>
  );
}
