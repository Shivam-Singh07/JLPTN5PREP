/**
 * Quiz Engine for Vocabulary, Kanji, and Kana Practice
 * Generates MCQs with smart distractors from the curriculum dataset.
 */

export function generateVocabQuiz(vocabList, fullPool, count = 10, mode = 'jp_to_en') {
  if (!vocabList || vocabList.length === 0) return [];

  // Shuffle source list
  const shuffled = [...vocabList].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((item, index) => {
    // Generate 3 distractors from fullPool distinct from item
    const otherPool = fullPool.filter(v => v.id !== item.id && v.english !== item.english);
    const distractorPool = otherPool.sort(() => 0.5 - Math.random()).slice(0, 3);

    let prompt = '';
    let reading = item.kana || item.romaji || item.japanese;
    let correctAnswer = '';
    let options = [];

    if (mode === 'jp_to_en') {
      prompt = item.japanese || item.kana || item.romaji;
      correctAnswer = item.english;
      const wrong = distractorPool.map(d => d.english);
      options = [correctAnswer, ...wrong].sort(() => 0.5 - Math.random());
    } else if (mode === 'en_to_jp') {
      prompt = item.english;
      correctAnswer = item.japanese || item.kana || item.romaji;
      const wrong = distractorPool.map(d => d.japanese || d.kana || d.romaji);
      options = [correctAnswer, ...wrong].sort(() => 0.5 - Math.random());
    } else if (mode === 'audio') {
      prompt = item.japanese || item.kana;
      correctAnswer = item.english;
      const wrong = distractorPool.map(d => d.english);
      options = [correctAnswer, ...wrong].sort(() => 0.5 - Math.random());
    }

    return {
      id: `q_${index + 1}`,
      vocabItem: item,
      prompt,
      reading,
      mode,
      correctAnswer,
      options,
      correctIndex: options.indexOf(correctAnswer)
    };
  });
}

/**
 * Generate Kanji Practice Quiz
 * Supports chapter-wise (Chapters 1-10) or full curriculum (all 110 Kanji).
 */
export function generateKanjiQuiz(kanjiList, fullPool, count = 10, mode = 'kanji_to_meaning') {
  if (!kanjiList || kanjiList.length === 0) return [];

  const shuffled = [...kanjiList].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((item, index) => {
    const otherPool = fullPool.filter(k => k.kanji !== item.kanji);
    const distractorPool = [...otherPool].sort(() => 0.5 - Math.random()).slice(0, 3);

    let prompt = '';
    let subPrompt = '';
    let correctAnswer = '';
    let options = [];
    let audioText = item.kanji;

    if (mode === 'kanji_to_meaning') {
      prompt = item.kanji;
      subPrompt = `Strokes: ${item.strokes} | Readings: ${item.kunyomi || item.onyomi}`;
      correctAnswer = item.meaning;
      const wrong = distractorPool.map(d => d.meaning);
      options = [correctAnswer, ...wrong].sort(() => 0.5 - Math.random());
      audioText = item.kanji;
    } else if (mode === 'meaning_to_kanji') {
      prompt = item.meaning;
      subPrompt = 'Select the matching Kanji symbol:';
      correctAnswer = item.kanji;
      const wrong = distractorPool.map(d => d.kanji);
      options = [correctAnswer, ...wrong].sort(() => 0.5 - Math.random());
      audioText = item.kanji;
    } else if (mode === 'reading') {
      prompt = item.kanji;
      subPrompt = `Meaning: "${item.meaning}" — Select On'yomi / Kun'yomi:`;
      const formatReading = (k) => {
        const parts = [];
        if (k.onyomi) parts.push(`音: ${k.onyomi}`);
        if (k.kunyomi) parts.push(`訓: ${k.kunyomi}`);
        return parts.join(' | ') || k.meaning;
      };
      correctAnswer = formatReading(item);
      const wrong = distractorPool.map(d => formatReading(d));
      options = [correctAnswer, ...wrong].sort(() => 0.5 - Math.random());
      audioText = item.kanji;
    } else if (mode === 'audio') {
      prompt = '🔊 Listen to the audio pronunciation';
      subPrompt = 'Identify the Kanji character spoken:';
      correctAnswer = item.kanji;
      const wrong = distractorPool.map(d => d.kanji);
      options = [correctAnswer, ...wrong].sort(() => 0.5 - Math.random());
      audioText = item.kanji;
    }

    return {
      id: `kanji_q_${index + 1}`,
      item,
      prompt,
      subPrompt,
      mode,
      correctAnswer,
      options,
      correctIndex: options.indexOf(correctAnswer),
      audioText
    };
  });
}

/**
 * Generate Kana Practice Quiz (Hiragana / Katakana / Mixed)
 */
export function generateKanaQuiz(kanaList, fullPool, count = 10, mode = 'kana_to_romaji') {
  if (!kanaList || kanaList.length === 0) return [];

  const shuffled = [...kanaList].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((item, index) => {
    const otherPool = fullPool.filter(k => k.kana !== item.kana && k.romaji !== item.romaji);
    const distractorPool = [...otherPool].sort(() => 0.5 - Math.random()).slice(0, 3);

    let prompt = '';
    let subPrompt = '';
    let correctAnswer = '';
    let options = [];
    let audioText = item.kana;

    if (mode === 'kana_to_romaji') {
      prompt = item.kana;
      subPrompt = 'Select the correct Romaji transcription:';
      correctAnswer = item.romaji;
      const wrong = distractorPool.map(d => d.romaji);
      options = [correctAnswer, ...wrong].sort(() => 0.5 - Math.random());
      audioText = item.kana;
    } else if (mode === 'romaji_to_kana') {
      prompt = item.romaji;
      subPrompt = 'Select the matching Kana character:';
      correctAnswer = item.kana;
      const wrong = distractorPool.map(d => d.kana);
      options = [correctAnswer, ...wrong].sort(() => 0.5 - Math.random());
      audioText = item.kana;
    } else if (mode === 'audio') {
      prompt = '🔊 Listen to the audio syllable';
      subPrompt = 'Select the correct Kana character:';
      correctAnswer = item.kana;
      const wrong = distractorPool.map(d => d.kana);
      options = [correctAnswer, ...wrong].sort(() => 0.5 - Math.random());
      audioText = item.kana;
    }

    return {
      id: `kana_q_${index + 1}`,
      item,
      prompt,
      subPrompt,
      mode,
      correctAnswer,
      options,
      correctIndex: options.indexOf(correctAnswer),
      audioText
    };
  });
}

