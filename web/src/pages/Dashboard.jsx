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
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 md:p-12 glass-panel-glow border border-rose-500/25 bg-gradient-to-br from-[#11192e] via-[#0f172a] to-[#1e1b4b]/80 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-rose-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wide shadow-sm">
            <span>🌸</span>
            <span>JLPT N5 ALL-IN-ONE PREPARATION SYSTEM</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.15]">
            Master Japanese JLPT N5 with Interactive Practice & Studio Audio
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
            Directly compiled from your preparation materials: <strong className="text-white">24 Lessons</strong> of vocabulary with authentic Tokyo pronunciation, grammar patterns, <strong className="text-emerald-300">Chōkai listening exercises</strong>, video roleplays, and <strong className="text-cyan-300">official exam drills</strong>.
          </p>

          {/* Quick Action CTA */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartPractice({ category: 'vocab', chapter: 'all', mode: 'jp_to_en', count: 20 })}
              className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs shadow-xl shadow-rose-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play size={16} className="fill-white" />
              <span>Practice Whole N5 Vocab</span>
            </button>

            <button
              onClick={() => onStartPractice({ category: 'kanji', chapter: 'all' })}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-xl shadow-purple-500/25 hover:scale-[1.02] transition-all"
            >
              <Sparkles size={16} />
              <span>Kanji Practice (10 Ch / Full)</span>
            </button>

            <button
              onClick={() => onStartPractice({ category: 'kana', script: 'hiragana' })}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-xl shadow-pink-500/25 hover:scale-[1.02] transition-all"
            >
              <Grid size={16} />
              <span>Kana Drill (Hira & Kata)</span>
            </button>

            <button
              onClick={() => setActiveTab('vocab-quiz')}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-white/10 font-bold text-xs hover:scale-[1.02] transition-all"
            >
              <HelpCircle size={16} className="text-rose-400" />
              <span>Quiz Hub</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-black text-rose-400">{totalVocab}+</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Vocabulary Words</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-black text-indigo-400">{totalGrammar}+</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Grammar Rules</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalKanji}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Essential Kanji</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-black text-amber-400">{bestScore}%</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Best Quiz Accuracy</div>
          </div>
        </div>
      </div>

      {/* Main Feature Cards */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
              📚
            </div>
            <h2 className="text-xl font-bold text-white">Study Modules</h2>
          </div>
          <span className="text-xs text-slate-400">Select any section to begin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Vocab Practice */}
          <div 
            onClick={() => onStartPractice({ category: 'vocab', chapter: 'all' })}
            className="p-6 glass-panel hover:bg-slate-800/90 cursor-pointer group border-rose-500/20 hover:border-rose-500/50 shadow-lg hover:shadow-rose-500/10 transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-pink-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold shadow-md">
                <HelpCircle size={24} />
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Chapter / Whole
              </span>
            </div>
            <h3 className="font-bold text-white text-lg group-hover:text-rose-400 transition-colors">
              Vocab Practice Quiz (MCQs)
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Test yourself chapter-wise (1-24) or whole curriculum. 4 multiple-choice options with instant feedback, scoring, and review.
            </p>
            <div className="mt-5 flex items-center text-xs font-bold text-rose-400 gap-1.5 group-hover:translate-x-1.5 transition-transform">
              <span>Start Vocab Quiz</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 2: Kanji Practice Quiz */}
          <div 
            onClick={() => onStartPractice({ category: 'kanji', chapter: 'all' })}
            className="p-6 glass-panel hover:bg-slate-800/90 cursor-pointer group border-purple-500/20 hover:border-purple-500/50 shadow-lg hover:shadow-purple-500/10 transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold font-jp text-2xl shadow-md">
                漢
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                10 Ch / Full 110
              </span>
            </div>
            <h3 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">
              Kanji Practice Quiz (MCQs)
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Practice all 110 official N5 Kanji by chapter (1-10) or full set. Test meanings, On'yomi, Kun'yomi, and audio recognition.
            </p>
            <div className="mt-5 flex items-center text-xs font-bold text-purple-400 gap-1.5 group-hover:translate-x-1.5 transition-transform">
              <span>Start Kanji Quiz</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 3: Kana Practice Drill */}
          <div 
            onClick={() => onStartPractice({ category: 'kana', script: 'hiragana' })}
            className="p-6 glass-panel hover:bg-slate-800/90 cursor-pointer group border-pink-500/20 hover:border-pink-500/50 shadow-lg hover:shadow-pink-500/10 transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-rose-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center font-bold shadow-md">
                <Grid size={24} />
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Hira & Kata
              </span>
            </div>
            <h3 className="font-bold text-white text-lg group-hover:text-pink-400 transition-colors">
              Kana Practice Drill
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Master 104 Japanese syllables: basic 46, dakuten, and yōon combinations with audio listening drills and romanization practice.
            </p>
            <div className="mt-5 flex items-center text-xs font-bold text-pink-400 gap-1.5 group-hover:translate-x-1.5 transition-transform">
              <span>Start Kana Drill</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 4: Vocab Learn */}
          <div 
            onClick={() => setActiveTab('vocab-learn')}
            className="p-6 glass-panel hover:bg-slate-800/90 cursor-pointer group border-indigo-500/20 hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-500/10 transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold shadow-md">
                <BookOpen size={24} />
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Audio Flashcards
              </span>
            </div>
            <h3 className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">
              Vocabulary Learning
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Interactive 3D flashcards with Japanese audio pronunciation, Romaji toggle, English definitions, and mastery tracking.
            </p>
            <div className="mt-5 flex items-center text-xs font-bold text-indigo-400 gap-1.5 group-hover:translate-x-1.5 transition-transform">
              <span>Explore Words</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 5: Listening Lab */}
          <div 
            onClick={() => setActiveTab('listening')}
            className="p-6 glass-panel hover:bg-slate-800/90 cursor-pointer group border-emerald-500/20 hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/10 transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shadow-md">
                <Headphones size={24} />
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                CHŌKAI 聴解
              </span>
            </div>
            <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">
              Listening Comprehension Lab
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Home practice sentences with Japanese native voice. Ear-training mode with hidden script and comprehension checks.
            </p>
            <div className="mt-5 flex items-center text-xs font-bold text-emerald-400 gap-1.5 group-hover:translate-x-1.5 transition-transform">
              <span>Listen Now</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 6: Conversations */}
          <div 
            onClick={() => setActiveTab('conversations')}
            className="p-6 glass-panel hover:bg-slate-800/90 cursor-pointer group border-amber-500/20 hover:border-amber-500/50 shadow-lg hover:shadow-amber-500/10 transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shadow-md">
                <MessageSquare size={24} />
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Video 1 - 21
              </span>
            </div>
            <h3 className="font-bold text-white text-lg group-hover:text-amber-400 transition-colors">
              Conversations & Roleplays
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Real Japanese situational dialogues with speaker avatars. Play line-by-line or practice speaking with roleplay mode.
            </p>
            <div className="mt-5 flex items-center text-xs font-bold text-amber-400 gap-1.5 group-hover:translate-x-1.5 transition-transform">
              <span>Practice Dialogues</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 7: Kanji 110 Explorer */}
          <div 
            onClick={() => setActiveTab('kanji')}
            className="p-6 glass-panel hover:bg-slate-800/90 cursor-pointer group border-purple-500/20 hover:border-purple-500/50 shadow-lg hover:shadow-purple-500/10 transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold font-jp text-xl shadow-md">
                字
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                110 Kanji Reference
              </span>
            </div>
            <h3 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">
              Kanji 110 Explorer
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Master all 110 JLPT N5 Kanji with stroke count, On'yomi, Kun'yomi readings, meanings, and real vocabulary compounds.
            </p>
            <div className="mt-5 flex items-center text-xs font-bold text-purple-400 gap-1.5 group-hover:translate-x-1.5 transition-transform">
              <span>Explore Kanji</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 8: Kana Soundboard */}
          <div 
            onClick={() => setActiveTab('kana')}
            className="p-6 glass-panel hover:bg-slate-800/90 cursor-pointer group border-pink-500/20 hover:border-pink-500/50 shadow-lg hover:shadow-pink-500/10 transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center font-bold font-jp text-xl shadow-md">
                あ
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Soundboard
              </span>
            </div>
            <h3 className="font-bold text-white text-lg group-hover:text-pink-400 transition-colors">
              Kana Audio Soundboard
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Interactive 50-sound chart for Hiragana & Katakana. Click any character to hear immediate Tokyo studio pronunciation.
            </p>
            <div className="mt-5 flex items-center text-xs font-bold text-pink-400 gap-1.5 group-hover:translate-x-1.5 transition-transform">
              <span>Open Soundboard</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 9: Full Mock Exam */}
          <div 
            onClick={() => setActiveTab('exam')}
            className="p-6 glass-panel hover:bg-slate-800/90 cursor-pointer group border-cyan-500/20 hover:border-cyan-500/50 shadow-lg hover:shadow-cyan-500/10 transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold shadow-md">
                <Trophy size={24} />
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Official Drills
              </span>
            </div>
            <h3 className="font-bold text-white text-lg group-hover:text-cyan-400 transition-colors">
              Full JLPT N5 Mock Exam
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Simulate actual examination conditions with timed questions from the textbook drills, passing score evaluation, and explanations.
            </p>
            <div className="mt-5 flex items-center text-xs font-bold text-cyan-400 gap-1.5 group-hover:translate-x-1.5 transition-transform">
              <span>Take Test</span>
              <ArrowRight size={15} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
