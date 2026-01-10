// PlayerDevelopment - Pure engine class for player training and development
// No React or store dependencies - pure functions only

import type { Player, PlayerStats, TrainingFocus, TrainingIntensity, TrainingResult } from '../../types';

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
   * Random number between min and max (inclusive)
   */
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Export singleton instance
export const playerDevelopment = new PlayerDevelopment();
