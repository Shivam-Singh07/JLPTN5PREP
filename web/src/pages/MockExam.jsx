import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gauge, 
  Clock, 
  Check, 
  X, 
  RotateCcw, 
  Trophy, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  HelpCircle,
  Flag,
  AlertTriangle,
  Play,
  Shuffle,
  Flame,
  Zap,
  BarChart2,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import n5Data from '../data/n5Data';
import audioService from '../services/audioService';
import AudioButton from '../components/AudioButton';
import { storageService } from '../services/storageService';

// Utility: Fisher-Yates array shuffle
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Generate unique randomized exam with randomized option order
function generateRandomExam(pool, count = 25, difficulty = 'very_hard') {
  if (!pool || pool.length === 0) return [];

  let candidates = [];
  if (difficulty === 'very_hard') {
    // 70% very_hard/star ordering, 30% tricky hard
    const veryHard = shuffleArray(pool.filter(q => q.difficulty === 'very_hard' || q.section === 'star_ordering'));
    const hard = shuffleArray(pool.filter(q => q.difficulty === 'hard' && q.section !== 'star_ordering'));
    candidates = [...veryHard, ...hard];
  } else if (difficulty === 'star_focus') {
    const stars = shuffleArray(pool.filter(q => q.section === 'star_ordering'));
    const others = shuffleArray(pool.filter(q => q.section !== 'star_ordering'));
    candidates = [...stars, ...others];
  } else {
    // Balanced hard mode
    candidates = shuffleArray(pool);
  }

  const selected = candidates.slice(0, Math.min(count, candidates.length));

  // Shuffle options inside every single question so options A, B, C, D are unpredictable
  return selected.map((q, idx) => {
    const correctText = q.options[q.correctIndex];
    const indexedOpts = q.options.map((opt, i) => ({
      text: opt,
      isCorrect: i === q.correctIndex
    }));
    const shuffledOpts = shuffleArray(indexedOpts);
    const newCorrectIndex = shuffledOpts.findIndex(o => o.isCorrect);

    return {
      ...q,
      examId: `q_${idx + 1}`,
      questionNumber: idx + 1,
      options: shuffledOpts.map(o => o.text),
      correctIndex: newCorrectIndex,
      correctAnswerText: correctText
    };
  });
}

