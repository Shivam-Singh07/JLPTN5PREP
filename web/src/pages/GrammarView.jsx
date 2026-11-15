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
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#17171b] border border-white/5 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#c53d33]/10 border border-[#c53d33]/30 text-[#e57a6f] text-xs font-mincho font-medium">
          <FileText size={13} />
          <span>〔 文法解説 〕 GRAMMAR HANDBOOK</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          第{currentGrammar?.chapter}課: {currentGrammar?.title}
        </h1>
        <p className="text-xs text-stone-300 leading-relaxed max-w-2xl font-jp">
          {currentGrammar?.description}
        </p>
      </div>

      {/* Chapter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {Array.from({ length: 24 }, (_, i) => i + 1).map(ch => (
          <button
            key={ch}
            onClick={() => setSelectedChapter(ch)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              selectedChapter === ch
                ? 'bg-[#c53d33] border-[#c53d33] text-white'
                : 'bg-[#17171b] border-white/5 text-stone-400 hover:text-white'
            }`}
          >
            <span className="font-mincho">第{ch}課</span>
          </button>
        ))}
      </div>

      {/* Grammar Points Cards */}
      <div className="space-y-4">
        {points.map((point, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-[#17171b] border border-white/5 space-y-4 hover:border-white/15 transition-all"
          >
            {/* Title & Badge */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#222227] text-stone-300 font-mincho font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <h3 className="text-lg font-bold text-white font-jp">{point.title}</h3>
              </div>
            </div>

            {/* Formula Box */}
            {point.formula && (
              <div className="p-3.5 rounded-xl bg-[#131316] border border-white/5 flex items-center gap-2.5">
                <Lightbulb size={15} className="text-[#e57a6f] shrink-0" />
                <div className="font-mono text-xs md:text-sm text-stone-200 font-semibold font-jp">
                  {point.formula}
                </div>
              </div>
            )}

            {/* Explanation */}
            <p className="text-xs md:text-sm text-stone-300 leading-relaxed font-jp">
              {point.explanation}
            </p>

            {/* Example Sentences */}
            {point.examples && point.examples.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="text-[11px] font-medium text-stone-400 font-jp">例文 (Example Sentences):</div>
                <div className="space-y-2">
                  {point.examples.map((ex, exIdx) => (
                    <div 
                      key={exIdx} 
                      className="p-3 rounded-xl bg-[#131316] border border-white/5 flex items-start justify-between gap-3 group"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white font-mincho text-sm md:text-base leading-snug">
                          {ex.jp}
                        </div>
                        {ex.ro && (
                          <div className="text-xs text-stone-400 font-sans">
                            {ex.ro}
                          </div>
                        )}
                        <div className="text-xs text-stone-400 font-jp">
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
