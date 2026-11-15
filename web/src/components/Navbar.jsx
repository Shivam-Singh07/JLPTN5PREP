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
    { id: 'dashboard', label: 'Dashboard', jp: 'ホーム', icon: Home },
    { id: 'vocab-learn', label: 'Learn', jp: '語彙', icon: BookOpen },
    { id: 'vocab-quiz', label: 'Practice', jp: '練習', icon: HelpCircle, badge: 'Core' },
    { id: 'grammar', label: 'Grammar', jp: '文法', icon: FileText },
    { id: 'listening', label: 'Listening', jp: '聴解', icon: Headphones, badge: 'Audio' },
    { id: 'conversations', label: 'Convo', jp: '会話', icon: MessageSquare },
    { id: 'kanji', label: 'Kanji 110', jp: '漢字', icon: Sparkles },
    { id: 'kana', label: 'Kana', jp: '五十音', icon: Grid },
    { id: 'exam', label: 'Exam', jp: '模試', icon: Gauge }
  ];

  const handleSpeedChange = (rate) => {
    setCurrentRate(rate);
    audioService.setRate(rate);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#121214]/95 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand with Japanese Hanko Seal */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            {/* Traditional Hanko Seal Stamp 「五」 (N5) */}
            <div className="w-8 h-8 rounded-lg bg-[#c53d33] flex items-center justify-center shadow-sm group-hover:bg-[#b12f26] transition-colors shrink-0">
              <span className="font-mincho font-bold text-white text-base leading-none">五</span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-stone-200 transition-colors">
                  JLPT N5
                </span>
                <span className="text-[10px] font-mincho text-[#e57a6f] px-1.5 py-0.2 rounded border border-[#c53d33]/40 bg-[#c53d33]/10">
                  完全対策
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-jp">日本語能力試験マスター</p>
            </div>
          </div>

          {/* Mobile Streak & Speed */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-900 border border-white/5 text-amber-400 text-xs font-semibold">
              <Flame size={12} className="text-amber-500 fill-amber-500" />
              <span>{streak}日</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar with Japanese Sub-Labels */}
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
                <Icon size={14} className={isActive ? 'text-[#e57a6f]' : 'text-stone-400'} />
                <span className="font-medium">{tab.label}</span>
                <span className={`text-[10px] font-mincho hidden xl:inline ${isActive ? 'text-[#e57a6f]' : 'text-stone-400'}`}>
                  {tab.jp}
                </span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                    isActive 
                      ? 'bg-[#c53d33] text-white' 
                      : 'bg-white/5 text-stone-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Global Controls: Speed & Streak (Desktop) */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Audio Speed Control */}
          <div className="flex items-center gap-1 bg-[#18181c] p-1 rounded-xl border border-white/5 text-xs">
            <span className="text-stone-400 px-1.5 text-[11px] font-medium font-jp">速度:</span>
            {[
              { val: 0.75, label: '0.75x' },
              { val: 1.0, label: '1.0x' },
              { val: 1.25, label: '1.25x' },
              { val: 1.5, label: '1.5x' },
              { val: 2.0, label: '2.0x' }
            ].map(s => (
              <button
                key={s.val}
                onClick={() => handleSpeedChange(s.val)}
                className={`px-1.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                  Math.abs(currentRate - s.val) < 0.05
                    ? 'bg-[#c53d33] text-white shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Streak pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#18181c] border border-white/5 text-stone-300 text-xs font-medium">
            <Flame size={13} className="text-amber-500 fill-amber-500" />
            <span className="text-stone-300 font-jp">{streak}日連続</span>
          </div>
        </div>
      </div>
    </header>
  );
}
