// Shared match simulation constants
// Extracted to avoid duplication across engine classes

import type { BuyType, AgentRole } from '../../types';

// Stat weights for team strength calculation
export const STAT_WEIGHTS = {
  mechanics: 0.30,
  igl: 0.15,
  mental: 0.15,
  clutch: 0.10,
  entry: 0.10,
  support: 0.10,
  lurking: 0.05,
  vibes: 0.05,
} as const;

// Maximum chemistry bonus (20%)
export const MAX_CHEMISTRY_BONUS = 0.20;

// ============================================
// ECONOMY CONSTANTS
// ============================================

export const ECONOMY_CONSTANTS = {
  /** Starting credits for pistol round */
  PISTOL_ROUND_CREDITS: 800,

  /** Credits awarded for winning a round */
  ROUND_WIN_CREDITS: 3000,

  /** Base credits for losing a round (before loss bonus) */
  ROUND_LOSS_BASE: 1900,

  /** Loss streak bonus per consecutive loss (0, 1, 2, 3, 4+) */
  LOSS_STREAK_BONUS: [0, 500, 1000, 1500, 1900] as const,

  /** Credits awarded per kill */
  KILL_CREDIT: 200,

  /** Bonus credits for planting spike */
  PLANT_CREDIT: 300,

  /** Credits for defusing spike (in addition to round win) */
  DEFUSE_CREDIT: 200,

  /** Maximum credits a player can hold */
  MAX_CREDITS: 9000,

  /** Credit thresholds for buy types */
  BUY_THRESHOLDS: {
    eco: 1000,       // Save money, don't buy much
    half_buy: 2400,  // Buy some utility and light weapons
    force_buy: 3600, // Buy full kit even if not ideal
    full_buy: 3900,  // Full armor + rifle + utility
  } as const,

  /** Team strength modifier based on buy type */
  BUY_STRENGTH_MODIFIER: {
    eco: 0.65,
    half_buy: 0.80,
    force_buy: 0.90,
    full_buy: 1.0,
  } as const satisfies Record<BuyType, number>,

  /** Minimum savings to consider a save round */
  SAVE_THRESHOLD: 2000,
} as const;

// ============================================
// ULTIMATE CONSTANTS
// ============================================

export const ULT_CONSTANTS = {
  /** Ultimate point costs by agent */
  ULT_COSTS: {
    // Duelists (6-7 points)
    Jett: 7,
    Reyna: 6,
    Phoenix: 6,
    Raze: 8,
    Yoru: 7,
    Neon: 7,
    Iso: 7,
    // Initiators (7-8 points)
    Sova: 8,
    Breach: 7,
    Skye: 6,
    'KAY/O': 7,
    Fade: 7,
    Gekko: 7,
    // Controllers (7-8 points)
    Brimstone: 7,
    Omen: 7,
    Viper: 8,
    Astra: 7,
    Harbor: 7,
    Clove: 7,
    // Sentinels (7-8 points)
    Sage: 8,
    Cypher: 6,
    Killjoy: 8,
    Chamber: 8,
    Deadlock: 7,
    Vyse: 7,
  } as const satisfies Record<string, number>,

  /** Ult points earned per kill */
  POINTS_PER_KILL: 1,

  /** Ult points earned for planting */
  POINTS_PER_PLANT: 1,

  /** Ult points earned for defusing */
  POINTS_PER_DEFUSE: 1,

  /** Ult points earned at start of each round */
  POINTS_PER_ROUND: 1,

  /** Impact bonus tiers for using ultimates */
  ULT_IMPACT: {
    LOW: 0.05,     // Minor impact ults (Cypher, Skye)
    MEDIUM: 0.10,  // Standard impact ults (Sova, Breach)
    HIGH: 0.15,    // High impact ults (Sage, Killjoy, Raze)
  } as const,

  /** Agent ult impact ratings */
  AGENT_ULT_IMPACT: {
    // High impact ults
    Sage: 'HIGH',
    Killjoy: 'HIGH',
    Raze: 'HIGH',
    Chamber: 'HIGH',
    Viper: 'HIGH',
    Brimstone: 'HIGH',
    // Medium impact ults
    Sova: 'MEDIUM',
    Breach: 'MEDIUM',
    Jett: 'MEDIUM',
    Reyna: 'MEDIUM',
    Phoenix: 'MEDIUM',
    Astra: 'MEDIUM',
    Omen: 'MEDIUM',
    Yoru: 'MEDIUM',
    Neon: 'MEDIUM',
    'KAY/O': 'MEDIUM',
    Fade: 'MEDIUM',
    Harbor: 'MEDIUM',
    Deadlock: 'MEDIUM',
    Gekko: 'MEDIUM',
    Iso: 'MEDIUM',
    Clove: 'MEDIUM',
    Vyse: 'MEDIUM',
    // Low impact ults
    Cypher: 'LOW',
    Skye: 'LOW',
  } as const satisfies Record<string, 'LOW' | 'MEDIUM' | 'HIGH'>,
} as const;

