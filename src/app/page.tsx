'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [email, setEmail] = useState('witsarut2010@gmail.com');
  const router = useRouter();

  const handleLogin = () => {
    if (email) {
      if (typeof window !== 'undefined') localStorage.setItem('sv_email', email);
      router.push('/dashboard');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute w-[600px] h-[600px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{background:'radial-gradient(circle,rgba(255,159,10,0.08) 0%,transparent 70%)'}} />
      <div className="px-4 py-1.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-xs font-medium text-[#ff9f0a] tracking-wider mb-6 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff9f0a] animate-pulse" />
        Solar Investment Intelligence
      </div>
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-[-2px] leading-none text-center mb-4">
        <span className="bg-clip-text text-transparent" style={{backgroundImage:'linear-gradient(135deg,#f5f5f7 0%,#86868b 100%)'}}>Think </span>
        <span className="bg-clip-text text-transparent" style={{backgroundImage:'linear-gradient(135deg,#ff9f0a 0%,#ff6723 100%)'}}>Different</span>
        <br />
        <span className="bg-clip-text text-transparent" style={{backgroundImage:'linear-gradient(135deg,#f5f5f7 0%,#86868b 100%)'}}>About Energy.</span>
      </h1>
      <p className="text-lg text-[#86868b] text-center max-w-md leading-relaxed mb-10">
        ทุกใบเสนอราคา ทุกการตัดสินใจ ทุกบาทที่ลงทุน — ในที่เดียว เรียบง่าย ทรงพลัง
      </p>
      <div className="flex flex-col items-center gap-3 w-full max-w-[360px] px-4">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@gmail.com"
          className="w-full px-5 py-4 rounded-[14px] border border-[#2a2a2a] bg-[#111] text-[#f5f5f7] text-base outline-none transition-all focus:border-[#ff9f0a] placeholder:text-[#6e6e73]"
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
        <button onClick={handleLogin}
          className="w-full py-4 rounded-[14px] border-none text-white text-base font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] tracking-wide"
          style={{background:'linear-gradient(135deg,#ff9f0a,#ff6723)',boxShadow:'0 8px 32px rgba(255,159,10,0.2)'}}>
          เริ่มต้น — It just works.
        </button>
      </div>
      <p className="mt-4 text-[13px] text-[#6e6e73]">วลีรัตน์ คลินิก — Solar Investment Dashboard v14</p>
    </main>
  );
}
