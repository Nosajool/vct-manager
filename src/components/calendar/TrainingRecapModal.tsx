// TrainingRecapModal - Visual recap of training session results
//
// Shows a player card grid with photos, training goals, stat gains, and morale badges.
// Replaces the training section of DayRecapModal with a more visual, scan-friendly layout.

import { useGameStore } from '../../store';
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

export function TrainingRecapModal({ isOpen, onClose, activityResults, date }: TrainingRecapModalProps) {
  if (!isOpen) return null;

  const getPlayer = useGameStore((state) => state.getPlayer);

  const { trainingResults, skippedTraining } = activityResults;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20">
          <h2 className="text-xl font-bold text-vct-light">Training Session</h2>
          <p className="text-sm text-vct-gray">{date}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
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
            <div className="grid grid-cols-2 gap-4">
              {trainingResults.map((result) => {
                const player = getPlayer(result.playerId);
                if (!player) return null;

                const goalMapping = result.goal ? TRAINING_GOAL_MAPPINGS[result.goal] : null;
                const statChanges = Object.entries(result.statImprovements).filter(
                  ([, value]) => value > 0
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
                      <div className="min-w-0">
                        <div className="font-semibold text-vct-light truncate">{player.name}</div>
                        {/* Training goal pill */}
                        {goalMapping && (
                          <div className="mt-1 inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                            {goalMapping.displayName}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stat change badges */}
                    {statChanges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {statChanges.map(([stat, value]) => {
                          const oldValue = (player.stats as unknown as Record<string, number>)[stat] ?? 0;
                          const newValue = oldValue + value;
                          const label = STAT_LABELS[stat] ?? stat;
                          return (
                            <div
                              key={stat}
                              className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded"
                              title={`${formatRating(oldValue)} → ${formatRating(newValue)}`}
                            >
                              <span>+{value.toFixed(1)}</span>
                              <span className="text-green-300/70">{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {statChanges.length === 0 && (
                      <div className="text-xs text-vct-gray italic">No stat improvements this session</div>
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
