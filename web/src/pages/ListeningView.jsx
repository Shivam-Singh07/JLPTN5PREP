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
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-panel rounded-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Headphones size={13} />
            <span>CHŌKAI 聴解 (LISTENING LAB)</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            {currentListening?.title || `Chapter ${selectedChapter} Listening`}
          </h1>
          <p className="text-xs text-slate-400">
            Listen first without looking at text to train your ear, then reveal script to verify.
          </p>
        </div>

        {/* Global listening controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllText(!showAllText)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10 transition-all"
          >
            {showAllText ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showAllText ? 'Hide All' : 'Reveal All'}</span>
          </button>

          <button
            onClick={playEntireChapter}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
          >
            <Play size={14} className="fill-white" />
            <span>Play All</span>
          </button>
        </div>
      </div>

      {/* Chapter Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {Array.from({ length: 24 }, (_, i) => i + 1).map(ch => (
          <button
            key={ch}
            onClick={() => { setSelectedChapter(ch); setRevealedIds(new Set()); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedChapter === ch
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm'
                : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Ch {ch}
          </button>
        ))}
      </div>

      {/* Exercise Sentences List */}
      <div className="space-y-3">
        {exercises.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl text-slate-400 text-sm">
            No audio listening sentences for this chapter.
          </div>
        ) : (
          exercises.map((ex, idx) => {
            const isRevealed = showAllText || revealedIds.has(ex.id);
            return (
              <div
                key={ex.id || idx}
                className="p-5 glass-panel rounded-2xl border-white/5 hover:border-emerald-500/30 transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {ex.number || idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Sentence #{ex.number || idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReveal(ex.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                    </button>

                    <AudioButton text={ex.japanese || ex.romaji} size="md" />
                  </div>
                </div>

                {/* Sentence Script & English Meaning (Hidden until revealed) */}
                <div 
                  className={`p-4 rounded-xl border transition-all ${
                    !isRevealed 
                      ? 'bg-slate-900/40 border-white/5 cursor-pointer hover:border-emerald-500/20' 
                      : 'bg-slate-900/80 border-emerald-500/20 shadow-md'
                  }`}
                  onClick={() => !isRevealed && toggleReveal(ex.id)}
                >
                  {!isRevealed ? (
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-400 select-none">
                      <div className="flex items-center gap-2 text-xs">
                        <EyeOff size={14} className="text-slate-500 shrink-0" />
                        <span>Script & English meaning hidden. Listen to audio, then click <strong>Reveal</strong>.</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors shrink-0">
                        Tap to Reveal 👁️
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2.5 animate-fadeIn">
                      {/* Japanese Script */}
                      <div className="text-base md:text-lg font-bold text-white font-jp leading-relaxed">
                        {ex.japanese || ex.romaji}
                      </div>

                      {/* Romaji */}
                      {ex.romaji && (
                        <div className="text-xs text-emerald-300 font-sans">
                          {ex.romaji}
                        </div>
                      )}

                      {/* English Meaning - Only shown when Reveal is clicked, NOT read aloud */}
                      {ex.english && (
                        <div className="text-sm font-medium text-amber-200 mt-2.5 pt-2.5 border-t border-white/10 flex items-start gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
                            Meaning
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

