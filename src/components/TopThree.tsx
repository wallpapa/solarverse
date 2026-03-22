'use client';
import { useMemo } from 'react';
import { getAllScores, SYS, STRAT_NAMES, calcCF, fmt, C } from '@/lib/solar-engine';
import { Card, TableWrap } from './ui';
import ChartWrapper from './ChartWrapper';
import type { ChartConfiguration } from 'chart.js';

export default function TopThree() {
  const all = useMemo(() => getAllScores('base'), []);
  const top3 = all.slice(0, 3);
  const optLabels = ['Best Overall Value', 'Best Cash Flow Efficiency', 'Maximum Long-Term Profit'];
  const optColors = [
    { head: 'linear-gradient(135deg,#ff9f0a,#ff6723)', border: '#ff9f0a', bg: 'rgba(255,159,10,0.05)' },
    { head: 'linear-gradient(135deg,#30d158,#1e8449)', border: '#30d158', bg: 'rgba(48,209,88,0.05)' },
    { head: 'linear-gradient(135deg,#0a84ff,#1a5276)', border: '#0a84ff', bg: 'rgba(10,132,255,0.05)' },
  ];
  const best = top3[0];
  const bestSys = SYS[best.sysKW];
  const bestIRR = (best.irr * 100).toFixed(1);
  const beStr = best.be >= 99 ? 'มากกว่า 25' : best.be;
  const labels25 = Array.from({ length: 25 }, (_, i) => `ปี ${i + 1}`);
  const lineColors = ['#ff9f0a', '#30d158', '#0a84ff'];
  const cumConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: labels25,
      datasets: [
        ...top3.map((opt, i) => {
          const cf = calcCF(opt.sysKW, opt.stratName, 'base');
          return { label: `#${i + 1} ${SYS[opt.sysKW].name} ${STRAT_NAMES[opt.stratName]}`, data: cf.map(c => c.cum), borderColor: lineColors[i], borderWidth: i === 0 ? 3 : 2, pointRadius: 0, tension: 0.3 };
        }),
        { label: 'Break-Even', data: Array(25).fill(0), borderColor: '#333', borderDash: [5, 5], borderWidth: 1, pointRadius: 0 },
      ],
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { title: { display: true, text: 'บาท' }, ticks: { callback: (v) => fmt(v as number) } } } },
  };
  const topSet = new Set(top3.map((_, i) => i));
  const scatterConfig: ChartConfiguration = {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'All Options', data: all.filter((_, i) => !topSet.has(i)).map(o => ({ x: o.totalInvest, y: o.profit25 })), backgroundColor: '#555', pointRadius: 8 },
        { label: 'Top 3', data: top3.map(o => ({ x: o.totalInvest, y: o.profit25 })), backgroundColor: '#ff9f0a', pointRadius: 12, pointStyle: 'star' },
      ],
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { x: { title: { display: true, text: 'ลงทุนรวม (บาท)' }, ticks: { callback: (v) => fmt(v as number) } }, y: { title: { display: true, text: 'กำไร 25 ปี (บาท)' }, ticks: { callback: (v) => fmt(v as number) } } } },
  };
  const rankRows = all.map((opt, i) => {
    const roi = ((opt.profit25 / opt.totalInvest) * 100).toFixed(0);
    const be = opt.be >= 99 ? '>25' : String(opt.be);
    const irrPct = (opt.irr * 100).toFixed(1);
    const medal = i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : '';
    return [`${medal}${i + 1}`, SYS[opt.sysKW].name, STRAT_NAMES[opt.stratName], fmt(opt.totalInvest), be, fmt(opt.profit25), `${irrPct}%`, `${roi}%`, opt.score.toFixed(1)];
  });

  return (
    <div>
      <div className="rounded-3xl p-6 mb-6" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.1), rgba(255,103,35,0.05))' }}>
        <h2 className="text-[#ff9f0a] font-bold text-base mb-3">CEO Summary — ผลจากการ Optimize 60 Combinations</h2>
        <p className="text-[14px] text-[#c8c8cc] leading-relaxed">
          จากการวิเคราะห์ <strong className="text-[#f5f5f7]">15 combinations</strong> (3 ขนาด × 5 กลยุทธ์ Battery) ภายใต้ 4 สถานการณ์ค่าไฟ —{' '}
          <strong className="text-[#ff9f0a]">Option #1: {bestSys.name} + {STRAT_NAMES[best.stratName]}</strong>{' '}
          ได้คะแนนสูงสุด ({best.score.toFixed(1)}/100){' '}
          ลงทุน <strong className="text-[#f5f5f7]">{fmt(best.totalInvest)} บาท</strong>{' '}
          คืนทุน <strong className="text-[#f5f5f7]">{beStr} ปี</strong>{' '}
          กำไร 25 ปี <strong className="text-[#30d158]">{fmt(best.profit25)} บาท</strong>{' '}
          IRR <strong className="text-[#bf5af2]">{bestIRR}%/ปี</strong>{' '}
          (ดีกว่าฝากประจำ ~<strong>{(best.irr / 0.0072).toFixed(0)} เท่า</strong>)
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {top3.map((opt, i) => {
          const sys = SYS[opt.sysKW];
          const roi = ((opt.profit25 / opt.totalInvest) * 100).toFixed(0);
          const be = opt.be >= 99 ? '>25 ปี' : `${opt.be} ปี`;
          const irrPct = (opt.irr * 100).toFixed(1);
          const cfCon = calcCF(opt.sysKW, opt.stratName, 'conservative');
          const cfAgg = calcCF(opt.sysKW, opt.stratName, 'aggressive');
          return (
            <div key={i} className="rounded-2xl overflow-hidden border border-[#2a2a2a] transition-transform hover:-translate-y-1" style={{ boxShadow: `0 8px 24px ${optColors[i].border}15` }}>
              <div className="px-6 py-5 text-white relative" style={{ background: optColors[i].head }}>
                <span className="absolute right-5 top-3 text-4xl font-black opacity-20">#{i + 1}</span>
                <h2 className="font-bold text-base">{optLabels[i]}</h2>
                <div className="text-sm opacity-90">{sys.name} + {STRAT_NAMES[opt.stratName]}</div>
              </div>
              <div className="p-5 bg-[#111] space-y-0">
                {[
                  ['ขนาดระบบ', `${sys.name} (${sys.inv})`, ''],
                  ['ลงทุนทั้งหมด', `${fmt(opt.totalInvest)} บาท`, ''],
                  ['คืนทุน', be, '#30d158'],
                  ['กำไร 25 ปี (Base 3%)', `${fmt(opt.profit25)} บาท`, '#30d158'],
                  ['กำไร (Conservative 2%)', `${fmt(cfCon[24].cum)} บาท`, ''],
                  ['กำไร (Aggressive 5%)', `${fmt(cfAgg[24].cum)} บาท`, '#bf5af2'],
                  ['IRR (ผลตอบแทน/ปี)', `${irrPct}%`, '#bf5af2'],
                  ['ROI 25 ปี', `${roi}%`, ''],
                  ['Score', `${opt.score.toFixed(1)}/100`, '#0a84ff'],
                ].map(([lbl, val, clr], j) => (
                  <div key={j} className="flex justify-between py-2.5 border-b border-[#1a1a1a] text-[13px]">
                    <span className="text-[#6e6e73]">{lbl}</span>
                    <span className="font-bold" style={{ color: (clr as string) || '#f5f5f7' }}>{val}</span>
                  </div>
                ))}
                <div className="mt-3"><div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${opt.score}%`, background: optColors[i].head }} /></div></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card title="📊 Top 3 — Cumulative Cash Flow 25 ปี"><ChartWrapper config={cumConfig} /></Card>
        <Card title="📊 Risk vs Return — ทุก Combination"><ChartWrapper config={scatterConfig} /></Card>
      </div>
      <Card title="📋 Ranking Table — ทุก 15 Combinations (Base Rate 3%/ปี)" badge="15 options">
        <TableWrap headers={['#', 'ขนาด', 'กลยุทธ์ Battery', 'ลงทุนรวม', 'คืนทุน', 'กำไร 25 ปี', 'IRR', 'ROI', 'Score']} rows={rankRows} highlightBest={[0, 1, 2]} />
        <p className="text-[11px] text-[#6e6e73] mt-3 italic">* Score = Weighted (กำไร 25ปี × 35% + IRR × 25% + คืนทุนเร็ว × 20% + ลงทุนน้อย × 10% + ความเสี่ยงต่ำ × 10%)</p>
      </Card>
    </div>
  );
}
