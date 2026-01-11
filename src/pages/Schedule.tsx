// Schedule Page - View and simulate matches

import { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../store';
import { matchService, type TimeAdvanceResult } from '../services';
import { MatchResult } from '../components/match/MatchResult';
import { TournamentCardMini } from '../components/tournament';
import {
  TimeControls,
  TodayActivities,
  TrainingModal,
} from '../components/calendar';
import { ScrimModal } from '../components/scrim';
import type { Match, CalendarEvent } from '../types';

type ScheduleTab = 'upcoming' | 'results';
type MatchFilter = 'all' | 'league' | 'tournament';

export function Schedule() {
  const [activeTab, setActiveTab] = useState<ScheduleTab>('upcoming');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [scrimModalOpen, setScrimModalOpen] = useState(false);
  const [lastAdvanceResult, setLastAdvanceResult] = useState<TimeAdvanceResult | null>(null);

  const gameStarted = useGameStore((state) => state.gameStarted);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const matches = useGameStore((state) => state.matches);
  const tournaments = useGameStore((state) => state.tournaments);
  const calendar = useGameStore((state) => state.calendar);
  const getUpcomingEvents = useGameStore((state) => state.getUpcomingEvents);
  const setActiveView = useGameStore((state) => state.setActiveView);

  const activeTournaments = useMemo(
    () => Object.values(tournaments).filter((t) => t.status === 'in_progress'),
    [tournaments]
  );

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;

  // Get match events from calendar for the player's team
  const matchEvents = useMemo(() => {
    if (!playerTeamId) return [];
    return calendar.scheduledEvents
      .filter((event) => {
        if (event.type !== 'match') return false;
        const data = event.data as Record<string, unknown>;
        const homeTeamId = data?.homeTeamId as string;
        const awayTeamId = data?.awayTeamId as string;
        return homeTeamId === playerTeamId || awayTeamId === playerTeamId;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [calendar.scheduledEvents, playerTeamId]);

  // Apply filter to match events
  const filteredMatchEvents = useMemo(() => {
    if (matchFilter === 'all') return matchEvents;
    if (matchFilter === 'tournament') {
      return matchEvents.filter((e) => {
        const data = e.data as Record<string, unknown>;
        return !!data?.tournamentId;
      });
    }
    return matchEvents.filter((e) => {
      const data = e.data as Record<string, unknown>;
      return !data?.tournamentId;
    });
  }, [matchEvents, matchFilter]);

  // Split into upcoming (not processed) and completed (processed)
  const upcomingMatchEvents = useMemo(
    () => filteredMatchEvents.filter((e) => !e.processed),
    [filteredMatchEvents]
  );

  const completedMatchEvents = useMemo(
    () => filteredMatchEvents.filter((e) => e.processed).sort((a, b) => b.date.localeCompare(a.date)),
    [filteredMatchEvents]
  );


  // Handle match simulation
  const handleSimulate = useCallback(
    (matchId: string) => {
      setIsSimulating(true);

      // Simulate with a small delay for UX
      setTimeout(() => {
        const result = matchService.simulateMatch(matchId);
        setIsSimulating(false);

        if (result) {
          // Switch to results tab and show the completed match
          setActiveTab('results');
          const match = matches[matchId];
          if (match) {
            setSelectedMatch({ ...match, status: 'completed' });
          }
        }
      }, 500);
    },
    [matches]
  );

  // Handle viewing a match result
  const handleViewMatch = (match: Match) => {
    if (match.status === 'completed') {
      setSelectedMatch(match);
    }
  };

  // Create a test match if none exist
  const handleCreateTestMatch = () => {
    if (!playerTeamId) return;

    // Find another team in the same region
    const otherTeams = Object.values(teams).filter(
      (t) => t.id !== playerTeamId && t.region === playerTeam?.region
    );

    if (otherTeams.length === 0) return;

    const opponent = otherTeams[Math.floor(Math.random() * otherTeams.length)];
    const today = new Date().toISOString().split('T')[0];

    matchService.createMatch(playerTeamId, opponent.id, today);
  };

  // Handle time advancement
  const handleTimeAdvanced = (result: TimeAdvanceResult) => {
    setLastAdvanceResult(result);
    setTimeout(() => setLastAdvanceResult(null), 3000);
  };

  // Handle match reached via time controls
  const handleMatchReached = (matchEvent: CalendarEvent) => {
    console.log('Match reached:', matchEvent);
  };

  // Handle match simulation from TodayActivities
  const handleMatchClick = (matchEvent: CalendarEvent) => {
    const data = matchEvent.data as Record<string, unknown>;
    const matchId = data?.matchId as string;

    if (matchId) {
      const result = matchService.simulateMatch(matchId);
      if (result) {
        useGameStore.getState().markEventProcessed(matchEvent.id);
        setActiveTab('results');
      }
    }
  };

  // Handle training click
  const handleTrainingClick = () => {
    setTrainingModalOpen(true);
  };

  // Handle scrim click
  const handleScrimClick = () => {
    setScrimModalOpen(true);
  };

  // Get all upcoming events for the full schedule view
  const allUpcomingEvents = getUpcomingEvents(50);

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-vct-light">Full Schedule</h1>
          {playerTeam && (
            <p className="text-vct-gray mt-1">
              {playerTeam.name} - {playerTeam.region} | {calendar.currentDate}
            </p>
          )}
        </div>

        {/* Team Record */}
        {playerTeam && (
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {playerTeam.standings.wins}
              </p>
              <p className="text-vct-gray">Wins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">
                {playerTeam.standings.losses}
              </p>
              <p className="text-vct-gray">Losses</p>
            </div>
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${
                  playerTeam.standings.roundDiff >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {playerTeam.standings.roundDiff >= 0 ? '+' : ''}
                {playerTeam.standings.roundDiff}
              </p>
              <p className="text-vct-gray">RD</p>
            </div>
          </div>
        )}
      </div>

      {/* Today's Activities & Time Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodayActivities
            onMatchClick={handleMatchClick}
            onTrainingClick={handleTrainingClick}
            onScrimClick={handleScrimClick}
          />
        </div>
        <div>
          <TimeControls
            onTimeAdvanced={handleTimeAdvanced}
            onMatchReached={handleMatchReached}
          />
        </div>
      </div>

      {/* Tabs and Filter */}
      <div className="flex items-center justify-between border-b border-vct-gray/20">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'upcoming'
                ? 'text-vct-red border-vct-red'
                : 'text-vct-gray border-transparent hover:text-vct-light'
            }`}
          >
            Upcoming ({upcomingMatchEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'results'
                ? 'text-vct-red border-vct-red'
                : 'text-vct-gray border-transparent hover:text-vct-light'
            }`}
          >
            Results ({completedMatchEvents.length})
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-1 pb-2">
          {(['all', 'league', 'tournament'] as MatchFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setMatchFilter(filter)}
              className={`px-3 py-1 text-xs rounded ${
                matchFilter === filter
                  ? 'bg-vct-red text-white'
                  : 'bg-vct-gray/20 text-vct-gray hover:text-white'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
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

      {/* Content */}
      {activeTab === 'upcoming' ? (
        <div className="space-y-4">
          {upcomingMatchEvents.length > 0 ? (
            <>
              {isSimulating && (
                <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4 text-center">
                  <p className="text-vct-light animate-pulse">
                    Simulating match...
                  </p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingMatchEvents.map((event) => {
                  const data = event.data as Record<string, unknown>;
                  const homeTeamId = data?.homeTeamId as string;
                  const awayTeamId = data?.awayTeamId as string;
                  const homeTeam = teams[homeTeamId];
                  const awayTeam = teams[awayTeamId];
                  const matchId = data?.matchId as string;
                  const isTournament = !!data?.tournamentId;

                  // Check if match is today
                  const matchDate = new Date(event.date).toDateString();
                  const currentDate = new Date(calendar.currentDate).toDateString();
                  const isMatchToday = matchDate === currentDate;

                  return (
                    <div
                      key={event.id}
                      className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-vct-gray">{event.date}</span>
                        <div className="flex items-center gap-2">
                          {isMatchToday && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                              Today
                            </span>
                          )}
                          {isTournament && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                              Tournament
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <p className={`font-semibold ${homeTeamId === playerTeamId ? 'text-vct-red' : 'text-vct-light'}`}>
                            {homeTeam?.name || 'TBD'}
                          </p>
                        </div>
                        <div className="px-4 text-vct-gray text-sm">vs</div>
                        <div className="text-center flex-1">
                          <p className={`font-semibold ${awayTeamId === playerTeamId ? 'text-vct-red' : 'text-vct-light'}`}>
                            {awayTeam?.name || 'TBD'}
                          </p>
                        </div>
                      </div>
                      {matchId && (
                        <div className="mt-3 pt-3 border-t border-vct-gray/20">
                          {isMatchToday ? (
                            <button
                              onClick={() => handleSimulate(matchId)}
                              disabled={isSimulating}
                              className="w-full px-4 py-2 bg-vct-red hover:bg-vct-red/80 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors"
                            >
                              Simulate Match
                            </button>
                          ) : (
                            <p className="text-center text-sm text-vct-gray">
                              Advance time to match day to simulate
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-8 text-center">
              <p className="text-vct-gray mb-4">No upcoming matches scheduled</p>
              <button
                onClick={handleCreateTestMatch}
                className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded font-medium transition-colors"
              >
                Schedule Test Match
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {completedMatchEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {completedMatchEvents.map((event) => {
                const data = event.data as Record<string, unknown>;
                const homeTeamId = data?.homeTeamId as string;
                const awayTeamId = data?.awayTeamId as string;
                const homeTeam = teams[homeTeamId];
                const awayTeam = teams[awayTeamId];
                const matchId = data?.matchId as string;
                const match = matchId ? matches[matchId] : null;
                const isTournament = !!data?.tournamentId;

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

      {/* Full Upcoming Events */}
      <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
        <h3 className="text-lg font-semibold text-vct-light mb-4">
          All Upcoming Events ({allUpcomingEvents.length})
        </h3>
        {allUpcomingEvents.length === 0 ? (
          <p className="text-sm text-vct-gray/60 italic">No upcoming events scheduled</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allUpcomingEvents.map((event) => {
              const style = getEventStyle(event.type);
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded bg-vct-darker"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <span className="text-sm text-vct-light">
                      {getEventDescription(event, teams)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-vct-gray">{event.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

// Helper function for event styling
function getEventStyle(type: string): { bg: string; text: string; label: string } {
  switch (type) {
    case 'match':
      return { bg: 'bg-vct-red/20', text: 'text-vct-red', label: 'Match' };
    case 'salary_payment':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Salary' };
    case 'training_available':
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Training' };
    case 'rest_day':
      return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Rest' };
    case 'tournament_start':
      return { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Tournament' };
    case 'tournament_end':
      return { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Tournament' };
    case 'scrim_available':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Scrim' };
    default:
      return { bg: 'bg-vct-gray/20', text: 'text-vct-gray', label: 'Event' };
  }
}

// Helper function for event descriptions
function getEventDescription(event: CalendarEvent, teams: Record<string, { name: string }>): string {
  const data = event.data as Record<string, unknown>;

  switch (event.type) {
    case 'match': {
      const homeTeamName = data?.homeTeamName as string || teams[data?.homeTeamId as string]?.name || 'TBD';
      const awayTeamName = data?.awayTeamName as string || teams[data?.awayTeamId as string]?.name || 'TBD';
      return `${homeTeamName} vs ${awayTeamName}`;
    }
    case 'salary_payment':
      return 'Monthly salaries due';
    case 'training_available':
      return 'Training session available';
    case 'rest_day':
      return 'Scheduled rest day';
    case 'tournament_start':
      return `${data?.tournamentName || 'Tournament'} begins`;
    case 'tournament_end':
      return `${data?.tournamentName || 'Tournament'} ends`;
    case 'scrim_available':
      return 'Scrim session available';
    default:
      return event.type.replace(/_/g, ' ');
  }
}
