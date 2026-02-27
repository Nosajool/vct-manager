// CompositionEngine - Handles agent selection, role validation, and composition bonuses
// Pure class with no React/store dependencies

import type {
  Player,
  TeamStrategy,
  CompositionBonus,
  AgentSelection,
  AgentRole,
  PlayerAgentPreferences,
} from '../../types';
import { COMPOSITION_CONSTANTS } from './constants';
import { agentMasteryEngine } from '../player/AgentMasteryEngine';

/**
 * Map-specific agent preferences (some agents are better on certain maps)
 */
const MAP_AGENT_PREFERENCES: Record<string, string[]> = {
  Ascent: ['Sova', 'KAY/O', 'Killjoy', 'Jett', 'Omen'],
  Bind: ['Raze', 'Skye', 'Brimstone', 'Viper', 'Chamber'],
  Haven: ['Breach', 'Sova', 'Omen', 'Killjoy', 'Jett'],
  Split: ['Raze', 'Sage', 'Astra', 'Cypher', 'Jett'],
  Icebox: ['Sova', 'Viper', 'Sage', 'Jett', 'Chamber'],
  Breeze: ['Sova', 'Viper', 'Chamber', 'Jett', 'KAY/O'],
  Fracture: ['Breach', 'Fade', 'Brimstone', 'Cypher', 'Neon'],
  Pearl: ['Fade', 'Astra', 'Killjoy', 'Jett', 'Harbor'],
  Lotus: ['Fade', 'Omen', 'Killjoy', 'Raze', 'Harbor'],
  Sunset: ['Omen', 'Cypher', 'Breach', 'Raze', 'Neon'],
  Abyss: ['Omen', 'Sage', 'Jett', 'Sova', 'Killjoy'],
};

export class CompositionEngine {

  constructor() {
    // No state needed for this pure engine
  }

  /**
   * Get the role for a specific agent
   */
  getAgentRole(agent: string): AgentRole | undefined {
    return COMPOSITION_CONSTANTS.AGENT_ROLES[agent as keyof typeof COMPOSITION_CONSTANTS.AGENT_ROLES];
  }

  /**
   * Get all agents that can play a specific role
   */
  getAgentsByRole(role: AgentRole): string[] {
    return [...COMPOSITION_CONSTANTS.AGENTS_BY_ROLE[role]];
  }

  /**
   * Select agents for a team based on player preferences and strategy
   * Composition is derived purely from player primaryRole and flexRoles — no cap.
   */
  selectAgents(
    players: Player[],
    strategy: TeamStrategy,
    mapName: string
  ): AgentSelection {
    const assignments: Record<string, string> = {};
    const usedAgents = new Set<string>();

    if (!strategy) {
      throw new Error('TeamStrategy is required');
    }

    const mapPreferences = MAP_AGENT_PREFERENCES[mapName] || [];

    // Track role counts
    const roleCounts: Record<AgentRole, number> = {
      Duelist: 0,
      Initiator: 0,
      Controller: 0,
      Sentinel: 0,
    };

    // Sort players by role flexibility ascending (less flexible = harder to reassign, serve first)
    const sortedPlayers = [...players].sort((a, b) => {
      const flexA = a.agentPreferences?.flexRoles?.length || 0;
      const flexB = b.agentPreferences?.flexRoles?.length || 0;
      return flexA - flexB;
    });

    // First pass: assign every player who has a primaryRole directly to it — no cap.
    for (const player of sortedPlayers) {
      const primaryRole = player.agentPreferences?.primaryRole;
      if (!primaryRole) continue;

      const agent = this.selectBestAgent(
        player.agentPreferences,
        primaryRole,
        usedAgents,
        mapPreferences
      );
      assignments[player.id] = agent;
      usedAgents.add(agent);
      roleCounts[primaryRole]++;
    }

    // Second pass: remaining players (no primaryRole) — pick the flex role with the lowest
    // current count; if no flex roles, use the global lowest-count role.
    for (const player of sortedPlayers) {
      if (assignments[player.id]) continue;

      const prefs = player.agentPreferences;
      const flexRoles = prefs?.flexRoles?.length
        ? prefs.flexRoles
        : (['Initiator', 'Duelist'] as AgentRole[]);

      const lowestOverall = (): AgentRole =>
        (Object.entries(roleCounts) as [AgentRole, number][])
          .sort(([, a], [, b]) => a - b)[0][0];

      const assignedRole: AgentRole =
        flexRoles.reduce((best, role) =>
          roleCounts[role] < roleCounts[best] ? role : best
        , flexRoles[0]) ?? lowestOverall();

      const agent = this.selectBestAgent(prefs, assignedRole, usedAgents, mapPreferences);
      assignments[player.id] = agent;
      usedAgents.add(agent);
      roleCounts[assignedRole]++;
    }

    const bonus = this.calculateCompositionBonus(roleCounts);

    return {
      assignments,
      bonus,
      isValidComposition: this.isValidComposition(roleCounts),
    };
  }

