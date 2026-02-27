// Team Strategy Types
// Configuration for team playstyle, economy, and agent compositions

/**
 * Buy type categories for economy decisions
 */
export type BuyType = 'eco' | 'half_buy' | 'force_buy' | 'full_buy';

/**
 * Valorant agent roles
 */
export type AgentRole = 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel';

/**
 * Team playstyle preferences
 */
export type PlaystyleType = 'aggressive' | 'balanced' | 'passive';

/**
 * Economy discipline level
 */
export type EconomyDiscipline = 'risky' | 'standard' | 'conservative';

/**
 * Ultimate usage style
 */
export type UltUsageStyle = 'aggressive' | 'save_for_key_rounds' | 'combo_focused';

/**
 * Team strategy configuration
 * Controls how the team plays and makes decisions
 */
export interface TeamStrategy {
  /** Aggressive = fast executes, early peeks. Passive = slow defaults, late rotates. */
  playstyle: PlaystyleType;

  /** Economy discipline affects when to eco/force/buy */
  economyDiscipline: EconomyDiscipline;

  /** Minimum credits to consider a force buy (1000-4000) */
  forceThreshold: number;

  /** How ultimates are used - aggressive, save, or combo */
  ultUsageStyle: UltUsageStyle;
}

/**
 * Player agent preferences
 * Added to Player type to track individual agent pools
 */
export interface PlayerAgentPreferences {
  /** Top 3 preferred agents in order */
  preferredAgents: [string, string, string];

  /** Primary role the player fills */
  primaryRole: AgentRole;

  /** Additional roles the player can flex to */
  flexRoles?: AgentRole[];

  /** Per-agent mastery (0–100). Earned through play. Absent keys treated as 0. */
  agentMastery?: Record<string, number>;
}

/**
 * Composition bonus result from agent selection
 */
export interface CompositionBonus {
  /** Bonus modifier (-0.15 to +0.15) */
  modifier: number;

  /** Description of the bonus/penalty */
  description: string;

  /** Role counts in the composition */
  roleCounts: Record<AgentRole, number>;
}

/**
 * Agent selection result for a team
 */
export interface AgentSelection {
  /** Player ID to agent mapping */
  assignments: Record<string, string>;

  /** Composition bonus for this selection */
  bonus: CompositionBonus;

  /** Whether all roles are adequately filled */
  isValidComposition: boolean;
}

/**
 * Composition pattern for interview conditions
 */
export type CompositionPattern =
  | 'double_duelist'
  | 'double_controller'
  | 'double_initiator'
  | 'no_controller'
  | 'no_initiator'
  | 'triple_duelist';

/**
 * Default team strategy
 */
export const DEFAULT_TEAM_STRATEGY: TeamStrategy = {
  playstyle: 'balanced',
  economyDiscipline: 'standard',
  forceThreshold: 2400,
  ultUsageStyle: 'save_for_key_rounds',
};

/**
 * AI team strategy variations by personality
 */
export const AI_STRATEGY_PRESETS: Record<string, Partial<TeamStrategy>> = {
  aggressive: {
    playstyle: 'aggressive',
    economyDiscipline: 'risky',
    forceThreshold: 1800,
    ultUsageStyle: 'aggressive',
  },
  defensive: {
    playstyle: 'passive',
    economyDiscipline: 'conservative',
    forceThreshold: 3200,
    ultUsageStyle: 'save_for_key_rounds',
  },
  tactical: {
    playstyle: 'balanced',
    economyDiscipline: 'standard',
    forceThreshold: 2400,
    ultUsageStyle: 'combo_focused',
  },
  chaotic: {
    playstyle: 'aggressive',
    economyDiscipline: 'risky',
    forceThreshold: 1500,
    ultUsageStyle: 'aggressive',
  },
};

/**
 * Match-specific strategy snapshot
 * Allows customizing strategy for a specific match before simulation
 */
export interface MatchStrategySnapshot {
  /** The match this strategy applies to */
  matchId: string;

  /** The team this strategy is for */
  teamId: string;

  /** The customized strategy */
  strategy: TeamStrategy;
}

/**
 * Get strategy name for display
 */
export function getStrategyDisplayName(strategy: TeamStrategy): string {
  const playstyleNames: Record<PlaystyleType, string> = {
    aggressive: 'Aggressive',
    balanced: 'Balanced',
    passive: 'Passive',
  };

  const disciplineNames: Record<EconomyDiscipline, string> = {
    risky: 'Risky Economy',
    standard: 'Standard Economy',
    conservative: 'Conservative Economy',
  };

  return `${playstyleNames[strategy.playstyle]} / ${disciplineNames[strategy.economyDiscipline]}`;
}

/**
 * Validate strategy values are within bounds
 */
export function validateStrategy(strategy: TeamStrategy): boolean {
  const { forceThreshold } = strategy;

  // Force threshold should be between 1000-4000
  if (forceThreshold < 1000 || forceThreshold > 4000) {
    return false;
  }

  return true;
}
