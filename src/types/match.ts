// Match System Types
// Based on VCT Manager Technical Specification

import type { BuyType } from './strategy';
import type { TimelineEvent, BuyPhaseResult } from './round-simulation';

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed';

/**
 * Win conditions for a round
 */
export type WinCondition = 'elimination' | 'spike_defused' | 'spike_detonated' | 'time_expired';

/**
 * Team economy state during a round
 */
export interface TeamEconomy {
  /** Current credits available */
  credits: number;
  /** Type of buy this round */
  buyType: BuyType;
  /** Consecutive rounds lost (for loss bonus calculation) */
  roundsLost: number;
}

/**
 * Player ultimate state tracking
 */
export interface PlayerUltState {
  playerId: string;
  agent: string;
  /** Current ult points */
  currentPoints: number;
  /** Points needed for ult */
  requiredPoints: number;
  /** Whether ult is ready to use */
  isReady: boolean;
}

/**
 * First blood information for a round
 */
export interface FirstBlood {
  killerId: string;
  victimId: string;
  side: 'teamA' | 'teamB';
}

/**
 * Clutch attempt information
 */
export interface ClutchAttempt {
  playerId: string;
  situation: '1v1' | '1v2' | '1v3' | '1v4' | '1v5';
  won: boolean;
}

/**
 * Ultimate usage in a round
 */
export interface UltUsage {
  playerId: string;
  agent: string;
}

// ============================================
// ROUND EVENT TYPES (for timeline display)
// ============================================

/**
 * Round event type discriminator
 */
export type RoundEventType =
  | 'damage'
  | 'kill'
  | 'plant'
  | 'defuse'
  | 'trade_kill'
  | 'plant_start'
  | 'plant_interrupt'
  | 'plant_complete'
  | 'defuse_start'
  | 'defuse_interrupt'
  | 'defuse_complete'
  | 'spike_drop'
  | 'spike_pickup'
  | 'spike_detonation'
  | 'ability_use'
  | 'heal'
  | 'round_end';

/**
 * Kill event for timeline display
 */
export interface KillEvent {
  id: string;
  type: 'kill';
  killerId: string;
  victimId: string;
  weapon: string;
  isHeadshot: boolean;
  timestamp: number;
  /** Total damage dealt that resulted in this kill */
  damage: number;
}

/**
 * Plant event for timeline display
 */
export interface PlantEvent {
  id: string;
  type: 'plant';
  planterId: string;
  site: 'A' | 'B';
  timestamp: number;
}

/**
 * Defuse event for timeline display
 */
export interface DefuseEvent {
  id: string;
  type: 'defuse';
  defuserId: string;
  timestamp: number;
}

/**
 * Union type for all round events
 * Includes both legacy events and new timeline events from round-simulation
 */
export type RoundEvent =
  | (DamageEvent & { type: 'damage' })
  | KillEvent
  | PlantEvent
  | DefuseEvent;

// ============================================
// DAMAGE EVENT TRACKING TYPES
// ============================================

/**
 * Hit location for damage calculation
 */
export type HitLocation = 'head' | 'body' | 'leg';

/**
 * Damage source types
 */
export type DamageSource = 'weapon' | 'ability' | 'melee' | 'utility' | 'environment';

/**
 * Weapon damage profile with range-based damage
 */
export interface WeaponProfile {
  name: string;
  category: 'rifle' | 'smg' | 'sniper' | 'shotgun' | 'heavy' | 'sidearm' | 'melee';
  cost: number;
  damageRanges: {
    minDistance: number;
    maxDistance: number;
    head: number;
    body: number;
    leg: number;
  }[];
}

/**
 * Armor damage breakdown for tracking shield vs HP damage
 */
export interface ArmorDamageBreakdown {
  /** Damage absorbed by shield */
  shieldDamage: number;
  /** Damage dealt to player HP */
  hpDamage: number;
  /** Remaining shield after damage */
  remainingShield: number;
  /** Remaining HP after damage */
  remainingHp: number;
}

/**
 * Core damage event interface
 */
export interface DamageEvent {
  /** Unique event identifier */
  id: string;
  /** Player who dealt the damage */
  dealerId: string;
  /** Player who received the damage */
  victimId: string;
  /** Base damage before armor reduction */
  baseDamage: number;
  /** Final damage after armor calculation */
  finalDamage: number;
  /** Hit location for damage calculation */
  hitLocation: HitLocation;
  /** Source of the damage */
  source: DamageSource;
  /** Weapon or ability used */
  weapon?: string;
  ability?: string;
  /** Distance between players in metres */
  distance: number;
  /** Timestamp within the round (milliseconds) */
  timestamp: number;
  /** Armor damage breakdown */
  armorBreakdown: ArmorDamageBreakdown;
}

/**
 * Aggregated damage events for a round
 */
export interface RoundDamageEvents {
  /** All damage events in chronological order */
  events: DamageEvent[];
  /** All round events including kills, plants, defuses (for timeline display) */
  allEvents?: import('./round-simulation').TimelineEvent[];
  /** Total damage dealt by each player */
  totalDamageByPlayer: Record<string, number>;
  /** Total damage received by each player */
  totalDamageReceived: Record<string, number>;
  /** Damage contribution to each kill (for assist calculation) */
  damageContributions: Record<string, DamageEvent[]>;
}