export default function MockExam() {
  const masterPool = n5Data.drills || [];

  // Config State
  const [selectedDifficulty, setSelectedDifficulty] = useState('very_hard'); // 'hard' | 'very_hard' | 'star_focus'
  const [examQuestionCount, setExamQuestionCount] = useState(25);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(25);

  // Active Exam State
  const [examState, setExamState] = useState('intro'); // 'intro' | 'active' | 'results'
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qIdx]: selectedOptionIndex }
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set()); // Set of qIdx
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'mistakes' | 'flagged'

  // Start new randomized exam
  const startExam = (difficulty = selectedDifficulty, count = examQuestionCount, minutes = timeLimitMinutes) => {
    const randomized = generateRandomExam(masterPool, count, difficulty);
    setExamQuestions(randomized);
    setCurrentIndex(0);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setSecondsLeft(minutes * 60);
    setShowSubmitConfirm(false);
    setExamState('active');

    // Auto-scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Timer countdown
  useEffect(() => {
    let timer = null;
    if (examState === 'active' && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [examState, secondsLeft]);

  // Select an option
  const handleSelectOption = (optIdx) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentIndex]: optIdx
    }));
  };

  // Toggle flag for review
  const toggleFlag = (idx = currentIndex) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Submit exam
  const submitExam = () => {
    setShowSubmitConfirm(false);
    setExamState('results');

    // Calculate score
    const correctCount = examQuestions.filter((q, idx) => userAnswers[idx] === q.correctIndex).length;
    const scorePct = Math.round((correctCount / examQuestions.length) * 100);

    storageService.saveQuizScore({
      type: 'mock_exam',
      scope: selectedDifficulty,
      score: correctCount,
      total: examQuestions.length,
      mode: 'official_exam',
      date: new Date().toISOString()
    });

    if (scorePct >= 60) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentQ = examQuestions[currentIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = examQuestions.length - answeredCount;

  // Format mm:ss
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Score calculations for results screen
  const correctCount = useMemo(() => {
    if (examQuestions.length === 0) return 0;
    return examQuestions.filter((q, idx) => userAnswers[idx] === q.correctIndex).length;
  }, [examQuestions, userAnswers]);

  const scorePct = useMemo(() => {
    if (examQuestions.length === 0) return 0;
    return Math.round((correctCount / examQuestions.length) * 100);
  }, [examQuestions, correctCount]);

  const isPassed = scorePct >= 60;

  // Category breakdown
  const categoryStats = useMemo(() => {
    if (examQuestions.length === 0) return {};
    const stats = {};
    examQuestions.forEach((q, idx) => {
      const cat = q.category || 'General Grammar';
      if (!stats[cat]) stats[cat] = { total: 0, correct: 0 };
      stats[cat].total += 1;
      if (userAnswers[idx] === q.correctIndex) {
        stats[cat].correct += 1;
      }
    });
    return stats;
  }, [examQuestions, userAnswers]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* ================= 1. INTRO / CONFIGURATION SCREEN ================= */}
      {examState === 'intro' && (
        <div className="p-6 md:p-10 glass-panel rounded-3xl space-y-8 bg-[#17171b] border-white/5 shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-vermilion-500/10 border border-vermilion-500/30 text-vermilion-400 text-xs font-bold tracking-wider">
              <span>〔 模擬試験 〕</span>
              <span>OFFICIAL JLPT N5 SIMULATOR</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold font-mincho text-washi-50 tracking-tight">
              日本語能力試験 N5 総合模擬試験
            </h1>
            <p className="text-xs md:text-sm text-washi-400 max-w-xl mx-auto leading-relaxed">
              Every attempt dynamically draws a randomized set of <strong className="text-vermilion-400">Hard & Very Hard questions</strong> from our 130+ official textbook exam pool. Shuffled questions and options ensure zero repetitive patterns.
            </p>
          </div>

          {/* Difficulty Preset Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-washi-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-vermilion-500"></span>
              <span>Select Examination Challenge Level:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Very Hard / Master (Recommended) */}
              <div
                onClick={() => {
                  setSelectedDifficulty('very_hard');
                  setExamQuestionCount(30);
                  setTimeLimitMinutes(25);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all relative ${
                  selectedDifficulty === 'very_hard'
                    ? 'bg-vermilion-500/10 border-vermilion-500/80 shadow-md ring-1 ring-vermilion-500/40 text-washi-50'
                    : 'bg-[#121214] border-white/5 hover:border-white/20 text-washi-300'
                }`}
              >
                <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-vermilion-500 text-white">
                  推奨
                </div>
                <div className="flex items-center gap-2 text-vermilion-400 font-bold text-sm mb-1">
                  <span>〔 最難関 〕</span>
                  <span>Very Hard</span>
                </div>
                <div className="text-xs text-washi-100 font-medium">30 Questions • 25 Mins</div>
                <p className="text-[11px] text-washi-400 mt-2 leading-relaxed">
                  Star [★] sentence ordering, 授受動詞 (あげる/くれる/もらう), tricky particles (までに, しか), and special kanji readings.
                </p>
              </div>

              {/* Hard Mode */}
              <div
                onClick={() => {
                  setSelectedDifficulty('hard');
                  setExamQuestionCount(25);
                  setTimeLimitMinutes(25);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedDifficulty === 'hard'
                    ? 'bg-vermilion-500/10 border-vermilion-500/80 shadow-md ring-1 ring-vermilion-500/40 text-washi-50'
                    : 'bg-[#121214] border-white/5 hover:border-white/20 text-washi-300'
                }`}
              >
                <div className="flex items-center gap-2 text-washi-200 font-bold text-sm mb-1">
                  <span>〔 難関 〕</span>
                  <span>Hard</span>
                </div>
                <div className="text-xs text-washi-100 font-medium">25 Questions • 25 Mins</div>
                <p className="text-[11px] text-washi-400 mt-2 leading-relaxed">
                  Tricky particle distinctions, verb conjugation forms, vocabulary traps, and reading comprehension passages.
                </p>
              </div>

              {/* Star Ordering Focus */}
              <div
                onClick={() => {
                  setSelectedDifficulty('star_focus');
                  setExamQuestionCount(15);
                  setTimeLimitMinutes(15);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedDifficulty === 'star_focus'
                    ? 'bg-vermilion-500/10 border-vermilion-500/80 shadow-md ring-1 ring-vermilion-500/40 text-washi-50'
                    : 'bg-[#121214] border-white/5 hover:border-white/20 text-washi-300'
                }`}
              >
                <div className="flex items-center gap-2 text-washi-200 font-bold text-sm mb-1">
                  <span>〔 星並べ 〕</span>
                  <span>Star Reorder</span>
                </div>
                <div className="text-xs text-washi-100 font-medium">15 Questions • 15 Mins</div>
                <p className="text-[11px] text-washi-400 mt-2 leading-relaxed">
                  Dedicated drill for JLPT's hardest format: rearrange 4 segments into Japanese syntax and find the star word.
                </p>
              </div>
            </div>
          </div>

          {/* Exam Specifications Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#121214] border border-white/5 text-center">
            <div>
              <div className="text-[11px] text-washi-400">Question Pool</div>
              <div className="text-lg font-bold text-washi-100 mt-0.5">{masterPool.length} 題</div>
            </div>
            <div>
              <div className="text-[11px] text-washi-400">Random Draw</div>
              <div className="text-lg font-bold text-vermilion-400 mt-0.5">{examQuestionCount} 題</div>
            </div>
            <div>
              <div className="text-[11px] text-washi-400">Time Limit</div>
              <div className="text-lg font-bold text-washi-100 mt-0.5">{timeLimitMinutes} 分</div>
            </div>
            <div>
              <div className="text-[11px] text-washi-400">Passing Mark</div>
              <div className="text-lg font-bold text-matcha-400 mt-0.5">60% (基準)</div>
            </div>
          </div>

          {/* Randomization Guarantees Banner */}
          <div className="p-4 rounded-2xl bg-[#121214] border border-white/10 flex items-center gap-3 text-xs text-washi-300">
            <Shuffle size={18} className="shrink-0 text-vermilion-400" />
            <div>
              <span className="font-bold text-washi-100">100% Dynamic Randomization:</span> Every time you start or restart this exam, questions are sampled unpredictably, and all 4 multiple-choice options are shuffled. You will never see the exact same test sequence twice.
            </div>
          </div>

          {/* Start CTA */}
          <button
            onClick={() => startExam()}
            className="w-full py-4 rounded-2xl bg-vermilion-500 hover:bg-vermilion-600 text-white font-bold text-sm shadow-xl shadow-vermilion-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play size={16} className="fill-white" />
            <span>試験を開始する • Start Final Test</span>
          </button>
        </div>
      )}

      {/* ================= 2. ACTIVE EXAM SCREEN ================= */}
      {examState === 'active' && currentQ && (
        <div className="space-y-6">
          {/* Top Bar: Progress, Timer & Actions */}
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-white/5 bg-[#17171b]">
            {/* Left: Progress info */}
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-washi-50 text-sm">
                第 {currentIndex + 1} 問 <span className="text-washi-500 font-normal">/ {examQuestions.length}</span>
              </span>
              <span className="text-washi-600">•</span>
              <span className="hanko-badge text-[10px]">
                {currentQ.category}
              </span>
            </div>

            {/* Center: Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
              secondsLeft < 300 
                ? 'bg-vermilion-500/20 border-vermilion-500/40 text-vermilion-300 animate-pulse' 
                : 'bg-[#121214] border-white/10 text-washi-200'
            }`}>
              <Clock size={14} className={secondsLeft < 300 ? 'text-vermilion-400' : 'text-washi-400'} />
              <span>{formatTimer(secondsLeft)}</span>
            </div>

            {/* Right: Flag & Submit */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleFlag(currentIndex)}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  flaggedQuestions.has(currentIndex)
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-[#121214] hover:bg-white/5 border-white/10 text-washi-400'
                }`}
                title="Flag for review"
              >
                <Flag size={14} className={flaggedQuestions.has(currentIndex) ? 'fill-amber-400 text-amber-400' : ''} />
                <span className="hidden sm:inline">要見直し</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="px-3.5 py-2 rounded-xl bg-vermilion-500 hover:bg-vermilion-600 text-white font-bold text-xs shadow-md shadow-vermilion-500/20 cursor-pointer transition-colors"
              >
                提出する • Submit
              </button>
            </div>
          </div>

          {/* Interactive Question Jump Palette (1 to 25/30) */}
          <div className="p-3.5 rounded-2xl bg-[#17171b] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-washi-400">
              <span className="font-medium">設問一覧 (Palette):</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-matcha-500"></span>
                  <span>解答済 ({answeredCount})</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white/20"></span>
                  <span>未解答 ({unansweredCount})</span>
                </span>
                {flaggedQuestions.size > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>要見直し ({flaggedQuestions.size})</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {examQuestions.map((_, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = userAnswers[idx] !== undefined;
                const isFlagged = flaggedQuestions.has(idx);

                let btnStyle = 'bg-[#121214] text-washi-400 border-white/5 hover:border-white/20';
                if (isAnswered) {
                  btnStyle = 'bg-matcha-500/20 border-matcha-500/40 text-matcha-300 font-bold';
                }
                if (isFlagged) {
                  btnStyle = 'bg-amber-500/25 border-amber-500 text-amber-300 font-bold';
                }
                if (isCurrent) {
                  btnStyle = 'ring-2 ring-vermilion-400 bg-vermilion-500/30 text-white font-bold shadow-md shadow-vermilion-500/20';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs border flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Prompt Card */}
          <div className="glass-panel border-white/5 p-6 md:p-8 rounded-3xl bg-[#17171b] space-y-5 shadow-xl">
            {/* Category / Badge */}
            <div className="flex items-center justify-between">
              <span className="hanko-badge text-xs">
                〔 {currentQ.category} 〕
              </span>

              {currentQ.audioText && (
                <AudioButton text={currentQ.audioText} size="sm" label="発音を聞く" />
              )}
            </div>

            {/* Question Text */}
            <div className="py-2">
              <div className="text-xl sm:text-2xl font-semibold font-mincho text-washi-50 leading-relaxed whitespace-pre-line">
                {currentQ.question}
              </div>
            </div>
          </div>

          {/* Options (4 Multiple Choice Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = userAnswers[currentIndex] === optIdx;
              const katakanaLabels = ['ア', 'イ', 'ウ', 'エ'];

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`p-4 md:p-5 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-vermilion-500/10 border-vermilion-500 text-white shadow-md ring-1 ring-vermilion-500/40'
                      : 'bg-[#17171b] hover:bg-white/[0.03] border-white/5 text-washi-200 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-vermilion-500 text-white'
                        : 'bg-white/5 text-washi-400 group-hover:text-white'
                    }`}>
                      {katakanaLabels[optIdx] || optIdx + 1}
                    </span>
                    <span className="text-base sm:text-lg font-medium font-jp">
                      {option}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-vermilion-500 text-white flex items-center justify-center">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls: Previous / Next */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`px-5 py-3 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                currentIndex === 0
                  ? 'opacity-30 cursor-not-allowed bg-[#121214] border-white/5 text-washi-600'
                  : 'bg-[#17171b] hover:bg-white/5 border-white/10 text-washi-300 cursor-pointer'
              }`}
            >
              <ArrowLeft size={16} />
              <span>前の問題 • Prev</span>
            </button>

            {currentIndex + 1 < examQuestions.length ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="px-6 py-3 rounded-xl bg-vermilion-500 hover:bg-vermilion-600 text-white font-bold text-xs shadow-md shadow-vermilion-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>次の問題 • Next</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="px-6 py-3 rounded-xl bg-vermilion-500 hover:bg-vermilion-600 text-white font-bold text-xs shadow-md shadow-vermilion-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Check size={16} />
                <span>最終提出 • Submit</span>
              </button>
            )}
          </div>

          {/* Submit Confirmation Modal */}
          {showSubmitConfirm && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
              <div className="max-w-md w-full p-6 md:p-8 rounded-3xl glass-panel border-white/10 bg-[#17171b] space-y-6 text-center shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-vermilion-500/10 text-vermilion-400 border border-vermilion-500/20 flex items-center justify-center mx-auto">
                  <AlertTriangle size={24} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-mincho text-washi-50">試験を提出しますか？</h3>
                  <p className="text-xs text-washi-400">
                    You have answered <strong className="text-matcha-400">{answeredCount}</strong> of <strong className="text-washi-100">{examQuestions.length}</strong> questions.
                  </p>
                  {unansweredCount > 0 && (
                    <div className="p-3 rounded-xl bg-vermilion-500/10 border border-vermilion-500/20 text-vermilion-300 text-xs font-medium">
                      ⚠️ 未解答の設問が {unansweredCount} 問残っています。
                    </div>
                  )}
                  {flaggedQuestions.size > 0 && (
                    <div className="text-xs text-amber-300">
                      🚩 要見直しとしてマークされた設問: {flaggedQuestions.size} 問
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirm(false)}
                    className="flex-1 py-3 rounded-xl bg-[#121214] hover:bg-white/5 text-washi-300 font-medium text-xs border border-white/10 cursor-pointer"
                  >
                    試験を続ける • Continue
                  </button>
                  <button
                    type="button"
                    onClick={submitExam}
                    className="flex-1 py-3 rounded-xl bg-vermilion-500 hover:bg-vermilion-600 text-white font-bold text-xs shadow-md shadow-vermilion-500/20 cursor-pointer"
                  >
                    確定して提出 • Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 3. RESULTS & EXPLANATION SCREEN ================= */}
      {examState === 'results' && (
        <div className="glass-panel border-white/5 p-6 md:p-10 rounded-3xl space-y-8 bg-[#17171b] shadow-2xl animate-fadeIn">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white mx-auto border ${
              isPassed 
                ? 'bg-matcha-500/10 border-matcha-500/30 text-matcha-400' 
                : 'bg-vermilion-500/10 border-vermilion-500/30 text-vermilion-400'
            }`}>
              <Trophy size={36} />
            </div>

            <div className="space-y-1">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border tracking-wider ${
                isPassed
                  ? 'bg-matcha-500/15 border-matcha-500/30 text-matcha-300'
                  : 'bg-vermilion-500/15 border-vermilion-500/30 text-vermilion-300'
              }`}>
                {isPassed ? '〔 合格 〕 JLPT N5 PASSED' : '〔 不合格 〕 NOT PASSED'}
              </span>
              <h1 className="text-3xl md:text-4xl font-semibold font-mincho text-washi-50 pt-2">
                模擬試験 結果報告書
              </h1>
              <p className="text-xs text-washi-400">
                Official N5 Passing Threshold: 60% • Selected Challenge: {selectedDifficulty.toUpperCase()}
              </p>
            </div>
          </div>

          {/* High-Level Score Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-[#121214] border border-white/5">
              <div className={`text-3xl font-bold font-mincho ${isPassed ? 'text-matcha-400' : 'text-vermilion-400'}`}>
                {scorePct}%
              </div>
              <div className="text-xs text-washi-400 mt-1">正解率 (Accuracy)</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#121214] border border-white/5">
              <div className="text-3xl font-bold font-mincho text-washi-100">
                {correctCount} / {examQuestions.length}
              </div>
              <div className="text-xs text-washi-400 mt-1">得点 (Score)</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#121214] border border-white/5">
              <div className="text-3xl font-bold font-mincho text-washi-100">
                {formatTimer(timeLimitMinutes * 60 - secondsLeft)}
              </div>
              <div className="text-xs text-washi-400 mt-1">所要時間 (Time)</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#121214] border border-white/5">
              <div className="text-3xl font-bold font-mincho text-vermilion-400">
                {examQuestions.length - correctCount}
              </div>
              <div className="text-xs text-washi-400 mt-1">誤答数 (Mistakes)</div>
            </div>
          </div>

          {/* Section-by-Section Performance Breakdown */}
          <div className="p-5 rounded-2xl bg-[#121214] border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-washi-400 uppercase tracking-wider">
              <BarChart2 size={15} className="text-vermilion-400" />
              <span>分野別成績 (Section Breakdown):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {Object.entries(categoryStats).map(([cat, stat]) => {
                const pct = Math.round((stat.correct / stat.total) * 100);
                return (
                  <div key={cat} className="p-3 rounded-xl bg-[#17171b] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-washi-300">{cat}</span>
                      <span className={pct >= 60 ? 'text-matcha-400 font-bold' : 'text-vermilion-400 font-bold'}>
                        {stat.correct}/{stat.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#121214] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pct >= 60 ? 'bg-matcha-500' : 'bg-vermilion-500'}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons: Generate New Random Exam / Configure */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => startExam()}
              className="flex-1 py-4 rounded-2xl bg-vermilion-500 hover:bg-vermilion-600 text-white font-bold text-xs shadow-xl shadow-vermilion-500/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Shuffle size={16} />
              <span>もう一度挑戦する • Generate Fresh Exam</span>
            </button>

            <button
              type="button"
              onClick={() => setExamState('intro')}
              className="px-6 py-4 rounded-2xl bg-[#121214] hover:bg-white/5 text-washi-300 font-medium text-xs border border-white/10 cursor-pointer"
            >
              難易度を変更 • Change Settings
            </button>
          </div>

          {/* Comprehensive Solution Review */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-washi-100 flex items-center gap-2">
                <span>解答解説 (Question Review & Explanations)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-washi-400">
                  {examQuestions.length} 題
                </span>
              </h3>

              {/* Review Filter */}
              <div className="flex items-center bg-[#121214] p-0.5 rounded-lg text-xs border border-white/5">
                <button
                  type="button"
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    reviewFilter === 'all' ? 'bg-vermilion-500 text-white font-bold' : 'text-washi-400 hover:text-washi-200'
                  }`}
                >
                  すべて ({examQuestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('mistakes')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    reviewFilter === 'mistakes' ? 'bg-vermilion-500 text-white font-bold' : 'text-washi-400 hover:text-washi-200'
                  }`}
                >
                  間違えた問題 ({examQuestions.length - correctCount})
                </button>
                {flaggedQuestions.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setReviewFilter('flagged')}
                    className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      reviewFilter === 'flagged' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-washi-400 hover:text-washi-200'
                    }`}
                  >
                    要見直し ({flaggedQuestions.size})
                  </button>
                )}
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {examQuestions
                .map((q, idx) => ({ ...q, originalIndex: idx }))
                .filter(q => {
                  const isCorrect = userAnswers[q.originalIndex] === q.correctIndex;
                  if (reviewFilter === 'mistakes') return !isCorrect;
                  if (reviewFilter === 'flagged') return flaggedQuestions.has(q.originalIndex);
                  return true;
                })
                .map((q) => {
                  const selectedIdx = userAnswers[q.originalIndex];
                  const isCorrect = selectedIdx === q.correctIndex;
                  const isAnswered = selectedIdx !== undefined;
                  const katakanaLabels = ['ア', 'イ', 'ウ', 'エ'];

                  return (
                    <div
                      key={q.examId}
                      className={`p-5 rounded-2xl border space-y-3 ${
                        isCorrect
                          ? 'bg-[#17171b] border-white/5'
                          : 'bg-vermilion-500/[0.04] border-vermilion-500/20'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                            isCorrect ? 'bg-matcha-500/20 text-matcha-300' : 'bg-vermilion-500/20 text-vermilion-300'
                          }`}>
                            {q.questionNumber}
                          </span>
                          <span className="font-medium text-washi-300">{q.category}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {q.audioText && (
                            <AudioButton text={q.audioText} size="sm" />
                          )}
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            isCorrect
                              ? 'bg-matcha-500/20 text-matcha-300 border border-matcha-500/30'
                              : 'bg-vermilion-500/20 text-vermilion-300 border border-vermilion-500/30'
                          }`}>
                            {isCorrect ? '正解 ✓' : isAnswered ? '不正解 ✗' : '無解答'}
                          </span>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="text-base font-semibold font-mincho text-washi-100 whitespace-pre-line pl-1">
                        {q.question}
                      </div>

                      {/* Options Review */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {q.options.map((opt, oIdx) => {
                          const isOptionCorrect = oIdx === q.correctIndex;
                          const wasSelected = oIdx === selectedIdx;

                          let style = 'bg-[#121214] border-white/5 text-washi-400';
                          if (isOptionCorrect) {
                            style = 'bg-matcha-500/15 border-matcha-500/40 text-matcha-200 font-bold';
                          } else if (wasSelected && !isCorrect) {
                            style = 'bg-vermilion-500/15 border-vermilion-500/40 text-vermilion-200 line-through';
                          }

                          return (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-xl border flex items-center justify-between ${style}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-washi-400">
                                  {katakanaLabels[oIdx] || oIdx + 1}.
                                </span>
                                <span className="font-jp">{opt}</span>
                              </div>
                              {isOptionCorrect && (
                                <span className="text-[10px] font-bold text-matcha-400">正解 (CORRECT)</span>
                              )}
                              {wasSelected && !isOptionCorrect && (
                                <span className="text-[10px] font-bold text-vermilion-400">あなたの回答</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3.5 rounded-xl bg-[#121214] border border-white/5 text-xs text-washi-300 space-y-1">
                          <div className="font-bold text-washi-100 flex items-center gap-1.5">
                            <span className="text-vermilion-400 font-mincho">〔 解説 〕</span>
                            <span>Grammar / Rule Analysis:</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-line text-washi-300">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
