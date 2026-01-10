// MapPoolView Component - Display team's map pool strengths

import { useGameStore } from '../../store';
import { MAPS } from '../../utils/constants';
import type { MapStrengthAttributes } from '../../types';

interface MapPoolViewProps {
  teamId?: string;
  compact?: boolean;
}

const ATTRIBUTE_LABELS: { key: keyof MapStrengthAttributes; label: string; color: string }[] = [
  { key: 'executes', label: 'Executes', color: 'bg-red-500' },
  { key: 'retakes', label: 'Retakes', color: 'bg-blue-500' },
  { key: 'utility', label: 'Utility', color: 'bg-green-500' },
  { key: 'communication', label: 'Comms', color: 'bg-yellow-500' },
  { key: 'mapControl', label: 'Map Control', color: 'bg-purple-500' },
  { key: 'antiStrat', label: 'Anti-Strat', color: 'bg-orange-500' },
];

export function MapPoolView({ teamId, compact = false }: MapPoolViewProps) {
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);

  const targetTeamId = teamId ?? playerTeamId;
  if (!targetTeamId) return null;

  const team = teams[targetTeamId];
  if (!team?.mapPool) return null;

  const mapPool = team.mapPool;

  // Calculate average strength for a map
  const getMapAverage = (attrs: MapStrengthAttributes): number => {
    return Math.round(
      (attrs.executes + attrs.retakes + attrs.utility +
        attrs.communication + attrs.mapControl + attrs.antiStrat) / 6
    );
  };

  // Get strength color
  const getStrengthColor = (value: number): string => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-blue-400';
    if (value >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Sort maps by strength
  const sortedMaps = MAPS.slice().sort((a, b) => {
    const aStrength = mapPool.maps[a] ? getMapAverage(mapPool.maps[a].attributes) : 0;
    const bStrength = mapPool.maps[b] ? getMapAverage(mapPool.maps[b].attributes) : 0;
    return bStrength - aStrength;
  });

  if (compact) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-vct-gray">Map Pool</h4>
        <div className="grid grid-cols-4 gap-1">
          {sortedMaps.slice(0, 4).map((mapName) => {
            const mapStrength = mapPool.maps[mapName];
            const avg = mapStrength ? getMapAverage(mapStrength.attributes) : 50;

            return (
              <div
                key={mapName}
                className="bg-vct-dark p-2 rounded text-center border border-vct-gray/20"
              >
                <p className="text-xs text-vct-gray truncate">{mapName}</p>
                <p className={`font-bold ${getStrengthColor(avg)}`}>{avg}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-vct-light">Map Pool Strength</h3>
      </div>

      <div className="space-y-3">
        {sortedMaps.map((mapName) => {
          const mapStrength = mapPool.maps[mapName];
          if (!mapStrength) return null;

          const avg = getMapAverage(mapStrength.attributes);

          return (
            <div
              key={mapName}
              className="bg-vct-dark p-4 rounded-lg border border-vct-gray/20"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-vct-light">{mapName}</span>
                <span className={`text-lg font-bold ${getStrengthColor(avg)}`}>
                  {avg}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {ATTRIBUTE_LABELS.map(({ key, label, color }) => {
                  const value = Math.round(mapStrength.attributes[key]);

                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-vct-gray">{label}</span>
                        <span className={getStrengthColor(value)}>{value}</span>
                      </div>
                      <div className="h-1.5 bg-vct-gray/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 text-xs text-vct-gray">
                Last practiced: {mapStrength.lastPracticedDate
                  ? new Date(mapStrength.lastPracticedDate).toLocaleDateString()
                  : 'Never'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
