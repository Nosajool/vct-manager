// Scrim System Types
// Advanced training system for team practice matches

import type { Region } from './player';
import type { MapResult } from './match';

// ============================================
// Team Tier System
// ============================================

export type TeamTier = 'T1' | 'T2' | 'T3';

/**
 * Tier team - Used for T2/T3 scrim partners
 * These are full entities with actual players from the free agent pool
 */
export interface TierTeam {
  id: string;
  name: string;
  region: Region;
  tier: TeamTier;
  playerIds: string[]; // Full player entities for T2/T3
  mapStrengths: MapPoolStrength;
  averageOverall: number; // 60-70 for T2, 45-60 for T3
}

// ============================================
// Scrim Relationship System
// ============================================

/**
 * Relationship with a scrim partner
 * Higher relationship = better scrim efficiency
 */
export interface ScrimRelationship {
  teamId: string; // Partner team ID
  tier: TeamTier;
  relationshipScore: number; // 0-100 (base: same region=50, cross-region=20)
  lastScrimDate: string | null;
  totalScrims: number;
  vodLeakRisk: number; // 0-100, increases with scrims
}

/**
 * Types of events that can affect scrim relationships
 */
export type RelationshipEventType =
  | 'vod_leak' // VOD leaked to opponent (-30 relationship)
  | 'strat_leak' // Strategy leaked before tournament (-20)
  | 'positive_feedback' // Good scrim partner (+10)
  | 'unprofessional' // Team was unprofessional (-15)
  | 'scheduling_issue' // Team cancelled last minute (-5)
  | 'rivalry_game'; // Intense rivalry match (+5 excitement, -5 trust)

/**
 * An event that affected a scrim relationship
 */
export interface RelationshipEvent {
  id: string;
  date: string;
  type: RelationshipEventType;
  partnerTeamId: string;
  partnerTeamName: string;
  description: string;
  relationshipChange: number;
  affectsAllTeams?: boolean; // Some events affect reputation broadly
}

// ============================================
// Map Pool Strength System
// ============================================

/**
 * Six attributes that define proficiency on a map
 */
export interface MapStrengthAttributes {
  executes: number; // 0-100: Site takes and set plays
  retakes: number; // 0-100: Defensive recovery plays
  utility: number; // 0-100: Smoke lineups, molly spots
  communication: number; // 0-100: Callouts and coordination
  mapControl: number; // 0-100: Mid control, lurks, map reads
  antiStrat: number; // 0-100: Counter-strategies vs opponents
}

/**
 * Strength profile for a single map
 */
export interface MapStrength {
  mapName: string;
  attributes: MapStrengthAttributes;
  lastPracticedDate: string | null;
  totalPracticeHours: number; // Cumulative
  decayRate: number; // How fast this map decays (based on practice frequency)
}

/**
 * A team's overall map pool
 */
export interface MapPoolStrength {
  maps: Record<string, MapStrength>; // mapName -> MapStrength
  strongestMaps: string[]; // Top 3 maps by overall strength
  banPriority: string[]; // Maps to ban (weakest 2)
}

// ============================================
// Scrim Session Types
// ============================================

export type ScrimFormat = 'single_map' | 'best_of_3' | 'map_rotation';

export type ScrimIntensity = 'light' | 'moderate' | 'competitive';

/**
 * Options for scheduling a scrim
 */
export interface ScrimOptions {
  partnerTeamId: string;
  format: ScrimFormat;
  focusMaps?: string[]; // Specific maps to practice (optional)
  focusAttributes?: (keyof MapStrengthAttributes)[]; // Focus areas
  intensity: ScrimIntensity;
}

/**
 * Result of a completed scrim session
 */
export interface ScrimResult {
  id: string;
  date: string;
  playerTeamId: string;
  partnerTeamId: string;
  partnerTeamName: string;
  partnerTier: TeamTier;

  // Match Results
  maps: MapResult[];
  overallWinner: string; // teamId

  // Improvements
  mapImprovements: Record<string, Partial<MapStrengthAttributes>>;
  chemistryChange: number;
  pairChemistryChanges: Record<string, Record<string, number>>; // playerId -> playerId -> change

  // Relationship
  relationshipChange: number;
  relationshipEvent?: RelationshipEvent;

  // Efficiency factors
  efficiencyMultiplier: number; // Based on partner tier, relationship

  // Time cost
  duration: number; // hours

  // Snapshot of values before scrim (for "old → new" display)
  chemistryBefore: number;
  relationshipBefore: number;
  mapStatsBefore: Record<string, MapStrengthAttributes>;  // mapName -> attributes snapshot
}

// ============================================
// Scrim Eligibility
// ============================================

/**
 * Result of scrim eligibility check
 */
export interface ScrimEligibilityCheck {
  canScrim: boolean;
  reason?: string;
  failedChecks: Array<'match_day' | 'player_count' | 'cross_region'>;
}

// ============================================
// Scrim Constants
// ============================================

export const SCRIM_CONSTANTS = {
  // Efficiency multipliers by tier
  TIER_EFFICIENCY: {
    T1: 1.0, // Full efficiency
    T2: 0.7, // 70% efficiency
    T3: 0.4, // 40% efficiency
  } as const,

  // Base relationship scores
  BASE_RELATIONSHIP: {
    SAME_REGION: 50,
    CROSS_REGION: 20,
  } as const,

  // Relationship event impacts
  RELATIONSHIP_EVENTS: {
    vod_leak: -30,
    strat_leak: -20,
    positive_feedback: 10,
    unprofessional: -15,
    scheduling_issue: -5,
    rivalry_game: -5,
  } as const,

  // Map decay rate per week unpracticed
  MAP_DECAY_RATE: 0.02,

  // Maximum map attribute value
  MAX_MAP_ATTRIBUTE: 85,

  // Map strength bonus in matches (max 15%)
  MAX_MAP_BONUS: 0.15,
} as const;
