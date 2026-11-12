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

  // Sync audio speed if changed externally
  useEffect(() => {
    if (currentRate) {
      setAudioSpeed(currentRate);
    }
  }, [currentRate]);

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
    setCardIndex(startIndex);

    const token = Date.now();
    playbackTokenRef.current = token;

    runAudioLoop(startIndex, token);
  };

  const runAudioLoop = async (index, token) => {
    if (index >= filteredWords.length) {
      if (isLooping && filteredWords.length > 0) {
        setCurrentAudioIndex(0);
        setCardIndex(0);
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
    setCardIndex(index);
    const word = filteredWords[index];
    if (!word) return;

    // Update Mobile Lock Screen / Notification Media Controls
    const mediaTitle = practiceDirection === 'en_to_jp'
      ? `🇬🇧 ${word.english}`
      : `${word.japanese || word.kana}${word.romaji ? ` (${word.romaji})` : ''}`;
    const mediaArtist = practiceDirection === 'en_to_jp'
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
      if (practiceDirection === 'en_to_jp') {
        // Mode 2: English first, recall gap, then Japanese word
        // 1. Speak English definition
        setAudioPhase('english');
        await audioService.speakEnglish(word.english, audioSpeed);

        if (playbackTokenRef.current !== token) return;

        // 2. Hardware silence pause for recall gap (learner recalls Japanese word)
        setAudioPhase('delay');
        await audioService.playSilence(recallDelaySec);

        if (playbackTokenRef.current !== token) return;

        // 3. Speak Japanese word
        setAudioPhase('japanese');
        await audioService.speak(word.japanese || word.kana, audioSpeed);

        if (playbackTokenRef.current !== token) return;

        // 4. Brief silence between words
        setAudioPhase('between');
        await audioService.playSilence(1.0);

        if (playbackTokenRef.current !== token) return;
      } else {
        // Mode 1: Japanese first, recall gap, then English meaning
        // 1. Speak Japanese word (HTML5 audio stream - mobile background compatible)
        setAudioPhase('japanese');
        await audioService.speak(word.japanese || word.kana, audioSpeed);

        if (playbackTokenRef.current !== token) return;

        // 2. Hardware silence pause for recall gap (learner recalls English meaning)
        setAudioPhase('delay');
        await audioService.playSilence(recallDelaySec);

        if (playbackTokenRef.current !== token) return;

        // 3. Speak English definition (HTML5 audio stream + Web Speech fallback)
        setAudioPhase('english');
        await audioService.speakEnglish(word.english, audioSpeed);

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
      <div className="glass-panel p-6 rounded-3xl border-white/10 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Vocabulary Studio</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold">
                {filteredWords.length} Words in Pool
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{currentTitle}</h1>
            <p className="text-xs text-slate-400">Select chapters below to customize your study pool or start continuous audio playback.</p>
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-lg transition-all ${
                isAudioPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25 hover:scale-[1.02]'
              }`}
            >
              <Headphones size={15} />
              <span>{isAudioPlaying ? 'Pause Audio Player' : '🎧 Listen & Learn (Autoplay)'}</span>
            </button>

            {/* Practice Quiz */}
            <button
              onClick={() => onStartPractice({ chapters: selectedChapters, count: 15 })}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all"
            >
              <Play size={14} className="fill-white" />
              <span>Practice Quiz</span>
            </button>

            {/* View Toggle */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-white/5 text-xs">
              <button
                onClick={() => setViewMode('flashcard')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === 'flashcard' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === 'grid' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List size={13} />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= MULTI-CHAPTER SELECTION TOOLBAR ================= */}
        <div className="pt-3 border-t border-white/5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <span>Select Chapters to Include:</span>
              <span className="text-[11px] text-slate-400 font-normal">
                ({selectedChapters.length} active • {chapterWords.length} words total)
              </span>
            </span>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={selectAllChapters}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all ${
                  selectedChapters.length === 24 && includeAdverbs
                    ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                🌸 All 24 Ch
              </button>
              <button
                onClick={selectBasic1}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all ${
                  selectedChapters.length === 11 && selectedChapters.every(c => c <= 11)
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                📗 Basic 1 (1–11)
              </button>
              <button
                onClick={selectBasic2}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all ${
                  selectedChapters.length === 13 && selectedChapters.every(c => c >= 12)
                    ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                📘 Basic 2 (12–24)
              </button>
              <button
                onClick={() => setIncludeAdverbs(!includeAdverbs)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all ${
                  includeAdverbs
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                🏷️ + Adverbs {includeAdverbs ? '✓' : ''}
              </button>
              <button
                onClick={clearSelection}
                className="px-2 py-1 rounded-lg font-semibold text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
              >
                Clear
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-rose-500 border-rose-400 text-white shadow-md shadow-rose-500/20'
                      : 'bg-slate-800/60 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span>Ch {ch}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-rose-700/60 text-rose-100' : 'bg-slate-700/60 text-slate-400'
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
        <div className="glass-panel-glow border-emerald-500/30 p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 shadow-2xl space-y-4 animate-fadeIn">
          {/* Header & Status Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                isAudioPlaying ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-pulse' : 'bg-slate-800 text-slate-400'
              }`}>
                <Headphones size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">Continuous Audio Reader</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    audioPhase === 'japanese' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' :
                    audioPhase === 'delay' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    audioPhase === 'english' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 animate-pulse' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {audioPhase === 'japanese' ? '🇯🇵 Reading Japanese' :
                     audioPhase === 'delay' ? (
                       practiceDirection === 'en_to_jp'
                         ? `⏳ Recall Japanese (${recallDelaySec}s)`
                         : `⏳ Guess Meaning (${recallDelaySec}s)`
                     ) :
                     audioPhase === 'english' ? '🇬🇧 Reading English Meaning' :
                     isAudioPaused ? '⏸️ Paused' : 'Ready'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Word {currentAudioIndex + 1} of {filteredWords.length} • {Math.round(((currentAudioIndex + 1) / filteredWords.length) * 100)}% Complete
                </div>
              </div>
            </div>

            {/* Quick Player Settings */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Practice Direction Toggle (JP->EN vs EN->JP) */}
              <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-white/5">
                <span className="text-slate-400 text-[11px] px-1 font-medium">Order:</span>
                <button
                  onClick={() => setPracticeDirection('jp_to_en')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                    practiceDirection === 'jp_to_en'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Practice Japanese to English (Japanese spoken first, then English)"
                >
                  <span>🇯🇵 ➔ 🇬🇧</span>
                  <span className="hidden sm:inline">JP ➔ EN</span>
                </button>
                <button
                  onClick={() => setPracticeDirection('en_to_jp')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                    practiceDirection === 'en_to_jp'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Practice English to Japanese (English spoken first, then Japanese)"
                >
                  <span>🇬🇧 ➔ 🇯🇵</span>
                  <span className="hidden sm:inline">EN ➔ JP</span>
                </button>
              </div>

              {/* Speed selector (0.75x to 2.0x) */}
              <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-white/5">
                <span className="text-slate-400 text-[11px] px-1 font-medium">Speed:</span>
                {[
                  { val: 0.75, label: '0.75x' },
                  { val: 1.0, label: '1.0x' },
                  { val: 1.25, label: '1.25x' },
                  { val: 1.5, label: '1.5x' },
                  { val: 2.0, label: '2.0x' }
                ].map(s => (
                  <button
                    key={s.val}
                    onClick={() => {
                      setAudioSpeed(s.val);
                      audioService.setRate(s.val);
                      if (setCurrentRate) setCurrentRate(s.val);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                      Math.abs(audioSpeed - s.val) < 0.05
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Delay selector */}
              <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-white/5">
                <span className="text-slate-400 text-[11px]">Recall Gap:</span>
                {[1.0, 1.5, 2.5].map(sec => (
                  <button
                    key={sec}
                    onClick={() => setRecallDelaySec(sec)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                      recallDelaySec === sec ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              {/* Loop Toggle */}
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold border transition-all ${
                  isLooping 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-slate-800/80 text-slate-400 border-white/5 hover:text-white'
                }`}
                title="Repeat playlist continuously"
              >
                <Repeat size={12} />
                <span>Loop {isLooping ? 'ON' : 'OFF'}</span>
              </button>

              {/* Close Bar */}
              <button
                onClick={stopListenLearn}
                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Close player"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Large Currently Playing Display */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {currentAudioWord.chapterOrigin || 'Word'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 font-medium">
                  {practiceDirection === 'en_to_jp' ? '🇬🇧 English ➔ 🇯🇵 Japanese' : '🇯🇵 Japanese ➔ 🇬🇧 English'}
                </span>
                {currentAudioWord.romaji && (
                  <span className="text-xs text-rose-300 font-sans">
                    {currentAudioWord.romaji}
                  </span>
                )}
              </div>
              {practiceDirection === 'en_to_jp' ? (
                <>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-200">
                    💬 {currentAudioWord.english}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-300 font-jp">
                    🇯🇵 {currentAudioWord.japanese || currentAudioWord.kana}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl sm:text-4xl font-black text-white font-jp">
                    {currentAudioWord.japanese || currentAudioWord.kana}
                  </div>
                  <div className="text-base sm:text-lg font-bold text-amber-200">
                    💬 {currentAudioWord.english}
                  </div>
                </>
              )}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                onClick={skipAudioPrev}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all border border-white/5"
                title="Previous Word"
              >
                <SkipBack size={16} />
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
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                title={isAudioPlaying ? 'Pause' : 'Play'}
              >
                {isAudioPlaying ? <Pause size={20} /> : <Play size={20} className="fill-white ml-0.5" />}
              </button>

              <button
                onClick={skipAudioNext}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all border border-white/5"
                title="Next Word"
              >
                <SkipForward size={16} />
              </button>

              <button
                onClick={stopListenLearn}
                className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all border border-white/5 ml-1"
                title="Stop Autoplay"
              >
                <Square size={14} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${Math.round(((currentAudioIndex + 1) / filteredWords.length) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* ================= VIEW 1: 3D FLASHCARD ================= */}
      {viewMode === 'flashcard' && currentWord ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Card {cardIndex + 1} of {filteredWords.length}</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showRomaji} 
                  onChange={(e) => setShowRomaji(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500"
                />
                <span>Show Romaji</span>
              </label>
              <button 
                onClick={() => toggleMastered(currentWord.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                  masteredList.includes(currentWord.id)
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                <Check size={12} />
                <span>{masteredList.includes(currentWord.id) ? 'Mastered' : 'Mark Mastered'}</span>
              </button>
            </div>
          </div>

          {/* The Flashcard */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)} 
            className="w-full h-80 card-perspective cursor-pointer select-none"
          >
            <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
              {/* Front of card: Japanese */}
              <div className="flashcard-front glass-panel-glow border-rose-500/30 bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                  <AudioButton text={currentWord.japanese || currentWord.kana} size="md" />
                </div>

                <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">
                  Tap to Reveal Meaning 🔄
                </div>

                <div className="text-4xl md:text-6xl font-black text-white font-jp tracking-wide py-2">
                  {currentWord.japanese || currentWord.kana}
                </div>

                {showRomaji && currentWord.romaji && (
                  <div className="text-sm md:text-base text-rose-300 font-medium mt-2">
                    {currentWord.romaji}
                  </div>
                )}

                {currentWord.chapterOrigin && (
                  <div className="mt-3 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-white/5">
                    {currentWord.chapterOrigin}
                  </div>
                )}
              </div>

              {/* Back of card: English & Details */}
              <div className="flashcard-back glass-panel-glow border-indigo-500/30 bg-gradient-to-br from-slate-900 to-indigo-950">
                <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                  <AudioButton text={currentWord.japanese || currentWord.kana} size="md" />
                </div>

                <div className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-4">
                  English Definition
                </div>

                <div className="text-2xl md:text-4xl font-extrabold text-white text-center px-4 leading-snug">
                  {currentWord.english}
                </div>

                <div className="mt-4 text-xs text-slate-400 font-jp flex items-center gap-2">
                  <span>Japanese: {currentWord.japanese || currentWord.kana}</span>
                  {currentWord.romaji && <span>• ({currentWord.romaji})</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Flashcard Navigation Footer */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevCard}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10 transition-all"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => {
                const randomIdx = Math.floor(Math.random() * filteredWords.length);
                setCardIndex(randomIdx);
                setIsFlipped(false);
              }}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1"
              title="Shuffle"
            >
              <Shuffle size={14} />
              <span>Random</span>
            </button>

            <button
              onClick={handleNextCard}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10 transition-all"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : null}

      {/* ================= VIEW 2: TABLE / GRID ================= */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search words by Japanese, English, or Romaji..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
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
                  className={`p-4 rounded-xl glass-panel border flex items-start justify-between gap-3 group transition-all cursor-pointer ${
                    isCurrentlyPlayingWord
                      ? 'border-emerald-400 bg-emerald-500/15 shadow-lg shadow-emerald-500/20 scale-[1.01]'
                      : 'border-white/5 hover:bg-slate-800/90 hover:border-white/15'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-jp text-lg">
                        {word.japanese || word.kana}
                      </span>
                      {word.chapterOrigin && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {word.chapterOrigin}
                        </span>
                      )}
                    </div>
                    {word.romaji && (
                      <div className="text-xs text-rose-300 font-sans">
                        {word.romaji}
                      </div>
                    )}
                    <div className="text-xs text-slate-300 font-medium">
                      {word.english}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleMastered(word.id)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        masteredList.includes(word.id)
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={masteredList.includes(word.id) ? 'Mastered' : 'Mark Mastered'}
                    >
                      <Check size={14} />
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
