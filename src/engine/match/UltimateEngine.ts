// UltimateEngine - Handles ultimate point tracking, usage decisions, and impact calculations
// Pure class with no React/store dependencies

import type { PlayerUltState, UltUsage, TeamStrategy, UltUsageStyle } from '../../types';
import { ULT_CONSTANTS } from './constants';

/**
 * Complete team ultimate state
 */
export interface TeamUltimateState {
  /** Individual player ult states */
  players: PlayerUltState[];
}

/**
 * Result of ultimate usage decision
 */
export interface UltDecision {
  /** Players who should use their ult this round */
  ultsToUse: UltUsage[];
  /** Combined impact modifier for the round */
  impactModifier: number;
}

export class UltimateEngine {
  /**
   * Initialize ultimate state for a team at start of map
   */
  initializeUltState(
    playerIds: string[],
    agents: string[]
  ): TeamUltimateState {
    return {
      players: playerIds.map((playerId, i) => {
        const agent = agents[i];
        const requiredPoints = this.getUltCost(agent);
        return {
          playerId,
          agent,
          currentPoints: 0,
          requiredPoints,
          isReady: false,
        };
      }),
    };
  }

  /**
   * Get ultimate cost for an agent
   */
  getUltCost(agent: string): number {
    return ULT_CONSTANTS.ULT_COSTS[agent as keyof typeof ULT_CONSTANTS.ULT_COSTS] || 7;
  }

  /**
   * Get impact level for an agent's ultimate
   */
  getUltImpactLevel(agent: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    return ULT_CONSTANTS.AGENT_ULT_IMPACT[agent as keyof typeof ULT_CONSTANTS.AGENT_ULT_IMPACT] || 'MEDIUM';
  }

  /**
   * Get impact modifier value for an impact level
   */
  getImpactModifier(level: 'LOW' | 'MEDIUM' | 'HIGH'): number {
    return ULT_CONSTANTS.ULT_IMPACT[level];
  }

  /**
   * Award ult points after a round
   */
  awardUltPoints(
    state: TeamUltimateState,
    playerKills: Map<string, number>,
    planted: boolean,
    defused: boolean,
    planterId?: string,
    defuserId?: string
  ): TeamUltimateState {
    const { POINTS_PER_KILL, POINTS_PER_ROUND, POINTS_PER_PLANT, POINTS_PER_DEFUSE } = ULT_CONSTANTS;

    const updatedPlayers = state.players.map((player) => {
      let points = player.currentPoints;

      // Don't accumulate if already ready (can't go over)
      if (player.isReady) {
        return player;
      }

      // Round start point
      points += POINTS_PER_ROUND;

      // Kill points
      const kills = playerKills.get(player.playerId) || 0;
      points += kills * POINTS_PER_KILL;

      // Plant point (only for planter)
      if (planted && planterId === player.playerId) {
        points += POINTS_PER_PLANT;
      }

      // Defuse point (only for defuser)
      if (defused && defuserId === player.playerId) {
        points += POINTS_PER_DEFUSE;
      }

      // Check if ult is now ready
      const isReady = points >= player.requiredPoints;

      return {
        ...player,
        currentPoints: Math.min(points, player.requiredPoints),
        isReady,
      };
    });

    return { players: updatedPlayers };
  }

  /**
   * Decide which ultimates to use based on strategy and game state
   */
  decideUltUsage(
    state: TeamUltimateState,
    strategy: TeamStrategy,
    roundNumber: number,
    teamScore: number,
    opponentScore: number,
    isAttacking: boolean
  ): UltDecision {
    const readyPlayers = state.players.filter((p) => p.isReady);

    if (readyPlayers.length === 0) {
      return { ultsToUse: [], impactModifier: 0 };
    }

    const ultsToUse: UltUsage[] = [];
    let totalImpact = 0;

    // Determine if this is a "key round"
    const isKeyRound = this.isKeyRound(roundNumber, teamScore, opponentScore);
    const economyPressure = this.hasEconomyPressure(teamScore, opponentScore, roundNumber);

    for (const player of readyPlayers) {
      const shouldUse = this.shouldUseUlt(
        player,
        strategy.ultUsageStyle,
        isKeyRound,
        economyPressure,
        isAttacking,
        readyPlayers.length
      );

      if (shouldUse) {
        ultsToUse.push({
          playerId: player.playerId,
          agent: player.agent,
        });

        const impactLevel = this.getUltImpactLevel(player.agent);
        totalImpact += this.getImpactModifier(impactLevel);
      }
    }

    // Cap total impact to prevent ult stacking being too strong
    const cappedImpact = Math.min(totalImpact, 0.25);

    return {
      ultsToUse,
      impactModifier: cappedImpact,
    };
  }

