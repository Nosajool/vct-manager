// Drama System Types
// Defines narrative events, conditions, effects, and player/team dynamics

import type { PlayerContract, PlayerPersonality, PlayerStats, Region } from './player';
import type { PlayerAgentPreferences } from './strategy';
import type { SeasonPhase } from './calendar';
import type { CompositionPattern } from './strategy';
import type { MetaPatch } from './meta';
import type { MapStrengthAttributes } from './scrim';

// ============================================================================
// Basic Enums (String Union Types)
// ============================================================================

/**
 * Narrative arc categories tracked in the global collection
 * Equals DramaCategory — all 12 categories are collectible
 */
export type NarrativeCategory = DramaCategory;

/**
 * Categories of drama events that can occur
 */
export type DramaCategory =
  | 'player_ego'
  | 'team_synergy'
  | 'external_pressure'
  | 'practice_burnout'
  | 'breakthrough'
  | 'meta_rumors'
  | 'cove_incident'      // Harbor cove viral meme arc
  | 'visa_arc'           // all visa drama arc events
  | 'coaching_overhaul'  // all coaching overhaul arc events
  | 'igl_crisis'         // all IGL crisis arc events
  | 'scrim_sharing'      // scrim VOD leak scandal arc
  | 'org_culture'        // org wealth / chicken nugget arc
  | 'tournament_drama'   // bracket-specific tournament interviews
  | 'map_pool'           // map pool narrative events
  | 'financial_stress'   // org financial pressure arc
  | 'iconic_moments'    // in-game moments that mirror famous VCT plays
  | 'coaching_beef'    // coach-to-coach feud arc
  | 'free_agent_pursuit' // free agent interest and recruitment arc
  | 'player_conflict'; // team chemistry breakdown and player conflict arc

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
  | 'flag_not_active'
  | 'recent_event_count'

  // Player archetype checks
  | 'player_personality'       // Player matches a specific personality archetype
  | 'player_contract_expiring' // Player contract years remaining <= threshold

  // Tournament bracket checks (Phase 1)
  | 'bracket_position'   // Check upper/lower bracket; uses bracketPosition field
  | 'elimination_risk'   // Team faces elimination with next loss
  | 'tournament_eliminated' // Team has been eliminated from the active tournament
  | 'tournament_type'    // Check the active tournament's type; uses tournamentType field

  // Interview-context checks (populated on InterviewSnapshot, not DramaGameStateSnapshot)
  | 'is_playoff_match'   // True when the current match is a playoff match
  | 'has_rivalry'        // True when the player team has an active rivalry with the opponent
  | 'is_grand_final'     // True when the current match is the grand final
  | 'opponent_from_upper' // True when the opponent dropped from the upper bracket
  | 'opponent_win_streak' // True when opponent's recent win streak >= minStreak (default 1)
  | 'opponent_rivalry_level' // True when opponent's rivalry intensity >= minLevel (default 50)

  // Logical grouping
  | 'or'                 // At least one condition in anyOf must pass

  // Scrim history checks
  | 'scrim_count_min'      // Team has completed at least N total scrims
  | 'scrim_vod_risk_above' // Max vodLeakRisk across all scrim partners > threshold
  | 'no_recent_match'      // No match played within threshold days (default 1)

  // Season timing checks
  | 'min_season_day'    // Season day >= threshold (day 1 = first day of season)

  // Player origin checks
  | 'player_is_import'           // Any player's home region differs from the team's league region
  | 'player_on_active_roster'    // Player is on the active (non-reserve) roster

  // Free agent checks
  | 'player_is_free_agent'           // Any player with teamId === null exists
  | 'free_agent_interest_above'      // Any tracked free agent interest > threshold
  | 'free_agent_interest_below'      // Any tracked free agent interest < threshold

  // Random chance
  | 'random_chance'

  // Team budget checks
  | 'team_budget_below'           // Team balance < threshold
  | 'team_budget_above'           // Team balance > threshold

  // Agent composition / strategy checks (populated on InterviewSnapshot)
  | 'composition_type'            // Checks role distribution in last match
  | 'player_off_preferred_agent'  // At least one player played outside their top-3
  | 'agent_played'                // A specific agent was played in the last match
  | 'map_played'                  // A specific map was played in the last match
  | 'team_playstyle'              // Checks team strategy playstyle
  | 'team_economy_discipline'     // Checks team economy discipline

  // Meta patch checks
  | 'agent_is_meta_nerfed'        // Star player's preferred agents include a nerfed agent

  // Map pool checks (populated on InterviewSnapshot)
  | 'map_pool_played_weak_map'    // Last match included one of team's banPriority maps
  | 'map_pool_played_strong_map'  // Last match included one of team's strongestMaps
  | 'map_pool_overall_below'      // Team's average map pool strength < threshold (default 45)
  | 'map_pool_has_scrim_data'     // A played map has recent scrim practice (last 4 weeks)
  | 'map_pool_attribute_below'    // A played map's specific attribute < threshold (default 40)

  // Financial stress checks
  | 'consecutive_negative_months_above'  // consecutiveNegativeMonths >= threshold

  // Agent mastery checks
  | 'player_agent_mastery_below'         // player's mastery on preferred agent < threshold
  | 'player_agent_mastery_above'         // player's mastery on preferred agent >= threshold
  | 'player_signature_agent_streak'      // player has N+ consecutive appearances on same agent
  | 'team_avg_mastery_below'             // team avg mastery on current comp < threshold

  // Downtime checks
  | 'team_in_downtime';                  // Team is not in any active tournament

/**
 * Player selection method for condition evaluation
 */
