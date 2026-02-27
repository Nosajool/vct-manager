// StrategyService - Manages team strategies and player agent preferences
// Provides validation, defaults, and AI strategy generation

import { useGameStore } from '../store';
import { compositionEngine } from '../engine/match';
import type {
  TeamStrategy,
  PlayerAgentPreferences,
  AgentRole,
  PlaystyleType,
  EconomyDiscipline,
  UltUsageStyle,
  Player,
} from '../types';
import {
  AI_STRATEGY_PRESETS,
  validateStrategy,
} from '../types/strategy';

export class StrategyService {
  /**
   * Get team strategy, creating default if needed
   */
  getTeamStrategy(teamId: string): TeamStrategy {
    const state = useGameStore.getState();
    return state.getTeamStrategy(teamId);
  }

  /**
   * Update team strategy with validation
   */
  updateTeamStrategy(teamId: string, updates: Partial<TeamStrategy>): boolean {
    const state = useGameStore.getState();
    const current = state.getTeamStrategy(teamId);
    const updated = { ...current, ...updates };

    if (!validateStrategy(updated)) {
      console.error('Invalid strategy update:', updates);
      return false;
    }

    state.setTeamStrategy(teamId, updated);
    return true;
  }

  /**
   * Set playstyle for a team
   */
  setPlaystyle(teamId: string, playstyle: PlaystyleType): void {
    useGameStore.getState().updateTeamStrategy(teamId, { playstyle });
  }

  /**
   * Set economy discipline for a team
   */
  setEconomyDiscipline(teamId: string, discipline: EconomyDiscipline): void {
    useGameStore.getState().updateTeamStrategy(teamId, { economyDiscipline: discipline });
  }

  /**
   * Set force buy threshold
   */
  setForceThreshold(teamId: string, threshold: number): boolean {
    if (threshold < 1000 || threshold > 4000) {
      console.error('Force threshold must be between 1000-4000');
      return false;
    }
    useGameStore.getState().updateTeamStrategy(teamId, { forceThreshold: threshold });
    return true;
  }

  /**
   * Set ultimate usage style
   */
  setUltUsageStyle(teamId: string, style: UltUsageStyle): void {
    useGameStore.getState().updateTeamStrategy(teamId, { ultUsageStyle: style });
  }

  /**
   * Reset team strategy to default
   */
  resetTeamStrategy(teamId: string): void {
    useGameStore.getState().resetTeamStrategy(teamId);
  }

  /**
   * Initialize AI team strategies
   */
  initializeAIStrategies(teamIds: string[], playerTeamId?: string): void {
    useGameStore.getState().initializeAIStrategies(teamIds, playerTeamId);
  }

  /**
   * Get player agent preferences
   */
  getPlayerAgentPreferences(playerId: string): PlayerAgentPreferences | undefined {
    return useGameStore.getState().getPlayerAgentPreferences(playerId);
  }

  /**
   * Set player agent preferences
   */
  setPlayerAgentPreferences(playerId: string, preferences: PlayerAgentPreferences): void {
    useGameStore.getState().setPlayerAgentPreferences(playerId, preferences);
  }

  /**
   * Generate default agent preferences for a player based on stats
   */
  generateDefaultPreferences(player: Player): PlayerAgentPreferences {
    return compositionEngine.generateDefaultPreferences(player);
  }

  /**
   * Initialize agent preferences for all players on a team
   */
  initializeTeamAgentPreferences(teamId: string): void {
    const state = useGameStore.getState();
    const team = state.teams[teamId];

    if (!team) {
      console.error('Team not found:', teamId);
      return;
    }

    const allPlayerIds = [...team.playerIds, ...team.reservePlayerIds];

    for (const playerId of allPlayerIds) {
      // Skip if already has preferences
      if (state.getPlayerAgentPreferences(playerId)) {
        continue;
      }

      const player = state.players[playerId];
      if (!player) continue;

      // Use pre-computed VLR agent preferences if available; otherwise generate defaults
      const preferences = player.agentPreferences ?? this.generateDefaultPreferences(player);
      state.setPlayerAgentPreferences(playerId, preferences);
    }
  }

  /**
   * Update a player's preferred agents
   */
  updatePreferredAgents(
    playerId: string,
    agents: [string, string, string]
  ): void {
    useGameStore.getState().updatePlayerAgentPreferences(playerId, {
      preferredAgents: agents,
    });
  }

  /**
   * Update a player's primary role
   */
  updatePrimaryRole(playerId: string, role: AgentRole): void {
    const state = useGameStore.getState();
    const current = state.getPlayerAgentPreferences(playerId);

    if (!current) {
      // Create new preferences with this role
      const player = state.players[playerId];
      if (!player) return;

      const defaultPrefs = this.generateDefaultPreferences(player);
      defaultPrefs.primaryRole = role;
      // Update preferred agents to match new role
      const roleAgents = compositionEngine.getAgentsByRole(role);
      defaultPrefs.preferredAgents = roleAgents.slice(0, 3) as [string, string, string];

      state.setPlayerAgentPreferences(playerId, defaultPrefs);
    } else {
      state.updatePlayerAgentPreferences(playerId, { primaryRole: role });
    }
  }

  /**
   * Update a player's flex roles
   */
  updateFlexRoles(playerId: string, roles: AgentRole[]): void {
    useGameStore.getState().updatePlayerAgentPreferences(playerId, {
      flexRoles: roles,
    });
  }

  /**
   * Clear player agent preferences
   */
  clearPlayerPreferences(playerId: string): void {
    useGameStore.getState().clearPlayerAgentPreferences(playerId);
  }

  /**
   * Get strategy presets for UI
   */
  getStrategyPresets(): Record<string, Partial<TeamStrategy>> {
    return AI_STRATEGY_PRESETS;
  }

  /**
   * Apply a preset strategy
   */
  applyPreset(teamId: string, presetName: string): boolean {
    const preset = AI_STRATEGY_PRESETS[presetName];
    if (!preset) {
      console.error('Unknown preset:', presetName);
      return false;
    }

    return this.updateTeamStrategy(teamId, preset);
  }

  /**
   * Validate a complete strategy
   */
  validateStrategy(strategy: TeamStrategy): boolean {
    return validateStrategy(strategy);
  }

  /**
   * Get all agents for a role
   */
  getAgentsByRole(role: AgentRole): string[] {
    return compositionEngine.getAgentsByRole(role);
  }

  /**
   * Get role for an agent
   */
  getAgentRole(agent: string): AgentRole | undefined {
    return compositionEngine.getAgentRole(agent);
  }
}

// Export singleton instance
export const strategyService = new StrategyService();
