// Header Component - Game title, date display, and save/load buttons

import { useCurrentDate, useGameStore } from '../../store';
import { format } from 'date-fns';

// Parse date string as local time to avoid timezone issues
function parseAsLocalDate(dateStr: string): Date {
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function Header() {
  const currentDate = useCurrentDate();
  const currentPhase = useGameStore((state) => state.calendar.currentPhase);
  const currentSeason = useGameStore((state) => state.calendar.currentSeason);

  // Format the date for display (parse as local time to avoid timezone issues)
  const formattedDate = currentDate
    ? format(parseAsLocalDate(currentDate), 'MMM dd, yyyy')
    : 'Not Started';

  // Format phase for display
  const phaseDisplay = currentPhase
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str: string) => str.toUpperCase())
    .replace(/(\d+)/, ' $1');

  return (
    <header className="bg-vct-darker border-b border-vct-gray/20">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-vct-red rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-vct-light">VCT Manager</h1>
              <p className="text-xs text-vct-gray">Season {currentSeason}</p>
            </div>
          </div>

          {/* Date and Phase */}
          <div className="text-center">
            <p className="text-lg font-semibold text-vct-light">{formattedDate}</p>
            <p className="text-xs text-vct-gray uppercase tracking-wide">
              {phaseDisplay}
            </p>
          </div>

          {/* Save/Load Buttons - REMOVED */}
          <div className="flex items-center gap-2">
            {/* Save and Load buttons removed - UI functionality removed */}
          </div>
        </div>
      </div>
    </header>
  );
}
