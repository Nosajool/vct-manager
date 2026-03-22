// Navigation Component - Main navigation links

import { useGameStore, type ActiveView } from '../../store';
import { GAME_START_DATE } from '../../services/FeatureGateService';

interface NavItem {
  id: ActiveView;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'today', label: 'Today', icon: '📊' },
  { id: 'team', label: 'Team', icon: '👥' },
  { id: 'tournament', label: 'Tournament', icon: '🏆' },
  { id: 'finances', label: 'Finances', icon: '💰' },
];

export function Navigation() {
  const activeView = useGameStore((state) => state.activeView);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const currentDate = useGameStore((state) => state.calendar.currentDate);
  const hasVisitedRoster = useGameStore((state) => state.onboardingHasVisitedRoster);
  const hasVisitedTournament = useGameStore((state) => state.onboardingHasVisitedTournament);

  const isDay1 = currentDate === GAME_START_DATE;

  return (
    <nav className="bg-vct-darker border-b border-vct-gray/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const shouldPulse = isDay1 && !isActive && (
              (item.id === 'team' && !hasVisitedRoster) ||
              (item.id === 'tournament' && !hasVisitedTournament)
            );

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`
                  px-4 py-3 text-sm font-medium transition-colors
                  border-b-2 -mb-px
                  ${
                    isActive
                      ? 'text-vct-red border-vct-red'
                      : 'text-vct-gray border-transparent hover:text-vct-light hover:border-vct-gray/50'
                  }
                  ${shouldPulse ? 'ring-2 ring-vct-red/60 animate-pulse rounded' : ''}
                `}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
