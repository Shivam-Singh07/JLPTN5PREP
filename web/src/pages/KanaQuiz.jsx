import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Check, 
  X, 
  RotateCcw, 
  Play, 
  ArrowRight, 
  Volume2, 
  Trophy, 
  Sliders, 
  Clock, 
  Filter, 
  Sparkles,
  Shuffle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import n5Data from '../data/n5Data';
import { generateKanaQuiz } from '../services/quizEngine';
import audioService from '../services/audioService';
import { storageService } from '../services/storageService';
import AudioButton from '../components/AudioButton';

export default function KanaQuiz({ initialScript = 'hiragana', onBackToSoundboard = null }) {
  // Config
  const [selectedScript, setSelectedScript] = useState(initialScript); // 'hiragana' | 'katakana' | 'mixed'
  const [selectedGroup, setSelectedGroup] = useState('all'); // 'all' | 'basic' | 'dakuten' | 'yoon'
  const [selectedMode, setSelectedMode] = useState('kana_to_romaji');
  const [questionCount, setQuestionCount] = useState(15);

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

  // Filter pool based on script and group
  const getFilteredPool = (script, group) => {
    let list = [];
    if (script === 'hiragana') {
      list = [...n5Data.hiragana];
    } else if (script === 'katakana') {
      list = [...n5Data.katakana];
    } else {
      list = [...n5Data.hiragana, ...n5Data.katakana];
    }

    if (group === 'basic') {
      list = list.filter(k => k.group !== 'dakuten' && k.group !== 'handakuten' && k.group !== 'yoon');
    } else if (group === 'dakuten') {
      list = list.filter(k => k.group === 'dakuten' || k.group === 'handakuten');
    } else if (group === 'yoon') {
      list = list.filter(k => k.group === 'yoon');
    }

    return list;
  };

  const startQuiz = (script = selectedScript, group = selectedGroup, mode = selectedMode, count = questionCount) => {
    const pool = getFilteredPool(script, group);
    const fullPool = [...n5Data.hiragana, ...n5Data.katakana];

    if (!pool || pool.length === 0) {
      alert("No Kana found for this filter.");
      return;
    }

    const maxCount = count === 'all' ? pool.length : Math.min(Number(count), pool.length);
    const generated = generateKanaQuiz(pool, fullPool, maxCount, mode);

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setQuizState('active');

    // Auto pronounce first question
    if (generated[0]) {
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

  const handleSelectOption = (option) => {
    if (isAnswered) return;

    const currentQ = questions[currentIndex];
    const isCorrect = option === currentQ.correctAnswer;

    setSelectedOption(option);
    setIsAnswered(true);

    audioService.playFeedback(isCorrect);
    // Play pronunciation
    audioService.speak(currentQ.audioText);

    setUserAnswers(prev => [...prev, {
      question: currentQ,
      selected: option,
      isCorrect
    }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      const nextQ = questions[currentIndex + 1];
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);

      setTimeout(() => {
        audioService.speak(nextQ.audioText);
      }, 200);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizState('result');

    const correctCount = userAnswers.filter(a => a.isCorrect).length + (selectedOption === questions[currentIndex].correctAnswer ? 1 : 0);
    const scorePct = Math.round((correctCount / questions.length) * 100);

    storageService.saveQuizScore({
      type: 'kana',
      scope: `${selectedScript}_${selectedGroup}`,
      score: correctCount,
      total: questions.length,
      mode: selectedMode,
      date: new Date().toISOString()
    });

    if (scorePct >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  const restartQuiz = () => {
    startQuiz(selectedScript, selectedGroup, selectedMode, questionCount);
  };

  const retryMistakes = () => {
    const mistakes = userAnswers.filter(a => !a.isCorrect).map(a => a.question.item);
    if (mistakes.length === 0) return;

    const fullPool = [...n5Data.hiragana, ...n5Data.katakana];
    const generated = generateKanaQuiz(mistakes, fullPool, mistakes.length, selectedMode);
    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setQuizState('active');

    if (generated[0]) {
      setTimeout(() => {
        audioService.speak(generated[0].audioText);
      }, 300);
    }
  };

  const currentQ = questions[currentIndex];
  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const mistakes = userAnswers.filter(a => !a.isCorrect);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-sm">
            <Grid size={16} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Kana Practice Drill</h2>
            <p className="text-xs text-slate-400">Master Hiragana and Katakana character recognition & pronunciation</p>
          </div>
        </div>

        {onBackToSoundboard && (
          <button
            onClick={onBackToSoundboard}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-colors"
          >
            ← Back to Soundboard
          </button>
        )}
      </div>

      {/* SETUP SCREEN */}
      {quizState === 'setup' && (
        <div className="glass-panel-glow border-pink-500/25 p-6 md:p-8 rounded-3xl space-y-8 bg-slate-900/90 shadow-2xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-bold">
              <Sliders size={13} />
              <span>CONFIGURE KANA DRILL</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Hiragana & Katakana Practice</h1>
            <p className="text-xs text-slate-400">
              Select your target Japanese script, syllable category, and testing mode.
            </p>
          </div>

          {/* Script Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-pink-400" />
              <span>Target Script:</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'hiragana', title: 'Hiragana', sub: 'ひらがな (あいうえお)', count: n5Data.hiragana.length },
                { id: 'katakana', title: 'Katakana', sub: 'カタカナ (アイウエオ)', count: n5Data.katakana.length },
                { id: 'mixed', title: 'Mixed Both', sub: 'Hiragana & Katakana', count: n5Data.hiragana.length + n5Data.katakana.length }
              ].map((s) => {
                const isSelected = selectedScript === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedScript(s.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-pink-500/20 border-pink-500 text-white shadow-md shadow-pink-500/10'
                        : 'bg-slate-800/60 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-extrabold">{s.title}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-pink-300">
                        {s.count}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-jp">{s.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group / Category Filter */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Filter size={14} className="text-pink-400" />
              <span>Syllable Category:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'all', label: 'All Characters', desc: 'Complete syllable set' },
                { id: 'basic', label: 'Basic 46 (五十音)', desc: 'Pure sounds (あ〜ん)' },
                { id: 'dakuten', label: 'Dakuten (濁音)', desc: 'Voiced sounds (が〜ぽ)' },
                { id: 'yoon', label: 'Yōon (拗音)', desc: 'Combos (きゃ〜ぴょ)' }
              ].map((g) => {
                const isSelected = selectedGroup === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroup(g.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-pink-500/20 border-pink-500 text-white shadow-sm'
                        : 'bg-slate-800/50 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold">{g.label}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{g.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders size={14} className="text-pink-400" />
              <span>Exercise Mode:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'kana_to_romaji', label: 'Kana → Romaji', desc: 'Read Kana, choose Romanization' },
                { id: 'romaji_to_kana', label: 'Romaji → Kana', desc: 'Read Romaji, choose Kana symbol' },
                { id: 'audio', label: 'Listening Drill', desc: 'Hear sound, pick matching Kana' }
              ].map((m) => {
                const isSelected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMode(m.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-pink-500/20 border-pink-500 text-white shadow-sm'
                        : 'bg-slate-800/50 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} className="text-pink-400" />
              <span>Question Count:</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[10, 15, 25, 46, 'all'].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    questionCount === cnt
                      ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-500/20'
                      : 'bg-slate-800/70 border-white/5 text-slate-300 hover:border-white/20'
                  }`}
                >
                  {cnt === 'all' ? 'All Kana' : `${cnt} Questions`}
                </button>
              ))}
            </div>
          </div>

          {/* Start CTA */}
          <button
            onClick={() => startQuiz()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold text-sm shadow-xl shadow-pink-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5"
          >
            <Play size={18} className="fill-white" />
            <span>Start Kana Practice Quiz</span>
          </button>
        </div>
      )}

      {/* ACTIVE QUIZ SCREEN */}
      {quizState === 'active' && currentQ && (
        <div className="space-y-6">
          {/* Header */}
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between text-xs border-pink-500/20">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-white">
                Question {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-pink-300 font-semibold uppercase">
                {selectedScript} ({selectedGroup})
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

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          {/* Question Card */}
          <div className="glass-panel-glow border-pink-500/30 p-8 rounded-3xl bg-slate-900/90 text-center space-y-4 shadow-xl">
            <div className="text-xs font-bold text-pink-400 uppercase tracking-wider">
              {currentQ.subPrompt}
            </div>

            {/* Prompt */}
            <div className="py-2">
              <div className={`font-black text-white font-jp ${
                selectedMode === 'romaji_to_kana' ? 'text-4xl sm:text-5xl font-mono' : 'text-7xl sm:text-8xl text-pink-300'
              }`}>
                {currentQ.prompt}
              </div>
            </div>

            {/* Pronunciation Button */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <AudioButton text={currentQ.audioText} label="Replay Audio" size="md" />
            </div>
          </div>

          {/* Options Grid (4 MCQs) */}
          <div className="grid grid-cols-2 gap-3.5">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQ.correctAnswer;

              let btnClass = 'bg-slate-800/80 hover:bg-slate-700/80 border-white/10 text-slate-100';

              if (isAnswered) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-500/25 border-emerald-500 text-emerald-200 font-black shadow-lg shadow-emerald-500/20';
                } else if (isSelected) {
                  btnClass = 'bg-rose-500/25 border-rose-500 text-rose-200 font-black shadow-lg shadow-rose-500/20';
                } else {
                  btnClass = 'bg-slate-900/50 border-white/5 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  disabled={isAnswered}
                  className={`p-5 rounded-2xl border text-center transition-all group ${btnClass}`}
                >
                  <div className={`font-black ${
                    selectedMode === 'kana_to_romaji' ? 'text-xl font-mono' : 'text-4xl font-jp text-pink-200'
                  }`}>
                    {option}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                    Option {String.fromCharCode(65 + idx)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          {isAnswered && (
            <div className="pt-2 animate-fadeIn">
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-extrabold text-sm shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2"
              >
                <span>{currentIndex + 1 < questions.length ? 'Next Character' : 'View Results'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* RESULTS SCREEN */}
      {quizState === 'result' && (
        <div className="glass-panel-glow border-pink-500/30 p-6 md:p-8 rounded-3xl space-y-8 bg-slate-900/90 shadow-2xl animate-fadeIn">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-pink-500/30">
              <Trophy size={32} />
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white">Kana Practice Complete!</h1>
            <p className="text-xs text-slate-400">
              {selectedScript.toUpperCase()} ({selectedGroup}) • {questions.length} Characters Tested
            </p>
          </div>

          {/* Score Banner */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="text-2xl md:text-3xl font-black text-pink-400">
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
              className="flex-1 py-3.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
            >
              <RotateCcw size={15} />
              <span>Drill Again</span>
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
              Change Settings
            </button>
          </div>

          {/* Mistakes Review */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Character Review</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {userAnswers.length}
                </span>
              </h3>

              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    reviewFilter === 'all' ? 'bg-pink-500 text-white' : 'text-slate-400'
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {userAnswers
                .filter(a => reviewFilter === 'all' || !a.isCorrect)
                .map((ans, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      ans.isCorrect
                        ? 'bg-slate-800/40 border-white/5'
                        : 'bg-rose-500/10 border-rose-500/30'
                    }`}
                  >
                    <div>
                      <div className="text-2xl font-black text-white font-jp">
                        {ans.question.item.kana}
                      </div>
                      <div className="text-xs font-mono text-pink-300 font-bold">
                        {ans.question.item.romaji}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <AudioButton text={ans.question.item.kana} size="sm" />
                      {!ans.isCorrect && (
                        <span className="text-[10px] text-rose-400 line-through">
                          {ans.selected}
                        </span>
                      )}
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

