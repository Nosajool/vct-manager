// VCT Manager - Main Application

import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { Today } from './pages/Today';
import { Roster } from './pages/Roster';
import { TournamentPage } from './pages/Tournament';
import { Finances } from './pages/Finances';
import { useActiveView, useGameStore } from './store';

function App() {
  const activeView = useActiveView();
  const gameStarted = useGameStore((state) => state.gameStarted);
  const setActiveView = useGameStore((state) => state.setActiveView);

  // Auto-navigate to team view when game hasn't started
  useEffect(() => {
    if (!gameStarted && activeView !== 'team') {
      setActiveView('team');
    }
  }, [gameStarted, activeView, setActiveView]);

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

  return <Layout>{renderPage()}</Layout>;
}

export default App;
