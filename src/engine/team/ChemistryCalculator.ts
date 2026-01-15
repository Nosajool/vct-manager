// ChemistryCalculator - Pure engine class for team chemistry calculations
// No React or store dependencies - pure functions only

import type { Player, TeamChemistry, MatchResult, MapResult, ScrimIntensity, PlayerMapPerformance } from '../../types';
import { MAX_CHEMISTRY_BONUS, STAT_WEIGHTS } from '../match/constants';

/**
 * Result of chemistry calculation after an event
 */
export interface ChemistryUpdate {
  overallChange: number;
  pairChanges: Record<string, Record<string, number>>;
}

/**
 * ChemistryCalculator - Handles all team chemistry calculations
 * 
 * Based on technical specification design:
 * - calculateTeamChemistry: Calculate team chemistry from roster
 * - calculatePairChemistry: Pairwise chemistry based on playstyle/time/personality
 * - updateChemistryAfterMatch: Update after match completion
 */
export class ChemistryCalculator {
  /**
   * Generate initial chemistry for a new team
   * Returns chemistry between 50-80 with no pair data
   */
  generateInitialChemistry(): TeamChemistry {
    return {
      overall: 50 + Math.floor(Math.random() * 30), // 50-80
      pairs: {},
    };
  }

  /**
   * Calculate chemistry bonus multiplier from chemistry score
   * Returns 1.0 to 1.2 (0% to 20% bonus)
   */
  calculateBonusMultiplier(chemistryScore: number): number {
    return 1 + (Math.max(0, Math.min(100, chemistryScore)) / 100) * MAX_CHEMISTRY_BONUS;
  }

  /**
   * Calculate overall team strength from player stats and chemistry
   */
  calculateTeamStrength(players: Player[], chemistry: TeamChemistry): number {
    if (players.length === 0) return 50;

    // Calculate average weighted stats for all players
    let totalStrength = 0;

    for (const player of players) {
      let playerStrength = 0;

      // Apply stat weights (from shared constants)
      playerStrength += player.stats.mechanics * STAT_WEIGHTS.mechanics;
      playerStrength += player.stats.igl * STAT_WEIGHTS.igl;
      playerStrength += player.stats.mental * STAT_WEIGHTS.mental;
      playerStrength += player.stats.clutch * STAT_WEIGHTS.clutch;
      playerStrength += player.stats.entry * STAT_WEIGHTS.entry;
      playerStrength += player.stats.support * STAT_WEIGHTS.support;
      playerStrength += player.stats.lurking * STAT_WEIGHTS.lurking;
      playerStrength += player.stats.vibes * STAT_WEIGHTS.vibes;

      // Apply form modifier (±10%)
      const formModifier = 1 + ((player.form - 70) / 100) * 0.1;
      playerStrength *= formModifier;

      totalStrength += playerStrength;
    }

    const avgStrength = totalStrength / players.length;

    // Apply chemistry bonus
    const chemistryBonus = this.calculateBonusMultiplier(chemistry.overall);

    return avgStrength * chemistryBonus;
  }

  /**
   * Calculate chemistry changes after a match
   */
  calculateMatchChemistryChanges(
    players: Player[],
    matchResult: MatchResult,
    won: boolean
  ): ChemistryUpdate {
    // Base chemistry change: winning improves chemistry, losing hurts slightly
    const baseChange = won ? 2 + Math.random() * 2 : -1 - Math.random();

    // Close games minimize negative impact
    const scoreDiff = Math.abs(matchResult.scoreTeamA - matchResult.scoreTeamB);
    const closeGameMitigation = won ? 1 : Math.max(0.5, 1 - scoreDiff * 0.1);

    const overallChange = Math.round(baseChange * closeGameMitigation * 10) / 10;

    // Pair chemistry changes based on performance
    const pairChanges = this.calculatePairChangesFromMatch(players, matchResult);

    return { overallChange, pairChanges };
  }

  /**
   * Calculate chemistry changes after a scrim
   */
  calculateScrimChemistryChanges(
    players: Player[],
    scrimMaps: MapResult[],
    intensity: ScrimIntensity
  ): ChemistryUpdate {
    // More intense scrims = more chemistry growth/loss
    const intensityMultiplier =
      intensity === 'competitive' ? 1.5 : intensity === 'moderate' ? 1.0 : 0.5;

    // Win percentage affects chemistry
    const wins = scrimMaps.filter((m) => m.winner === 'teamA').length;
    const winRate = scrimMaps.length > 0 ? wins / scrimMaps.length : 0.5;

    // Base chemistry change: +2 to +5 depending on win rate
    const baseChange = 2 + winRate * 3;
    const overallChange = Math.round(baseChange * intensityMultiplier * 10) / 10;

    // Pair chemistry changes based on combined performance
    const pairChanges = this.calculatePairChangesFromScrim(players, scrimMaps, intensityMultiplier);

    return { overallChange, pairChanges };
  }

  /**
   * Calculate pairwise chemistry changes from match performance
   */
  private calculatePairChangesFromMatch(
    players: Player[],
    matchResult: MatchResult
  ): Record<string, Record<string, number>> {
    const pairChanges: Record<string, Record<string, number>> = {};

    // Get all player performances
    const performances: Record<string, PlayerMapPerformance[]> = {};
    for (const map of matchResult.maps) {
      for (const perf of map.teamAPerformances) {
        if (!performances[perf.playerId]) performances[perf.playerId] = [];
        performances[perf.playerId].push(perf);
      }
      for (const perf of map.teamBPerformances) {
        if (!performances[perf.playerId]) performances[perf.playerId] = [];
        performances[perf.playerId].push(perf);
      }
    }

    // For each pair of players, calculate chemistry based on combined performance
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];

