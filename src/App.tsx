// VCT Manager - Main Application

import { useEffect, useRef, useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Today } from './pages/Today';
import { Roster } from './pages/Roster';
import { TournamentPage } from './pages/Tournament';
import { Finances } from './pages/Finances';
import { useActiveView, useGameStore } from './store';
import { progressTrackingService } from './services/ProgressTrackingService';
import { DebugOverlay } from './components/debug/DebugOverlay';
import { SetupWizard, type SetupOptions } from './components/setup';
import { gameInitService } from './services/GameInitService';

function App() {
  const activeView = useActiveView();
  const gameStarted = useGameStore((state) => state.gameStarted);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const [debugOpen, setDebugOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize worker progress connection on mount
  useEffect(() => {
    progressTrackingService.connectWorkerProgress();
  }, []);

  // Navigate to today when game first starts (setup wizard completion)
  const prevGameStarted = useRef(gameStarted);
  useEffect(() => {
    if (gameStarted && !prevGameStarted.current) {
      setActiveView('today');
    }
    prevGameStarted.current = gameStarted;
  }, [gameStarted, setActiveView]);

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

  const handleSetupComplete = async (options: SetupOptions) => {
    setIsInitializing(true);
    try {
      await gameInitService.initializeNewGame({
        playerRegion: options.region,
        playerTeamName: options.teamName,
        difficulty: options.difficulty,
      });
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
    setIsInitializing(false);
  };

  // Render setup wizard above Layout so no page components mount during setup
  if (!gameStarted) {
    return isInitializing ? (
      <div className="min-h-screen bg-vct-dark flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-vct-darker border border-vct-gray/30 rounded-lg flex items-center justify-center mb-6 animate-pulse">
          <span className="text-5xl">🎮</span>
        </div>
        <h2 className="text-2xl font-bold text-vct-light mb-2">Initializing Game...</h2>
        <p className="text-vct-gray text-center max-w-md">
          Generating teams, players, and tournaments. This may take a moment.
        </p>
      </div>
    ) : (
      <SetupWizard onComplete={handleSetupComplete} />
    );
  }

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
