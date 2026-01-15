// TimeControls Component - Buttons for time advancement
//
// Game loop flow:
// 1. User starts at beginning of Day X
// 2. User does activities (training, roster changes, etc.)
// 3. User clicks "Advance Day"
// 4. TODAY's events (Day X) are simulated (including matches)
// 5. User is now at beginning of Day X+1

import { useState } from 'react';
import { calendarService, type TimeAdvanceResult } from '../../services';
import { useGameStore } from '../../store';
import { timeProgression } from '../../engine/calendar';
import type { MatchEventData } from '../../types';

interface TimeControlsProps {
  onTimeAdvanced?: (result: TimeAdvanceResult) => void;
  onMatchSimulated?: (result: TimeAdvanceResult) => void;
  compact?: boolean;
}

export function TimeControls({
  onTimeAdvanced,
  onMatchSimulated,
  compact = false,
}: TimeControlsProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const calendar = useGameStore((state) => state.calendar);
  const getNextMatchEvent = useGameStore((state) => state.getNextMatchEvent);
  const getTodaysActivities = useGameStore((state) => state.getTodaysActivities);
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  const nextMatch = getNextMatchEvent();
  const daysUntilMatch = nextMatch
    ? timeProgression.getDaysDifference(calendar.currentDate, nextMatch.date)
    : null;

  // Check if there's a match for PLAYER'S TEAM today (not just any match)
  const todaysActivities = getTodaysActivities();
  const hasMatchToday = todaysActivities.some((e) => {
    if (e.type !== 'match' || e.processed) return false;
    const data = e.data as MatchEventData;
    return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId;
  });

  const handleAdvanceDay = () => {
    setIsAdvancing(true);
    try {
      const result = calendarService.advanceDay();
      onTimeAdvanced?.(result);

      // If matches were simulated, notify
      if (result.simulatedMatches.length > 0) {
        onMatchSimulated?.(result);
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

      // If matches were simulated, notify
      if (result.simulatedMatches.length > 0) {
        onMatchSimulated?.(result);
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAdvanceToMatch = () => {
    if (!nextMatch || daysUntilMatch === 0) return;

    setIsAdvancing(true);
    try {
      const result = calendarService.advanceToNextMatch();
      onTimeAdvanced?.(result);

      // If matches were simulated on the way, notify
      if (result.simulatedMatches.length > 0) {
        onMatchSimulated?.(result);
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
          className={`px-3 py-1.5 text-sm rounded transition-colors disabled:opacity-50 ${
            hasMatchToday
              ? 'bg-vct-red/20 hover:bg-vct-red/30 text-vct-red'
              : 'bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light'
          }`}
        >
          {hasMatchToday ? 'Play Match' : '+1 Day'}
        </button>
        <button
          onClick={handleAdvanceWeek}
          disabled={isAdvancing}
          className="px-3 py-1.5 text-sm bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded transition-colors disabled:opacity-50"
        >
          +1 Week
        </button>
        {/* Only show "Jump to Match" if match is in the future (not today) */}
        {nextMatch && daysUntilMatch !== null && daysUntilMatch > 0 && (
          <button
            onClick={handleAdvanceToMatch}
            disabled={isAdvancing}
            className="px-3 py-1.5 text-sm bg-vct-red/20 hover:bg-vct-red/30 text-vct-red rounded transition-colors disabled:opacity-50"
          >
            To Match ({daysUntilMatch}d)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <h3 className="text-sm font-semibold text-vct-gray mb-3">Time Controls</h3>

      <div className="space-y-2">
        {/* Advance 1 Day - highlighted if match today */}
        <button
          onClick={handleAdvanceDay}
          disabled={isAdvancing}
          className={`w-full py-2 px-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-between ${
            hasMatchToday
              ? 'bg-vct-red/20 hover:bg-vct-red/30 text-vct-red border border-vct-red/30'
              : 'bg-vct-gray/10 hover:bg-vct-gray/20 text-vct-light'
          }`}
        >
          <span className="font-medium">
            {hasMatchToday ? 'Play Match & Advance' : 'Advance 1 Day'}
          </span>
          <span className={`text-xs ${hasMatchToday ? 'text-vct-red/70' : 'text-vct-gray'}`}>
            {hasMatchToday ? 'Simulates match' : 'End today'}
          </span>
        </button>

        {/* Advance 1 Week */}
        <button
          onClick={handleAdvanceWeek}
          disabled={isAdvancing}
          className="w-full py-2 px-3 bg-vct-gray/10 hover:bg-vct-gray/20 text-vct-light rounded-lg transition-colors disabled:opacity-50 flex items-center justify-between"
        >
          <span className="font-medium">Advance 1 Week</span>
          <span className="text-xs text-vct-gray">Simulates all matches</span>
        </button>

        {/* Jump to Next Match - only show if match is in the future */}
        {nextMatch && daysUntilMatch !== null && daysUntilMatch > 0 ? (
          <button
            onClick={handleAdvanceToMatch}
            disabled={isAdvancing}
            className="w-full py-2 px-3 bg-vct-red/10 hover:bg-vct-red/20 text-vct-red rounded-lg transition-colors disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Jump to Match Day</span>
              <span className="text-xs">
                {daysUntilMatch === 1 ? 'Tomorrow' : `${daysUntilMatch} days`}
              </span>
            </div>
          </button>
        ) : nextMatch && daysUntilMatch === 0 ? (
          <div className="py-2 px-3 bg-vct-red/10 text-vct-red rounded-lg text-center text-sm border border-vct-red/20">
            Match day! Prepare your roster, then advance.
          </div>
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