        // Calculate combined KD from performances
        const perfs1 = performances[p1.id] || [];
        const perfs2 = performances[p2.id] || [];

        let totalKD = 0;
        let count = 0;

        for (let k = 0; k < Math.min(perfs1.length, perfs2.length); k++) {
          totalKD += (perfs1[k]?.kd || 1) + (perfs2[k]?.kd || 1);
          count++;
        }

        const avgKD = count > 0 ? totalKD / count : 1;

        // Chemistry change based on performance (target KD ~1.5 for positive change)
        const pairChange = Math.round((avgKD - 1.5) * 10) / 10;

        if (!pairChanges[p1.id]) pairChanges[p1.id] = {};
        if (!pairChanges[p2.id]) pairChanges[p2.id] = {};
        pairChanges[p1.id][p2.id] = pairChange;
        pairChanges[p2.id][p1.id] = pairChange;
      }
    }

    return pairChanges;
  }

  /**
   * Calculate pairwise chemistry changes from scrim performance
   */
  private calculatePairChangesFromScrim(
    players: Player[],
    scrimMaps: MapResult[],
    intensityMultiplier: number
  ): Record<string, Record<string, number>> {
    const pairChanges: Record<string, Record<string, number>> = {};

    // Get all player performances
    const performances: Record<string, number[]> = {};
    for (const map of scrimMaps) {
      for (const perf of map.teamAPerformances) {
        if (!performances[perf.playerId]) performances[perf.playerId] = [];
        performances[perf.playerId].push(perf.kd);
      }
    }

    // For each pair of players, calculate chemistry based on combined performance
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];

        // Calculate combined KD from performances
        const kds1 = performances[p1.id] || [];
        const kds2 = performances[p2.id] || [];

        let totalKD = 0;
        let count = 0;

        for (let k = 0; k < Math.min(kds1.length, kds2.length); k++) {
          totalKD += kds1[k] + kds2[k];
          count++;
        }

        const avgKD = count > 0 ? totalKD / count : 1.2;

        // Chemistry change based on performance
        const pairChange = Math.round((avgKD - 1.8) * intensityMultiplier * 10) / 10;

        if (!pairChanges[p1.id]) pairChanges[p1.id] = {};
        if (!pairChanges[p2.id]) pairChanges[p2.id] = {};
        pairChanges[p1.id][p2.id] = pairChange;
        pairChanges[p2.id][p1.id] = pairChange;
      }
    }

    return pairChanges;
  }

  /**
   * Calculate pairwise chemistry between two players based on their stats
   * Used for initial chemistry calculation and stat-based matching
   */
  calculatePairChemistry(p1: Player, p2: Player): number {
    // Complementary stats that work well together
    const complementaryPairs = [
      { stat1: 'entry', stat2: 'support' }, // Entry fragger + support
      { stat1: 'lurking', stat2: 'igl' }, // Lurker + IGL
      { stat1: 'clutch', stat2: 'mental' }, // Clutch player + mental strength
      { stat1: 'mechanics', stat2: 'igl' }, // Aim + IGL
    ];

    let chemistry = 50; // Base chemistry

    // Check for complementary stats
    for (const { stat1, stat2 } of complementaryPairs) {
      const s1 = p1.stats[stat1 as keyof typeof p1.stats];
      const s2 = p2.stats[stat2 as keyof typeof p2.stats];
      if (s1 > 70 && s2 > 70) {
        chemistry += 5;
      }
    }

    // Check for overlapping strengths (good synergy)
    if (p1.stats.entry > 70 && p2.stats.entry > 70) chemistry -= 3; // Too many entry fraggers

    // Age difference impact (similar age = better chemistry)
    const ageDiff = Math.abs(p1.age - p2.age);
    if (ageDiff < 3) chemistry += 3;
    else if (ageDiff > 8) chemistry -= 2;

    // Form bonus (both players performing well = better chemistry)
    if (p1.form > 75 && p2.form > 75) chemistry += 2;

    // Clamp to valid range
    return Math.max(0, Math.min(100, chemistry));
  }

  /**
   * Aggregate pairwise chemistry scores to overall team chemistry
   */
  calculateOverallChemistry(pairs: Record<string, Record<string, number>>): number {
    const scores: number[] = [];

    for (const playerId of Object.keys(pairs)) {
      const playerPairs = pairs[playerId];
      for (const otherId of Object.keys(playerPairs)) {
        // Only count each pair once
        if (playerId < otherId) {
          scores.push(playerPairs[otherId]);
        }
      }
    }

    if (scores.length === 0) return 50; // Default if no pairs

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg);
  }

  /**
   * Apply chemistry updates to existing chemistry state
   */
  applyChemistryUpdate(
    currentChemistry: TeamChemistry,
    update: ChemistryUpdate
  ): TeamChemistry {
    // Update overall (clamped to 0-100)
    const newOverall = Math.max(0, Math.min(100, currentChemistry.overall + update.overallChange));

    // Merge pair changes
    const newPairs = { ...currentChemistry.pairs };

    for (const [p1Id, changes] of Object.entries(update.pairChanges)) {
      if (!newPairs[p1Id]) newPairs[p1Id] = {};

      for (const [p2Id, change] of Object.entries(changes)) {
        if (!newPairs[p1Id][p2Id]) newPairs[p1Id][p2Id] = 0;

        // Calculate new pair score (average of old and new change for stability)
        const currentScore = newPairs[p1Id][p2Id];
        const avgChange = (currentScore + change) / 2;
        newPairs[p1Id][p2Id] = Math.max(0, Math.min(100, avgChange));
      }
    }

    return {
      overall: newOverall,
      pairs: newPairs,
    };
  }
}

// Export singleton instance
export const chemistryCalculator = new ChemistryCalculator();
