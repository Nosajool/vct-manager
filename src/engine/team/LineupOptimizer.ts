// LineupOptimizer - Evaluates all possible lineup combinations
// Uses the same formulas as the match simulator to score lineups

import type { Player, Team, AgentRole } from '../../types';
import { MatchSimulator } from '../match/MatchSimulator';
import { CompositionEngine } from '../match/CompositionEngine';
import { ChemistryCalculator } from './ChemistryCalculator';

/**
 * Result of lineup optimization
 */
export interface LineupResult {
  optimalPlayerIds: string[];      // Best 5 player IDs
  currentScore: number;            // Current lineup effective score
  optimalScore: number;            // Best lineup effective score
  improvementPercent: number;      // % improvement
  swapsNeeded: {
    toActive: string[];            // Player IDs to promote to active
    toReserve: string[];           // Player IDs to move to reserve
  };
}

/**
 * Internal lineup evaluation result
 */
interface LineupEvaluation {
  playerIds: string[];
  score: number;
}

/**
 * LineupOptimizer - Finds the optimal 5-player lineup from a team's roster
 *
 * Evaluates all C(n,5) combinations using the same formulas the match simulator uses:
 * - Team strength from MatchSimulator.calculateTeamStrength()
 * - Composition bonus from CompositionEngine.calculateCompositionBonus()
 * - Chemistry estimation from ChemistryCalculator for alternative lineups
 */
export class LineupOptimizer {
  private matchSimulator: MatchSimulator;
  private compositionEngine: CompositionEngine;
  private chemistryCalculator: ChemistryCalculator;

  constructor() {
    this.matchSimulator = new MatchSimulator();
    this.compositionEngine = new CompositionEngine();
    this.chemistryCalculator = new ChemistryCalculator();
  }

  /**
   * Find the optimal lineup from a team's full player pool
   *
   * @param team - The team to optimize
   * @param allPlayers - All players in the team's pool (active + reserves)
   * @returns LineupResult with optimal lineup and improvement stats
   */
  findOptimalLineup(team: Team, allPlayers: Player[]): LineupResult {
    // Edge case: not enough players
    if (allPlayers.length < 5) {
      const currentPlayerIds = team.playerIds.slice(0, 5);
      return {
        optimalPlayerIds: currentPlayerIds,
        currentScore: 0,
        optimalScore: 0,
        improvementPercent: 0,
        swapsNeeded: { toActive: [], toReserve: [] },
      };
    }

    // Evaluate current lineup
    const currentPlayers = allPlayers.filter(p => team.playerIds.includes(p.id));
    const currentScore = this.evaluateLineup(
      currentPlayers,
      team.chemistry.overall,
      true // Use real chemistry for current lineup
    );

    // Edge case: no reserves to swap with
    if (allPlayers.length === 5) {
      return {
        optimalPlayerIds: team.playerIds,
        currentScore,
        optimalScore: currentScore,
        improvementPercent: 0,
        swapsNeeded: { toActive: [], toReserve: [] },
      };
    }

    // Generate all possible 5-player combinations
    const combinations = this.generateCombinations(allPlayers, 5);

    // Evaluate each combination
    let bestEvaluation: LineupEvaluation = {
      playerIds: team.playerIds,
      score: currentScore,
    };

    for (const combo of combinations) {
      const players = combo.map(id => allPlayers.find(p => p.id === id)!);
      const isCurrent = this.isCurrentLineup(combo, team.playerIds);

      const score = this.evaluateLineup(
        players,
        team.chemistry.overall,
        isCurrent
      );

      if (score > bestEvaluation.score) {
        bestEvaluation = { playerIds: combo, score };
      }
    }

    // Calculate swaps needed
    const swapsNeeded = this.calculateSwapsNeeded(
      team.playerIds,
      bestEvaluation.playerIds
    );

    // Calculate improvement percentage
    const improvementPercent = currentScore > 0
      ? ((bestEvaluation.score - currentScore) / currentScore) * 100
      : 0;

    return {
      optimalPlayerIds: bestEvaluation.playerIds,
      currentScore,
      optimalScore: bestEvaluation.score,
      improvementPercent,
      swapsNeeded,
    };
  }

  /**
   * Evaluate a lineup using match simulator formulas
   */
  private evaluateLineup(
    players: Player[],
    teamChemistry: number,
    isCurrentLineup: boolean
  ): number {
    if (players.length !== 5) return 0;

    // Calculate chemistry score
    let chemistryScore: number;
    if (isCurrentLineup) {
      // Use real team chemistry for current lineup
      chemistryScore = teamChemistry;
    } else {
      // Estimate chemistry for alternative lineups
      chemistryScore = this.estimateChemistry(players);
    }

    // Calculate team strength using MatchSimulator formula
    const teamStrength = this.matchSimulator.calculateTeamStrength(
      players,
      chemistryScore
    );

    // Infer roles and calculate composition bonus
    const roleCounts: Record<AgentRole, number> = {
      Duelist: 0,
      Initiator: 0,
      Controller: 0,
      Sentinel: 0,
    };

    for (const player of players) {
      const role = this.compositionEngine.inferRoleFromStats(player);
      roleCounts[role]++;
    }

    const compositionBonus = this.compositionEngine.calculateCompositionBonus(roleCounts);

    // Final score mirrors effective strength formula
    // (excluding buy/ult modifiers which are runtime-only)
    const finalScore = teamStrength * (1 + compositionBonus.modifier);

    return finalScore;
  }

  /**
   * Estimate chemistry for a lineup using pairwise chemistry
   */
  private estimateChemistry(players: Player[]): number {
    const pairs: Record<string, Record<string, number>> = {};

    // Calculate chemistry for all pairs
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];

        const pairChemistry = this.chemistryCalculator.calculatePairChemistry(p1, p2);

        if (!pairs[p1.id]) pairs[p1.id] = {};
        if (!pairs[p2.id]) pairs[p2.id] = {};

        pairs[p1.id][p2.id] = pairChemistry;
        pairs[p2.id][p1.id] = pairChemistry;
      }
    }

    // Aggregate to overall chemistry
    return this.chemistryCalculator.calculateOverallChemistry(pairs);
  }

  /**
   * Generate all C(n,k) combinations of player IDs
   */
  private generateCombinations(players: Player[], k: number): string[][] {
    const result: string[][] = [];
    const n = players.length;

    const combine = (start: number, chosen: string[]) => {
      if (chosen.length === k) {
        result.push([...chosen]);
        return;
      }

      for (let i = start; i < n; i++) {
        chosen.push(players[i].id);
        combine(i + 1, chosen);
        chosen.pop();
      }
    };

    combine(0, []);
    return result;
  }

  /**
   * Check if a combination matches the current lineup
   */
  private isCurrentLineup(combo: string[], currentPlayerIds: string[]): boolean {
    if (combo.length !== currentPlayerIds.length) return false;

    const comboSet = new Set(combo);
    return currentPlayerIds.every(id => comboSet.has(id));
  }

  /**
   * Calculate which players need to be swapped
   */
  private calculateSwapsNeeded(
    currentPlayerIds: string[],
    optimalPlayerIds: string[]
  ): { toActive: string[]; toReserve: string[] } {
    const currentSet = new Set(currentPlayerIds);
    const optimalSet = new Set(optimalPlayerIds);

    const toActive = optimalPlayerIds.filter(id => !currentSet.has(id));
    const toReserve = currentPlayerIds.filter(id => !optimalSet.has(id));

    return { toActive, toReserve };
  }
}

// Export singleton instance
export const lineupOptimizer = new LineupOptimizer();
