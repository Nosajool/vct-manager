// Match System Types
// Based on VCT Manager Technical Specification

import type { BuyType } from './strategy';

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

// ============================================
// WEAPON PROFILES WITH EXACT DAMAGE VALUES
// ============================================

/**
 * Complete weapon arsenal with exact damage values and range falloff
 */
export const WEAPON_PROFILES: Record<string, WeaponProfile> = {
  // Rifles
  Vandal: {
    name: 'Vandal',
    category: 'rifle',
    cost: 2900,
    damageRanges: [
      { minDistance: 0, maxDistance: 50, head: 160, body: 40, leg: 34 }
    ]
  },
  Phantom: {
    name: 'Phantom',
    category: 'rifle',
    cost: 2900,
    damageRanges: [
      { minDistance: 0, maxDistance: 20, head: 156, body: 39, leg: 33 },
      { minDistance: 20, maxDistance: 50, head: 140, body: 35, leg: 29 }
    ]
  },
  Bulldog: {
    name: 'Bulldog',
    category: 'rifle',
    cost: 2050,
    damageRanges: [
      { minDistance: 0, maxDistance: 50, head: 115, body: 35, leg: 29 }
    ]
  },

  // SMGs
  Spectre: {
    name: 'Spectre',
    category: 'smg',
    cost: 1600,
    damageRanges: [
      { minDistance: 0, maxDistance: 15, head: 78, body: 26, leg: 22 },
      { minDistance: 15, maxDistance: 30, head: 66, body: 22, leg: 18 },
      { minDistance: 30, maxDistance: 50, head: 60, body: 20, leg: 17 }
    ]
  },
  Stinger: {
    name: 'Stinger',
    category: 'smg',
    cost: 1100,
    damageRanges: [
      { minDistance: 0, maxDistance: 15, head: 67, body: 27, leg: 22 },
      { minDistance: 15, maxDistance: 50, head: 57, body: 23, leg: 19 }
    ]
  },

  // Snipers
  Operator: {
    name: 'Operator',
    category: 'sniper',
    cost: 4700,
    damageRanges: [
      { minDistance: 0, maxDistance: 50, head: 255, body: 150, leg: 120 }
    ]
  },
  Marshal: {
    name: 'Marshal',
    category: 'sniper',
    cost: 1100,
    damageRanges: [
      { minDistance: 0, maxDistance: 50, head: 202, body: 101, leg: 85 }
    ]
  },
  Outlaw: {
    name: 'Outlaw',
    category: 'sniper',
    cost: 2400,
    damageRanges: [
      { minDistance: 0, maxDistance: 50, head: 238, body: 140, leg: 119 }
    ]
  },

  // Shotguns
  Bucky: {
    name: 'Bucky',
    category: 'shotgun',
    cost: 850,
    damageRanges: [
      { minDistance: 0, maxDistance: 8, head: 40, body: 20, leg: 17 },
      { minDistance: 8, maxDistance: 12, head: 26, body: 13, leg: 11 },
      { minDistance: 12, maxDistance: 50, head: 18, body: 9, leg: 7 }
    ]
  },
  Judge: {
    name: 'Judge',
    category: 'shotgun',
    cost: 1850,
    damageRanges: [
      { minDistance: 0, maxDistance: 10, head: 34, body: 17, leg: 14 },
      { minDistance: 10, maxDistance: 15, head: 20, body: 10, leg: 8 },
      { minDistance: 15, maxDistance: 50, head: 14, body: 7, leg: 5 }
    ]
  },

  // Heavy Weapons
  Odin: {
    name: 'Odin',
    category: 'heavy',
    cost: 3200,
    damageRanges: [
      { minDistance: 0, maxDistance: 30, head: 95, body: 38, leg: 32 },
      { minDistance: 30, maxDistance: 50, head: 77, body: 31, leg: 26 }
    ]
  },
  Ares: {
    name: 'Ares',
    category: 'heavy',
    cost: 1600,
    damageRanges: [
      { minDistance: 0, maxDistance: 30, head: 75, body: 30, leg: 25 },
      { minDistance: 30, maxDistance: 50, head: 70, body: 28, leg: 23 }
    ]
  },

  // Sidearms
  Sheriff: {
    name: 'Sheriff',
    category: 'sidearm',
    cost: 800,
    damageRanges: [
      { minDistance: 0, maxDistance: 30, head: 159, body: 55, leg: 46 },
      { minDistance: 30, maxDistance: 50, head: 145, body: 50, leg: 42 }
    ]
  },
  Ghost: {
    name: 'Ghost',
    category: 'sidearm',
    cost: 500,
    damageRanges: [
      { minDistance: 0, maxDistance: 30, head: 105, body: 30, leg: 25 },
      { minDistance: 30, maxDistance: 50, head: 87, body: 25, leg: 21 }
    ]
  },
  Frenzy: {
    name: 'Frenzy',
    category: 'sidearm',
    cost: 450,
    damageRanges: [
      { minDistance: 0, maxDistance: 20, head: 78, body: 26, leg: 22 },
      { minDistance: 20, maxDistance: 50, head: 63, body: 21, leg: 17 }
    ]
  },
  Classic: {
    name: 'Classic',
    category: 'sidearm',
    cost: 0,
    damageRanges: [
      { minDistance: 0, maxDistance: 30, head: 78, body: 26, leg: 22 },
      { minDistance: 30, maxDistance: 50, head: 66, body: 22, leg: 18 }
    ]
  },
  Shorty: {
    name: 'Shorty',
    category: 'sidearm',
    cost: 250,
    damageRanges: [
      { minDistance: 0, maxDistance: 7, head: 22, body: 11, leg: 9 },
      { minDistance: 7, maxDistance: 15, head: 12, body: 6, leg: 5 },
      { minDistance: 15, maxDistance: 50, head: 6, body: 3, leg: 2 }
    ]
  },
  Bandit: {
    name: 'Bandit',
    category: 'sidearm',
    cost: 600,
    damageRanges: [
      { minDistance: 0, maxDistance: 10, head: 152, body: 39, leg: 33 },
      { minDistance: 10, maxDistance: 30, head: 128, body: 39, leg: 33 },
      { minDistance: 30, maxDistance: 50, head: 112, body: 34, leg: 28 }
    ]
  },

  // Melee
  Melee: {
    name: 'Melee',
    category: 'melee',
    cost: 0,
    damageRanges: [
      { minDistance: 0, maxDistance: 8, head: 75, body: 50, leg: 25 } // Back attack: 150/100/50, Front attack: 75/50/25
    ]
  }
} as const;

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

export interface Match {
  id: string;
  tournamentId?: string;  // null for regular season
  teamAId: string;
  teamBId: string;
  scheduledDate: string;  // ISO date string for serialization
  status: MatchStatus;

  // Result
  result?: MatchResult;
}
