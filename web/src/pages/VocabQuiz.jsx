import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  X, 
  RotateCcw, 
  Play, 
  ArrowRight, 
  Volume2, 
  Trophy, 
  Sparkles, 
  Sliders, 
  HelpCircle,
  Clock,
  Filter,
  BookOpen,
  Grid,
  CheckSquare,
  Square,
  Layers,
  Sparkle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import n5Data from '../data/n5Data';
import { generateVocabQuiz } from '../services/quizEngine';
import audioService from '../services/audioService';
import { storageService } from '../services/storageService';
import AudioButton from '../components/AudioButton';
import KanjiQuiz from './KanjiQuiz';
import KanaQuiz from './KanaQuiz';

export default function VocabQuiz({ initialConfig = null, onSelectChapter }) {
  // Practice category: 'vocab' | 'kanji' | 'kana'
  const [activeCategory, setActiveCategory] = useState(initialConfig?.category || 'vocab');

  // Multi-chapter selection state (array of chapter numbers: 1..24)
  const [selectedChapters, setSelectedChapters] = useState(() => {
    if (initialConfig?.chapters && Array.isArray(initialConfig.chapters)) {
      return initialConfig.chapters;
    }
    if (initialConfig?.chapter === 'all') {
      return Array.from({ length: 24 }, (_, i) => i + 1);
    }
    if (initialConfig?.chapter === 'adverbs') {
      return [];
    }
    if (initialConfig?.chapter) {
      const num = parseInt(initialConfig.chapter, 10);
      return isNaN(num) ? [1] : [num];
    }
    return [1]; // default to Chapter 1
  });

  // Toggle for including the 60 Essential N5 Adverbs in the quiz pool
  const [includeAdverbs, setIncludeAdverbs] = useState(() => {
    return initialConfig?.chapter === 'all' || initialConfig?.chapter === 'adverbs';
  });

  const [selectedMode, setSelectedMode] = useState(initialConfig?.mode || 'jp_to_en');
  const [questionCount, setQuestionCount] = useState(initialConfig?.count || 15);

  useEffect(() => {
    if (initialConfig?.category) {
      setActiveCategory(initialConfig.category);
    }
    if (initialConfig?.chapters && Array.isArray(initialConfig.chapters)) {
      setSelectedChapters(initialConfig.chapters);
    } else if (initialConfig?.chapter === 'all') {
      setSelectedChapters(Array.from({ length: 24 }, (_, i) => i + 1));
      setIncludeAdverbs(true);
    } else if (initialConfig?.chapter === 'adverbs') {
      setSelectedChapters([]);
      setIncludeAdverbs(true);
    } else if (initialConfig?.chapter) {
      const num = parseInt(initialConfig.chapter, 10);
      if (!isNaN(num)) setSelectedChapters([num]);
    }
    if (initialConfig?.mode) {
      setSelectedMode(initialConfig.mode);
    }
  }, [initialConfig]);

  // Quiz active state
  const [quizState, setQuizState] = useState('setup'); // 'setup' | 'active' | 'result'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]); // { question, selected, isCorrect }
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'mistakes'

  // Available chapters list with metadata
  const chapters = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const chNum = i + 1;
      const list = n5Data.chapterVocabMap[chNum] || [];
      const firstItem = list[0] || {};
      const title = firstItem.chapterTitle || `Lesson ${chNum}`;
      return {
        id: chNum,
        title,
        count: list.length,
        isBasic1: chNum <= 11,
        isBasic2: chNum > 11
      };
    });
  }, []);

  // Multi-chapter selection helpers
  const toggleChapter = (chId) => {
    setSelectedChapters(prev => {
      if (prev.includes(chId)) {
        return prev.filter(id => id !== chId);
      } else {
        return [...prev, chId].sort((a, b) => a - b);
      }
    });
  };

  const selectAllChapters = () => {
    setSelectedChapters(Array.from({ length: 24 }, (_, i) => i + 1));
    setIncludeAdverbs(true);
  };

  const selectBasic1 = () => {
    setSelectedChapters(Array.from({ length: 11 }, (_, i) => i + 1));
  };

  const selectBasic2 = () => {
    setSelectedChapters(Array.from({ length: 13 }, (_, i) => i + 12));
  };

  const clearSelection = () => {
    setSelectedChapters([]);
    setIncludeAdverbs(false);
  };

  // Total words available in the current selection pool
  const totalAvailableWords = useMemo(() => {
    let count = 0;
    selectedChapters.forEach(chId => {
      count += (n5Data.chapterVocabMap[chId]?.length || 0);
    });
    if (includeAdverbs) {
      count += (n5Data.adverbs?.length || 60);
    }
    return count;
  }, [selectedChapters, includeAdverbs]);

  // Formatted scope label for headers & results
  const scopeSummaryText = useMemo(() => {
    if (selectedChapters.length === 24 && includeAdverbs) {
      return 'Whole JLPT N5 (All 24 Chapters + Adverbs)';
    }
    if (selectedChapters.length === 24) {
      return 'Whole JLPT N5 (All 24 Chapters)';
    }
    if (selectedChapters.length === 0 && includeAdverbs) {
      return 'Essential N5 Adverbs (60 Words)';
    }
    if (selectedChapters.length === 1 && !includeAdverbs) {
      return `Chapter ${selectedChapters[0]}`;
    }
    if (selectedChapters.length === 0) {
      return 'None Selected';
    }
    const chList = selectedChapters.join(', ');
    const advTag = includeAdverbs ? ' + Adverbs' : '';
    return `${selectedChapters.length} Chapters (Ch ${chList})${advTag}`;
  }, [selectedChapters, includeAdverbs]);

  // Start the quiz
  const startQuiz = (mode = selectedMode, count = questionCount) => {
    let pool = [];

    // Pool from all selected chapters
    selectedChapters.forEach(chNum => {
      const chWords = n5Data.chapterVocabMap[chNum] || [];
      pool = pool.concat(chWords.map(w => ({
        ...w,
        chapterOrigin: `Ch ${chNum}`
      })));
    });

    // Optionally include adverbs
    if (includeAdverbs) {
      const advWords = (n5Data.adverbs || []).map(a => ({
        id: a.id,
        japanese: a.japanese,
        kana: a.japanese,
        romaji: '',
        english: a.english,
        chapterOrigin: 'Adverbs'
      }));
      pool = pool.concat(advWords);
    }

    if (!pool || pool.length === 0) {
      alert("Please select at least 1 chapter or adverbs to practice.");
      return;
    }

    // Determine effective count
    const effectiveCount = count === 'all' ? pool.length : Math.min(Number(count), pool.length);
    const generated = generateVocabQuiz(pool, n5Data.allVocab, effectiveCount, mode);

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setQuizState('active');

    // Auto pronounce first question if in audio mode
    if (mode === 'audio' && generated[0]) {
      setTimeout(() => {
        audioService.speak(generated[0].prompt);
      }, 300);
    }
  };

  // Timer effect during active quiz
  useEffect(() => {
    let timer = null;
    if (quizState === 'active') {
      timer = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizState, startTime]);

  // Handle option click
  const handleSelectOption = (optionIndex) => {
    if (isAnswered) return;

    const currentQ = questions[currentIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;
    setSelectedOption(optionIndex);
    setIsAnswered(true);

    // Audio chime feedback
    audioService.playFeedback(isCorrect);

    // Speak the Japanese word
    if (currentQ.vocabItem?.japanese || currentQ.vocabItem?.kana) {
      audioService.speak(currentQ.vocabItem.japanese || currentQ.vocabItem.kana);
    }

    // Record answer
    const answerRecord = {
      question: currentQ,
      selectedIndex: optionIndex,
      selectedAnswer: currentQ.options[optionIndex],
      isCorrect
    };
    setUserAnswers(prev => [...prev, answerRecord]);
  };

  // Move to next question or show results
  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswered(false);

      if (selectedMode === 'audio' && questions[nextIdx]) {
        setTimeout(() => {
          audioService.speak(questions[nextIdx].prompt);
        }, 200);
      }
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const finalAnswers = userAnswers;
    const score = finalAnswers.filter(a => a.isCorrect).length;
    const total = questions.length;
    const percent = Math.round((score / total) * 100);

    storageService.saveQuizResult({
      scope: scopeSummaryText,
      mode: selectedMode,
      score,
      total,
      percent,
      duration: elapsedSeconds
    });

    if (percent >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    setQuizState('result');
  };

  // Retake only missed questions
  const retakeMistakes = () => {
    const missedItems = userAnswers.filter(a => !a.isCorrect).map(a => a.question.vocabItem);
    if (missedItems.length === 0) return;

    const generated = generateVocabQuiz(missedItems, n5Data.allVocab, missedItems.length, selectedMode);
    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setQuizState('active');
  };

  // Keyboard shortcut listener (1, 2, 3, 4, Space/Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (quizState !== 'active') return;

      if (!isAnswered) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (questions[currentIndex]?.options[idx] !== undefined) {
            handleSelectOption(idx);
          }
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quizState, isAnswered, currentIndex, questions]);

  // Format time mm:ss
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Category Switcher
  const CategorySwitcher = (
    <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-white/10 w-fit mx-auto shadow-xl">
      <button
        onClick={() => setActiveCategory('vocab')}
        className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
          activeCategory === 'vocab'
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <BookOpen size={14} />
        <span>Vocabulary Quiz (Multi-Chapter)</span>
      </button>
      <button
        onClick={() => setActiveCategory('kanji')}
        className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
          activeCategory === 'kanji'
            ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Sparkles size={14} />
        <span>Kanji Drill (10 Ch & Full)</span>
      </button>
      <button
        onClick={() => setActiveCategory('kana')}
        className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
          activeCategory === 'kana'
            ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Grid size={14} />
        <span>Kana Drill (Hira & Kata)</span>
      </button>
    </div>
  );

  if (activeCategory === 'kanji') {
    return (
      <div className="space-y-6">
        {CategorySwitcher}
        <KanjiQuiz initialChapter={initialConfig?.chapter || 'all'} />
      </div>
    );
  }

  if (activeCategory === 'kana') {
    return (
      <div className="space-y-6">
        {CategorySwitcher}
        <KanaQuiz initialScript={initialConfig?.script || 'hiragana'} />
      </div>
    );
  }

  // ================= RENDER: SETUP SCREEN =================
  if (quizState === 'setup') {
    const isReady = totalAvailableWords > 0;

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        {CategorySwitcher}

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold">
            <HelpCircle size={14} />
            <span>INTERACTIVE MULTI-CHAPTER PRACTICE WORKSHOP</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            JLPT N5 Vocabulary Practice
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Select any combination of chapters (single, multiple, or all 24) to practice together with authentic audio and instant feedback.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="p-6 md:p-8 glass-panel-glow border-white/10 space-y-6">
          
          {/* Step 1: Select Scope (Multi-Chapter Selection) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center text-xs">1</span>
                <span>Select Chapters to Practice</span>
              </label>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-bold border transition-all ${
                  isReady 
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' 
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                }`}>
                  {isReady 
                    ? `🎯 ${selectedChapters.length} Chapters Selected (${totalAvailableWords} Words Available)`
                    : '⚠️ Please select at least 1 chapter'}
                </span>
              </div>
            </div>

            {/* Quick Action Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={selectAllChapters}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  selectedChapters.length === 24 && includeAdverbs
                    ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-white/10 hover:border-white/25 hover:text-white'
                }`}
              >
                🌸 Select All 24 Chapters
              </button>

              <button
                type="button"
                onClick={selectBasic1}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  selectedChapters.length === 11 && selectedChapters.every(id => id <= 11)
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-white/10 hover:border-white/25 hover:text-white'
                }`}
              >
                📗 Basic 1 (Ch 1–11)
              </button>

              <button
                type="button"
                onClick={selectBasic2}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  selectedChapters.length === 13 && selectedChapters.every(id => id >= 12)
                    ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-white/10 hover:border-white/25 hover:text-white'
                }`}
              >
                📘 Basic 2 (Ch 12–24)
              </button>

              <button
                type="button"
                onClick={() => setIncludeAdverbs(!includeAdverbs)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  includeAdverbs
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-white/10 hover:border-white/25'
                }`}
              >
                <span>🏷️</span>
                <span>+ Adverbs (60w)</span>
                <span className="text-[10px] opacity-80">{includeAdverbs ? '✓ ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/40 text-slate-400 border border-white/5 hover:text-rose-400 hover:border-rose-400/30 transition-all ml-auto"
              >
                Clear Selection
              </button>
            </div>

            {/* Chapter Selection Grid (Multi-Select) */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>Click chapters to toggle them into your custom practice pool:</span>
                <span className="text-[11px] text-slate-500">Multiple selection enabled</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto p-1.5 scrollbar-thin bg-slate-950/40 rounded-2xl border border-white/5">
                {chapters.map(ch => {
                  const isSelected = selectedChapters.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChapter(ch.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-rose-500/20 border-rose-500 text-white shadow-md shadow-rose-500/10'
                          : 'bg-slate-800/60 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-white">Ch {ch.id}</span>
                        {isSelected ? (
                          <CheckSquare size={14} className="text-rose-400 shrink-0" />
                        ) : (
                          <Square size={14} className="text-slate-600 shrink-0" />
                        )}
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium truncate">{ch.count} words</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          ch.isBasic1 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {ch.isBasic1 ? 'B1' : 'B2'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 2: Select Quiz Direction Mode */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-xs">2</span>
              <span>Select Question Mode</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'jp_to_en', label: 'Japanese ➔ English', desc: 'Read Japanese (Kana/Kanji), choose English meaning.' },
                { id: 'en_to_jp', label: 'English ➔ Japanese', desc: 'Read English prompt, choose correct Japanese word.' },
                { id: 'audio', label: '🎧 Audio Listening', desc: 'Listen to native voice, choose correct meaning.' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMode(m.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedMode === m.id
                      ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800/60 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-sm text-indigo-300">{m.label}</div>
                  <p className="text-xs text-slate-400 mt-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Question Count */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs">3</span>
              <span>Number of Questions</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {[10, 15, 25, 40].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setQuestionCount(c)}
                  className={`px-5 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                    questionCount === c
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md'
                      : 'bg-slate-800/70 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {c} Questions
                </button>
              ))}

              {totalAvailableWords > 0 && (
                <button
                  type="button"
                  onClick={() => setQuestionCount('all')}
                  className={`px-5 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                    questionCount === 'all'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md'
                      : 'bg-slate-800/70 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  All Available ({totalAvailableWords} Words)
                </button>
              )}
            </div>
          </div>

          {/* Start CTA */}
          <div className="pt-4">
            <button
              onClick={() => startQuiz()}
              disabled={!isReady}
              className={`w-full py-4 rounded-xl font-extrabold text-base shadow-xl transition-all flex items-center justify-center gap-2 ${
                isReady
                  ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-rose-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-60'
              }`}
            >
              <Play size={20} className={isReady ? 'fill-white' : 'fill-slate-500'} />
              <span>
                {isReady 
                  ? `Start Quiz (${selectedChapters.length} Chapters • ${questionCount === 'all' ? totalAvailableWords : Math.min(questionCount, totalAvailableWords)} Questions)`
                  : 'Select At Least 1 Chapter to Begin'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= RENDER: ACTIVE QUIZ =================
  if (quizState === 'active') {
    const currentQ = questions[currentIndex];
    const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 truncate max-w-[200px] sm:max-w-xs">
              {scopeSummaryText}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock size={13} />
              <span>{formatTime(elapsedSeconds)}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentQ.vocabItem?.chapterOrigin && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                {currentQ.vocabItem.chapterOrigin}
              </span>
            )}
            <span className="text-white font-bold">Q {currentIndex + 1}</span>
            <span>/</span>
            <span>{questions.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Prompt Card */}
        <div className="p-8 md:p-12 glass-panel-glow border-white/10 rounded-3xl text-center space-y-4">
          <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            {selectedMode === 'jp_to_en' 
              ? 'Select the correct English meaning' 
              : selectedMode === 'en_to_jp' 
              ? 'Select the correct Japanese word' 
              : 'Listen to the audio and select meaning'}
          </div>

          {/* Large Prompt Text */}
          <div className="flex items-center justify-center gap-4 py-3">
            {selectedMode === 'audio' ? (
              <div className="space-y-3">
                <AudioButton text={currentQ.prompt} size="lg" className="mx-auto" />
                <div className="text-slate-400 text-xs">Click speaker to replay pronunciation</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="text-3xl md:text-5xl font-black text-white font-jp tracking-wide">
                  {currentQ.prompt}
                </div>
                {currentQ.vocabItem?.romaji && selectedMode === 'jp_to_en' && (
                  <div className="text-xs md:text-sm text-slate-400 font-sans">
                    {currentQ.vocabItem.romaji}
                  </div>
                )}
              </div>
            )}
            {selectedMode !== 'audio' && (
              <AudioButton 
                text={currentQ.vocabItem?.japanese || currentQ.prompt} 
                size="md" 
                className="self-center"
              />
            )}
          </div>
        </div>

        {/* Multiple Choice Options (4 Buttons) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {currentQ.options.map((option, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx];
            let stateClass = '';

            if (isAnswered) {
              if (idx === currentQ.correctIndex) {
                stateClass = 'correct';
              } else if (idx === selectedOption) {
                stateClass = 'wrong';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`quiz-option ${stateClass}`}
              >
                <span className="option-badge">{letter}</span>
                <span className="flex-1 font-jp leading-snug">{option}</span>
                {isAnswered && idx === currentQ.correctIndex && (
                  <Check size={18} className="text-emerald-400 shrink-0" />
                )}
                {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                  <X size={18} className="text-red-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Next Action Button (appears after answering) */}
        {isAnswered && (
          <div className="pt-2 animate-fadeIn">
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-base shadow-lg shadow-rose-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>{currentIndex + 1 === questions.length ? 'See Final Score' : 'Next Question'}</span>
              <ArrowRight size={18} />
              <span className="text-xs opacity-75 font-normal ml-2">(Press Enter ↵)</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ================= RENDER: FINAL RESULTS SCREEN =================
  if (quizState === 'result') {
    const score = userAnswers.filter(a => a.isCorrect).length;
    const total = questions.length;
    const percent = Math.round((score / total) * 100);
    const mistakes = userAnswers.filter(a => !a.isCorrect);

    let grade = { label: 'Keep Practicing', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/30' };
    if (percent >= 90) {
      grade = { label: 'JLPT N5 Master! 🌸', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30' };
    } else if (percent >= 70) {
      grade = { label: 'Passed! Well Done! 🌟', color: 'text-rose-400', badge: 'bg-rose-500/20 border-rose-500/30' };
    }

    const filteredReviews = reviewFilter === 'mistakes' ? mistakes : userAnswers;

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
        {/* Score Summary Card */}
        <div className="p-8 md:p-10 glass-panel-glow border-white/10 rounded-3xl text-center space-y-5">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${grade.badge} ${grade.color}`}>
            <Trophy size={14} />
            <span>{grade.label}</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white">Quiz Completed</h2>

          {/* Big Score Display */}
          <div className="flex items-center justify-center">
            <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-rose-500/20 via-pink-500/20 to-indigo-500/20 border-2 border-rose-500/40 flex flex-col items-center justify-center shadow-xl shadow-rose-500/10">
              <span className="text-4xl font-black text-white">{percent}%</span>
              <span className="text-xs text-slate-400 font-semibold mt-1">{score} / {total} Correct</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400 font-medium">
            <div>Scope: <strong className="text-white">{scopeSummaryText}</strong></div>
            <div>Time: <strong className="text-white">{formatTime(elapsedSeconds)}</strong></div>
            <div>Accuracy: <strong className={grade.color}>{percent}%</strong></div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {mistakes.length > 0 && (
              <button
                onClick={retakeMistakes}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-sm transition-all"
              >
                <RotateCcw size={16} />
                <span>Retake {mistakes.length} Missed Words</span>
              </button>
            )}

            <button
              onClick={() => startQuiz(selectedMode, questionCount)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition-all"
            >
              <RotateCcw size={16} />
              <span>Retry Same Quiz</span>
            </button>

            <button
              onClick={() => setQuizState('setup')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold text-sm transition-all"
            >
              <Sliders size={16} />
              <span>Change Chapters / Settings</span>
            </button>
          </div>
        </div>

        {/* Detailed Review Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <span>Detailed Question Review</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {userAnswers.length}
              </span>
            </h3>

            {/* Filter Toggle */}
            {mistakes.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    reviewFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({userAnswers.length})
                </button>
                <button
                  onClick={() => setReviewFilter('mistakes')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    reviewFilter === 'mistakes' ? 'bg-red-500/20 text-red-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mistakes ({mistakes.length})
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            {filteredReviews.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                  item.isCorrect
                    ? 'bg-slate-800/40 border-white/5'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.isCorrect ? <Check size={16} /> : <X size={16} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-jp text-base">{item.question.prompt}</span>
                      {item.question.vocabItem?.chapterOrigin && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                          {item.question.vocabItem.chapterOrigin}
                        </span>
                      )}
                      {item.question.vocabItem?.romaji && (
                        <span className="text-xs text-slate-400 font-sans">({item.question.vocabItem.romaji})</span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5">
                      <span className="text-slate-400">Correct: </span>
                      <span className="text-emerald-400 font-medium">{item.question.correctAnswer}</span>
                      {!item.isCorrect && (
                        <span className="ml-3 text-red-400 line-through opacity-80">
                          You chose: {item.selectedAnswer}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <AudioButton text={item.question.vocabItem?.japanese || item.question.prompt} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