  /**
   * Calculate composition bonus/penalty based on role distribution
   */
  calculateCompositionBonus(roleCounts: Record<AgentRole, number>): CompositionBonus {
    const {
      BALANCED_BONUS,
      NO_CONTROLLER_PENALTY,
      NO_INITIATOR_PENALTY,
      DOUBLE_DUELIST_BONUS,
      TRIPLE_DUELIST_PENALTY,
      TRIPLE_SENTINEL_PENALTY,
      PERFECT_COMP_BONUS,
    } = COMPOSITION_CONSTANTS;

    let modifier = 0;
    const descriptions: string[] = [];

    // Check for perfect comp (1 of each + 1 flex)
    const hasAllRoles =
      roleCounts.Duelist >= 1 &&
      roleCounts.Controller >= 1 &&
      roleCounts.Initiator >= 1 &&
      roleCounts.Sentinel >= 1;

    if (hasAllRoles && Object.values(roleCounts).every((c) => c <= 2)) {
      modifier += PERFECT_COMP_BONUS;
      descriptions.push('Well-balanced composition');
    } else if (hasAllRoles) {
      modifier += BALANCED_BONUS;
      descriptions.push('All roles covered');
    }

    // Penalties for missing key roles
    if (roleCounts.Controller === 0) {
      modifier += NO_CONTROLLER_PENALTY;
      descriptions.push('No Controller - smokes missing');
    }

    if (roleCounts.Initiator === 0) {
      modifier += NO_INITIATOR_PENALTY;
      descriptions.push('No Initiator - info gathering weak');
    }

    // Duelist count effects
    if (roleCounts.Duelist === 2) {
      modifier += DOUBLE_DUELIST_BONUS;
      descriptions.push('Double Duelist - aggressive');
    } else if (roleCounts.Duelist >= 3) {
      modifier += TRIPLE_DUELIST_PENALTY;
      descriptions.push('Too many Duelists - lacking utility');
    }

    // Sentinel overload penalty
    if (roleCounts.Sentinel >= 3) {
      modifier += TRIPLE_SENTINEL_PENALTY;
      descriptions.push('Too many Sentinels - too passive');
    }

    return {
      modifier,
      description: descriptions.join(', ') || 'Standard composition',
      roleCounts,
    };
  }

  /**
   * Check if composition is valid (has minimum required roles)
   */
  isValidComposition(roleCounts: Record<AgentRole, number>): boolean {
    // Must have at least one Controller
    if (roleCounts.Controller === 0) return false;

    // Total must be 5
    const total = Object.values(roleCounts).reduce((sum, c) => sum + c, 0);
    if (total !== 5) return false;

    return true;
  }

