import React from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Headphones, 
  MessageSquare, 
  Sparkles, 
  FileText, 
  Grid, 
  ArrowRight, 
  CheckCircle2, 
  Trophy, 
  Flame, 
  Play,
  Volume2,
  GraduationCap
} from 'lucide-react';
import n5Data from '../data/n5Data';
import { storageService } from '../services/storageService';

export default function Dashboard({ setActiveTab, onStartPractice }) {
  const masteredList = storageService.getMasteredVocab();
  const quizHistory = storageService.getQuizHistory();
  const streak = storageService.getStreak();

  const totalVocab = n5Data.allVocab.length;
  const totalKanji = n5Data.kanji110.length;
  const totalGrammar = n5Data.grammar.reduce((acc, g) => acc + g.points.length, 0);

  const bestScore = quizHistory.length > 0 
    ? Math.max(...quizHistory.map(q => Math.round((q.score / q.total) * 100))) 
    : 0;

  return (
    <div className="space-y-10 animate-fadeIn pb-12">
      {/* Minimalist Japanese Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-10 bg-[#17171b] border border-white/5">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#c53d33]/10 border border-[#c53d33]/30 text-[#e57a6f] text-xs font-mincho font-medium">
            <span>〔 日本語能力試験 N5 完全対策 〕</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            JLPT N5 Preparation System
          </h1>

          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
            A quiet, focused study environment directly compiled from your course materials: 
            <strong className="text-white font-medium"> 24 Lessons</strong> of vocabulary with Tokyo studio audio, 
            core grammar patterns, <strong className="text-stone-200 font-medium">Chōkai listening exercises</strong>, 
            everyday dialogues, and official exam simulation drills.
          </p>

          {/* Quick Action CTA (Restrained & Minimal) */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onStartPractice({ category: 'vocab', chapter: 'all', mode: 'jp_to_en', count: 20 })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white font-medium text-xs shadow-sm transition-all"
            >
              <Play size={13} className="fill-white" />
              <span>全語彙練習 (Full Vocab Quiz)</span>
            </button>

            <button
              onClick={() => onStartPractice({ category: 'kanji', chapter: 'all' })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#222227] hover:bg-[#2a2a32] text-stone-200 border border-white/5 font-medium text-xs transition-all"
            >
              <span className="font-mincho text-stone-300">漢</span>
              <span>漢字練習 (110 Kanji)</span>
            </button>

            <button
              onClick={() => onStartPractice({ category: 'kana', script: 'hiragana' })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#222227] hover:bg-[#2a2a32] text-stone-200 border border-white/5 font-medium text-xs transition-all"
            >
              <span className="font-mincho text-stone-300">仮</span>
              <span>五十音 (Kana Drill)</span>
            </button>

            <button
              onClick={() => setActiveTab('vocab-quiz')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1c1c20] hover:bg-[#242429] text-stone-300 border border-white/5 font-medium text-xs transition-all"
            >
              <HelpCircle size={14} className="text-[#e57a6f]" />
              <span>問題集 (Quiz Hub)</span>
            </button>
          </div>
        </div>

        {/* Minimalist Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/5">
          <div className="p-3.5 rounded-xl bg-[#131316] border border-white/5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white">{totalVocab}+</span>
              <span className="text-[10px] text-stone-400 font-mincho">語</span>
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">語彙 (Vocabulary)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#131316] border border-white/5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white">{totalGrammar}+</span>
              <span className="text-[10px] text-stone-400 font-mincho">項目</span>
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">文法 (Grammar)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#131316] border border-white/5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white">{totalKanji}</span>
              <span className="text-[10px] text-stone-400 font-mincho">字</span>
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">漢字 (N5 Kanji)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#131316] border border-white/5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-[#e57a6f]">{bestScore}%</span>
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">最高正答率 (Best Score)</div>
          </div>
        </div>
      </div>

      {/* Main Feature Cards (学習項目一覧) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mincho text-[#e57a6f]">〔 学習分野 〕</span>
            <h2 className="text-lg font-bold text-white">Study Modules</h2>
          </div>
          <span className="text-xs text-stone-400 font-jp">全9モジュール</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Vocab Practice */}
          <div 
            onClick={() => onStartPractice({ category: 'vocab', chapter: 'all' })}
            className="p-5 rounded-2xl bg-[#17171b] border border-white/5 hover:border-white/15 cursor-pointer group transition-all relative overflow-hidden"
          >
            <div className="absolute right-3 top-3 text-4xl font-mincho text-white/[0.04] pointer-events-none select-none">
              語
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#222227] text-[#e57a6f] flex items-center justify-center font-bold">
                <HelpCircle size={18} />
              </div>
              <span className="text-[10px] font-mincho px-2 py-0.5 rounded border border-[#c53d33]/30 text-[#e57a6f] bg-[#c53d33]/5">
                第1課〜第24課
              </span>
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-[#e57a6f] transition-colors">
              Vocab Practice Quiz (MCQs)
            </h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              Test yourself chapter-wise or across all 24 chapters. 4 multiple-choice options with instant feedback, scoring, and review.
            </p>
            <div className="mt-4 flex items-center text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] gap-1.5 transition-colors">
              <span>Start Vocab Quiz</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Kanji Practice Quiz */}
          <div 
            onClick={() => onStartPractice({ category: 'kanji', chapter: 'all' })}
            className="p-5 rounded-2xl bg-[#17171b] border border-white/5 hover:border-white/15 cursor-pointer group transition-all relative overflow-hidden"
          >
            <div className="absolute right-3 top-3 text-4xl font-mincho text-white/[0.04] pointer-events-none select-none">
              漢
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#222227] text-stone-200 flex items-center justify-center font-mincho text-base font-bold">
                漢
              </div>
              <span className="text-[10px] font-mincho px-2 py-0.5 rounded border border-white/10 text-stone-300 bg-white/5">
                全110字
              </span>
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-[#e57a6f] transition-colors">
              Kanji Practice Quiz (MCQs)
            </h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              Practice all 110 official N5 Kanji by chapter or full set. Test meanings, On'yomi, Kun'yomi, and audio recognition.
            </p>
            <div className="mt-4 flex items-center text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] gap-1.5 transition-colors">
              <span>Start Kanji Quiz</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Kana Practice Drill */}
          <div 
            onClick={() => onStartPractice({ category: 'kana', script: 'hiragana' })}
            className="p-5 rounded-2xl bg-[#17171b] border border-white/5 hover:border-white/15 cursor-pointer group transition-all relative overflow-hidden"
          >
            <div className="absolute right-3 top-3 text-4xl font-mincho text-white/[0.04] pointer-events-none select-none">
              仮
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#222227] text-stone-200 flex items-center justify-center font-bold">
                <Grid size={18} />
              </div>
              <span className="text-[10px] font-mincho px-2 py-0.5 rounded border border-white/10 text-stone-300 bg-white/5">
                平仮名・片仮名
              </span>
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-[#e57a6f] transition-colors">
              Kana Practice Drill
            </h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              Master 104 Japanese syllables: basic 46, dakuten, and yōon combinations with audio listening drills and romanization practice.
            </p>
            <div className="mt-4 flex items-center text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] gap-1.5 transition-colors">
              <span>Start Kana Drill</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Vocab Learn */}
          <div 
            onClick={() => setActiveTab('vocab-learn')}
            className="p-5 rounded-2xl bg-[#17171b] border border-white/5 hover:border-white/15 cursor-pointer group transition-all relative overflow-hidden"
          >
            <div className="absolute right-3 top-3 text-4xl font-mincho text-white/[0.04] pointer-events-none select-none">
              単
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#222227] text-stone-200 flex items-center justify-center font-bold">
                <BookOpen size={18} />
              </div>
              <span className="text-[10px] font-mincho px-2 py-0.5 rounded border border-white/10 text-stone-300 bg-white/5">
                単語帳
              </span>
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-[#e57a6f] transition-colors">
              Vocabulary Studio & Flashcards
            </h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              Minimalist 3D flashcards with Japanese audio, Romaji toggle, English definitions, and continuous autoplay listening mode.
            </p>
            <div className="mt-4 flex items-center text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] gap-1.5 transition-colors">
              <span>Explore Words</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Listening Lab */}
          <div 
            onClick={() => setActiveTab('listening')}
            className="p-5 rounded-2xl bg-[#17171b] border border-white/5 hover:border-white/15 cursor-pointer group transition-all relative overflow-hidden"
          >
            <div className="absolute right-3 top-3 text-4xl font-mincho text-white/[0.04] pointer-events-none select-none">
              聴
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#222227] text-stone-200 flex items-center justify-center font-bold">
                <Headphones size={18} />
              </div>
              <span className="text-[10px] font-mincho px-2 py-0.5 rounded border border-[#c53d33]/30 text-[#e57a6f] bg-[#c53d33]/5">
                聴解試験
              </span>
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-[#e57a6f] transition-colors">
              Listening Comprehension Lab
            </h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              Home practice sentences with Japanese native voice. Ear-training mode with hidden script and comprehension checks.
            </p>
            <div className="mt-4 flex items-center text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] gap-1.5 transition-colors">
              <span>Listen Now</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: Conversations */}
          <div 
            onClick={() => setActiveTab('conversations')}
            className="p-5 rounded-2xl bg-[#17171b] border border-white/5 hover:border-white/15 cursor-pointer group transition-all relative overflow-hidden"
          >
            <div className="absolute right-3 top-3 text-4xl font-mincho text-white/[0.04] pointer-events-none select-none">
              話
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#222227] text-stone-200 flex items-center justify-center font-bold">
                <MessageSquare size={18} />
              </div>
              <span className="text-[10px] font-mincho px-2 py-0.5 rounded border border-white/10 text-stone-300 bg-white/5">
                対話全21話
              </span>
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-[#e57a6f] transition-colors">
              Conversations & Roleplays
            </h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              Real Japanese situational dialogues with speaker avatars. Play line-by-line or practice speaking with roleplay mode.
            </p>
            <div className="mt-4 flex items-center text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] gap-1.5 transition-colors">
              <span>Practice Dialogues</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 7: Kanji 110 Explorer */}
          <div 
            onClick={() => setActiveTab('kanji')}
            className="p-5 rounded-2xl bg-[#17171b] border border-white/5 hover:border-white/15 cursor-pointer group transition-all relative overflow-hidden"
          >
            <div className="absolute right-3 top-3 text-4xl font-mincho text-white/[0.04] pointer-events-none select-none">
              字
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#222227] text-stone-200 flex items-center justify-center font-mincho text-base font-bold">
                字
              </div>
              <span className="text-[10px] font-mincho px-2 py-0.5 rounded border border-white/10 text-stone-300 bg-white/5">
                漢字辞典
              </span>
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-[#e57a6f] transition-colors">
              Kanji 110 Reference
            </h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              Master all 110 JLPT N5 Kanji with stroke count, On'yomi, Kun'yomi readings, meanings, and real vocabulary compounds.
            </p>
            <div className="mt-4 flex items-center text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] gap-1.5 transition-colors">
              <span>Explore Kanji</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 8: Kana Soundboard */}
          <div 
            onClick={() => setActiveTab('kana')}
            className="p-5 rounded-2xl bg-[#17171b] border border-white/5 hover:border-white/15 cursor-pointer group transition-all relative overflow-hidden"
          >
            <div className="absolute right-3 top-3 text-4xl font-mincho text-white/[0.04] pointer-events-none select-none">
              音
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#222227] text-stone-200 flex items-center justify-center font-mincho text-base font-bold">
                あ
              </div>
              <span className="text-[10px] font-mincho px-2 py-0.5 rounded border border-white/10 text-stone-300 bg-white/5">
                五十音図
              </span>
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-[#e57a6f] transition-colors">
              Kana Audio Soundboard
            </h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              Interactive 50-sound chart for Hiragana & Katakana. Click any character to hear immediate Tokyo studio pronunciation.
            </p>
            <div className="mt-4 flex items-center text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] gap-1.5 transition-colors">
              <span>Open Soundboard</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 9: Full Mock Exam */}
          <div 
            onClick={() => setActiveTab('exam')}
            className="p-5 rounded-2xl bg-[#17171b] border border-white/5 hover:border-white/15 cursor-pointer group transition-all relative overflow-hidden"
          >
            <div className="absolute right-3 top-3 text-4xl font-mincho text-white/[0.04] pointer-events-none select-none">
              試
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#222227] text-[#e57a6f] flex items-center justify-center font-bold">
                <Trophy size={18} />
              </div>
              <span className="text-[10px] font-mincho px-2 py-0.5 rounded border border-[#c53d33]/30 text-[#e57a6f] bg-[#c53d33]/5">
                本試験形式
              </span>
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-[#e57a6f] transition-colors">
              Full JLPT N5 Mock Exam
            </h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              Simulate actual examination conditions with timed questions from textbook drills, passing score evaluation, and explanations.
            </p>
            <div className="mt-4 flex items-center text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] gap-1.5 transition-colors">
              <span>Take Test</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
