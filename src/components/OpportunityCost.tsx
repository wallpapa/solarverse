'use client';
import { useState, useMemo } from 'react';
import { SYS, calcCF, calcIRR, getStrat, getBattCost, MODULE_PRICE_TODAY, fmt, C } from '@/lib/solar-engine';
import { Card, TableWrap, SelectorRow, Select, Alert, MetricBox } from './ui';
import ChartWrapper from './ChartWrapper';
import type { ChartConfiguration } from 'chart.js';

const NET_DEPOSIT = 0.0085 * (1 - 0.15);

export default function OpportunityCost() {
  const [kw, setKw] = useState('25');
  const [strat, setStrat] = useState('buy1now');
  const [rk, setRk] = useState('base');
  const sysKW = parseInt(kw);
  const data = useMemo(() => {
    const sys = SYS[sysKW]; const cf = calcCF(sysKW, strat, rk); const irr = calcIRR(sysKW, strat, rk);
    const stratDef = getStrat(strat);
    let totalInvest = sys.cost;
    const investByYear: Record<number, number> = { 1: sys.cost };
    stratDef.forEach(s => { for (let m = 0; m < s.mod; m++) { const cost = s.y === 1 ? MODULE_PRICE_TODAY : getBattCost(s.y); totalInvest += cost; investByYear[s.y] = (investByYear[s.y] || 0) + cost; } });
    let totalDeposit = 0, runningPrincipal = 0;
    const depositByYear: number[] = [];
    for (let y = 1; y <= 25; y++) { if (investByYear[y]) runningPrincipal += investByYear[y]; const interest = runningPrincipal * NET_DEPOSIT; totalDeposit += interest; depositByYear.push(Math.round(totalDeposit)); }
    const solarProfit25 = cf[24].cum; const netAfterOpp = solarProfit25 - totalDeposit;
    return { sys, cf, irr, totalInvest, totalDeposit, depositByYear, solarProfit25, netAfterOpp };
  }, [sysKW, strat, rk]);
  const { sys, cf, irr, totalInvest, totalDeposit, depositByYear, solarProfit25, netAfterOpp } = data;
  const labels25 = Array.from({ length: 25 }, (_, i) => `ปี ${i + 1}`);
  const cumConfig: ChartConfiguration = {
    type: 'line',
    data: { labels: labels25, datasets: [
      { label: 'Solar กำไรสะสม', data: cf.map(c => c.cum), borderColor: '#30d158', borderWidth: 3, pointRadius: 0, tension: 0.3, backgroundColor: '#30d15822', fill: true },
      { label: 'ฝากประจำ ดอกเบี้ยสะสม', data: depositByYear, borderColor: '#ff9f0a', borderWidth: 2, pointRadius: 0, tension: 0.3, backgroundColor: '#ff9f0a22', fill: true },
      { label: 'Break-Even', data: Array(25).fill(0), borderColor: '#333', borderDash: [5, 5], borderWidth: 1, pointRadius: 0 },
    ]},
    options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { title: { display: true, text: 'บาท' }, ticks: { callback: (v) => fmt(v as number) } } } },
  };
  const ratesCmp = [
    { label: 'ฝากประจำ', rate: NET_DEPOSIT * 100, color: '#ff9f0a' }, { label: 'Solar IRR', rate: irr * 100, color: '#30d158' },
    { label: 'กู้ 7%', rate: 7, color: '#e67e22' }, { label: 'กู้ 8%', rate: 8, color: '#ff453a' },
    { label: 'กู้ 10%', rate: 10, color: '#7f1d1d' }, { label: 'เงินเฟ้อ', rate: 2.5, color: '#555' },
  ];
  const returnConfig: ChartConfiguration = {
    type: 'bar',
    data: { labels: ratesCmp.map(r => r.label), datasets: [{ label: '%/ปี', data: ratesCmp.map(r => +r.rate.toFixed(1)), backgroundColor: ratesCmp.map(r => r.color + '88') }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: '%/ปี' }, beginAtZero: true } } },
  };
  const loanRows = [0.07, 0.08, 0.09, 0.10].map(lr => {
    const mr = lr / 12; const np = 120;
    const pmt = totalInvest * mr * Math.pow(1 + mr, np) / (Math.pow(1 + mr, np) - 1);
    const totalPaid = pmt * np; const totalInterest = totalPaid - totalInvest;
    let savings10 = 0; for (let y = 0; y < 10; y++) savings10 += cf[y].saving;
    const net10 = savings10 - totalPaid - 10 * sys.kw * C.maintPerKW;
    const netProfit25 = solarProfit25 + totalInvest - totalInterest;
    const worthIt = irr * 100 > lr * 100;
    return [
      `${(lr * 100).toFixed(0)}%`, fmt(Math.round(totalInvest)), fmt(Math.round(pmt)),
      fmt(Math.round(totalInterest)), fmt(Math.round(savings10)), fmt(Math.round(net10)),
      fmt(Math.round(netProfit25)),
      worthIt
        ? <span key={lr} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#30d15815] text-[#30d158]">คุ้ม (IRR {(irr * 100).toFixed(1)}% &gt; {lr * 100}%)</span>
        : <span key={lr} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#ff453a15] text-[#ff453a]">ไม่คุ้ม</span>,
    ];
  });
  return (
    <div>
      <Alert type="warn" title="ค่าเสียโอกาส (Opportunity Cost) + วิเคราะห์กู้เงินลงทุน">
        ถ้าเอาเงินไปฝากประจำแทน จะได้ดอกเบี้ยเท่าไร? Solar ให้ผลตอบแทนดีกว่าหรือไม่? และถ้าต้องกู้เงินมาลงทุน ดอกเบี้ย 7-10% คุ้มไหม?
      </Alert>
      <SelectorRow>
        <Select label="ขนาด:" value={kw} onChange={setKw} options={[{ value: '20', label: '20KW' }, { value: '25', label: '25KW' }, { value: '30', label: '30KW' }]} />
        <Select label="กลยุทธ์:" value={strat} onChange={setStrat} options={[
          { value: 'buy1now', label: 'ซื้อ 1 ก้อนวันนี้ + ปี3,5' }, { value: 'phased', label: 'ทยอยซื้อ ปี3+5+7' }, { value: 'none', label: 'ไม่ซื้อ Battery' },
        ]} />
        <Select label="ค่าไฟ:" value={rk} onChange={setRk} options={[
          { value: 'base', label: 'Base 3%/ปี' }, { value: 'conservative', label: 'Conservative 2%/ปี' },
          { value: 'aggressive', label: 'Aggressive 5%/ปี' }, { value: 'iranSpike', label: 'Iran War Spike' },
        ]} />
      </SelectorRow>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card><MetricBox value={`${fmt(Math.round(totalDeposit))} ฿`} label="ดอกเบี้ยฝากประจำ 25 ปี (0.85%/ปี)" color="#86868b" /></Card>
        <Card><MetricBox value={`${fmt(Math.round(netAfterOpp))} ฿`} label="กำไรสุทธิ Solar 25 ปี (หลังหักค่าเสียโอกาส)" color="#30d158" /></Card>
        <Card><MetricBox value={`${(irr * 100).toFixed(1)}%/ปี`} label="Effective Return (IRR)" color="#0a84ff" /></Card>
        <Card><MetricBox value={`${(solarProfit25 / Math.max(totalDeposit, 1)).toFixed(1)}x`} label="Solar ดีกว่าฝากประจำกี่เท่า?" color="#ff9f0a" /></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="Solar Profit vs ฝากประจำ — Cumulative 25 ปี"><ChartWrapper config={cumConfig} /></Card>
        <Card title="Effective Annual Return"><ChartWrapper config={returnConfig} height="300px" /></Card>
      </div>
      <Card title="วิเคราะห์: กู้เงินมาติด Solar คุ้มไหม? (ดอกเบี้ย 7-10%)">
        <TableWrap headers={['ดอกเบี้ยกู้', 'เงินกู้', 'ผ่อน/เดือน (10ปี)', 'ดอกเบี้ยรวม 10 ปี', 'ประหยัด 10 ปี', 'Net 10 ปี', 'กำไร 25 ปี', 'คุ้มไหม?']} rows={loanRows} />
        <p className="text-[11px] text-[#6e6e73] mt-3 italic">* คำนวณสินเชื่อแบบ PMT 10 ปี | หลังปิดหนี้ปีที่ 10 ประหยัดค่าไฟ 100% อีก 15 ปี</p>
      </Card>
    </div>
  );
}