  /**
   * Generate default agent preferences for a player based on their stats
   */
  generateDefaultPreferences(player: Player): PlayerAgentPreferences {
    const primaryRole = this.inferRoleFromStats(player);
    const agents = this.getAgentsByRole(primaryRole);

    // Pick top 3 agents randomly from the role
    const shuffled = [...agents].sort(() => Math.random() - 0.5);
    const preferredAgents = shuffled.slice(0, 3) as [string, string, string];

    // Determine flex roles based on stats
    const flexRoles = this.inferFlexRoles(player, primaryRole);

    return {
      preferredAgents,
      primaryRole,
      flexRoles,
      agentMastery: agentMasteryEngine.getDefaultMastery(preferredAgents, primaryRole),
    };
  }

  /**
   * Select the best available agent for a player
   */
  private selectBestAgent(
    prefs: PlayerAgentPreferences | undefined,
    targetRole: AgentRole,
    usedAgents: Set<string>,
    mapPreferences: string[]
  ): string {
    const roleAgents = this.getAgentsByRole(targetRole);

    // If player has preferences, try to use them
    if (prefs) {
      for (const agent of prefs.preferredAgents) {
        if (
          !usedAgents.has(agent) &&
          this.getAgentRole(agent) === targetRole
        ) {
          return agent;
        }
      }
    }

    // Try map-preferred agents
    for (const agent of mapPreferences) {
      if (!usedAgents.has(agent) && this.getAgentRole(agent) === targetRole) {
        return agent;
      }
    }

    // Fall back to any available agent in the role
    const available = roleAgents.filter((a) => !usedAgents.has(a));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }

    // Last resort: any agent not used (shouldn't happen with proper comp)
    const allAgents = Object.keys(COMPOSITION_CONSTANTS.AGENT_ROLES);
    const anyAvailable = allAgents.filter((a) => !usedAgents.has(a));
    return anyAvailable[0] || 'Jett';
  }

  /**
   * Infer a player's primary role from their stats
   */
  public inferRoleFromStats(player: Player): AgentRole {
    const { stats } = player;

    // High entry + mechanics = Duelist
    if (stats.entry >= 70 && stats.mechanics >= 65) {
      return 'Duelist';
    }

    // High support + igl = Initiator or Controller
    if (stats.support >= 70) {
      if (stats.igl >= 60) {
        return 'Controller';
      }
      return 'Initiator';
    }

    // High lurking + clutch = Sentinel
    if (stats.lurking >= 65 && stats.clutch >= 60) {
      return 'Sentinel';
    }

    // High mental + igl = Controller
    if (stats.mental >= 70 && stats.igl >= 65) {
      return 'Controller';
    }

    // Default based on highest stat
    const roleScores: Record<AgentRole, number> = {
      Duelist: stats.entry * 0.5 + stats.mechanics * 0.5,
      Initiator: stats.support * 0.4 + stats.igl * 0.3 + stats.mental * 0.3,
      Controller: stats.igl * 0.4 + stats.mental * 0.3 + stats.support * 0.3,
      Sentinel: stats.lurking * 0.3 + stats.clutch * 0.4 + stats.mental * 0.3,
    };

    return Object.entries(roleScores)
      .sort(([, a], [, b]) => b - a)[0][0] as AgentRole;
  }

  /**
   * Infer flex roles for a player
   */
  private inferFlexRoles(player: Player, primaryRole: AgentRole): AgentRole[] {
    const { stats } = player;
    const flexRoles: AgentRole[] = [];

    // Check stat affinities for other roles
    if (primaryRole !== 'Duelist' && stats.entry >= 55 && stats.mechanics >= 55) {
      flexRoles.push('Duelist');
    }

    if (primaryRole !== 'Initiator' && stats.support >= 55) {
      flexRoles.push('Initiator');
    }

    if (primaryRole !== 'Controller' && stats.igl >= 55 && stats.mental >= 55) {
      flexRoles.push('Controller');
    }

    if (primaryRole !== 'Sentinel' && stats.clutch >= 55 && stats.lurking >= 50) {
      flexRoles.push('Sentinel');
    }

    // Return at most 2 flex roles
    return flexRoles.slice(0, 2);
  }
}

// Export singleton instance
export const compositionEngine = new CompositionEngine();
