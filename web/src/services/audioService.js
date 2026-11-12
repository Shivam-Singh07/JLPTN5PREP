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
    this.rate = 1.0; // standard natural speed
    this.currentAudio = null;
    this.audioElement = null; // persistent audio element to preserve mobile user gesture
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

  getAudioElement() {
    if (!this.audioElement && typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.referrerPolicy = 'no-referrer';
    }
    return this.audioElement;
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
    text = text.replace(/[\(\)\[\]\{\}]/g, ' ');
    text = text.replace(/[\/;]/g, ', ');
    text = text.replace(/['"`]/g, '');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  /**
   * Plays an audio stream from URL using persistent audio element.
   * Prevents back-to-back duplicate audio by clearing connection timer upon onplaying,
   * and ensuring that failed streams are stopped before triggering fallback synthesis.
   */
  playAudioStream(url, rate = null, notifyState = true, text = '', connectTimeoutMs = 1500) {
    return new Promise((resolve) => {
      let isDone = false;
      let startTimer = null;
      let maxPlaybackTimer = null;
      const audio = this.getAudioElement();

      const finish = (success) => {
        if (isDone) return;
        isDone = true;
        if (startTimer) clearTimeout(startTimer);
        if (maxPlaybackTimer) clearTimeout(maxPlaybackTimer);
        if (audio) {
          audio.onended = null;
          audio.onerror = null;
          audio.onplaying = null;
          // If stream failed, immediately pause and reset so it can NEVER overlap fallback!
          if (!success) {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch {}
          }
        }
        if (notifyState) this.notify(false, '');
        resolve(success);
      };

      if (!audio) {
        resolve(false);
        return;
      }

      try {
        this.stop(); // Stop any pending synthesis/audio first
        this.currentAudio = audio;
        audio.playbackRate = rate || this.rate || 1.0;

        // 1. Connection timer: if stream cannot connect/start within 1.5s, failover to synth
        startTimer = setTimeout(() => {
          finish(false);
        }, connectTimeoutMs);

        // 2. Stream started playing successfully -> CANCEL connection timer!
        audio.onplaying = () => {
          if (startTimer) {
            clearTimeout(startTimer);
            startTimer = null;
          }
          // Safety fallback timeout (max 12s) just in case onended doesn't fire
          maxPlaybackTimer = setTimeout(() => finish(true), 12000);
        };

        // 3. Audio ended naturally -> successful completion (prevents fallback from running!)
        audio.onended = () => {
          finish(true);
        };

        // 4. Audio error -> failover to synth
        audio.onerror = () => {
          finish(false);
        };

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

    const rate = customRate || this.rate || 1.0;
    const encoded = encodeURIComponent(cleaned);

    const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encoded}`;

    // 1. Try HTML5 audio stream (works in mobile background play)
    const playedOk = await this.playAudioStream(directUrl, rate, true, text, 1400);

    // 2. If stream failed, fallback immediately to native speech synthesis
    if (!playedOk) {
      await this.speakJapaneseSynth(cleaned, rate, text);
    }
    return true;
  }

  /**
   * Speaks English definition.
   * Guaranteed: tries HTML5 audio first (for background mobile),
   * and immediately falls back to native Web Speech API so it ALWAYS reads!
   */
  async speakEnglish(text, customRate = null) {
    if (!text) return true;

    const cleaned = this.cleanEnglishText(text);
    if (!cleaned) return true;

    const rate = customRate || this.rate || 1.0;
    const encoded = encodeURIComponent(cleaned);

    const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encoded}`;

    // 1. Try HTML5 audio stream (works in Brave background play)
    const playedOk = await this.playAudioStream(directUrl, rate, true, text, 1400);

    // 2. If stream failed (or blocked by Brave Shields/CORS/offline), use native SpeechSynthesis
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
        // Fix Chrome/Brave stuck synthesis
        this.speechSynth.cancel();
        if (this.speechSynth.paused) {
          this.speechSynth.resume();
        }

        let isDone = false;
        const finish = () => {
          if (isDone) return;
          isDone = true;
          clearTimeout(timeoutId);
          this.notify(false, '');
          resolve(true);
        };

        const timeoutId = setTimeout(finish, 5000);

        const utterance = new SpeechSynthesisUtterance(text);
        if (typeof window !== 'undefined') {
          window.__activeSpeechUtterance = utterance; // Prevent V8 garbage collection bug
        }
        utterance.rate = rate || this.rate || 1.0;
        utterance.pitch = 1.0;

        const voices = this.speechSynth.getVoices() || [];
        const jaVoice = voices.find(v => 
          v.lang === 'ja-JP' || 
          v.lang === 'ja_JP' || 
          v.lang.toLowerCase().startsWith('ja') ||
          v.name.toLowerCase().includes('japan')
        ) || this.japaneseVoice;

        if (jaVoice) {
          utterance.voice = jaVoice;
          utterance.lang = jaVoice.lang;
        } else {
          utterance.lang = 'ja-JP';
        }

        utterance.onstart = () => this.notify(true, originalText || text);
        utterance.onend = finish;
        utterance.onerror = finish;

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
        // Fix Chrome/Brave stuck synthesis
        this.speechSynth.cancel();
        if (this.speechSynth.paused) {
          this.speechSynth.resume();
        }

        let isDone = false;
        const finish = () => {
          if (isDone) return;
          isDone = true;
          clearTimeout(timeoutId);
          this.notify(false, '');
          resolve(true);
        };

        // Safety timeout
        const timeoutId = setTimeout(finish, 5000);

        const utterance = new SpeechSynthesisUtterance(text);
        if (typeof window !== 'undefined') {
          window.__activeSpeechUtterance = utterance; // Prevent V8 garbage collection bug
        }
        utterance.rate = rate || this.rate || 1.0;
        utterance.pitch = 1.0;

        const voices = this.speechSynth.getVoices() || [];
        const enVoice = voices.find(v => 
          v.lang.startsWith('en') || 
          v.lang.includes('en') ||
          v.name.toLowerCase().includes('english')
        ) || this.englishVoice;

        if (enVoice) {
          utterance.voice = enVoice;
          utterance.lang = enVoice.lang;
        } else {
          utterance.lang = 'en-US';
        }

        utterance.onstart = () => this.notify(true, originalText || text);
        utterance.onend = finish;
        utterance.onerror = finish;

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
