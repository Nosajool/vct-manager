// PlayerDevelopment - Pure engine class for player training and development
// No React or store dependencies - pure functions only

import type {
  Player,
  PlayerStats,
  TrainingFocus,
  TrainingGoal,
  TrainingIntensity,
  TrainingResult
} from '../../types';
import { TRAINING_GOAL_MAPPINGS } from '../../types/economy';

/**
 * Stat mapping for focused training
 */
interface TrainingStatMapping {
  primary: (keyof PlayerStats)[]; // Stats that get full boost
  secondary: (keyof PlayerStats)[]; // Stats that get partial boost
}

/**
 * PlayerDevelopment - Handles player training and stat growth
 */
export class PlayerDevelopment {
  // Stat mapping for each training focus
  private static readonly TRAINING_FOCUS_MAP: Record<TrainingFocus, TrainingStatMapping> = {
    mechanics: {
      primary: ['mechanics'],
      secondary: ['clutch', 'entry'],
    },
    igl: {
      primary: ['igl'],
      secondary: ['mental', 'support'],
    },
    mental: {
      primary: ['mental'],
      secondary: ['clutch', 'vibes'],
    },
    clutch: {
      primary: ['clutch'],
      secondary: ['mental', 'mechanics'],
    },
    lurking: {
      primary: ['lurking'],
      secondary: ['mental', 'clutch'],
    },
    entry: {
      primary: ['entry'],
      secondary: ['mechanics', 'stamina'],
    },
    support: {
      primary: ['support'],
      secondary: ['igl', 'vibes'],
    },
    agents: {
      primary: ['support', 'igl'],
      secondary: ['mental'],
    },
    balanced: {
      primary: [],
      secondary: ['mechanics', 'igl', 'mental', 'clutch', 'vibes', 'lurking', 'entry', 'support', 'stamina'],
    },
  };

  // Intensity multipliers
  private static readonly INTENSITY_MULTIPLIERS: Record<TrainingIntensity, number> = {
    light: 0.6,
    moderate: 1.0,
    intense: 1.5,
  };

  // Morale impact from training intensity
  private static readonly INTENSITY_MORALE_IMPACT: Record<TrainingIntensity, { min: number; max: number }> = {
    light: { min: 0, max: 2 }, // Small boost
    moderate: { min: -1, max: 1 }, // Neutral
    intense: { min: -3, max: 0 }, // Can be draining
  };

  /**
   * Convert a TrainingGoal to its underlying TrainingFocus
   * Enables backward compatibility with existing training system
   */
  static goalToFocus(goal: TrainingGoal): TrainingFocus {
    return TRAINING_GOAL_MAPPINGS[goal].underlyingFocus;
  }

  /**
   * Get training goal information
   */
  static getGoalInfo(goal: TrainingGoal) {
    return TRAINING_GOAL_MAPPINGS[goal];
  }

  /**
   * Get all available training goals
   */
  static getAllGoals(): TrainingGoal[] {
    return Object.keys(TRAINING_GOAL_MAPPINGS) as TrainingGoal[];
  }

  /**
   * Train a player using a TrainingGoal
   * This delegates to the existing trainPlayer method using the underlying focus
   */
  trainPlayerWithGoal(
    player: Player,
    goal: TrainingGoal,
    intensity: TrainingIntensity,
    coachBonus: number = 0
  ): TrainingResult {
    const focus = PlayerDevelopment.goalToFocus(goal);
    const result = this.trainPlayer(player, focus, intensity, coachBonus);

    // Add the goal to the result for tracking
    return {
      ...result,
      goal,
    };
  }

  /**
   * Get recommended training goal based on player's weakest stats and role
   */
  getRecommendedGoal(player: Player): TrainingGoal {
    const stats = player.stats;

    // Identify weakest area
    const statValues = {
      mechanics: stats.mechanics,
      igl: stats.igl,
      mental: stats.mental,
      clutch: stats.clutch,
      lurking: stats.lurking,
      entry: stats.entry,
      support: stats.support,
    };

    // Find the lowest stat
    const weakestStat = Object.entries(statValues)
      .sort((a, b) => a[1] - b[1])[0][0];

    // Map stat to recommended goal
    const statToGoal: Record<string, TrainingGoal> = {
      mechanics: 'mechanical_ceiling',
      igl: 'leadership_comms',
      mental: 'decision_making',
      clutch: 'decision_making',
      lurking: 'role_mastery_lurk',
      entry: 'role_mastery_entry',
      support: 'role_mastery_support',
    };

    return statToGoal[weakestStat] || 'all_round_growth';
  }

