'use client';
import { useRef, useEffect } from 'react';
import { Chart, registerables, ChartConfiguration } from 'chart.js';

Chart.register(...registerables);

interface Props { config: ChartConfiguration; height?: string; }

export default function ChartWrapper({ config, height = '400px' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const defaults = {
      ...config,
      options: {
        ...config.options,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          ...config.options?.plugins,
          legend: {
            ...((config.options?.plugins as Record<string, unknown>)?.legend as Record<string, unknown>),
            labels: { color: '#86868b', font: { size: 11 }, ...((((config.options?.plugins as Record<string, unknown>)?.legend as Record<string, unknown>)?.labels as Record<string, unknown>) || {}) },
          },
        },
        scales: Object.fromEntries(
          Object.entries(config.options?.scales || {}).map(([key, val]) => [
            key,
            { ...val as Record<string, unknown>, ticks: { color: '#6e6e73', ...((val as Record<string, unknown>)?.ticks as Record<string, unknown> || {}) }, grid: { color: '#1a1a1a', ...((val as Record<string, unknown>)?.grid as Record<string, unknown> || {}) }, title: { color: '#86868b', ...((val as Record<string, unknown>)?.title as Record<string, unknown> || {}) } },
          ])
        ),
      },
    };
    chartRef.current = new Chart(canvasRef.current, defaults as ChartConfiguration);
    return () => { chartRef.current?.destroy(); };
  }, [config]);

  return (<div style={{ height, position: 'relative' }}><canvas ref={canvasRef} /></div>);
}
