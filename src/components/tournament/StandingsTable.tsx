// StandingsTable Component - League standings display

import { useGameStore } from '../../store';
import type { StandingsEntry } from '../../store/slices/competitionSlice';

interface StandingsTableProps {
  standings: StandingsEntry[];
  highlightTop?: number;
  showRoundDiff?: boolean;
  compact?: boolean;
}

export function StandingsTable({
  standings,
  highlightTop = 0,
  showRoundDiff = true,
  compact = false,
}: StandingsTableProps) {
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  if (standings.length === 0) {
    return (
      <div className="text-center text-vct-gray py-4">
        No standings available
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-1">
        {standings.map((entry, index) => {
          const isPlayerTeam = entry.teamId === playerTeamId;
          const isQualified = highlightTop > 0 && index < highlightTop;

          return (
            <div
              key={entry.teamId}
              className={`flex items-center gap-2 px-2 py-1 rounded ${
                isPlayerTeam ? 'bg-vct-red/10' : ''
              } ${isQualified ? 'border-l-2 border-green-500' : ''}`}
            >
              <span className="w-5 text-xs text-vct-gray text-right">
                {index + 1}.
              </span>
              <span
                className={`flex-1 text-sm truncate ${
                  isPlayerTeam ? 'text-vct-red font-medium' : 'text-white'
                }`}
              >
                {entry.teamName}
              </span>
              <span className="text-xs text-vct-gray">
                {entry.wins}-{entry.losses}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-vct-gray uppercase border-b border-vct-gray/20">
            <th className="py-2 px-2 w-8">#</th>
            <th className="py-2 px-2">Team</th>
            <th className="py-2 px-2 text-center w-12">W</th>
            <th className="py-2 px-2 text-center w-12">L</th>
            {showRoundDiff && (
              <th className="py-2 px-2 text-center w-16">RD</th>
            )}
          </tr>
        </thead>
        <tbody>
          {standings.map((entry, index) => {
            const isPlayerTeam = entry.teamId === playerTeamId;
            const isQualified = highlightTop > 0 && index < highlightTop;

            return (
              <tr
                key={entry.teamId}
                className={`border-b border-vct-gray/10 ${
                  isPlayerTeam ? 'bg-vct-red/10' : ''
                } ${isQualified ? 'bg-green-500/5' : ''}`}
              >
                <td className="py-2 px-2">
                  <span
                    className={`text-sm ${
                      isQualified ? 'text-green-400' : 'text-vct-gray'
                    }`}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <span
                    className={`text-sm ${
                      isPlayerTeam ? 'text-vct-red font-medium' : 'text-white'
                    }`}
                  >
                    {entry.teamName}
                  </span>
                </td>
                <td className="py-2 px-2 text-center">
                  <span className="text-sm text-green-400">{entry.wins}</span>
                </td>
                <td className="py-2 px-2 text-center">
                  <span className="text-sm text-red-400">{entry.losses}</span>
                </td>
                {showRoundDiff && (
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
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Qualification Legend */}
      {highlightTop > 0 && (
        <div className="mt-2 text-xs text-vct-gray">
          <span className="inline-block w-3 h-3 bg-green-500/20 border-l-2 border-green-500 mr-1" />
          Top {highlightTop} qualify for international event
        </div>
      )}
    </div>
  );
}
