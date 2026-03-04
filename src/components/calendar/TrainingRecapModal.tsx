// TrainingRecapModal - Visual recap of training session results
//
// Shows a player card grid with photos, training goals, stat gains, and morale badges.
// Replaces the training section of DayRecapModal with a more visual, scan-friendly layout.

import { useGameStore } from '../../store';
import { useVisibleStats } from '../../hooks/useFeatureGate';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl } from '../../utils/imageAssets';
import { formatRating } from '../../utils/formatNumber';
import { TRAINING_GOAL_MAPPINGS } from '../../types/economy';
import type { ActivityResolutionResult } from '../../types/activityPlan';

interface TrainingRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityResults: ActivityResolutionResult;
  date: string;
}

const STAT_LABELS: Record<string, string> = {
  mechanics: 'Mechanics',
  igl: 'IGL',
  mental: 'Mental',
  clutch: 'Clutch',
  lurking: 'Lurking',
  entry: 'Entry',
  support: 'Support',
  vibes: 'Vibes',
  stamina: 'Stamina',
};

function StatBar({ label, before, after }: { label: string; before: number; after: number }) {
  const maxVal = 100;
  const beforePct = Math.min((before / maxVal) * 100, 100);
  const delta = after - before;
  const deltaPct = Math.min((delta / maxVal) * 100, 100);

  return (
    <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2">
      <span className="text-xs text-vct-gray truncate">{label}</span>
      <div className="relative h-1.5 bg-vct-dark/60 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-vct-gray/40 rounded-full"
          style={{ width: `${beforePct}%` }}
        />
        <div
          className="absolute inset-y-0 bg-blue-500 rounded-full"
          style={{ left: `${beforePct}%`, width: `${deltaPct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-vct-gray whitespace-nowrap">
        {formatRating(before)}<span className="text-blue-400"> → {formatRating(after)}</span>
      </span>
    </div>
  );
}

function effectivenessColor(pct: number): string {
  return pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400';
}

export function TrainingRecapModal({ isOpen, onClose, activityResults, date }: TrainingRecapModalProps) {
  const getPlayer = useGameStore((state) => state.getPlayer);
  const visibleStats = useVisibleStats();

  if (!isOpen) return null;

  const { trainingResults, skippedTraining } = activityResults;

  // Session-level derived data
  const avgEffectiveness =
    trainingResults.length > 0
      ? Math.round(
          trainingResults.reduce((sum, r) => sum + (r.effectiveness ?? 0), 0) / trainingResults.length
        )
      : 0;

  const topPerformerResult = trainingResults.length > 0
    ? trainingResults.reduce((best, r) => {
        const total = Object.values(r.statImprovements).reduce((s, v) => s + Math.max(0, v), 0);
        const bestTotal = Object.values(best.statImprovements).reduce((s, v) => s + Math.max(0, v), 0);
        return total > bestTotal ? r : best;
      }, trainingResults[0])
    : null;

  const topPerformerTotal = topPerformerResult
    ? Object.values(topPerformerResult.statImprovements).reduce((s, v) => s + Math.max(0, v), 0)
    : 0;

  const topPerformerPlayer = topPerformerResult ? getPlayer(topPerformerResult.playerId) : null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20">
          <h2 className="text-xl font-bold text-vct-light">Training Session</h2>
          <p className="text-sm text-vct-gray">{date}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {skippedTraining ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center bg-vct-dark/50 rounded-lg p-8 max-w-sm w-full">
                <div className="text-4xl mb-3">😴</div>
                <div className="text-vct-light font-semibold text-lg">Training Skipped</div>
                <div className="text-vct-gray text-sm mt-1">Team rests and recovers</div>
                <div className="text-green-400 text-sm mt-2">+Morale for the squad</div>
              </div>
            </div>
          ) : trainingResults.length > 0 ? (
            <>
              {/* Metadata row */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-2.5 py-1 bg-vct-dark/70 text-vct-gray text-xs rounded-full">
                  {trainingResults.length} players
                </span>
                <span className={`px-2.5 py-1 bg-vct-dark/70 text-xs rounded-full ${effectivenessColor(avgEffectiveness)}`}>
                  {avgEffectiveness}% avg effectiveness
                </span>
              </div>

              {/* Top performer banner */}
              {topPerformerTotal > 0 && topPerformerPlayer && (
                <div className="rounded-lg border-l-4 border-green-500 px-4 py-3 bg-vct-dark/50">
                  <div className="text-xs text-vct-gray mb-0.5">Best Training Session</div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">⭐</span>
                    <span className="text-vct-light font-semibold">{topPerformerPlayer.name}</span>
                    <span className="text-green-400 font-bold">+{topPerformerTotal.toFixed(1)} total gains</span>
                  </div>
                </div>
              )}

              {/* Player Results section */}
              <div>
                <div className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
                  Player Results
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {trainingResults.map((result) => {
                    const player = getPlayer(result.playerId);
                    if (!player) return null;

                    const goalMapping = result.goal ? TRAINING_GOAL_MAPPINGS[result.goal] : null;
                    const statChanges = Object.entries(result.statImprovements).filter(
                      ([stat, value]) => value > 0 && (visibleStats as string[]).includes(stat)
                    );

                    return (
                      <div
                        key={result.playerId}
                        className="bg-vct-dark/50 rounded-lg p-4 space-y-3"
                      >
                        {/* Player header */}
                        <div className="flex items-center gap-3">
                          <GameImage
                            src={getPlayerImageUrl(player.name)}
                            alt={player.name}
                            className="w-16 h-16 rounded-full object-cover"
                            fallbackClassName="w-16 h-16 rounded-full"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-vct-light truncate">{player.name}</div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              {goalMapping && (
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                  {goalMapping.displayName}
                                </span>
                              )}
                              <span className={`px-2 py-0.5 bg-vct-dark/70 text-xs rounded-full ${effectivenessColor(result.effectiveness)}`}>
                                {result.effectiveness}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stat bars */}
                        {statChanges.length > 0 ? (
                          <div className="space-y-1.5">
                            {statChanges.map(([stat, value]) => {
                              const currentVal = (player.stats as unknown as Record<string, number>)[stat] ?? 0;
                              const beforeVal = result.statsBefore?.[stat] ?? (currentVal - value);
                              const label = STAT_LABELS[stat] ?? stat;
                              return (
                                <StatBar
                                  key={stat}
                                  label={label}
                                  before={beforeVal}
                                  after={beforeVal + value}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-3 text-xs text-vct-gray italic bg-vct-dark/30 rounded">
                            No improvements this session
                          </div>
                        )}

                        {/* Morale badge */}
                        {result.moraleChange !== 0 && (
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
                              result.moraleChange > 0
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {result.moraleChange > 0 ? '+' : ''}{result.moraleChange} Morale
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-vct-light italic">No training results to show.</p>
            </div>
          )}
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
