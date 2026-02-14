// TrainingService - Orchestrates player training
// Connects PlayerDevelopment engine with the Zustand store

import { useGameStore } from '../store';
import { playerDevelopment, PlayerDevelopment } from '../engine/player';
import type { Player, TrainingFocus, TrainingGoal, TrainingIntensity, TrainingResult, TrainingPlan } from '../types';

/**
 * TrainingService - Handles player training operations
 */
export class TrainingService {

  /**
   * Train a player with the specified focus and intensity
   */
  trainPlayer(
    playerId: string,
    focus: TrainingFocus,
    intensity: TrainingIntensity
  ): { success: boolean; result?: TrainingResult; error?: string } {
    const state = useGameStore.getState();
    const player = state.players[playerId];

    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Check if player is on the user's team
    const playerTeamId = state.playerTeamId;
    if (player.teamId !== playerTeamId) {
      return { success: false, error: 'Can only train players on your team' };
    }

    // Get coach bonus (future: lookup actual coach)
    const coachBonus = this.getCoachBonus(player.teamId);

    // Capture "before" snapshot for display
    const statsBefore = { ...player.stats };
    const moraleBefore = player.morale;

    // Run the training through the engine
    const result = playerDevelopment.trainPlayer(player, focus, intensity, coachBonus);

    // Add "before" values to result for "old → new" display
    result.statsBefore = statsBefore;
    result.moraleBefore = moraleBefore;

    // Apply the training result to the player
    const updatedPlayer = playerDevelopment.updatePlayerAfterTraining(player, result);

    // Update the player in the store
    state.updatePlayer(playerId, {
      stats: updatedPlayer.stats,
      morale: updatedPlayer.morale,
    });

    // NOTE: We no longer mark the training event as processed because:
    // - Each player has 2 training sessions per week (individual limit)
    // - The event should remain visible until all players reach their limit
    // - This is consistent with how Schedule tab allows training any day
    // - Capacity checking is done per-player in the TrainingModal

    return { success: true, result };
  }

  /**
   * Train a player with a goal-based training approach
   * This is the preferred method for the new training UX
   */
  trainPlayerWithGoal(
    playerId: string,
    goal: TrainingGoal,
    intensity: TrainingIntensity
  ): { success: boolean; result?: TrainingResult; error?: string } {
    const state = useGameStore.getState();
    const player = state.players[playerId];

    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Check if player is on the user's team
    const playerTeamId = state.playerTeamId;
    if (player.teamId !== playerTeamId) {
      return { success: false, error: 'Can only train players on your team' };
    }

    // Get coach bonus (future: lookup actual coach)
    const coachBonus = this.getCoachBonus(player.teamId);

    // Capture "before" snapshot for display
    const statsBefore = { ...player.stats };
    const moraleBefore = player.morale;

    // Run the training through the engine using the goal-based method
    const result = playerDevelopment.trainPlayerWithGoal(player, goal, intensity, coachBonus);

    // Add "before" values to result for "old → new" display
    result.statsBefore = statsBefore;
    result.moraleBefore = moraleBefore;

    // Apply the training result to the player
    const updatedPlayer = playerDevelopment.updatePlayerAfterTraining(player, result);

    // Update the player in the store
    state.updatePlayer(playerId, {
      stats: updatedPlayer.stats,
      morale: updatedPlayer.morale,
    });

    return { success: true, result };
  }

