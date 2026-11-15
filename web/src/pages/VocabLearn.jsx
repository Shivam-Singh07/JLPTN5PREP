import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Search, 
  Check, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Play, 
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Repeat,
  Headphones,
  CheckCircle2, 
  Sparkles,
  Layers,
  List,
  Sliders,
  CheckSquare,
  HelpCircle,
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import n5Data from '../data/n5Data';
import { storageService } from '../services/storageService';
import AudioButton from '../components/AudioButton';
import audioService from '../services/audioService';

export default function VocabLearn({ onStartPractice, activeChapter = 1, currentRate, setCurrentRate }) {
  // Multi-chapter selection state (array of chapter numbers: 1..24)
  const [selectedChapters, setSelectedChapters] = useState(() => {
    if (activeChapter === 'all') return Array.from({ length: 24 }, (_, i) => i + 1);
    if (activeChapter === 'adverbs') return [];
    const num = parseInt(activeChapter, 10);
    return isNaN(num) ? [1] : [num];
  });

  const [includeAdverbs, setIncludeAdverbs] = useState(() => activeChapter === 'all' || activeChapter === 'adverbs');
  const [viewMode, setViewMode] = useState('flashcard'); // 'flashcard' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showRomaji, setShowRomaji] = useState(true);
  const [masteredList, setMasteredList] = useState(storageService.getMasteredVocab());

  // ================= LISTEN & LEARN (AUTOPLAY AUDIO PLAYER) STATE =================
  const [isAudioModeOpen, setIsAudioModeOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [audioPhase, setAudioPhase] = useState('idle'); // 'idle' | 'japanese' | 'delay' | 'english' | 'between'
  const [recallDelaySec, setRecallDelaySec] = useState(1.5); // pause to let learner guess meaning
  const [audioSpeed, setAudioSpeed] = useState(currentRate || 1.0);
  const [practiceDirection, setPracticeDirection] = useState('jp_to_en'); // 'jp_to_en' | 'en_to_jp'
  const [isLooping, setIsLooping] = useState(false);

  // Synchronized refs to guarantee async loops always have the latest values without restart lags
  const practiceDirectionRef = useRef(practiceDirection);
  practiceDirectionRef.current = practiceDirection;

  const audioSpeedRef = useRef(audioSpeed);
  audioSpeedRef.current = audioSpeed;

  const recallDelaySecRef = useRef(recallDelaySec);
  recallDelaySecRef.current = recallDelaySec;

  const isLoopingRef = useRef(isLooping);
  isLoopingRef.current = isLooping;

  // Sync audio speed if changed externally
  useEffect(() => {
    if (currentRate) {
      setAudioSpeed(currentRate);
      audioSpeedRef.current = currentRate;
    }
  }, [currentRate]);

  // Handlers for instant settings updates
  const handleDirectionChange = (newDir) => {
    practiceDirectionRef.current = newDir;
    setPracticeDirection(newDir);
    if (isPlayingRef.current) {
      audioService.stop();
      startListenLearn(currentAudioIndex);
    }
  };

  const handleSpeedSelect = (newSpeed) => {
    audioSpeedRef.current = newSpeed;
    setAudioSpeed(newSpeed);
    audioService.setRate(newSpeed);
    if (setCurrentRate) setCurrentRate(newSpeed);
  };

  const handleRecallDelaySelect = (newDelay) => {
    recallDelaySecRef.current = newDelay;
    setRecallDelaySec(newDelay);
  };

  const handleLoopToggle = () => {
    setIsLooping(prev => {
      const nextVal = !prev;
      isLoopingRef.current = nextVal;
      return nextVal;
    });
  };

  // Cancellation token ref to prevent overlapping speech loops
  const playbackTokenRef = useRef(0);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isAudioPlaying && !isAudioPaused;

  // Chapter Toggle Handlers
  const toggleChapter = (chNum) => {
    stopListenLearn();
    setSelectedChapters(prev => {
      if (prev.includes(chNum)) {
        return prev.filter(c => c !== chNum);
      } else {
        return [...prev, chNum].sort((a, b) => a - b);
      }
    });
    setCardIndex(0);
  };

  const selectAllChapters = () => {
    stopListenLearn();
    setSelectedChapters(Array.from({ length: 24 }, (_, i) => i + 1));
    setIncludeAdverbs(true);
    setCardIndex(0);
  };

  const selectBasic1 = () => {
    stopListenLearn();
    setSelectedChapters(Array.from({ length: 11 }, (_, i) => i + 1));
    setIncludeAdverbs(false);
    setCardIndex(0);
  };

  const selectBasic2 = () => {
    stopListenLearn();
    setSelectedChapters(Array.from({ length: 13 }, (_, i) => i + 12));
    setIncludeAdverbs(false);
    setCardIndex(0);
  };

  const clearSelection = () => {
    stopListenLearn();
    setSelectedChapters([]);
    setIncludeAdverbs(false);
    setCardIndex(0);
  };

  // Get words for the selected chapters
  const chapterWords = useMemo(() => {
    let pool = [];

    selectedChapters.forEach(chNum => {
      const list = n5Data.chapterVocabMap[chNum] || [];
      pool = pool.concat(list.map(w => ({
        ...w,
        chapterOrigin: `Ch ${chNum}`
      })));
    });

    if (includeAdverbs) {
      const advs = (n5Data.adverbs || []).map(a => ({
        id: a.id,
        chapter: 'Adverbs',
        chapterOrigin: 'Adverbs',
        japanese: a.japanese,
        kana: a.japanese,
        romaji: '',
        english: a.english
      }));
      pool = pool.concat(advs);
    }

    return pool;
  }, [selectedChapters, includeAdverbs]);

  // Filtered by search
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return chapterWords;
    const q = searchQuery.toLowerCase();
    return chapterWords.filter(w => 
      (w.japanese && w.japanese.toLowerCase().includes(q)) ||
      (w.kana && w.kana.toLowerCase().includes(q)) ||
      (w.romaji && w.romaji.toLowerCase().includes(q)) ||
      (w.english && w.english.toLowerCase().includes(q))
    );
  }, [chapterWords, searchQuery]);

  const currentWord = filteredWords[cardIndex] || filteredWords[0] || null;
  const currentAudioWord = filteredWords[currentAudioIndex] || filteredWords[0] || null;

  const toggleMastered = (id) => {
    const updated = storageService.toggleMastered(id);
    setMasteredList([...updated]);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    if (cardIndex + 1 < filteredWords.length) {
      setCardIndex(cardIndex + 1);
    } else {
      setCardIndex(0); // loop
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    if (cardIndex > 0) {
      setCardIndex(cardIndex - 1);
    } else {
      setCardIndex(filteredWords.length - 1);
    }
  };

  // Sleep utility that respects cancellation token
  const cancellableSleep = (ms, token) => {
    return new Promise(resolve => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (playbackTokenRef.current !== token || !isPlayingRef.current) {
          clearInterval(interval);
          resolve(false);
        } else if (Date.now() - start >= ms) {
          clearInterval(interval);
          resolve(true);
        }
      }, 50);
    });
  };

  // ================= LISTEN & LEARN PLAYBACK LOOP =================
  const startListenLearn = (startIndex = currentAudioIndex) => {
    if (filteredWords.length === 0) return;

    setIsAudioModeOpen(true);
    setIsAudioPlaying(true);
    setIsAudioPaused(false);
    setCurrentAudioIndex(startIndex);

    const token = Date.now();
    playbackTokenRef.current = token;

    runAudioLoop(startIndex, token);
  };

  const runAudioLoop = async (index, token) => {
    if (index >= filteredWords.length) {
      if (isLoopingRef.current && filteredWords.length > 0) {
        setCurrentAudioIndex(0);
        runAudioLoop(0, token);
        return;
      } else {
        // Complete!
        stopListenLearn();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        return;
      }
    }

    if (playbackTokenRef.current !== token) return;

    setCurrentAudioIndex(index);
    const word = filteredWords[index];
    if (!word) return;

    const dir = practiceDirectionRef.current;
    const speed = audioSpeedRef.current;
    const recallGap = recallDelaySecRef.current;

    // Update Mobile Lock Screen / Notification Media Controls
    const mediaTitle = dir === 'en_to_jp'
      ? `🇬🇧 ${word.english}`
      : `${word.japanese || word.kana}${word.romaji ? ` (${word.romaji})` : ''}`;
    const mediaArtist = dir === 'en_to_jp'
      ? `🇯🇵 ${word.japanese || word.kana}${word.romaji ? ` (${word.romaji})` : ''}`
      : `💬 ${word.english}`;

    audioService.setMediaSession({
      title: mediaTitle,
      artist: mediaArtist,
      album: `${word.chapterOrigin || 'Lesson'} • JLPT N5 Master`,
      onPlay: () => resumeListenLearn(),
      onPause: () => pauseListenLearn(),
      onNext: () => skipAudioNext(),
      onPrev: () => skipAudioPrev()
    });

    try {
      if (dir === 'en_to_jp') {
        // Mode 2: English first, recall gap, then Japanese word
        // 1. Speak English definition
        setAudioPhase('english');
        await audioService.speakEnglish(word.english, speed);

        if (playbackTokenRef.current !== token) return;

        // 2. Hardware silence pause for recall gap (learner recalls Japanese word)
        setAudioPhase('delay');
        await audioService.playSilence(recallGap);

        if (playbackTokenRef.current !== token) return;

        // 3. Speak Japanese word
        setAudioPhase('japanese');
        await audioService.speak(word.japanese || word.kana, speed);

        if (playbackTokenRef.current !== token) return;

        // 4. Brief silence between words
        setAudioPhase('between');
        await audioService.playSilence(1.0);

        if (playbackTokenRef.current !== token) return;
      } else {
        // Mode 1: Japanese first, recall gap, then English meaning
        // 1. Speak Japanese word (HTML5 audio stream - mobile background compatible)
        setAudioPhase('japanese');
        await audioService.speak(word.japanese || word.kana, speed);

        if (playbackTokenRef.current !== token) return;

        // 2. Hardware silence pause for recall gap (learner recalls English meaning)
        setAudioPhase('delay');
        await audioService.playSilence(recallGap);

        if (playbackTokenRef.current !== token) return;

        // 3. Speak English definition (HTML5 audio stream + Web Speech fallback)
        setAudioPhase('english');
        await audioService.speakEnglish(word.english, speed);

        if (playbackTokenRef.current !== token) return;

        // 4. Brief silence between words (unthrottled by mobile OS)
        setAudioPhase('between');
        await audioService.playSilence(1.0);

        if (playbackTokenRef.current !== token) return;
      }

      // 5. Proceed to next word
      runAudioLoop(index + 1, token);
    } catch (err) {
      console.warn("Audio loop error recovered:", err);
      if (playbackTokenRef.current === token) {
        setTimeout(() => runAudioLoop(index + 1, token), 500);
      }
    }
  };

  const pauseListenLearn = () => {
    playbackTokenRef.current = 0; // stop current loop
    audioService.stop();
    setIsAudioPlaying(false);
    setIsAudioPaused(true);
    setAudioPhase('idle');
  };

  const resumeListenLearn = () => {
    startListenLearn(currentAudioIndex);
  };

  const stopListenLearn = () => {
    playbackTokenRef.current = 0;
    audioService.stop();
    setIsAudioPlaying(false);
    setIsAudioPaused(false);
    setAudioPhase('idle');
  };

  const skipAudioNext = () => {
    playbackTokenRef.current = 0;
    audioService.stop();
    const nextIdx = (currentAudioIndex + 1) < filteredWords.length ? currentAudioIndex + 1 : 0;
    startListenLearn(nextIdx);
  };

  const skipAudioPrev = () => {
    playbackTokenRef.current = 0;
    audioService.stop();
    const prevIdx = currentAudioIndex > 0 ? currentAudioIndex - 1 : filteredWords.length - 1;
    startListenLearn(prevIdx);
  };

  // Clean up audio on unmount or tab switch
  useEffect(() => {
    return () => {
      playbackTokenRef.current = 0;
      audioService.stop();
    };
  }, []);

  // Summary title
  const currentTitle = useMemo(() => {
    if (selectedChapters.length === 24 && includeAdverbs) return 'Whole JLPT N5 (All 24 Chapters + Adverbs)';
    if (selectedChapters.length === 24) return 'All 24 Lessons';
    if (selectedChapters.length === 0 && includeAdverbs) return 'N5 Essential Adverbs (60 Words)';
    if (selectedChapters.length === 1 && !includeAdverbs) {
      const ch = selectedChapters[0];
      return n5Data.chapterVocabMap[ch]?.[0]?.chapterTitle || `Chapter ${ch}`;
    }
    if (selectedChapters.length === 0) return 'No Chapters Selected';
    return `${selectedChapters.length} Selected Chapters (Ch ${selectedChapters.join(', ')}) ${includeAdverbs ? '+ Adverbs' : ''}`;
  }, [selectedChapters, includeAdverbs]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* ================= HEADER & STUDIO DASHBOARD ================= */}
      <div className="p-6 rounded-2xl bg-[#17171b] border border-white/5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mincho text-[#e57a6f]">〔 語彙学習 〕</span>
              <span className="text-[11px] px-2 py-0.5 rounded border border-white/10 bg-white/5 text-stone-300 font-medium font-jp">
                {filteredWords.length}語
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{currentTitle}</h1>
            <p className="text-xs text-stone-400 font-jp">学習したい課を選択し、単語カードまたは連続音声学習を開始できます。</p>
          </div>

          {/* Master Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* LISTEN & LEARN CTA */}
            <button
              onClick={() => {
                if (isAudioPlaying) {
                  pauseListenLearn();
                } else if (isAudioPaused) {
                  resumeListenLearn();
                } else {
                  startListenLearn(cardIndex || 0);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all border ${
                isAudioPlaying
                  ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                  : 'bg-[#222227] hover:bg-[#2c2c34] text-stone-200 border-white/5'
              }`}
            >
              <Headphones size={14} className={isAudioPlaying ? 'text-white' : 'text-[#e57a6f]'} />
              <span>{isAudioPlaying ? '一時停止 (Pause)' : '連続音声再生 (Autoplay)'}</span>
            </button>

            {/* Practice Quiz */}
            <button
              onClick={() => onStartPractice({ chapters: selectedChapters, count: 15 })}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white font-medium text-xs shadow-sm transition-all"
            >
              <Play size={13} className="fill-white" />
              <span>問題練習 (Quiz)</span>
            </button>

            {/* View Toggle */}
            <div className="flex items-center bg-[#131316] p-1 rounded-xl border border-white/5 text-xs">
              <button
                onClick={() => setViewMode('flashcard')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === 'flashcard' ? 'bg-[#222227] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span>カード</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === 'grid' ? 'bg-[#222227] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                <List size={13} />
                <span>一覧</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= MULTI-CHAPTER SELECTION TOOLBAR ================= */}
        <div className="pt-3 border-t border-white/5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-stone-300 flex items-center gap-1.5 font-jp">
              <span>学習範囲の選択:</span>
              <span className="text-[11px] text-stone-400 font-normal">
                ({selectedChapters.length}課 選択中 • 計{chapterWords.length}語)
              </span>
            </span>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={selectAllChapters}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] border transition-all ${
                  selectedChapters.length === 24 && includeAdverbs
                    ? 'bg-[#c53d33] text-white border-[#c53d33]'
                    : 'bg-[#18181c] text-stone-400 border-white/5 hover:text-white'
                }`}
              >
                全24課
              </button>
              <button
                onClick={selectBasic1}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] border transition-all ${
                  selectedChapters.length === 11 && selectedChapters.every(c => c <= 11)
                    ? 'bg-[#c53d33] text-white border-[#c53d33]'
                    : 'bg-[#18181c] text-stone-400 border-white/5 hover:text-white'
                }`}
              >
                初級1 (1–11)
              </button>
              <button
                onClick={selectBasic2}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] border transition-all ${
                  selectedChapters.length === 13 && selectedChapters.every(c => c >= 12)
                    ? 'bg-[#c53d33] text-white border-[#c53d33]'
                    : 'bg-[#18181c] text-stone-400 border-white/5 hover:text-white'
                }`}
              >
                初級2 (12–24)
              </button>
              <button
                onClick={() => setIncludeAdverbs(!includeAdverbs)}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] border transition-all ${
                  includeAdverbs
                    ? 'bg-[#222227] text-white border-white/20'
                    : 'bg-[#18181c] text-stone-400 border-white/5 hover:text-white'
                }`}
              >
                副詞 {includeAdverbs ? '✓' : ''}
              </button>
              <button
                onClick={clearSelection}
                className="px-2 py-1 rounded-lg font-medium text-[11px] text-stone-500 hover:text-stone-300 transition-colors"
              >
                解除
              </button>
            </div>
          </div>

          {/* Interactive Chapter Pills Grid */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {Array.from({ length: 24 }, (_, i) => i + 1).map(ch => {
              const isSelected = selectedChapters.includes(ch);
              const count = n5Data.chapterVocabMap[ch]?.length || 0;
              return (
                <button
                  key={ch}
                  onClick={() => toggleChapter(ch)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#c53d33] border-[#c53d33] text-white'
                      : 'bg-[#18181c] border-white/5 text-stone-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className="font-mincho">第{ch}課</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-black/20 text-white' : 'bg-white/5 text-stone-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= LISTEN & LEARN AUTOPLAY CONTROLLER CARD ================= */}
      {isAudioModeOpen && currentAudioWord && (
        <div className="p-5 rounded-2xl bg-[#17171b] border border-white/10 space-y-4 animate-fadeIn">
          {/* Header Row: Title & Stable Fixed-Width Status Pill */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold ${
                isAudioPlaying ? 'bg-[#c53d33] text-white animate-pulse' : 'bg-[#222227] text-stone-400'
              }`}>
                <Headphones size={15} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-white truncate font-jp">連続音声再生 (Audio Player)</div>
                <div className="text-xs text-stone-400 font-jp">
                  第 {currentAudioIndex + 1} / {filteredWords.length} 語 • {Math.round(((currentAudioIndex + 1) / filteredWords.length) * 100)}% 完了
                </div>
              </div>
            </div>

            {/* Stable Status Indicator & Close */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-40 sm:w-44 text-center shrink-0">
                <span className={`inline-block w-full text-[10px] font-medium font-jp px-2 py-1 rounded border text-center truncate ${
                  audioPhase === 'japanese' ? 'bg-[#c53d33]/15 text-[#e57a6f] border-[#c53d33]/30 animate-pulse' :
                  audioPhase === 'delay' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                  audioPhase === 'english' ? 'bg-white/10 text-white border-white/20 animate-pulse' :
                  isAudioPaused ? 'bg-[#222227] text-stone-400 border-white/5' :
                  'bg-[#222227] text-stone-400 border-white/5'
                }`}>
                  {audioPhase === 'japanese' ? '🇯🇵 日本語音声' :
                   audioPhase === 'delay' ? (practiceDirection === 'en_to_jp' ? `⏳ 想起 (${recallDelaySec}秒)` : `⏳ 推測 (${recallDelaySec}秒)`) :
                   audioPhase === 'english' ? '🇬🇧 英語解説' :
                   isAudioPaused ? '⏸️ 一時停止' : '待機中'}
                </span>
              </div>

              <button
                onClick={stopListenLearn}
                className="p-1 rounded-lg text-stone-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
                title="閉じる"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Player Settings */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs bg-[#131316] p-2.5 rounded-xl border border-white/5">
            <div className="flex flex-wrap items-center gap-2">
              {/* Practice Direction Toggle */}
              <div className="flex items-center gap-1 bg-[#1c1c20] p-1 rounded-lg border border-white/5 shrink-0">
                <span className="text-stone-400 text-[11px] px-1 font-jp">順序:</span>
                <button
                  onClick={() => handleDirectionChange('jp_to_en')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    practiceDirection === 'jp_to_en'
                      ? 'bg-[#c53d33] text-white'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="日本語から英語へ"
                >
                  日 ➔ 英
                </button>
                <button
                  onClick={() => handleDirectionChange('en_to_jp')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    practiceDirection === 'en_to_jp'
                      ? 'bg-[#c53d33] text-white'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="英語から日本語へ"
                >
                  英 ➔ 日
                </button>
              </div>

              {/* Speed selector */}
              <div className="flex items-center gap-1 bg-[#1c1c20] p-1 rounded-lg border border-white/5 shrink-0">
                <span className="text-stone-400 text-[11px] px-1 font-jp">速度:</span>
                {[
                  { val: 0.75, label: '0.75x' },
                  { val: 1.0, label: '1.0x' },
                  { val: 1.25, label: '1.25x' },
                  { val: 1.5, label: '1.5x' },
                  { val: 2.0, label: '2.0x' }
                ].map(s => (
                  <button
                    key={s.val}
                    onClick={() => handleSpeedSelect(s.val)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                      Math.abs(audioSpeed - s.val) < 0.05
                        ? 'bg-[#c53d33] text-white'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Recall Gap Selector */}
              <div className="flex items-center gap-1 bg-[#1c1c20] px-2 py-1 rounded-lg border border-white/5 shrink-0">
                <span className="text-stone-400 text-[11px] font-jp">待機間隔:</span>
                {[1.0, 1.5, 2.5].map(sec => (
                  <button
                    key={sec}
                    onClick={() => handleRecallDelaySelect(sec)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                      recallDelaySec === sec ? 'bg-[#c53d33] text-white' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {sec}秒
                  </button>
                ))}
              </div>
            </div>

            {/* Loop Toggle */}
            <button
              onClick={handleLoopToggle}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium border text-xs transition-all shrink-0 ${
                isLooping 
                  ? 'bg-[#c53d33]/20 text-[#e57a6f] border-[#c53d33]/40' 
                  : 'bg-[#1c1c20] text-stone-400 border-white/5 hover:text-white'
              }`}
            >
              <Repeat size={12} />
              <span>反復 {isLooping ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Large Currently Playing Display */}
          <div className="p-4 rounded-xl bg-[#131316] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 min-h-[120px]">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-stone-300 font-mono shrink-0">
                  {currentAudioWord.chapterOrigin || 'Word'}
                </span>
                {currentAudioWord.romaji && (
                  <span className="text-xs text-stone-400 font-sans truncate">
                    {currentAudioWord.romaji}
                  </span>
                )}
              </div>

              {/* Japanese Word Slot */}
              <div className={`text-2xl sm:text-3xl font-bold font-mincho transition-colors duration-200 ${
                audioPhase === 'japanese' ? 'text-[#e57a6f]' : 'text-white'
              }`}>
                {currentAudioWord.japanese || currentAudioWord.kana}
              </div>

              {/* English Meaning Slot */}
              <div className={`text-base font-medium transition-colors duration-200 ${
                audioPhase === 'english' ? 'text-white' : 'text-stone-300'
              }`}>
                {currentAudioWord.english}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                onClick={skipAudioPrev}
                className="w-9 h-9 rounded-xl bg-[#1c1c20] hover:bg-[#26262c] text-stone-300 flex items-center justify-center transition-all border border-white/5"
                title="前へ"
              >
                <SkipBack size={15} />
              </button>

              <button
                onClick={() => {
                  if (isAudioPlaying) {
                    pauseListenLearn();
                  } else if (isAudioPaused) {
                    resumeListenLearn();
                  } else {
                    startListenLearn(currentAudioIndex);
                  }
                }}
                className="w-10 h-10 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white flex items-center justify-center shadow-sm transition-all"
                title={isAudioPlaying ? '一時停止' : '再生'}
              >
                {isAudioPlaying ? <Pause size={17} /> : <Play size={17} className="fill-white ml-0.5" />}
              </button>

              <button
                onClick={skipAudioNext}
                className="w-9 h-9 rounded-xl bg-[#1c1c20] hover:bg-[#26262c] text-stone-300 flex items-center justify-center transition-all border border-white/5"
                title="次へ"
              >
                <SkipForward size={15} />
              </button>

              <button
                onClick={stopListenLearn}
                className="w-9 h-9 rounded-xl bg-[#1c1c20] hover:bg-[#c53d33]/20 text-stone-400 hover:text-[#e57a6f] flex items-center justify-center transition-all border border-white/5 ml-1"
                title="停止"
              >
                <Square size={13} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full bg-[#131316] overflow-hidden">
            <div 
              className="h-full bg-[#c53d33] transition-all duration-300"
              style={{ width: `${Math.round(((currentAudioIndex + 1) / filteredWords.length) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* ================= VIEW 1: 3D FLASHCARD (JAPANESE TANGOCHO) ================= */}
      {viewMode === 'flashcard' && currentWord ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-xs text-stone-400 px-1 font-jp">
            <span>第 {cardIndex + 1} / {filteredWords.length} 枚</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showRomaji} 
                  onChange={(e) => setShowRomaji(e.target.checked)}
                  className="rounded border-stone-700 bg-stone-900 text-[#c53d33] focus:ring-[#c53d33]"
                />
                <span>ローマ字 (Romaji)</span>
              </label>
              <button 
                onClick={() => toggleMastered(currentWord.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                  masteredList.includes(currentWord.id)
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-stone-400 border-white/10 hover:text-white'
                }`}
              >
                <Check size={12} />
                <span>{masteredList.includes(currentWord.id) ? '習得済 (Mastered)' : '習得済みにする'}</span>
              </button>
            </div>
          </div>

          {/* The Flashcard - Modern Japanese Tangocho Template */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)} 
            className="w-full h-84 card-perspective cursor-pointer select-none group"
          >
            <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
              {/* Front of card: Japanese */}
              <div className="flashcard-front bg-gradient-to-b from-[#19191e] to-[#141417] border border-white/10 group-hover:border-white/20 rounded-3xl relative shadow-2xl p-6 sm:p-8 flex flex-col justify-between">
                {/* Traditional Tangocho Ring Binder Grommet */}
                <div className="w-5 h-5 rounded-full bg-[#121214] border-2 border-white/25 shadow-inner absolute top-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                </div>

                <div className="w-full flex items-center justify-between pt-2">
                  <span className="hanko-badge text-[10px]">
                    〔 日本語単語 〕
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <AudioButton text={currentWord.japanese || currentWord.kana} size="md" />
                  </div>
                </div>

                <div className="text-center my-auto py-2">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white font-mincho tracking-wider">
                    {currentWord.japanese || currentWord.kana}
                  </div>

                  {showRomaji && currentWord.romaji && (
                    <div className="text-sm md:text-base text-stone-400 font-sans mt-3 tracking-wide">
                      {currentWord.romaji}
                    </div>
                  )}

                  {currentWord.chapterOrigin && (
                    <div className="mt-4 inline-block text-[10px] px-3 py-0.5 rounded-full bg-white/5 text-stone-400 border border-white/5 font-jp">
                      {currentWord.chapterOrigin}
                    </div>
                  )}
                </div>

                <div className="w-full text-center pb-1">
                  <span className="text-[11px] text-stone-500 font-mincho tracking-wider">
                    「 タップして英訳を表示 • Click to flip 」
                  </span>
                </div>
              </div>

              {/* Back of card: English & Details */}
              <div className="flashcard-back bg-gradient-to-b from-[#1c1c22] to-[#16161a] border border-white/10 group-hover:border-white/20 rounded-3xl relative shadow-2xl p-6 sm:p-8 flex flex-col justify-between">
                {/* Traditional Tangocho Ring Binder Grommet */}
                <div className="w-5 h-5 rounded-full bg-[#121214] border-2 border-white/25 shadow-inner absolute top-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                </div>

                <div className="w-full flex items-center justify-between pt-2">
                  <span className="hanko-badge text-[10px]">
                    〔 英語解説 〕
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <AudioButton text={currentWord.japanese || currentWord.kana} size="md" />
                  </div>
                </div>

                <div className="text-center my-auto py-2 space-y-2">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-snug px-4">
                    {currentWord.english}
                  </div>

                  <div className="pt-2 text-xs text-stone-300 font-jp flex items-center justify-center gap-2">
                    <span className="font-mincho text-white font-medium text-sm">
                      {currentWord.japanese || currentWord.kana}
                    </span>
                    {currentWord.romaji && (
                      <span className="text-stone-400 font-sans">({currentWord.romaji})</span>
                    )}
                  </div>
                </div>

                <div className="w-full text-center pb-1">
                  <span className="text-[11px] text-stone-500 font-mincho tracking-wider">
                    「 タップして表面へ戻る • Click to flip back 」
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Flashcard Navigation Footer */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevCard}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1c1c20] hover:bg-[#26262c] text-stone-200 font-medium text-xs border border-white/5 transition-all"
            >
              <ChevronLeft size={15} />
              <span>前へ (Prev)</span>
            </button>

            <button
              onClick={() => {
                const randomIdx = Math.floor(Math.random() * filteredWords.length);
                setCardIndex(randomIdx);
                setIsFlipped(false);
              }}
              className="p-2.5 rounded-xl bg-[#1c1c20] hover:bg-[#26262c] text-stone-400 hover:text-white border border-white/5 text-xs font-medium flex items-center gap-1"
              title="ランダム"
            >
              <Shuffle size={13} />
              <span>ランダム</span>
            </button>

            <button
              onClick={handleNextCard}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1c1c20] hover:bg-[#26262c] text-stone-200 font-medium text-xs border border-white/5 transition-all"
            >
              <span>次へ (Next)</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      ) : null}

      {/* ================= VIEW 2: TABLE / GRID ================= */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-3.5 text-stone-500" />
            <input
              type="text"
              placeholder="日本語・英語・ローマ字で単語を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#17171b] border border-white/10 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c53d33]"
            />
          </div>

          {/* Words List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredWords.map((word, idx) => {
              const isCurrentlyPlayingWord = isAudioModeOpen && currentAudioIndex === idx;

              return (
                <div
                  key={word.id}
                  onClick={() => {
                    if (isAudioModeOpen) {
                      startListenLearn(idx);
                    }
                  }}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 group transition-all cursor-pointer ${
                    isCurrentlyPlayingWord
                      ? 'border-[#c53d33] bg-[#c53d33]/10'
                      : 'border-white/5 bg-[#17171b] hover:bg-[#1e1e24] hover:border-white/15'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mincho text-base">
                        {word.japanese || word.kana}
                      </span>
                      {word.chapterOrigin && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-stone-400 font-jp">
                          {word.chapterOrigin}
                        </span>
                      )}
                    </div>
                    {word.romaji && (
                      <div className="text-[11px] text-stone-400 font-sans">
                        {word.romaji}
                      </div>
                    )}
                    <div className="text-xs text-stone-300 font-medium">
                      {word.english}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleMastered(word.id)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        masteredList.includes(word.id)
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-stone-600 hover:text-stone-400'
                      }`}
                      title={masteredList.includes(word.id) ? '習得済' : '習得済みにする'}
                    >
                      <Check size={13} />
                    </button>
                    <AudioButton text={word.japanese || word.kana} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
