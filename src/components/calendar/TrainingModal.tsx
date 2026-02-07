// TrainingModal Component - Single-modal 3-column training layout
// Replaces multi-step wizard with per-player assignment system

import { useState, useMemo } from 'react';
import { useGameStore } from '../../store';
import { trainingService } from '../../services';
import { playerDevelopment } from '../../engine/player';
import { TRAINING_GOAL_MAPPINGS } from '../../types/economy';
import type {
  Player,
  TrainingGoal,
  TrainingIntensity,
  TrainingResult,
  PlayerTrainingAssignment,
  TrainingPlan,
} from '../../types';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrainingComplete?: (results: TrainingResult[]) => void;
}

const TRAINING_INTENSITIES: {
  value: TrainingIntensity;
  label: string;
  description: string;
}[] = [
  { value: 'light', label: 'Light', description: 'Lower improvement, preserves morale' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced improvement and morale impact' },
  { value: 'intense', label: 'Intense', description: 'Higher improvement, may decrease morale' },
];

export function TrainingModal({ isOpen, onClose, onTrainingComplete }: TrainingModalProps) {
  // State: Training plan (Map of playerId -> assignment)
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan>(new Map());
  // State: Currently selected player (for editing assignment in middle/right columns)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  // State: Training results after execution
  const [trainingResults, setTrainingResults] = useState<TrainingResult[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const players = useGameStore((state) => state.players);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);

  if (!isOpen) return null;

  const team = playerTeamId ? teams[playerTeamId] : null;
  if (!team) return null;

  // Split roster into starting 5 and bench/reserves
  const startingPlayers = team.playerIds
    .map((id) => players[id])
    .filter((p): p is Player => p !== undefined);
  const benchPlayers = team.reservePlayerIds
    .map((id) => players[id])
    .filter((p): p is Player => p !== undefined);

  // Get current assignment for selected player (if any)
  const currentAssignment = selectedPlayerId ? trainingPlan.get(selectedPlayerId) : null;

  // Helper: Check if player can train
  const getPlayerTrainingStatus = (playerId: string) => {
    return trainingService.checkWeeklyLimit(playerId);
  };

  // Helper: Toggle player in/out of training plan
  const togglePlayerAssignment = (playerId: string) => {
    const newPlan = new Map(trainingPlan);

    if (newPlan.has(playerId)) {
      // Remove from plan
      newPlan.delete(playerId);
      // If this was the selected player, deselect
      if (selectedPlayerId === playerId) {
        setSelectedPlayerId(null);
      }
    } else {
      // Add to plan with recommended goal + default intensity
      const recommendedGoal = trainingService.getRecommendedGoal(playerId);
      if (recommendedGoal) {
        newPlan.set(playerId, {
          playerId,
          goal: recommendedGoal,
          intensity: 'moderate',
          isAutoAssigned: true,
        });
        // Auto-select this player for editing
        setSelectedPlayerId(playerId);
      }
    }

    setTrainingPlan(newPlan);
  };

  // Helper: Update goal for selected player
  const updateSelectedGoal = (goal: TrainingGoal) => {
    if (!selectedPlayerId) return;

    const newPlan = new Map(trainingPlan);
    const existing = newPlan.get(selectedPlayerId);

    if (existing) {
      newPlan.set(selectedPlayerId, {
        ...existing,
        goal,
        isAutoAssigned: false, // User manually changed it
      });
      setTrainingPlan(newPlan);
    }
  };

  // Helper: Update intensity for selected player
  const updateSelectedIntensity = (intensity: TrainingIntensity) => {
    if (!selectedPlayerId) return;

    const newPlan = new Map(trainingPlan);
    const existing = newPlan.get(selectedPlayerId);

    if (existing) {
      newPlan.set(selectedPlayerId, {
        ...existing,
        intensity,
      });
      setTrainingPlan(newPlan);
    }
  };

  // Helper: Select player (for viewing/editing their assignment)
  const selectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
  };

  // Execute training plan
  const handleTrain = () => {
    if (trainingPlan.size === 0) return;

    setIsTraining(true);
    const result = trainingService.executeTrainingPlan(trainingPlan);

    // Extract successful results
    const successfulResults = result.results
      .filter((r) => r.success && r.result)
      .map((r) => r.result!);

    setTrainingResults(successfulResults);
    setShowResults(true);
    setIsTraining(false);
    onTrainingComplete?.(successfulResults);
  };

  // Reset and close
  const handleClose = () => {
    setTrainingPlan(new Map());
    setSelectedPlayerId(null);
    setTrainingResults([]);
    setShowResults(false);
    onClose();
  };

  // Get preview data for selected player
  const selectedPlayerPreview = useMemo(() => {
    if (!selectedPlayerId || !currentAssignment) return null;

    const player = players[selectedPlayerId];
    if (!player) return null;

    const { goal, intensity } = currentAssignment;
    const ovrChange = trainingService.previewOvrChange(selectedPlayerId, goal, intensity);
    const statChanges = trainingService.previewStatChanges(selectedPlayerId, goal, intensity);
    const moraleImpact = trainingService.previewMoraleImpact(intensity);

    return {
      player,
      goal,
      intensity,
      ovrChange,
      statChanges,
      moraleImpact,
    };
  }, [selectedPlayerId, currentAssignment, players]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-vct-light">Team Training</h2>
          <button
            onClick={handleClose}
            className="text-vct-gray hover:text-vct-light transition-colors"
          >
            Close
          </button>
        </div>

        {showResults ? (
          /* Training Results View */
          <div className="overflow-y-auto flex-1 p-4">
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
                    {result.goal && (
                      <p className="text-sm text-blue-400 mb-2">
                        {TRAINING_GOAL_MAPPINGS[result.goal].displayName}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {result.statsBefore ? (
                        Object.entries(result.statsBefore).map(([stat, beforeValue]) => {
                          const improvement = result.statImprovements[stat] || 0;
                          const afterValue = beforeValue + improvement;
                          const hasChange = improvement !== 0;
                          return (
                            <div key={stat} className="flex items-center justify-between">
                              <span className="text-vct-gray capitalize">{stat}</span>
                              <span
                                className={
                                  hasChange ? 'text-green-400 font-medium' : 'text-vct-gray'
                                }
                              >
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
                        <span
                          className={
                            result.moraleChange > 0
                              ? 'text-green-400'
                              : result.moraleChange < 0
                              ? 'text-red-400'
                              : 'text-vct-gray'
                          }
                        >
                          {result.moraleBefore} → {result.moraleBefore + result.moraleChange}
                        </span>
                      ) : (
                        <span
                          className={result.moraleChange > 0 ? 'text-green-400' : 'text-red-400'}
                        >
                          {result.moraleChange > 0 ? '+' : ''}
                          {result.moraleChange}
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
          /* 3-Column Training Configuration View */
          <div className="flex-1 overflow-hidden grid grid-cols-[280px_1fr_320px] gap-4 p-4">
            {/* LEFT COLUMN: Player List */}
            <PlayerListColumn
              startingPlayers={startingPlayers}
              benchPlayers={benchPlayers}
              trainingPlan={trainingPlan}
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={selectPlayer}
              onTogglePlayer={togglePlayerAssignment}
              getPlayerTrainingStatus={getPlayerTrainingStatus}
            />

            {/* MIDDLE COLUMN: Goal Selector */}
            <GoalSelectorColumn
              selectedPlayer={selectedPlayerId ? players[selectedPlayerId] : null}
              currentGoal={currentAssignment?.goal ?? null}
              onSelectGoal={updateSelectedGoal}
            />

            {/* RIGHT COLUMN: Intensity & Preview */}
            <IntensityPreviewColumn
              selectedPlayerPreview={selectedPlayerPreview}
              currentIntensity={currentAssignment?.intensity ?? 'moderate'}
              onSelectIntensity={updateSelectedIntensity}
              trainingPlan={trainingPlan}
              isTraining={isTraining}
              onTrain={handleTrain}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================
   PLAYER LIST COLUMN
   ======================================== */

interface PlayerListColumnProps {
  startingPlayers: Player[];
  benchPlayers: Player[];
  trainingPlan: TrainingPlan;
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
  onTogglePlayer: (playerId: string) => void;
  getPlayerTrainingStatus: (playerId: string) => { canTrain: boolean; sessionsUsed: number };
}

function PlayerListColumn({
  startingPlayers,
  benchPlayers,
  trainingPlan,
  selectedPlayerId,
  onSelectPlayer,
  onTogglePlayer,
  getPlayerTrainingStatus,
}: PlayerListColumnProps) {
  const [showBench, setShowBench] = useState(false);

  return (
    <div className="flex flex-col h-full bg-vct-dark rounded-lg border border-vct-gray/20 overflow-hidden">
      <div className="p-3 border-b border-vct-gray/20">
        <h3 className="text-sm font-semibold text-vct-gray">Players</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Starting 5 (always expanded) */}
        <div className="p-2 space-y-1">
          <div className="text-xs font-medium text-vct-gray px-2 py-1">Starting 5</div>
          {startingPlayers.map((player) => (
            <PlayerListItem
              key={player.id}
              player={player}
              isSelected={selectedPlayerId === player.id}
              isAssigned={trainingPlan.has(player.id)}
              trainingStatus={getPlayerTrainingStatus(player.id)}
              onSelect={() => onSelectPlayer(player.id)}
              onToggle={() => onTogglePlayer(player.id)}
            />
          ))}
        </div>

        {/* Bench / Reserves (collapsible) */}
        {benchPlayers.length > 0 && (
          <div className="p-2 space-y-1">
            <button
              onClick={() => setShowBench(!showBench)}
              className="w-full flex items-center justify-between text-xs font-medium text-vct-gray px-2 py-1 hover:text-vct-light transition-colors"
            >
              <span>Bench ({benchPlayers.length})</span>
              <span>{showBench ? '▼' : '▶'}</span>
            </button>
            {showBench &&
              benchPlayers.map((player) => (
                <PlayerListItem
                  key={player.id}
                  player={player}
                  isSelected={selectedPlayerId === player.id}
                  isAssigned={trainingPlan.has(player.id)}
                  trainingStatus={getPlayerTrainingStatus(player.id)}
                  onSelect={() => onSelectPlayer(player.id)}
                  onToggle={() => onTogglePlayer(player.id)}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PlayerListItemProps {
  player: Player;
  isSelected: boolean;
  isAssigned: boolean;
  trainingStatus: { canTrain: boolean; sessionsUsed: number };
  onSelect: () => void;
  onToggle: () => void;
}

function PlayerListItem({
  player,
  isSelected,
  isAssigned,
  trainingStatus,
  onSelect,
  onToggle,
}: PlayerListItemProps) {
  const ovr = playerDevelopment.calculateOverall(player.stats);
  const canTrain = trainingStatus.canTrain;

  return (
    <div
      className={`
        flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
        ${isSelected ? 'bg-vct-red/20 border border-vct-red' : 'border border-transparent'}
        ${!canTrain ? 'opacity-50' : 'hover:bg-vct-gray/10'}
      `}
      onClick={onSelect}
    >
      <input
        type="checkbox"
        checked={isAssigned}
        onChange={(e) => {
          e.stopPropagation();
          if (canTrain) onToggle();
        }}
        disabled={!canTrain}
        className="rounded border-vct-gray"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-vct-light truncate">{player.name}</div>
        <div className="text-xs text-vct-gray">
          OVR {ovr} • {trainingStatus.sessionsUsed}/2 sessions
        </div>
      </div>
    </div>
  );
}

/* ========================================
   GOAL SELECTOR COLUMN
   ======================================== */

interface GoalSelectorColumnProps {
  selectedPlayer: Player | null;
  currentGoal: TrainingGoal | null;
  onSelectGoal: (goal: TrainingGoal) => void;
}

function GoalSelectorColumn({
  selectedPlayer,
  currentGoal,
  onSelectGoal,
}: GoalSelectorColumnProps) {
  const allGoals = trainingService.getAllGoals();

  if (!selectedPlayer) {
    return (
      <div className="flex flex-col h-full bg-vct-dark rounded-lg border border-vct-gray/20 items-center justify-center">
        <p className="text-vct-gray text-sm">Select a player to assign training</p>
      </div>
    );
  }

  const recommendedGoal = trainingService.getRecommendedGoal(selectedPlayer.id);

  return (
    <div className="flex flex-col h-full bg-vct-dark rounded-lg border border-vct-gray/20 overflow-hidden">
      <div className="p-3 border-b border-vct-gray/20">
        <h3 className="text-sm font-semibold text-vct-gray">Training Focus</h3>
        <p className="text-xs text-vct-gray mt-1">{selectedPlayer.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {allGoals.map((goal) => {
          const goalInfo = TRAINING_GOAL_MAPPINGS[goal];
          const isRecommended = goal === recommendedGoal;
          const isSelected = goal === currentGoal;

          return (
            <button
              key={goal}
              onClick={() => onSelectGoal(goal)}
              className={`
                w-full p-3 rounded-lg border text-left transition-all
                ${
                  isSelected
                    ? 'border-vct-red bg-vct-red/10'
                    : 'border-vct-gray/20 hover:border-vct-gray/40 bg-vct-darker'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-vct-light text-sm">
                  {goalInfo.displayName}
                </span>
                {isRecommended && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-vct-gray mb-2">{goalInfo.description}</p>
              <div className="flex flex-wrap gap-1">
                {goalInfo.previewDescriptors.map((descriptor) => (
                  <span
                    key={descriptor}
                    className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded"
                  >
                    {descriptor}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ========================================
   INTENSITY & PREVIEW COLUMN
   ======================================== */

interface IntensityPreviewColumnProps {
  selectedPlayerPreview: {
    player: Player;
    goal: TrainingGoal;
    intensity: TrainingIntensity;
    ovrChange: { min: number; max: number } | null;
    statChanges: Record<string, { min: number; max: number }> | null;
    moraleImpact: { min: number; max: number; qualitative: string };
  } | null;
  currentIntensity: TrainingIntensity;
  onSelectIntensity: (intensity: TrainingIntensity) => void;
  trainingPlan: TrainingPlan;
  isTraining: boolean;
  onTrain: () => void;
}

function IntensityPreviewColumn({
  selectedPlayerPreview,
  currentIntensity,
  onSelectIntensity,
  trainingPlan,
  isTraining,
  onTrain,
}: IntensityPreviewColumnProps) {
  return (
    <div className="flex flex-col h-full bg-vct-dark rounded-lg border border-vct-gray/20 overflow-hidden">
      <div className="p-3 border-b border-vct-gray/20">
        <h3 className="text-sm font-semibold text-vct-gray">Intensity & Preview</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Intensity Selector */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-vct-gray">Training Intensity</h4>
          <div className="grid grid-cols-1 gap-2">
            {TRAINING_INTENSITIES.map((option) => (
              <button
                key={option.value}
                onClick={() => onSelectIntensity(option.value)}
                disabled={!selectedPlayerPreview}
                className={`
                  p-2 rounded-lg border transition-colors text-left
                  ${
                    currentIntensity === option.value && selectedPlayerPreview
                      ? 'border-vct-red bg-vct-red/10 text-vct-light'
                      : 'border-vct-gray/20 bg-vct-darker text-vct-gray hover:border-vct-gray/40'
                  }
                  ${!selectedPlayerPreview ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs opacity-80">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview for Selected Player */}
        {selectedPlayerPreview && (
          <div className="space-y-3 p-3 bg-vct-darker rounded-lg border border-vct-gray/20">
            <h4 className="text-xs font-semibold text-vct-gray">Preview</h4>

            {/* OVR Change */}
            {selectedPlayerPreview.ovrChange && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-vct-gray">OVR Change</span>
                <span className="text-green-400 font-medium">
                  +{selectedPlayerPreview.ovrChange.min} to +
                  {selectedPlayerPreview.ovrChange.max}
                </span>
              </div>
            )}

            {/* Morale Impact */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-vct-gray">Morale Impact</span>
              <span
                className={
                  selectedPlayerPreview.moraleImpact.min >= 0 ? 'text-green-400' : 'text-red-400'
                }
              >
                {selectedPlayerPreview.moraleImpact.qualitative}
              </span>
            </div>

            {/* Stat Changes Preview */}
            {selectedPlayerPreview.statChanges && (
              <div className="space-y-1">
                <p className="text-xs text-vct-gray">Stat Improvements</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {Object.entries(selectedPlayerPreview.statChanges)
                    .slice(0, 6)
                    .map(([stat, range]) => (
                      <div key={stat} className="flex items-center justify-between">
                        <span className="text-vct-gray capitalize">{stat}</span>
                        <span className="text-green-400">
                          +{range.min}-{range.max}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aggregate Summary of All Assigned Players */}
        {trainingPlan.size > 0 && (
          <div className="space-y-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <h4 className="text-xs font-semibold text-blue-400">Training Plan Summary</h4>
            <div className="text-sm text-vct-light">
              {trainingPlan.size} player{trainingPlan.size > 1 ? 's' : ''} assigned
            </div>
            <div className="space-y-1 text-xs">
              {Array.from(trainingPlan.values()).map((assignment) => (
                <div key={assignment.playerId} className="flex items-center justify-between">
                  <span className="text-vct-gray">
                    {TRAINING_GOAL_MAPPINGS[assignment.goal].displayName}
                  </span>
                  <span className="text-vct-light capitalize">{assignment.intensity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Train Button */}
      <div className="p-3 border-t border-vct-gray/20">
        <button
          onClick={onTrain}
          disabled={trainingPlan.size === 0 || isTraining}
          className="w-full py-3 bg-vct-red hover:bg-vct-red/80 disabled:bg-vct-gray/20 disabled:text-vct-gray text-white rounded-lg font-medium transition-colors"
        >
          {isTraining
            ? 'Training...'
            : trainingPlan.size === 0
            ? 'Assign players to train'
            : `Train ${trainingPlan.size} Player${trainingPlan.size > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
