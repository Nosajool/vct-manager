// ScrimRecapModal - Visual recap of scrim session results
//
// Shows team logos, map win/loss cards, map attribute before/after bars,
// relationship event banner, session metadata, and chemistry changes.

import { useGameStore } from '../../store';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl, getMapImageUrl } from '../../utils/imageAssets';
import { useVisibleMapStats } from '../../hooks/useFeatureGate';
import type { ActivityResolutionResult } from '../../types/activityPlan';
import type { MapStrengthAttributes } from '../../types/scrim';

interface ScrimRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityResults: ActivityResolutionResult;
  date: string;
}

const ATTRIBUTE_LABELS: Record<keyof MapStrengthAttributes, string> = {
  executes: 'Executes',
  retakes: 'Retakes',
  utility: 'Utility',
  communication: 'Comms',
  mapControl: 'Map Control',
  antiStrat: 'Anti-Strat',
};

const INTENSITY_LABELS: Record<string, { label: string; color: string }> = {
  light: { label: 'Light', color: 'bg-blue-500/20 text-blue-400' },
  moderate: { label: 'Moderate', color: 'bg-yellow-500/20 text-yellow-400' },
  competitive: { label: 'Competitive', color: 'bg-red-500/20 text-red-400' },
};

function AttributeBar({ label, before, delta }: { label: string; before: number; delta: number }) {
  const after = Math.round((before + delta) * 10) / 10;
  const maxVal = 85;
  const beforePct = Math.round((before / maxVal) * 100);
  const afterPct = Math.round((after / maxVal) * 100);
  const isPositive = delta > 0;

  return (
    <div className="grid grid-cols-[5rem_1fr_auto] items-center gap-2 text-xs">
      <span className="text-vct-gray truncate">{label}</span>
      <div className="relative h-2 bg-vct-gray/20 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-vct-gray/40 rounded-full"
          style={{ width: `${beforePct}%` }}
        />
        {isPositive && (
          <div
            className="absolute inset-y-0 bg-blue-500/60 rounded-full"
            style={{ left: `${beforePct}%`, width: `${afterPct - beforePct}%` }}
          />
        )}
      </div>
      <span className={`font-mono text-right min-w-[4.5rem] ${isPositive ? 'text-blue-400' : 'text-vct-gray'}`}>
        {Math.round(before)} → {Math.round(after)}
        {isPositive && <span className="text-blue-300/70"> (+{delta.toFixed(1)})</span>}
      </span>
    </div>
  );
}