export type PlayerSelector =
  | 'all'             // All players must match
  | 'any'             // Any player matches
  | 'specific'        // Specific player by ID
  | 'star_player'     // Highest rated player
  | 'lowest_morale'   // Player with lowest morale
  | 'newest'          // Most recently signed player
  | 'random'          // Random player from team
  | 'condition_match' // Pick a random player who satisfies this condition's own filter
  | 'igl_player';     // Team's designated IGL player

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
  bracketPosition?: 'upper' | 'middle' | 'lower'; // Used with bracket_position type

  // For tournament_type check
  tournamentType?: string; // Used with tournament_type type (e.g. 'kickoff', 'masters')

  // For opponent_win_streak check
  minStreak?: number; // Minimum win streak required (used with opponent_win_streak type)

  // For opponent_rivalry_level check
  minLevel?: number; // Minimum rivalry level required (used with opponent_rivalry_level type)

  // For 'or' type: at least one sub-condition must pass
  anyOf?: DramaCondition[];

  // For composition_type check
  compositionPattern?: CompositionPattern;

  // For agent_played check (interview-only)
  agentName?: string;  // e.g. 'Harbor'

  // For map_played check (interview-only)
  mapName?: string;    // e.g. 'Sunset'

  // For team_playstyle check
  playstyle?: 'aggressive' | 'balanced' | 'passive';

  // For team_economy_discipline check
  economyDiscipline?: 'risky' | 'standard' | 'conservative';

  // For map pool checks
  mapPoolThreshold?: number;                        // Used with map_pool_overall_below and map_pool_attribute_below
  mapPoolAttribute?: keyof MapStrengthAttributes;  // Used with map_pool_attribute_below

  // For agent mastery checks
  masteryThreshold?: number;  // Used with player_agent_mastery_below/above, team_avg_mastery_below
  streakThreshold?: number;   // Used with player_signature_agent_streak
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
  | 'release_player'   // Release a player: remove from team and make free agent

  // State modifications
  | 'set_flag'
  | 'clear_flag'
  | 'add_cooldown'

  // Event chain
  | 'trigger_event'
  | 'escalate_event'

  // Free agent interest
  | 'free_agent_interest'

  // Contract extension
  | 'player_contract_extension'; // Extends player contract with years + salary raise

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

  // For free agent interest
  interestDelta?: number;

  // For player_contract_extension
  contractYearsToAdd?: number;      // Years to add to remaining contract (e.g. 2)
  contractSalaryMultiplier?: number; // Salary multiplier applied (e.g. 1.5 = +50%)
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
  triggerDelay?: number;  // Days to wait before triggering the follow-up event
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

  // Flag-driven probability boosts
  probabilityBoostedBy?: Array<{
    flag: string;    // supports {playerId} patterns, e.g. 'visa_expedited_{playerId}'
    boost: number;   // flat addition to probability (0-100)
  }>;

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

  // Collection tracking: true when this templateId was seen for the first time globally
  isNew?: boolean;

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
    agentPreferences?: PlayerAgentPreferences;
    isActive?: boolean;     // true = active roster, false = reserve
  }>;

  // Active meta patch (null if no patch has fired yet)
  activePatch?: MetaPatch | null;

  playerTeamRegion?: Region;  // The team's (league) region
  iglPlayerId?: string;       // Team's designated IGL player ID
  teamBudget?: number;        // Team's current financial balance
  teamFinances?: {
    consecutiveNegativeMonths: number;
  };

  // Recent match results
  recentMatchResults?: Array<{
    matchId: string;
    date: string;           // ISO date string
    won: boolean;
    teamId: string;
  }>;

  // Scrim history
  scrimCount?: number;        // Total number of completed scrims
  maxVodLeakRisk?: number;    // Highest vodLeakRisk across all scrim partners (0–100)

  // Drama state
  dramaState: DramaState;

  // Tournament context (Phase 1 — populated when team is in a tournament bracket)
  tournamentContext?: {
    bracketPosition: 'upper' | 'middle' | 'lower' | null;
    eliminationRisk: boolean;
    isGrandFinal: boolean;
    isEliminated?: boolean;   // true if team has no remaining matches (was eliminated)
    tournamentType?: string;  // 'kickoff' | 'stage1' | 'stage2' | 'masters' | 'champions'
    opponent?: {
      droppedFromUpper: boolean;
      recentWinStreak: number;
      rivalryLevel: number;
    }; // Populated in interview context
  };

  // Optional fields populated in interview context (InterviewSnapshot extends this)
  isPlayoffMatch?: boolean;
  hasRivalry?: boolean;

  // Free agent interest scores for tracked free agents
  freeAgentInterests?: Record<string, number>;

  // Downtime state
  isInDowntime?: boolean;   // true when team is not in any active tournament
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
  cooldownDefaults: {
    player_ego: 3,
    team_synergy: 3,
    external_pressure: 3,
    practice_burnout: 3,
    breakthrough: 3,
    meta_rumors: 3,          // Unchanged
    cove_incident: 3,       // Aligned with cooldownDays on the event
    visa_arc: 3,             // Short: arc is flag-chained, not random
    coaching_overhaul: 3,    // Short: arc events are flag-gated
    igl_crisis: 3,           // Short: arc events are flag-gated
    scrim_sharing: 3,       // Distinct arc, no cross-bleed with external_pressure
    org_culture: 3,          // Short: arc events are flag-gated
    tournament_drama: 3,     // Short: bracket-specific, tournament-gated
    map_pool: 3,             // Map pool events, match-gated
    financial_stress: 14,    // Financial stress arc events — longer cooldown
    iconic_moments: 3,       // Iconic moment events — short: flag-gated by post-match detection
    coaching_beef: 3,        // Coach-to-coach feud arc — short: flag-gated
    free_agent_pursuit: 3,   // Free agent interest and recruitment arc
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
