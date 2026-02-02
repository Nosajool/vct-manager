// TournamentContextPanel - Dynamic tournament status display
//
// Shows different views based on tournament phase:
// - Swiss Stage: record, qualification path, next opponent
// - League/Round Robin: standings, playoff cutoff, next match impact
// - Playoffs: bracket position, next opponent
// - Kickoff: Alpha/Beta/Omega position
// - Between tournaments: upcoming preview, season progress

import { useMemo } from 'react';
import { useGameStore } from '../../store';
import { useMatchDay } from '../../hooks';
import {
  getPhaseStatusDisplay,
  type PhaseStatusDisplay,
} from '../../utils/phaseStatus';
import { isMultiStageTournament } from '../../types';
import type {
  Tournament,
  MultiStageTournament,
  SwissTeamRecord,
  TournamentStandingsEntry,
  SeasonPhase,
} from '../../types';

export function TournamentContextPanel() {
  const calendar = useGameStore((state) => state.calendar);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const tournaments = useGameStore((state) => state.tournaments);
  const setActiveView = useGameStore((state) => state.setActiveView);

  const { isMatchDay, opponentName } = useMatchDay();

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;

  // Get phase status display
  const phaseStatus = useMemo<PhaseStatusDisplay | null>(() => {
    if (!playerTeamId || !playerTeam) return null;
    return getPhaseStatusDisplay(
      calendar.currentPhase,
      playerTeamId,
      playerTeam,
      tournaments
    );
  }, [calendar.currentPhase, playerTeamId, playerTeam, tournaments]);

  // Find current tournament for the player's team
  const currentTournament = useMemo<Tournament | null>(() => {
    if (!playerTeam) return null;

    const allTournaments = Object.values(tournaments);

    // Find in-progress tournament for this region
    const inProgress = allTournaments.find(
      (t) =>
        t.status === 'in_progress' &&
        (t.region === playerTeam.region || t.region === 'International') &&
        t.teamIds.includes(playerTeamId!)
    );
    if (inProgress) return inProgress;

    // Find upcoming tournament
    const upcoming = allTournaments.find(
      (t) =>
        t.status === 'upcoming' &&
        (t.region === playerTeam.region || t.region === 'International') &&
        t.teamIds.includes(playerTeamId!)
    );
    return upcoming || null;
  }, [playerTeam, tournaments, playerTeamId]);

  // Get upcoming tournament (different from current if current is in progress)
  const upcomingTournament = useMemo<Tournament | null>(() => {
    if (!playerTeam) return null;
    if (currentTournament?.status === 'upcoming') return currentTournament;

    const allTournaments = Object.values(tournaments);
    return allTournaments.find(
      (t) =>
        t.status === 'upcoming' &&
        (t.region === playerTeam.region || t.region === 'International')
    ) || null;
  }, [playerTeam, tournaments, currentTournament]);

  if (!playerTeam || !playerTeamId) {
    return null;
  }

  // No active tournament - show between tournaments view
  if (!currentTournament || currentTournament.status === 'upcoming') {
    return (
      <BetweenTournamentsView
        upcomingTournament={upcomingTournament}
        currentPhase={calendar.currentPhase}
        onViewTournament={() => setActiveView('tournament')}
      />
    );
  }

  // Swiss stage view
  if (
    isMultiStageTournament(currentTournament) &&
    currentTournament.currentStage === 'swiss' &&
    currentTournament.swissStage
  ) {
    const swissRecord = currentTournament.swissStage.standings.find(
      (s) => s.teamId === playerTeamId
    );
    return (
      <SwissStageContextView
        tournament={currentTournament}
        swissRecord={swissRecord || null}
        isMatchDay={isMatchDay}
        opponentName={opponentName}
        onViewTournament={() => setActiveView('tournament')}
      />
    );
  }

  // League stage view (Stage 1/2)
  if (
    isMultiStageTournament(currentTournament) &&
    currentTournament.currentStage === 'league'
  ) {
    const standings = currentTournament.leagueStage?.standings || currentTournament.standings || [];
    return (
      <LeagueStageContextView
        tournament={currentTournament}
        standings={standings}
        playerTeamId={playerTeamId}
        isMatchDay={isMatchDay}
        opponentName={opponentName}
        onViewTournament={() => setActiveView('tournament')}
      />
    );
  }

  // Playoff bracket view
  if (
    phaseStatus?.type === 'bracket' ||
    (isMultiStageTournament(currentTournament) && currentTournament.currentStage === 'playoff')
  ) {
    return (
      <PlayoffContextView
        tournament={currentTournament}
        phaseStatus={phaseStatus}
        playerTeamId={playerTeamId}
        isMatchDay={isMatchDay}
        opponentName={opponentName}
        onViewTournament={() => setActiveView('tournament')}
      />
    );
  }

  // Fallback - generic tournament view
  return (
    <GenericTournamentView
      tournament={currentTournament}
      phaseStatus={phaseStatus}
      isMatchDay={isMatchDay}
      opponentName={opponentName}
      onViewTournament={() => setActiveView('tournament')}
    />
  );
}

