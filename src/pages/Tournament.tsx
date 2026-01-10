// Tournament Page - Tournament bracket and standings view

import { useState } from 'react';
import { useGameStore } from '../store';
import { tournamentService } from '../services';
import { seasonManager } from '../engine/competition';
import {
  BracketView,
  BracketListView,
  TournamentCard,
  TournamentCardMini,
  StandingsTable,
  TournamentControls,
} from '../components/tournament';
import type { MatchResult } from '../types';

type ViewMode = 'bracket' | 'list' | 'standings';

export function TournamentPage() {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('bracket');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastResult, setLastResult] = useState<MatchResult | null>(null);

  const tournaments = useGameStore((state) => state.tournaments);
  const standings = useGameStore((state) => state.standings);
  const calendar = useGameStore((state) => state.calendar);

  const allTournaments = Object.values(tournaments);
  const activeTournaments = allTournaments.filter((t) => t.status === 'in_progress');
  const upcomingTournaments = allTournaments.filter((t) => t.status === 'upcoming');
  const completedTournaments = allTournaments.filter((t) => t.status === 'completed');

  // Get selected tournament or current one
  const currentTournament = selectedTournamentId
    ? tournaments[selectedTournamentId]
    : activeTournaments[0] || upcomingTournaments[0];

  const tournamentStandings = currentTournament
    ? standings[currentTournament.id] || []
    : [];

  // Handlers
  const handleSimulateMatch = async () => {
    if (!currentTournament) return;

    setIsSimulating(true);
    try {
      const result = tournamentService.simulateNextMatch(currentTournament.id);
      if (result) {
        setLastResult(result);
        setTimeout(() => setLastResult(null), 3000);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSimulateRound = async () => {
    if (!currentTournament) return;

    setIsSimulating(true);
    try {
      const results = tournamentService.simulateTournamentRound(currentTournament.id);
      if (results.length > 0) {
        setLastResult(results[results.length - 1]);
        setTimeout(() => setLastResult(null), 3000);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSimulateTournament = async () => {
    if (!currentTournament) return;

    setIsSimulating(true);
    try {
      const { results } = tournamentService.simulateTournament(
        currentTournament.id
      );
      if (results.length > 0) {
        setLastResult(results[results.length - 1]);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSimulateBracketMatch = (_matchId: string) => {
    if (!currentTournament) return;

    setIsSimulating(true);
    try {
      const result = tournamentService.simulateNextMatch(currentTournament.id);
      if (result) {
        setLastResult(result);
        setTimeout(() => setLastResult(null), 3000);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  // No tournaments yet
  if (allTournaments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-xl text-vct-gray mb-4">No Tournaments</p>
          <p className="text-sm text-vct-gray/60">
            Tournaments will appear here as the season progresses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tournaments</h1>
          <p className="text-sm text-vct-gray">
            {seasonManager.getPhaseName(calendar.currentPhase)} &middot;{' '}
            Season {calendar.currentSeason}
          </p>
        </div>

        {/* View Mode Toggle */}
        {currentTournament && (
          <div className="flex bg-vct-dark rounded-lg p-1">
            {(['bracket', 'list', 'standings'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm rounded ${
                  viewMode === mode
                    ? 'bg-vct-red text-white'
                    : 'text-vct-gray hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result Notification */}
      {lastResult && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-green-400">
            Match completed: {lastResult.winnerId} wins{' '}
            {lastResult.scoreTeamA}-{lastResult.scoreTeamB}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tournament List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Active Tournaments */}
          {activeTournaments.length > 0 && (
            <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-vct-red uppercase mb-3">
                Live ({activeTournaments.length})
              </h3>
              <div className="space-y-1">
                {activeTournaments.map((t) => (
                  <TournamentCardMini
                    key={t.id}
                    tournament={t}
                    onClick={() => setSelectedTournamentId(t.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tournaments */}
          {upcomingTournaments.length > 0 && (
            <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-vct-gray uppercase mb-3">
                Upcoming ({upcomingTournaments.length})
              </h3>
              <div className="space-y-1">
                {upcomingTournaments.map((t) => (
                  <TournamentCardMini
                    key={t.id}
                    tournament={t}
                    onClick={() => setSelectedTournamentId(t.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tournaments */}
          {completedTournaments.length > 0 && (
            <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-400 uppercase mb-3">
                Completed ({completedTournaments.length})
              </h3>
              <div className="space-y-1">
                {completedTournaments.slice(-5).map((t) => (
                  <TournamentCardMini
                    key={t.id}
                    tournament={t}
                    onClick={() => setSelectedTournamentId(t.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {currentTournament ? (
            <>
              {/* Tournament Info Card */}
              <TournamentCard tournament={currentTournament} showDetails />

              {/* Controls */}
              {currentTournament.status === 'in_progress' && (
                <TournamentControls
                  tournament={currentTournament}
                  onSimulateMatch={handleSimulateMatch}
                  onSimulateRound={handleSimulateRound}
                  onSimulateTournament={handleSimulateTournament}
                  isSimulating={isSimulating}
                />
              )}

              {/* Content based on view mode */}
              <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4">
                {viewMode === 'bracket' && (
                  <BracketView
                    bracket={currentTournament.bracket}
                    onSimulateMatch={handleSimulateBracketMatch}
                  />
                )}

                {viewMode === 'list' && (
                  <BracketListView
                    bracket={currentTournament.bracket}
                    onSimulateMatch={handleSimulateBracketMatch}
                  />
                )}

                {viewMode === 'standings' && (
                  <StandingsTable
                    standings={tournamentStandings}
                    highlightTop={
                      currentTournament.type === 'stage1' ||
                      currentTournament.type === 'stage2'
                        ? 3
                        : 0
                    }
                  />
                )}
              </div>
            </>
          ) : (
            <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-8 text-center">
              <p className="text-vct-gray">Select a tournament to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TournamentPage;
