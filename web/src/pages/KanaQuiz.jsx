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
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#c53d33]/15 text-[#e57a6f] border border-[#c53d33]/30 flex items-center justify-center font-bold">
            <span className="font-mincho">仮</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mincho text-[#e57a6f]">〔 五十音演習 〕</span>
              <h2 className="text-lg font-bold text-white tracking-tight">Kana Practice Drill</h2>
            </div>
            <p className="text-xs text-stone-400 font-jp">平仮名・片仮名の文字認識と音声リスニング演習</p>
          </div>
        </div>

        {onBackToSoundboard && (
          <button
            onClick={onBackToSoundboard}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#17171b] hover:bg-[#202026] text-stone-300 border border-white/5 transition-colors font-jp"
          >
            ← 五十音図へ戻る
          </button>
        )}
      </div>

      {/* SETUP SCREEN */}
      {quizState === 'setup' && (
        <div className="p-6 md:p-8 rounded-2xl bg-[#17171b] border border-white/5 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#c53d33]/10 border border-[#c53d33]/30 text-[#e57a6f] text-xs font-mincho font-medium">
              <Sliders size={12} />
              <span>演習設定 (KANA CONFIGURATION)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">平仮名・片仮名 演習設定</h1>
            <p className="text-xs text-stone-400 font-jp">
              対象とする文字種、音の分類、出題形式を選択して演習を開始できます。
            </p>
          </div>

          {/* Script Selection */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-stone-300 flex items-center gap-2 font-jp">
              <span className="w-5 h-5 rounded bg-[#c53d33] text-white flex items-center justify-center text-[11px] font-bold">1</span>
              <span>対象文字 (Target Script):</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'hiragana', title: '平仮名 (Hiragana)', sub: 'あいうえお', count: n5Data.hiragana.length },
                { id: 'katakana', title: '片仮名 (Katakana)', sub: 'アイウエオ', count: n5Data.katakana.length },
                { id: 'mixed', title: '混合 (Both)', sub: '平仮名 & 片仮名', count: n5Data.hiragana.length + n5Data.katakana.length }
              ].map((s) => {
                const isSelected = selectedScript === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedScript(s.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#222227] border-[#c53d33] text-white'
                        : 'bg-[#131316] border-white/5 text-stone-300 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold font-mincho">{s.title}</div>
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-white/5 text-stone-400">
                        {s.count}字
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1 font-mincho">{s.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group / Category Filter */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <label className="text-xs font-medium text-stone-300 flex items-center gap-2 font-jp">
              <span className="w-5 h-5 rounded bg-[#c53d33] text-white flex items-center justify-center text-[11px] font-bold">2</span>
              <span>音の分類 (Category):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'すべての音', desc: '全音セット' },
                { id: 'basic', label: '基本音 (46音)', desc: '清音 (あ〜ん)' },
                { id: 'dakuten', label: '濁音・半濁音', desc: 'が〜ぽ' },
                { id: 'yoon', label: '拗音 (33音)', desc: 'きゃ〜ぴょ' }
              ].map((g) => {
                const isSelected = selectedGroup === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroup(g.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-[#222227] border-[#c53d33] text-white'
                        : 'bg-[#131316] border-white/5 text-stone-300 hover:border-white/15'
                    }`}
                  >
                    <div className="text-xs font-bold font-jp">{g.label}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5 font-jp">{g.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <label className="text-xs font-medium text-stone-300 flex items-center gap-2 font-jp">
              <span className="w-5 h-5 rounded bg-[#c53d33] text-white flex items-center justify-center text-[11px] font-bold">3</span>
              <span>出題形式 (Mode):</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'kana_to_romaji', label: '仮名 ➔ ローマ字', desc: '文字を見て正しい発音・表記を選択' },
                { id: 'romaji_to_kana', label: 'ローマ字 ➔ 仮名', desc: 'ローマ字を見て該当する仮名を選択' },
                { id: 'audio', label: '🎧 音声聴解', desc: '音声を聴き、正しい仮名を選択' }
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
              <span className="w-5 h-5 rounded bg-[#c53d33] text-white flex items-center justify-center text-[11px] font-bold">4</span>
              <span>出題数:</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[10, 15, 25, 46, 'all'].map((cnt) => (
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
                  {cnt === 'all' ? '全問' : `${cnt}問`}
                </button>
              ))}
            </div>
          </div>

          {/* Start CTA */}
          <button
            onClick={() => startQuiz()}
            className="w-full py-3.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Play size={15} className="fill-white" />
            <span>五十音演習開始</span>
          </button>
        </div>
      )}

      {/* ACTIVE QUIZ SCREEN */}
      {quizState === 'active' && currentQ && (
        <div className="space-y-6 pb-12">
          {/* Header */}
          <div className="p-3.5 rounded-xl bg-[#17171b] border border-white/5 flex items-center justify-between text-xs font-jp">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">
                第 {currentIndex + 1} / {questions.length} 問
              </span>
              <span className="text-stone-500">•</span>
              <span className="text-[#e57a6f] uppercase font-mincho">
                {selectedScript} ({selectedGroup})
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

          {/* Progress Bar */}
          <div className="w-full h-1 bg-[#17171b] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#c53d33] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          {/* Question Card */}
          <div className="p-8 md:p-12 rounded-2xl bg-[#17171b] border border-white/5 text-center space-y-3">
            <div className="text-[11px] font-mincho text-[#e57a6f]">
              〔 {currentQ.subPrompt} 〕
            </div>

            {/* Prompt */}
            <div className="py-2">
              <div className={`font-bold text-white font-mincho ${
                selectedMode === 'romaji_to_kana' ? 'text-4xl sm:text-5xl font-mono' : 'text-7xl sm:text-8xl tracking-wider'
              }`}>
                {currentQ.prompt}
              </div>
            </div>

            {/* Pronunciation Button */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <AudioButton text={currentQ.audioText} label="音声を聴く" size="md" />
            </div>
          </div>

          {/* Options Grid (4 MCQs) */}
          <div className="grid grid-cols-2 gap-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQ.correctAnswer;

              let btnClass = 'bg-[#17171b] hover:bg-[#1e1e24] border-white/5 text-stone-100';

              if (isAnswered) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-950/20 border-emerald-500 text-emerald-300';
                } else if (isSelected) {
                  btnClass = 'bg-[#c53d33]/15 border-[#c53d33] text-[#e57a6f]';
                } else {
                  btnClass = 'bg-[#131316] border-white/5 text-stone-600 opacity-50';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  disabled={isAnswered}
                  className={`p-4 rounded-xl border text-center transition-all group ${btnClass}`}
                >
                  <div className={`font-bold ${
                    selectedMode === 'kana_to_romaji' ? 'text-xl font-mono' : 'text-4xl font-mincho text-white'
                  }`}>
                    {option}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1 uppercase font-mincho">
                    選択肢 {['ア', 'イ', 'ウ', 'エ'][idx]}
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
                className="w-full py-3.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{currentIndex + 1 < questions.length ? '次の文字へ' : '採点結果を表示'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* RESULTS SCREEN */}
      {quizState === 'result' && (
        <div className="p-8 rounded-2xl bg-[#17171b] border border-white/5 space-y-6 text-center animate-fadeIn pb-12">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-[#131316] text-[#e57a6f] border border-white/10 flex items-center justify-center mx-auto">
              <span className="font-mincho text-2xl font-bold">印</span>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight font-jp">五十音演習終了 (Complete)</h1>
            <p className="text-xs text-stone-400 font-jp">
              {selectedScript.toUpperCase()} ({selectedGroup}) • {questions.length}問 演習完了
            </p>
          </div>

          {/* Score Banner */}
          <div className="grid grid-cols-3 gap-3 text-center max-w-md mx-auto">
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
                <X size={14} />
                <span>誤答の{mistakes.length}文字を再挑戦</span>
              </button>
            )}

            <button
              onClick={() => setQuizState('setup')}
              className="px-4 py-2.5 rounded-xl bg-[#131316] hover:bg-[#1a1a20] text-stone-400 hover:text-white font-medium text-xs border border-white/5 transition-colors font-jp"
            >
              設定変更
            </button>
          </div>

          {/* Mistakes Review */}
          <div className="space-y-3 pt-4 border-t border-white/5 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-jp">
                <span>解答一覧 (Character Review)</span>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {userAnswers
                .filter(a => reviewFilter === 'all' || !a.isCorrect)
                .map((ans, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      ans.isCorrect
                        ? 'bg-[#131316] border-white/5'
                        : 'bg-[#131316] border-[#c53d33]/30'
                    }`}
                  >
                    <div>
                      <div className="text-2xl font-bold text-white font-mincho">
                        {ans.question.item.kana}
                      </div>
                      <div className="text-xs font-mono text-stone-400">
                        {ans.question.item.romaji}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <AudioButton text={ans.question.item.kana} size="sm" />
                      {!ans.isCorrect && (
                        <span className="text-[10px] text-[#e57a6f] line-through">
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

