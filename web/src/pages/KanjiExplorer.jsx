import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  X, 
  Volume2, 
  Layers, 
  BookOpen, 
  ArrowRight,
  HelpCircle,
  Play
} from 'lucide-react';
import n5Data from '../data/n5Data';
import AudioButton from '../components/AudioButton';
import audioService from '../services/audioService';
import KanjiQuiz from './KanjiQuiz';

export default function KanjiExplorer({ initialView = 'explore', initialChapter = 'all' }) {
  const [activeView, setActiveView] = useState(initialView); // 'explore' | 'quiz'
  const [quizChapter, setQuizChapter] = useState(initialChapter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKanji, setSelectedKanji] = useState(null);
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('all');

  const kanjiList = n5Data.kanji110;
  const kanjiChapters = n5Data.kanjiChapters || [];

  const filteredKanji = useMemo(() => {
    let list = kanjiList;
    if (selectedChapterFilter !== 'all') {
      const chNum = parseInt(selectedChapterFilter, 10);
      list = list.filter(k => k.chapter === chNum);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(k => 
      k.kanji.includes(q) ||
      k.meaning.toLowerCase().includes(q) ||
      k.onyomi.toLowerCase().includes(q) ||
      k.kunyomi.toLowerCase().includes(q)
    );
  }, [kanjiList, selectedChapterFilter, searchQuery]);

  if (activeView === 'quiz') {
    return (
      <KanjiQuiz 
        initialChapter={quizChapter} 
        onBackToExplorer={() => setActiveView('explore')} 
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header & Tab Switcher */}
      <div className="p-6 glass-panel rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
            <Sparkles size={13} />
            <span>N5 KANJI 110 (漢字)</span>
          </div>
          <h1 className="text-2xl font-black text-white">Essential JLPT N5 Kanji</h1>
          <p className="text-xs text-slate-300">
            All 110 official Kanji characters structured across 10 themed chapters with stroke counts, readings, and vocabulary.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-white/5 text-xs">
          <button
            onClick={() => setActiveView('explore')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'explore'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>Explore 110</span>
          </button>
          <button
            onClick={() => {
              setQuizChapter('all');
              setActiveView('quiz');
            }}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'quiz'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play size={14} className="fill-purple-300" />
            <span>Practice Quiz</span>
          </button>
        </div>
      </div>

      {/* Chapter Filter Bar & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Chapters scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedChapterFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedChapterFilter === 'all'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            All Kanji (110)
          </button>
          {kanjiChapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChapterFilter(String(ch.id))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedChapterFilter === String(ch.id)
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              Ch {ch.id}: {ch.title.split('(')[0].trim()} ({ch.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Kanji, meaning, or reading..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Quick Launch Practice Banner for selected chapter */}
      {selectedChapterFilter !== 'all' && (
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between gap-3 animate-fadeIn">
          <div>
            <div className="text-xs font-bold text-white">
              Ready to test Chapter {selectedChapterFilter}?
            </div>
            <div className="text-[11px] text-purple-300">
              Practice this chapter's {filteredKanji.length} Kanji with 4-choice questions and pronunciation.
            </div>
          </div>
          <button
            onClick={() => {
              setQuizChapter(selectedChapterFilter);
              setActiveView('quiz');
            }}
            className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Play size={13} className="fill-white" />
            <span>Practice Chapter {selectedChapterFilter}</span>
          </button>
        </div>
      )}

      {/* Kanji Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {filteredKanji.map((item) => (
          <div
            key={item.kanji}
            onClick={() => setSelectedKanji(item)}
            className="p-4 rounded-2xl glass-panel hover:bg-slate-800 border-white/5 hover:border-purple-500/40 cursor-pointer text-center group transition-all transform hover:-translate-y-1 shadow-sm"
          >
            <div className="text-3xl md:text-4xl font-black text-white font-jp group-hover:text-purple-400 transition-colors">
              {item.kanji}
            </div>
            <div className="text-xs font-bold text-slate-200 mt-2 truncate">
              {item.meaning}
            </div>
            <div className="text-[10px] text-purple-300/80 mt-0.5 truncate font-jp">
              {item.kunyomi || item.onyomi}
            </div>
            <div className="text-[9px] text-slate-500 mt-1">
              {item.strokes} strokes
            </div>
          </div>
        ))}
      </div>

      {/* Kanji Detail Modal */}
      {selectedKanji && (
        <div 
          onClick={() => setSelectedKanji(null)} 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="max-w-lg w-full p-6 md:p-8 rounded-3xl glass-panel-glow border-purple-500/30 bg-slate-900 space-y-6 shadow-2xl relative"
          >
            <button
              onClick={() => setSelectedKanji(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Kanji Header */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/40 flex items-center justify-center text-5xl font-black text-white font-jp shadow-inner">
                {selectedKanji.kanji}
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-black text-white">{selectedKanji.meaning}</div>
                <div className="text-xs text-purple-300 font-semibold">{selectedKanji.strokes} Strokes</div>
                <div className="pt-1">
                  <AudioButton text={selectedKanji.kanji} size="sm" label="Pronounce" />
                </div>
              </div>
            </div>

            {/* Readings */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-800/60 border border-white/5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">音読み (On'yomi)</div>
                <div className="text-sm font-bold text-white font-jp mt-1">{selectedKanji.onyomi || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">訓読み (Kun'yomi)</div>
                <div className="text-sm font-bold text-white font-jp mt-1">{selectedKanji.kunyomi || '—'}</div>
              </div>
            </div>

            {/* Compound Words */}
            {selectedKanji.examples && selectedKanji.examples.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Example Vocabulary Compounds:
                </div>
                <div className="space-y-1.5">
                  {selectedKanji.examples.map((ex, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-slate-800/40 border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-jp text-base">{ex.word}</span>
                          <span className="text-xs text-purple-300 font-jp">【{ex.reading}】</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{ex.meaning}</div>
                      </div>

                      <AudioButton text={ex.word} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom CTA */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Chapter {selectedKanji.chapter}: {selectedKanji.chapterTitle?.split('(')[0]?.trim() || 'N5 Kanji'}
              </span>
              <button
                onClick={() => {
                  setQuizChapter(String(selectedKanji.chapter || 'all'));
                  setSelectedKanji(null);
                  setActiveView('quiz');
                }}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-1.5"
              >
                <Play size={13} className="fill-white" />
                <span>Practice Chapter {selectedKanji.chapter}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