  /**
   * Consume ultimates that were used
   */
  consumeUlts(state: TeamUltimateState, usedUlts: UltUsage[]): TeamUltimateState {
    const usedPlayerIds = new Set(usedUlts.map((u) => u.playerId));

    const updatedPlayers = state.players.map((player) => {
      if (usedPlayerIds.has(player.playerId)) {
        return {
          ...player,
          currentPoints: 0,
          isReady: false,
        };
      }
      return player;
    });

    return { players: updatedPlayers };
  }

  /**
   * Count ready ultimates
   */
  countReadyUlts(state: TeamUltimateState): number {
    return state.players.filter((p) => p.isReady).length;
  }

  /**
   * Get total ult progress as percentage
   */
  getTeamUltProgress(state: TeamUltimateState): number {
    const total = state.players.reduce((sum, p) => {
      return sum + (p.currentPoints / p.requiredPoints);
    }, 0);
    return (total / state.players.length) * 100;
  }

  /**
   * Determine if this is a key round worth using ults
   */
  private isKeyRound(
    roundNumber: number,
    teamScore: number,
    opponentScore: number
  ): boolean {
    // Match point
    if (teamScore === 12 || opponentScore === 12) {
      return true;
    }

    // Overtime
    if (teamScore >= 12 && opponentScore >= 12) {
      return true;
    }

    // First gun round after pistol (round 3 or 15)
    if (roundNumber === 3 || roundNumber === 15) {
      return true;
    }

    // Tight game in second half
    if (roundNumber >= 18 && Math.abs(teamScore - opponentScore) <= 2) {
      return true;
    }

    // Need to break a losing streak (3+ rounds behind)
    if (opponentScore - teamScore >= 3) {
      return true;
    }

    return false;
  }

  /**
   * Check if team has economy pressure (need to win now)
   */
  private hasEconomyPressure(
    teamScore: number,
    opponentScore: number,
    roundNumber: number
  ): boolean {
    // Far behind in score
    if (opponentScore - teamScore >= 4) {
      return true;
    }

    // Late game and losing
    if (roundNumber >= 20 && opponentScore > teamScore) {
      return true;
    }

    return false;
  }

  /**
   * Decide if a specific player should use their ult
   */
  private shouldUseUlt(
    player: PlayerUltState,
    style: UltUsageStyle,
    isKeyRound: boolean,
    economyPressure: boolean,
    isAttacking: boolean,
    totalReady: number
  ): boolean {
    const impactLevel = this.getUltImpactLevel(player.agent);

    switch (style) {
      case 'aggressive':
        // Use ults frequently, especially on attack
        if (isAttacking) {
          return true; // Use all ults on attack
        }
        return impactLevel === 'HIGH' || isKeyRound;

      case 'save_for_key_rounds':
        // Only use on key rounds or economic pressure
        if (isKeyRound || economyPressure) {
          return true;
        }
        // Otherwise only high impact ults
        return impactLevel === 'HIGH' && Math.random() > 0.5;

      case 'combo_focused':
        // Try to combo multiple ults together
        if (totalReady >= 2 && isKeyRound) {
          return true; // Use all when stacking
        }
        if (totalReady >= 3) {
          return true; // Use when you have excess
        }
        // Single ult usage is more conservative
        return impactLevel === 'HIGH' && isKeyRound;

      default:
        return isKeyRound;
    }
  }
}

// Export singleton instance
export const ultimateEngine = new UltimateEngine();
