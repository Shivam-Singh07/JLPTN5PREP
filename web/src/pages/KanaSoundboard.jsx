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
      {/* Header */}
      <div className="p-6 glass-panel rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-bold">
            <Grid size={13} />
            <span>KANA AUDIO SYSTEM (五十音図・濁音・拗音)</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            {selectedScript === 'hiragana' ? 'Hiragana Soundboard (ひらがな)' : 'Katakana Soundboard (カタカナ)'}
          </h1>
          <p className="text-xs text-slate-300">
            From the NIHONKAI Script Book. Click any kana character to hear authentic native studio audio.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-white/5 text-xs">
          <button
            onClick={() => setActiveView('chart')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'chart'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>Charts</span>
          </button>
          <button
            onClick={() => setActiveView('quiz')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'quiz'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play size={14} className="fill-pink-300" />
            <span>Practice Quiz</span>
          </button>
        </div>
      </div>

      {/* Script & Category Selectors */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Script Switcher */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-white/5 text-xs w-full sm:w-auto">
          <button
            onClick={() => setSelectedScript('hiragana')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold transition-all ${
              selectedScript === 'hiragana'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hiragana (あ)
          </button>
          <button
            onClick={() => setSelectedScript('katakana')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold transition-all ${
              selectedScript === 'katakana'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Katakana (ア)
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {[
            { id: 'all', label: `All (${rawKanaList.length})` },
            { id: 'basic', label: 'Basic 46 (五十音)' },
            { id: 'dakuten', label: 'Dakuten (濁音・半濁音)' },
            { id: 'yoon', label: 'Yōon (拗音 33)' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedGroup(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedGroup === cat.id
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Launch Practice Banner */}
      <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/25 flex items-center justify-between gap-3 animate-fadeIn">
        <div>
          <div className="text-xs font-bold text-white">
            Ready to test your {selectedScript === 'hiragana' ? 'Hiragana' : 'Katakana'} memory?
          </div>
          <div className="text-[11px] text-pink-300">
            Practice reading and listening drills with 4-choice questions and instant audio feedback.
          </div>
        </div>
        <button
          onClick={() => setActiveView('quiz')}
          className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-md shadow-pink-500/20 flex items-center gap-1.5 whitespace-nowrap"
        >
          <Play size={13} className="fill-white" />
          <span>Launch Kana Quiz</span>
        </button>
      </div>

      {/* Kana Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
        {filteredKana.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => playKana(item.kana)}
            className="p-3.5 rounded-2xl glass-panel hover:bg-slate-800 border-white/5 hover:border-pink-500/40 text-center group cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <div className="text-2xl md:text-3xl font-black text-white font-jp group-hover:text-pink-400 transition-colors">
              {item.kana}
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-1 font-mono">
              {item.romaji}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

