/**
 * Robust High-Fidelity Japanese & English Mobile-Compatible Audio Service
 * 
 * Key Features:
 * 1. Unified HTML5 Media Audio Pipeline:
 *    Both Japanese and English use HTML5 Audio elements with Google TTS streams.
 *    This ensures 100% background and lock-screen playback on mobile browsers (Brave, Chrome, Safari).
 * 2. Unthrottled Silent WAV Pauses:
 *    Mobile operating systems throttle or freeze JS timers (setInterval/setTimeout) when the screen locks.
 *    Pauses are executed via real, silent WAV audio playback so Android/iOS power management never pauses playback.
 * 3. MediaSession API Integration:
 *    Displays Japanese word, Romaji, and English translation on the phone lock screen / notification shade,
 *    and supports lock-screen and Bluetooth headphone controls (Play, Pause, Next, Previous).
 */

class AudioService {
  constructor() {
    this.rate = 0.95; // comfortable learner speed
    this.currentAudio = null;
    this.audioElement = null; // persistent audio element to preserve mobile user gesture
    this.speechSynth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.japaneseVoice = null;
    this.listeners = new Set();
    this.audioCtx = null;
    this.isSpeaking = false;

    if (this.speechSynth) {
      this.initVoices();
      if (this.speechSynth.onvoiceschanged !== undefined) {
        this.speechSynth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  getAudioElement() {
    if (!this.audioElement && typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.referrerPolicy = 'no-referrer';
    }
    return this.audioElement;
  }

  initVoices() {
    if (!this.speechSynth) return;
    const voices = this.speechSynth.getVoices();
    this.japaneseVoice = voices.find(v => 
      v.lang === 'ja-JP' || 
      v.lang === 'ja_JP' || 
      v.lang.toLowerCase().startsWith('ja') ||
      v.name.toLowerCase().includes('japanese') ||
      v.name.toLowerCase().includes('haruka') ||
      v.name.toLowerCase().includes('ayumi') ||
      v.name.toLowerCase().includes('ichiro') ||
      v.name.toLowerCase().includes('kyoko') ||
      v.name.toLowerCase().includes('sayaka') ||
      v.name.toLowerCase().includes('otoya')
    ) || null;
  }

  setRate(newRate) {
    this.rate = Math.max(0.6, Math.min(1.5, newRate));
    if (this.currentAudio) {
      this.currentAudio.playbackRate = this.rate;
    }
  }

  getRate() {
    return this.rate;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(speaking, text = '') {
    this.isSpeaking = speaking;
    this.listeners.forEach(cb => cb({ isSpeaking: speaking, text }));
  }

  stop() {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {}
    }
    if (this.currentAudio && this.currentAudio !== this.audioElement) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }
    if (this.speechSynth) {
      try {
        this.speechSynth.cancel();
      } catch {}
    }
    this.notify(false, '');
  }

  /**
   * Generates a tiny, uncompressed silent WAV Data URI.
   * Playing real silent audio keeps the mobile OS audio pipeline open during pauses,
   * preventing Android Doze / iOS WebKit from freezing background playback when the screen is locked.
   */
  createSilentWav(durationSec = 1.0) {
    const sampleRate = 1000;
    const numSamples = Math.max(10, Math.floor(durationSec * sampleRate));
    const header = new Uint8Array(44);
    const view = new DataView(header.buffer);
    
    // "RIFF"
    header.set([0x52, 0x49, 0x46, 0x46], 0);
    view.setUint32(4, 36 + numSamples, true);
    // "WAVE"
    header.set([0x57, 0x41, 0x56, 0x45], 8);
    // "fmt "
    header.set([0x66, 0x6d, 0x74, 0x20], 12);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true);
    view.setUint16(32, 1, true); // block align
    view.setUint16(34, 8, true); // bits per sample
    // "data"
    header.set([0x64, 0x61, 0x74, 0x61], 36);
    view.setUint32(40, numSamples, true);
    
    const data = new Uint8Array(numSamples);
    data.fill(128); // 8-bit PCM silence is 128
    
    const full = new Uint8Array(44 + numSamples);
    full.set(header, 0);
    full.set(data, 44);
    
    let binary = '';
    for (let i = 0; i < full.length; i++) {
      binary += String.fromCharCode(full[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  }

  /**
   * Plays a hardware silent audio track for the requested seconds.
   * Resolves on 'ended' event — immune to mobile background timer throttling.
   */
  playSilence(durationSec = 1.0) {
    if (durationSec <= 0) return Promise.resolve(true);
    const wavUri = this.createSilentWav(durationSec);
    return this.playMediaUrl(wavUri, 1.0, false);
  }

  /**
   * Cleans text to ensure 100% natural, authentic Japanese reading.
   */
  cleanJapaneseText(rawText) {
    if (!rawText) return '';
    let text = String(rawText);

    // 1. Remove bracketed annotations: [~], (お), 「～」
    text = text.replace(/\[.*?\]/g, '');
    text = text.replace(/（.*?）/g, '');
    text = text.replace(/\(.*?\)/g, '');
    text = text.replace(/「.*?」/g, '');
    text = text.replace(/【.*?】/g, '');
    text = text.replace(/『.*?』/g, '');

    // 2. Remove verb group roman numerals: I, II, III
    text = text.replace(/[ⅠⅡⅢI|]+$/g, '');

    // 3. Remove grammatical wave markers ~ or ～
    text = text.replace(/[～~].*$/g, '');

    // 4. Strip stray Latin characters if Japanese kana/kanji is present
    const hasJapanese = /[\u3040-\u30ff\u4e00-\u9fff]/.test(text);
    if (hasJapanese) {
      text = text.replace(/[a-zA-Z]/g, '');
    }

    // 5. Clean punctuation
    text = text.replace(/[:：_•—]/g, ' ').replace(/\s+/g, ' ').trim();
    return text;
  }

  /**
   * Cleans English definition for smooth speech synthesis or TTS audio.
   */
  cleanEnglishText(rawText) {
    if (!rawText) return '';
    let text = String(rawText);
    text = text.replace(/[\(\)]/g, ' ');
    text = text.replace(/[\/;]/g, ', ');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  /**
   * Core Audio Stream Player
   * Reuses the persistent HTML5 Audio element to preserve mobile background permissions.
   */
  playMediaUrl(url, rate = null, notifyState = true, originalText = '') {
    return new Promise((resolve, reject) => {
      const audio = this.getAudioElement();
      if (!audio) {
        resolve(false);
        return;
      }

      this.stop();
      this.currentAudio = audio;
      audio.playbackRate = rate || this.rate;

      let isFinished = false;

      const cleanup = () => {
        if (isFinished) return;
        isFinished = true;
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        if (notifyState) this.notify(false, '');
      };

      const handleEnded = () => {
        cleanup();
        resolve(true);
      };

      const handleError = (err) => {
        cleanup();
        reject(err);
      };

      audio.addEventListener('ended', handleEnded, { once: true });
      audio.addEventListener('error', handleError, { once: true });

      if (notifyState && originalText) {
        this.notify(true, originalText);
      }

      audio.src = url;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(handleError);
      }
    });
  }

  /**
   * Speaks Japanese with native Tokyo pronunciation.
   * Plays through HTML5 media audio so Brave / mobile browsers keep playing in background.
   */
  async speak(text, customRate = null) {
    if (!text) return;

    const cleaned = this.cleanJapaneseText(text);
    if (!cleaned) return;

    const rate = customRate || this.rate;
    const encoded = encodeURIComponent(cleaned);

    const proxyUrl = `/api/tts?tl=ja&q=${encoded}`;
    const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encoded}`;

    try {
      // 1. Try local proxy
      await this.playMediaUrl(proxyUrl, rate, true, text);
    } catch {
      try {
        // 2. Try direct Google TTS
        await this.playMediaUrl(directUrl, rate, true, text);
      } catch {
        // 3. Fallback to SpeechSynthesis
        await this.fallbackSpeechSynth(cleaned, rate, text);
      }
    }
  }

  /**
   * Speaks English definition.
   * CRITICAL FIX FOR MOBILE / BRAVE BACKGROUND PLAY:
   * Uses HTML5 Audio stream (Google TTS with tl=en) rather than window.speechSynthesis.
   * Mobile browsers suspend window.speechSynthesis when the screen locks, but HTML5 Audio continues!
   */
  async speakEnglish(text, customRate = null) {
    if (!text) return;

    const cleaned = this.cleanEnglishText(text);
    if (!cleaned) return;

    const rate = customRate || 0.95;
    const encoded = encodeURIComponent(cleaned);

    const proxyUrl = `/api/tts?tl=en&q=${encoded}`;
    const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encoded}`;

    try {
      // 1. Try local proxy with tl=en
      await this.playMediaUrl(proxyUrl, rate, true, text);
    } catch {
      try {
        // 2. Try direct Google TTS with tl=en
        await this.playMediaUrl(directUrl, rate, true, text);
      } catch {
        // 3. Fallback to SpeechSynthesis (desktop/fallback)
        await this.fallbackSpeechSynthEnglish(cleaned, rate, text);
      }
    }
  }

  fallbackSpeechSynth(text, rate, originalText) {
    return new Promise((resolve) => {
      if (!this.speechSynth) {
        this.notify(false, '');
        resolve();
        return;
      }

      try {
        this.speechSynth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = 1.0;

        if (!this.japaneseVoice) {
          this.initVoices();
        }

        if (this.japaneseVoice) {
          utterance.voice = this.japaneseVoice;
        }
        utterance.lang = 'ja-JP';

        utterance.onstart = () => this.notify(true, originalText);
        utterance.onend = () => { this.notify(false, ''); resolve(); };
        utterance.onerror = () => { this.notify(false, ''); resolve(); };

        this.speechSynth.speak(utterance);
      } catch {
        this.notify(false, '');
        resolve();
      }
    });
  }

  fallbackSpeechSynthEnglish(text, rate, originalText) {
    return new Promise((resolve) => {
      if (!this.speechSynth) {
        this.notify(false, '');
        resolve();
        return;
      }

      try {
        this.speechSynth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.lang = 'en-US';

        const voices = this.speechSynth.getVoices();
        const enVoice = voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;

        utterance.onstart = () => this.notify(true, originalText);
        utterance.onend = () => { this.notify(false, ''); resolve(); };
        utterance.onerror = () => { this.notify(false, ''); resolve(); };

        this.speechSynth.speak(utterance);
      } catch {
        this.notify(false, '');
        resolve();
      }
    });
  }

  /**
   * Sets up Media Session API for mobile lock screen & notification controls.
   * Keeps Android / iOS background media notification alive with Play / Pause / Next / Prev.
   */
  setMediaSession({ title, artist, album, onPlay, onPause, onNext, onPrev }) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || 'JLPT N5 Vocabulary',
        artist: artist || 'Meaning',
        album: album || 'JLPT N5 Master Prep'
      });

      if (onPlay) navigator.mediaSession.setActionHandler('play', onPlay);
      if (onPause) navigator.mediaSession.setActionHandler('pause', onPause);
      if (onNext) navigator.mediaSession.setActionHandler('nexttrack', onNext);
      if (onPrev) navigator.mediaSession.setActionHandler('previoustrack', onPrev);
    } catch {}
  }

  // Harmonic Web Audio chime for correct / wrong quiz answers
  playFeedback(isCorrect) {
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (isCorrect) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(170, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.22);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch {}
  }
}

const audioService = new AudioService();
export default audioService;
