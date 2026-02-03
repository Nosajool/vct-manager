// EconomyEngine - Handles credit calculations, buy decisions, and economic state
// Pure class with no React/store dependencies

import type { BuyType, TeamStrategy, TeamEconomy, EconomyDiscipline } from '../../types';
import { ECONOMY_CONSTANTS } from './constants';

/**
 * Team economy state for tracking across rounds
 */
export interface TeamEconomyState {
  /** Array of 5 player credit counts */
  playerCredits: number[];
  /** Consecutive rounds lost */
  lossStreak: number;
  /** Last round's buy type */
  lastBuyType: BuyType;
}

/**
 * Result of a round's economic impact
 */
export interface EconomyUpdate {
  /** Credits earned this round */
  creditsEarned: number;
  /** New loss streak count */
  newLossStreak: number;
  /** Whether this was a save round */
  wasSaveRound: boolean;
}

export class EconomyEngine {
  /**
   * Initialize economy state for the start of a half (pistol round)
   */
  initializeHalf(): TeamEconomyState {
    return {
      playerCredits: Array(5).fill(ECONOMY_CONSTANTS.PISTOL_ROUND_CREDITS),
      lossStreak: 0,
      lastBuyType: 'eco', // Pistol rounds are essentially eco
    };
  }

  /**
   * Calculate team's average credits
   */
  getTeamCredits(state: TeamEconomyState): number {
    const total = state.playerCredits.reduce((sum, c) => sum + c, 0);
    return Math.round(total / 5);
  }

  /**
   * Determine buy type based on credits and strategy
   */
  determineBuyType(
    economyState: TeamEconomyState,
    strategy: TeamStrategy,
    roundNumber: number,
    opponentEconomy?: TeamEconomyState
  ): BuyType {
    const avgCredits = this.getTeamCredits(economyState);
    const { BUY_THRESHOLDS } = ECONOMY_CONSTANTS;

    // Pistol rounds (1 and 13) are always eco/light buys
    if (roundNumber === 1 || roundNumber === 13) {
      return 'eco';
    }

    // Second round logic (after pistol)
    if (roundNumber === 2 || roundNumber === 14) {
      // Won pistol = force buy opportunity
      if (economyState.lossStreak === 0) {
        return 'force_buy';
      }
      // Lost pistol = save for bonus round
      return 'eco';
    }

    // Apply strategy discipline modifiers
    const disciplineModifier = this.getDisciplineModifier(strategy.economyDiscipline);
    const adjustedForceThreshold = strategy.forceThreshold * disciplineModifier;

    // Full buy conditions
    if (avgCredits >= BUY_THRESHOLDS.full_buy) {
      return 'full_buy';
    }

    // Force buy conditions
    if (avgCredits >= BUY_THRESHOLDS.force_buy) {
      // Check if opponent is on eco (force to punish)
      if (opponentEconomy && this.getTeamCredits(opponentEconomy) < BUY_THRESHOLDS.half_buy) {
        return 'full_buy'; // Upgrade to full buy to punish eco
      }
      return 'force_buy';
    }

    // Half buy conditions
    if (avgCredits >= BUY_THRESHOLDS.half_buy) {
      // Conservative players prefer to save
      if (strategy.economyDiscipline === 'conservative') {
        return avgCredits >= adjustedForceThreshold ? 'half_buy' : 'eco';
      }
      return 'half_buy';
    }

    // Eco conditions
    if (avgCredits >= BUY_THRESHOLDS.eco) {
      // Risky players might force anyway
      if (strategy.economyDiscipline === 'risky' && avgCredits >= adjustedForceThreshold * 0.7) {
        return 'half_buy';
      }
      return 'eco';
    }

    return 'eco';
  }

  /**
   * Get strength modifier based on buy type
   */
  getBuyStrengthModifier(buyType: BuyType): number {
    return ECONOMY_CONSTANTS.BUY_STRENGTH_MODIFIER[buyType];
  }

