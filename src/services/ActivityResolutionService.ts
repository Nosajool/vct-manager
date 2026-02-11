// ActivityResolutionService - Resolves configured activities during day advancement
// Part of the scheduled training & scrim planning system

import { useGameStore } from '../store';
import { trainingService } from './TrainingService';
import { scrimService } from './ScrimService';
import type {
  TrainingActivityConfig,
  ScrimActivityConfig,
  ActivityConfig,
  ActivityResolutionResult,
} from '../types/activityPlan';
import type { TrainingResult, ScrimResult } from '../types';

/**
 * ActivityResolutionService - Orchestrates resolution of configured activities
 *
 * This service is called during day advancement to execute planned training
 * and scrim activities. It handles:
 * - Training with per-player assignments (train or skip)
 * - Scrims with configuration or skip
 * - Efficiency modifiers for auto-configured activities (80% efficiency)
 */
export class ActivityResolutionService {
  /**
   * Resolve a training activity configuration
   * Executes training for assigned players and applies skip bonuses for resting players
   *
   * @param config - Training activity configuration
   * @param efficiencyModifier - Multiplier for stat improvements (1.0 normal, 0.8 auto-configured)
   * @returns Array of training results for players who trained
   */
  resolveTrainingConfig(
    config: TrainingActivityConfig,
    efficiencyModifier: number
  ): TrainingResult[] {
    const results: TrainingResult[] = [];

    // Process each player assignment
    for (const assignment of config.assignments) {
      if (assignment.action === 'train') {
        // Validate required fields
        if (!assignment.goal || !assignment.intensity) {
          console.warn(
            `Skipping training for player ${assignment.playerId} - missing goal or intensity`
          );
          continue;
        }

        // Execute training via existing service
        const trainResult = trainingService.trainPlayerWithGoal(
          assignment.playerId,
          assignment.goal,
          assignment.intensity
        );

        if (trainResult.success && trainResult.result) {
          // Scale stat improvements by efficiency modifier
          const scaledResult = { ...trainResult.result };
          scaledResult.statImprovements = this.scaleStatImprovements(
            trainResult.result.statImprovements,
            efficiencyModifier
          );

          results.push(scaledResult);
        } else {
          console.warn(
            `Training failed for player ${assignment.playerId}: ${trainResult.error}`
          );
        }
      } else if (assignment.action === 'skip') {
        // Apply morale boost for resting player
        this.applyRestMoraleBoost(assignment.playerId);
      }
    }

    return results;
  }

  /**
   * Resolve a scrim activity configuration
   * Executes scrim or applies skip morale boost
   *
   * @param config - Scrim activity configuration
   * @param efficiencyModifier - Multiplier for improvements (1.0 normal, 0.8 auto-configured)
   * @returns Scrim result or null if skipped
   */
  resolveScrimConfig(
    config: ScrimActivityConfig,
    efficiencyModifier: number
  ): ScrimResult | null {
    if (config.action === 'skip') {
      // Apply team morale boost for skipping scrim
      this.applyTeamRestMoraleBoost();
      return null;
    }

    // Validate required fields for scrim execution
    if (!config.partnerTeamId || !config.maps || !config.intensity) {
      console.warn('Scrim config missing required fields - skipping');
      this.applyTeamRestMoraleBoost(); // Treat as skip
      return null;
    }

    // Execute scrim via existing service
    // Note: For V1, we call the existing scheduleScrim method
    // Future enhancement (Step 7): use scheduleScrimWithModifier() for proper efficiency scaling
    const scrimResult = scrimService.scheduleScrim({
      partnerTeamId: config.partnerTeamId,
      format: config.maps.length === 1 ? 'single_map' : config.maps.length === 3 ? 'best_of_3' : 'map_rotation',
      focusMaps: config.maps,
      intensity: config.intensity,
    });

    if (!scrimResult.success || !scrimResult.result) {
      console.warn(`Scrim execution failed: ${scrimResult.error}`);
      return null;
    }

    // Scale improvements if efficiency modifier is not 1.0
    if (efficiencyModifier !== 1.0) {
      const scaledResult = { ...scrimResult.result };

      // Scale map improvements
      scaledResult.mapImprovements = this.scaleMapImprovements(
        scrimResult.result.mapImprovements,
        efficiencyModifier
      );

      // Scale chemistry changes
      scaledResult.chemistryChange = Math.round(
        scrimResult.result.chemistryChange * efficiencyModifier
      );

      // Scale pair chemistry changes
      scaledResult.pairChemistryChanges = this.scalePairChemistryChanges(
        scrimResult.result.pairChemistryChanges,
        efficiencyModifier
      );

      // Update efficiency multiplier to reflect the additional scaling
      scaledResult.efficiencyMultiplier = scrimResult.result.efficiencyMultiplier * efficiencyModifier;

      return scaledResult;
    }

    return scrimResult.result;
  }

