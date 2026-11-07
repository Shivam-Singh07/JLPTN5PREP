/**
 * Storage Service to preserve learning progress, streaks, and quiz results locally.
 */

const STORAGE_KEYS = {
  MASTERED_VOCAB: 'jlpt_n5_mastered_vocab',
  BOOKMARKS: 'jlpt_n5_bookmarks',
  QUIZ_HISTORY: 'jlpt_n5_quiz_history',
  STREAK: 'jlpt_n5_streak',
  SETTINGS: 'jlpt_n5_settings'
};

export const storageService = {
  getMasteredVocab() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MASTERED_VOCAB);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  toggleMastered(id) {
    const list = this.getMasteredVocab();
    const idx = list.indexOf(id);
    if (idx === -1) {
      list.push(id);
    } else {
      list.splice(idx, 1);
    }
    localStorage.setItem(STORAGE_KEYS.MASTERED_VOCAB, JSON.stringify(list));
    return list;
  },

  isMastered(id) {
    return this.getMasteredVocab().includes(id);
  },

  saveQuizResult(result) {
    try {
      const history = this.getQuizHistory();
      const record = {
        ...result,
        id: 'quiz_' + Date.now(),
        date: new Date().toISOString()
      };
      history.unshift(record);
      if (history.length > 50) history.pop();
      localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(history));
      this.updateStreak();
      return record;
    } catch {
      return null;
    }
  },

  getQuizHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  updateStreak() {
    try {
      const today = new Date().toDateString();
      const saved = localStorage.getItem(STORAGE_KEYS.STREAK);
      let streakData = saved ? JSON.parse(saved) : { count: 0, lastDate: null };
      
      if (streakData.lastDate === today) {
        return streakData.count;
      }
      
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (streakData.lastDate === yesterday) {
        streakData.count += 1;
      } else {
        streakData.count = 1;
      }
      streakData.lastDate = today;
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streakData));
      return streakData.count;
    } catch {
      return 1;
    }
  },

  getStreak() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STREAK);
      return saved ? JSON.parse(saved).count : 0;
    } catch {
      return 0;
    }
  }
};