  /**
   * Calculate training effectiveness based on player attributes
   * Returns a value from 0-100
   */
  calculateTrainingEffectiveness(
    player: Player,
    intensity: TrainingIntensity,
    coachBonus: number = 0
  ): number {
    let effectiveness = 50; // Base effectiveness

    // Age factor: Young players (18-22) train better
    if (player.age <= 22) {
      effectiveness += 20;
    } else if (player.age <= 25) {
      effectiveness += 10;
    } else if (player.age >= 28) {
      effectiveness -= 10;
    }

    // Potential factor: Higher potential = better growth
    const potentialDiff = player.potential - this.calculateOverall(player.stats);
    if (potentialDiff > 15) {
      effectiveness += 15;
    } else if (potentialDiff > 10) {
      effectiveness += 10;
    } else if (potentialDiff > 5) {
      effectiveness += 5;
    }

    // Morale factor
    if (player.morale >= 80) {
      effectiveness += 10;
    } else if (player.morale >= 60) {
      effectiveness += 5;
    } else if (player.morale < 40) {
      effectiveness -= 15;
    }

    // Form factor
    if (player.form >= 80) {
      effectiveness += 5;
    } else if (player.form < 50) {
      effectiveness -= 10;
    }

    // Coach bonus (0-20 typically)
    effectiveness += coachBonus;

    // Intensity modifier
    const intensityMod = PlayerDevelopment.INTENSITY_MULTIPLIERS[intensity];
    effectiveness = Math.round(effectiveness * intensityMod);

    // Clamp to 0-100
    return Math.max(0, Math.min(100, effectiveness));
  }

  /**
   * Train a player and return the result
   * This is a pure function - doesn't modify the player
   */
  trainPlayer(
    player: Player,
    focus: TrainingFocus,
    intensity: TrainingIntensity,
    coachBonus: number = 0
  ): TrainingResult {
    const effectiveness = this.calculateTrainingEffectiveness(
      player,
      intensity,
      coachBonus
    );

    const statImprovements: Record<string, number> = {};
    const mapping = PlayerDevelopment.TRAINING_FOCUS_MAP[focus];

    // Calculate stat improvements based on effectiveness
    // Base improvement: 1-3 for primary stats, 0-1 for secondary
    const effectivenessMultiplier = effectiveness / 100;

    // Primary stats get bigger boosts
    for (const stat of mapping.primary) {
      const currentValue = player.stats[stat];
      const improvement = this.calculateStatImprovement(
        currentValue,
        2, // base improvement for primary
        effectivenessMultiplier,
        player.potential
      );
      if (improvement > 0) {
        statImprovements[stat] = improvement;
      }
    }

    // Secondary stats get smaller boosts
    for (const stat of mapping.secondary) {
      const currentValue = player.stats[stat];
      const improvement = this.calculateStatImprovement(
        currentValue,
        1, // base improvement for secondary
        effectivenessMultiplier,
        player.potential
      );
      if (improvement > 0) {
        statImprovements[stat] = improvement;
      }
    }

    // Calculate morale change
    const moraleRange = PlayerDevelopment.INTENSITY_MORALE_IMPACT[intensity];
    const moraleChange = this.randomBetween(moraleRange.min, moraleRange.max);

    // Fatigue increase based on intensity
    const fatigueIncrease = intensity === 'intense' ? 15 : intensity === 'moderate' ? 10 : 5;

    return {
      playerId: player.id,
      focus,
      statImprovements,
      effectiveness,
      moraleChange,
      fatigueIncrease,
      factors: {
        coachBonus,
        playerMorale: player.morale,
        playerAge: player.age,
        playerPotential: player.potential,
      },
    };
  }

  /**
   * Calculate stat improvement with diminishing returns
   */
  private calculateStatImprovement(
    currentValue: number,
    baseImprovement: number,
    effectivenessMultiplier: number,
    potential: number
  ): number {
    // Diminishing returns: harder to improve high stats
    let diminishingFactor = 1.0;
    if (currentValue >= 90) {
      diminishingFactor = 0.1; // Very hard to improve 90+ stats
    } else if (currentValue >= 85) {
      diminishingFactor = 0.3;
    } else if (currentValue >= 80) {
      diminishingFactor = 0.5;
    } else if (currentValue >= 70) {
      diminishingFactor = 0.8;
    }

    // Can't improve beyond potential
    const headroomFactor = currentValue >= potential ? 0 : 1;

    // Calculate final improvement
    const improvement = baseImprovement * effectivenessMultiplier * diminishingFactor * headroomFactor;

    // Add some randomness
    const randomFactor = 0.5 + Math.random(); // 0.5 to 1.5
    const finalImprovement = Math.round(improvement * randomFactor);

    return Math.max(0, finalImprovement);
  }