// ============================================
// COMPOSITION CONSTANTS
// ============================================

export const COMPOSITION_CONSTANTS = {
  /** Bonus for having a balanced composition (1+ of each core role) */
  BALANCED_BONUS: 0.05,

  /** Bonus for double controller on attack side */
  DOUBLE_CONTROLLER_ATTACK: 0.08,

  /** Penalty for having no controller */
  NO_CONTROLLER_PENALTY: -0.15,

  /** Penalty for having no initiator */
  NO_INITIATOR_PENALTY: -0.08,

  /** Bonus for double duelist (aggressive comps) */
  DOUBLE_DUELIST_BONUS: 0.03,

  /** Penalty for triple+ duelist (over-aggressive) */
  TRIPLE_DUELIST_PENALTY: -0.05,

  /** Penalty for triple+ sentinel (too passive) */
  TRIPLE_SENTINEL_PENALTY: -0.08,

  /** Bonus for well-rounded comp (1 of each + 1 flex) */
  PERFECT_COMP_BONUS: 0.08,

  /** Agent to role mapping */
  AGENT_ROLES: {
    // Duelists
    Jett: 'Duelist',
    Reyna: 'Duelist',
    Phoenix: 'Duelist',
    Raze: 'Duelist',
    Yoru: 'Duelist',
    Neon: 'Duelist',
    Iso: 'Duelist',
    // Initiators
    Sova: 'Initiator',
    Breach: 'Initiator',
    Skye: 'Initiator',
    'KAY/O': 'Initiator',
    Fade: 'Initiator',
    Gekko: 'Initiator',
    // Controllers
    Brimstone: 'Controller',
    Omen: 'Controller',
    Viper: 'Controller',
    Astra: 'Controller',
    Harbor: 'Controller',
    Clove: 'Controller',
    // Sentinels
    Sage: 'Sentinel',
    Cypher: 'Sentinel',
    Killjoy: 'Sentinel',
    Chamber: 'Sentinel',
    Deadlock: 'Sentinel',
    Vyse: 'Sentinel',
  } as const satisfies Record<string, AgentRole>,

  /** Agents by role for easy lookup */
  AGENTS_BY_ROLE: {
    Duelist: ['Jett', 'Reyna', 'Phoenix', 'Raze', 'Yoru', 'Neon', 'Iso'],
    Initiator: ['Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko'],
    Controller: ['Brimstone', 'Omen', 'Viper', 'Astra', 'Harbor', 'Clove'],
    Sentinel: ['Sage', 'Cypher', 'Killjoy', 'Chamber', 'Deadlock', 'Vyse'],
  } as const satisfies Record<AgentRole, readonly string[]>,
} as const;

// ============================================
// STAT CALCULATION FORMULAS
// Mapping player stats to match performance
// ============================================

export const STAT_FORMULAS = {
  /** First kill chance formula weights */
  FIRST_KILL: {
    entry: 0.6,
    mechanics: 0.4,
  },

  /** First death chance formula weights (inverse) */
  FIRST_DEATH: {
    entry: 0.5,      // Higher entry = more first deaths
    lurking: -0.3,   // Higher lurking = fewer first deaths
    mental: -0.2,    // Higher mental = fewer first deaths
  },

  /** Clutch success formula weights */
  CLUTCH: {
    clutch: 0.7,
    mental: 0.2,
    mechanics: 0.1,
  },

  /** Plant frequency formula weights (attackers only) */
  PLANT: {
    entry: 0.5,
    support: 0.3,
    igl: 0.2,
  },

  /** Defuse frequency formula weights */
  DEFUSE: {
    mental: 0.5,
    clutch: 0.3,
    support: 0.2,
  },

  /** KAST calculation weights */
  KAST: {
    support: 0.4,
    mental: 0.3,
    mechanics: 0.3,
  },

  /** ADR calculation weights */
  ADR: {
    mechanics: 0.6,
    entry: 0.4,
  },

  /** Headshot % calculation */
  HEADSHOT: {
    mechanics: 0.8,
    variance: 0.2,  // Random variance
  },
} as const;

// Type exports for consumers
export type { Player, TeamChemistry } from '../../types';
