// Drama System Types
// Defines narrative events, conditions, effects, and player/team dynamics

import type { PlayerContract, PlayerPersonality, PlayerStats, Region } from './player';
import type { SeasonPhase } from './calendar';

// ============================================================================
// Basic Enums (String Union Types)
// ============================================================================

/**
 * Categories of drama events that can occur
 */
export type DramaCategory =
  | 'player_ego'
  | 'team_synergy'
  | 'external_pressure'
  | 'practice_burnout'
  | 'breakthrough'
  | 'meta_rumors';

/**
 * Severity level of drama events
 * - minor: Shown as toasts, auto-resolve or have simple effects
 * - major: Shown as modals, require player decisions
 */
export type DramaSeverity = 'minor' | 'major';

/**
 * Current status of a drama event instance
 */
export type DramaEventStatus =
  | 'pending'    // Scheduled to trigger but hasn't yet
  | 'active'     // Currently active and affecting gameplay
  | 'resolved'   // Completed naturally or via player choice
  | 'escalated'  // Escalated to a more severe event
  | 'expired';   // Timed out without resolution

// ============================================================================
// Condition System
// ============================================================================

/**
 * Types of conditions that can trigger drama events
 */
export type DramaConditionType =
  // Player stat checks
  | 'player_stat_below'
  | 'player_stat_above'
  | 'player_morale_below'
  | 'player_morale_above'
  | 'player_form_below'
  | 'player_form_above'

  // Team state checks
  | 'team_chemistry_below'
  | 'team_chemistry_above'
  | 'team_win_streak'
  | 'team_loss_streak'

  // Game state checks
  | 'season_phase'
  | 'tournament_active'
  | 'match_result'
  | 'player_injured'

  // Drama state checks
  | 'category_on_cooldown'
  | 'flag_active'
  | 'recent_event_count'

  // Player archetype checks
  | 'player_personality'       // Player matches a specific personality archetype
  | 'player_contract_expiring' // Player contract years remaining <= threshold

  // Tournament bracket checks (Phase 1)
  | 'bracket_position'   // Check upper/lower bracket; uses bracketPosition field
  | 'elimination_risk'   // Team faces elimination with next loss

  // Scrim history checks
  | 'scrim_count_min'   // Team has completed at least N total scrims
  | 'no_recent_match'   // No match played within threshold days (default 1)

  // Season timing checks
  | 'min_season_day'    // Season day >= threshold (day 1 = first day of season)

  // Player origin checks
  | 'player_is_import'  // Any player's home region differs from the team's league region

  // Random chance
  | 'random_chance';

/**
 * Player selection method for condition evaluation
 */
export type PlayerSelector =
  | 'all'           // All players must match
  | 'any'           // Any player matches
  | 'specific'      // Specific player by ID
  | 'star_player'   // Highest rated player
  | 'lowest_morale' // Player with lowest morale
  | 'newest'        // Most recently signed player
  | 'random';       // Random player from team

/**
 * Condition that must be met for a drama event to trigger
 */
export interface DramaCondition {
  type: DramaConditionType;

  // For stat checks
  stat?: keyof PlayerStats;
  threshold?: number;

  // For categorical checks
  category?: DramaCategory;
  phase?: SeasonPhase;

  // For flag checks
  flag?: string;

  // For random chance (0-100)
  chance?: number;

  // For streak checks
  streakLength?: number;

  // For player-specific conditions
  playerSelector?: PlayerSelector;
  playerId?: string; // Used with 'specific' selector

  // For personality check
  personality?: PlayerPersonality; // Used with player_personality type

  // For contract expiry check
  contractYearsThreshold?: number; // Used with player_contract_expiring (default: 1)

  // For bracket_position check
  bracketPosition?: 'upper' | 'lower'; // Used with bracket_position type
}

// ============================================================================
// Effect System
// ============================================================================

/**
 * Targets that drama effects can modify
 */
