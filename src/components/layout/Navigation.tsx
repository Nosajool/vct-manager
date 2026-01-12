// Navigation Component - Main navigation links

import { useGameStore, type ActiveView } from '../../store';

interface NavItem {
  id: ActiveView;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'roster', label: 'Roster', icon: '👥' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'tournament', label: 'Tournament', icon: '🏆' },
  { id: 'finances', label: 'Finances', icon: '💰' },
];

export function Navigation() {
  const activeView = useGameStore((state) => state.activeView);
  const setActiveView = useGameStore((state) => state.setActiveView);

  return (
    <nav className="bg-vct-darker border-b border-vct-gray/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;

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