  /**
   * Apply training result to a player (immutable - returns new player object)
   */
  updatePlayerAfterTraining(player: Player, result: TrainingResult): Player {
    const newStats = { ...player.stats };

    // Apply stat improvements
    for (const [stat, improvement] of Object.entries(result.statImprovements)) {
      const key = stat as keyof PlayerStats;
      newStats[key] = Math.min(99, newStats[key] + improvement);
    }

    // Apply morale change
    const newMorale = Math.max(20, Math.min(100, player.morale + result.moraleChange));

    return {
      ...player,
      stats: newStats,
      morale: newMorale,
    };
  }

  /**
   * Calculate overall rating from stats
   */
  calculateOverall(stats: PlayerStats): number {
    const weights = {
      mechanics: 0.2,
      igl: 0.1,
      mental: 0.1,
      clutch: 0.1,
      vibes: 0.05,
      lurking: 0.1,
      entry: 0.1,
      support: 0.1,
      stamina: 0.15,
    };

    let total = 0;
    for (const [stat, weight] of Object.entries(weights)) {
      total += stats[stat as keyof PlayerStats] * weight;
    }

    return Math.round(total);
  }

  /**
   * Get training focus description
   */
  getTrainingFocusDescription(focus: TrainingFocus): string {
    const descriptions: Record<TrainingFocus, string> = {
      mechanics: 'Aim training and crosshair placement',
      igl: 'Strategy and in-game leadership',
      mental: 'Game sense and decision making',
      clutch: 'Pressure situations and 1vX scenarios',
      lurking: 'Map control and timing',
      entry: 'First contact and site takes',
      support: 'Utility usage and team play',
      agents: 'Agent mastery and flexibility',
      balanced: 'General improvement across all areas',
    };
    return descriptions[focus];
  }

  /**
   * Get recommended training focus based on player's weakest stats
   */
  getRecommendedFocus(player: Player): TrainingFocus {
    const stats = player.stats;
    const entries: [keyof PlayerStats, number][] = [
      ['mechanics', stats.mechanics],
      ['igl', stats.igl],
      ['mental', stats.mental],
      ['clutch', stats.clutch],
      ['lurking', stats.lurking],
      ['entry', stats.entry],
      ['support', stats.support],
    ];

    // Sort by value ascending (lowest first)
    entries.sort((a, b) => a[1] - b[1]);

    // Map stat to training focus
    const statToFocus: Record<string, TrainingFocus> = {
      mechanics: 'mechanics',
      igl: 'igl',
      mental: 'mental',
      clutch: 'clutch',
      lurking: 'lurking',
      entry: 'entry',
      support: 'support',
    };

    return statToFocus[entries[0][0]] || 'balanced';
  }

  /**
   * Check if player can train (not injured, has remaining weekly sessions)
   */
  canPlayerTrain(
    weeklySessionsUsed: number,
    maxWeeklySessions: number = 2
  ): { canTrain: boolean; reason?: string } {
    if (weeklySessionsUsed >= maxWeeklySessions) {
      return {
        canTrain: false,
        reason: `Player has already trained ${weeklySessionsUsed} times this week (max ${maxWeeklySessions})`,
      };
    }

    return { canTrain: true };
  }

  /**
   * Preview stat changes before training (shows min/max ranges accounting for randomness)
   * Returns ranges for each stat that will be affected
   */
  previewStatChanges(
    player: Player,
    goal: TrainingGoal,
    intensity: TrainingIntensity,
    coachBonus: number = 0
  ): Record<string, { min: number; max: number }> {
    const focus = PlayerDevelopment.goalToFocus(goal);
    const mapping = PlayerDevelopment.TRAINING_FOCUS_MAP[focus];
    const effectiveness = this.calculateTrainingEffectiveness(player, intensity, coachBonus);
    const effectivenessMultiplier = effectiveness / 100;

    const ranges: Record<string, { min: number; max: number }> = {};

    // Calculate ranges for primary stats
    for (const stat of mapping.primary) {
      const currentValue = player.stats[stat];
      const baseImprovement = 2; // base improvement for primary

      // Calculate with min randomness (0.5x)
      const minImprovement = this.calculateStatImprovementDeterministic(
        currentValue,
        baseImprovement,
        effectivenessMultiplier,
        player.potential,
        0.5
      );

      // Calculate with max randomness (1.5x)
      const maxImprovement = this.calculateStatImprovementDeterministic(
        currentValue,
        baseImprovement,
        effectivenessMultiplier,
        player.potential,
        1.5
      );

      if (maxImprovement > 0) {
        ranges[stat] = { min: minImprovement, max: maxImprovement };
      }
    }

    // Calculate ranges for secondary stats
    for (const stat of mapping.secondary) {
      const currentValue = player.stats[stat];
      const baseImprovement = 1; // base improvement for secondary

      // Calculate with min randomness (0.5x)
      const minImprovement = this.calculateStatImprovementDeterministic(
        currentValue,
        baseImprovement,
        effectivenessMultiplier,
        player.potential,
        0.5
      );

      // Calculate with max randomness (1.5x)
      const maxImprovement = this.calculateStatImprovementDeterministic(
        currentValue,
        baseImprovement,
        effectivenessMultiplier,
        player.potential,
        1.5
      );

      if (maxImprovement > 0) {
        ranges[stat] = { min: minImprovement, max: maxImprovement };
      }
    }

    return ranges;
  }