// ===== Sub-components =====

interface SwissStageContextViewProps {
  tournament: MultiStageTournament;
  swissRecord: SwissTeamRecord | null;
  isMatchDay: boolean;
  opponentName: string;
  onViewTournament: () => void;
}

function SwissStageContextView({
  tournament,
  swissRecord,
  isMatchDay,
  opponentName,
  onViewTournament,
}: SwissStageContextViewProps) {
  const winsToQualify = tournament.swissStage?.winsToQualify || 3;
  const lossesToEliminate = tournament.swissStage?.lossesToEliminate || 3;

  const wins = swissRecord?.wins || 0;
  const losses = swissRecord?.losses || 0;
  const status = swissRecord?.status || 'active';

  const winsNeeded = winsToQualify - wins;
  const lossesUntilElim = lossesToEliminate - losses;

  // Determine path based on current record
  let winPath = '';
  let losePath = '';
  if (status === 'active') {
    if (winsNeeded === 1) {
      winPath = 'Qualify for Playoffs';
    } else {
      winPath = `${wins + 1}-${losses} record`;
    }
    if (lossesUntilElim === 1) {
      losePath = 'Eliminated';
    } else {
      losePath = `${wins}-${losses + 1} record`;
    }
  }

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-vct-light">Swiss Stage</h3>
        <span className="text-sm text-vct-gray">{tournament.name}</span>
      </div>

      <div className="space-y-3">
        {/* Current Record */}
        <div className="flex items-center justify-between">
          <span className="text-vct-gray">Current Record</span>
          <span className={`font-bold text-xl ${
            status === 'qualified' ? 'text-green-400' :
            status === 'eliminated' ? 'text-red-400' : 'text-vct-light'
          }`}>
            {status === 'qualified' ? 'Qualified' :
             status === 'eliminated' ? 'Eliminated' :
             `${wins}W - ${losses}L`}
          </span>
        </div>

        {status === 'active' && (
          <>
            {/* Qualification Info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-vct-gray">To Qualify</span>
              <span className="text-green-400">{winsToQualify} wins</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-vct-gray">Elimination</span>
              <span className="text-red-400">{lossesToEliminate} losses</span>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-vct-gray text-sm">Progress:</span>
              <div className="flex gap-1">
                {Array.from({ length: winsToQualify }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < wins ? 'bg-green-400' : 'bg-vct-gray/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Next Match */}
            {isMatchDay && (
              <div className="mt-4 pt-4 border-t border-vct-gray/20">
                <div className="flex items-center justify-between">
                  <span className="text-vct-gray">Next Match</span>
                  <span className="text-vct-light font-medium">vs {opponentName}</span>
                </div>
                <div className="mt-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-green-400">Win →</span>
                    <span className="text-vct-gray">{winPath}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-400">Lose →</span>
                    <span className="text-vct-gray">{losePath}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <button
        onClick={onViewTournament}
        className="mt-4 text-sm text-vct-red hover:text-vct-red/80 transition-colors"
      >
        View Full Swiss Standings →
      </button>
    </div>
  );
}

interface LeagueStageContextViewProps {
  tournament: Tournament;
  standings: TournamentStandingsEntry[];
  playerTeamId: string;
  isMatchDay: boolean;
  opponentName: string;
  onViewTournament: () => void;
}

function LeagueStageContextView({
  tournament,
  standings,
  playerTeamId,
  isMatchDay,
  opponentName,
  onViewTournament,
}: LeagueStageContextViewProps) {
  const teams = useGameStore((state) => state.teams);

  // Sort standings by wins, then round diff
  const sortedStandings = [...standings].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff;
    return (b.mapDiff || 0) - (a.mapDiff || 0);
  });

  const playerStanding = sortedStandings.find((s) => s.teamId === playerTeamId);
  const playerPosition = sortedStandings.findIndex((s) => s.teamId === playerTeamId) + 1;
  const playoffCutoff = 8; // Top 8 qualify for playoffs

  // Get top 5 + player if not in top 5
  const displayStandings = sortedStandings.slice(0, 5);
  const playerInTop5 = playerPosition <= 5;

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-vct-light">League Standings</h3>
        <span className="text-sm text-vct-gray">{tournament.name}</span>
      </div>

      {/* Mini Standings Table */}
      <div className="space-y-1 mb-4">
        {displayStandings.map((entry, idx) => {
          const team = teams[entry.teamId];
          const isPlayer = entry.teamId === playerTeamId;
          const position = idx + 1;
          const isAboveCutoff = position <= playoffCutoff;

          return (
            <div
              key={entry.teamId}
              className={`flex items-center justify-between py-1 px-2 rounded ${
                isPlayer ? 'bg-vct-red/20 border border-vct-red/30' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-5 text-sm ${isAboveCutoff ? 'text-green-400' : 'text-vct-gray'}`}>
                  {position}.
                </span>
                <span className={isPlayer ? 'text-vct-light font-medium' : 'text-vct-gray'}>
                  {team?.name || 'Unknown'}
                </span>
                {isPlayer && <span className="text-vct-red text-xs">◀</span>}
              </div>
              <span className="text-vct-light text-sm">
                {entry.wins}-{entry.losses}
              </span>
            </div>
          );
        })}

        {/* Playoff cutoff line */}
        {displayStandings.length > 0 && (
          <div className="flex items-center gap-2 py-1 px-2 text-xs text-vct-gray">
            <div className="flex-1 border-t border-dashed border-green-400/50" />
            <span>Playoff Cutoff (Top {playoffCutoff})</span>
            <div className="flex-1 border-t border-dashed border-green-400/50" />
          </div>
        )}

        {/* Show player position if not in top 5 */}
        {!playerInTop5 && playerStanding && (
          <div className="flex items-center justify-between py-1 px-2 rounded bg-vct-red/20 border border-vct-red/30">
            <div className="flex items-center gap-2">
              <span className={`w-5 text-sm ${playerPosition <= playoffCutoff ? 'text-green-400' : 'text-red-400'}`}>
                {playerPosition}.
              </span>
              <span className="text-vct-light font-medium">
                {teams[playerTeamId]?.name || 'Your Team'}
              </span>
              <span className="text-vct-red text-xs">◀</span>
            </div>
            <span className="text-vct-light text-sm">
              {playerStanding.wins}-{playerStanding.losses}
            </span>
          </div>
        )}
      </div>

      {/* Next Match */}
      {isMatchDay && (
        <div className="pt-4 border-t border-vct-gray/20">
          <div className="flex items-center justify-between">
            <span className="text-vct-gray">Today's Match</span>
            <span className="text-vct-light font-medium">vs {opponentName}</span>
          </div>
        </div>
      )}

      <button
        onClick={onViewTournament}
        className="mt-4 text-sm text-vct-red hover:text-vct-red/80 transition-colors"
      >
        View Full Standings →
      </button>
    </div>
  );
}