  /**
   * Calculate credits earned after a round
   */
  calculateRoundCredits(
    won: boolean,
    kills: number[],
    planted: boolean,
    defused: boolean,
    currentState: TeamEconomyState
  ): EconomyUpdate {
    const { ROUND_WIN_CREDITS, ROUND_LOSS_BASE, LOSS_STREAK_BONUS, KILL_CREDIT, PLANT_CREDIT, DEFUSE_CREDIT } =
      ECONOMY_CONSTANTS;

    let baseCredits = won ? ROUND_WIN_CREDITS : ROUND_LOSS_BASE;

    // Loss bonus
    const newLossStreak = won ? 0 : currentState.lossStreak + 1;
    if (!won) {
      const bonusIndex = Math.min(newLossStreak - 1, LOSS_STREAK_BONUS.length - 1);
      baseCredits += LOSS_STREAK_BONUS[bonusIndex];
    }

    // Kill credits (sum of all player kills * credit per kill)
    const totalKillCredits = kills.reduce((sum, k) => sum + k, 0) * KILL_CREDIT;

    // Plant/defuse credits (shared among team)
    const plantCredits = planted ? PLANT_CREDIT : 0;
    const defuseCredits = defused && won ? DEFUSE_CREDIT : 0;

    const totalCredits = baseCredits + totalKillCredits + plantCredits + defuseCredits;

    return {
      creditsEarned: totalCredits,
      newLossStreak,
      wasSaveRound: currentState.lastBuyType === 'eco',
    };
  }

  /**
   * Update economy state after a round
   */
  updateEconomyState(
    currentState: TeamEconomyState,
    update: EconomyUpdate,
    buyType: BuyType,
    playerKills: number[]
  ): TeamEconomyState {
    const { MAX_CREDITS, KILL_CREDIT } = ECONOMY_CONSTANTS;

    // Calculate individual player credits
    // Each player gets base + their individual kills
    const basePerPlayer = Math.floor(update.creditsEarned / 5);

    const newPlayerCredits = currentState.playerCredits.map((current, i) => {
      // If they bought, subtract cost based on buy type
      const buyCost = this.getBuyCost(buyType);
      const remaining = Math.max(0, current - buyCost);

      // Add round earnings + individual kill bonus
      const killBonus = (playerKills[i] || 0) * KILL_CREDIT;
      const total = remaining + basePerPlayer + killBonus;

      return Math.min(total, MAX_CREDITS);
    });

    return {
      playerCredits: newPlayerCredits,
      lossStreak: update.newLossStreak,
      lastBuyType: buyType,
    };
  }

  /**
   * Create TeamEconomy snapshot for round data
   */
  createEconomySnapshot(state: TeamEconomyState, buyType: BuyType): TeamEconomy {
    return {
      credits: this.getTeamCredits(state),
      buyType,
      roundsLost: state.lossStreak,
    };
  }

  /**
   * Get estimated buy cost for a buy type
   */
  private getBuyCost(buyType: BuyType): number {
    switch (buyType) {
      case 'eco':
        return 200; // Maybe a sheriff or light armor
      case 'half_buy':
        return 2000; // Spectre/Marshal + light armor + some util
      case 'force_buy':
        return 3200; // Phantom/Vandal + light armor
      case 'full_buy':
        return 3900; // Full armor + Vandal + full util
    }
  }

  /**
   * Get discipline modifier for buy thresholds
   */
  private getDisciplineModifier(discipline: EconomyDiscipline): number {
    switch (discipline) {
      case 'risky':
        return 0.75; // Lower threshold = buy more often
      case 'standard':
        return 1.0;
      case 'conservative':
        return 1.25; // Higher threshold = save more
    }
  }

  /**
   * Check if team should force buy based on game state
   */
  shouldForceBuy(
    _economyState: TeamEconomyState,
    strategy: TeamStrategy,
    teamScore: number,
    opponentScore: number,
    roundNumber: number
  ): boolean {
    // Match point situations - always force
    if (opponentScore === 12) {
      return true;
    }

    // Team is far behind and needs momentum
    if (opponentScore - teamScore >= 4 && strategy.economyDiscipline === 'risky') {
      return true;
    }

    // Second half start with lead - can afford to force
    if (roundNumber === 13 && teamScore >= 8) {
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const economyEngine = new EconomyEngine();
