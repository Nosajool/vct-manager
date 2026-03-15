// FreeAgentInterestService - Connects free agent interest engine with the store

import { useGameStore } from '../store';
import { freeAgentInterestEngine } from '../engine/player/FreeAgentInterestEngine';
import type { Team } from '../types';

/**
 * FreeAgentInterestService - Manages free agent interest scores and cooldowns
 */
export class FreeAgentInterestService {
  /**
   * Initialize interest for a player/team pair if not already set.
   * Returns the current or newly calculated interest score.
   */
  initializeInterest(playerId: string, teamId: string): number {
    const state = useGameStore.getState();
    const player = state.players[playerId];
    const team = state.teams[teamId];

    if (!player || !team) return 50;

    // Return existing if already initialized
    const existing = player.teamInterests?.[teamId];
    if (existing !== undefined) return existing;

    // Calculate baseline
    const baseline = freeAgentInterestEngine.calculateBaselineInterest(player, team);
    state.setFreeAgentInterest(playerId, teamId, baseline);
    return baseline;
  }

  /**
   * Get interest score for a player/team pair, initializing if needed.
   */
  getInterest(playerId: string, teamId: string): number {
    const state = useGameStore.getState();
    const player = state.players[playerId];
    if (!player) return 50;

    const existing = player.teamInterests?.[teamId];
    if (existing !== undefined) return existing;

    return this.initializeInterest(playerId, teamId);
  }

  /**
   * Process daily interest drift for all tracked free agents.
   * Called once per day advance.
   */
  processDailyDrift(currentDate: string, playerTeam: Team): void {
    const state = useGameStore.getState();
    const teamId = playerTeam.id;

    // Determine win/loss streak from standings.currentStreak
    const currentStreak = playerTeam.standings.currentStreak;
    const winStreak = currentStreak > 0 ? currentStreak : 0;
    const lossStreak = currentStreak < 0 ? Math.abs(currentStreak) : 0;

    // Get all free agents that have a tracked interest for this team
    const freeAgents = Object.values(state.players).filter(
      (p) => p.teamId === null && p.teamInterests?.[teamId] !== undefined
    );

    for (const fa of freeAgents) {
      const current = fa.teamInterests![teamId];
      const newScore = freeAgentInterestEngine.applyDailyDrift(
        current,
        fa.id,
        teamId,
        currentDate,
        winStreak,
        lossStreak
      );
      state.setFreeAgentInterest(fa.id, teamId, newScore);
    }
  }

  /**
   * Apply outreach to boost a free agent's interest score.
   * Optionally deducts from the team's budget.
   */
  applyOutreach(
    playerId: string,
    teamId: string,
    delta: number,
    budgetCost: number
  ): { success: boolean; newScore: number; flavorText: string } {
    const current = this.getInterest(playerId, teamId);
    const newScore = Math.max(0, Math.min(100, current + delta));

    const state = useGameStore.getState();
    state.setFreeAgentInterest(playerId, teamId, newScore);

    if (budgetCost > 0) {
      state.updateTeamBalance(teamId, -budgetCost);
    }

    let flavorText: string;
    if (delta >= 20) {
      flavorText = 'Great response! The player is excited about your organization.';
    } else if (delta >= 10) {
      flavorText = 'Positive reaction. The player is warming up to the idea.';
    } else {
      flavorText = 'The player appreciated the contact.';
    }

    return { success: true, newScore, flavorText };
  }

  /**
   * Set a 5-day rejection cooldown for a player/team pair.
   */
  setRejectionCooldown(playerId: string, teamId: string, currentDate: string): void {
    const state = useGameStore.getState();
    const expiryDate = new Date(currentDate);
    expiryDate.setDate(expiryDate.getDate() + 5);
    state.setOfferCooldown(playerId, teamId, expiryDate.toISOString());
  }

  /**
   * Check whether a player is on cooldown for offers from a team.
   */
  isOnCooldown(playerId: string, teamId: string, currentDate: string): boolean {
    const state = useGameStore.getState();
    const player = state.players[playerId];
    if (!player) return false;

    const expiry = player.offerCooldowns?.[teamId];
    if (!expiry) return false;

    return expiry > currentDate;
  }

  /**
   * Clear all free agent interest data for a player/team pair.
   */
  clearInterest(playerId: string, teamId: string): void {
    const state = useGameStore.getState();
    state.clearFreeAgentData(playerId, teamId);
  }
}

// Export singleton instance
export const freeAgentInterestService = new FreeAgentInterestService();