export function ScrimRecapModal({ isOpen, onClose, activityResults, date }: ScrimRecapModalProps) {
  if (!isOpen) return null;

  const getPlayerTeam = useGameStore((state) => state.getPlayerTeam);
  const playerTeam = getPlayerTeam();
  const visibleMapStats = useVisibleMapStats();

  const { scrimResult } = activityResults;

  if (!scrimResult) return null;

  const playerTeamName = playerTeam?.name ?? 'Your Team';
  const opponentName = scrimResult.partnerTeamName;

  const mapsPlayed = scrimResult.maps.length;

  // Relationship data
  const relChange = scrimResult.relationshipChange;
  const relEvent = scrimResult.relationshipEvent;
  const relIsPositive = relChange >= 0;

  // Session metadata
  const intensity = INTENSITY_LABELS[scrimResult.intensity] ?? INTENSITY_LABELS['moderate'];
  const efficiencyPct = Math.round(scrimResult.efficiencyMultiplier * 100);
  const efficiencyColor = efficiencyPct >= 90 ? 'text-green-400' : efficiencyPct >= 65 ? 'text-yellow-400' : 'text-red-400';

  // Compute skills improved count for headline
  const skillsImproved = Object.values(scrimResult.mapImprovements).reduce((total, improvements) => {
    return total + Object.entries(improvements).filter(
      ([attr, d]) => (d ?? 0) > 0 && (visibleMapStats as string[]).includes(attr)
    ).length;
  }, 0);

  const mapsWithImprovements = Object.values(scrimResult.mapImprovements).filter((improvements) =>
    Object.entries(improvements).some(
      ([attr, d]) => (d ?? 0) > 0 && (visibleMapStats as string[]).includes(attr)
    )
  ).length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20">
          <h2 className="text-xl font-bold text-vct-light">Scrim Session</h2>
          <p className="text-sm text-vct-gray">{date}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Session headline */}
          {skillsImproved > 0 && (
            <p className="text-sm text-vct-gray">
              <span className="text-vct-light font-medium">{skillsImproved} skill{skillsImproved !== 1 ? 's' : ''} improved</span>
              {mapsWithImprovements > 0 && <span> across {mapsWithImprovements} map{mapsWithImprovements !== 1 ? 's' : ''}</span>}
              {scrimResult.chemistryChange !== 0 && (
                <span> · Team Chemistry {scrimResult.chemistryChange > 0 ? '+' : ''}{scrimResult.chemistryChange}</span>
              )}
            </p>
          )}

          {/* Opponent card — who you played, not who won */}
          <div className="flex items-center justify-between bg-vct-dark/50 rounded-lg p-4">
            <div className="flex items-center gap-3 flex-1">
              <GameImage
                src={getTeamLogoUrl(playerTeamName)}
                alt={playerTeamName}
                className="w-10 h-10 object-contain"
                fallbackClassName="w-10 h-10"
              />
              <span className="font-semibold text-vct-light">{playerTeamName}</span>
            </div>
            <div className="px-4">
              <span className="px-3 py-1 rounded-full bg-vct-gray/20 text-vct-gray text-sm">
                {mapsPlayed} map{mapsPlayed !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-1 justify-end">
              <span className="font-semibold text-vct-light">{opponentName}</span>
              <GameImage
                src={getTeamLogoUrl(opponentName)}
                alt={opponentName}
                className="w-10 h-10 object-contain"
                fallbackClassName="w-10 h-10"
              />
            </div>
          </div>

          {/* Skills Developed — before/after attribute bars (hero section) */}
          {Object.keys(scrimResult.mapImprovements).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">Skills Developed</h3>
              {Object.entries(scrimResult.mapImprovements).map(([mapName, improvements]) => {
                const beforeSnapshot = scrimResult.mapStatsBefore[mapName];
                const positiveAttrs = Object.entries(improvements).filter(
                  ([attr, d]) => (d ?? 0) > 0 && (visibleMapStats as string[]).includes(attr)
                );
                if (positiveAttrs.length === 0) return null;
                return (
                  <div key={mapName} className="bg-vct-dark/50 rounded-lg overflow-hidden space-y-2">
                    <div className="relative h-14">
                      <img src={getMapImageUrl(mapName)} alt={mapName} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/55" />
                      <div className="absolute inset-0 flex items-center px-4">
                        <span className="text-vct-light font-medium text-sm">{mapName}</span>
                      </div>
                    </div>
                    <div className="px-4 pb-3 space-y-2">
                      {positiveAttrs.map(([attr, delta]) => {
                        const before = beforeSnapshot?.[attr as keyof MapStrengthAttributes] ?? 0;
                        return (
                          <AttributeBar
                            key={attr}
                            label={ATTRIBUTE_LABELS[attr as keyof MapStrengthAttributes] ?? attr}
                            before={before}
                            delta={delta as number}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Session metadata row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${intensity.color}`}>
              {intensity.label}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-vct-dark/70 ${efficiencyColor}`}>
              {efficiencyPct}% efficiency
            </span>
            <span className="text-xs text-vct-gray">
              {scrimResult.duration}h session
            </span>
            {scrimResult.chemistryChange !== 0 && (
              <span className={`text-xs font-medium ${scrimResult.chemistryChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                Team Chemistry {scrimResult.chemistryChange > 0 ? '+' : ''}{scrimResult.chemistryChange}
              </span>
            )}
          </div>

          {/* Relationship change banner */}
          <div className={`rounded-lg border-l-4 px-4 py-3 bg-vct-dark/50 ${relIsPositive ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${relIsPositive ? 'text-green-400' : 'text-red-400'}`}>
                {relIsPositive ? '+' : ''}{relChange.toFixed(1)}
              </span>
              <span className="text-sm text-vct-gray">relationship with {opponentName}</span>
              <span className="text-xs text-vct-gray/60 ml-auto">
                {scrimResult.relationshipBefore} → {Math.round(scrimResult.relationshipBefore + relChange)}
              </span>
            </div>
            {relEvent && (
              <p className="text-xs text-vct-gray mt-1 leading-relaxed">{relEvent.description}</p>
            )}
          </div>

          {/* Per-map result cards — score as subtle secondary info */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">Maps</h3>
            <div className="space-y-2">
              {scrimResult.maps.map((mapResult, idx) => {
                const playerScore = mapResult.teamAScore;
                const opponentScore = mapResult.teamBScore;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-vct-dark/50 rounded-lg px-4 py-3"
                  >
                    <span className="text-vct-light font-medium">{mapResult.map}</span>
                    <span className="font-mono text-xs text-vct-gray">
                      {playerScore} – {opponentScore}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-vct-gray/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
