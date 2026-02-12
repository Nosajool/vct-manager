// DayRecapModal - Shows a brief recap for non-match days
//
// Displays what happened during the day when advancing time on days
// without matches. Shows training narratives if available, or a
// "quiet day" message if nothing significant occurred.

import { useGameStore } from '../../store';
import { generateTrainingNarrative } from '../../engine/player/TrainingNarrative';
import type { TimeAdvanceResult } from '../../services';
import type { ActivityResolutionResult } from '../../types/activityPlan';

interface DayRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TimeAdvanceResult | null;
  activityResults?: ActivityResolutionResult;
}

export function DayRecapModal({
  isOpen,
  onClose,
  result,
  activityResults,
}: DayRecapModalProps) {
  if (!isOpen || !result) return null;

  const { getPlayer, getPlayerTeam } = useGameStore();
  const playerTeam = getPlayerTeam();

  // Check if anything significant happened
  const hasProcessedEvents = result.processedEvents.length > 0;
  const hasSkippedEvents = result.skippedEvents.length > 0;
  const hasActivityResults = activityResults && (
    activityResults.trainingResults.length > 0 ||
    activityResults.scrimResult !== null ||
    activityResults.skippedTraining ||
    activityResults.skippedScrim
  );

  // For when there are no activity results, show a simple message
  const getMessage = (): string => {
    if (hasProcessedEvents) {
      // Some events were processed (could be salary payments, tournament starts, etc.)
      return "The day passes quietly as the team prepares for upcoming challenges.";
    }

    if (hasSkippedEvents) {
      // Optional events were available but not taken
      return "A quiet day of rest and preparation.";
    }

    // Completely quiet day
    return "A quiet day. The team rests and recovers.";
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20">
          <h2 className="text-xl font-bold text-vct-light">Day Recap</h2>
          <p className="text-sm text-vct-gray">
            {result.newDate}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {hasActivityResults ? (
            <div className="space-y-6">
              {/* Training Results */}
              {activityResults.trainingResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-vct-accent border-b border-vct-accent/30 pb-2">
                    Training Session
                  </h3>
                  {activityResults.trainingResults.map((result) => {
                    const player = getPlayer(result.playerId);
                    if (!player) return null;

                    const narratives = generateTrainingNarrative(player, result);
                    const statChanges = Object.entries(result.statImprovements).filter(
                      ([_, value]) => value > 0
                    );

                    return (
                      <div
                        key={result.playerId}
                        className="bg-vct-dark/50 rounded-lg p-4 space-y-2"
                      >
                        <div className="font-semibold text-vct-light">{player.name}</div>

                        {/* Stat Changes */}
                        {statChanges.length > 0 && (
                          <div className="text-sm space-y-1">
                            {statChanges.map(([stat, value]) => {
                              const oldValue = player.stats[stat as keyof typeof player.stats] as number;
                              const newValue = oldValue + value;
                              return (
                                <div key={stat} className="text-vct-gray">
                                  <span className="capitalize">{stat}</span>:{' '}
                                  <span className="text-vct-light">{oldValue}</span>
                                  {' → '}
                                  <span className="text-green-400">{newValue.toFixed(1)}</span>
                                  {' '}
                                  <span className="text-green-400">(+{value.toFixed(1)})</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Morale Change */}
                        {result.moraleChange !== 0 && (
                          <div className="text-sm text-vct-gray">
                            Morale:{' '}
                            <span className={result.moraleChange > 0 ? 'text-green-400' : 'text-red-400'}>
                              {result.moraleChange > 0 ? '+' : ''}{result.moraleChange}
                            </span>
                          </div>
                        )}

                        {/* Narrative */}
                        <div className="text-sm text-vct-gray italic space-y-1">
                          {narratives.map((narrative, idx) => (
                            <p key={idx}>{narrative}</p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Skipped Training */}
              {activityResults.skippedTraining && (
                <div className="bg-vct-dark/50 rounded-lg p-4">
                  <div className="text-vct-light">
                    <span className="font-semibold">Training Skipped</span> — Team rests and recovers
                  </div>
                  <div className="text-sm text-green-400 mt-1">
                    +Morale for the squad
                  </div>
                </div>
              )}

              {/* Scrim Results */}
              {activityResults.scrimResult && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-vct-accent border-b border-vct-accent/30 pb-2">
                    Scrim Results
                  </h3>
                  <div className="bg-vct-dark/50 rounded-lg p-4 space-y-3">
                    {/* Opponent & Winner */}
                    <div className="space-y-1">
                      <div className="text-vct-gray text-sm">vs {activityResults.scrimResult.partnerTeamName}</div>
                      <div className="text-vct-light font-semibold">
                        Winner:{' '}
                        <span className={
                          activityResults.scrimResult.overallWinner === playerTeam?.id
                            ? 'text-green-400'
                            : 'text-red-400'
                        }>
                          {activityResults.scrimResult.overallWinner === playerTeam?.id
                            ? playerTeam.name
                            : activityResults.scrimResult.partnerTeamName}
                        </span>
                      </div>
                    </div>

                    {/* Map Scores */}
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-vct-light">Maps:</div>
                      {activityResults.scrimResult.maps.map((mapResult, idx) => (
                        <div key={idx} className="text-sm text-vct-gray flex justify-between">
                          <span>{mapResult.map}</span>
                          <span className="font-mono">
                            {mapResult.teamAScore} - {mapResult.teamBScore}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Map Improvements */}
                    {Object.keys(activityResults.scrimResult.mapImprovements).length > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-vct-light">Map Improvements:</div>
                        {Object.entries(activityResults.scrimResult.mapImprovements).map(([map, improvements]) => (
                          <div key={map} className="text-sm text-green-400">
                            {map}: {Object.keys(improvements).join(', ')} improved
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chemistry Change */}
                    {activityResults.scrimResult.chemistryChange !== 0 && (
                      <div className="text-sm">
                        <span className="text-vct-gray">Team Chemistry: </span>
                        <span className={activityResults.scrimResult.chemistryChange > 0 ? 'text-green-400' : 'text-red-400'}>
                          {activityResults.scrimResult.chemistryChange > 0 ? '+' : ''}
                          {activityResults.scrimResult.chemistryChange}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skipped Scrim */}
              {activityResults.skippedScrim && (
                <div className="bg-vct-dark/50 rounded-lg p-4">
                  <div className="text-vct-light">
                    <span className="font-semibold">Scrim Skipped</span> — Team takes a break
                  </div>
                  <div className="text-sm text-green-400 mt-1">
                    +Morale for the squad
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-vct-light text-lg italic">
                {getMessage()}
              </p>
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