export type DramaEffectTarget =
  // Player modifications
  | 'player_morale'
  | 'player_form'
  | 'player_stat'

  // Team modifications
  | 'team_chemistry'
  | 'team_budget'
  | 'team_hype'
  | 'team_sponsor_trust'

  // Roster position changes
  | 'move_to_reserve'  // Bench a player: removes from active, adds to reserve
  | 'move_to_active'   // Return a player: removes from reserve, adds to active

  // State modifications
  | 'set_flag'
  | 'clear_flag'
  | 'add_cooldown'

  // Event chain
  | 'trigger_event'
  | 'escalate_event';

/**
 * Player selector for effects (extended for effect resolution needs)
 */
export type EffectPlayerSelector =
  | 'triggering'      // First player in involvedPlayerIds
  | 'all'             // All players in snapshot (alias for all_team)
  | 'all_team'        // All players in snapshot
  | 'random_teammate' // Random player excluding triggering player
  | 'specific'        // Specific player by ID
  | 'star_player'     // Highest rated player
  | 'random'          // Random player from team
  | 'any';            // Random player (resolved from involvedPlayerIds)

/**
 * Effect that modifies game state when drama events occur
 */
export interface DramaEffect {
  target: DramaEffectTarget;

  // Player targeting
  effectPlayerSelector?: EffectPlayerSelector;
  playerId?: string; // Used with 'specific' selector

  // For stat/value modifications
  stat?: keyof PlayerStats | 'morale' | 'form' | 'chemistry' | 'budget';
  delta?: number;         // Relative change (+/-)
  absoluteValue?: number; // Set to exact value

  // For flag operations
  flag?: string;
  flagDuration?: number; // Days until flag expires

  // For event chaining
  eventTemplateId?: string;
  escalationTemplateId?: string;
}

// ============================================================================
// Event Templates & Instances
// ============================================================================

/**
 * Player choice in response to a major drama event
 */
export interface DramaChoice {
  id: string;
  text: string;              // Choice text shown to player
  description?: string;      // Tooltip or additional context

  // Effects of choosing this option
  effects: DramaEffect[];

  // Narrative outcome shown after choice
  outcomeText: string;

  // Optional follow-up event
  triggersEventId?: string;
}

/**
 * Template definition for a drama event type
 * These are defined in the event catalog and instantiated when triggered
 */
export interface DramaEventTemplate {
  id: string;
  category: DramaCategory;
  severity: DramaSeverity;

  // Display
  title: string;
  description: string;      // Event description with {player} placeholders

  // Triggering
  conditions: DramaCondition[];
  probability: number;      // 0-100: Base probability if conditions met

  // Effects (for minor events or automatic major events)
  effects?: DramaEffect[];

  // Choices (for major events requiring player decision)
  choices?: DramaChoice[];

  // Auto-resolution
  durationDays?: number;    // Auto-resolve after N days
  autoResolveEffects?: DramaEffect[];

  // Escalation
  escalateDays?: number;    // Days until escalation if unresolved
  escalationTemplateId?: string;

  // Meta
  cooldownDays?: number;    // Cooldown before this template can trigger again
  oncePerSeason?: boolean;  // Can only trigger once per season
  requiresPlayerTeam?: boolean; // Only triggers for player's team
}

/**
 * Active or historical instance of a drama event
 */
export interface DramaEventInstance {
  id: string;
  templateId: string;
  status: DramaEventStatus;

  // Context
  category: DramaCategory;
  severity: DramaSeverity;
  teamId: string;
  affectedPlayerIds?: string[]; // Players involved in this event

  // Timing
  triggeredDate: string;    // ISO date string
  resolvedDate?: string;    // ISO date string
  expiresDate?: string;     // ISO date string

  // Resolution
  chosenOptionId?: string;  // Which choice was selected (major events)
  appliedEffects: DramaEffect[]; // Effects that were applied
  outcomeText?: string;     // Narrative outcome shown to player

  // State tracking
  escalated?: boolean;
  escalatedToEventId?: string;
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Global drama state stored in game store
 */
export interface DramaState {
  // Active events affecting gameplay
  activeEvents: DramaEventInstance[];

  // Historical events for narrative continuity
  eventHistory: DramaEventInstance[];

