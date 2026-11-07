import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  Check, 
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import n5Data from '../data/n5Data';
import AudioButton from '../components/AudioButton';

export default function GrammarView() {
  const [selectedChapter, setSelectedChapter] = useState(1);

  const currentGrammar = n5Data.grammar.find(g => g.chapter === selectedChapter) || n5Data.grammar[0];
  const points = currentGrammar?.points || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="p-6 glass-panel rounded-2xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
          <FileText size={13} />
          <span>GRAMMAR MASTER (文法)</span>
        </div>
        <h1 className="text-2xl font-black text-white">
          Chapter {currentGrammar?.chapter}: {currentGrammar?.title}
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          {currentGrammar?.description}
        </p>
      </div>

      {/* Chapter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {Array.from({ length: 24 }, (_, i) => i + 1).map(ch => (
          <button
            key={ch}
            onClick={() => setSelectedChapter(ch)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedChapter === ch
                ? 'bg-indigo-500 border-indigo-400 text-white shadow-sm'
                : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Ch {ch}
          </button>
        ))}
      </div>

      {/* Grammar Points Cards */}
      <div className="space-y-4">
        {points.map((point, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl glass-panel border-white/10 space-y-4 hover:border-indigo-500/30 transition-all"
          >
            {/* Title & Badge */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <h3 className="text-lg font-bold text-white font-jp">{point.title}</h3>
              </div>
            </div>

            {/* Formula Box */}
            {point.formula && (
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2.5">
                <Lightbulb size={16} className="text-indigo-400 shrink-0" />
                <div className="font-mono text-xs md:text-sm text-indigo-200 font-semibold font-jp">
                  {point.formula}
                </div>
              </div>
            )}

            {/* Explanation */}
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {point.explanation}
            </p>

            {/* Example Sentences */}
            {point.examples && point.examples.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Example Sentences:</div>
                <div className="space-y-2">
                  {point.examples.map((ex, exIdx) => (
                    <div 
                      key={exIdx} 
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-start justify-between gap-3 group"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white font-jp text-sm md:text-base leading-snug">
                          {ex.jp}
                        </div>
                        {ex.ro && (
                          <div className="text-xs text-indigo-300 font-sans">
                            {ex.ro}
                          </div>
                        )}
                        <div className="text-xs text-slate-400">
                          {ex.en}
                        </div>
                      </div>

                      <AudioButton text={ex.jp} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

