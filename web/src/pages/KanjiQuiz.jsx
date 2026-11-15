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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#c53d33]/15 text-[#e57a6f] border border-[#c53d33]/30 flex items-center justify-center font-bold">
            <span className="font-mincho">漢</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mincho text-[#e57a6f]">〔 漢字演習 〕</span>
              <h2 className="text-lg font-bold text-white tracking-tight">Kanji Practice Drill</h2>
            </div>
            <p className="text-xs text-stone-400 font-jp">全110字のN5漢字を課別または総合問題で反復練習</p>
          </div>
        </div>

        {onBackToExplorer && (
          <button
            onClick={onBackToExplorer}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#17171b] hover:bg-[#202026] text-stone-300 border border-white/5 transition-colors font-jp"
          >
            ← 漢字一覧へ戻る
          </button>
        )}
      </div>

      {/* SETUP SCREEN */}
      {quizState === 'setup' && (
        <div className="p-6 md:p-8 rounded-2xl bg-[#17171b] border border-white/5 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#c53d33]/10 border border-[#c53d33]/30 text-[#e57a6f] text-xs font-mincho font-medium">
              <Sliders size={12} />
              <span>演習設定 (DRILL CONFIGURATION)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">出題範囲と形式を選択</h1>
            <p className="text-xs text-stone-400 font-jp">
              特定の課を組み合わせて演習するか、全110字の総合問題に挑戦できます。
            </p>
          </div>

          {/* Scope Selector */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-medium text-stone-300 flex items-center gap-2 font-jp">
                <span className="w-5 h-5 rounded bg-[#c53d33] text-white flex items-center justify-center text-[11px] font-bold">1</span>
                <span>出題課の選択 (Select Chapters):</span>
              </label>

              {/* Status pill */}
              <span className={`text-[11px] px-2.5 py-0.5 rounded border transition-all font-jp ${
                isReady 
                  ? 'bg-[#c53d33]/10 border-[#c53d33]/30 text-[#e57a6f]' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                {isReady 
                  ? `${selectedChapters.length}課 選択中 (${totalAvailableKanji}字)` 
                  : '最低1つの課を選択してください'}
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={selectAll}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  selectedChapters.length === kanjiChapters.length
                    ? 'bg-[#c53d33] text-white border-[#c53d33]'
                    : 'bg-[#131316] text-stone-400 border-white/5 hover:text-white'
                }`}
              >
                全10課 (110字)
              </button>

              <button
                type="button"
                onClick={selectBasics}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-[#131316] text-stone-400 border border-white/5 hover:text-white"
              >
                第1–4課: 数・時・自然
              </button>

              <button
                type="button"
                onClick={selectActions}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-[#131316] text-stone-400 border border-white/5 hover:text-white"
              >
                第5–7課: 行動・生活
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-300 ml-auto"
              >
                選択解除
              </button>
            </div>

            {/* Chapter-Wise Multi-Select Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin bg-[#131316] p-2 rounded-xl border border-white/5">
              {kanjiChapters.map((ch) => {
                const isSelected = selectedChapters.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChapter(ch.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#c53d33]/15 border-[#c53d33]'
                        : 'bg-[#17171b] border-white/5 hover:border-white/15 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="shrink-0">
                        {isSelected ? (
                          <CheckSquare size={14} className="text-[#e57a6f]" />
                        ) : (
                          <Square size={14} className="text-stone-600" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white font-mincho">
                          第{ch.id}課: {ch.title}
                        </div>
                        <div className="text-[10px] text-stone-400 truncate max-w-[200px] font-jp">
                          {ch.description}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-white/5 text-stone-300 shrink-0 font-jp">
                      {ch.count}字
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <label className="text-xs font-medium text-stone-300 flex items-center gap-2 font-jp">
              <span className="w-5 h-5 rounded bg-[#c53d33] text-white flex items-center justify-center text-[11px] font-bold">2</span>
              <span>出題形式 (Practice Mode):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'kanji_to_meaning', label: '漢字 ➔ 意味', desc: '漢字を見て英語の意味を選択' },
                { id: 'meaning_to_kanji', label: '意味 ➔ 漢字', desc: '英語の意味から正しい漢字を選択' },
                { id: 'reading', label: '漢字 ➔ 読み', desc: '音読み・訓読みの読み分け演習' },
                { id: 'audio', label: '🎧 音声聴解', desc: '音声を聴き、該当する漢字を選択' }
              ].map((m) => {
                const isSelected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMode(m.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-[#222227] border-[#c53d33] text-white'
                        : 'bg-[#131316] border-white/5 text-stone-300 hover:border-white/15'
                    }`}
                  >
                    <div className={`text-xs font-bold ${isSelected ? 'text-[#e57a6f]' : 'text-stone-200'}`}>{m.label}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5 leading-snug font-jp">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <label className="text-xs font-medium text-stone-300 flex items-center gap-2 font-jp">
              <span className="w-5 h-5 rounded bg-[#c53d33] text-white flex items-center justify-center text-[11px] font-bold">3</span>
              <span>出題数:</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 20].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    questionCount === cnt
                      ? 'bg-[#c53d33] text-white border-[#c53d33]'
                      : 'bg-[#131316] border-white/5 text-stone-300 hover:text-white'
                  }`}
                >
                  {cnt}問
                </button>
              ))}
              {totalAvailableKanji > 0 && (
                <button
                  type="button"
                  onClick={() => setQuestionCount('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    questionCount === 'all'
                      ? 'bg-[#c53d33] text-white border-[#c53d33]'
                      : 'bg-[#131316] border-white/5 text-stone-300 hover:text-white'
                  }`}
                >
                  全問 ({totalAvailableKanji}字)
                </button>
              )}
            </div>
          </div>

          {/* Start CTA */}
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
                ? `漢字演習開始 (${selectedChapters.length}課 • ${questionCount === 'all' ? totalAvailableKanji : Math.min(questionCount, totalAvailableKanji)}問)`
                : '課を選択して演習を開始'}
            </span>
          </button>
        </div>
      )}

      {/* ACTIVE QUIZ SCREEN */}
      {quizState === 'active' && currentQ && (
        <div className="space-y-6 pb-12">
          {/* Progress Header */}
          <div className="p-3.5 rounded-xl bg-[#17171b] border border-white/5 flex items-center justify-between text-xs font-jp">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">
                第 {currentIndex + 1} / {questions.length} 問
              </span>
              <span className="text-stone-500">•</span>
              <span className="text-[#e57a6f] truncate max-w-xs font-mincho">
                {scopeSummaryText}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-stone-400 font-mono">
                <Clock size={12} />
                <span>{Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-emerald-400">
                <Check size={13} />
                <span>{correctCount}正解</span>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="p-8 md:p-12 rounded-2xl bg-[#17171b] border border-white/5 text-center space-y-3">
            <div className="text-[11px] font-mincho text-[#e57a6f]">
              〔 {currentQ.subPrompt} 〕
            </div>

            <div className="text-5xl md:text-7xl font-bold text-white py-2 font-mincho tracking-wider">
              {currentQ.prompt}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <AudioButton text={currentQ.audioText} size="md" />
              <span className="text-xs text-stone-400 font-jp">発音を聴く</span>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((option, idx) => {
              const letter = ['ア', 'イ', 'ウ', 'エ'][idx];
              let optionStyle = 'bg-[#17171b] border-white/5 hover:border-white/20 text-white';

              if (isAnswered) {
                if (option === currentQ.correctAnswer) {
                  optionStyle = 'bg-emerald-950/20 border-emerald-500 text-emerald-300';
                } else if (option === selectedOption) {
                  optionStyle = 'bg-[#c53d33]/15 border-[#c53d33] text-[#e57a6f]';
                } else {
                  optionStyle = 'bg-[#131316] border-white/5 text-stone-600 opacity-50';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(option)}
                  className={`p-4 rounded-xl border text-left font-medium text-base transition-all flex items-center justify-between ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-xs font-mincho text-stone-400">
                      {letter}
                    </span>
                    <span className="font-mincho">{option}</span>
                  </div>

                  {isAnswered && option === currentQ.correctAnswer && (
                    <Check size={16} className="text-emerald-400" />
                  )}
                  {isAnswered && option === selectedOption && option !== currentQ.correctAnswer && (
                    <X size={16} className="text-[#e57a6f]" />
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
                className="w-full py-3.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{currentIndex + 1 === questions.length ? '採点結果を表示 (Results)' : '次の問題へ (Next Question)'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* RESULT SCREEN */}
      {quizState === 'result' && (
        <div className="p-8 rounded-2xl bg-[#17171b] border border-white/5 space-y-6 text-center pb-12">
          <div className="w-14 h-14 rounded-full bg-[#131316] text-[#e57a6f] border border-white/10 flex items-center justify-center mx-auto">
            <span className="font-mincho text-2xl font-bold">印</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight font-jp">漢字演習終了 (Drill Complete)</h2>
            <p className="text-xs text-stone-400 font-jp">
              出題範囲: <strong className="text-stone-200">{scopeSummaryText}</strong>
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-3.5 rounded-xl bg-[#131316] border border-white/5">
              <div className="text-2xl font-bold text-white font-mincho">
                {Math.round((correctCount / questions.length) * 100)}%
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 font-jp">正答率</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#131316] border border-white/5">
              <div className="text-2xl font-bold text-emerald-400 font-mincho">
                {correctCount} / {questions.length}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 font-jp">正解数</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#131316] border border-white/5">
              <div className="text-2xl font-bold text-stone-300 font-mono">
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 font-jp">所要時間</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-md mx-auto">
            <button
              onClick={restartQuiz}
              className="flex-1 py-2.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <RotateCcw size={14} />
              <span>もう一度演習</span>
            </button>

            {mistakes.length > 0 && (
              <button
                onClick={retryMistakes}
                className="flex-1 py-2.5 rounded-xl bg-[#222227] hover:bg-[#2a2a32] text-stone-200 border border-white/10 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw size={14} />
                <span>誤答の{mistakes.length}問を再挑戦</span>
              </button>
            )}

            <button
              onClick={() => setQuizState('setup')}
              className="px-4 py-2.5 rounded-xl bg-[#131316] hover:bg-[#1a1a20] text-stone-400 hover:text-white font-medium text-xs border border-white/5 transition-colors font-jp"
            >
              設定変更
            </button>
          </div>

          {/* Review Mistakes Section */}
          <div className="space-y-3 pt-4 border-t border-white/5 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-jp">
                <span>解答一覧 (Review Questions)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-stone-400 font-jp">
                  {userAnswers.length}問
                </span>
              </h3>

              <div className="flex items-center gap-1 bg-[#131316] p-1 rounded-lg border border-white/5 text-xs font-jp">
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
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
              {userAnswers
                .filter(a => reviewFilter === 'all' || !a.isCorrect)
                .map((ans, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      ans.isCorrect
                        ? 'bg-[#131316] border-white/5'
                        : 'bg-[#131316] border-[#c53d33]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#222227] text-white flex items-center justify-center font-bold text-lg font-mincho">
                        {ans.question.item.kanji}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{ans.question.item.meaning}</div>
                        <div className="text-[11px] text-stone-400 font-jp">
                          音: {ans.question.item.onyomi || '—'} | 訓: {ans.question.item.kunyomi || '—'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!ans.isCorrect && (
                        <div className="text-right text-[11px] font-jp">
                          <div className="text-[#e57a6f] line-through truncate max-w-[120px]">
                            {ans.selected}
                          </div>
                          <div className="text-stone-200 font-medium truncate max-w-[120px]">
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
