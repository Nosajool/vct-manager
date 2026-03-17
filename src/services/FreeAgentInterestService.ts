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
   * Records the action and updates outreach spend.
   * If the action was already done, returns current state without re-applying.
   */
  applyOutreach(
    playerId: string,
    teamId: string,
    actionName: string,
    delta: number,
    budgetCost: number
  ): { success: boolean; newScore: number; flavorText: string; alreadyDone: boolean } {
    const state = useGameStore.getState();
    const player = state.players[playerId];
    if (!player) return { success: false, newScore: 0, flavorText: '', alreadyDone: false };

    // Idempotency guard — each action can only be done once
    const existingActions = player.outreachActions?.[teamId] ?? [];
    if (existingActions.includes(actionName)) {
      const current = this.getInterest(playerId, teamId);
      return { success: false, newScore: current, flavorText: 'Already done.', alreadyDone: true };
    }

    const current = this.getInterest(playerId, teamId);
    const newScore = Math.max(0, Math.min(100, current + delta));

    state.setFreeAgentInterest(playerId, teamId, newScore);
    state.addOutreachAction(playerId, teamId, actionName);

    if (actionName === 'facility_tour') {
      state.setDramaFlag('facility_tour_completed', {
        setDate: new Date().toISOString(),
      });
    }

    if (budgetCost > 0) {
      state.updateTeamBalance(teamId, -budgetCost);
      const currentSpend = player.outreachSpend?.[teamId] ?? 0;
      state.setOutreachSpend(playerId, teamId, currentSpend + budgetCost);
    }

    let flavorText: string;
    if (delta >= 20) {
      flavorText = 'Great response! The player is excited about your organization.';
    } else if (delta >= 10) {
      flavorText = 'Positive reaction. The player is warming up to the idea.';
    } else {
      flavorText = 'The player appreciated the contact.';
    }

    return { success: true, newScore, flavorText, alreadyDone: false };
  }

  /**
   * Get total outreach spend for a player/team pair.
   */
  getOutreachSpend(playerId: string, teamId: string): number {
    const player = useGameStore.getState().players[playerId];
    return player?.outreachSpend?.[teamId] ?? 0;
  }

  /**
   * Get list of completed outreach actions for a player/team pair.
   */
  getOutreachActions(playerId: string, teamId: string): string[] {
    const player = useGameStore.getState().players[playerId];
    return player?.outreachActions?.[teamId] ?? [];
  }

  /**
   * Check if the team has any roster player with a connection to the FA.
   * Connection = FA lists a roster player in preferredTeammates, or vice versa.
   */
  hasPlayerConnection(
    playerId: string,
    teamId: string
  ): { connected: boolean; connectionCount: number; hasFavoriteConnection: boolean } {
    const state = useGameStore.getState();
    const fa = state.players[playerId];
    const team = state.teams[teamId];

    if (!fa || !team) return { connected: false, connectionCount: 0, hasFavoriteConnection: false };

    const rosterIds = [...team.playerIds, ...team.reservePlayerIds];
    const faPreferred = new Set(fa.preferences.preferredTeammates);

    let connectionCount = 0;
    let hasFavoriteConnection = false;

    for (const rosterId of rosterIds) {
      if (faPreferred.has(rosterId)) {
        connectionCount++;
        hasFavoriteConnection = true;
      } else {
        const rosterPlayer = state.players[rosterId];
        if (rosterPlayer?.preferences.preferredTeammates.includes(playerId)) {
          connectionCount++;
        }
      }
    }

    return { connected: connectionCount > 0, connectionCount, hasFavoriteConnection };
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
