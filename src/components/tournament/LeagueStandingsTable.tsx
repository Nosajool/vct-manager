// LeagueStandingsTable - League stage standings section
// Extracted from LeagueStageView for reuse in TournamentContextModal

import { useGameStore } from '../../store';
import type { LeagueStage, TournamentStandingsEntry } from '../../types';

interface LeagueStandingsTableProps {
  leagueStage: LeagueStage;
}

export function LeagueStandingsTable({ leagueStage }: LeagueStandingsTableProps) {
  const teams = useGameStore((state) => state.teams);
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  const sortedStandings = [...leagueStage.standings].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff;
    return b.mapDiff - a.mapDiff;
  });

  const completedMatches = leagueStage.matchesCompleted;
  const totalMatches = leagueStage.totalMatches;
  const progressPercent = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="bg-vct-dark/50 rounded-lg p-3">
        <div className="flex justify-between text-xs text-vct-gray mb-2">
          <span>League Progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-vct-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-vct-red transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* League Rules Info */}
      <div className="bg-vct-dark/50 rounded-lg p-3 text-sm text-vct-gray">
        <p>
          Top <span className="text-green-400 font-medium">{leagueStage.teamsQualify}</span> teams
          in the standings qualify for Playoffs. Teams play a round-robin within their group.
        </p>
      </div>

      {/* Standings Table */}
      <div>
        <h4 className="text-sm font-medium text-vct-gray uppercase mb-3">League Standings</h4>
        <div className="bg-vct-dark rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-vct-gray uppercase border-b border-vct-gray/20">
                <th className="py-2 px-3 w-8">#</th>
                <th className="py-2 px-3">Team</th>
                <th className="py-2 px-2 text-center w-16">Record</th>
                <th className="py-2 px-2 text-center w-12">RD</th>
                <th className="py-2 px-2 text-center w-20">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedStandings.map((entry, index) => (
                <LeagueStandingRow
                  key={entry.teamId}
                  entry={entry}
                  position={index + 1}
                  teamName={teams[entry.teamId]?.name || 'Unknown'}
                  isPlayerTeam={entry.teamId === playerTeamId}
                  qualifyCount={leagueStage.teamsQualify}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LeagueStandingRow({
  entry,
  position,
  teamName,
  isPlayerTeam,
  qualifyCount,
}: {
  entry: TournamentStandingsEntry;
  position: number;
  teamName: string;
  isPlayerTeam: boolean;
  qualifyCount: number;
}) {
  const isQualified = position <= qualifyCount;

  return (
    <tr
      className={`border-b border-vct-gray/10 ${
        isPlayerTeam ? 'bg-vct-red/10' : isQualified ? 'bg-green-500/5' : ''
      }`}
    >
      <td className="py-2 px-3">
        <span className={`text-sm font-bold ${isQualified ? 'text-green-400' : 'text-vct-gray'}`}>
          {position}
        </span>
      </td>
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
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            isQualified
              ? 'text-green-400 bg-green-400/10'
              : 'text-vct-gray bg-vct-gray/10'
          }`}
        >
          {isQualified ? 'Top 8' : '-'}
        </span>
      </td>
    </tr>
  );
}
