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
    <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-[#17171b] rounded-xl border border-white/5 w-fit mx-auto shadow-sm">
      <button
        onClick={() => setActiveCategory('vocab')}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
          activeCategory === 'vocab'
            ? 'bg-[#c53d33] text-white'
            : 'text-stone-400 hover:text-white'
        }`}
      >
        <BookOpen size={13} />
        <span>語彙問題 (Vocab Quiz)</span>
      </button>
      <button
        onClick={() => setActiveCategory('kanji')}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
          activeCategory === 'kanji'
            ? 'bg-[#c53d33] text-white'
            : 'text-stone-400 hover:text-white'
        }`}
      >
        <span className="font-mincho">漢</span>
        <span>漢字演習 (Kanji Drill)</span>
      </button>
      <button
        onClick={() => setActiveCategory('kana')}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
          activeCategory === 'kana'
            ? 'bg-[#c53d33] text-white'
            : 'text-stone-400 hover:text-white'
        }`}
      >
        <Grid size={13} />
        <span>五十音演習 (Kana Drill)</span>
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
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
        {CategorySwitcher}

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#c53d33]/10 border border-[#c53d33]/30 text-[#e57a6f] text-xs font-mincho font-medium">
            <HelpCircle size={13} />
            <span>〔 語彙問題演習 〕 VOCABULARY PRACTICE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            JLPT N5 語彙演習 (Practice Quiz)
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm max-w-lg mx-auto font-jp">
            演習したい課を自由に選択し、出題形式・問題数を設定して実践的な4択問題を開始できます。
          </p>
        </div>

        {/* Configuration Card */}
        <div className="p-6 md:p-8 rounded-2xl bg-[#17171b] border border-white/5 space-y-6">
          
          {/* Step 1: Select Scope */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-medium text-stone-200 flex items-center gap-2 font-jp">
                <span className="w-5 h-5 rounded bg-[#c53d33] text-white flex items-center justify-center text-[11px] font-bold">1</span>
                <span>出題範囲の選択 (Select Chapters)</span>
              </label>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2.5 py-0.5 rounded border transition-all font-jp ${
                  isReady 
                    ? 'bg-[#c53d33]/10 border-[#c53d33]/30 text-[#e57a6f]' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}>
                  {isReady 
                    ? `${selectedChapters.length}課 選択中 (${totalAvailableWords}語 出題可能)`
                    : '最低1つの課を選択してください'}
                </span>
              </div>
            </div>

            {/* Quick Action Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={selectAllChapters}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  selectedChapters.length === 24 && includeAdverbs
                    ? 'bg-[#c53d33] text-white border-[#c53d33]'
                    : 'bg-[#131316] text-stone-400 border-white/5 hover:text-white'
                }`}
              >
                全24課
              </button>

              <button
                type="button"
                onClick={selectBasic1}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  selectedChapters.length === 11 && selectedChapters.every(id => id <= 11)
                    ? 'bg-[#c53d33] text-white border-[#c53d33]'
                    : 'bg-[#131316] text-stone-400 border-white/5 hover:text-white'
                }`}
              >
                初級1 (1–11)
              </button>

              <button
                type="button"
                onClick={selectBasic2}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  selectedChapters.length === 13 && selectedChapters.every(id => id >= 12)
                    ? 'bg-[#c53d33] text-white border-[#c53d33]'
                    : 'bg-[#131316] text-stone-400 border-white/5 hover:text-white'
                }`}
              >
                初級2 (12–24)
              </button>

              <button
                type="button"
                onClick={() => setIncludeAdverbs(!includeAdverbs)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                  includeAdverbs
                    ? 'bg-[#222227] text-white border-white/20'
                    : 'bg-[#131316] text-stone-400 border-white/5'
                }`}
              >
                <span>副詞 (60語)</span>
                <span className="text-[10px] opacity-80">{includeAdverbs ? '✓' : ''}</span>
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-300 transition-colors ml-auto"
              >
                選択解除
              </button>
            </div>

            {/* Chapter Selection Grid */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1.5 scrollbar-thin bg-[#131316] rounded-xl border border-white/5">
                {chapters.map(ch => {
                  const isSelected = selectedChapters.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChapter(ch.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#c53d33]/15 border-[#c53d33] text-white'
                          : 'bg-[#17171b] border-white/5 text-stone-400 hover:border-white/15 hover:text-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mincho">第{ch.id}課</span>
                        {isSelected ? (
                          <CheckSquare size={13} className="text-[#e57a6f] shrink-0" />
                        ) : (
                          <Square size={13} className="text-stone-600 shrink-0" />
                        )}
                      </div>
                      
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-stone-400">{ch.count}語</span>
                        <span className="text-stone-500 text-[9px]">
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
          <div className="space-y-3 pt-4 border-t border-white/5">
            <label className="text-xs font-medium text-stone-200 flex items-center gap-2 font-jp">
              <span className="w-5 h-5 rounded bg-[#c53d33] text-white flex items-center justify-center text-[11px] font-bold">2</span>
              <span>出題形式の選択 (Question Mode)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'jp_to_en', label: '日本語 ➔ 英語', desc: '日本語（漢字/仮名）を読み、正しい英語の意味を選択。' },
                { id: 'en_to_jp', label: '英語 ➔ 日本語', desc: '英語の意味から正しい日本語単語を選択。' },
                { id: 'audio', label: '🎧 音声聴解', desc: 'ネイティブ音声を聴き、正しい意味を選択。' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMode(m.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedMode === m.id
                      ? 'bg-[#222227] border-[#c53d33] text-white'
                      : 'bg-[#131316] border-white/5 text-stone-300 hover:border-white/15'
                  }`}
                >
                  <div className={`font-bold text-xs ${selectedMode === m.id ? 'text-[#e57a6f]' : 'text-stone-200'}`}>{m.label}</div>
                  <p className="text-[11px] text-stone-400 mt-1 leading-relaxed font-jp">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Question Count */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <label className="text-xs font-medium text-stone-200 flex items-center gap-2 font-jp">
              <span className="w-5 h-5 rounded bg-[#c53d33] text-white flex items-center justify-center text-[11px] font-bold">3</span>
              <span>出題数 (Question Count)</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {[10, 15, 25, 40].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setQuestionCount(c)}
                  className={`px-3.5 py-1.5 rounded-lg border font-medium text-xs transition-all ${
                    questionCount === c
                      ? 'bg-[#c53d33] border-[#c53d33] text-white'
                      : 'bg-[#131316] border-white/5 text-stone-400 hover:text-white'
                  }`}
                >
                  {c}問
                </button>
              ))}

              {totalAvailableWords > 0 && (
                <button
                  type="button"
                  onClick={() => setQuestionCount('all')}
                  className={`px-3.5 py-1.5 rounded-lg border font-medium text-xs transition-all ${
                    questionCount === 'all'
                      ? 'bg-[#c53d33] border-[#c53d33] text-white'
                      : 'bg-[#131316] border-white/5 text-stone-400 hover:text-white'
                  }`}
                >
                  全問 ({totalAvailableWords}語)
                </button>
              )}
            </div>
          </div>

          {/* Start CTA */}
          <div className="pt-2">
            <button
              onClick={() => startQuiz()}
              disabled={!isReady}
              className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                isReady
                  ? 'bg-[#c53d33] hover:bg-[#b12f26] text-white cursor-pointer'
                  : 'bg-[#1c1c20] text-stone-500 border border-white/5 cursor-not-allowed opacity-60'
              }`}
            >
              <Play size={15} className={isReady ? 'fill-white' : 'fill-stone-500'} />
              <span>
                {isReady 
                  ? `演習開始 (${selectedChapters.length}課 • ${questionCount === 'all' ? totalAvailableWords : Math.min(questionCount, totalAvailableWords)}問)`
                  : '課を選択して演習を開始'}
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
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between text-xs text-stone-400 px-1 font-jp">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded border border-[#c53d33]/30 bg-[#c53d33]/10 text-[#e57a6f] truncate max-w-[200px] sm:max-w-xs font-mincho">
              {scopeSummaryText}
            </span>
            <span className="flex items-center gap-1 text-stone-400">
              <Clock size={12} />
              <span>{formatTime(elapsedSeconds)}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {currentQ.vocabItem?.chapterOrigin && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-stone-400 border border-white/5 font-jp">
                {currentQ.vocabItem.chapterOrigin}
              </span>
            )}
            <span className="text-white font-medium">第 {currentIndex + 1} 問</span>
            <span>/</span>
            <span>{questions.length}</span>
          </div>
        </div>

        {/* Progress Bar (Thin Vermilion Line) */}
        <div className="w-full h-1 rounded-full bg-[#17171b] overflow-hidden">
          <div 
            className="h-full bg-[#c53d33] transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Prompt Card */}
        <div className="p-8 md:p-12 rounded-2xl bg-[#17171b] border border-white/5 text-center space-y-3">
          <div className="text-[11px] font-mincho text-[#e57a6f]">
            {selectedMode === 'jp_to_en' 
              ? '〔 意味の選択 〕 正しい英語の意味を選んでください' 
              : selectedMode === 'en_to_jp' 
              ? '〔 単語の選択 〕 正しい日本語の単語を選んでください' 
              : '〔 聴解 〕 音声を聴き、正しい意味を選んでください'}
          </div>

          {/* Large Prompt Text */}
          <div className="flex items-center justify-center gap-4 py-3">
            {selectedMode === 'audio' ? (
              <div className="space-y-3">
                <AudioButton text={currentQ.prompt} size="lg" className="mx-auto" />
                <div className="text-stone-400 text-xs font-jp">スピーカーをクリックして音声を再生</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="text-3xl md:text-5xl font-bold text-white font-mincho tracking-wide">
                  {currentQ.prompt}
                </div>
                {currentQ.vocabItem?.romaji && selectedMode === 'jp_to_en' && (
                  <div className="text-xs md:text-sm text-stone-400 font-sans">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQ.options.map((option, idx) => {
            const letter = ['ア', 'イ', 'ウ', 'エ'][idx];
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
                  <Check size={16} className="text-emerald-400 shrink-0" />
                )}
                {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                  <X size={16} className="text-red-400 shrink-0" />
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
              className="w-full py-3.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{currentIndex + 1 === questions.length ? '採点結果を表示 (Results)' : '次の問題へ (Next Question)'}</span>
              <ArrowRight size={16} />
              <span className="text-xs opacity-75 font-normal ml-2 font-mono">(Enter ↵)</span>
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

    let grade = { label: '復習をおすすめします', jp: '要復習', color: 'text-stone-300', badge: 'border-white/10 bg-white/5' };
    if (percent >= 90) {
      grade = { label: '大変優秀です！合格レベル', jp: '合 格', color: 'text-emerald-400', badge: 'border-emerald-500/40 bg-emerald-950/20' };
    } else if (percent >= 70) {
      grade = { label: '合格基準を達成しました', jp: '合 格', color: 'text-[#e57a6f]', badge: 'border-[#c53d33]/40 bg-[#c53d33]/10' };
    }

    const filteredReviews = reviewFilter === 'mistakes' ? mistakes : userAnswers;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
        {/* Score Summary Card */}
        <div className="p-8 md:p-10 rounded-2xl bg-[#17171b] border border-white/5 text-center space-y-5">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded border text-xs font-mincho ${grade.badge} ${grade.color}`}>
            <span>〔 {grade.jp} 〕</span>
            <span>{grade.label}</span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">演習終了 (Quiz Completed)</h2>

          {/* Big Score Display */}
          <div className="flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-[#131316] border border-white/10 flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl font-bold text-white font-mincho">{percent}%</span>
              <span className="text-xs text-stone-400 font-jp mt-0.5">{score} / {total} 問 正解</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-stone-400 font-jp">
            <div>範囲: <strong className="text-white font-medium">{scopeSummaryText}</strong></div>
            <div>所要時間: <strong className="text-white font-medium">{formatTime(elapsedSeconds)}</strong></div>
            <div>正答率: <strong className={`font-medium ${grade.color}`}>{percent}%</strong></div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            {mistakes.length > 0 && (
              <button
                onClick={retakeMistakes}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#222227] hover:bg-[#2a2a32] text-stone-200 border border-white/10 font-medium text-xs transition-all"
              >
                <RotateCcw size={14} />
                <span>間違えた{mistakes.length}語を再演習</span>
              </button>
            )}

            <button
              onClick={() => startQuiz(selectedMode, questionCount)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white font-medium text-xs shadow-sm transition-all"
            >
              <RotateCcw size={14} />
              <span>もう一度挑戦</span>
            </button>

            <button
              onClick={() => setQuizState('setup')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c1c20] hover:bg-[#26262c] text-stone-300 border border-white/5 font-medium text-xs transition-all"
            >
              <Sliders size={14} />
              <span>設定を変更</span>
            </button>
          </div>
        </div>

        {/* Detailed Review Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2 font-jp">
              <span>解答詳細 (Question Review)</span>
              <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-stone-400">
                {userAnswers.length}問
              </span>
            </h3>

            {/* Filter Toggle */}
            {mistakes.length > 0 && (
              <div className="flex items-center gap-1 bg-[#17171b] p-1 rounded-lg border border-white/5 text-xs font-jp">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    reviewFilter === 'all' ? 'bg-[#222227] text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  全問 ({userAnswers.length})
                </button>
                <button
                  onClick={() => setReviewFilter('mistakes')}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    reviewFilter === 'mistakes' ? 'bg-[#c53d33]/20 text-[#e57a6f]' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  誤答のみ ({mistakes.length})
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {filteredReviews.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                  item.isCorrect
                    ? 'bg-[#17171b] border-white/5'
                    : 'bg-[#17171b] border-[#c53d33]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    item.isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#c53d33]/15 text-[#e57a6f]'
                  }`}>
                    {item.isCorrect ? <Check size={14} /> : <X size={14} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mincho text-base">{item.question.prompt}</span>
                      {item.question.vocabItem?.chapterOrigin && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-stone-400 font-jp">
                          {item.question.vocabItem.chapterOrigin}
                        </span>
                      )}
                      {item.question.vocabItem?.romaji && (
                        <span className="text-xs text-stone-400 font-sans">({item.question.vocabItem.romaji})</span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5 font-jp">
                      <span className="text-stone-400">正解: </span>
                      <span className="text-stone-200 font-medium">{item.question.correctAnswer}</span>
                      {!item.isCorrect && (
                        <span className="ml-3 text-[#e57a6f] line-through opacity-80">
                          選択: {item.selectedAnswer}
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
