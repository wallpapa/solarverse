// Shared UI components — Steve Jobs / Apple Dark aesthetic
import React from 'react';

export function BentoCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  const colorMap: Record<string, string> = { orange: '#ff9f0a', green: '#30d158', blue: '#0a84ff', purple: '#bf5af2', red: '#ff453a', cyan: '#64d2ff' };
  const color = colorMap[accent || 'orange'] || '#f5f5f7';
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-3xl p-6 relative overflow-hidden transition-all hover:border-[rgba(255,159,10,0.3)] hover:-translate-y-0.5 fade-up" style={{animationDelay:`${Math.random()*0.2}s`}}>
      <div className="text-xs text-[#6e6e73] font-medium tracking-wider uppercase mb-2">{label}</div>
      <div className="text-4xl font-extrabold tracking-tight leading-tight" style={{ color }}>{value}</div>
      <div className="text-[13px] text-[#86868b] mt-1">{sub}</div>
    </div>
  );
}

export function Card({ children, title, badge, className = '' }: { children: React.ReactNode; title?: string; badge?: string; className?: string }) {
  return (
    <div className={`bg-[#111] border border-[#2a2a2a] rounded-3xl p-6 ${className}`}>
      {(title || badge) && (
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
          {badge && <span className="px-3 py-1 rounded-full bg-[#1a1a1a] text-xs text-[#86868b]">{badge}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

export function TableWrap({ headers, rows, highlightBest }: { headers: string[]; rows: (string | React.ReactNode)[][]; highlightBest?: number[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead><tr>{headers.map((h, i) => (
          <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] tracking-wider uppercase border-b border-[#2a2a2a] bg-[#111]">{h}</th>
        ))}</tr></thead>
        <tbody>{rows.map((row, ri) => (
          <tr key={ri} className={`transition-colors hover:bg-[#1a1a1a] ${highlightBest?.includes(ri) ? 'bg-[#0d2818]' : ''}`}>
            {row.map((cell, ci) => (<td key={ci} className="px-4 py-3 border-b border-[#2a2a2a]">{cell}</td>))}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function SelectorRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-4 items-center flex-wrap mb-5">{children}</div>;
}

export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-semibold text-[#86868b] tracking-wide">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-[#f5f5f7] text-sm outline-none cursor-pointer">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Alert({ type, title, children }: { type: 'info' | 'warn' | 'success' | 'danger'; title: string; children: React.ReactNode }) {
  const colors: Record<string, string> = { info: '#0a84ff', warn: '#ff9f0a', success: '#30d158', danger: '#ff453a' };
  return (
    <div className="rounded-2xl p-5 mb-5 border-l-4" style={{ borderLeftColor: colors[type], background: `${colors[type]}08` }}>
      <h3 className="font-semibold mb-1 text-sm">{title}</h3>
      <div className="text-[13px] text-[#86868b] leading-relaxed">{children}</div>
    </div>
  );
}

export function MetricBox({ value, label, color = '#f5f5f7' }: { value: string; label: string; color?: string }) {
  return (
    <div className="text-center p-4">
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[11px] text-[#6e6e73] mt-1 leading-tight">{label}</div>
    </div>
  );
}