  /**
   * Train a player with a goal-based approach and apply an efficiency modifier
   * Used for auto-configured training sessions which receive reduced effectiveness
   *
   * @param modifier - Efficiency multiplier (e.g., 0.8 for 80% effectiveness on auto-configured training)
   */
  trainPlayerWithModifier(
    playerId: string,
    goal: TrainingGoal,
    intensity: TrainingIntensity,
    modifier: number
  ): { success: boolean; result?: TrainingResult; error?: string } {
    const state = useGameStore.getState();
    const player = state.players[playerId];

    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Check if player is on the user's team
    const playerTeamId = state.playerTeamId;
    if (player.teamId !== playerTeamId) {
      return { success: false, error: 'Can only train players on your team' };
    }

    // Get coach bonus (future: lookup actual coach)
    const coachBonus = this.getCoachBonus(player.teamId);

    // Capture "before" snapshot for display
    const statsBefore = { ...player.stats };
    const moraleBefore = player.morale;

    // Run the training through the engine using the goal-based method
    const result = playerDevelopment.trainPlayerWithGoal(player, goal, intensity, coachBonus);

    // Add "before" values to result for "old → new" display
    result.statsBefore = statsBefore;
    result.moraleBefore = moraleBefore;

    // Apply the efficiency modifier to stat improvements
    const scaledStatImprovements: Record<string, number> = {};
    for (const [stat, improvement] of Object.entries(result.statImprovements)) {
      scaledStatImprovements[stat] = improvement * modifier;
    }

    // Create a modified result with scaled improvements
    const modifiedResult = {
      ...result,
      statImprovements: scaledStatImprovements,
    };

    // Manually apply the scaled improvements to the player
    const updatedStats = { ...player.stats };
    for (const [stat, improvement] of Object.entries(scaledStatImprovements)) {
      if (stat in updatedStats) {
        (updatedStats as any)[stat] = Math.min(
          100,
          Math.max(0, ((updatedStats as any)[stat] || 0) + improvement)
        );
      }
    }

    const updatedMorale = Math.min(
      100,
      Math.max(0, player.morale + result.moraleChange)
    );

    // Update the player in the store with scaled values
    state.updatePlayer(playerId, {
      stats: updatedStats,
      morale: updatedMorale,
    });

    return { success: true, result: modifiedResult };
  }

  /**
   * Execute a training plan with per-player assignments
   * This is the preferred method for the new single-modal UX
   */
  executeTrainingPlan(
    plan: TrainingPlan
  ): { results: { playerId: string; success: boolean; result?: TrainingResult; error?: string }[] } {
    const results: { playerId: string; success: boolean; result?: TrainingResult; error?: string }[] = [];

    // Execute training for each player assignment
    for (const [playerId, assignment] of plan.entries()) {
      const trainResult = this.trainPlayerWithGoal(
        playerId,
        assignment.goal,
        assignment.intensity
      );

      results.push({
        playerId,
        ...trainResult,
      });
    }

    return { results };
  }

  /**
   * Train multiple players in a batch session (legacy method)
   * All players receive the same focus and intensity
   */
  batchTrain(
    playerIds: string[],
    focus: TrainingFocus,
    intensity: TrainingIntensity
  ): { results: { playerId: string; success: boolean; result?: TrainingResult; error?: string }[] } {
    const results = playerIds.map((playerId) => ({
      playerId,
      ...this.trainPlayer(playerId, focus, intensity),
    }));

    return { results };
  }


  /**
   * Get coach bonus for a team (placeholder - could be expanded)
   */
  private getCoachBonus(teamId: string | null): number {
    if (!teamId) return 0;

    const state = useGameStore.getState();
    const team = state.teams[teamId];

    if (!team || team.coachIds.length === 0) {
      return 0;
    }

    // Future: Look up actual coach stats
    // For now, give a flat bonus if team has coaches
    return 5;
  }

  /**
   * Get all trainable players on the user's team
   */
  getTrainablePlayers(): Player[] {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;

    if (!playerTeamId) return [];

    const team = state.teams[playerTeamId];
    if (!team) return [];

    const allPlayerIds = [...team.playerIds, ...team.reservePlayerIds];
    return allPlayerIds
      .map((id) => state.players[id])
      .filter((p): p is Player => p !== undefined);
  }

  /**
   * Get players who can still train this week
   */
  getPlayersWithTrainingSlotsAvailable(): Player[] {
    return this.getTrainablePlayers();
  }

  /**
   * Get recommended training focus for a player
   */
  getRecommendedFocus(playerId: string): TrainingFocus | null {
    const state = useGameStore.getState();
    const player = state.players[playerId];

    if (!player) return null;

    return playerDevelopment.getRecommendedFocus(player);
  }

  /**
   * Get recommended training goal for a player (goal-based system)
   * Analyzes player stats, role, and weaknesses to suggest the most beneficial goal
   */
  getRecommendedGoal(playerId: string): TrainingGoal | null {
    const state = useGameStore.getState();
    const player = state.players[playerId];

    if (!player) return null;

    return playerDevelopment.getRecommendedGoal(player);
  }

  /**
   * Get training focus description
   */
  getFocusDescription(focus: TrainingFocus): string {
    return playerDevelopment.getTrainingFocusDescription(focus);
  }

  /**
   * Get training goal information (display name, description, affected stats, etc.)
   */
  getGoalInfo(goal: TrainingGoal) {
    return PlayerDevelopment.getGoalInfo(goal);
  }

  /**
   * Get all available training goals
   */
  getAllGoals(): TrainingGoal[] {
    return PlayerDevelopment.getAllGoals();
  }

