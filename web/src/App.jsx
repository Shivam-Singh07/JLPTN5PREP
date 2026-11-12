import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import VocabLearn from './pages/VocabLearn';
import VocabQuiz from './pages/VocabQuiz';
import GrammarView from './pages/GrammarView';
import ListeningView from './pages/ListeningView';
import ConvoView from './pages/ConvoView';
import KanjiExplorer from './pages/KanjiExplorer';
import KanaSoundboard from './pages/KanaSoundboard';
import MockExam from './pages/MockExam';
import { storageService } from './services/storageService';
import audioService from './services/audioService';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRate, setCurrentRate] = useState(0.95);
  const [streak, setStreak] = useState(storageService.getStreak());
  const [quizConfig, setQuizConfig] = useState(null);
  const [activeChapterForLearn, setActiveChapterForLearn] = useState(1);

  // Trigger practice from dashboard or learning tab
  const handleStartPractice = (config) => {
    setQuizConfig(config);
    setActiveTab('vocab-quiz');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-rose-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'vocab-quiz') {
            setQuizConfig(null);
          }
        }}
        streak={streak}
        currentRate={currentRate}
        setCurrentRate={setCurrentRate}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            onStartPractice={handleStartPractice}
          />
        )}

        {activeTab === 'vocab-learn' && (
          <VocabLearn 
            onStartPractice={handleStartPractice}
            activeChapter={activeChapterForLearn}
          />
        )}

        {activeTab === 'vocab-quiz' && (
          <VocabQuiz 
            initialConfig={quizConfig}
            onSelectChapter={(ch) => {
              setActiveChapterForLearn(ch);
              setActiveTab('vocab-learn');
            }}
          />
        )}

        {activeTab === 'grammar' && (
          <GrammarView />
        )}

        {activeTab === 'listening' && (
          <ListeningView />
        )}

        {activeTab === 'conversations' && (
          <ConvoView />
        )}

        {activeTab === 'kanji' && (
          <KanjiExplorer />
        )}

        {activeTab === 'kana' && (
          <KanaSoundboard />
        )}

        {activeTab === 'exam' && (
          <MockExam />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/60 py-6 px-4 mt-auto text-center text-xs text-slate-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span>🌸 JLPT N5 Master Prep App</span>
          <span>•</span>
          <span>Basic 1 & 2 • Script Book • N5 Kanji 110</span>
          <span>•</span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs shadow-sm">
            v0.0.1
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Mobile Background Audio & Native Voice Engine • 24 Comprehensive Lessons • Build v0.0.1
        </div>
      </footer>
    </div>
  );
}

