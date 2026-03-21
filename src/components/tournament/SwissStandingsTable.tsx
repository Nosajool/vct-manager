// SwissStandingsTable - Swiss stage standings section
// Extracted from SwissStageView for reuse in TournamentContextModal

import { useGameStore } from '../../store';
import type { SwissStage, SwissTeamRecord } from '../../types';

interface SwissStandingsTableProps {
  swissStage: SwissStage;
}

export function SwissStandingsTable({ swissStage }: SwissStandingsTableProps) {
  const teams = useGameStore((state) => state.teams);
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  const sortedStandings = [...swissStage.standings].sort((a, b) => {
    const statusOrder = { qualified: 0, active: 1, eliminated: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.roundDiff - a.roundDiff;
  });

  return (
    <div className="space-y-4">
      {/* Swiss Rules Info */}
      <div className="bg-vct-dark/50 rounded-lg p-3 text-sm text-vct-gray">
        <p>
          Win <span className="text-green-400 font-medium">{swissStage.winsToQualify}</span> matches to qualify for Playoffs.
          Lose <span className="text-red-400 font-medium">{swissStage.lossesToEliminate}</span> matches and you're eliminated.
        </p>
      </div>

      {/* Standings Table */}
      <div>
        <h4 className="text-sm font-medium text-vct-gray uppercase mb-3">Standings</h4>
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
    </div>
  );
}

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
    <tr className={`border-b border-vct-gray/10 ${isPlayerTeam ? 'bg-vct-red/10' : ''}`}>
      <td className="py-2 px-3">
        <span className={`text-sm ${isPlayerTeam ? 'text-vct-red font-medium' : 'text-white'}`}>
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
        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[entry.status]}`}>
          {statusLabels[entry.status]}
        </span>
      </td>
    </tr>
  );
}
