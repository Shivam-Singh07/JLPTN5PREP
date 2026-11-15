import React, { useState, useMemo } from 'react';
import { Grid, Volume2, Sparkles, BookOpen, Play, Filter } from 'lucide-react';
import n5Data from '../data/n5Data';
import audioService from '../services/audioService';
import KanaQuiz from './KanaQuiz';

export default function KanaSoundboard({ initialView = 'chart' }) {
  const [activeView, setActiveView] = useState(initialView); // 'chart' | 'quiz'
  const [selectedScript, setSelectedScript] = useState('hiragana'); // 'hiragana' | 'katakana'
  const [selectedGroup, setSelectedGroup] = useState('all'); // 'all' | 'basic' | 'dakuten' | 'yoon'

  const rawKanaList = selectedScript === 'hiragana' ? n5Data.hiragana : n5Data.katakana;

  const filteredKana = useMemo(() => {
    if (selectedGroup === 'basic') {
      return rawKanaList.filter(k => k.group !== 'dakuten' && k.group !== 'handakuten' && k.group !== 'yoon');
    }
    if (selectedGroup === 'dakuten') {
      return rawKanaList.filter(k => k.group === 'dakuten' || k.group === 'handakuten');
    }
    if (selectedGroup === 'yoon') {
      return rawKanaList.filter(k => k.group === 'yoon');
    }
    return rawKanaList;
  }, [rawKanaList, selectedGroup]);

  const playKana = (char) => {
    audioService.speak(char);
  };

  if (activeView === 'quiz') {
    return (
      <KanaQuiz 
        initialScript={selectedScript} 
        onBackToSoundboard={() => setActiveView('chart')} 
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header - Modern Japanese Bento Banner */}
      <div className="bento-box p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="kamon-watermark">音</div>
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#c53d33]/10 border border-[#c53d33]/30 text-[#e57a6f] text-xs font-mincho font-medium">
            <span>〔 五十音図 〕</span>
            <span>KANA AUDIO SYSTEM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mincho text-white tracking-tight">
            {selectedScript === 'hiragana' ? 'Hiragana Soundboard (平仮名)' : 'Katakana Soundboard (片仮名)'}
          </h1>
          <p className="text-xs text-stone-300 font-jp leading-relaxed max-w-xl">
            文字をクリックすると東京アクセントのネイティブ音声が再生されます。
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-[#131316] p-1.5 rounded-xl border border-white/10 text-xs relative z-10 shrink-0">
          <button
            onClick={() => setActiveView('chart')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'chart'
                ? 'bg-[#222227] text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>一覧表 (Chart)</span>
          </button>
          <button
            onClick={() => setActiveView('quiz')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'quiz'
                ? 'bg-[#c53d33] text-white shadow-md shadow-[#c53d33]/20'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Play size={13} className="fill-current" />
            <span>問題練習 (Quiz)</span>
          </button>
        </div>
      </div>

      {/* Script & Category Selectors */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Script Switcher */}
        <div className="flex items-center bg-[#17171b] p-1 rounded-xl border border-white/5 text-xs w-full sm:w-auto">
          <button
            onClick={() => setSelectedScript('hiragana')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg font-medium transition-all ${
              selectedScript === 'hiragana'
                ? 'bg-[#c53d33] text-white'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span className="font-mincho">ひらがな (Hiragana)</span>
          </button>
          <button
            onClick={() => setSelectedScript('katakana')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg font-medium transition-all ${
              selectedScript === 'katakana'
                ? 'bg-[#c53d33] text-white'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span className="font-mincho">カタカナ (Katakana)</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {[
            { id: 'all', label: `すべて (${rawKanaList.length})` },
            { id: 'basic', label: '基本音 (46音)' },
            { id: 'dakuten', label: '濁音・半濁音' },
            { id: 'yoon', label: '拗音 (33音)' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedGroup(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all border ${
                selectedGroup === cat.id
                  ? 'bg-[#222227] text-white border-white/20'
                  : 'bg-[#17171b] text-stone-400 hover:text-white border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Launch Practice Banner */}
      <div className="p-3.5 rounded-xl bg-[#17171b] border border-white/10 flex items-center justify-between gap-3 animate-fadeIn">
        <div>
          <div className="text-xs font-medium text-white font-jp">
            {selectedScript === 'hiragana' ? '平仮名' : '片仮名'}の読み分け演習
          </div>
          <div className="text-[11px] text-stone-400 font-jp">
            4択問題と音声で文字認識速度を鍛えます。
          </div>
        </div>
        <button
          onClick={() => setActiveView('quiz')}
          className="px-3.5 py-1.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white font-medium text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors"
        >
          <Play size={12} className="fill-white" />
          <span>練習開始</span>
        </button>
      </div>

      {/* Kana Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {filteredKana.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => playKana(item.kana)}
            className="p-3 rounded-xl bg-[#17171b] border border-white/5 hover:border-white/20 hover:bg-[#1e1e24] text-center group cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <div className="text-2xl md:text-3xl font-bold text-white font-mincho group-hover:text-[#e57a6f] transition-colors py-0.5">
              {item.kana}
            </div>
            <div className="text-[10px] font-medium text-stone-400 mt-0.5 font-mono">
              {item.romaji}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

