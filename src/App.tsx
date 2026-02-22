// VCT Manager - Main Application

import { useEffect, useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Today } from './pages/Today';
import { Roster } from './pages/Roster';
import { TournamentPage } from './pages/Tournament';
import { Finances } from './pages/Finances';
import { useActiveView, useGameStore } from './store';
import { progressTrackingService } from './services/ProgressTrackingService';
import { DebugOverlay } from './components/debug/DebugOverlay';

function App() {
  const activeView = useActiveView();
  const gameStarted = useGameStore((state) => state.gameStarted);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const [debugOpen, setDebugOpen] = useState(false);

  // Initialize worker progress connection on mount
  useEffect(() => {
    progressTrackingService.connectWorkerProgress();
  }, []);

  // Auto-navigate to team view when game hasn't started
  useEffect(() => {
    if (!gameStarted && activeView !== 'team') {
      setActiveView('team');
    }
  }, [gameStarted, activeView, setActiveView]);

  // Backtick toggles debug overlay (skip when focus is in a text input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '`') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      setDebugOpen((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simple view routing based on activeView state
  const renderPage = () => {
    switch (activeView) {
      case 'today':
        return <Today />;
      case 'team':
        return <Roster />; // Team page (file kept as Roster.tsx)
      case 'finances':
        return <Finances />;
      case 'tournament':
        return <TournamentPage />;
      default:
        return <Today />;
    }
  };

  return (
    <>
      <Layout>{renderPage()}</Layout>
      <DebugOverlay isOpen={debugOpen} onClose={() => setDebugOpen(false)} />
    </>
  );
}

export default App;
