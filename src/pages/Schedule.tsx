// Schedule Page - Visual calendar view for matches and events
//
// Note: Time controls are now in the global TimeBar (Layout component).
// All match simulation goes through the TimeBar.

import { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../store';
import { MatchResult } from '../components/match/MatchResult';
import { TournamentCardMini } from '../components/tournament';
import {
  TrainingModal,
  MonthCalendar,
  DayDetailPanel,
} from '../components/calendar';
import { ScrimModal } from '../components/scrim';
import { getPhaseStatusDisplay } from '../utils/phaseStatus';
import type { Match, MatchEventData } from '../types';

type ViewMode = 'calendar' | 'results';

export function Schedule() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [scrimModalOpen, setScrimModalOpen] = useState(false);
  const [viewDate, setViewDate] = useState<string | null>(null);

  const gameStarted = useGameStore((state) => state.gameStarted);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const matches = useGameStore((state) => state.matches);
  const tournaments = useGameStore((state) => state.tournaments);
  const calendar = useGameStore((state) => state.calendar);
  const setActiveView = useGameStore((state) => state.setActiveView);
  
  // Initialize selectedDate to current date
  const [selectedDate, setSelectedDate] = useState<string>(calendar.currentDate);

  // Initialize viewDate to current date if not set
  const currentViewDate = viewDate || calendar.currentDate;

  const activeTournaments = useMemo(
    () => Object.values(tournaments).filter((t) => t.status === 'in_progress'),
    [tournaments]
  );

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;

  // Get phase-appropriate status display
  const phaseStatus = useMemo(() => {
    if (!playerTeamId || !playerTeam) return null;
    return getPhaseStatusDisplay(
      calendar.currentPhase,
      playerTeamId,
      playerTeam,
      tournaments
    );
  }, [calendar.currentPhase, playerTeamId, playerTeam, tournaments]);

  // Get all events for calendar display
  const allEvents = useMemo(() => {
    return calendar.scheduledEvents;
  }, [calendar.scheduledEvents]);

  // Get match events for the player's team (for results view)
  const matchEvents = useMemo(() => {
    if (!playerTeamId) return [];
    return calendar.scheduledEvents
      .filter((event) => {
        if (event.type !== 'match') return false;
        const data = event.data as MatchEventData;
        return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId;
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Newest first for results
  }, [calendar.scheduledEvents, playerTeamId]);

  // Completed match events for results view
  const completedMatchEvents = useMemo(
    () => matchEvents.filter((e) => e.processed),
    [matchEvents]
  );

  // Handle viewing a match result
  const handleViewMatch = useCallback((match: Match) => {
    if (match.status === 'completed') {
      setSelectedMatch(match);
    }
  }, []);

  // Handle date selection from calendar
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  // Handle month change
  const handleMonthChange = (date: string) => {
    setViewDate(date);
  };

  // Handle training click
  const handleTrainingClick = () => {
    setTrainingModalOpen(true);
  };

  // Handle scrim click
  const handleScrimClick = () => {
    setScrimModalOpen(true);
  };

  // Not started yet
  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 bg-vct-darker border border-vct-gray/30 rounded-lg flex items-center justify-center mb-6">
          <span className="text-5xl">📅</span>
        </div>
        <h2 className="text-2xl font-bold text-vct-light mb-2">
          No Schedule Yet
        </h2>
        <p className="text-vct-gray mb-6 text-center max-w-md">
          Start a new game from the Roster page to begin managing your team's
          schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-vct-light">Schedule</h1>
          {playerTeam && (
            <p className="text-vct-gray mt-1">
              {playerTeam.name} - {playerTeam.region}
            </p>
          )}
        </div>

        {/* Team Record */}
        {playerTeam && phaseStatus && (
          <div className="flex items-center gap-6 text-sm">
            {phaseStatus.type === 'bracket' ? (
              // Bracket display - show position
              <div className="text-center">
                <p className={`text-2xl font-bold ${
                  phaseStatus.bracketPosition?.isEliminated
                    ? 'text-red-400'
                    : phaseStatus.bracketPosition?.isChampion
                    ? 'text-yellow-400'
                    : 'text-vct-light'
                }`}>
                  {phaseStatus.label}
                </p>
                <p className="text-vct-gray text-xs">{phaseStatus.sublabel}</p>
              </div>
            ) : phaseStatus.type === 'swiss' ? (
              // Swiss display - show record
              <div className="text-center">
                <p className="text-2xl font-bold text-vct-light">
                  {phaseStatus.label}
                </p>
                <p className="text-vct-gray text-xs">{phaseStatus.sublabel}</p>
              </div>
            ) : phaseStatus.record ? (
              // League/career display - show full record with RD
              <>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {phaseStatus.record.wins}
                  </p>
                  <p className="text-vct-gray">Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {phaseStatus.record.losses}
                  </p>
                  <p className="text-vct-gray">Losses</p>
                </div>
                {phaseStatus.record.roundDiff !== undefined && (
                  <div className="text-center">
                    <p
                      className={`text-2xl font-bold ${
                        phaseStatus.record.roundDiff >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {phaseStatus.record.roundDiff >= 0 ? '+' : ''}
                      {phaseStatus.record.roundDiff}
                    </p>
                    <p className="text-vct-gray">RD</p>
                  </div>
                )}
                <div className="text-center ml-2 border-l border-vct-gray/30 pl-4">
                  <p className="text-xs text-vct-gray">{phaseStatus.sublabel}</p>
                </div>
              </>
            ) : (
              // Fallback
              <div className="text-center">
                <p className="text-2xl font-bold text-vct-light">
                  {phaseStatus.label}
                </p>
                <p className="text-vct-gray text-xs">{phaseStatus.sublabel}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center border-b border-vct-gray/20">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              viewMode === 'calendar'
                ? 'text-vct-red border-vct-red'
                : 'text-vct-gray border-transparent hover:text-vct-light'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setViewMode('results')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              viewMode === 'results'
                ? 'text-vct-red border-vct-red'
                : 'text-vct-gray border-transparent hover:text-vct-light'
            }`}
          >
            Results ({completedMatchEvents.length})
          </button>
        </div>
      </div>

      {/* Active Tournaments Banner */}
      {activeTournaments.length > 0 && (
        <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-vct-red uppercase">
              Active Tournaments
            </h3>
            <button
              onClick={() => setActiveView('tournament')}
              className="text-xs text-vct-gray hover:text-white"
            >
              View All
            </button>
          </div>
          <div className="space-y-1">
            {activeTournaments.map((tournament) => (
              <TournamentCardMini
                key={tournament.id}
                tournament={tournament}
                onClick={() => setActiveView('tournament')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <MonthCalendar
              currentDate={calendar.currentDate}
              viewDate={currentViewDate}
              events={allEvents}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
            />
          </div>

          {/* Day Details Panel */}
          <div>
            {selectedDate ? (
              <DayDetailPanel
                selectedDate={selectedDate}
                currentDate={calendar.currentDate}
                events={allEvents}
                teams={teams}
                matches={matches}
                playerTeamId={playerTeamId}
                onViewMatch={handleViewMatch}
                onTrainingClick={handleTrainingClick}
                onScrimClick={handleScrimClick}
              />
            ) : (
              <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
                <p className="text-vct-gray text-center py-8">
                  Select a date to view details
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-4">
          {completedMatchEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {completedMatchEvents.map((event) => {
                const data = event.data as MatchEventData;
                const homeTeamId = data.homeTeamId;
                const awayTeamId = data.awayTeamId;
                const homeTeam = teams[homeTeamId];
                const awayTeam = teams[awayTeamId];
                const matchId = data.matchId;
                const match = matchId ? matches[matchId] : null;
                const isTournament = !!data.tournamentId;

                return (
                  <div
                    key={event.id}
                    className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4 cursor-pointer hover:border-vct-gray/40 transition-colors"
                    onClick={() => match && handleViewMatch(match)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-vct-gray">{event.date}</span>
                      <div className="flex items-center gap-2">
                        {isTournament && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                            Tournament
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                          Completed
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className={`font-semibold ${homeTeamId === playerTeamId ? 'text-vct-red' : 'text-vct-light'}`}>
                          {homeTeam?.name || 'TBD'}
                        </p>
                        {match?.result && (
                          <p className="text-xl font-bold text-vct-light mt-1">
                            {match.result.scoreTeamA}
                          </p>
                        )}
                      </div>
                      <div className="px-4 text-vct-gray text-sm">
                        {match?.result ? '-' : 'vs'}
                      </div>
                      <div className="text-center flex-1">
                        <p className={`font-semibold ${awayTeamId === playerTeamId ? 'text-vct-red' : 'text-vct-light'}`}>
                          {awayTeam?.name || 'TBD'}
                        </p>
                        {match?.result && (
                          <p className="text-xl font-bold text-vct-light mt-1">
                            {match.result.scoreTeamB}
                          </p>
                        )}
                      </div>
                    </div>
                    {match?.result && (
                      <div className="mt-2 text-center">
                        <span className={`text-xs ${match.result.winnerId === playerTeamId ? 'text-green-400' : 'text-red-400'}`}>
                          {match.result.winnerId === playerTeamId ? 'Victory' : 'Defeat'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-8 text-center">
              <p className="text-vct-gray">No completed matches yet</p>
            </div>
          )}
        </div>
      )}

      {/* Match Result Modal */}
      {selectedMatch && selectedMatch.status === 'completed' && (
        <MatchResult
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* Training Modal */}
      <TrainingModal
        isOpen={trainingModalOpen}
        onClose={() => setTrainingModalOpen(false)}
      />

      {/* Scrim Modal */}
      <ScrimModal
        isOpen={scrimModalOpen}
        onClose={() => setScrimModalOpen(false)}
      />
    </div>
  );
}
