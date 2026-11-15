import React, { useState } from 'react';
import { 
  Headphones, 
  Eye, 
  EyeOff, 
  Play, 
  Volume2, 
  CheckCircle, 
  Sparkles, 
  HelpCircle 
} from 'lucide-react';
import n5Data from '../data/n5Data';
import AudioButton from '../components/AudioButton';
import audioService from '../services/audioService';

export default function ListeningView() {
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [revealedIds, setRevealedIds] = useState(new Set());
  const [showAllText, setShowAllText] = useState(false);

  const currentListening = n5Data.listening.find(l => l.chapter === selectedChapter) || n5Data.listening[0];
  const exercises = currentListening?.exercises || [];

  const toggleReveal = (id) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const playEntireChapter = async () => {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      audioService.speak(ex.japanese || ex.romaji);
      // Wait roughly based on text length
      await new Promise(r => setTimeout(r, Math.max(2500, (ex.japanese?.length || 10) * 200)));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header - Modern Japanese Bento Banner */}
      <div className="bento-box p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="kamon-watermark">聴</div>
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#c53d33]/10 border border-[#c53d33]/30 text-[#e57a6f] text-xs font-mincho font-medium">
            <Headphones size={13} />
            <span>〔 聴解演習 〕 CHŌKAI LISTENING LAB</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mincho text-white tracking-tight">
            第{selectedChapter}課: {currentListening?.title || `第${selectedChapter}課 聴解練習`}
          </h1>
          <p className="text-xs text-stone-300 font-jp leading-relaxed max-w-xl">
            まずは文字を見ずに音声を聴き、耳を慣らしてからスクリプトを確認しましょう。
          </p>
        </div>

        {/* Global listening controls */}
        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={() => setShowAllText(!showAllText)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1d1d22] hover:bg-[#25252b] text-stone-300 text-xs font-medium border border-white/10 transition-all cursor-pointer"
          >
            {showAllText ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showAllText ? '全て隠す' : '全て表示'}</span>
          </button>

          <button
            onClick={playEntireChapter}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white text-xs font-bold shadow-md shadow-[#c53d33]/20 transition-all cursor-pointer"
          >
            <Play size={13} className="fill-white" />
            <span>連続再生 (Play All)</span>
          </button>
        </div>
      </div>

      {/* Chapter Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {Array.from({ length: 24 }, (_, i) => i + 1).map(ch => (
          <button
            key={ch}
            onClick={() => { setSelectedChapter(ch); setRevealedIds(new Set()); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
              selectedChapter === ch
                ? 'bg-[#c53d33] border-[#c53d33] text-white shadow-sm'
                : 'bg-[#17171b] border-white/5 text-stone-400 hover:text-white hover:border-white/20'
            }`}
          >
            <span className="font-mincho">第{ch}課</span>
          </button>
        ))}
      </div>

      {/* Exercise Sentences List */}
      <div className="space-y-3.5">
        {exercises.length === 0 ? (
          <div className="bento-box p-8 text-center text-stone-400 text-sm font-jp">
            この課の聴解音声例文はありません。
          </div>
        ) : (
          exercises.map((ex, idx) => {
            const isRevealed = showAllText || revealedIds.has(ex.id);
            return (
              <div
                key={ex.id || idx}
                className="bento-box p-5 md:p-6 space-y-3 relative"
              >
                <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#c53d33]/15 text-[#e57a6f] border border-[#c53d33]/25 font-mincho font-bold text-xs flex items-center justify-center shrink-0">
                      {ex.number || idx + 1}
                    </span>
                    <span className="text-xs font-bold text-stone-300 font-mincho">
                      例文 {ex.number || idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReveal(ex.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#18181d] hover:bg-[#23232a] text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-all border border-white/5 cursor-pointer"
                    >
                      {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{isRevealed ? '隠す' : '表示'}</span>
                    </button>

                    <AudioButton text={ex.japanese || ex.romaji} size="md" />
                  </div>
                </div>

                {/* Sentence Script & English Meaning */}
                <div 
                  className={`p-4 rounded-xl border transition-all ${
                    !isRevealed 
                      ? 'bg-[#131316] border-white/5 cursor-pointer hover:border-white/15' 
                      : 'bg-[#131316] border-white/10'
                  }`}
                  onClick={() => !isRevealed && toggleReveal(ex.id)}
                >
                  {!isRevealed ? (
                    <div className="py-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-stone-400 select-none font-jp">
                      <div className="flex items-center gap-2 text-xs">
                        <EyeOff size={14} className="text-stone-500 shrink-0" />
                        <span>スクリプトは非表示です。音声を聴いてからクリックして確認。</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#e57a6f] shrink-0 font-mincho">
                        〔 クリックで表示 〕
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-fadeIn">
                      {/* Japanese Script */}
                      <div className="text-base md:text-lg font-bold text-white font-mincho leading-relaxed">
                        {ex.japanese || ex.romaji}
                      </div>

                      {/* Romaji */}
                      {ex.romaji && (
                        <div className="text-xs text-stone-400 font-sans">
                          {ex.romaji}
                        </div>
                      )}

                      {/* English Meaning */}
                      {ex.english && (
                        <div className="text-xs text-stone-300 mt-2 pt-2 border-t border-white/5 flex items-start gap-2 font-jp">
                          <span className="text-[10px] font-mincho text-stone-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 shrink-0">
                            英語訳
                          </span>
                          <span className="leading-relaxed">{ex.english}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
