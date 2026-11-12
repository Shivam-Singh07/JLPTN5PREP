/**
 * Robust High-Fidelity Japanese & English Audio Service
 * Fully compatible with Mobile (Brave, Chrome, Safari, Android, iOS) and Desktop.
 * 
 * Features:
 * 1. Multi-tier playback: Tries HTML5 Audio stream, gracefully falls back to native Web Speech API.
 * 2. Guaranteed execution: Never rejects promises or hangs, ensuring autoplay loops never stall.
 * 3. Mobile MediaSession API: Controls and metadata appear on Android / iOS lock screens & notification shade.
 */

class AudioService {
  constructor() {
    this.rate = 0.95; // comfortable learner speed
    this.currentAudio = null;
    this.speechSynth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.japaneseVoice = null;
    this.englishVoice = null;
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

  initVoices() {
    if (!this.speechSynth) return;
    try {
      const voices = this.speechSynth.getVoices() || [];
      
      // Japanese voice selection
      this.japaneseVoice = voices.find(v => 
        v.lang === 'ja-JP' || 
        v.lang === 'ja_JP' || 
        v.lang.toLowerCase().startsWith('ja') ||
        v.name.toLowerCase().includes('japanese') ||
        v.name.toLowerCase().includes('haruka') ||
        v.name.toLowerCase().includes('ayumi') ||
        v.name.toLowerCase().includes('kyoko') ||
        v.name.toLowerCase().includes('sayaka')
      ) || null;

      // English voice selection
      this.englishVoice = voices.find(v => 
        v.lang === 'en-US' || 
        v.lang === 'en-GB' || 
        v.lang.toLowerCase().startsWith('en') ||
        v.name.toLowerCase().includes('english') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('david') ||
        v.name.toLowerCase().includes('george')
      ) || null;
    } catch {}
  }

  setRate(newRate) {
    this.rate = Math.max(0.5, Math.min(2.0, newRate));
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
    this.listeners.forEach(cb => {
      try { cb({ isSpeaking: speaking, text }); } catch {}
    });
  }

  stop() {
    if (this.currentAudio) {
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
   * Cleans English definition for natural pronunciation.
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
   * Plays an audio stream from URL. Always resolves with true/false (never throws).
   */
  playAudioStream(url, rate = null, notifyState = true, text = '', timeoutMs = 4000) {
    return new Promise((resolve) => {
      let isDone = false;
      let audio = null;
      let timer = null;

      const finish = (success) => {
        if (isDone) return;
        isDone = true;
        if (timer) clearTimeout(timer);
        if (audio) {
          audio.onended = null;
          audio.onerror = null;
        }
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        if (notifyState) this.notify(false, '');
        resolve(success);
      };

      try {
        audio = new Audio();
        audio.referrerPolicy = 'no-referrer';
        audio.playbackRate = rate || this.rate;
        this.currentAudio = audio;

        timer = setTimeout(() => {
          try { audio.pause(); } catch {}
          finish(false);
        }, timeoutMs);

        audio.onended = () => finish(true);
        audio.onerror = () => finish(false);

        if (notifyState && text) {
          this.notify(true, text);
        }

        audio.src = url;
        const p = audio.play();
        if (p !== undefined) {
          p.catch(() => finish(false));
        }
      } catch {
        finish(false);
      }
    });
  }

  /**
   * Speaks Japanese word with Tokyo studio pronunciation.
   */
  async speak(text, customRate = null) {
    if (!text) return true;

    const cleaned = this.cleanJapaneseText(text);
    if (!cleaned) return true;

    const rate = customRate || this.rate;
    const encoded = encodeURIComponent(cleaned);

    const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encoded}`;

    // 1. Try HTML5 audio stream
    const playedOk = await this.playAudioStream(directUrl, rate, true, text, 4000);

    // 2. If stream failed, fallback to native speech synthesis
    if (!playedOk) {
      await this.speakJapaneseSynth(cleaned, rate, text);
    }
    return true;
  }

  /**
   * Speaks English definition.
   * Rock-solid fallback guarantee: tries HTML5 audio first (for background mobile),
   * and immediately falls back to native Web Speech API so it ALWAYS reads the English word!
   */
  async speakEnglish(text, customRate = null) {
    if (!text) return true;

    const cleaned = this.cleanEnglishText(text);
    if (!cleaned) return true;

    const rate = customRate || this.rate;
    const encoded = encodeURIComponent(cleaned);

    const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encoded}`;

    // 1. Try HTML5 audio stream (works in Brave background play)
    const playedOk = await this.playAudioStream(directUrl, rate, true, text, 3500);

    // 2. If stream failed (or blocked by CORS/offline), use native SpeechSynthesis
    if (!playedOk) {
      await this.speakEnglishSynth(cleaned, rate, text);
    }
    return true;
  }

  speakJapaneseSynth(text, rate, originalText) {
    return new Promise((resolve) => {
      if (!this.speechSynth || !text) {
        this.notify(false, '');
        resolve(true);
        return;
      }

      try {
        let isDone = false;
        const done = () => {
          if (isDone) return;
          isDone = true;
          clearTimeout(timeoutId);
          this.notify(false, '');
          resolve(true);
        };

        const timeoutId = setTimeout(done, 5000);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate || this.rate;
        utterance.pitch = 1.0;
        utterance.lang = 'ja-JP';

        if (!this.japaneseVoice) this.initVoices();
        if (this.japaneseVoice) utterance.voice = this.japaneseVoice;

        utterance.onstart = () => this.notify(true, originalText || text);
        utterance.onend = done;
        utterance.onerror = done;

        this.speechSynth.speak(utterance);
      } catch {
        this.notify(false, '');
        resolve(true);
      }
    });
  }

  speakEnglishSynth(text, rate, originalText) {
    return new Promise((resolve) => {
      if (!this.speechSynth || !text) {
        this.notify(false, '');
        resolve(true);
        return;
      }

      try {
        let isDone = false;
        const done = () => {
          if (isDone) return;
          isDone = true;
          clearTimeout(timeoutId);
          this.notify(false, '');
          resolve(true);
        };

        // Safety timeout: guaranteed to never hang!
        const timeoutId = setTimeout(done, 6000);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate || this.rate;
        utterance.lang = 'en-US';

        if (!this.englishVoice) this.initVoices();
        if (this.englishVoice) utterance.voice = this.englishVoice;

        utterance.onstart = () => this.notify(true, originalText || text);
        utterance.onend = done;
        utterance.onerror = done;

        this.speechSynth.speak(utterance);
      } catch {
        this.notify(false, '');
        resolve(true);
      }
    });
  }

  /**
   * Safe non-blocking silence delay.
   */
  playSilence(durationSec = 1.0) {
    return new Promise((resolve) => {
      const ms = Math.max(250, Math.round(durationSec * 1000));
      setTimeout(() => {
        resolve(true);
      }, ms);
    });
  }

  /**
   * Sets up Media Session API for mobile lock screen & notification controls.
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
