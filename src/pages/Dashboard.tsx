// Dashboard Page - Main game interface with calendar and time controls

import { useState } from 'react';
import { useGameStore } from '../store';
import { matchService, type TimeAdvanceResult } from '../services';
import {
  CalendarView,
  TimeControls,
  TodayActivities,
  TrainingModal,
} from '../components/calendar';
import type { CalendarEvent } from '../types';

export function Dashboard() {
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [lastAdvanceResult, setLastAdvanceResult] = useState<TimeAdvanceResult | null>(null);

  const players = useGameStore((state) => state.players);
  const teams = useGameStore((state) => state.teams);
  const initialized = useGameStore((state) => state.initialized);
  const gameStarted = useGameStore((state) => state.gameStarted);
  const calendar = useGameStore((state) => state.calendar);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const getNextMatchEvent = useGameStore((state) => state.getNextMatchEvent);

  const playerCount = Object.keys(players).length;
  const teamCount = Object.keys(teams).length;
  const playerTeam = playerTeamId ? teams[playerTeamId] : null;
  const nextMatch = getNextMatchEvent();

  // Handle time advancement
  const handleTimeAdvanced = (result: TimeAdvanceResult) => {
    setLastAdvanceResult(result);

    // Auto-dismiss notification after 3 seconds
    setTimeout(() => setLastAdvanceResult(null), 3000);
  };

  // Handle match reached
  const handleMatchReached = (matchEvent: CalendarEvent) => {
    console.log('Match reached:', matchEvent);
    // Match will be shown in TodayActivities
  };

  // Handle match simulation from TodayActivities
  const handleMatchClick = (matchEvent: CalendarEvent) => {
    const data = matchEvent.data as Record<string, unknown>;
    const matchId = data?.matchId as string;

    if (matchId) {
      // Create a match in the store if needed and simulate
      const result = matchService.simulateMatch(matchId);
      if (result) {
        // Mark the calendar event as processed
        useGameStore.getState().markEventProcessed(matchEvent.id);
      }
    }
  };

  // Handle training click
  const handleTrainingClick = () => {
    setTrainingModalOpen(true);
  };

  // Show loading state if not initialized
  if (!initialized || !gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-xl text-vct-gray mb-4">Game not initialized</p>
          <p className="text-sm text-vct-gray/60">Start a new game to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Advancement Notification */}
      {lastAdvanceResult && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-blue-400">Time Advanced</span>
            <span className="text-vct-gray">
              +{lastAdvanceResult.daysAdvanced} day{lastAdvanceResult.daysAdvanced !== 1 ? 's' : ''}
            </span>
            {lastAdvanceResult.processedEvents.length > 0 && (
              <span className="text-vct-gray/60 text-sm">
                | {lastAdvanceResult.processedEvents.length} event{lastAdvanceResult.processedEvents.length !== 1 ? 's' : ''} processed
              </span>
            )}
          </div>
          <button
            onClick={() => setLastAdvanceResult(null)}
            className="text-vct-gray hover:text-vct-light"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Team Header */}
      {playerTeam && (
        <div className="bg-gradient-to-r from-vct-red/20 to-vct-dark border border-vct-red/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-vct-light">{playerTeam.name}</h2>
              <p className="text-vct-gray">{playerTeam.region} | Season {calendar.currentSeason}</p>
            </div>
            <div className="text-right">
              <p className="text-vct-light font-bold text-xl">
                {playerTeam.standings.wins}W - {playerTeam.standings.losses}L
              </p>
              <p className="text-vct-gray text-sm">
                Balance: ${(playerTeam.finances.balance / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Calendar & Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Activities */}
          <TodayActivities
            onMatchClick={handleMatchClick}
            onTrainingClick={handleTrainingClick}
          />

          {/* Calendar View */}
          <CalendarView showFullSchedule maxEvents={5} />
        </div>

        {/* Right Column - Time Controls & Stats */}
        <div className="space-y-6">
          {/* Time Controls */}
          <TimeControls
            onTimeAdvanced={handleTimeAdvanced}
            onMatchReached={handleMatchReached}
          />

          {/* Quick Stats */}
          <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
            <h3 className="text-sm font-semibold text-vct-gray mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <StatRow label="Roster Size" value={`${playerTeam?.playerIds.length || 0} / 5`} />
              <StatRow label="Reserves" value={`${playerTeam?.reservePlayerIds.length || 0} / 2`} />
              <StatRow
                label="Next Match"
                value={nextMatch ? 'Scheduled' : 'None'}
                valueColor={nextMatch ? 'text-green-400' : 'text-vct-gray'}
              />
              <StatRow
                label="Current Phase"
                value={calendar.currentPhase.replace(/([0-9]+)/g, ' $1')}
              />
            </div>
          </div>

          {/* Game Summary */}
          <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
            <h3 className="text-sm font-semibold text-vct-gray mb-3">Game Summary</h3>
            <div className="space-y-3">
              <StatRow label="Total Players" value={playerCount} />
              <StatRow label="Total Teams" value={teamCount} />
              <StatRow
                label="Scheduled Events"
                value={calendar.scheduledEvents.filter((e) => !e.processed).length}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Phase 3 Complete Banner */}
      <div className="bg-gradient-to-r from-green-500/10 to-vct-dark border border-green-500/30 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-green-400">3</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-vct-light">Phase 3: Calendar System</h2>
            <p className="text-vct-gray">
              Time progression, event scheduling, and player training
            </p>
          </div>
        </div>
      </div>

      {/* Phase Checklist */}
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-vct-light mb-4">Phase 3 Checklist</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <ChecklistItem checked label="Enhanced gameSlice with calendar" />
          <ChecklistItem checked label="TimeProgression engine" />
          <ChecklistItem checked label="EventScheduler engine" />
          <ChecklistItem checked label="CalendarService orchestration" />
          <ChecklistItem checked label="Season schedule generation" />
          <ChecklistItem checked label="PlayerDevelopment engine" />
          <ChecklistItem checked label="TrainingService" />
          <ChecklistItem checked label="Calendar UI components" />
          <ChecklistItem checked label="Time control buttons" />
          <ChecklistItem checked label="Training modal" />
        </div>
      </div>

      {/* Training Modal */}
      <TrainingModal
        isOpen={trainingModalOpen}
        onClose={() => setTrainingModalOpen(false)}
      />
    </div>
  );
}

// Stat Row Component
function StatRow({
  label,
  value,
  valueColor = 'text-vct-light',
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-vct-gray text-sm">{label}</span>
      <span className={`font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}

// Checklist Item Component
function ChecklistItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-5 h-5 rounded flex items-center justify-center text-xs
          ${checked ? 'bg-green-500/20 text-green-400' : 'bg-vct-gray/20 text-vct-gray'}`}
      >
        {checked ? '✓' : '○'}
      </span>
      <span className={checked ? 'text-vct-light' : 'text-vct-gray'}>{label}</span>
    </div>
  );
}
