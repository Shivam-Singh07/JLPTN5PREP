import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import audioService from '../services/audioService';

export default function AudioButton({ text, size = 'md', className = '', label = '', autoPlay = false }) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const unsub = audioService.subscribe(({ isSpeaking, text: currentText }) => {
      if (currentText === text) {
        setSpeaking(isSpeaking);
      } else if (!isSpeaking) {
        setSpeaking(false);
      }
    });
    return unsub;
  }, [text]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (speaking) {
      audioService.stop();
    } else {
      audioService.speak(text);
    }
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base'
  }[size] || 'w-9 h-9';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`audio-btn ${sizeClasses} ${speaking ? 'speaking' : ''} ${className}`}
      title={speaking ? 'Stop speech' : `Pronounce "${text}"`}
      aria-label="Listen audio"
    >
      {speaking ? (
        <span className="flex items-center justify-center gap-0.5">
          <span className="wave-bar h-3"></span>
          <span className="wave-bar h-4"></span>
          <span className="wave-bar h-2"></span>
        </span>
      ) : (
        <Volume2 size={size === 'sm' ? 14 : size === 'lg' ? 22 : 17} />
      )}
      {label && <span className="ml-1.5 text-xs font-semibold">{label}</span>}
    </button>
  );
}

