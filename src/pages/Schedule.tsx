// Schedule Page - View and simulate matches

import { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../store';
import { matchService } from '../services';
import { MatchCard } from '../components/match/MatchCard';
import { MatchResult } from '../components/match/MatchResult';
import { TournamentCardMini } from '../components/tournament';
import type { Match } from '../types';

type ScheduleTab = 'upcoming' | 'results';
type MatchFilter = 'all' | 'league' | 'tournament';

export function Schedule() {
  const [activeTab, setActiveTab] = useState<ScheduleTab>('upcoming');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');

  const gameStarted = useGameStore((state) => state.gameStarted);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const matches = useGameStore((state) => state.matches);
  const tournaments = useGameStore((state) => state.tournaments);
  const setActiveView = useGameStore((state) => state.setActiveView);

  const activeTournaments = useMemo(
    () => Object.values(tournaments).filter((t) => t.status === 'in_progress'),
    [tournaments]
  );

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;

  // Get matches for the player's team
  const teamMatches = useMemo(() => {
    if (!playerTeamId) return [];
    return Object.values(matches)
      .filter((m) => m.teamAId === playerTeamId || m.teamBId === playerTeamId)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }, [matches, playerTeamId]);

  // Apply filter
  const filteredMatches = useMemo(() => {
    if (matchFilter === 'all') return teamMatches;
    if (matchFilter === 'tournament') {
      return teamMatches.filter((m) => m.tournamentId);
    }
    return teamMatches.filter((m) => !m.tournamentId);
  }, [teamMatches, matchFilter]);

  const upcomingMatches = useMemo(
    () => filteredMatches.filter((m) => m.status === 'scheduled'),
    [filteredMatches]
  );

  const completedMatches = useMemo(
    () =>
      filteredMatches
        .filter((m) => m.status === 'completed')
        .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)),
    [filteredMatches]
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
          <h1 className="text-2xl font-bold text-vct-light">Match Schedule</h1>
          {playerTeam && (
            <p className="text-vct-gray mt-1">
              {playerTeam.name} - {playerTeam.region}
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
            Upcoming ({upcomingMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'results'
                ? 'text-vct-red border-vct-red'
                : 'text-vct-gray border-transparent hover:text-vct-light'
            }`}
          >
            Results ({completedMatches.length})
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
          {upcomingMatches.length > 0 ? (
            <>
              {isSimulating && (
                <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4 text-center">
                  <p className="text-vct-light animate-pulse">
                    Simulating match...
                  </p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    showActions
                    onSimulate={() => handleSimulate(match.id)}
                  />
                ))}
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
          {completedMatches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {completedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => handleViewMatch(match)}
                />
              ))}
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
    </div>
  );
}
