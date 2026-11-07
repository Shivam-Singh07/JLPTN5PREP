/**
 * Robust High-Fidelity Japanese Audio Service
 * Solves all voice glitches, stray sounds ("ss"), and pronunciation artifacts.
 */

class AudioService {
  constructor() {
    this.rate = 0.95; // comfortable learner speed
    this.currentAudio = null;
    this.speechSynth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.japaneseVoice = null;
    this.listeners = new Set();
    this.audioCache = new Map();
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
    const voices = this.speechSynth.getVoices();
    // Prioritize genuine Japanese voices
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
   * Strips Roman numerals (I, II), bracketed grammar hints, and stray Latin letters.
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

    // 4. If Japanese kana or kanji is present, strip any leftover Latin letters (e.g. stray 's' or 'r')
    const hasJapanese = /[\u3040-\u30ff\u4e00-\u9fff]/.test(text);
    if (hasJapanese) {
      text = text.replace(/[a-zA-Z]/g, '');
    }

    // 5. Clean punctuation
    text = text.replace(/[:：_•—]/g, ' ').replace(/\s+/g, ' ').trim();
    return text;
  }

  async speak(text, customRate = null) {
    if (!text) return;

    this.stop();

    const cleaned = this.cleanJapaneseText(text);
    if (!cleaned) return;

    const rate = customRate || this.rate;
    this.notify(true, text);

    const encoded = encodeURIComponent(cleaned);

    // Primary: Local TTS proxy route (zero referer issue, native Tokyo studio voice)
    const proxyUrl = `/api/tts?q=${encoded}`;
    // Fallback URL: Direct Google TTS with no-referrer
    const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encoded}`;

    // Try playing through HTML5 Audio
    const tryAudioPlay = (src) => {
      return new Promise((resolve, reject) => {
        const audio = new Audio(src);
        audio.referrerPolicy = 'no-referrer';
        audio.playbackRate = rate;
        this.currentAudio = audio;

        audio.onended = () => {
          this.currentAudio = null;
          this.notify(false, '');
          resolve(true);
        };

        audio.onerror = (err) => {
          this.currentAudio = null;
          reject(err);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(reject);
        }
      });
    };

    try {
      // 1. Try local proxy
      await tryAudioPlay(proxyUrl);
    } catch {
      try {
        // 2. Try direct URL
        await tryAudioPlay(directUrl);
      } catch {
        // 3. Fallback to browser SpeechSynthesis
        await this.fallbackSpeechSynth(cleaned, rate, text);
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

        utterance.onstart = () => {
          this.notify(true, originalText);
        };

        utterance.onend = () => {
          this.notify(false, '');
          resolve();
        };

        utterance.onerror = () => {
          this.notify(false, '');
          resolve();
        };

        this.speechSynth.speak(utterance);
      } catch {
        this.notify(false, '');
        resolve();
      }
    });
  }

  /**
   * Speaks English definition clearly using SpeechSynthesis.
   * Returns a Promise that resolves when finished.
   */
  speakEnglish(text, customRate = null) {
    return new Promise((resolve) => {
      if (!this.speechSynth || !text) {
        resolve();
        return;
      }

      try {
        this.stop();

        // Clean english text (e.g. remove parentheses, replace slashes with commas for natural cadence)
        let cleanText = String(text)
          .replace(/[\(\)]/g, ' ')
          .replace(/[\/;]/g, ', ')
          .replace(/\s+/g, ' ')
          .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = customRate || 0.95;
        utterance.lang = 'en-US';

        const voices = this.speechSynth.getVoices();
        const englishVoice = voices.find(v => 
          v.lang === 'en-US' || 
          v.lang === 'en-GB' || 
          v.lang.startsWith('en')
        );
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onstart = () => {
          this.notify(true, text);
        };

        utterance.onend = () => {
          this.notify(false, '');
          resolve();
        };

        utterance.onerror = () => {
          this.notify(false, '');
          resolve();
        };

        this.speechSynth.speak(utterance);
      } catch {
        this.notify(false, '');
        resolve();
      }
    });
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
        // Gentle joyful harmonic chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else {
        // Soft mellow low tone
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
