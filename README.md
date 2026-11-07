# 🌸 JLPT N5 Master Prep Web Application

An interactive web application built specifically from the study materials in the `resouces/` folder:
- **Basic 1** (Chapters 1 to 11: Introduction, counting, time, demonstratives, adjectives, verbs, family, transport, give & take, review)
- **Basic 2** (Lessons 12 to 24: Comparisons, desires, て-form, permissions, chained actions, ない-form, dictionary form, た-form, plain form, quotations, noun modifications, conditionals, favor giving/receiving)
- **N5 Essential Adverbs & Kanji Vocabulary** (60 core adverbs and 230+ compound words)
- **NIHONKAI Japanese Script Book** (あいうえお Hiragana & Katakana charts)
- **N5 Kanji 110** (110 essential N5 Kanji with stroke counts, on/kun readings, meanings, and compounds)
- **Official N5 Examination Drills** (Timed mock exam questions with explanations)

---

## 🚀 Quick Start

To start the application, either:
1. Double-click **`start_app.bat`** (or run `.\start_app.ps1` in PowerShell), OR:
2. Run in terminal:
   ```bash
   cd web
   npm run preview
   ```
Then visit **`http://localhost:5173/`** in your browser!

---

## 📂 Modular Folder Architecture

All files and functionalities have been organized into distinct directories for specific purposes:

```
JLPTN5PREP/
├── resouces/                     # Original textbook PDFs
│   ├── basic 1 book pdf.pdf      # Chapters 1 to 11
│   ├── Basic 2.pdf               # Lessons 12 to 24 + N5 Practice Drills
│   ├── N5 kanji pdf (1).pdf      # 110 N5 Kanji guide
│   └── script book (1) (1)_rotated (1).pdf # Hiragana & Katakana guide
│
├── data/                         # Extracted and structured JSON datasets
│   ├── vocab/                    # chapter_1.json to chapter_24.json, adverbs.json, all_vocab.json
│   ├── grammar/                  # all_grammar.json (rules, formulas, example sentences)
│   ├── listening/                # all_listening.json (CHŌKAI listening scripts & comprehension)
│   ├── conversations/            # all_conversations.json (Videos 1-21 + situational dialogues)
│   ├── kanji/                    # kanji_110.json & kanji_vocab.json
│   ├── kana/                     # hiragana.json & katakana.json
│   └── drills/                   # mock_exam.json (Official textbook drill questions)
│
├── scripts/                      # Python extraction & data compilation scripts
│   ├── build_full_database.py    # Master extraction script (PDF -> structured JSON)
│   ├── parse_books.py            # Basic 1 parser
│   └── parse_basic2.py           # Basic 2 parser
│
├── web/                          # Modern React + Vite application
│   ├── src/
│   │   ├── components/           # Reusable UI components (Navbar, AudioButton)
│   │   ├── pages/                # Distinct feature views:
│   │   │   ├── Dashboard.jsx     # Overview, stats, and module launcher
│   │   │   ├── VocabLearn.jsx    # Flashcard & table learning with native audio
│   │   │   ├── VocabQuiz.jsx     # Core MCQ practice (Vocab, Kanji & Kana Practice Hub)
│   │   │   ├── KanjiQuiz.jsx     # Kanji practice quiz (Chapter-wise 1-10 & Full 110)
│   │   │   ├── KanaQuiz.jsx      # Kana drill (Hiragana & Katakana: Basic, Dakuten, Yōon)
│   │   │   ├── GrammarView.jsx   # Grammar guide with formulas and example audio
│   │   │   ├── ListeningView.jsx # Chōkai listening lab with audio playback & reveal mode
│   │   │   ├── ConvoView.jsx     # Dialogue studio with roleplay speaking mode
│   │   │   ├── KanjiExplorer.jsx # 110 Kanji cards with readings, stroke count & compounds
│   │   │   ├── KanaSoundboard.jsx# Interactive Hiragana & Katakana audio soundboard
│   │   │   └── MockExam.jsx      # Timed JLPT N5 mock exam with scoring & answer key
│   │   ├── services/             # Core logic:
│   │   │   ├── audioService.js   # Native Web Speech API Japanese voice synthesizer + chimes
│   │   │   ├── quizEngine.js     # Smart MCQ generator with distractors from same curriculum
│   │   │   └── storageService.js # LocalStorage for saving quiz history, scores, and streak
│   │   ├── styles/               # Glassmorphism Japanese cherry blossom theme
│   │   └── data/                 # Direct compiled data bundle
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── start_app.bat                 # 1-click Windows starter
├── start_app.ps1                 # PowerShell starter
└── README.md
```

---

## 🌟 Key Features

### 1. ⚡ Vocabulary Practice Quiz (Core Feature)
- **Chapter-Wise or Whole N5**: Choose any specific chapter (1 to 24), essential adverbs, or practice across the entire collection of 1,300+ words.
- **Multiple Choice Form (MCQs)**: 4 choices with smart distractors generated from the same JLPT level.
- **Three Modes**:
  - *Japanese ➔ English*: Read kana/kanji, choose meaning.
  - *English ➔ Japanese*: Read English prompt, choose correct Japanese word.
  - *🎧 Audio Listening*: Listen to spoken Japanese, choose meaning.
- **Instant Audio & Feedback**: Correct answers glow green with harmonious chime; wrong answers highlight red and immediately show the correct answer while pronouncing it.
- **Comprehensive Score Screen**:
  - Score percentage, passing badge (Master / Passed / Keep Practicing), time taken.
  - Confetti celebration for passing marks.
  - Detailed review list of every question answered.
  - **"Retake Missed Questions"** button to focus strictly on mistakes.

### 2. 🔊 Authentic Japanese Audio Everywhere
- Built with browser `window.speechSynthesis` using native Japanese voice profiles (`ja-JP`).
- **Speed Selector**: 0.75x (slow learner mode), 1.0x (standard), 1.2x (natural speed).
- Pronunciation buttons on:
  - Every vocabulary word.
  - Every listening exercise sentence.
  - Every conversation line.
  - Every grammar example sentence.
  - Every Kanji compound word.
  - Every kana character on the soundboard.

### 3. 📖 Vocabulary Learning & 3D Flashcards
- Flip cards in 3D to reveal meanings.
- Toggle Romaji ON/OFF.
- Mark words as "Mastered" with local progress tracking.
- Search words in English, Romaji, or Japanese.
- Direct "Practice this Chapter" button to immediately test what you just learned.

### 4. 🎧 Listening Lab (CHŌKAI 聴解)
- 24 chapters of home practice listening sentences.
- **Ear Training Mode**: Script is blurred by default so you must listen to the audio first; click to reveal transcript and English translation.
- "Play All Sentences" button for hands-free listening practice.

### 5. 💬 Conversation & Roleplay Studio
- Videos 1 to 21 from the textbook with full scripts and character lines (Miller, Kimura, Yamada, Sato, etc.).
- **Roleplay Mode**: Pick your character (e.g. "I am Kimura"). The app plays the other speaker's lines and pauses for you to practice speaking your line!

### 6. 🈸 Kanji 110 Explorer & Kana Charts
- Complete set of 110 official N5 Kanji with stroke count, On'yomi, Kun'yomi, English meanings, and sample compound words.
- Interactive Hiragana and Katakana soundboard with audio for every syllable.

### 7. 📝 JLPT N5 Official Drills Mock Exam
- 25-minute timed simulation covering vocabulary, particles, sentence ordering, and reading comprehension.
- Evaluates your score against the JLPT pass mark (60%) with detailed question explanations.