interface PlayoffContextViewProps {
  tournament: Tournament;
  phaseStatus: PhaseStatusDisplay | null;
  playerTeamId: string;
  isMatchDay: boolean;
  opponentName: string;
  onViewTournament: () => void;
}

function PlayoffContextView({
  tournament,
  phaseStatus,
  isMatchDay,
  opponentName,
  onViewTournament,
}: PlayoffContextViewProps) {
  const bracketPosition = phaseStatus?.bracketPosition;

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-vct-light">Playoff Bracket</h3>
        <span className="text-sm text-vct-gray">{tournament.name}</span>
      </div>

      <div className="space-y-3">
        {/* Bracket Position */}
        <div className="flex items-center justify-between">
          <span className="text-vct-gray">Your Position</span>
          <span className={`font-bold ${
            bracketPosition?.isChampion ? 'text-yellow-400' :
            bracketPosition?.isEliminated ? 'text-red-400' :
            'text-vct-light'
          }`}>
            {bracketPosition?.isChampion
              ? 'Champion!'
              : bracketPosition?.isEliminated
              ? `Eliminated (${bracketPosition.finalPlacement ? getOrdinal(bracketPosition.finalPlacement) : 'Out'})`
              : bracketPosition?.roundName || 'Active'}
          </span>
        </div>

        {/* Bracket Type */}
        {bracketPosition && !bracketPosition.isEliminated && !bracketPosition.isChampion && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-vct-gray">Bracket</span>
            <span className="text-vct-light capitalize">{bracketPosition.bracketType}</span>
          </div>
        )}

        {/* Next Match */}
        {isMatchDay && !bracketPosition?.isEliminated && !bracketPosition?.isChampion && (
          <div className="mt-4 pt-4 border-t border-vct-gray/20">
            <div className="flex items-center justify-between">
              <span className="text-vct-gray">Today's Match</span>
              <span className="text-vct-light font-medium">vs {opponentName || 'TBD'}</span>
            </div>
            {bracketPosition?.bracketType === 'upper' && (
              <p className="text-xs text-vct-gray mt-1">
                Win → Stay in Upper Bracket | Lose → Drop to Lower Bracket
              </p>
            )}
            {bracketPosition?.bracketType === 'lower' && (
              <p className="text-xs text-vct-gray mt-1">
                Win → Advance | Lose → Eliminated
              </p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onViewTournament}
        className="mt-4 text-sm text-vct-red hover:text-vct-red/80 transition-colors"
      >
        View Full Bracket →
      </button>
    </div>
  );
}

interface BetweenTournamentsViewProps {
  upcomingTournament: Tournament | null;
  currentPhase: SeasonPhase;
  onViewTournament: () => void;
}

function BetweenTournamentsView({
  upcomingTournament,
  currentPhase,
  onViewTournament,
}: BetweenTournamentsViewProps) {
  const calendar = useGameStore((state) => state.calendar);

  // Calculate days until upcoming tournament
  let daysUntil = 0;
  if (upcomingTournament) {
    const currentDate = new Date(calendar.currentDate);
    const startDate = new Date(upcomingTournament.startDate);
    daysUntil = Math.ceil((startDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Season phases for progress display
  const phases: SeasonPhase[] = [
    'kickoff',
    'masters1',
    'stage1',
    'stage1_playoffs',
    'masters2',
    'stage2',
    'stage2_playoffs',
    'champions',
  ];
  const currentPhaseIndex = phases.indexOf(currentPhase);

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-vct-light">Between Tournaments</h3>
        <span className="text-sm text-vct-gray">Offseason</span>
      </div>

      <div className="space-y-4">
        {/* No active tournament message */}
        <p className="text-vct-gray text-sm">No active tournament</p>

        {/* Upcoming Tournament */}
        {upcomingTournament && (
          <div className="p-3 bg-vct-gray/10 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-vct-gray text-sm">Upcoming</span>
              <span className="text-vct-light font-medium">{upcomingTournament.name}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-vct-gray text-sm">Starts in</span>
              <span className="text-green-400">{daysUntil} day{daysUntil !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {/* Season Progress */}
        <div>
          <span className="text-vct-gray text-sm">Season Progress</span>
          <div className="mt-2 space-y-1">
            {phases.slice(0, 5).map((phase, idx) => {
              const isPast = idx < currentPhaseIndex;
              const isCurrent = phase === currentPhase;
              const phaseNames: Record<string, string> = {
                kickoff: 'Kickoff',
                masters1: 'Masters Santiago',
                stage1: 'Stage 1',
                stage1_playoffs: 'Stage 1 Playoffs',
                masters2: 'Masters London',
                stage2: 'Stage 2',
                stage2_playoffs: 'Stage 2 Playoffs',
                champions: 'Champions',
              };

              return (
                <div key={phase} className="flex items-center gap-2 text-sm">
                  <span className={isPast ? 'text-green-400' : isCurrent ? 'text-vct-red' : 'text-vct-gray/50'}>
                    {isPast ? '✓' : isCurrent ? '→' : '○'}
                  </span>
                  <span className={isPast ? 'text-vct-gray' : isCurrent ? 'text-vct-light' : 'text-vct-gray/50'}>
                    {phaseNames[phase] || phase}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={onViewTournament}
        className="mt-4 text-sm text-vct-red hover:text-vct-red/80 transition-colors"
      >
        View All Tournaments →
      </button>
    </div>
  );
}

interface GenericTournamentViewProps {
  tournament: Tournament;
  phaseStatus: PhaseStatusDisplay | null;
  isMatchDay: boolean;
  opponentName: string;
  onViewTournament: () => void;
}

function GenericTournamentView({
  tournament,
  phaseStatus,
  isMatchDay,
  opponentName,
  onViewTournament,
}: GenericTournamentViewProps) {
  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-vct-light">{tournament.name}</h3>
        <span className="text-sm text-vct-gray capitalize">{tournament.status}</span>
      </div>

      <div className="space-y-3">
        {phaseStatus && (
          <div className="flex items-center justify-between">
            <span className="text-vct-gray">Status</span>
            <span className="text-vct-light font-medium">{phaseStatus.label}</span>
          </div>
        )}

        {isMatchDay && (
          <div className="flex items-center justify-between">
            <span className="text-vct-gray">Today's Match</span>
            <span className="text-vct-light font-medium">vs {opponentName}</span>
          </div>
        )}
      </div>

      <button
        onClick={onViewTournament}
        className="mt-4 text-sm text-vct-red hover:text-vct-red/80 transition-colors"
      >
        View Tournament →
      </button>
    </div>
  );
}

function getOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}
