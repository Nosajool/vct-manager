// Tournament Page - Tournament bracket and standings view
//
// Note: Match simulation is handled by the global TimeBar.
// This page is view-only for browsing tournaments and brackets.
//
// Now supports viewing tournaments from ALL regions (not just player's)

import { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { seasonManager } from '../engine/competition';
import { tournamentService } from '../services/TournamentService';
import {
  BracketView,
  TournamentCard,
  TournamentCardMini,
  StandingsTable,
  SwissStageView,
} from '../components/tournament';
import { MatchResult } from '../components/match/MatchResult';
import { isMultiStageTournament } from '../types';
import type { Region, TournamentRegion } from '../types';

type ViewMode = 'bracket' | 'standings' | 'swiss';
type RegionFilter = Region | 'International' | 'all';

const REGION_OPTIONS: { value: RegionFilter; label: string }[] = [
  { value: 'all', label: 'All Regions' },
  { value: 'Americas', label: 'Americas' },
  { value: 'EMEA', label: 'EMEA' },
  { value: 'Pacific', label: 'Pacific' },
  { value: 'China', label: 'China' },
  { value: 'International', label: 'International' },
];

export function TournamentPage() {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('bracket');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const tournaments = useGameStore((state) => state.tournaments);
  const standings = useGameStore((state) => state.standings);
  const calendar = useGameStore((state) => state.calendar);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const matches = useGameStore((state) => state.matches);

  // Get player's region for default filter
  const playerTeam = playerTeamId ? teams[playerTeamId] : null;

  // Filter tournaments by region
  const filterByRegion = (t: { region: TournamentRegion }) => {
    if (selectedRegion === 'all') return true;
    return t.region === selectedRegion;
  };

  const allTournaments = Object.values(tournaments).filter(filterByRegion);
  const activeTournaments = allTournaments.filter((t) => t.status === 'in_progress');
  const upcomingTournaments = allTournaments.filter((t) => t.status === 'upcoming');
  const completedTournaments = allTournaments.filter((t) => t.status === 'completed');

  // Get selected tournament or current one
  const currentTournament = selectedTournamentId
    ? tournaments[selectedTournamentId]
    : activeTournaments[0] || upcomingTournaments[0];

  // For league tournaments (stage1/stage2), calculate standings from team standings
  // This ensures standings are up-to-date with the latest match results
  useEffect(() => {
    if (
      currentTournament &&
      (currentTournament.type === 'stage1' || currentTournament.type === 'stage2') &&
      currentTournament.format === 'round_robin'
    ) {
      tournamentService.calculateLeagueStandings(currentTournament.id);
    }
  }, [currentTournament?.id, currentTournament?.type, currentTournament?.format]);

  const tournamentStandings = currentTournament
    ? standings[currentTournament.id] || []
    : [];

  // Check if current tournament is a Swiss-to-playoff tournament
  const isSwissTournament = currentTournament && isMultiStageTournament(currentTournament);
  const isInSwissStage = isSwissTournament && currentTournament.currentStage === 'swiss';

  // Handle clicking on a completed match in the bracket
  const handleMatchClick = (matchId: string) => {
    setSelectedMatchId(matchId);
  };

  const handleCloseMatchDetails = () => {
    setSelectedMatchId(null);
  };

  // Get the selected match for the modal
  const selectedMatch = selectedMatchId ? matches[selectedMatchId] : null;

  // Determine available view modes based on tournament type
  const getAvailableViewModes = (): ViewMode[] => {
    if (isInSwissStage) {
      return ['swiss', 'standings'];
    }
    // League tournaments (stage1/stage2 round_robin) only have standings view
    if (
      currentTournament &&
      (currentTournament.type === 'stage1' || currentTournament.type === 'stage2') &&
      currentTournament.format === 'round_robin'
    ) {
      return ['standings'];
    }
    return ['bracket', 'standings'];
  };

  // Reset view mode when tournament changes
  const effectiveViewMode = (() => {
    const available = getAvailableViewModes();
    if (!available.includes(viewMode)) {
      return available[0];
    }
    return viewMode;
  })();

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

        <div className="flex items-center gap-4">
          {/* Region Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-vct-gray">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value as RegionFilter);
                setSelectedTournamentId(null); // Reset selection when changing region
              }}
              className="bg-vct-dark border border-vct-gray/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-vct-red"
            >
              {REGION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {playerTeam && selectedRegion !== playerTeam.region && selectedRegion !== 'all' && (
              <button
                onClick={() => setSelectedRegion(playerTeam.region)}
                className="text-xs text-vct-red hover:text-vct-red/80"
              >
                My Region
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          {currentTournament && (
            <div className="flex bg-vct-dark rounded-lg p-1">
              {getAvailableViewModes().map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-sm rounded ${
                    effectiveViewMode === mode
                      ? 'bg-vct-red text-white'
                      : 'text-vct-gray hover:text-white'
                  }`}
                >
                  {mode === 'swiss' ? 'Swiss Stage' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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

              {/* Info about simulation */}
              {currentTournament.status === 'in_progress' && (
                <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-3">
                  <p className="text-sm text-vct-gray text-center">
                    Tournament matches play automatically when you advance time using the controls above
                  </p>
                </div>
              )}

              {/* Content based on view mode */}
              <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4">
                {effectiveViewMode === 'swiss' && isSwissTournament && (
                  <SwissStageView swissStage={currentTournament.swissStage} onMatchClick={handleMatchClick} />
                )}

                {effectiveViewMode === 'bracket' && (
                  <BracketView bracket={currentTournament.bracket} onMatchClick={handleMatchClick} />
                )}

                {effectiveViewMode === 'standings' && (
                  <StandingsTable
                    standings={tournamentStandings}
                    highlightTop={
                      currentTournament.type === 'stage1' ||
                      currentTournament.type === 'stage2'
                        ? 8 // Top 8 qualify for Stage Playoffs
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

      {/* Match Result Modal */}
      {selectedMatch && (
        <MatchResult match={selectedMatch} onClose={handleCloseMatchDetails} />
      )}
    </div>
  );
}

export default TournamentPage;
