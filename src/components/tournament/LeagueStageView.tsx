// LeagueStageView Component - League stage standings and matches display
// For league_to_playoff tournaments (Stage 1/Stage 2)

import { useGameStore } from '../../store';
import type { LeagueStage, TournamentStandingsEntry, BracketMatch } from '../../types';
import { LeagueStandingsTable } from './LeagueStandingsTable';

interface LeagueStageViewProps {
  leagueStage: LeagueStage;
  /** Callback when a completed match is clicked */
  onMatchClick?: (matchId: string) => void;
}

export function LeagueStageView({ leagueStage, onMatchClick }: LeagueStageViewProps) {
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  // Get recent and upcoming matches across all groups
  const allMatches = getAllMatches(leagueStage.bracket);
  const completedMatchesList = allMatches.filter(m => m.status === 'completed');
  const upcomingMatches = allMatches.filter(m => m.status === 'ready' || m.status === 'pending');

  const completedMatches = leagueStage.matchesCompleted;
  const totalMatches = leagueStage.totalMatches;

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">League Stage</h3>
          <p className="text-sm text-vct-gray">
            {completedMatches} of {totalMatches} matches completed
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-green-400 font-medium">
              {leagueStage.teamsQualify}
            </div>
            <div className="text-vct-gray text-xs">Qualify</div>
          </div>
          <div className="text-center">
            <div className="text-vct-gray font-medium">
              {leagueStage.standings.length - leagueStage.teamsQualify}
            </div>
            <div className="text-vct-gray text-xs">Eliminated</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standings */}
        <LeagueStandingsTable leagueStage={leagueStage} />

        {/* Matches */}
        <div>
          {/* Upcoming Matches */}
          {upcomingMatches.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-vct-gray uppercase mb-3">
                Upcoming Matches ({upcomingMatches.length})
              </h4>
              <div className="space-y-2">
                {upcomingMatches.slice(0, 6).map((match) => (
                  <LeagueMatchCard
                    key={match.matchId}
                    match={match}
                    standings={leagueStage.standings}
                    playerTeamId={playerTeamId}
                    onMatchClick={onMatchClick}
                  />
                ))}
                {upcomingMatches.length > 6 && (
                  <p className="text-xs text-vct-gray text-center py-2">
                    +{upcomingMatches.length - 6} more matches
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recent Matches */}
          {completedMatchesList.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-vct-gray/60 uppercase mb-3">
                Recent Results
              </h4>
              <div className="space-y-2 opacity-75">
                {completedMatchesList.slice(-5).reverse().map((match) => (
                  <LeagueMatchCard
                    key={match.matchId}
                    match={match}
                    standings={leagueStage.standings}
                    playerTeamId={playerTeamId}
                    onMatchClick={onMatchClick}
                  />
                ))}
              </div>
            </div>
          )}

          {upcomingMatches.length === 0 && completedMatchesList.length === 0 && (
            <div className="text-center text-vct-gray py-4">
              No matches scheduled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Match Card Component
function LeagueMatchCard({
  match,
  standings,
  playerTeamId,
  onMatchClick,
}: {
  match: BracketMatch;
  standings: TournamentStandingsEntry[];
  playerTeamId: string | null;
  onMatchClick?: (matchId: string) => void;
}) {
  const teams = useGameStore((state) => state.teams);

  const teamA = teams[match.teamAId || ''];
  const teamB = teams[match.teamBId || ''];
  const recordA = standings.find((s) => s.teamId === match.teamAId);
  const recordB = standings.find((s) => s.teamId === match.teamBId);

  const isPlayerMatch =
    match.teamAId === playerTeamId || match.teamBId === playerTeamId;
  const isCompleted = match.status === 'completed';
  const isClickable = isCompleted && onMatchClick;

  const handleClick = () => {
    if (isClickable) {
      onMatchClick(match.matchId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-vct-dark rounded-lg p-3 ${
        isPlayerMatch ? 'ring-1 ring-vct-red' : ''
      } ${isClickable ? 'cursor-pointer hover:bg-vct-dark/80 transition-colors' : ''}`}
    >
      <div className="flex items-center justify-between">
        {/* Team A */}
        <div className="flex-1">
          <div
            className={`text-sm ${
              isCompleted && match.winnerId === match.teamAId
                ? 'text-green-400 font-medium'
                : match.teamAId === playerTeamId
                  ? 'text-vct-red'
                  : 'text-white'
            }`}
          >
            {teamA?.name || 'TBD'}
          </div>
          {recordA && (
            <div className="text-xs text-vct-gray">
              {recordA.wins}-{recordA.losses}
            </div>
          )}
        </div>

        {/* Score / VS */}
        <div className="px-4 text-center">
          {isCompleted && match.result ? (
            <div className="flex items-center gap-2">
              <span
                className={`text-lg font-bold ${
                  match.winnerId === match.teamAId
                    ? 'text-green-400'
                    : 'text-vct-gray'
                }`}
              >
                {match.result.scoreTeamA}
              </span>
              <span className="text-vct-gray">-</span>
              <span
                className={`text-lg font-bold ${
                  match.winnerId === match.teamBId
                    ? 'text-green-400'
                    : 'text-vct-gray'
                }`}
              >
                {match.result.scoreTeamB}
              </span>
            </div>
          ) : (
            <span className="text-sm text-vct-gray">vs</span>
          )}
        </div>

        {/* Team B */}
        <div className="flex-1 text-right">
          <div
            className={`text-sm ${
              isCompleted && match.winnerId === match.teamBId
                ? 'text-green-400 font-medium'
                : match.teamBId === playerTeamId
                  ? 'text-vct-red'
                  : 'text-white'
            }`}
          >
            {teamB?.name || 'TBD'}
          </div>
          {recordB && (
            <div className="text-xs text-vct-gray">
              {recordB.wins}-{recordB.losses}
            </div>
          )}
        </div>
      </div>

      {/* Match Status */}
      <div className="mt-2 text-center">
        <span
          className={`text-xs ${
            isCompleted
              ? 'text-green-400/60'
              : match.status === 'ready'
                ? 'text-yellow-400'
                : 'text-vct-gray/60'
          }`}
        >
          {isCompleted
            ? 'Completed'
            : match.status === 'ready'
              ? 'Ready to Play'
              : 'Upcoming'}
        </span>
      </div>
    </div>
  );
}

// Helper function to get all matches from bracket
function getAllMatches(bracket: { upper: Array<{ matches: BracketMatch[] }> }): BracketMatch[] {
  const matches: BracketMatch[] = [];

  for (const round of bracket.upper) {
    matches.push(...round.matches);
  }

  return matches;
}
