import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  RotateCcw, 
  Play, 
  ArrowRight, 
  Volume2, 
  Trophy, 
  Sliders, 
  HelpCircle,
  Clock,
  Filter,
  BookOpen,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import confetti from 'canvas-confetti';
import n5Data from '../data/n5Data';
import { generateKanjiQuiz } from '../services/quizEngine';
import audioService from '../services/audioService';
import { storageService } from '../services/storageService';
import AudioButton from '../components/AudioButton';

export default function KanjiQuiz({ initialChapter = 'all', onBackToExplorer = null }) {
  const kanjiChapters = n5Data.kanjiChapters || [];

  // Multi-chapter selection state (array of chapter IDs: 1..10)
  const [selectedChapters, setSelectedChapters] = useState(() => {
    if (initialChapter === 'all' || !initialChapter) {
      return kanjiChapters.map(c => c.id);
    }
    const num = parseInt(initialChapter, 10);
    return isNaN(num) ? kanjiChapters.map(c => c.id) : [num];
  });

  const [selectedMode, setSelectedMode] = useState('kanji_to_meaning');
  const [questionCount, setQuestionCount] = useState(10);

  // Active quiz state
  const [quizState, setQuizState] = useState('setup'); // 'setup' | 'active' | 'result'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reviewFilter, setReviewFilter] = useState('all');

  useEffect(() => {
    if (initialChapter === 'all') {
      setSelectedChapters(kanjiChapters.map(c => c.id));
    } else if (initialChapter) {
      const num = parseInt(initialChapter, 10);
      if (!isNaN(num)) setSelectedChapters([num]);
    }
  }, [initialChapter, kanjiChapters]);

  // Toggle chapter in multi-selection
  const toggleChapter = (chId) => {
    setSelectedChapters(prev => {
      if (prev.includes(chId)) {
        return prev.filter(id => id !== chId);
      } else {
        return [...prev, chId].sort((a, b) => a - b);
      }
    });
  };

  const selectAll = () => {
    setSelectedChapters(kanjiChapters.map(c => c.id));
  };

  const selectBasics = () => {
    setSelectedChapters([1, 2, 3, 4]);
  };

  const selectActions = () => {
    setSelectedChapters([5, 6, 7]);
  };

  const clearSelection = () => {
    setSelectedChapters([]);
  };

  // Total kanji available in selected chapters
  const totalAvailableKanji = useMemo(() => {
    let count = 0;
    selectedChapters.forEach(id => {
      const ch = kanjiChapters.find(c => c.id === id);
      if (ch) count += (ch.kanjiList?.length || ch.count || 0);
    });
    return count;
  }, [selectedChapters, kanjiChapters]);

  // Summary label
  const scopeSummaryText = useMemo(() => {
    if (selectedChapters.length === kanjiChapters.length) {
      return 'All 110 N5 Kanji (10 Chapters)';
    }
    if (selectedChapters.length === 1) {
      return `Chapter ${selectedChapters[0]}`;
    }
    if (selectedChapters.length === 0) {
      return 'No Chapters Selected';
    }
    return `${selectedChapters.length} Chapters (Ch ${selectedChapters.join(', ')})`;
  }, [selectedChapters, kanjiChapters]);

  // Start the quiz
  const startQuiz = (mode = selectedMode, count = questionCount) => {
    let pool = [];
    selectedChapters.forEach(chNum => {
      const chObj = kanjiChapters.find(c => c.id === chNum);
      if (chObj && chObj.kanjiList) {
        pool = pool.concat(chObj.kanjiList.map(k => ({
          ...k,
          chapterOrigin: `Ch ${chNum}`
        })));
      }
    });

    if (!pool || pool.length === 0) {
      alert("Please select at least 1 Kanji chapter.");
      return;
    }

    const maxCount = count === 'all' ? pool.length : Math.min(Number(count), pool.length);
    const generated = generateKanjiQuiz(pool, n5Data.kanji110, maxCount, mode);

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setQuizState('active');

    // Auto-play audio if in audio mode
    if (mode === 'audio' && generated[0]) {
      setTimeout(() => {
        audioService.speak(generated[0].audioText);
      }, 300);
    }
  };

  // Timer
  useEffect(() => {
    let timer = null;
    if (quizState === 'active') {
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quizState]);

  // Handle answering an option
  const handleSelectOption = (option) => {
    if (isAnswered) return;

    const currentQ = questions[currentIndex];
    const isCorrect = option === currentQ.correctAnswer;

    setSelectedOption(option);
    setIsAnswered(true);

    audioService.playFeedback(isCorrect);
    // Also pronounce the kanji
    audioService.speak(currentQ.audioText);

    const answerRecord = {
      question: currentQ,
      selected: option,
      isCorrect
    };

    setUserAnswers(prev => [...prev, answerRecord]);
  };

  // Next question or finish
  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      const nextQ = questions[currentIndex + 1];
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);

      if (selectedMode === 'audio' && nextQ) {
        setTimeout(() => {
          audioService.speak(nextQ.audioText);
        }, 200);
      }
    } else {
      finishQuiz();
    }
  };

  // Finish quiz
  const finishQuiz = () => {
    setQuizState('result');

    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const scorePct = Math.round((correctCount / questions.length) * 100);

    // Save record to storage
    storageService.saveQuizResult({
      type: 'kanji',
      score: correctCount,
      total: questions.length,
      percentage: scorePct,
      scope: scopeSummaryText,
      mode: selectedMode,
      date: new Date().toISOString()
    });

    if (scorePct >= 80) {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  // Restart identical quiz
  const restartQuiz = () => {
    startQuiz(selectedMode, questionCount);
  };

  // Retry only mistaken questions
  const retryMistakes = () => {
    const missedPool = userAnswers.filter(a => !a.isCorrect).map(a => a.question.item);
    if (missedPool.length === 0) return;

    const generated = generateKanjiQuiz(missedPool, n5Data.kanji110, missedPool.length, selectedMode);
    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setQuizState('active');
  };

  const currentQ = questions[currentIndex];
  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const mistakes = userAnswers.filter(a => !a.isCorrect);
  const isReady = totalAvailableKanji > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Kanji Practice Drill</h2>
            <p className="text-xs text-slate-400">Master N5 Kanji reading, meaning, and multi-chapter drills</p>
          </div>
        </div>

        {onBackToExplorer && (
          <button
            onClick={onBackToExplorer}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-colors"
          >
            ← Back to Kanji 110 Explorer
          </button>
        )}
      </div>

      {/* SETUP SCREEN */}
      {quizState === 'setup' && (
        <div className="glass-panel-glow border-purple-500/25 p-6 md:p-8 rounded-3xl space-y-8 bg-slate-900/90 shadow-2xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
              <Sliders size={13} />
              <span>CONFIGURE MULTI-CHAPTER KANJI DRILL</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Choose Chapters or Full Curriculum</h1>
            <p className="text-xs text-slate-400">
              Select one or more chapters to practice together, or test yourself on the full 110 N5 Kanji.
            </p>
          </div>

          {/* Scope Selector */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Filter size={14} className="text-purple-400" />
                <span>Select Practice Chapters:</span>
              </label>

              {/* Status pill */}
              <span className={`text-xs px-3 py-1 rounded-full font-bold border transition-all ${
                isReady 
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}>
                {isReady 
                  ? `🎯 ${selectedChapters.length} Chapters (${totalAvailableKanji} Kanji Available)` 
                  : '⚠️ Select at least 1 chapter'}
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  selectedChapters.length === kanjiChapters.length
                    ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-white/10 hover:border-white/20'
                }`}
              >
                🌸 All 10 Chapters (110 Kanji)
              </button>

              <button
                type="button"
                onClick={selectBasics}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 text-slate-300 border border-white/10 hover:border-white/20"
              >
                🔢 Ch 1–4: Numbers & Calendar
              </button>

              <button
                type="button"
                onClick={selectActions}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 text-slate-300 border border-white/10 hover:border-white/20"
              >
                🏃 Ch 5–7: Actions & Life
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/40 text-slate-400 border border-white/5 hover:text-purple-300 ml-auto"
              >
                Clear Selection
              </button>
            </div>

            {/* Chapter-Wise Multi-Select Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin bg-slate-950/40 p-2 rounded-2xl border border-white/5">
              {kanjiChapters.map((ch) => {
                const isSelected = selectedChapters.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChapter(ch.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-500 shadow-sm'
                        : 'bg-slate-800/40 border-white/5 hover:border-white/20 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        {isSelected ? (
                          <CheckSquare size={16} className="text-purple-400" />
                        ) : (
                          <Square size={16} className="text-slate-600" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-extrabold text-white">
                          Chapter {ch.id}: {ch.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {ch.description}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-purple-300 shrink-0">
                      {ch.count} Kanji
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" />
              <span>Practice Mode:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'kanji_to_meaning', label: 'Kanji → Meaning', desc: 'See Kanji, pick English definition' },
                { id: 'meaning_to_kanji', label: 'Meaning → Kanji', desc: 'See meaning, pick Kanji symbol' },
                { id: 'reading', label: 'Kanji → Reading', desc: 'Test On\'yomi & Kun\'yomi readings' },
                { id: 'audio', label: 'Listening Drill', desc: 'Hear pronunciation, identify Kanji' }
              ].map((m) => {
                const isSelected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMode(m.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-500 text-white shadow-sm'
                        : 'bg-slate-800/50 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-snug">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} className="text-purple-400" />
              <span>Question Count:</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 20].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    questionCount === cnt
                      ? 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/20'
                      : 'bg-slate-800/70 border-white/5 text-slate-300 hover:border-white/20'
                  }`}
                >
                  {cnt} Questions
                </button>
              ))}
              {totalAvailableKanji > 0 && (
                <button
                  type="button"
                  onClick={() => setQuestionCount('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    questionCount === 'all'
                      ? 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/20'
                      : 'bg-slate-800/70 border-white/5 text-slate-300 hover:border-white/20'
                  }`}
                >
                  All ({totalAvailableKanji} Kanji)
                </button>
              )}
            </div>
          </div>

          {/* Start CTA */}
          <button
            onClick={() => startQuiz()}
            disabled={!isReady}
            className={`w-full py-4 rounded-2xl font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2.5 ${
              isReady
                ? 'bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-purple-500/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-60'
            }`}
          >
            <Play size={18} className={isReady ? 'fill-white' : 'fill-slate-500'} />
            <span>
              {isReady 
                ? `Start Kanji Drill (${selectedChapters.length} Chapters • ${questionCount === 'all' ? totalAvailableKanji : Math.min(questionCount, totalAvailableKanji)} Questions)`
                : 'Select At Least 1 Chapter to Begin'}
            </span>
          </button>
        </div>
      )}

      {/* ACTIVE QUIZ SCREEN */}
      {quizState === 'active' && currentQ && (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between text-xs border-purple-500/20">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-white">
                Question {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-purple-300 font-semibold truncate max-w-xs">
                {scopeSummaryText}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                <Clock size={13} />
                <span>{Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Check size={14} />
                <span>{correctCount}</span>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="glass-panel-glow border-purple-500/20 p-8 rounded-3xl text-center space-y-4">
            <div className="text-xs text-purple-400 font-bold uppercase tracking-widest">
              {currentQ.subPrompt}
            </div>

            <div className="text-5xl md:text-7xl font-black text-white py-4 font-jp tracking-wider">
              {currentQ.prompt}
            </div>

            <div className="flex items-center justify-center gap-2">
              <AudioButton text={currentQ.audioText} size="md" />
              <span className="text-xs text-slate-400">Listen native reading</span>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options.map((option, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx];
              let optionStyle = 'bg-slate-800/80 border-white/10 hover:border-purple-400/50 hover:bg-slate-800 text-white';

              if (isAnswered) {
                if (option === currentQ.correctAnswer) {
                  optionStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10';
                } else if (option === selectedOption) {
                  optionStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10';
                } else {
                  optionStyle = 'bg-slate-900/40 border-white/5 text-slate-500 opacity-50';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(option)}
                  className={`p-4 rounded-2xl border text-left font-bold text-base transition-all flex items-center justify-between ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-black">
                      {letter}
                    </span>
                    <span className="font-jp">{option}</span>
                  </div>

                  {isAnswered && option === currentQ.correctAnswer && (
                    <Check size={18} className="text-emerald-400" />
                  )}
                  {isAnswered && option === selectedOption && option !== currentQ.correctAnswer && (
                    <X size={18} className="text-rose-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          {isAnswered && (
            <div className="pt-2">
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-purple-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <span>{currentIndex + 1 === questions.length ? 'View Results' : 'Next Question'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* RESULT SCREEN */}
      {quizState === 'result' && (
        <div className="glass-panel-glow border-purple-500/25 p-8 rounded-3xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/10">
            <Trophy size={32} />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-black text-white">Kanji Drill Complete!</h2>
            <p className="text-xs text-slate-400">
              Scope: <strong className="text-purple-300">{scopeSummaryText}</strong>
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="text-2xl md:text-3xl font-black text-purple-400">
                {Math.round((correctCount / questions.length) * 100)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Accuracy</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="text-2xl md:text-3xl font-black text-emerald-400">
                {correctCount} / {questions.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Score</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="text-2xl md:text-3xl font-black text-amber-400">
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-400 mt-1">Time</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={restartQuiz}
              className="flex-1 py-3.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              <RotateCcw size={15} />
              <span>Practice Again</span>
            </button>

            {mistakes.length > 0 && (
              <button
                onClick={retryMistakes}
                className="flex-1 py-3.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2"
              >
                <X size={15} />
                <span>Retry {mistakes.length} Mistakes</span>
              </button>
            )}

            <button
              onClick={() => setQuizState('setup')}
              className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-white/5"
            >
              Change Chapters
            </button>
          </div>

          {/* Review Mistakes Section */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Review Kanji Questions</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {userAnswers.length}
                </span>
              </h3>

              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    reviewFilter === 'all' ? 'bg-purple-500 text-white' : 'text-slate-400'
                  }`}
                >
                  All ({userAnswers.length})
                </button>
                <button
                  onClick={() => setReviewFilter('mistakes')}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    reviewFilter === 'mistakes' ? 'bg-rose-500 text-white' : 'text-slate-400'
                  }`}
                >
                  Mistakes ({mistakes.length})
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
              {userAnswers
                .filter(a => reviewFilter === 'all' || !a.isCorrect)
                .map((ans, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      ans.isCorrect
                        ? 'bg-slate-800/40 border-white/5'
                        : 'bg-rose-500/10 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-black text-xl font-jp">
                        {ans.question.item.kanji}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{ans.question.item.meaning}</div>
                        <div className="text-xs text-purple-300/80 font-jp">
                          音: {ans.question.item.onyomi || '—'} | 訓: {ans.question.item.kunyomi || '—'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!ans.isCorrect && (
                        <div className="text-right text-[11px]">
                          <div className="text-rose-400 line-through truncate max-w-[120px]">
                            {ans.selected}
                          </div>
                          <div className="text-emerald-400 font-bold truncate max-w-[120px]">
                            {ans.question.correctAnswer}
                          </div>
                        </div>
                      )}
                      <AudioButton text={ans.question.item.kanji} size="sm" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
