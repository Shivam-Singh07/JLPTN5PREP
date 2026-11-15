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
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#17171b] border border-white/5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#c53d33]/10 border border-[#c53d33]/30 text-[#e57a6f] text-xs font-mincho font-medium">
            <MessageSquare size={13} />
            <span>〔 日常会話 〕 CONVERSATIONS & ROLEPLAY</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{convo?.title}</h1>
          <p className="text-xs text-stone-400 font-jp">
            場面ごとの自然な日本語対話。一行ずつ再生、または役割を選択して発音練習が可能です。
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* English Meaning Toggle */}
          <button
            onClick={() => setShowEnglish(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              showEnglish
                ? 'bg-[#222227] border-white/20 text-white'
                : 'bg-[#17171b] border-white/5 text-stone-400 hover:text-white'
            }`}
          >
            日本語訳: {showEnglish ? '表示' : '非表示'}
          </button>

          {/* Romaji Toggle */}
          <button
            onClick={() => setShowRomaji(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              showRomaji
                ? 'bg-[#222227] border-white/20 text-white'
                : 'bg-[#17171b] border-white/5 text-stone-400 hover:text-white'
            }`}
          >
            ローマ字: {showRomaji ? '表示' : '非表示'}
          </button>

          {isAutoPlaying ? (
            <button
              onClick={stopAutoPlay}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium border border-white/10 transition-all cursor-pointer"
            >
              <Pause size={13} />
              <span>停止</span>
            </button>
          ) : (
            <button
              onClick={startAutoPlay}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#c53d33] hover:bg-[#b12f26] text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
            >
              <Play size={13} className="fill-white" />
              <span>全対話再生</span>
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              selectedConvoId === c.id
                ? 'bg-[#c53d33] border-[#c53d33] text-white'
                : 'bg-[#17171b] border-white/5 text-stone-400 hover:text-white'
            }`}
          >
            <span className="font-mincho">第{c.videoNumber}話</span>
          </button>
        ))}
      </div>

      {/* Roleplay Character Picker */}
      {speakers.length > 0 && (
        <div className="p-3.5 rounded-xl bg-[#17171b] border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-300 font-medium font-jp">
            <Mic size={14} className="text-[#e57a6f]" />
            <span>発話練習 (Roleplay Mode):</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRoleplayCharacter(null)}
              className={`px-2.5 py-1 rounded-lg font-medium border transition-all ${
                roleplayCharacter === null
                  ? 'bg-[#222227] text-white border-white/20'
                  : 'text-stone-400 border-transparent hover:text-white'
              }`}
            >
              全員再生
            </button>

            {speakers.map(spk => (
              <button
                key={spk}
                onClick={() => setRoleplayCharacter(spk)}
                className={`px-2.5 py-1 rounded-lg font-medium border transition-all ${
                  roleplayCharacter === spk
                    ? 'bg-[#c53d33] text-white border-[#c53d33]'
                    : 'bg-[#131316] text-stone-300 border-white/5 hover:border-white/20'
                }`}
              >
                {spk} を担当
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
              className={`p-4 rounded-xl bg-[#17171b] transition-all flex items-start gap-4 border ${
                isActive 
                  ? 'border-[#c53d33] bg-[#c53d33]/5' 
                  : 'border-white/5'
              } ${isUserRole ? 'border-l-2 border-l-[#c53d33]' : ''}`}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-lg bg-[#222227] text-stone-200 border border-white/5 flex items-center justify-center font-mincho font-bold text-xs shrink-0">
                {speakerClean ? speakerClean.slice(0, 2) : <User size={14} />}
              </div>

              {/* Speech bubble */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-stone-300 font-jp">{speakerClean}</span>
                  {isUserRole && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#c53d33]/20 text-[#e57a6f] border border-[#c53d33]/30 font-jp">
                      あなたの番 (Your Turn)
                    </span>
                  )}
                </div>

                <div className="text-base md:text-lg font-bold text-white font-mincho leading-relaxed">
                  {line.japanese || line.romaji}
                </div>

                {showRomaji && line.romaji && (
                  <div className="text-xs text-stone-400 font-sans">
                    {line.romaji}
                  </div>
                )}

                {showEnglish && line.english && (
                  <div className="text-xs text-stone-300 pt-1 mt-1 border-t border-white/5 font-jp">
                    {line.english}
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
