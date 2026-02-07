// TrainingService - Orchestrates player training
// Connects PlayerDevelopment engine with the Zustand store

import { useGameStore } from '../store';
import { playerDevelopment, PlayerDevelopment } from '../engine/player';
import type { Player, TrainingFocus, TrainingGoal, TrainingIntensity, TrainingResult, TrainingPlan } from '../types';

/**
 * Training session tracking for weekly limits
 */
interface WeeklyTrainingTracker {
  playerId: string;
  weekStart: string; // ISO date of week start
  sessionsUsed: number;
}

/**
 * TrainingService - Handles player training operations
 */
export class TrainingService {
  // In-memory tracking of weekly training sessions
  private weeklyTracker: Map<string, WeeklyTrainingTracker> = new Map();

  /**
   * Maximum training sessions per week per player
   */
  private static readonly MAX_WEEKLY_SESSIONS = 2;

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

    // Check weekly training limit
    const weeklyCheck = this.checkWeeklyLimit(playerId);
    if (!weeklyCheck.canTrain) {
      return { success: false, error: weeklyCheck.reason };
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

    // Track the training session
    this.recordTrainingSession(playerId);

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

    // Check weekly training limit
    const weeklyCheck = this.checkWeeklyLimit(playerId);
    if (!weeklyCheck.canTrain) {
      return { success: false, error: weeklyCheck.reason };
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

    // Track the training session
    this.recordTrainingSession(playerId);

    return { success: true, result };
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
   * Check if a player can train this week
   */
  checkWeeklyLimit(playerId: string): { canTrain: boolean; sessionsUsed: number; reason?: string } {
    const currentDate = useGameStore.getState().calendar.currentDate;
    const weekStart = this.getWeekStart(currentDate);
    const key = `${playerId}-${weekStart}`;

    const tracker = this.weeklyTracker.get(key);
    const sessionsUsed = tracker?.sessionsUsed ?? 0;

    const check = playerDevelopment.canPlayerTrain(
      sessionsUsed,
      TrainingService.MAX_WEEKLY_SESSIONS
    );

    return {
      canTrain: check.canTrain,
      sessionsUsed,
      reason: check.reason,
    };
  }

  /**
   * Get training sessions remaining for a player this week
   */
  getRemainingSessions(playerId: string): number {
    const { sessionsUsed } = this.checkWeeklyLimit(playerId);
    return Math.max(0, TrainingService.MAX_WEEKLY_SESSIONS - sessionsUsed);
  }

  /**
   * Record a training session for weekly tracking
   */
  private recordTrainingSession(playerId: string): void {
    const currentDate = useGameStore.getState().calendar.currentDate;
    const weekStart = this.getWeekStart(currentDate);
    const key = `${playerId}-${weekStart}`;

    const existing = this.weeklyTracker.get(key);
    if (existing) {
      existing.sessionsUsed += 1;
    } else {
      this.weeklyTracker.set(key, {
        playerId,
        weekStart,
        sessionsUsed: 1,
      });
    }
  }

  /**
   * Get the start of the week (Monday) for a date
   */
  private getWeekStart(isoDate: string): string {
    const date = new Date(isoDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().split('T')[0];
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
    const players = this.getTrainablePlayers();
    return players.filter((player) => this.checkWeeklyLimit(player.id).canTrain);
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
   * Reset weekly tracker (called at week start or game load)
   */
  resetWeeklyTracker(): void {
    this.weeklyTracker.clear();
  }

  /**
   * Get summary of training activities for the team
   */
  getTeamTrainingSummary(): {
    totalPlayers: number;
    playersCanTrain: number;
    playersAtLimit: number;
  } {
    const allPlayers = this.getTrainablePlayers();
    const playersCanTrain = this.getPlayersWithTrainingSlotsAvailable();

    return {
      totalPlayers: allPlayers.length,
      playersCanTrain: playersCanTrain.length,
      playersAtLimit: allPlayers.length - playersCanTrain.length,
    };
  }
}

// Export singleton instance
export const trainingService = new TrainingService();
