// VCT Manager - Main Application

import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Roster } from './pages/Roster';
import { Schedule } from './pages/Schedule';
import { useActiveView } from './store';

function App() {
  const activeView = useActiveView();

  // Simple view routing based on activeView state
  const renderPage = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'roster':
        return <Roster />;
      case 'schedule':
        return <Schedule />;
      case 'training':
        return <PlaceholderPage title="Training" description="Coming in Phase 3" />;
      case 'finances':
        return <PlaceholderPage title="Finances" description="Coming in Phase 5" />;
      case 'match':
        return <PlaceholderPage title="Match" description="Coming in Phase 2" />;
      case 'tournament':
        return <PlaceholderPage title="Tournament" description="Coming in Phase 4" />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}

// Placeholder component for pages not yet implemented
interface PlaceholderPageProps {
  title: string;
  description: string;
}

function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 bg-vct-darker border border-vct-gray/30 rounded-lg flex items-center justify-center mb-6">
        <span className="text-4xl text-vct-gray">🚧</span>
      </div>
      <h2 className="text-2xl font-bold text-vct-light mb-2">{title}</h2>
      <p className="text-vct-gray">{description}</p>
    </div>
  );
}

export default App;