  /**
   * Preview overall rating change before training
   */
  previewOvrChange(
    player: Player,
    goal: TrainingGoal,
    intensity: TrainingIntensity,
    coachBonus: number = 0
  ): { min: number; max: number } {
    const statChanges = this.previewStatChanges(player, goal, intensity, coachBonus);
    const currentOvr = this.calculateOverall(player.stats);

    // Calculate min overall change (using min stat improvements)
    const minStats = { ...player.stats };
    for (const [stat, range] of Object.entries(statChanges)) {
      const key = stat as keyof PlayerStats;
      minStats[key] = Math.min(99, minStats[key] + range.min);
    }
    const minOvr = this.calculateOverall(minStats);

    // Calculate max overall change (using max stat improvements)
    const maxStats = { ...player.stats };
    for (const [stat, range] of Object.entries(statChanges)) {
      const key = stat as keyof PlayerStats;
      maxStats[key] = Math.min(99, maxStats[key] + range.max);
    }
    const maxOvr = this.calculateOverall(maxStats);

    return {
      min: Math.round((minOvr - currentOvr) * 10) / 10, // Round to 1 decimal
      max: Math.round((maxOvr - currentOvr) * 10) / 10,
    };
  }

  /**
   * Preview morale impact before training
   */
  previewMoraleImpact(
    intensity: TrainingIntensity
  ): { min: number; max: number; qualitative: string } {
    const range = PlayerDevelopment.INTENSITY_MORALE_IMPACT[intensity];

    // Determine qualitative description
    let qualitative: string;
    if (range.max > 0 && range.min >= 0) {
      qualitative = 'Energizing';
    } else if (range.min < 0 && range.max <= 0) {
      qualitative = 'Draining';
    } else {
      qualitative = 'Neutral';
    }

    return {
      min: range.min,
      max: range.max,
      qualitative,
    };
  }

  /**
   * Preview fatigue risk before training
   */
  previewFatigueRisk(
    intensity: TrainingIntensity
  ): { increase: number; resultLevel: string } {
    // Calculate fatigue increase based on intensity
    const increase = intensity === 'intense' ? 15 : intensity === 'moderate' ? 10 : 5;

    // Determine resulting fatigue level (assuming player has a fatigue property)
    // For now, we'll use a placeholder since fatigue tracking might be added later
    // The UI can interpret this as a percentage or level
    let resultLevel: string;
    if (increase >= 15) {
      resultLevel = 'High';
    } else if (increase >= 10) {
      resultLevel = 'Moderate';
    } else {
      resultLevel = 'Low';
    }

    return {
      increase,
      resultLevel,
    };
  }

  /**
   * Preview goal impact descriptors (human-readable impact descriptions)
   */
  previewGoalImpact(goal: TrainingGoal): string[] {
    const mapping = TRAINING_GOAL_MAPPINGS[goal];
    return mapping.previewDescriptors;
  }

  /**
   * Deterministic version of calculateStatImprovement with explicit random factor
   * Used for preview calculations
   */
  private calculateStatImprovementDeterministic(
    currentValue: number,
    baseImprovement: number,
    effectivenessMultiplier: number,
    potential: number,
    randomFactor: number // Explicit random factor (0.5 to 1.5)
  ): number {
    // Diminishing returns: harder to improve high stats
    let diminishingFactor = 1.0;
    if (currentValue >= 90) {
      diminishingFactor = 0.1; // Very hard to improve 90+ stats
    } else if (currentValue >= 85) {
      diminishingFactor = 0.3;
    } else if (currentValue >= 80) {
      diminishingFactor = 0.5;
    } else if (currentValue >= 70) {
      diminishingFactor = 0.8;
    }

    // Can't improve beyond potential
    const headroomFactor = currentValue >= potential ? 0 : 1;

    // Calculate final improvement
    const improvement = baseImprovement * effectivenessMultiplier * diminishingFactor * headroomFactor;

    // Apply the provided random factor
    const finalImprovement = Math.round(improvement * randomFactor);

    return Math.max(0, finalImprovement);
  }

  /**
   * Random number between min and max (inclusive)
   */
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Export singleton instance
export const playerDevelopment = new PlayerDevelopment();