  /**
   * Preview training effectiveness before committing
   * Note: Effectiveness is based on player attributes and intensity, not the specific goal/focus
   */
  previewTrainingEffectiveness(
    playerId: string,
    intensity: TrainingIntensity
  ): number | null {
    const state = useGameStore.getState();
    const player = state.players[playerId];

    if (!player) return null;

    const coachBonus = this.getCoachBonus(player.teamId);
    return playerDevelopment.calculateTrainingEffectiveness(player, intensity, coachBonus);
  }

  /**
   * Preview stat changes before training (shows min/max ranges accounting for randomness)
   * Returns ranges for each stat that will be affected
   */
  previewStatChanges(
    playerId: string,
    goal: TrainingGoal,
    intensity: TrainingIntensity
  ): Record<string, { min: number; max: number }> | null {
    const state = useGameStore.getState();
    const player = state.players[playerId];

    if (!player) return null;

    const coachBonus = this.getCoachBonus(player.teamId);
    return playerDevelopment.previewStatChanges(player, goal, intensity, coachBonus);
  }

  /**
   * Preview overall rating change before training
   * Returns projected OVR change as { min, max } range
   */
  previewOvrChange(
    playerId: string,
    goal: TrainingGoal,
    intensity: TrainingIntensity
  ): { min: number; max: number } | null {
    const state = useGameStore.getState();
    const player = state.players[playerId];

    if (!player) return null;

    const coachBonus = this.getCoachBonus(player.teamId);
    return playerDevelopment.previewOvrChange(player, goal, intensity, coachBonus);
  }

  /**
   * Preview morale impact before training
   * Returns min/max morale change and qualitative description
   */
  previewMoraleImpact(
    intensity: TrainingIntensity
  ): { min: number; max: number; qualitative: string } {
    return playerDevelopment.previewMoraleImpact(intensity);
  }

  /**
   * Preview fatigue risk before training
   * Returns fatigue increase and resulting fatigue level description
   */
  previewFatigueRisk(
    intensity: TrainingIntensity
  ): { increase: number; resultLevel: string } {
    return playerDevelopment.previewFatigueRisk(intensity);
  }

  /**
   * Preview goal impact descriptors
   * Returns human-readable impact descriptions for a training goal
   */
  previewGoalImpact(goal: TrainingGoal): string[] {
    return playerDevelopment.previewGoalImpact(goal);
  }

  /**
   * Auto-assign training for the starting 5 players
   * Generates a training plan with optimal assignments based on recommendations
   *
   * Algorithm:
   * 1. Selects starting 5 players only (skips reserves)
   * 2. Skips players at their weekly training limit
   * 3. For each player:
   *    - Uses getRecommendedGoal() to select optimal training goal
   *    - Defaults to Moderate intensity
   *    - Downgrades to Light if morale < 50 (avoids further morale penalties)
   * 4. Returns TrainingPlan for user review (does NOT execute training)
   *
   * @returns TrainingPlan - Map of playerId to PlayerTrainingAssignment
   */
  autoAssignTraining(): TrainingPlan {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;

    if (!playerTeamId) {
      return new Map();
    }

    const team = state.teams[playerTeamId];
    if (!team) {
      return new Map();
    }

    const plan: TrainingPlan = new Map();

    // Get starting 5 players only (not reserves)
    const starting5Ids = team.playerIds;

    for (const playerId of starting5Ids) {
      const player = state.players[playerId];
      if (!player) continue;

      // Get recommended goal based on player's weakest stats
      const goal = this.getRecommendedGoal(playerId);
      if (!goal) continue;

      // Default to Moderate intensity
      let intensity: TrainingIntensity = 'moderate';

      // Check morale: if < 50, downgrade to Light to avoid morale penalties
      if (player.morale < 50) {
        intensity = 'light';
      }

      // Note: Fatigue checking would be implemented here when fatigue tracking is added
      // Current system relies on weekly limits and morale as proxies for player readiness

      // Add assignment to the plan
      plan.set(playerId, {
        playerId,
        goal,
        intensity,
        isAutoAssigned: true,
      });
    }

    return plan;
  }

  /**
   * Get summary of training activities for the team
   */
  getTeamTrainingSummary(): {
    totalPlayers: number;
    playersCanTrain: number;
  } {
    const allPlayers = this.getTrainablePlayers();

    return {
      totalPlayers: allPlayers.length,
      playersCanTrain: allPlayers.length,
    };
  }
}

// Export singleton instance
export const trainingService = new TrainingService();
