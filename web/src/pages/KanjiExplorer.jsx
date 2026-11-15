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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Tab Switcher - Modern Japanese Bento Banner */}
      <div className="bento-box p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="kamon-watermark">漢</div>
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#c53d33]/10 border border-[#c53d33]/30 text-[#e57a6f] text-xs font-mincho font-medium">
            <span>〔 漢字辞典 〕</span>
            <span>N5 KANJI 110</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mincho text-white tracking-tight">Essential JLPT N5 Kanji</h1>
          <p className="text-xs text-stone-300 font-jp leading-relaxed max-w-xl">
            全110字の基本漢字を10のテーマ別課に分類。画数・音読み・訓読み・実践熟語を収録。
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-[#131316] p-1.5 rounded-xl border border-white/10 text-xs relative z-10 shrink-0">
          <button
            onClick={() => setActiveView('explore')}
            className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'explore'
                ? 'bg-[#222227] text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>一覧 (110)</span>
          </button>
          <button
            onClick={() => {
              setQuizChapter('all');
              setActiveView('quiz');
            }}
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

      {/* Chapter Filter Bar & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Chapters scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedChapterFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              selectedChapterFilter === 'all'
                ? 'bg-[#c53d33] border-[#c53d33] text-white'
                : 'bg-[#17171b] text-stone-400 hover:text-white border-white/5'
            }`}
          >
            全110字
          </button>
          {kanjiChapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChapterFilter(String(ch.id))}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                selectedChapterFilter === String(ch.id)
                  ? 'bg-[#c53d33] border-[#c53d33] text-white'
                  : 'bg-[#17171b] text-stone-400 hover:text-white border-white/5'
              }`}
            >
              <span className="font-mincho">第{ch.id}課:</span> {ch.title.split('(')[0].trim()} ({ch.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-stone-500" />
          <input
            type="text"
            placeholder="漢字・意味・読みで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#17171b] border border-white/10 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c53d33]"
          />
        </div>
      </div>

      {/* Quick Launch Practice Banner for selected chapter */}
      {selectedChapterFilter !== 'all' && (
        <div className="p-3.5 rounded-xl bg-[#17171b] border border-white/10 flex items-center justify-between gap-3 animate-fadeIn">
          <div>
            <div className="text-xs font-medium text-white font-jp">
              第 {selectedChapterFilter} 課の漢字演習
            </div>
            <div className="text-[11px] text-stone-400 font-jp">
              この課の {filteredKanji.length} 字を4択問題と音声で練習できます。
            </div>
          </div>
          <button
            onClick={() => {
              setQuizChapter(selectedChapterFilter);
              setActiveView('quiz');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white font-medium text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <Play size={12} className="fill-white" />
            <span>練習開始</span>
          </button>
        </div>
      )}

      {/* Kanji Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
        {filteredKanji.map((item) => (
          <div
            key={item.kanji}
            onClick={() => setSelectedKanji(item)}
            className="p-3.5 rounded-xl bg-[#17171b] border border-white/5 hover:border-white/20 hover:bg-[#1e1e24] cursor-pointer text-center group transition-all"
          >
            <div className="text-3xl md:text-4xl font-bold text-white font-mincho group-hover:text-[#e57a6f] transition-colors py-1">
              {item.kanji}
            </div>
            <div className="text-xs font-medium text-stone-200 mt-1 truncate">
              {item.meaning}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5 truncate font-jp">
              {item.kunyomi || item.onyomi}
            </div>
            <div className="text-[9px] text-stone-500 mt-1 font-mincho">
              {item.strokes}画
            </div>
          </div>
        ))}
      </div>

      {/* Kanji Detail Modal */}
      {selectedKanji && (
        <div 
          onClick={() => setSelectedKanji(null)} 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="max-w-lg w-full p-6 md:p-8 rounded-2xl bg-[#18181c] border border-white/10 space-y-6 shadow-2xl relative"
          >
            <button
              onClick={() => setSelectedKanji(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Kanji Header */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-xl bg-[#121214] border border-white/10 flex items-center justify-center text-5xl font-bold text-white font-mincho">
                {selectedKanji.kanji}
              </div>

              <div className="space-y-1">
                <div className="text-xl font-bold text-white">{selectedKanji.meaning}</div>
                <div className="text-xs text-stone-400 font-mincho font-medium">{selectedKanji.strokes} 画 (Strokes)</div>
                <div className="pt-1">
                  <AudioButton text={selectedKanji.kanji} size="sm" label="発音" />
                </div>
              </div>
            </div>

            {/* Readings */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#121214] border border-white/5">
              <div>
                <div className="text-[10px] font-medium text-stone-400 font-jp">音読み (On'yomi)</div>
                <div className="text-sm font-bold text-white font-mincho mt-1">{selectedKanji.onyomi || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] font-medium text-stone-400 font-jp">訓読み (Kun'yomi)</div>
                <div className="text-sm font-bold text-white font-mincho mt-1">{selectedKanji.kunyomi || '—'}</div>
              </div>
            </div>

            {/* Compound Words */}
            {selectedKanji.examples && selectedKanji.examples.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-stone-400 font-jp">
                  熟語・用例 (Vocabulary Compounds):
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedKanji.examples.map((ex, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#121214] border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mincho text-sm">{ex.word}</span>
                          <span className="text-xs text-[#e57a6f] font-jp">【{ex.reading}】</span>
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">{ex.meaning}</div>
                      </div>

                      <AudioButton text={ex.word} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom CTA */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
              <span className="text-[11px] text-stone-400 font-mincho">
                第 {selectedKanji.chapter} 課: {selectedKanji.chapterTitle?.split('(')[0]?.trim() || 'N5 Kanji'}
              </span>
              <button
                onClick={() => {
                  setQuizChapter(String(selectedKanji.chapter || 'all'));
                  setSelectedKanji(null);
                  setActiveView('quiz');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white font-medium text-xs transition-colors flex items-center gap-1.5"
              >
                <Play size={12} className="fill-white" />
                <span>この課を練習 (Practice Ch {selectedKanji.chapter})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

