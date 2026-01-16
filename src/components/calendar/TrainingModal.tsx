// TrainingModal Component - Training session configuration

import { useState } from 'react';
import { useGameStore } from '../../store';
import { trainingService } from '../../services';
import { playerDevelopment } from '../../engine/player';
import type { Player, TrainingFocus, TrainingIntensity, TrainingResult } from '../../types';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrainingComplete?: (results: TrainingResult[]) => void;
}

const TRAINING_FOCUSES: { value: TrainingFocus; label: string }[] = [
  { value: 'mechanics', label: 'Mechanics' },
  { value: 'igl', label: 'IGL / Leadership' },
  { value: 'mental', label: 'Mental / Game Sense' },
  { value: 'clutch', label: 'Clutch Situations' },
  { value: 'entry', label: 'Entry Fragging' },
  { value: 'support', label: 'Support Play' },
  { value: 'lurking', label: 'Lurking' },
  { value: 'balanced', label: 'Balanced Training' },
];

const TRAINING_INTENSITIES: { value: TrainingIntensity; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Lower improvement, preserves morale' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced improvement and morale impact' },
  { value: 'intense', label: 'Intense', description: 'Higher improvement, may decrease morale' },
];

export function TrainingModal({ isOpen, onClose, onTrainingComplete }: TrainingModalProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<TrainingFocus>('balanced');
  const [intensity, setIntensity] = useState<TrainingIntensity>('moderate');
  const [trainingResults, setTrainingResults] = useState<TrainingResult[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const players = useGameStore((state) => state.players);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);

  if (!isOpen) return null;

  const team = playerTeamId ? teams[playerTeamId] : null;
  if (!team) return null;

  // Get team roster
  const rosterPlayerIds = [...team.playerIds, ...team.reservePlayerIds];
  const rosterPlayers = rosterPlayerIds
    .map((id) => players[id])
    .filter((p): p is Player => p !== undefined);

  // Check training availability for each player
  const getPlayerTrainingStatus = (playerId: string) => {
    return trainingService.checkWeeklyLimit(playerId);
  };

  // Toggle player selection
  const togglePlayer = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  // Select all available players
  const selectAll = () => {
    const available = rosterPlayers
      .filter((p) => getPlayerTrainingStatus(p.id).canTrain)
      .map((p) => p.id);
    setSelectedPlayers(new Set(available));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedPlayers(new Set());
  };

  // Run training
  const handleTrain = () => {
    if (selectedPlayers.size === 0) return;

    setIsTraining(true);
    const results: TrainingResult[] = [];

    for (const playerId of selectedPlayers) {
      const result = trainingService.trainPlayer(playerId, focus, intensity);
      if (result.success && result.result) {
        results.push(result.result);
      }
    }

    setTrainingResults(results);
    setShowResults(true);
    setIsTraining(false);
    onTrainingComplete?.(results);
  };

  // Reset and close
  const handleClose = () => {
    setSelectedPlayers(new Set());
    setTrainingResults([]);
    setShowResults(false);
    onClose();
  };

  // Get training summary
  const summary = trainingService.getTeamTrainingSummary();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20 flex items-center justify-between">
          <h2 className="text-xl font-bold text-vct-light">Team Training</h2>
          <button
            onClick={handleClose}
            className="text-vct-gray hover:text-vct-light transition-colors"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {showResults ? (
            /* Training Results */
            <div className="p-4">
              <h3 className="text-lg font-semibold text-vct-light mb-4">Training Complete!</h3>
              <div className="space-y-3">
                {trainingResults.map((result) => {
                  const player = players[result.playerId];
                  if (!player) return null;

                  return (
                    <div
                      key={result.playerId}
                      className="bg-vct-dark p-3 rounded-lg border border-vct-gray/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-vct-light">{player.name}</span>
                        <span className="text-sm text-vct-gray">
                          Effectiveness: {result.effectiveness}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {result.statsBefore ? (
                          Object.entries(result.statsBefore).map(([stat, beforeValue]) => {
                            const improvement = result.statImprovements[stat] || 0;
                            const afterValue = beforeValue + improvement;
                            const hasChange = improvement !== 0;
                            return (
                              <div key={stat} className="flex items-center justify-between">
                                <span className="text-vct-gray capitalize">{stat}</span>
                                <span className={hasChange ? 'text-green-400 font-medium' : 'text-vct-gray'}>
                                  {beforeValue} → {afterValue}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          Object.entries(result.statImprovements).map(([stat, improvement]) => (
                            <div key={stat} className="flex items-center justify-between">
                              <span className="text-vct-gray capitalize">{stat}</span>
                              <span className="text-green-400 font-medium">+{improvement}</span>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-vct-gray">Morale: </span>
                        {result.moraleBefore !== undefined ? (
                          <span className={result.moraleChange > 0 ? 'text-green-400' : result.moraleChange < 0 ? 'text-red-400' : 'text-vct-gray'}>
                            {result.moraleBefore} → {result.moraleBefore + result.moraleChange}
                          </span>
                        ) : (
                          <span className={result.moraleChange > 0 ? 'text-green-400' : 'text-red-400'}>
                            {result.moraleChange > 0 ? '+' : ''}{result.moraleChange}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleClose}
                className="mt-4 w-full py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            /* Training Configuration */
            <div className="p-4 space-y-4">
              {/* Training Summary */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-vct-gray">
                  {summary.playersCanTrain} of {summary.totalPlayers} players can train
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Select All
                  </button>
                  <span className="text-vct-gray">|</span>
                  <button
                    onClick={clearSelection}
                    className="text-vct-gray hover:text-vct-light transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Player Selection */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-vct-gray">Select Players</h4>
                <div className="grid grid-cols-1 gap-2">
                  {rosterPlayers.map((player) => {
                    const status = getPlayerTrainingStatus(player.id);
                    const isSelected = selectedPlayers.has(player.id);
                    const recommended = playerDevelopment.getRecommendedFocus(player);
                    const effectiveness = trainingService.previewTrainingEffectiveness(
                      player.id,
                      intensity
                    );

                    return (
                      <button
                        key={player.id}
                        onClick={() => status.canTrain && togglePlayer(player.id)}
                        disabled={!status.canTrain}
                        className={`
                          p-3 rounded-lg border transition-all text-left
                          ${isSelected
                            ? 'border-vct-red bg-vct-red/10'
                            : status.canTrain
                            ? 'border-vct-gray/20 bg-vct-dark hover:border-vct-gray/40'
                            : 'border-vct-gray/10 bg-vct-gray/5 opacity-50 cursor-not-allowed'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              disabled={!status.canTrain}
                              className="rounded border-vct-gray"
                            />
                            <div>
                              <p className="font-medium text-vct-light">{player.name}</p>
                              <p className="text-xs text-vct-gray">
                                Age {player.age} | OVR {playerDevelopment.calculateOverall(player.stats)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {status.canTrain ? (
                              <>
                                <p className="text-xs text-vct-gray">
                                  Sessions: {status.sessionsUsed}/2
                                </p>
                                <p className="text-xs text-blue-400">
                                  Recommended: {recommended}
                                </p>
                                <p className="text-xs text-green-400">
                                  Effectiveness: {effectiveness}%
                                </p>
                              </>
                            ) : (
                              <p className="text-xs text-yellow-400">
                                At weekly limit
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Training Focus */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-vct-gray">Training Focus</h4>
                <select
                  value={focus}
                  onChange={(e) => setFocus(e.target.value as TrainingFocus)}
                  className="w-full p-2 bg-vct-dark border border-vct-gray/20 rounded-lg text-vct-light"
                >
                  {TRAINING_FOCUSES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-vct-gray">
                  {trainingService.getFocusDescription(focus)}
                </p>
              </div>

              {/* Training Intensity */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-vct-gray">Training Intensity</h4>
                <div className="grid grid-cols-3 gap-2">
                  {TRAINING_INTENSITIES.map((i) => (
                    <button
                      key={i.value}
                      onClick={() => setIntensity(i.value)}
                      className={`
                        p-2 rounded-lg border transition-colors text-center
                        ${intensity === i.value
                          ? 'border-vct-red bg-vct-red/10 text-vct-red'
                          : 'border-vct-gray/20 bg-vct-dark text-vct-light hover:border-vct-gray/40'}
                      `}
                    >
                      <p className="font-medium">{i.label}</p>
                      <p className="text-xs text-vct-gray mt-1">{i.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Train Button */}
              <button
                onClick={handleTrain}
                disabled={selectedPlayers.size === 0 || isTraining}
                className="w-full py-3 bg-vct-red hover:bg-vct-red/80 disabled:bg-vct-gray/20 disabled:text-vct-gray text-white rounded-lg font-medium transition-colors"
              >
                {isTraining
                  ? 'Training...'
                  : selectedPlayers.size === 0
                  ? 'Select players to train'
                  : `Train ${selectedPlayers.size} Player${selectedPlayers.size > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