  /**
   * Resolve all configured activities for the day
   * Orchestrates resolution of training and scrim configs with appropriate efficiency modifiers
   *
   * @param configs - Array of activity configurations to resolve
   * @returns Resolution result with training results, scrim result, and skip flags
   */
  resolveAllActivities(configs: ActivityConfig[]): ActivityResolutionResult {
    const result: ActivityResolutionResult = {
      trainingResults: [],
      scrimResult: null,
      skippedTraining: false,
      skippedScrim: false,
    };

    for (const config of configs) {
      // Determine efficiency modifier (1.0 for user-configured, 0.8 for auto-configured)
      const efficiencyModifier = config.autoConfigured ? 0.8 : 1.0;

      if (config.type === 'training') {
        const allSkipped = config.assignments.every((a) => a.action === 'skip');

        if (allSkipped) {
          result.skippedTraining = true;
        }

        const trainingResults = this.resolveTrainingConfig(config, efficiencyModifier);
        result.trainingResults.push(...trainingResults);
      } else if (config.type === 'scrim') {
        if (config.action === 'skip') {
          result.skippedScrim = true;
        }

        result.scrimResult = this.resolveScrimConfig(config, efficiencyModifier);
      }
    }

    return result;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Scale stat improvements by efficiency modifier
   */
  private scaleStatImprovements(
    improvements: Record<string, number>,
    modifier: number
  ): Record<string, number> {
    const scaled: Record<string, number> = {};

    for (const [stat, value] of Object.entries(improvements)) {
      scaled[stat] = Math.round(value * modifier * 100) / 100; // Round to 2 decimal places
    }

    return scaled;
  }

  /**
   * Scale map improvements by efficiency modifier
   */
  private scaleMapImprovements(
    improvements: Record<string, Record<string, number>>,
    modifier: number
  ): Record<string, Record<string, number>> {
    const scaled: Record<string, Record<string, number>> = {};

    for (const [mapName, attributes] of Object.entries(improvements)) {
      scaled[mapName] = {};
      for (const [attr, value] of Object.entries(attributes)) {
        scaled[mapName][attr] = Math.round(value * modifier * 100) / 100;
      }
    }

    return scaled;
  }

  /**
   * Scale pair chemistry changes by efficiency modifier
   */
  private scalePairChemistryChanges(
    changes: Record<string, Record<string, number>>,
    modifier: number
  ): Record<string, Record<string, number>> {
    const scaled: Record<string, Record<string, number>> = {};

    for (const [player1, pairs] of Object.entries(changes)) {
      scaled[player1] = {};
      for (const [player2, value] of Object.entries(pairs)) {
        scaled[player1][player2] = Math.round(value * modifier);
      }
    }

    return scaled;
  }

  /**
   * Apply morale boost to a resting player
   * Players who skip training get a small morale boost (+1 to +2)
   */
  private applyRestMoraleBoost(playerId: string): void {
    const state = useGameStore.getState();
    const player = state.players[playerId];

    if (!player) {
      console.warn(`Player ${playerId} not found - cannot apply rest morale boost`);
      return;
    }

    // Random morale boost: +1 to +2
    const moraleBoost = Math.floor(Math.random() * 2) + 1;
    const newMorale = Math.min(100, player.morale + moraleBoost);

    state.updatePlayer(playerId, { morale: newMorale });
  }

  /**
   * Apply morale boost to the entire team
   * Used when scrim is skipped
   */
  private applyTeamRestMoraleBoost(): void {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;

    if (!playerTeamId) {
      console.warn('No player team found - cannot apply team rest morale boost');
      return;
    }

    const team = state.teams[playerTeamId];
    if (!team) {
      console.warn('Player team not found - cannot apply team rest morale boost');
      return;
    }

    // Apply small morale boost to all players on the team
    const allPlayerIds = [...team.playerIds, ...team.reservePlayerIds];
    const moraleBoost = Math.floor(Math.random() * 2) + 1; // +1 to +2

    for (const playerId of allPlayerIds) {
      const player = state.players[playerId];
      if (player) {
        const newMorale = Math.min(100, player.morale + moraleBoost);
        state.updatePlayer(playerId, { morale: newMorale });
      }
    }
  }
}

// Export singleton instance
export const activityResolutionService = new ActivityResolutionService();