  // Active flags set by events
  activeFlags: Record<string, {
    setDate: string;      // ISO date string
    expiresDate?: string; // ISO date string
    value?: any;          // Optional flag payload
  }>;

  // Category cooldowns
  cooldowns: Record<DramaCategory, string | null>; // ISO date string when cooldown expires
}

/**
 * Complete snapshot of game state for condition evaluation
 */
export interface DramaGameStateSnapshot {
  // Time
  currentDate: string;      // ISO date string
  currentSeason: number;
  currentPhase: SeasonPhase;

  // Player's team
  playerTeamId: string;
  playerTeamChemistry: number; // 0-100

  // Players
  players: Array<{
    id: string;
    name: string;
    teamId: string | null;
    stats: PlayerStats;
    morale: number;         // 0-100
    form: number;           // 0-100
    contract?: PlayerContract | null;
    personality?: PlayerPersonality;
    region?: Region;        // Player's home region (for import detection)
  }>;

  playerTeamRegion?: Region;  // The team's (league) region

  // Recent match results
  recentMatchResults?: Array<{
    matchId: string;
    date: string;           // ISO date string
    won: boolean;
    teamId: string;
  }>;

  // Scrim history
  scrimCount?: number;   // Total number of completed scrims

  // Drama state
  dramaState: DramaState;

  // Tournament context (Phase 1 — populated when team is in a tournament bracket)
  tournamentContext?: {
    bracketPosition: 'upper' | 'lower' | null;
    eliminationRisk: boolean;
    isGrandFinal: boolean;
  };
}

/**
 * Result of evaluating drama triggers for the current day
 */
export interface DramaEvaluationResult {
  // Events that should trigger
  triggeredEvents: Array<{
    templateId: string;
    category: DramaCategory;
    severity: DramaSeverity;
    affectedPlayerIds?: string[];
  }>;

  // Events that expired
  expiredEventIds: string[];

  // Events that escalated
  escalatedEvents: Array<{
    fromEventId: string;
    toTemplateId: string;
  }>;

  // Cooldowns updated
  cooldownsSet: Array<{
    category: DramaCategory;
    expiresDate: string;    // ISO date string
  }>;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Configuration constants for the drama system
 */
export const DRAMA_CONSTANTS = {
  // Cadence control limits (aligned with DramaEngine.ts)
  cadenceLimits: {
    minorEventsPerWeek: 5,        // Max 5 minor events per week
    majorEventIntervalDays: 2,    // Min 2 days between major events
    maxEventsPerDay: 3,            // Max 3 events per day total
    categoryBoostDays: 5,          // Boost probability if category hasn't fired in 5+ days
    categoryBoostMultiplier: 2.0,  // Probability multiplier for boost
  },

  // Event frequency targets (events per phase)
  frequencyTargets: {
    minor: 5,  // Target 5 minor events per phase (increased from 2)
    major: 3,  // Target 3 major events per phase (increased from 1)
  },

  // Default escalation timeframes
  escalationDefaults: {
    minor: 7,   // Minor events escalate after 7 days
    major: 14,  // Major events escalate after 14 days
  },

  // History retention
  historyLimits: {
    maxEvents: 50,          // Keep last 50 historical events
    minDaysToRetain: 180,   // Always keep events from last 180 days
  },

  // Default cooldown periods per category (in days)
  // Reduced from 14-30 days to 5-10 days to increase event frequency
  cooldownDefaults: {
    player_ego: 7,          // Reduced from 14
    team_synergy: 7,        // Reduced from 21
    external_pressure: 10,  // Reduced from 14
    practice_burnout: 5,    // Reduced from 28
    breakthrough: 7,        // Reduced from 30
    meta_rumors: 7,         // Unchanged
  },

  // Effect magnitude defaults
  effectDefaults: {
    minorMoraleChange: 5,   // +/- 5 morale for minor events
    majorMoraleChange: 15,  // +/- 15 morale for major events
    minorStatChange: 2,     // +/- 2 stat points for minor events
    majorStatChange: 5,     // +/- 5 stat points for major events
    chemistryChange: 3,     // +/- 3 chemistry for team events
  },
} as const;
