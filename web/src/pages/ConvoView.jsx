import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Play, 
  Pause, 
  RotateCcw, 
  Mic, 
  User, 
  Volume2, 
  Sparkles 
} from 'lucide-react';
import n5Data from '../data/n5Data';
import AudioButton from '../components/AudioButton';
import audioService from '../services/audioService';

export default function ConvoView() {
  const [selectedConvoId, setSelectedConvoId] = useState(n5Data.conversations[0]?.id || '');
  const [playingIndex, setPlayingIndex] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [roleplayCharacter, setRoleplayCharacter] = useState(null); // e.g. "Miller"
  const [showEnglish, setShowEnglish] = useState(true);
  const [showRomaji, setShowRomaji] = useState(true);

  const convo = n5Data.conversations.find(c => c.id === selectedConvoId) || n5Data.conversations[0];
  const lines = convo?.lines || [];

  // Get unique speakers in this dialogue
  const speakers = Array.from(new Set(lines.map(l => l.speaker.replace(/[:：]/g, '').trim()))).filter(Boolean);

  const stopAutoPlay = () => {
    setIsAutoPlaying(false);
    setPlayingIndex(-1);
    audioService.stop();
  };

  const startAutoPlay = async () => {
    setIsAutoPlaying(true);
    for (let i = 0; i < lines.length; i++) {
      setPlayingIndex(i);
      const line = lines[i];
      const speakerClean = line.speaker.replace(/[:：]/g, '').trim();

      // If in roleplay mode and this is user's character, give a pause for user to speak
      if (roleplayCharacter && speakerClean.toLowerCase().includes(roleplayCharacter.toLowerCase())) {
        await new Promise(r => setTimeout(r, Math.max(3000, line.japanese.length * 200)));
      } else {
        audioService.speak(line.japanese || line.romaji);
        await new Promise(r => setTimeout(r, Math.max(2500, (line.japanese?.length || 10) * 180)));
      }
    }
    setPlayingIndex(-1);
    setIsAutoPlaying(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-panel rounded-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <MessageSquare size={13} />
            <span>VIDEO CONVERSATIONS & ROLEPLAY</span>
          </div>
          <h1 className="text-2xl font-black text-white">{convo?.title}</h1>
          <p className="text-xs text-slate-400">
            Natural Japanese dialogues from everyday scenarios (meeting, ordering food, office, shopping).
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* English Meaning Toggle */}
          <button
            onClick={() => setShowEnglish(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showEnglish
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            🇬🇧 English: {showEnglish ? 'ON' : 'OFF'}
          </button>

          {/* Romaji Toggle */}
          <button
            onClick={() => setShowRomaji(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showRomaji
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            🔤 Romaji: {showRomaji ? 'ON' : 'OFF'}
          </button>

          {isAutoPlaying ? (
            <button
              onClick={stopAutoPlay}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Pause size={14} />
              <span>Stop Playback</span>
            </button>
          ) : (
            <button
              onClick={startAutoPlay}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Play size={14} className="fill-white" />
              <span>Play Entire Dialogue</span>
            </button>
          )}
        </div>
      </div>

      {/* Video / Dialogue Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {n5Data.conversations.map(c => (
          <button
            key={c.id}
            onClick={() => { setSelectedConvoId(c.id); stopAutoPlay(); setRoleplayCharacter(null); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedConvoId === c.id
                ? 'bg-amber-500 border-amber-400 text-white shadow-sm'
                : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Video {c.videoNumber}
          </button>
        ))}
      </div>

      {/* Roleplay Character Picker */}
      {speakers.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-800/60 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Mic size={14} className="text-amber-400" />
            <span>Roleplay Speaking Mode:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRoleplayCharacter(null)}
              className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                roleplayCharacter === null
                  ? 'bg-white/10 text-white border-white/20'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              Both Speakers
            </button>

            {speakers.map(spk => (
              <button
                key={spk}
                onClick={() => setRoleplayCharacter(spk)}
                className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                  roleplayCharacter === spk
                    ? 'bg-amber-500 text-white border-amber-400 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-white/5 hover:border-white/20'
                }`}
              >
                I am {spk}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dialogue Lines */}
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const isActive = playingIndex === idx;
          const speakerClean = line.speaker.replace(/[:：]/g, '').trim();
          const isUserRole = roleplayCharacter && speakerClean.toLowerCase().includes(roleplayCharacter.toLowerCase());

          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl glass-panel transition-all flex items-start gap-4 ${
                isActive 
                  ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10 scale-[1.01]' 
                  : 'border-white/5'
              } ${isUserRole ? 'border-l-4 border-l-amber-500' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-md ${
                isUserRole
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white'
                  : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
              }`}>
                {speakerClean ? speakerClean.slice(0, 2).toUpperCase() : <User size={16} />}
              </div>

              {/* Speech bubble */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-amber-300">{speakerClean}</span>
                  {isUserRole && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Your Turn
                    </span>
                  )}
                </div>

                <div className="text-base md:text-lg font-bold text-white font-jp leading-relaxed">
                  {line.japanese || line.romaji}
                </div>

                {showRomaji && line.romaji && (
                  <div className="text-xs text-slate-400 font-sans">
                    {line.romaji}
                  </div>
                )}

                {showEnglish && line.english && (
                  <div className="text-xs sm:text-sm font-medium text-amber-200/90 pt-1 mt-1 border-t border-white/5 flex items-start gap-1.5">
                    <span className="text-amber-400 select-none">💬</span>
                    <span>{line.english}</span>
                  </div>
                )}
              </div>

              {/* Audio button for individual line */}
              <div className="shrink-0 self-center">
                <AudioButton text={line.japanese || line.romaji} size="md" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

