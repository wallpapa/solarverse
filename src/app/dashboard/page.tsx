'use client';
import { useState, useEffect } from 'react';
import TopThree from '@/components/TopThree';
import FullMatrix from '@/components/FullMatrix';
import Roadmap from '@/components/Roadmap';
import Compare from '@/components/Compare';
import CashFlow from '@/components/CashFlow';
import OpportunityCost from '@/components/OpportunityCost';
import BatteryPrice from '@/components/BatteryPrice';
import Sensitivity from '@/components/Sensitivity';
import QuotationAnalysis from '@/components/QuotationAnalysis';

const TABS = [
  { id: 'quotation', label: 'ð à¹à¸à¹à¸ªà¸à¸­à¸£à¸²à¸à¸²', accent: true },
  { id: 'top3', label: 'ð Top 3 à¹à¸à¸°à¸à¸³' },
  { id: 'matrix', label: 'ð Full Matrix' },
  { id: 'roadmap', label: 'ðºï¸ Roadmap' },
  { id: 'compare', label: 'âï¸ à¹à¸à¸£à¸µà¸¢à¸à¹à¸à¸µà¸¢à¸' },
  { id: 'cashflow', label: 'ð° Cash Flow' },
  { id: 'opportunity', label: 'ð¦ à¸à¹à¸²à¹à¸ªà¸µà¸¢à¹à¸­à¸à¸²à¸ª' },
  { id: 'battPrice', label: 'ð Battery Price' },
  { id: 'sensitivity', label: 'ð Sensitivity' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('quotation');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const e = typeof window !== 'undefined' ? localStorage.getItem('sv_email') || '' : '';
    setEmail(e);
  }, []);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('sv_email');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 px-6 py-3 flex justify-between items-center border-b border-[#2a2a2a]" style={{background:'rgba(0,0,0,0.8)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)'}}>
        <div className="text-lg font-bold tracking-tight flex items-center gap-2">
          âï¸ <span className="text-[#ff9f0a]">SolarVerse</span>
        </div>
        <div className="flex items-center gap-3 text-[13px] text-[#86868b]">
          <span className="hidden sm:inline">{email}</span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{background:'linear-gradient(135deg,#ff9f0a,#bf5af2)'}}>
            {email ? email[0].toUpperCase() : 'R'}
          </div>
          <button onClick={handleSignOut} className="px-3 py-1.5 rounded-[10px] border border-[#2a2a2a] bg-transparent text-[#86868b] text-xs cursor-pointer transition-all hover:border-[#ff453a] hover:text-[#ff453a]">
            Sign Out
          </button>
        </div>
      </nav>

      {/* Tab Bar â Pill Style */}
      <div className="flex justify-center px-6 py-4 gap-1 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-full text-[13px] font-medium cursor-pointer transition-all border-none
              ${activeTab === tab.id
                ? 'bg-[#1a1a1a] text-[#f5f5f7] font-semibold'
                : 'bg-transparent text-[#86868b] hover:text-[#f5f5f7]'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-6 pb-16">
        {activeTab === 'quotation' && <QuotationAnalysis />}
        {activeTab === 'top3' && <TopThree />}
        {activeTab === 'matrix' && <FullMatrix />}
        {activeTab === 'roadmap' && <Roadmap />}
        {activeTab === 'compare' && <Compare />}
        {activeTab === 'cashflow' && <CashFlow />}
        {activeTab === 'opportunity' && <OpportunityCost />}
        {activeTab === 'battPrice' && <BatteryPrice />}
        {activeTab === 'sensitivity' && <Sensitivity />}
      </div>
    </div>
  );
}
