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
   * Fallback method to create a default agent selection when no defaultComposition is provided
   * Uses a balanced 2-1-1-1 composition (2 Duelists, 1 Initiator, 1 Controller, 1 Sentinel)
   */
  private getDefaultAgentSelection(
    players: Player[],
    mapName: string
  ): AgentSelection {
    const assignments: Record<string, string> = {};
    const usedAgents = new Set<string>();
    
    // Default balanced composition: 2-1-1-1
    const fallbackComposition = {
      Duelist: 2,
      Initiator: 1,
      Controller: 1,
      Sentinel: 1,
    };

    // Sort players by their agent preferences
    const sortedPlayers = [...players].sort((a, b) => {
      const prefA = a.agentPreferences?.preferredAgents[0] || '';
      const prefB = b.agentPreferences?.preferredAgents[0] || '';
      return prefA.localeCompare(prefB);
    });

    // Get map-preferred agents
    const mapPreferences = MAP_AGENT_PREFERENCES[mapName] || [];

    // Assign agents following the fallback composition
    for (const [role, count] of Object.entries(fallbackComposition) as [AgentRole, number][]) {
      let assigned = 0;
      
      for (const player of sortedPlayers) {
        if (assignments[player.id]) continue;
        if (assigned >= count) break;

        const preferredAgents = player.agentPreferences?.preferredAgents || [];
        const flexRoles = player.agentPreferences?.flexRoles || [role];
        
        // Try to assign player's preferred agent if it fits the role and is available
        for (const pref of preferredAgents) {
          const prefRole = this.getAgentRole(pref);
          if (prefRole === role && !usedAgents.has(pref)) {
            assignments[player.id] = pref;
            usedAgents.add(pref);
            assigned++;
            break;
          }
        }

        // Try to assign a map-preferred agent for this role
        if (assigned < count) {
          for (const agent of mapPreferences) {
            if (this.getAgentRole(agent) === role &&
                !usedAgents.has(agent) &&
                flexRoles.includes(role)) {
              assignments[player.id] = agent;
              usedAgents.add(agent);
              assigned++;
              break;
            }
          }
        }

        // If still not assigned, pick any available agent for this role
        if (assigned < count) {
          const availableAgents = COMPOSITION_CONSTANTS.AGENTS_BY_ROLE[role]
            .filter(agent => !usedAgents.has(agent));
          
          if (availableAgents.length > 0) {
            const agent = availableAgents[0];
            assignments[player.id] = agent;
            usedAgents.add(agent);
            assigned++;
          }
        }
      }
    }

    // Assign remaining players with any available agents
    for (const player of sortedPlayers) {
      if (assignments[player.id]) continue;
      
      const preferredAgents = player.agentPreferences?.preferredAgents || [];
      for (const pref of preferredAgents) {
        if (!usedAgents.has(pref)) {
          assignments[player.id] = pref;
          usedAgents.add(pref);
          break;
        }
      }
      
      // If still not assigned, pick first available agent
      if (!assignments[player.id]) {
        const allAgents = Object.values(COMPOSITION_CONSTANTS.AGENT_ROLES);
        for (const agent of allAgents) {
          if (!usedAgents.has(agent)) {
            assignments[player.id] = agent;
            usedAgents.add(agent);
            break;
          }
        }
      }
    }

    // Calculate role counts for the result
    const roleCounts: Record<AgentRole, number> = {
      Duelist: 0,
      Initiator: 0,
      Controller: 0,
      Sentinel: 0,
    };

    Object.values(assignments).forEach(agent => {
      const role = this.getAgentRole(agent);
      if (role && role in roleCounts) {
        roleCounts[role]++;
      }
    });

    return {
      assignments,
      bonus: {
        modifier: 0,
        description: 'Default fallback composition (2-1-1-1)',
        roleCounts,
      },
      isValidComposition: true,
    };
  }

  /**
   * Get all agents that can play a specific role
   */
  getAgentsByRole(role: AgentRole): string[] {
    return [...COMPOSITION_CONSTANTS.AGENTS_BY_ROLE[role]];
  }

  /**
   * Select agents for a team based on player preferences and strategy
   */
  selectAgents(
    players: Player[],
    strategy: TeamStrategy,
    mapName: string
  ): AgentSelection {
    const assignments: Record<string, string> = {};
    const usedAgents = new Set<string>();

    // Sort players by their role flexibility (less flexible first)
    const sortedPlayers = [...players].sort((a, b) => {
      const flexA = a.agentPreferences?.flexRoles?.length || 0;
      const flexB = b.agentPreferences?.flexRoles?.length || 0;
      return flexA - flexB;
    });

    // Track role counts to meet composition requirements
    const roleCounts: Record<AgentRole, number> = {
      Duelist: 0,
      Initiator: 0,
      Controller: 0,
      Sentinel: 0,
    };

    // Safety check for strategy
    if (!strategy) {
      throw new Error('TeamStrategy is required');
    }
    
    // Safety check for strategy
    if (!strategy) {
      throw new Error('TeamStrategy is required');
    }
    
    // Extract defaultComposition safely
    const { defaultComposition } = strategy;
    if (!defaultComposition) {
      return this.getDefaultAgentSelection(players, mapName);
    }
    
    const mapPreferences = MAP_AGENT_PREFERENCES[mapName] || [];

    // Second pass: fill remaining players with flex roles
    for (const player of sortedPlayers) {
      if (assignments[player.id]) continue;

      const prefs = player.agentPreferences;
      const flexRoles = prefs?.flexRoles || ['Initiator', 'Duelist'] as AgentRole[];

      // Find a role that still needs filling
      let assignedRole: AgentRole | null = null;
      for (const role of flexRoles) {
        // Ensure consistent role comparison
        const roleKey = role as keyof typeof defaultComposition;
        const needed = defaultComposition?.[roleKey] || 0;
        if (roleCounts[role] < needed) {
          assignedRole = role;
          break;
        }
      }

      // If no flex role needed, fill any remaining role
      if (!assignedRole) {
        for (const [role, count] of Object.entries(roleCounts)) {
          const needed = defaultComposition[role.toLowerCase() as keyof typeof defaultComposition] || 0;
          if (count < needed) {
            assignedRole = role as AgentRole;
            break;
          }
        }
      }

      // Still nothing? Pick based on team needs
      if (!assignedRole) {
        // Default to lowest count role
        assignedRole = (Object.entries(roleCounts)
          .sort(([, a], [, b]) => a - b)[0][0] as AgentRole);
      }

      const agent = this.selectBestAgent(
        prefs,
        assignedRole,
        usedAgents,
        mapPreferences
      );

      assignments[player.id] = agent;
      usedAgents.add(agent);
      roleCounts[assignedRole]++;
    }

    // Calculate composition bonus
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
  private inferRoleFromStats(player: Player): AgentRole {
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
