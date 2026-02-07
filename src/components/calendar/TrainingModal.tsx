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
  qualifier: string;
  description: string;
}[] = [
  { value: 'light', label: 'Light', qualifier: 'Safe', description: 'Lower improvement, preserves morale' },
  { value: 'moderate', label: 'Moderate', qualifier: 'Balanced', description: 'Balanced improvement and morale impact' },
  { value: 'intense', label: 'Intense', qualifier: 'Risky', description: 'Higher improvement, may decrease morale' },
];

// LocalStorage key for storing last-used intensity per player
const STORAGE_KEY_PREFIX = 'vct-training-intensity-';

// Helper: Get last used intensity for a player from localStorage
function getLastUsedIntensity(playerId: string): TrainingIntensity | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + playerId);
    if (stored === 'light' || stored === 'moderate' || stored === 'intense') {
      return stored;
    }
  } catch (e) {
    // localStorage not available
  }
  return null;
}

// Helper: Save last used intensity for a player to localStorage
function saveLastUsedIntensity(playerId: string, intensity: TrainingIntensity): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + playerId, intensity);
  } catch (e) {
    // localStorage not available
  }
}

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

  // Helper: Get recommended intensity for a player
  const getRecommendedIntensity = (playerId: string): TrainingIntensity => {
    const player = players[playerId];
    if (!player) return 'moderate';

    // Check if we should auto-override to 'light'
    const shouldOverride = player.morale < 50;
    if (shouldOverride) {
      return 'light';
    }

    // Otherwise, use last-used intensity or default to 'moderate'
    return getLastUsedIntensity(playerId) ?? 'moderate';
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
      // Add to plan with recommended goal + recommended intensity
      const recommendedGoal = trainingService.getRecommendedGoal(playerId);
      if (recommendedGoal) {
        newPlan.set(playerId, {
          playerId,
          goal: recommendedGoal,
          intensity: getRecommendedIntensity(playerId),
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

      // Save to localStorage for next time
      saveLastUsedIntensity(selectedPlayerId, intensity);
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

  // Auto-assign optimal training for starting 5
  const handleAutoAssign = () => {
    const autoAssignedPlan = trainingService.autoAssignTraining();

    if (autoAssignedPlan.size === 0) {
      // No players available to auto-assign (all at limit or team not found)
      return;
    }

    // Update the training plan
    setTrainingPlan(autoAssignedPlan);

    // Auto-select the first player for viewing/editing
    const firstPlayerId = Array.from(autoAssignedPlan.keys())[0];
    if (firstPlayerId) {
      setSelectedPlayerId(firstPlayerId);
    }
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
    const fatigueRisk = trainingService.previewFatigueRisk(intensity);
    const trainingStatus = getPlayerTrainingStatus(selectedPlayerId);

    // Check if intensity should be auto-overridden
    const shouldOverrideIntensity = player.morale < 50;
    const overrideReason = shouldOverrideIntensity
      ? `Low morale (${player.morale}) - intensity auto-set to Light`
      : null;

    return {
      player,
      goal,
      intensity,
      ovrChange,
      statChanges,
      moraleImpact,
      fatigueRisk,
      trainingStatus,
      shouldOverrideIntensity,
      overrideReason,
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

        {/* Auto-Assign Button (only shown in configuration view) */}
        {!showResults && (
          <div className="p-4 border-b border-vct-gray/20 flex-shrink-0">
            <button
              onClick={handleAutoAssign}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              title="Starting 5 assigned with role-based recommendations at safe intensity"
            >
              <span className="text-lg">🎯</span>
              <span>Auto-Assign Optimal Training</span>
            </button>
            <p className="text-xs text-vct-gray mt-2 text-center">
              Assigns recommended training goals to Starting 5 at safe intensity
            </p>
          </div>
        )}

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
              assignment={trainingPlan.get(player.id) ?? null}
              trainingStatus={getPlayerTrainingStatus(player.id)}
              onSelect={() => onSelectPlayer(player.id)}
              onToggle={() => onTogglePlayer(player.id)}
              onClickRecommendation={() => onTogglePlayer(player.id)}
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
                  assignment={trainingPlan.get(player.id) ?? null}
                  trainingStatus={getPlayerTrainingStatus(player.id)}
                  onSelect={() => onSelectPlayer(player.id)}
                  onToggle={() => onTogglePlayer(player.id)}
                  onClickRecommendation={() => onTogglePlayer(player.id)}
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
  assignment: { goal: TrainingGoal; intensity: TrainingIntensity; isAutoAssigned: boolean } | null;
  trainingStatus: { canTrain: boolean; sessionsUsed: number };
  onSelect: () => void;
  onToggle: () => void;
  onClickRecommendation: () => void;
}

function PlayerListItem({
  player,
  isSelected,
  isAssigned,
  assignment,
  trainingStatus,
  onSelect,
  onToggle,
  onClickRecommendation,
}: PlayerListItemProps) {
  const ovr = playerDevelopment.calculateOverall(player.stats);
  const canTrain = trainingStatus.canTrain;

  // Get recommended goal for display
  const recommendedGoal = trainingService.getRecommendedGoal(player.id);
  const recommendedGoalInfo = recommendedGoal ? TRAINING_GOAL_MAPPINGS[recommendedGoal] : null;

  // Get effectiveness for current assignment (or recommended if not assigned)
  const effectivenessIntensity = assignment?.intensity ?? 'moderate';
  const effectiveness = trainingService.previewTrainingEffectiveness(player.id, effectivenessIntensity);

  // Extract role from recommended goal (e.g., "Entry" from "Entry Fragging Mastery")
  const roleLabel = recommendedGoalInfo?.displayName.split(' ')[0] ?? 'N/A';

  // Get sessions remaining
  const sessionsRemaining = 2 - trainingStatus.sessionsUsed;

  return (
    <div
      className={`
        p-2 rounded transition-colors border
        ${isSelected ? 'bg-vct-red/20 border-vct-red' : 'border-transparent'}
        ${!canTrain ? 'opacity-50' : ''}
      `}
    >
      {/* Main row: checkbox + name/age/ovr */}
      <div
        className="flex items-start gap-2 cursor-pointer"
        onClick={onSelect}
      >
        <div className="pt-0.5">
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
        </div>

        <div className="flex-1 min-w-0">
          {/* Name, Age, OVR */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-vct-light truncate">{player.name}</span>
            <span className="text-xs text-vct-gray flex-shrink-0">({player.age})</span>
            <span className="text-xs font-medium text-blue-400 flex-shrink-0">OVR {ovr}</span>
          </div>

          {/* Role badge + Sessions remaining */}
          <div className="flex items-center gap-2 mb-1 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 flex-shrink-0">
              {roleLabel}
            </span>
            <span className="text-vct-gray">
              {sessionsRemaining === 0 ? (
                <span className="text-red-400">No sessions left</span>
              ) : (
                `${sessionsRemaining} session${sessionsRemaining > 1 ? 's' : ''} left`
              )}
            </span>
          </div>

          {/* Effectiveness % (if assigned) */}
          {isAssigned && assignment && effectiveness !== null && (
            <div className="text-xs mb-1">
              <span className="text-vct-gray">Effectiveness: </span>
              <span className="text-green-400 font-medium">{effectiveness}%</span>
              {assignment.isAutoAssigned ? (
                <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400" title="Auto-assigned">
                  auto
                </span>
              ) : (
                <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400" title="Custom assignment">
                  custom
                </span>
              )}
            </div>
          )}

          {/* Clickable recommendation chip */}
          {!isAssigned && recommendedGoalInfo && effectiveness !== null && canTrain && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClickRecommendation();
              }}
              className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/30 w-full text-left"
            >
              <span className="font-medium">Recommended: </span>
              <span>{recommendedGoalInfo.displayName} ({effectiveness}%)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================
   GOAL SELECTOR COLUMN
   ======================================== */

// Icon mapping for each training goal
const GOAL_ICONS: Record<TrainingGoal, string> = {
  role_mastery_entry: '🎯',
  role_mastery_lurk: '🕵️',
  role_mastery_support: '🛡️',
  mechanical_ceiling: '⚙️',
  decision_making: '🧠',
  leadership_comms: '📢',
  all_round_growth: '🌟',
};

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
                <div className="flex items-center gap-2">
                  <span className="text-lg">{GOAL_ICONS[goal]}</span>
                  <span className="font-medium text-vct-light text-sm">
                    {goalInfo.displayName}
                  </span>
                </div>
                {isRecommended && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded flex-shrink-0">
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
    fatigueRisk: { increase: number; resultLevel: string };
    trainingStatus: { canTrain: boolean; sessionsUsed: number };
    shouldOverrideIntensity: boolean;
    overrideReason: string | null;
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
  // Calculate aggregate warnings across all assigned players
  const players = useGameStore((state) => state.players);
  const aggregateWarnings = useMemo(() => {
    const warnings: string[] = [];
    let lowMoraleCount = 0;
    let highFatigueCount = 0;

    for (const assignment of trainingPlan.values()) {
      const player = players[assignment.playerId];
      if (!player) continue;

      if (player.morale < 50) {
        lowMoraleCount++;
      }

      const fatigueRisk = trainingService.previewFatigueRisk(assignment.intensity);
      if (fatigueRisk.resultLevel === 'High') {
        highFatigueCount++;
      }
    }

    if (lowMoraleCount > 0) {
      warnings.push(`${lowMoraleCount} player${lowMoraleCount > 1 ? 's' : ''} with low morale`);
    }
    if (highFatigueCount > 0) {
      warnings.push(`${highFatigueCount} player${highFatigueCount > 1 ? 's' : ''} at high fatigue risk`);
    }

    return warnings;
  }, [trainingPlan, players]);

  return (
    <div className="flex flex-col h-full bg-vct-dark rounded-lg border border-vct-gray/20 overflow-hidden">
      <div className="p-3 border-b border-vct-gray/20">
        <h3 className="text-sm font-semibold text-vct-gray">Intensity & Preview</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Auto-override warning */}
        {selectedPlayerPreview?.overrideReason && (
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-400 flex items-start gap-2">
              <span>⚠️</span>
              <span>{selectedPlayerPreview.overrideReason}</span>
            </p>
          </div>
        )}

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
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{option.label}</p>
                  <span className="text-xs px-2 py-0.5 rounded bg-vct-gray/20">
                    {option.qualifier}
                  </span>
                </div>
                <p className="text-xs opacity-80">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview for Selected Player */}
        {selectedPlayerPreview && (
          <div className="space-y-3 p-3 bg-vct-darker rounded-lg border border-vct-gray/20">
            <h4 className="text-xs font-semibold text-vct-gray">Consequence Preview</h4>

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

            {/* Morale Impact */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-vct-gray">Morale Impact</span>
              <div className="flex items-center gap-2">
                <span
                  className={
                    selectedPlayerPreview.moraleImpact.min >= 0
                      ? 'text-green-400'
                      : selectedPlayerPreview.moraleImpact.max <= -2
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }
                >
                  {selectedPlayerPreview.moraleImpact.qualitative}
                </span>
                {selectedPlayerPreview.player.morale < 50 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                    ⚠
                  </span>
                )}
              </div>
            </div>

            {/* Fatigue Risk */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-vct-gray">Fatigue Risk</span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      selectedPlayerPreview.fatigueRisk.resultLevel === 'Low'
                        ? 'text-green-400'
                        : selectedPlayerPreview.fatigueRisk.resultLevel === 'Moderate'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }
                  >
                    {selectedPlayerPreview.fatigueRisk.resultLevel}
                  </span>
                  {selectedPlayerPreview.fatigueRisk.resultLevel === 'High' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                      ⚠
                    </span>
                  )}
                </div>
              </div>
              {/* Current training sessions indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-vct-gray">
                  Sessions used: {selectedPlayerPreview.trainingStatus.sessionsUsed}/2
                </span>
                <div className="flex-1 h-1.5 bg-vct-gray/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      selectedPlayerPreview.trainingStatus.sessionsUsed >= 2
                        ? 'bg-red-500'
                        : selectedPlayerPreview.trainingStatus.sessionsUsed >= 1
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${(selectedPlayerPreview.trainingStatus.sessionsUsed / 2) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aggregate Summary of All Assigned Players */}
        {trainingPlan.size > 0 && (
          <div className="space-y-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <h4 className="text-xs font-semibold text-blue-400">Training Plan Summary</h4>
            <div className="text-sm text-vct-light">
              Training {trainingPlan.size} player{trainingPlan.size > 1 ? 's' : ''}
            </div>

            {/* Warnings */}
            {aggregateWarnings.length > 0 && (
              <div className="space-y-1">
                {aggregateWarnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <span>⚠️</span>
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Assignment list */}
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
