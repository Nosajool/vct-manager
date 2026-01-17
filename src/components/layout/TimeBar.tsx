// TimeBar Component - Global time control bar
//
// Single unified interface for all time advancement in the game.
// Appears on all pages. Every match simulation goes through here.
//
// Game loop flow:
// 1. User starts at beginning of Day X
// 2. User does activities (training, roster changes, etc.) on any page
// 3. User clicks button in TimeBar
// 4. TODAY's events (Day X) are simulated (including matches)
// 5. SimulationResultsModal shows what happened
// 6. User is now at beginning of Day X+1

import { useState } from 'react';
import { calendarService, type TimeAdvanceResult } from '../../services';
import { useGameStore } from '../../store';
import { timeProgression } from '../../engine/calendar';
import { SimulationResultsModal } from '../calendar/SimulationResultsModal';
import type { MatchEventData } from '../../types';

export function TimeBar() {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [simulationResult, setSimulationResult] = useState<TimeAdvanceResult | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  const calendar = useGameStore((state) => state.calendar);
  const gameStarted = useGameStore((state) => state.gameStarted);
  const getNextMatchEvent = useGameStore((state) => state.getNextMatchEvent);
  const getTodaysActivities = useGameStore((state) => state.getTodaysActivities);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);

  // Don't show if game hasn't started
  if (!gameStarted) {
    return null;
  }

  const nextMatch = getNextMatchEvent();
  const daysUntilMatch = nextMatch
    ? timeProgression.getDaysDifference(calendar.currentDate, nextMatch.date)
    : null;

  // Check if there's a match for PLAYER'S TEAM today
  const todaysActivities = getTodaysActivities();
  const playerMatchToday = todaysActivities.find((e) => {
    if (e.type !== 'match' || e.processed) return false;
    const data = e.data as MatchEventData;
    return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId;
  });
  const hasMatchToday = !!playerMatchToday;

  // Get opponent name for display
  let opponentName = '';
  if (playerMatchToday) {
    const data = playerMatchToday.data as MatchEventData;
    const opponentId = data.homeTeamId === playerTeamId ? data.awayTeamId : data.homeTeamId;
    opponentName = teams[opponentId]?.name || 'TBD';
  }

  const handleTimeAdvance = (advanceFn: () => TimeAdvanceResult) => {
    setIsAdvancing(true);
    try {
      const result = advanceFn();

      // Always show results modal if matches were simulated
      if (result.simulatedMatches.length > 0) {
        setSimulationResult(result);
        setShowResultsModal(true);
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAdvanceDay = () => {
    handleTimeAdvance(() => calendarService.advanceDay());
  };

  const handleAdvanceWeek = () => {
    handleTimeAdvance(() => calendarService.advanceWeek());
  };

  const handleAdvanceToMatch = () => {
    if (!nextMatch || daysUntilMatch === 0) return;
    handleTimeAdvance(() => calendarService.advanceToNextMatch());
  };

  const handleCloseModal = () => {
    setShowResultsModal(false);
    setSimulationResult(null);
  };

  // Format date for display
  const formattedDate = timeProgression.formatDate(calendar.currentDate);

  // Format phase for display
  const phaseDisplayMap: Record<string, string> = {
    offseason: 'Offseason',
    kickoff: 'Kickoff',
    stage1: 'Stage 1',
    stage1_playoffs: 'Stage 1 Playoffs',
    stage2: 'Stage 2',
    stage2_playoffs: 'Stage 2 Playoffs',
    masters1: 'Masters Santiago',
    masters2: 'Masters London',
    champions: 'Champions',
  };
  const phaseDisplay = phaseDisplayMap[calendar.currentPhase] || calendar.currentPhase;

  return (
    <>
      <div className="bg-vct-darker border-b border-vct-gray/20">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Left: Date and Phase Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-vct-gray text-sm">Date:</span>
                <span className="text-vct-light font-medium">{formattedDate}</span>
              </div>
              <div className="h-4 w-px bg-vct-gray/30" />
              <div className="flex items-center gap-2">
                <span className="text-vct-gray text-sm">Phase:</span>
                <span className="text-vct-light font-medium">{phaseDisplay}</span>
              </div>
              {hasMatchToday && (
                <>
                  <div className="h-4 w-px bg-vct-gray/30" />
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-vct-red/20 text-vct-red text-xs font-semibold rounded uppercase">
                      Match Today
                    </span>
                    <span className="text-vct-light text-sm">vs {opponentName}</span>
                  </div>
                </>
              )}
            </div>

            {/* Right: Time Control Buttons */}
            <div className="flex items-center gap-2">
              {/* Advance Day */}
              <button
                onClick={handleAdvanceDay}
                disabled={isAdvancing}
                className={`px-4 py-1.5 text-sm font-medium rounded transition-colors disabled:opacity-50 ${
                  hasMatchToday
                    ? 'bg-vct-red hover:bg-vct-red/80 text-white'
                    : 'bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light'
                }`}
              >
                {hasMatchToday ? 'Play Match' : 'Advance Day'}
              </button>

              {/* Advance Week */}
              <button
                onClick={handleAdvanceWeek}
                disabled={isAdvancing}
                className="px-4 py-1.5 text-sm font-medium bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded transition-colors disabled:opacity-50"
              >
                Advance Week
              </button>

              {/* Jump to Match - only show if match is in the future */}
              {nextMatch && daysUntilMatch !== null && daysUntilMatch > 0 && (
                <button
                  onClick={handleAdvanceToMatch}
                  disabled={isAdvancing}
                  className="px-4 py-1.5 text-sm font-medium bg-vct-red/20 hover:bg-vct-red/30 text-vct-red rounded transition-colors disabled:opacity-50"
                >
                  Jump to Match ({daysUntilMatch}d)
                </button>
              )}

              {/* Loading indicator */}
              {isAdvancing && (
                <span className="text-vct-gray text-sm ml-2">Processing...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Results Modal */}
      <SimulationResultsModal
        isOpen={showResultsModal}
        onClose={handleCloseModal}
        result={simulationResult}
      />
    </>
  );
}
