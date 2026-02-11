// SwissStageView Component - Swiss stage standings and matches display

import { useGameStore } from '../../store';
import type { SwissStage, SwissTeamRecord, BracketMatch } from '../../types';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl } from '../../utils/imageAssets';

interface SwissStageViewProps {
  swissStage: SwissStage;
  /** Callback when a completed match is clicked */
  onMatchClick?: (matchId: string) => void;
}

export function SwissStageView({ swissStage, onMatchClick }: SwissStageViewProps) {
  const teams = useGameStore((state) => state.teams);
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  // Get sorted standings
  const sortedStandings = [...swissStage.standings].sort((a, b) => {
    // First by status (qualified > active > eliminated)
    const statusOrder = { qualified: 0, active: 1, eliminated: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    // Then by wins (descending)
    if (b.wins !== a.wins) return b.wins - a.wins;
    // Then by losses (ascending)
    if (a.losses !== b.losses) return a.losses - b.losses;
    // Then by round diff (descending)
    return b.roundDiff - a.roundDiff;
  });

  // Get current round matches
  const currentRound = swissStage.rounds.find(
    (r) => r.roundNumber === swissStage.currentRound
  );

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Swiss Stage</h3>
          <p className="text-sm text-vct-gray">
            Round {swissStage.currentRound} of {swissStage.totalRounds}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-green-400 font-medium">
              {swissStage.qualifiedTeamIds.length}
            </div>
            <div className="text-vct-gray text-xs">Qualified</div>
          </div>
          <div className="text-center">
            <div className="text-red-400 font-medium">
              {swissStage.eliminatedTeamIds.length}
            </div>
            <div className="text-vct-gray text-xs">Eliminated</div>
          </div>
        </div>
      </div>

      {/* Swiss Rules Info */}
      <div className="bg-vct-dark/50 rounded-lg p-3 text-sm text-vct-gray">
        <p>
          Win <span className="text-green-400 font-medium">{swissStage.winsToQualify}</span> matches to qualify for Playoffs.
          Lose <span className="text-red-400 font-medium">{swissStage.lossesToEliminate}</span> matches and you're eliminated.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standings */}
        <div>
          <h4 className="text-sm font-medium text-vct-gray uppercase mb-3">
            Standings
          </h4>
          <div className="bg-vct-dark rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-vct-gray uppercase border-b border-vct-gray/20">
                  <th className="py-2 px-3">Team</th>
                  <th className="py-2 px-2 text-center w-16">Record</th>
                  <th className="py-2 px-2 text-center w-12">RD</th>
                  <th className="py-2 px-2 text-center w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedStandings.map((entry) => (
                  <SwissStandingRow
                    key={entry.teamId}
                    entry={entry}
                    teamName={teams[entry.teamId]?.name || 'Unknown'}
                    isPlayerTeam={entry.teamId === playerTeamId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Current Round Matches */}
        <div>
          <h4 className="text-sm font-medium text-vct-gray uppercase mb-3">
            Round {swissStage.currentRound} Matches
          </h4>
          <div className="space-y-2">
            {currentRound ? (
              currentRound.matches.map((match) => (
                <SwissMatchCard
                  key={match.matchId}
                  match={match}
                  standings={swissStage.standings}
                  playerTeamId={playerTeamId}
                  onMatchClick={onMatchClick}
                />
              ))
            ) : (
              <div className="text-center text-vct-gray py-4">
                No matches scheduled
              </div>
            )}
          </div>

          {/* Previous Rounds */}
          {swissStage.rounds
            .filter((r) => r.roundNumber < swissStage.currentRound && r.completed)
            .reverse()
            .map((round) => (
              <div key={round.roundNumber} className="mt-4">
                <h4 className="text-sm font-medium text-vct-gray/60 uppercase mb-2">
                  Round {round.roundNumber} (Completed)
                </h4>
                <div className="space-y-2 opacity-60">
                  {round.matches.map((match) => (
                    <SwissMatchCard
                      key={match.matchId}
                      match={match}
                      standings={swissStage.standings}
                      playerTeamId={playerTeamId}
                      onMatchClick={onMatchClick}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Standing Row Component
function SwissStandingRow({
  entry,
  teamName,
  isPlayerTeam,
}: {
  entry: SwissTeamRecord;
  teamName: string;
  isPlayerTeam: boolean;
}) {
  const statusColors = {
    qualified: 'text-green-400 bg-green-400/10',
    active: 'text-yellow-400 bg-yellow-400/10',
    eliminated: 'text-red-400 bg-red-400/10',
  };

  const statusLabels = {
    qualified: 'Qualified',
    active: 'Active',
    eliminated: 'Out',
  };

  return (
    <tr
      className={`border-b border-vct-gray/10 ${
        isPlayerTeam ? 'bg-vct-red/10' : ''
      }`}
    >
      <td className="py-2 px-3">
        <span
          className={`text-sm ${
            isPlayerTeam ? 'text-vct-red font-medium' : 'text-white'
          }`}
        >
          {teamName}
        </span>
      </td>
      <td className="py-2 px-2 text-center">
        <span className="text-sm">
          <span className="text-green-400">{entry.wins}</span>
          <span className="text-vct-gray mx-1">-</span>
          <span className="text-red-400">{entry.losses}</span>
        </span>
      </td>
      <td className="py-2 px-2 text-center">
        <span
          className={`text-sm ${
            entry.roundDiff > 0
              ? 'text-green-400'
              : entry.roundDiff < 0
                ? 'text-red-400'
                : 'text-vct-gray'
          }`}
        >
          {entry.roundDiff > 0 ? '+' : ''}
          {entry.roundDiff}
        </span>
      </td>
      <td className="py-2 px-2 text-center">
        <span
          className={`text-xs px-2 py-0.5 rounded ${statusColors[entry.status]}`}
        >
          {statusLabels[entry.status]}
        </span>
      </td>
    </tr>
  );
}

// Match Card Component
function SwissMatchCard({
  match,
  standings,
  playerTeamId,
  onMatchClick,
}: {
  match: BracketMatch;
  standings: SwissTeamRecord[];
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
          <div className="flex items-center gap-2">
            <GameImage
              src={getTeamLogoUrl(teamA?.name || 'TBD')}
              alt={teamA?.name || 'TBD'}
              className="w-6 h-6"
            />
            <div>
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
          </div>
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
        <div className="flex-1">
          <div className="flex items-center gap-2 justify-end">
            <div className="text-right">
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
            <GameImage
              src={getTeamLogoUrl(teamB?.name || 'TBD')}
              alt={teamB?.name || 'TBD'}
              className="w-6 h-6"
            />
          </div>
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
              : 'Pending'}
        </span>
      </div>
    </div>
  );
}
