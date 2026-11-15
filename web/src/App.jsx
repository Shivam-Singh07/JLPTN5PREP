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
    <div className="min-h-screen flex flex-col bg-[#121214] text-[#f4f3ee] selection:bg-[#c53d33] selection:text-white">
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
            currentRate={currentRate}
            setCurrentRate={setCurrentRate}
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

      {/* Minimalist Japanese Footer */}
      <footer className="border-t border-white/5 bg-[#0e0e10]/90 py-6 px-4 mt-auto text-center text-xs text-stone-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <span className="font-mincho text-stone-400">日本語能力試験 N5 完全対策</span>
          <span>•</span>
          <span>JLPT N5 Prep Master</span>
          <span>•</span>
          <span>全24課 • 漢字110 • 聴解・文法</span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-stone-800 text-stone-400 border border-white/5">
            v0.0.3
          </span>
        </div>
        <div className="text-[11px] text-stone-600">
          Designed for focused, distraction-free Japanese language acquisition.
        </div>
      </footer>
    </div>
  );
}
