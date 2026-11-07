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
        <div className="p-6 md:p-10 glass-panel-glow border-cyan-500/25 rounded-3xl space-y-8 bg-slate-900/90 shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
              <Gauge size={14} />
              <span>OFFICIAL JLPT N5 ADAPTIVE SIMULATOR</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              JLPT N5 Final Examination Drill
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Every attempt dynamically draws a randomized set of <strong className="text-cyan-300">Hard & Very Hard questions</strong> from our 130+ official textbook exam pool. Shuffled questions and options ensure zero repetitive patterns.
            </p>
          </div>

          {/* Difficulty Preset Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Flame size={14} className="text-rose-400" />
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
                    ? 'bg-rose-500/20 border-rose-500 shadow-xl shadow-rose-500/15 ring-1 ring-rose-500'
                    : 'bg-slate-800/60 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="absolute top-3 right-3 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white">
                  Most Challenging
                </div>
                <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm mb-1">
                  <Zap size={16} />
                  <span>Very Hard (最難関)</span>
                </div>
                <div className="text-xs text-white font-bold">30 Questions • 25 Mins</div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
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
                    ? 'bg-cyan-500/20 border-cyan-500 shadow-xl shadow-cyan-500/15 ring-1 ring-cyan-500'
                    : 'bg-slate-800/60 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-sm mb-1">
                  <Flame size={16} />
                  <span>Hard (難関)</span>
                </div>
                <div className="text-xs text-white font-bold">25 Questions • 25 Mins</div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
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
                    ? 'bg-purple-500/20 border-purple-500 shadow-xl shadow-purple-500/15 ring-1 ring-purple-500'
                    : 'bg-slate-800/60 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 text-purple-400 font-extrabold text-sm mb-1">
                  <Sparkles size={16} />
                  <span>★ Star Reordering Focus</span>
                </div>
                <div className="text-xs text-white font-bold">15 Questions • 15 Mins</div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Dedicated drill for JLPT's hardest format: rearrange 4 segments into Japanese syntax and find the star word.
                </p>
              </div>
            </div>
          </div>

          {/* Exam Specifications Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-800/60 border border-white/5 text-center">
            <div>
              <div className="text-xs text-slate-400">Question Pool</div>
              <div className="text-lg font-black text-cyan-400 mt-0.5">{masterPool.length} Questions</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Random Draw</div>
              <div className="text-lg font-black text-white mt-0.5">{examQuestionCount} Qs</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Time Limit</div>
              <div className="text-lg font-black text-amber-400 mt-0.5">{timeLimitMinutes} Mins</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Passing Mark</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">60% (Official)</div>
            </div>
          </div>

          {/* Randomization Guarantees Banner */}
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center gap-3 text-xs text-cyan-200">
            <Shuffle size={20} className="shrink-0 text-cyan-400" />
            <div>
              <span className="font-bold">100% Dynamic Randomization:</span> Every time you start or restart this exam, questions are sampled unpredictably, and all 4 multiple-choice options are shuffled. You will never see the exact same test sequence twice.
            </div>
          </div>

          {/* Start CTA */}
          <button
            onClick={() => startExam()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-600 hover:to-blue-700 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play size={18} className="fill-white" />
            <span>Generate & Start Final Test</span>
          </button>
        </div>
      )}

      {/* ================= 2. ACTIVE EXAM SCREEN ================= */}
      {examState === 'active' && currentQ && (
        <div className="space-y-6">
          {/* Top Bar: Progress, Timer & Actions */}
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-cyan-500/20">
            {/* Left: Progress info */}
            <div className="flex items-center gap-3 text-xs">
              <span className="font-black text-white text-sm">
                Q {currentIndex + 1} <span className="text-slate-500 font-normal">/ {examQuestions.length}</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-300 font-semibold truncate max-w-[150px] sm:max-w-none">
                {currentQ.category}
              </span>
            </div>

            {/* Center: Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
              secondsLeft < 300 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse' 
                : 'bg-slate-800/80 border-white/10 text-cyan-300'
            }`}>
              <Clock size={14} className={secondsLeft < 300 ? 'text-rose-400' : 'text-cyan-400'} />
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
                    : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-400'
                }`}
                title="Flag for review"
              >
                <Flag size={14} className={flaggedQuestions.has(currentIndex) ? 'fill-amber-400 text-amber-400' : ''} />
                <span className="hidden sm:inline">Flag</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Submit Exam
              </button>
            </div>
          </div>

          {/* Interactive Question Jump Palette (1 to 25/30) */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold">Question Palette:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Answered ({answeredCount})</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                  <span>Unanswered ({unansweredCount})</span>
                </span>
                {flaggedQuestions.size > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span>Flagged ({flaggedQuestions.size})</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {examQuestions.map((_, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = userAnswers[idx] !== undefined;
                const isFlagged = flaggedQuestions.has(idx);

                let btnStyle = 'bg-slate-800 text-slate-400 border-white/5';
                if (isAnswered) {
                  btnStyle = 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300 font-bold';
                }
                if (isFlagged) {
                  btnStyle = 'bg-amber-500/25 border-amber-500 text-amber-300 font-black';
                }
                if (isCurrent) {
                  btnStyle = 'ring-2 ring-cyan-400 bg-cyan-500/30 text-white font-black shadow-lg shadow-cyan-500/20';
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
          <div className="glass-panel-glow border-cyan-500/30 p-6 md:p-8 rounded-3xl bg-slate-900/90 space-y-5 shadow-2xl">
            {/* Category / Badge */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                {currentQ.category}
              </span>

              {currentQ.audioText && (
                <AudioButton text={currentQ.audioText} size="sm" label="Pronounce Sentence" />
              )}
            </div>

            {/* Question Text */}
            <div className="py-2">
              <div className="text-xl sm:text-2xl font-black text-white font-jp leading-relaxed whitespace-pre-line">
                {currentQ.question}
              </div>
            </div>
          </div>

          {/* Options (4 Multiple Choice Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = userAnswers[currentIndex] === optIdx;

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`p-4 md:p-5 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400'
                      : 'bg-slate-800/70 hover:bg-slate-800 border-white/10 text-slate-200 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold transition-colors ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-white/5 text-slate-400 group-hover:text-white'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="text-base sm:text-lg font-bold font-jp">
                      {option}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-black">
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
              className={`px-5 py-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                currentIndex === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-900 border-white/5 text-slate-500'
                  : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-300 cursor-pointer'
              }`}
            >
              <ArrowLeft size={16} />
              <span>Previous Question</span>
            </button>

            {currentIndex + 1 < examQuestions.length ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Check size={16} />
                <span>Submit Final Exam</span>
              </button>
            )}
          </div>

          {/* Submit Confirmation Modal */}
          {showSubmitConfirm && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
              <div className="max-w-md w-full p-6 md:p-8 rounded-3xl glass-panel-glow border-cyan-500/30 bg-slate-900 space-y-6 text-center shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                  <AlertTriangle size={28} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Submit Examination?</h3>
                  <p className="text-xs text-slate-300">
                    You have answered <strong className="text-emerald-400">{answeredCount}</strong> of <strong className="text-white">{examQuestions.length}</strong> questions.
                  </p>
                  {unansweredCount > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                      ⚠️ You have {unansweredCount} unanswered questions remaining!
                    </div>
                  )}
                  {flaggedQuestions.size > 0 && (
                    <div className="text-xs text-amber-300">
                      🚩 {flaggedQuestions.size} questions are flagged for review.
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirm(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-white/5 cursor-pointer"
                  >
                    Continue Exam
                  </button>
                  <button
                    type="button"
                    onClick={submitExam}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 cursor-pointer"
                  >
                    Confirm & Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 3. RESULTS & EXPLANATION SCREEN ================= */}
      {examState === 'results' && (
        <div className="glass-panel-glow border-cyan-500/30 p-6 md:p-10 rounded-3xl space-y-8 bg-slate-900/95 shadow-2xl animate-fadeIn">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl ${
              isPassed 
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-emerald-500/30' 
                : 'bg-gradient-to-tr from-rose-500 to-amber-500 shadow-rose-500/30'
            }`}>
              <Trophy size={40} />
            </div>

            <div className="space-y-1">
              <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full border ${
                isPassed
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-500 text-rose-300'
              }`}>
                {isPassed ? 'JLPT N5 PASSED (合格)' : 'NOT PASSED (不合格)'}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white pt-2">
                Exam Evaluation Report
              </h1>
              <p className="text-xs text-slate-400">
                Official N5 Passing Threshold: 60% • Selected Challenge: {selectedDifficulty.toUpperCase()}
              </p>
            </div>
          </div>

          {/* High-Level Score Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className={`text-3xl font-black ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {scorePct}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Accuracy</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="text-3xl font-black text-cyan-400">
                {correctCount} / {examQuestions.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Total Score</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="text-3xl font-black text-amber-400">
                {formatTimer(timeLimitMinutes * 60 - secondsLeft)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Time Used</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="text-3xl font-black text-purple-400">
                {examQuestions.length - correctCount}
              </div>
              <div className="text-xs text-slate-400 mt-1">Mistakes</div>
            </div>
          </div>

          {/* Section-by-Section Performance Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <BarChart2 size={15} className="text-cyan-400" />
              <span>Section Breakdown:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {Object.entries(categoryStats).map(([cat, stat]) => {
                const pct = Math.round((stat.correct / stat.total) * 100);
                return (
                  <div key={cat} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-300">{cat}</span>
                      <span className={pct >= 60 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {stat.correct}/{stat.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pct >= 60 ? 'bg-emerald-500' : 'bg-rose-500'}`}
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
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-600 hover:to-blue-700 text-white font-extrabold text-xs shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shuffle size={16} />
              <span>Generate Fresh Random Exam</span>
            </button>

            <button
              type="button"
              onClick={() => setExamState('intro')}
              className="px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/5 cursor-pointer"
            >
              Change Difficulty / Settings
            </button>
          </div>

          {/* Comprehensive Solution Review */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Detailed Question Review & Explanations</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {examQuestions.length} Questions
                </span>
              </h3>

              {/* Review Filter */}
              <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    reviewFilter === 'all' ? 'bg-cyan-500 text-white' : 'text-slate-400'
                  }`}
                >
                  All ({examQuestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('mistakes')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    reviewFilter === 'mistakes' ? 'bg-rose-500 text-white' : 'text-slate-400'
                  }`}
                >
                  Mistakes ({examQuestions.length - correctCount})
                </button>
                {flaggedQuestions.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setReviewFilter('flagged')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      reviewFilter === 'flagged' ? 'bg-amber-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    Flagged ({flaggedQuestions.size})
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

                  return (
                    <div
                      key={q.examId}
                      className={`p-5 rounded-2xl border space-y-3 ${
                        isCorrect
                          ? 'bg-slate-800/40 border-white/5'
                          : 'bg-rose-500/10 border-rose-500/30'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            Q{q.questionNumber}
                          </span>
                          <span className="font-semibold text-slate-300">{q.category}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {q.audioText && (
                            <AudioButton text={q.audioText} size="sm" />
                          )}
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            isCorrect
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {isCorrect ? 'Correct ✓' : isAnswered ? 'Incorrect ✗' : 'Skipped'}
                          </span>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="text-base font-bold text-white font-jp whitespace-pre-line pl-1">
                        {q.question}
                      </div>

                      {/* Options Review */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {q.options.map((opt, oIdx) => {
                          const isOptionCorrect = oIdx === q.correctIndex;
                          const wasSelected = oIdx === selectedIdx;

                          let style = 'bg-slate-900/60 border-white/5 text-slate-400';
                          if (isOptionCorrect) {
                            style = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                          } else if (wasSelected && !isCorrect) {
                            style = 'bg-rose-500/20 border-rose-500 text-rose-200 line-through';
                          }

                          return (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-xl border flex items-center justify-between ${style}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold">
                                  {String.fromCharCode(65 + oIdx)}.
                                </span>
                                <span className="font-jp">{opt}</span>
                              </div>
                              {isOptionCorrect && (
                                <span className="text-[10px] font-black text-emerald-400">CORRECT ANSWER</span>
                              )}
                              {wasSelected && !isOptionCorrect && (
                                <span className="text-[10px] font-black text-rose-400">YOUR CHOICE</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 space-y-1">
                          <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                            <Sparkles size={13} />
                            <span>Grammar / Rule Analysis:</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-line text-slate-200">
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
