'use client';
import { BATT_DECLINE, BATT_HIST_YEARS, BATT_HIST_PRICES, PACK_FORECAST, MODULE_PRICE_TODAY, fmt } from '@/lib/solar-engine';
import { Card, TableWrap, Alert } from './ui';
import ChartWrapper from './ChartWrapper';
import type { ChartConfiguration } from 'chart.js';

export default function BatteryPrice() {
  const histConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: BATT_HIST_YEARS,
      datasets: [{ label: 'Li-ion Pack ($/kWh)', data: BATT_HIST_PRICES, borderColor: '#0a84ff', backgroundColor: '#0a84ff33', fill: true, borderWidth: 2, pointRadius: 4, tension: 0.3 }],
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { title: { display: true, text: '$/kWh' } } } },
  };
  const modYears = Array.from({ length: 10 }, (_, i) => 2569 + i);
  const forecastConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: modYears,
      datasets: [
        { label: 'Optimistic (-13%/yr)', data: BATT_DECLINE.optimistic, borderColor: '#30d158', borderWidth: 2, pointRadius: 4, tension: 0.3 },
        { label: 'Moderate (-8%/yr)', data: BATT_DECLINE.moderate, borderColor: '#0a84ff', borderWidth: 2, pointRadius: 4, tension: 0.3 },
        { label: 'Pessimistic (-5%/yr)', data: BATT_DECLINE.pessimistic, borderColor: '#ff9f0a', borderWidth: 2, pointRadius: 4, tension: 0.3 },
      ],
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { title: { display: true, text: 'บาท/Module' }, ticks: { callback: (v) => fmt(v as number) } } } },
  };
  const rows = PACK_FORECAST.map((pf, i) => {
    const yoy = i === 0 ? '—' : `${(((pf - PACK_FORECAST[i - 1]) / PACK_FORECAST[i - 1]) * 100).toFixed(1)}%`;
    const mp = BATT_DECLINE.moderate[i];
    return [`${2569 + i} (ปีที่ ${i + 1})`, `$${pf}`, yoy, fmt(mp), fmt(MODULE_PRICE_TODAY - mp)];
  });
  return (
    <div>
      <Alert type="info" title="Deep Research: Battery Price Decline — BNEF, NREL, IEA">
        ราคา Battery Pack ลดลง 93% ตั้งแต่ 2010 | LFP Stationary Storage = segment ที่ลดเร็วที่สุด |
        NREL คาด Moderate: ลด 2.3%/ปี (-30% ภายใน 2035) | Advanced: ลด 4.0%/ปี (-52% ภายใน 2035)
      </Alert>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="📊 ราคา Battery Pack ย้อนหลัง ($/kWh) — BNEF"><ChartWrapper config={histConfig} /></Card>
        <Card title="📊 LUNA2000 Module Price Forecast (THB) — 3 Scenarios"><ChartWrapper config={forecastConfig} /></Card>
      </div>
      <Card title="ราคาประมาณ LUNA2000 6.9kWh Module ในไทย (ติดตั้งรวม)">
        <TableWrap headers={['ปี', 'Pack Price ($/kWh)', 'YoY', 'ราคาต่อ Module (THB)', 'ประหยัด vs วันนี้']} rows={rows} />
      </Card>
    </div>
  );
}
