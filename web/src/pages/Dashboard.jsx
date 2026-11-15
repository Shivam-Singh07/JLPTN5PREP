import React, { useState } from 'react';
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
  GraduationCap,
  Clock,
  Shuffle,
  Compass,
  Award,
  Bookmark
} from 'lucide-react';
import n5Data from '../data/n5Data';
import { storageService } from '../services/storageService';
import audioService from '../services/audioService';

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

  // Soundboard interactive preview state
  const [activeKana, setActiveKana] = useState(null);

  const handlePlayKana = (e, char) => {
    e.stopPropagation();
    setActiveKana(char);
    audioService.speak(char);
    setTimeout(() => setActiveKana(null), 800);
  };

  // Mini Tangocho flashcard preview state
  const [miniFlipped, setMiniFlipped] = useState(false);

  return (
    <div className="space-y-10 animate-fadeIn pb-14">
      {/* ================= 1. MODERN JAPANESE HERO BANNER ================= */}
      <div className="bento-box p-6 sm:p-8 md:p-10 border-white/10 relative overflow-hidden">
        {/* Subtle decorative calligraphy watermark */}
        <div className="absolute right-6 -bottom-8 text-[140px] font-mincho text-white/[0.02] pointer-events-none select-none font-bold">
          五
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Left Column: Platform Overview & Fast Launcher */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="hanko-badge text-xs">
                〔 日本語能力試験 N5 完全対策 〕
              </span>
              <span className="text-[11px] text-stone-400 font-mincho tracking-wider">
                TOKYO TEXTBOOK CURRICULUM
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-mincho text-white tracking-tight leading-tight">
                JLPT N5 Preparation System
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 font-jp mt-1">
                静寂な学習空間 • 24課全単語・文法・聴解・会話・模擬試験
              </p>
            </div>

            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              A serene, focused study environment directly compiled from your course materials: 
              <strong className="text-white font-medium"> 24 Lessons</strong> of vocabulary with Tokyo studio audio, 
              essential sentence patterns, <strong className="text-stone-200 font-medium">Chōkai listening exercises</strong>, 
              practical situational dialogues, and official exam simulation drills.
            </p>

            {/* Fast Action Launcher */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onStartPractice({ category: 'vocab', chapter: 'all', mode: 'jp_to_en', count: 20 })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white font-medium text-xs shadow-md shadow-[#c53d33]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Play size={13} className="fill-white" />
                <span>全語彙練習 (Vocab Quiz)</span>
              </button>

              <button
                onClick={() => onStartPractice({ category: 'kanji', chapter: 'all' })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1d1d22] hover:bg-[#25252b] text-stone-200 border border-white/10 font-medium text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="font-mincho text-stone-300 font-bold">漢</span>
                <span>漢字練習 (110 Kanji)</span>
              </button>

              <button
                onClick={() => onStartPractice({ category: 'kana', script: 'hiragana' })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1d1d22] hover:bg-[#25252b] text-stone-200 border border-white/10 font-medium text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="font-mincho text-stone-300 font-bold">仮</span>
                <span>五十音 (Kana Drill)</span>
              </button>

              <button
                onClick={() => setActiveTab('exam')}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1d1d22] hover:bg-[#25252b] text-stone-200 border border-white/10 font-medium text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Trophy size={13} className="text-[#e57a6f]" />
                <span>模擬試験 (Mock Exam)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Japanese Study Shrine & Streak Stamp */}
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-200 font-mincho">
                <Flame size={15} className="text-[#c53d33]" />
                <span>日課達成状況 (Daily Study Status)</span>
              </div>
              <span className="hanko-badge text-[10px]">
                {streak.count > 0 ? '〔 精進 〕' : '〔 始動 〕'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#18181d] border border-white/5 space-y-0.5">
                <span className="text-[10px] text-stone-400 font-mincho">連続学習</span>
                <div className="text-lg font-bold text-white flex items-baseline gap-1">
                  <span>{streak.count}</span>
                  <span className="text-[11px] text-stone-400 font-normal">日連続</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#18181d] border border-white/5 space-y-0.5">
                <span className="text-[10px] text-stone-400 font-mincho">習得語彙</span>
                <div className="text-lg font-bold text-white flex items-baseline gap-1">
                  <span>{masteredList.length}</span>
                  <span className="text-[11px] text-stone-400 font-normal">語 習得</span>
                </div>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-stone-400">
              <span className="font-mincho">合格ライン評価:</span>
              <span className={bestScore >= 60 ? 'text-[#86efac] font-bold' : 'text-stone-300 font-medium'}>
                {bestScore >= 60 ? '合格水準達成 ✓' : '演習継続中'}
              </span>
            </div>
          </div>
        </div>

        {/* Refined Japanese Washi Stat Seal Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/5">
          <div className="stat-seal-block">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold font-mincho text-white">{totalVocab}+</span>
              <span className="text-[11px] text-[#e57a6f] font-mincho font-bold">語</span>
            </div>
            <div className="text-[11px] text-stone-300 mt-1 font-medium">全語彙 (Vocabulary)</div>
            <div className="text-[10px] text-stone-400 mt-0.5">全24課 東京音声付</div>
          </div>

          <div className="stat-seal-block">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold font-mincho text-white">{totalGrammar}+</span>
              <span className="text-[11px] text-[#e57a6f] font-mincho font-bold">項目</span>
            </div>
            <div className="text-[11px] text-stone-300 mt-1 font-medium">重要文法 (Grammar)</div>
            <div className="text-[10px] text-stone-400 mt-0.5">接続規則・例文網羅</div>
          </div>

          <div className="stat-seal-block">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold font-mincho text-white">{totalKanji}</span>
              <span className="text-[11px] text-[#e57a6f] font-mincho font-bold">字</span>
            </div>
            <div className="text-[11px] text-stone-300 mt-1 font-medium">常用漢字 (N5 Kanji)</div>
            <div className="text-[10px] text-stone-400 mt-0.5">音訓・画数・熟語</div>
          </div>

          <div className="stat-seal-block">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold font-mincho text-white">{bestScore}%</span>
              <span className="text-[11px] text-stone-400 font-mincho font-normal">正解</span>
            </div>
            <div className="text-[11px] text-stone-300 mt-1 font-medium">最高正答率 (Best Score)</div>
            <div className="text-[10px] text-stone-400 mt-0.5">公式合格ライン 60%</div>
          </div>
        </div>
      </div>

      {/* ================= 2. STUDY MODULES (CREATIVE BENTO GRID) ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="hanko-badge text-xs">〔 学習分野 〕</span>
            <h2 className="text-lg font-bold font-mincho text-white tracking-wide">
              Study Modules & Simulation Drills
            </h2>
          </div>
          <span className="text-xs text-stone-400 font-mincho">全9モジュール構成</span>
        </div>

        {/* Asymmetrical Creative Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">

          {/* ---------------- CARD 1: FULL JLPT N5 MOCK EXAM (FEATURED HERO BENTO - 2 COLS) ---------------- */}
          <div 
            onClick={() => setActiveTab('exam')}
            className="lg:col-span-2 bento-box p-6 md:p-7 cursor-pointer group flex flex-col justify-between"
          >
            <div className="kamon-watermark">試</div>

            <div className="space-y-4">
              {/* Exam Admission Slip Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="hanko-badge text-[11px]">
                    〔 受験票 • OFFICIAL MOCK DRILL 〕
                  </span>
                  <span className="text-xs font-mono text-stone-400">JLPT N5 SIMULATOR</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-stone-300 font-mono text-[11px]">
                    25 Mins
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#c53d33]/15 border border-[#c53d33]/30 text-[#e57a6f] font-mono text-[11px] font-bold">
                    Passing: 60%
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-xl md:text-2xl font-bold font-mincho text-white group-hover:text-[#e57a6f] transition-colors flex items-center gap-2">
                  <span>日本語能力試験 N5 総合模擬試験</span>
                  <Trophy size={18} className="text-[#e57a6f]" />
                </h3>
                <p className="text-xs md:text-sm text-stone-300 mt-2 leading-relaxed max-w-xl">
                  Simulate actual testing conditions with dynamic randomized draws from our 130+ official textbook exam pool. Shuffled questions and options ensure zero repetitive patterns.
                </p>
              </div>

              {/* Challenge Mode Preview Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="mini-pill">
                  <Flame size={12} className="text-[#e57a6f]" />
                  <span>最難関 (Very Hard • 30問)</span>
                </span>
                <span className="mini-pill">
                  <Sparkles size={12} className="text-amber-400" />
                  <span>★ 星並べ (Star Order • 15問)</span>
                </span>
                <span className="mini-pill">
                  <CheckCircle2 size={12} className="text-[#86efac]" />
                  <span>難関 (Hard • 25問)</span>
                </span>
                <span className="mini-pill">
                  <Shuffle size={12} className="text-sky-400" />
                  <span>100% 動的シャッフル</span>
                </span>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-stone-400 font-mincho">
                出題分野: 文字・語彙・文法・読解・聴解
              </span>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c53d33] text-white text-xs font-bold group-hover:bg-[#b12f26] transition-colors shadow-sm">
                <span>試験を開始する • Start Exam</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* ---------------- CARD 2: VOCABULARY STUDIO & TANGOCHO (単語帳) ---------------- */}
          <div 
            onClick={() => setActiveTab('vocab-learn')}
            className="bento-box p-6 cursor-pointer group flex flex-col justify-between"
          >
            <div className="kamon-watermark">単</div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="hanko-badge text-[10px]">〔 単語帳 〕</span>
                <span className="text-[11px] text-stone-400 font-mincho">第1課〜第24課</span>
              </div>

              <div>
                <h3 className="font-bold font-mincho text-white text-base group-hover:text-[#e57a6f] transition-colors flex items-center gap-2">
                  <BookOpen size={16} className="text-stone-300" />
                  <span>Vocabulary Studio</span>
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Minimalist 3D flashcards with Tokyo audio, Romaji toggle, and autoplay loop.
                </p>
              </div>

              {/* Mini Interactive Tangocho Ring Card Preview */}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setMiniFlipped(!miniFlipped);
                }}
                className="p-3.5 rounded-xl bg-[#141418] border border-white/10 relative group/card hover:border-[#c53d33]/40 transition-all text-center space-y-1.5 cursor-pointer"
                title="Click to flip preview"
              >
                {/* Ring Hole */}
                <div className="w-2.5 h-2.5 rounded-full bg-[#121214] border border-white/20 mx-auto -mt-1 shadow-inner"></div>

                {!miniFlipped ? (
                  <div>
                    <div className="text-base font-bold font-mincho text-white">食べる</div>
                    <div className="text-[10px] text-stone-400 font-jp">たべる • taberu</div>
                    <div className="text-[10px] text-[#e57a6f] pt-0.5">〔 タップして意味を見る 〕</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs text-stone-400 font-mincho">Verb (Group 2)</div>
                    <div className="text-sm font-bold text-[#86efac]">to eat</div>
                    <div className="text-[10px] text-stone-400 pt-0.5">朝ごはんを食べます</div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] transition-colors">
              <span>単語帳を開く • Flip Words</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* ---------------- CARD 3: KANJI 110 DICTIONARY (漢字辞典) ---------------- */}
          <div 
            onClick={() => setActiveTab('kanji')}
            className="bento-box p-6 cursor-pointer group flex flex-col justify-between"
          >
            <div className="kamon-watermark">字</div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="hanko-badge text-[10px]">〔 漢字辞典 〕</span>
                <span className="text-[11px] text-stone-400 font-mincho">全110字収録</span>
              </div>

              <div>
                <h3 className="font-bold font-mincho text-white text-base group-hover:text-[#e57a6f] transition-colors flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-white/5 text-[#e57a6f] flex items-center justify-center font-mincho font-bold text-xs">漢</span>
                  <span>Kanji 110 Reference</span>
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Master stroke counts, On'yomi, Kun'yomi, and textbook vocabulary compounds.
                </p>
              </div>

              {/* Showcase Grid of 5 Sample Kanji */}
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {[
                  { k: '日', r: 'ひ / ニチ' },
                  { k: '本', r: 'もと / ホン' },
                  { k: '語', r: 'かたる / ゴ' },
                  { k: '水', r: 'みず / スイ' },
                  { k: '金', r: 'かね / キン' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-1.5 rounded-lg bg-[#141418] border border-white/5 hover:border-[#c53d33]/50 transition-colors"
                  >
                    <div className="text-base font-bold font-mincho text-white">{item.k}</div>
                    <div className="text-[8px] text-stone-400 font-mono truncate">{item.r}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] transition-colors">
              <span>漢字を調べる • Explore Kanji</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* ---------------- CARD 4: KANA AUDIO SOUNDBOARD (五十音図 音声盤) ---------------- */}
          <div 
            onClick={() => setActiveTab('kana')}
            className="bento-box p-6 cursor-pointer group flex flex-col justify-between"
          >
            <div className="kamon-watermark">音</div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="hanko-badge text-[10px]">〔 五十音図 〕</span>
                <span className="text-[11px] text-stone-400 font-mincho">平仮名・片仮名</span>
              </div>

              <div>
                <h3 className="font-bold font-mincho text-white text-base group-hover:text-[#e57a6f] transition-colors flex items-center gap-2">
                  <Grid size={16} className="text-stone-300" />
                  <span>Kana Audio Soundboard</span>
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Interactive 50-sound chart with instant Tokyo studio pronunciation.
                </p>
              </div>

              {/* Interactive 5-Vowel Audio Bar */}
              <div className="p-2.5 rounded-xl bg-[#141418] border border-white/10 space-y-1.5">
                <div className="text-[10px] text-stone-400 font-mincho text-center">
                  Click vowels to test Tokyo native speech:
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {['あ', 'い', 'う', 'え', 'お'].map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={(e) => handlePlayKana(e, char)}
                      className={`py-1.5 rounded-lg text-xs font-bold font-mincho border transition-all cursor-pointer ${
                        activeKana === char
                          ? 'bg-[#c53d33] border-[#c53d33] text-white scale-105'
                          : 'bg-[#1a1a1f] hover:bg-[#23232a] border-white/5 text-stone-200'
                      }`}
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] transition-colors">
              <span>全104音を聞く • Open Soundboard</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* ---------------- CARD 5: LISTENING COMPREHENSION LAB (聴解試験室) ---------------- */}
          <div 
            onClick={() => setActiveTab('listening')}
            className="bento-box p-6 cursor-pointer group flex flex-col justify-between"
          >
            <div className="kamon-watermark">聴</div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="hanko-badge text-[10px]">〔 聴解試験 〕</span>
                <span className="text-[11px] text-stone-400 font-mincho">ネイティブ音声</span>
              </div>

              <div>
                <h3 className="font-bold font-mincho text-white text-base group-hover:text-[#e57a6f] transition-colors flex items-center gap-2">
                  <Headphones size={16} className="text-stone-300" />
                  <span>Listening Comprehension Lab</span>
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Ear-training drills with hidden script mode and instant English reveal.
                </p>
              </div>

              {/* Soundwave Bars Visualizer Preview */}
              <div className="p-3 rounded-xl bg-[#141418] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 px-2 py-1 rounded bg-[#c53d33]/15">
                    <span className="wave-bar h-2 bg-[#c53d33]"></span>
                    <span className="wave-bar h-3.5 bg-[#c53d33]"></span>
                    <span className="wave-bar h-2 bg-[#c53d33]"></span>
                  </div>
                  <span className="text-[11px] text-stone-300 font-mincho">Tokyo Audio Master</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-stone-400 border border-white/5">
                  Blind Mode
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] transition-colors">
              <span>音声を聴く • Start Listening</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* ---------------- CARD 6: CONVERSATIONS & SITUATIONAL ROLEPLAY (場面会話) ---------------- */}
          <div 
            onClick={() => setActiveTab('conversations')}
            className="bento-box p-6 cursor-pointer group flex flex-col justify-between"
          >
            <div className="kamon-watermark">話</div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="hanko-badge text-[10px]">〔 場面会話 〕</span>
                <span className="text-[11px] text-stone-400 font-mincho">全21対話収録</span>
              </div>

              <div>
                <h3 className="font-bold font-mincho text-white text-base group-hover:text-[#e57a6f] transition-colors flex items-center gap-2">
                  <MessageSquare size={16} className="text-stone-300" />
                  <span>Situational Dialogues</span>
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Real Japanese daily encounters with line-by-line roleplay practice.
                </p>
              </div>

              {/* Dialogue Snippet Preview */}
              <div className="p-3 rounded-xl bg-[#141418] border border-white/10 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c53d33]/15 text-[#e57a6f] font-bold">A</span>
                  <span className="text-stone-200 font-jp text-[11px]">すみません、駅はどこですか？</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-stone-300 font-bold">B</span>
                  <span className="text-stone-300 font-jp text-[11px]">あそこですよ。</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] transition-colors">
              <span>会話を練習する • Practice Dialogues</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* ---------------- CARD 7: GRAMMAR PATTERNS HANDBOOK (文法ハンドブック) ---------------- */}
          <div 
            onClick={() => setActiveTab('grammar')}
            className="bento-box p-6 cursor-pointer group flex flex-col justify-between"
          >
            <div className="kamon-watermark">文</div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="hanko-badge text-[10px]">〔 文法 〕</span>
                <span className="text-[11px] text-stone-400 font-mincho">全24課 公式集</span>
              </div>

              <div>
                <h3 className="font-bold font-mincho text-white text-base group-hover:text-[#e57a6f] transition-colors flex items-center gap-2">
                  <FileText size={16} className="text-stone-300" />
                  <span>Grammar Handbook</span>
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Sentence formulas, particle rules, and verb conjugation tables.
                </p>
              </div>

              {/* Japanese Formula Box Preview */}
              <div className="p-3 rounded-xl bg-[#141418] border border-white/10 space-y-1">
                <div className="text-[11px] font-bold font-mincho text-stone-200">
                  ［ 名詞 ］ は ［ 名詞 ］ です
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {['は', 'が', 'を', 'に', 'で', 'へ', 'と'].map(p => (
                    <span key={p} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-stone-300 font-mincho">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] transition-colors">
              <span>文法一覧を見る • View Patterns</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* ---------------- CARD 8: VOCAB PRACTICE QUIZ (語彙問題演習 MCQs) ---------------- */}
          <div 
            onClick={() => onStartPractice({ category: 'vocab', chapter: 'all' })}
            className="bento-box p-6 cursor-pointer group flex flex-col justify-between"
          >
            <div className="kamon-watermark">語</div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="hanko-badge text-[10px]">〔 語彙問題 〕</span>
                <span className="text-[11px] text-stone-400 font-mincho">四者択一演習</span>
              </div>

              <div>
                <h3 className="font-bold font-mincho text-white text-base group-hover:text-[#e57a6f] transition-colors flex items-center gap-2">
                  <HelpCircle size={16} className="text-[#e57a6f]" />
                  <span>Vocab Practice Quiz</span>
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Chapter-wise or random 4-option questions with immediate feedback.
                </p>
              </div>

              {/* Mini MCQ Choice Pills Preview */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="p-1.5 rounded-lg bg-[#141418] border border-white/5 text-stone-300 flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-400 font-mincho">ア</span>
                  <span>食べる</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#141418] border border-white/5 text-stone-300 flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-400 font-mincho">イ</span>
                  <span>飲む</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#141418] border border-white/5 text-stone-300 flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-400 font-mincho">ウ</span>
                  <span>行く</span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#141418] border border-white/5 text-stone-300 flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-400 font-mincho">エ</span>
                  <span>見る</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] transition-colors">
              <span>問題を解く • Start Vocab Quiz</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* ---------------- CARD 9: KANA PRACTICE DRILL (仮名演習) ---------------- */}
          <div 
            onClick={() => onStartPractice({ category: 'kana', script: 'hiragana' })}
            className="bento-box p-6 cursor-pointer group flex flex-col justify-between"
          >
            <div className="kamon-watermark">仮</div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="hanko-badge text-[10px]">〔 仮名演習 〕</span>
                <span className="text-[11px] text-stone-400 font-mincho">即時判別</span>
              </div>

              <div>
                <h3 className="font-bold font-mincho text-white text-base group-hover:text-[#e57a6f] transition-colors flex items-center gap-2">
                  <GraduationCap size={16} className="text-stone-300" />
                  <span>Kana Practice Drill</span>
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Fast-paced flash drills pairing Hiragana, Katakana, and Romanization.
                </p>
              </div>

              {/* Script Pairing Preview */}
              <div className="p-2.5 rounded-xl bg-[#141418] border border-white/10 flex items-center justify-around text-xs">
                <div className="text-center">
                  <span className="text-base font-bold font-mincho text-white">あ</span>
                  <div className="text-[9px] text-stone-400">平仮名</div>
                </div>
                <span className="text-stone-500">⇄</span>
                <div className="text-center">
                  <span className="text-base font-bold font-mincho text-[#e57a6f]">ア</span>
                  <div className="text-[9px] text-stone-400">片仮名</div>
                </div>
                <span className="text-stone-500">⇄</span>
                <div className="text-center">
                  <span className="text-xs font-mono font-bold text-stone-200">"a"</span>
                  <div className="text-[9px] text-stone-400">ローマ字</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-stone-300 group-hover:text-[#e57a6f] transition-colors">
              <span>仮名を練習する • Start Kana Drill</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}