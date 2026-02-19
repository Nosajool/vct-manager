// PlayerStatsTable Component - Sortable table of player performances

import { useState } from 'react';
import type { PlayerMapPerformance } from '../../types';
import { GameImage } from '../shared/GameImage';
import { getAgentImageUrl } from '../../utils/imageAssets';
import { formatKD } from '../../utils/formatNumber';

type SortKey = 'acs' | 'kills' | 'deaths' | 'assists' | 'kd' | 'adr' | 'kast' | 'firstKills';
type SortDirection = 'asc' | 'desc';

interface PlayerStatsTableProps {
  performances: PlayerMapPerformance[];
  teamName: string;
  isWinner: boolean;
  showEnhanced?: boolean;
}

export function PlayerStatsTable({
  performances,
  teamName,
  isWinner,
  showEnhanced = false,
}: PlayerStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('acs');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [showAdvanced, setShowAdvanced] = useState(showEnhanced);

  // Check if enhanced stats are available
  const hasEnhancedStats = performances.some((p) => p.adr !== undefined);

  // Sort performances
  const sortedPerformances = [...performances].sort((a, b) => {
    const aVal = (a[sortKey] as number) ?? 0;
    const bVal = (b[sortKey] as number) ?? 0;
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
        className={`px-4 py-2 font-semibold flex items-center justify-between ${
          isWinner ? 'bg-green-500/10 text-green-400' : 'bg-vct-darker text-vct-light'
        }`}
      >
        <div>
          {teamName}
          {isWinner && <span className="ml-2 text-xs">Winner</span>}
        </div>
        {hasEnhancedStats && (
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs px-2 py-1 rounded bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-gray transition-colors"
          >
            {showAdvanced ? 'Basic Stats' : 'Advanced Stats'}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-vct-dark text-xs text-vct-gray">
              <th className="px-4 py-2 text-left font-medium">Player</th>
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
              {showAdvanced && hasEnhancedStats && (
                <>
                  <th
                    className="px-2 py-2 text-center font-medium cursor-pointer hover:text-vct-light"
                    onClick={() => handleSort('adr')}
                    title="Average Damage per Round"
                  >
                    ADR{getSortIndicator('adr')}
                  </th>
                  <th
                    className="px-2 py-2 text-center font-medium cursor-pointer hover:text-vct-light"
                    onClick={() => handleSort('kast')}
                    title="Kill/Assist/Survived/Traded %"
                  >
                    KAST{getSortIndicator('kast')}
                  </th>
                  <th
                    className="px-2 py-2 text-center font-medium cursor-pointer hover:text-vct-light"
                    onClick={() => handleSort('firstKills')}
                    title="First Kills"
                  >
                    FK{getSortIndicator('firstKills')}
                  </th>
                  <th className="px-2 py-2 text-center font-medium" title="First Deaths">
                    FD
                  </th>
                  <th className="px-2 py-2 text-center font-medium" title="Headshot %">
                    HS%
                  </th>
                  <th className="px-2 py-2 text-center font-medium" title="Clutches (Won/Attempted)">
                    Clutch
                  </th>
                </>
              )}
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
                  <div className="flex items-center gap-2">
                    <GameImage
                      src={getAgentImageUrl(perf.agent)}
                      alt={perf.agent}
                      className="w-5 h-5 object-contain"
                    />
                    {perf.playerName}
                  </div>
                </td>
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
                {showAdvanced && hasEnhancedStats && (
                  <>
                    <td className="px-2 py-2 text-center">
                      <AdrBadge adr={perf.adr ?? 0} />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <KastBadge kast={perf.kast ?? 0} />
                    </td>
                    <td className="px-2 py-2 text-center text-green-400">
                      {perf.firstKills ?? 0}
                    </td>
                    <td className="px-2 py-2 text-center text-red-400">
                      {perf.firstDeaths ?? 0}
                    </td>
                    <td className="px-2 py-2 text-center text-vct-light">
                      {perf.hsPercent ?? 0}%
                    </td>
                    <td className="px-2 py-2 text-center">
                      <ClutchBadge won={perf.clutchesWon ?? 0} attempted={perf.clutchesAttempted ?? 0} />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

  return <span className={getColor(kd)}>{formatKD(kd)}</span>;
}

// ADR Badge with color coding
function AdrBadge({ adr }: { adr: number }) {
  const getColor = (value: number): string => {
    if (value >= 180) return 'text-yellow-400 font-bold';
    if (value >= 150) return 'text-green-400';
    if (value >= 120) return 'text-vct-light';
    return 'text-vct-gray';
  };

  return <span className={getColor(adr)}>{adr}</span>;
}

// KAST Badge with color coding
function KastBadge({ kast }: { kast: number }) {
  const getColor = (value: number): string => {
    if (value >= 80) return 'text-yellow-400 font-bold';
    if (value >= 70) return 'text-green-400';
    if (value >= 60) return 'text-vct-light';
    return 'text-red-400';
  };

  return <span className={getColor(kast)}>{kast}%</span>;
}

// Clutch Badge showing won/attempted
function ClutchBadge({ won, attempted }: { won: number; attempted: number }) {
  if (attempted === 0) {
    return <span className="text-vct-gray">-</span>;
  }

  const successRate = won / attempted;
  const color =
    successRate >= 0.5
      ? 'text-green-400'
      : successRate > 0
      ? 'text-yellow-400'
      : 'text-red-400';

  return (
    <span className={color}>
      {won}/{attempted}
    </span>
  );
}