/**
 * Player armor state tracking
 */
export interface PlayerArmorState {
  /** Current shield type */
  shieldType: 'none' | 'light' | 'heavy' | 'regen';
  /** Current shield health */
  shieldHealth: number;
  /** Current regeneration pool (for regen shields) */
  regenPool: number;
  /** Current player HP */
  health: number;
  /** Maximum player HP */
  maxHealth: number;
}

// WEAPON_PROFILES has been moved to src/data/weapons.ts
// Import from there instead: import { WEAPON_PROFILES } from '../../data/weapons';

/**
 * Enhanced round information with economy, ultimates, and detailed events
 */
export interface EnhancedRoundInfo {
  roundNumber: number;
  winner: 'teamA' | 'teamB';
  winCondition: WinCondition;

  /** Economy state before the round */
  teamAEconomy: TeamEconomy;
  teamBEconomy: TeamEconomy;

  /** First blood of the round (null if time expired with no kills) */
  firstBlood: FirstBlood | null;

  /** Whether spike was planted */
  spikePlanted: boolean;

  /** Clutch attempt if one occurred */
  clutchAttempt: ClutchAttempt | null;

  /** Ultimates used this round */
  ultsUsed: UltUsage[];

  /** Damage events and tracking for the round */
  damageEvents: RoundDamageEvents;

  /** Player armor states throughout the round */
  playerArmorStates: Record<string, PlayerArmorState>;

  /** Running scores */
  teamAScore: number;
  teamBScore: number;

  /** Full timeline of all events (new timeline system) */
  timeline?: TimelineEvent[];

  /** Buy phase details (new timeline system) */
  buyPhase?: BuyPhaseResult;
}

export interface PlayerMapPerformance {
  playerId: string;
  playerName: string;
  agent: string;

  // Core stats
  kills: number;
  deaths: number;
  assists: number;

  // Advanced stats
  acs: number;
  kd: number;

  // Enhanced stats (now populated by simulation)
  firstKills?: number;
  firstDeaths?: number;
  clutchesAttempted?: number;
  clutchesWon?: number;
  plants?: number;
  defuses?: number;
  kast?: number;     // KAST percentage (kills/assists/survived/traded)
  adr?: number;      // Average damage per round
  hsPercent?: number; // Headshot percentage
  ultsUsed?: number;
}

/**
 * Enhanced player map performance with all detailed stats
 */
export interface EnhancedPlayerMapPerformance extends PlayerMapPerformance {
  firstKills: number;
  firstDeaths: number;
  clutchesAttempted: number;
  clutchesWon: number;
  plants: number;
  defuses: number;
  kast: number;
  adr: number;
  hsPercent: number;
  ultsUsed: number;
}

/**
 * Basic round info (legacy format for backward compatibility)
 */
export interface RoundInfo {
  roundNumber: number;
  winner: 'teamA' | 'teamB';
  winCondition: WinCondition;
  teamAScore: number;
  teamBScore: number;
}

export interface MapResult {
  map: string;
  teamAScore: number;    // Rounds won
  teamBScore: number;
  winner: 'teamA' | 'teamB';

  // Player performances
  teamAPerformances: PlayerMapPerformance[];
  teamBPerformances: PlayerMapPerformance[];

  // Map stats
  totalRounds: number;
  overtime: boolean;
  overtimeRounds?: number;

  // Round-by-round details
  rounds?: RoundInfo[];

  // Enhanced round data (populated by new simulation engine)
  enhancedRounds?: EnhancedRoundInfo[];
}

export interface MatchResult {
  matchId: string;
  winnerId: string;
  loserId: string;

  // Map results
  maps: MapResult[];

  // Overall score
  scoreTeamA: number;  // Maps won
  scoreTeamB: number;

  // Duration
  duration: number;  // minutes
}

// ============================================
// MORALE CHANGE TYPES
// ============================================

export interface MoraleChangeReason {
  label: string;
  delta: number;
}

export interface PlayerMoraleChange {
  playerId: string;
  playerName: string;
  delta: number;
  newMorale: number;
  reasons: MoraleChangeReason[];
}

export interface SpecialMoraleEvent {
  type: string;
  label: string;
  icon: string;
  delta: number;
}

export interface MatchMoraleResult {
  playerChanges: PlayerMoraleChange[];
  specialEvents: SpecialMoraleEvent[];
  isWin: boolean;
}

export interface MoraleCalculationInput {
  matchResult: MatchResult;
  playerTeamId: string;
  playerTeamPlayers: { id: string; name: string; morale: number }[];
  rivalryIntensity: number;
  isPlayoffMatch: boolean;
  opponentWinStreak: number;
}

export interface Match {
  id: string;
  tournamentId?: string;  // null for regular season
  teamAId: string;
  teamBId: string;
  scheduledDate: string;  // ISO date string for serialization
  status: MatchStatus;
  season: number;  // Season number for filtering stats

  // Result
  result?: MatchResult;
}
