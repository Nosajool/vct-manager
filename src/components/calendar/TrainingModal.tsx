// TrainingModal Component - Single-modal 3-column training layout
// Replaces multi-step wizard with per-player assignment system

import { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '../../store';
import { useFeatureUnlocked } from '../../hooks/useFeatureGate';
import { trainingService } from '../../services';
import { playerDevelopment } from '../../engine/player';
import { TRAINING_GOAL_MAPPINGS } from '../../types/economy';
import type {
  Player,
  TrainingGoal,
  TrainingIntensity,
} from '../../types';
import type { TrainingActivityConfig, TrainingPlayerAssignment } from '../../types/activityPlan';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string; // Optional for backwards compatibility - will be required once all pages are updated
  existingConfig?: TrainingActivityConfig;
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

export function TrainingModal({ isOpen, onClose, eventId, existingConfig }: TrainingModalProps) {
  // State: Training plan (Map of playerId -> assignment with skip support)
  const [trainingPlan, setTrainingPlan] = useState<Map<string, TrainingPlayerAssignment>>(new Map());
  // State: Currently selected player (for editing assignment in middle/right columns)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const players = useGameStore((state) => state.players);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const setActivityConfig = useGameStore((state) => state.setActivityConfig);
  const updateEventLifecycleState = useGameStore((state) => state.updateEventLifecycleState);
  const calendar = useGameStore((state) => state.calendar);
  const autoAssignUnlocked = useFeatureUnlocked('auto_assign');

  // Load existing config when modal opens
  useEffect(() => {
    if (isOpen && existingConfig) {
      const planMap = new Map<string, TrainingPlayerAssignment>();
      existingConfig.assignments.forEach((assignment) => {
        planMap.set(assignment.playerId, assignment);
      });
      setTrainingPlan(planMap);
      // Auto-select first player
      if (existingConfig.assignments.length > 0) {
        setSelectedPlayerId(existingConfig.assignments[0].playerId);
      }
    }
  }, [isOpen, existingConfig]);

  // Get current assignment for selected player (if any)
  const currentAssignment = selectedPlayerId ? trainingPlan.get(selectedPlayerId) : null;

  // Get preview data for selected player (must be before early returns to satisfy Rules of Hooks)
  const selectedPlayerPreview = useMemo(() => {
    if (!selectedPlayerId || !currentAssignment) return null;

    const player = players[selectedPlayerId];
    if (!player) return null;

    // If player is set to skip, show skip preview
    if (currentAssignment.action === 'skip') {
      return {
        player,
        isSkipping: true,
        goal: null,
        intensity: null,
        ovrChange: null,
        statChanges: null,
        moraleImpact: { min: 1, max: 2, qualitative: 'Small boost' },
        fatigueRisk: { increase: 0, resultLevel: 'None' },
        shouldOverrideIntensity: false,
        overrideReason: null,
      };
    }

    const { goal, intensity } = currentAssignment;
    if (!goal || !intensity) return null;

    const ovrChange = trainingService.previewOvrChange(selectedPlayerId, goal, intensity);
    const statChanges = trainingService.previewStatChanges(selectedPlayerId, goal, intensity);
    const moraleImpact = trainingService.previewMoraleImpact(intensity);
    const fatigueRisk = trainingService.previewFatigueRisk(intensity);

    // Check if intensity should be auto-overridden
    const shouldOverrideIntensity = player.morale < 50;
    const overrideReason = shouldOverrideIntensity
      ? `Low morale (${player.morale}) - intensity auto-set to Light`
      : null;

    return {
      player,
      isSkipping: false,
      goal,
      intensity,
      ovrChange,
      statChanges,
      moraleImpact,
      fatigueRisk,
      shouldOverrideIntensity,
      overrideReason,
    };
  }, [selectedPlayerId, currentAssignment, players]);

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
          action: 'train',
          goal: recommendedGoal,
          intensity: getRecommendedIntensity(playerId),
        });
        // Auto-select this player for editing
        setSelectedPlayerId(playerId);
      }
    }

    setTrainingPlan(newPlan);
  };

  // Helper: Toggle skip for a player
  const togglePlayerSkip = (playerId: string) => {
    const newPlan = new Map(trainingPlan);
    const existing = newPlan.get(playerId);

    if (!existing) return;

    if (existing.action === 'skip') {
      // Switch from skip to train with recommended settings
      const recommendedGoal = trainingService.getRecommendedGoal(playerId);
      if (recommendedGoal) {
        newPlan.set(playerId, {
          playerId,
          action: 'train',
          goal: recommendedGoal,
          intensity: getRecommendedIntensity(playerId),
        });
      }
    } else {
      // Switch from train to skip
      newPlan.set(playerId, {
        playerId,
        action: 'skip',
      });
    }

    setTrainingPlan(newPlan);
  };

  // Helper: Update goal for selected player
  const updateSelectedGoal = (goal: TrainingGoal) => {
    if (!selectedPlayerId) return;

    const newPlan = new Map(trainingPlan);
    const existing = newPlan.get(selectedPlayerId);

    if (existing && existing.action === 'train') {
      newPlan.set(selectedPlayerId, {
        ...existing,
        action: 'train',
        goal,
        intensity: existing.intensity,
      });
      setTrainingPlan(newPlan);
    }
  };

  // Helper: Update intensity for selected player
  const updateSelectedIntensity = (intensity: TrainingIntensity) => {
    if (!selectedPlayerId) return;

    const newPlan = new Map(trainingPlan);
    const existing = newPlan.get(selectedPlayerId);

    if (existing && existing.action === 'train') {
      newPlan.set(selectedPlayerId, {
        ...existing,
        action: 'train',
        goal: existing.goal,
        intensity,
      });
      setTrainingPlan(newPlan);

      // Save to localStorage for next time
      saveLastUsedIntensity(selectedPlayerId, intensity);
    }
  };

  // Confirm plan - save config to store instead of executing
  const handleConfirmPlan = () => {
    // Backwards compatibility check - eventId is required for plan-confirm workflow
    if (!eventId) {
      console.warn('TrainingModal: eventId is required for plan-confirm workflow');
      return;
    }

    // Validation: all players in plan must have complete config
    const allValid = Array.from(trainingPlan.values()).every((assignment) => {
      if (assignment.action === 'skip') return true;
      return assignment.goal !== undefined && assignment.intensity !== undefined;
    });

    if (!allValid) {
      // Should not happen due to UI constraints, but safety check
      return;
    }

    // Get the event to extract the date
    const event = calendar.scheduledEvents.find((e) => e.id === eventId);
    if (!event) {
      console.error('Event not found:', eventId);
      return;
    }

    // Create config object
    const config: TrainingActivityConfig = {
      type: 'training',
      id: existingConfig?.id ?? crypto.randomUUID(), // Reuse existing ID or generate new one
      date: event.date,
      eventId,
      status: 'configured',
      assignments: Array.from(trainingPlan.values()),
      autoConfigured: false, // User manually configured
    };

    // Save to store
    setActivityConfig(config);

    // Update event lifecycle state to 'configured'
    updateEventLifecycleState(eventId, 'configured');

    // Close modal
    handleClose();
  };

  // Reset and close
  const handleClose = () => {
    setTrainingPlan(new Map());
    setSelectedPlayerId(null);
    onClose();
  };

  // Auto-assign optimal training for starting 5
  const handleAutoAssign = () => {
    const autoAssignedPlan = trainingService.autoAssignTraining();

    if (autoAssignedPlan.size === 0) {
      // No players available to auto-assign (all at limit or team not found)
      return;
    }

    // Convert to TrainingPlayerAssignment format
    const newPlan = new Map<string, TrainingPlayerAssignment>();
    autoAssignedPlan.forEach((assignment, playerId) => {
      newPlan.set(playerId, {
        playerId,
        action: 'train',
        goal: assignment.goal,
        intensity: assignment.intensity,
      });
    });

    // Update the training plan
    setTrainingPlan(newPlan);

    // Auto-select the first player for viewing/editing
    const firstPlayerId = Array.from(newPlan.keys())[0];
    if (firstPlayerId) {
      setSelectedPlayerId(firstPlayerId);
    }
  };


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

        {/* Auto-Assign Button */}
        <div className="p-4 border-b border-vct-gray/20 flex-shrink-0">
          <button
            onClick={autoAssignUnlocked ? handleAutoAssign : undefined}
            disabled={!autoAssignUnlocked}
            className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              autoAssignUnlocked
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-vct-gray/20 opacity-60 cursor-not-allowed text-vct-gray'
            }`}
            title={autoAssignUnlocked ? 'Starting 5 assigned with role-based recommendations at safe intensity' : 'Unlocks Week 3'}
          >
            <span className="text-lg">🎯</span>
            <span>Auto-Assign Optimal Training</span>
            {!autoAssignUnlocked && (
              <span className="text-xs text-vct-gray/60 ml-2">Unlocks Week 3</span>
            )}
          </button>
          <p className="text-xs text-vct-gray mt-2 text-center">
            Assigns recommended training goals to Starting 5 at safe intensity
          </p>
        </div>

        {/* 3-Column Training Configuration View */}
        <div className="flex-1 overflow-hidden grid grid-cols-[280px_1fr_320px] gap-4 p-4">
          {/* LEFT COLUMN: Player List */}
          <PlayerListColumn
            startingPlayers={startingPlayers}
            benchPlayers={benchPlayers}
            trainingPlan={trainingPlan}
            selectedPlayerId={selectedPlayerId}
            onTogglePlayer={togglePlayerAssignment}
            onToggleSkip={togglePlayerSkip}
          />

          {/* MIDDLE COLUMN: Goal Selector */}
          <GoalSelectorColumn
            selectedPlayer={selectedPlayerId ? players[selectedPlayerId] : null}
            currentGoal={currentAssignment?.action === 'train' ? currentAssignment.goal : null}
            onSelectGoal={updateSelectedGoal}
            isSkipping={currentAssignment?.action === 'skip'}
          />

          {/* RIGHT COLUMN: Intensity & Preview */}
          <IntensityPreviewColumn
            selectedPlayerPreview={selectedPlayerPreview}
            currentIntensity={currentAssignment?.action === 'train' ? currentAssignment.intensity : 'moderate'}
            onSelectIntensity={updateSelectedIntensity}
            trainingPlan={trainingPlan}
            onConfirmPlan={handleConfirmPlan}
            eventId={eventId}
          />
        </div>
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
  trainingPlan: Map<string, TrainingPlayerAssignment>;
  selectedPlayerId: string | null;
  onTogglePlayer: (playerId: string) => void;
  onToggleSkip: (playerId: string) => void;
}

function PlayerListColumn({
  startingPlayers,
  benchPlayers,
  trainingPlan,
  selectedPlayerId,
  onTogglePlayer,
  onToggleSkip,
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
              onToggle={() => onTogglePlayer(player.id)}
              onToggleSkip={() => onToggleSkip(player.id)}
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
                  onToggle={() => onTogglePlayer(player.id)}
                  onToggleSkip={() => onToggleSkip(player.id)}
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
  assignment: TrainingPlayerAssignment | null;
  onToggle: () => void;
  onToggleSkip: () => void;
  onClickRecommendation: () => void;
}

function PlayerListItem({
  player,
  isSelected,
  isAssigned,
  assignment,
  onToggle,
  onToggleSkip,
  onClickRecommendation,
}: PlayerListItemProps) {
  const ovr = playerDevelopment.calculateOverall(player.stats);

  // Get recommended goal for display
  const recommendedGoal = trainingService.getRecommendedGoal(player.id);
  const recommendedGoalInfo = recommendedGoal ? TRAINING_GOAL_MAPPINGS[recommendedGoal] : null;

  // Check if player is set to skip
  const isSkipping = assignment?.action === 'skip';

  // Get effectiveness for current assignment (or recommended if not assigned)
  const effectivenessIntensity = assignment?.action === 'train' ? assignment.intensity : 'moderate';
  const effectiveness = !isSkipping ? trainingService.previewTrainingEffectiveness(player.id, effectivenessIntensity ?? 'moderate') : null;

  // Extract role from recommended goal (e.g., "Entry" from "Entry Fragging Mastery")
  const roleLabel = recommendedGoalInfo?.displayName.split(' ')[0] ?? 'N/A';

  return (
    <div
      className={`
        p-2 rounded transition-colors border
        ${isSelected ? 'bg-vct-red/20 border-vct-red' : 'border-transparent'}
      `}
    >
      {/* Main row: checkbox + name/age/ovr */}
      <div
        className="flex items-start gap-2 cursor-pointer"
        onClick={onToggle}
      >
        <div className="pt-0.5">
          <input
            type="checkbox"
            checked={isAssigned}
            onChange={(e) => {
              e.stopPropagation();
              onToggle();
            }}
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

          {/* Role badge */}
          <div className="flex items-center gap-2 mb-1 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 flex-shrink-0">
              {roleLabel}
            </span>
          </div>

          {/* Skip status or effectiveness % */}
          {isAssigned && isSkipping && (
            <div className="text-xs mb-1">
              <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400">
                Skipping (Rest)
              </span>
            </div>
          )}

          {isAssigned && !isSkipping && assignment && effectiveness !== null && (
            <div className="text-xs mb-1">
              <span className="text-vct-gray">Effectiveness: </span>
              <span className="text-green-400 font-medium">{effectiveness}%</span>
            </div>
          )}

          {/* Skip toggle button (if assigned) */}
          {isAssigned && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSkip();
              }}
              className="text-xs px-2 py-1 rounded bg-vct-gray/10 text-vct-gray hover:bg-vct-gray/20 transition-colors border border-vct-gray/30 w-full text-center mb-1"
            >
              {isSkipping ? 'Resume Training' : 'Skip (Rest)'}
            </button>
          )}

          {/* Clickable recommendation chip */}
          {!isAssigned && recommendedGoalInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClickRecommendation();
              }}
              className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/30 w-full text-left"
            >
              <span className="font-medium">Recommended: </span>
              <span>{recommendedGoalInfo.displayName}</span>
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
  currentGoal: TrainingGoal | null | undefined;
  onSelectGoal: (goal: TrainingGoal) => void;
  isSkipping?: boolean;
}

function GoalSelectorColumn({
  selectedPlayer,
  currentGoal,
  onSelectGoal,
  isSkipping,
}: GoalSelectorColumnProps) {
  const allGoals = trainingService.getAllGoals();

  if (!selectedPlayer) {
    return (
      <div className="flex flex-col h-full bg-vct-dark rounded-lg border border-vct-gray/20 items-center justify-center">
        <p className="text-vct-gray text-sm">Select a player to assign training</p>
      </div>
    );
  }

  if (isSkipping) {
    return (
      <div className="flex flex-col h-full bg-vct-dark rounded-lg border border-vct-gray/20 items-center justify-center">
        <p className="text-amber-400 text-lg mb-2">😴</p>
        <p className="text-vct-light text-sm font-medium">Player Resting</p>
        <p className="text-vct-gray text-xs mt-2">Training skipped for morale boost</p>
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
    isSkipping?: boolean;
    goal: TrainingGoal | null | undefined;
    intensity: TrainingIntensity | null | undefined;
    ovrChange: { min: number; max: number } | null;
    statChanges: Record<string, { min: number; max: number }> | null;
    moraleImpact: { min: number; max: number; qualitative: string };
    fatigueRisk: { increase: number; resultLevel: string };
    shouldOverrideIntensity: boolean;
    overrideReason: string | null;
  } | null;
  currentIntensity: TrainingIntensity | undefined;
  onSelectIntensity: (intensity: TrainingIntensity) => void;
  trainingPlan: Map<string, TrainingPlayerAssignment>;
  onConfirmPlan: () => void;
  eventId?: string;
}

function IntensityPreviewColumn({
  selectedPlayerPreview,
  currentIntensity,
  onSelectIntensity,
  trainingPlan,
  onConfirmPlan,
  eventId,
}: IntensityPreviewColumnProps) {
  // Calculate aggregate warnings across all assigned players
  const players = useGameStore((state) => state.players);
  const aggregateWarnings = useMemo(() => {
    const warnings: string[] = [];
    let lowMoraleCount = 0;
    let highFatigueCount = 0;

    for (const assignment of trainingPlan.values()) {
      if (assignment.action === 'skip') continue; // Skip warnings for resting players

      const player = players[assignment.playerId];
      if (!player) continue;

      if (player.morale < 50) {
        lowMoraleCount++;
      }

      if (assignment.intensity) {
        const fatigueRisk = trainingService.previewFatigueRisk(assignment.intensity);
        if (fatigueRisk.resultLevel === 'High') {
          highFatigueCount++;
        }
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

            {/* Skip preview */}
            {selectedPlayerPreview.isSkipping ? (
              <div className="space-y-2">
                <div className="text-center py-4">
                  <p className="text-4xl mb-2">😴</p>
                  <p className="text-vct-light font-medium">Player Resting</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-vct-gray">Morale Impact</span>
                  <span className="text-green-400">Small boost (+1-2)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-vct-gray">Stat Changes</span>
                  <span className="text-vct-gray">None</span>
                </div>
              </div>
            ) : (
              <>
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
                          selectedPlayerPreview.fatigueRisk.resultLevel === 'Low' || selectedPlayerPreview.fatigueRisk.resultLevel === 'None'
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
                </div>
              </>
            )}
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
                  {assignment.action === 'skip' ? (
                    <>
                      <span className="text-amber-400">Resting</span>
                      <span className="text-vct-gray">+Morale</span>
                    </>
                  ) : assignment.goal ? (
                    <>
                      <span className="text-vct-gray">
                        {TRAINING_GOAL_MAPPINGS[assignment.goal].displayName}
                      </span>
                      <span className="text-vct-light capitalize">{assignment.intensity}</span>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Plan Button */}
      <div className="p-3 border-t border-vct-gray/20">
        {!eventId && (
          <p className="text-xs text-yellow-400 mb-2 text-center">
            ⚠️ Missing eventId - modal opened in legacy mode
          </p>
        )}
        <button
          onClick={onConfirmPlan}
          disabled={trainingPlan.size === 0 || !eventId}
          className="w-full py-3 bg-vct-red hover:bg-vct-red/80 disabled:bg-vct-gray/20 disabled:text-vct-gray text-white rounded-lg font-medium transition-colors"
        >
          {!eventId
            ? 'Legacy mode (not supported)'
            : trainingPlan.size === 0
            ? 'Assign players first'
            : `Confirm Plan (${trainingPlan.size} player${trainingPlan.size > 1 ? 's' : ''})`}
        </button>
      </div>
    </div>
  );
}
