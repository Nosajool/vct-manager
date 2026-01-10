// TimeControls Component - Buttons for time advancement

import { useState } from 'react';
import { calendarService, type TimeAdvanceResult } from '../../services';
import { useGameStore } from '../../store';
import { timeProgression } from '../../engine/calendar';

interface TimeControlsProps {
  onTimeAdvanced?: (result: TimeAdvanceResult) => void;
  onMatchReached?: (matchEvent: TimeAdvanceResult['needsAttention'][0]) => void;
  compact?: boolean;
}

export function TimeControls({
  onTimeAdvanced,
  onMatchReached,
  compact = false,
}: TimeControlsProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const calendar = useGameStore((state) => state.calendar);
  const getNextMatchEvent = useGameStore((state) => state.getNextMatchEvent);

  const nextMatch = getNextMatchEvent();
  const daysUntilMatch = nextMatch
    ? timeProgression.getDaysDifference(calendar.currentDate, nextMatch.date)
    : null;

  const handleAdvanceDay = () => {
    setIsAdvancing(true);
    try {
      const result = calendarService.advanceDay();
      onTimeAdvanced?.(result);

      // Check if we hit a match
      const matchEvent = result.needsAttention.find((e) => e.type === 'match');
      if (matchEvent) {
        onMatchReached?.(matchEvent);
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAdvanceWeek = () => {
    setIsAdvancing(true);
    try {
      const result = calendarService.advanceWeek();
      onTimeAdvanced?.(result);

      // If week advance failed due to match, notify
      if (!result.success && result.needsAttention.length > 0) {
        const matchEvent = result.needsAttention.find((e) => e.type === 'match');
        if (matchEvent) {
          onMatchReached?.(matchEvent);
        }
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAdvanceToMatch = () => {
    if (!nextMatch) return;

    setIsAdvancing(true);
    try {
      const result = calendarService.advanceToNextMatch();
      onTimeAdvanced?.(result);

      // Notify of match
      const matchEvent = result.needsAttention.find((e) => e.type === 'match');
      if (matchEvent) {
        onMatchReached?.(matchEvent);
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleAdvanceDay}
          disabled={isAdvancing}
          className="px-3 py-1.5 text-sm bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded transition-colors disabled:opacity-50"
        >
          +1 Day
        </button>
        <button
          onClick={handleAdvanceWeek}
          disabled={isAdvancing}
          className="px-3 py-1.5 text-sm bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded transition-colors disabled:opacity-50"
        >
          +1 Week
        </button>
        {nextMatch && daysUntilMatch !== null && daysUntilMatch > 0 && (
          <button
            onClick={handleAdvanceToMatch}
            disabled={isAdvancing}
            className="px-3 py-1.5 text-sm bg-vct-red/20 hover:bg-vct-red/30 text-vct-red rounded transition-colors disabled:opacity-50"
          >
            Next Match ({daysUntilMatch}d)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <h3 className="text-sm font-semibold text-vct-gray mb-3">Time Controls</h3>

      <div className="space-y-2">
        {/* Advance 1 Day */}
        <button
          onClick={handleAdvanceDay}
          disabled={isAdvancing}
          className="w-full py-2 px-3 bg-vct-gray/10 hover:bg-vct-gray/20 text-vct-light rounded-lg transition-colors disabled:opacity-50 flex items-center justify-between"
        >
          <span className="font-medium">Advance 1 Day</span>
          <span className="text-xs text-vct-gray">Daily activities</span>
        </button>

        {/* Advance 1 Week */}
        <button
          onClick={handleAdvanceWeek}
          disabled={isAdvancing}
          className="w-full py-2 px-3 bg-vct-gray/10 hover:bg-vct-gray/20 text-vct-light rounded-lg transition-colors disabled:opacity-50 flex items-center justify-between"
        >
          <span className="font-medium">Advance 1 Week</span>
          <span className="text-xs text-vct-gray">Skip optional events</span>
        </button>

        {/* Jump to Next Match */}
        {nextMatch ? (
          <button
            onClick={handleAdvanceToMatch}
            disabled={isAdvancing}
            className="w-full py-2 px-3 bg-vct-red/10 hover:bg-vct-red/20 text-vct-red rounded-lg transition-colors disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Jump to Next Match</span>
              <span className="text-xs">
                {daysUntilMatch === 0
                  ? 'Today!'
                  : daysUntilMatch === 1
                  ? 'Tomorrow'
                  : `${daysUntilMatch} days`}
              </span>
            </div>
          </button>
        ) : (
          <div className="py-2 px-3 bg-vct-gray/5 text-vct-gray rounded-lg text-center text-sm">
            No upcoming matches scheduled
          </div>
        )}
      </div>

      {/* Status */}
      {isAdvancing && (
        <div className="mt-3 text-center text-sm text-vct-gray">
          Advancing time...
        </div>
      )}
    </div>
  );
}
