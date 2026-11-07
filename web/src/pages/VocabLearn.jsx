import React, { useState, useMemo } from 'react';
import { 
  Volume2, 
  Search, 
  Check, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Play, 
  CheckCircle2, 
  Sparkles,
  Layers,
  List
} from 'lucide-react';
import n5Data from '../data/n5Data';
import { storageService } from '../services/storageService';
import AudioButton from '../components/AudioButton';
import audioService from '../services/audioService';

export default function VocabLearn({ onStartPractice, activeChapter = 1 }) {
  const [selectedChapter, setSelectedChapter] = useState(activeChapter);
  const [viewMode, setViewMode] = useState('flashcard'); // 'flashcard' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showRomaji, setShowRomaji] = useState(true);
  const [masteredList, setMasteredList] = useState(storageService.getMasteredVocab());

  // Get words for the selected chapter or scope
  const chapterWords = useMemo(() => {
    let pool = [];
    if (selectedChapter === 'adverbs') {
      pool = n5Data.adverbs.map(a => ({
        id: a.id,
        chapter: 'Adverbs',
        japanese: a.japanese,
        kana: a.japanese,
        romaji: '',
        english: a.english
      }));
    } else if (selectedChapter === 'all') {
      pool = n5Data.allVocab;
    } else {
      pool = n5Data.chapterVocabMap[selectedChapter] || [];
    }
    return pool;
  }, [selectedChapter]);

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

  const currentTitle = selectedChapter === 'adverbs' 
    ? 'N5 Essential Adverbs' 
    : selectedChapter === 'all' 
    ? 'All N5 Vocabulary' 
    : n5Data.chapterVocabMap[selectedChapter]?.[0]?.chapterTitle || `Chapter ${selectedChapter}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Chapter Selector & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 glass-panel rounded-2xl">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-400">Vocabulary Studio</div>
          <h1 className="text-2xl font-black text-white">{currentTitle}</h1>
          <p className="text-xs text-slate-400">{filteredWords.length} words in this collection</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Practice Quiz Shortcut */}
          <button
            onClick={() => onStartPractice({ chapter: selectedChapter, mode: 'jp_to_en', count: 15 })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all"
          >
            <Play size={14} className="fill-white" />
            <span>Practice This Chapter Quiz</span>
          </button>

          {/* View mode toggle */}
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

      {/* Chapter Pill Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => { setSelectedChapter('all'); setCardIndex(0); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            selectedChapter === 'all'
              ? 'bg-rose-500 border-rose-400 text-white shadow-sm'
              : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          All (1300+)
        </button>

        <button
          onClick={() => { setSelectedChapter('adverbs'); setCardIndex(0); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            selectedChapter === 'adverbs'
              ? 'bg-rose-500 border-rose-400 text-white shadow-sm'
              : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          Adverbs (60)
        </button>

        {Array.from({ length: 24 }, (_, i) => i + 1).map(ch => (
          <button
            key={ch}
            onClick={() => { setSelectedChapter(ch); setCardIndex(0); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedChapter === ch
                ? 'bg-rose-500 border-rose-400 text-white shadow-sm'
                : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Ch {ch}
          </button>
        ))}
      </div>

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
            {filteredWords.map((word) => (
              <div
                key={word.id}
                className="p-4 rounded-xl glass-panel hover:bg-slate-800/90 border-white/5 hover:border-white/15 flex items-start justify-between gap-3 group transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-white font-jp text-lg">
                      {word.japanese || word.kana}
                    </span>
                    {word.romaji && (
                      <span className="text-xs text-rose-300 font-sans">
                        {word.romaji}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    {word.english}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

