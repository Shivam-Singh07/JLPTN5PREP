import React from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Headphones, 
  MessageSquare, 
  Sparkles, 
  FileText, 
  Grid, 
  Flame, 
  Gauge, 
  Home,
  Volume2
} from 'lucide-react';
import audioService from '../services/audioService';

export default function Navbar({ activeTab, setActiveTab, streak = 0, currentRate, setCurrentRate }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'vocab-learn', label: 'Learn Vocab', icon: BookOpen },
    { id: 'vocab-quiz', label: 'Practice Quiz', icon: HelpCircle, badge: 'Core' },
    { id: 'grammar', label: 'Grammar', icon: FileText },
    { id: 'listening', label: 'Listening Lab', icon: Headphones, badge: 'Audio' },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare },
    { id: 'kanji', label: 'Kanji 110', icon: Sparkles },
    { id: 'kana', label: 'Kana Charts', icon: Grid },
    { id: 'exam', label: 'Mock Exam', icon: Gauge }
  ];

  const handleSpeedChange = (rate) => {
    setCurrentRate(rate);
    audioService.setRate(rate);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0b0f19]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3 shadow-xl shadow-black/40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform">
              <span className="text-xl">🌸</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-rose-200 bg-clip-text text-transparent">
                  JLPT N5 PREP
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Master
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  v0.0.1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-jp font-medium">日本語能力試験 N5 完全対策</p>
            </div>
          </div>

          {/* Mobile Speed & Streak */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Flame size={13} className="text-amber-400 fill-amber-400" />
              <span>{streak}d</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab ${isActive ? 'active' : ''}`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive 
                      ? 'bg-rose-500 text-white shadow-sm' 
                      : 'bg-white/10 text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Global Controls: Speed & Streak (Desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Audio Engine Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-bold">
            <Volume2 size={13} className="text-rose-400 animate-pulse" />
            <span>Studio Audio</span>
          </div>

          {/* Audio Speed Control */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs">
            <span className="text-slate-400 px-2 font-medium">Speed:</span>
            {[
              { val: 0.75, label: '0.75x' },
              { val: 0.95, label: '1.0x' },
              { val: 1.2, label: '1.2x' }
            ].map(s => (
              <button
                key={s.val}
                onClick={() => handleSpeedChange(s.val)}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-all ${
                  Math.abs(currentRate - s.val) < 0.05
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Streak pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
            <Flame size={15} className="text-amber-400 fill-amber-400" />
            <span>{streak} Day Streak</span>
          </div>
        </div>
      </div>
    </header>
  );
}
