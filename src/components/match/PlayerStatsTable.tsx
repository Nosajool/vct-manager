// PlayerStatsTable Component - Sortable table of player performances

import { useState } from 'react';
import type { PlayerMapPerformance } from '../../types';

type SortKey = 'acs' | 'kills' | 'deaths' | 'assists' | 'kd';
type SortDirection = 'asc' | 'desc';

interface PlayerStatsTableProps {
  performances: PlayerMapPerformance[];
  teamName: string;
  isWinner: boolean;
}

export function PlayerStatsTable({
  performances,
  teamName,
  isWinner,
}: PlayerStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('acs');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Sort performances
  const sortedPerformances = [...performances].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Handle header click
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // Get header sort indicator
  const getSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'desc' ? ' ▼' : ' ▲';
  };

  return (
    <div className="rounded-lg border border-vct-gray/20 overflow-hidden">
      {/* Team Header */}
      <div
        className={`px-4 py-2 font-semibold ${
          isWinner ? 'bg-green-500/10 text-green-400' : 'bg-vct-darker text-vct-light'
        }`}
      >
        {teamName}
        {isWinner && <span className="ml-2 text-xs">Winner</span>}
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="bg-vct-dark text-xs text-vct-gray">
            <th className="px-4 py-2 text-left font-medium">Player</th>
            <th className="px-2 py-2 text-left font-medium">Agent</th>
            <th
              className="px-2 py-2 text-center font-medium cursor-pointer hover:text-vct-light"
              onClick={() => handleSort('acs')}
            >
              ACS{getSortIndicator('acs')}
            </th>
            <th
              className="px-2 py-2 text-center font-medium cursor-pointer hover:text-vct-light"
              onClick={() => handleSort('kills')}
            >
              K{getSortIndicator('kills')}
            </th>
            <th
              className="px-2 py-2 text-center font-medium cursor-pointer hover:text-vct-light"
              onClick={() => handleSort('deaths')}
            >
              D{getSortIndicator('deaths')}
            </th>
            <th
              className="px-2 py-2 text-center font-medium cursor-pointer hover:text-vct-light"
              onClick={() => handleSort('assists')}
            >
              A{getSortIndicator('assists')}
            </th>
            <th
              className="px-2 py-2 text-center font-medium cursor-pointer hover:text-vct-light"
              onClick={() => handleSort('kd')}
            >
              K/D{getSortIndicator('kd')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPerformances.map((perf, idx) => (
            <tr
              key={perf.playerId}
              className={`
                border-t border-vct-gray/10 text-sm
                ${idx % 2 === 0 ? 'bg-vct-darker' : 'bg-vct-dark'}
              `}
            >
              <td className="px-4 py-2 text-vct-light font-medium">
                {perf.playerName}
              </td>
              <td className="px-2 py-2 text-vct-gray">{perf.agent}</td>
              <td className="px-2 py-2 text-center">
                <AcsBadge acs={perf.acs} />
              </td>
              <td className="px-2 py-2 text-center text-green-400">
                {perf.kills}
              </td>
              <td className="px-2 py-2 text-center text-red-400">
                {perf.deaths}
              </td>
              <td className="px-2 py-2 text-center text-vct-gray">
                {perf.assists}
              </td>
              <td className="px-2 py-2 text-center">
                <KdBadge kd={perf.kd} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ACS Badge with color coding
function AcsBadge({ acs }: { acs: number }) {
  const getColor = (value: number): string => {
    if (value >= 300) return 'text-yellow-400 font-bold';
    if (value >= 250) return 'text-green-400 font-medium';
    if (value >= 200) return 'text-vct-light';
    return 'text-vct-gray';
  };

  return <span className={getColor(acs)}>{acs}</span>;
}

// K/D Badge with color coding
function KdBadge({ kd }: { kd: number }) {
  const getColor = (value: number): string => {
    if (value >= 1.5) return 'text-yellow-400 font-bold';
    if (value >= 1.0) return 'text-green-400';
    if (value >= 0.8) return 'text-vct-light';
    return 'text-red-400';
  };

  return <span className={getColor(kd)}>{kd.toFixed(2)}</span>;
}
