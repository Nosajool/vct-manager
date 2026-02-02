// VCT Manager - Main Application

import { Layout } from './components/layout/Layout';
import { Today } from './pages/Today';
import { Roster } from './pages/Roster';
import { TournamentPage } from './pages/Tournament';
import { Finances } from './pages/Finances';
import { useActiveView } from './store';

function App() {
  const activeView = useActiveView();

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
