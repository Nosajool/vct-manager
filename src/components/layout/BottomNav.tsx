// BottomNav Component - Fixed bottom navigation bar
//
// Two-row layout (BitLife-style):
//   Row 1: Advance Day / Play Match action button
//   Row 2: Hub / Team / Tournament / Finances nav chips

import { useGameStore, type ActiveView } from '../../store';
import { GAME_START_DATE } from '../../services/FeatureGateService';

interface BottomNavProps {
  onAdvanceDay: () => void;
  hasMatchToday: boolean;
  isAdvancing: boolean;
}

const navItems: Array<{ id: ActiveView; label: string; icon: string }> = [
  { id: 'today', label: 'Hub', icon: '📊' },
  { id: 'team', label: 'Team', icon: '👥' },
  { id: 'tournament', label: 'Tournament', icon: '🏆' },
  { id: 'finances', label: 'Finances', icon: '💰' },
];

export function BottomNav({ onAdvanceDay, hasMatchToday, isAdvancing }: BottomNavProps) {
  const activeView = useGameStore((state) => state.activeView);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const currentDate = useGameStore((state) => state.calendar.currentDate);
  const hasVisitedRoster = useGameStore((state) => state.onboardingHasVisitedRoster);
  const hasVisitedTournament = useGameStore((state) => state.onboardingHasVisitedTournament);

  const isDay1 = currentDate === GAME_START_DATE;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-vct-darker border-t border-vct-gray/20">
      {/* Action Row */}
      <div className="flex items-center justify-center px-4 pt-3 pb-2 max-w-7xl mx-auto">
        <button
          onClick={onAdvanceDay}
          disabled={isAdvancing}
          className={`w-full max-w-sm px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
            hasMatchToday
              ? 'bg-vct-red hover:bg-vct-red/80 text-white'
              : 'bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light'
          } ${isDay1 ? 'ring-2 ring-vct-red/60 animate-pulse' : ''}`}
        >
          {isAdvancing
            ? 'Processing...'
            : hasMatchToday
            ? '▶  Play Match'
            : '▷  Advance Day'}
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-vct-gray/10" />

      {/* Nav Chips Row */}
      <div className="flex items-stretch max-w-7xl mx-auto">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const shouldPulse =
            isDay1 &&
            !isActive &&
            ((item.id === 'team' && !hasVisitedRoster) ||
              (item.id === 'tournament' && !hasVisitedTournament));

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                isActive ? 'text-vct-red' : 'text-vct-gray hover:text-vct-light'
              } ${shouldPulse ? 'ring-2 ring-inset ring-vct-red/60 animate-pulse' : ''}`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
