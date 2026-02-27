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
    Waylay: 8,
    // Initiators (7-8 points)
    Sova: 8,
    Breach: 7,
    Skye: 6,
    'KAY/O': 7,
    Fade: 7,
    Gekko: 7,
    Tejo: 9,
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
    Veto: 8,
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
    Veto: 'MEDIUM',
    // High impact ults (new agents)
    Waylay: 'HIGH',
    Tejo: 'HIGH',
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
    Waylay: 'Duelist',
    // Initiators
    Sova: 'Initiator',
    Breach: 'Initiator',
    Skye: 'Initiator',
    'KAY/O': 'Initiator',
    Fade: 'Initiator',
    Gekko: 'Initiator',
    Tejo: 'Initiator',
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
    Veto: 'Sentinel',
  } as const satisfies Record<string, AgentRole>,

  /** Agents by role for easy lookup */
  AGENTS_BY_ROLE: {
    Duelist: ['Jett', 'Reyna', 'Phoenix', 'Raze', 'Yoru', 'Neon', 'Iso', 'Waylay'],
    Initiator: ['Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko', 'Tejo'],
    Controller: ['Brimstone', 'Omen', 'Viper', 'Astra', 'Harbor', 'Clove'],
    Sentinel: ['Sage', 'Cypher', 'Killjoy', 'Chamber', 'Deadlock', 'Vyse', 'Veto'],
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

// ============================================
// ASSIST CALCULATION CONSTANTS
// ============================================

export const ASSIST_CONSTANTS = {
  /** Minimum damage threshold for assist eligibility */
  DAMAGE_THRESHOLD: 25,

  /** Time window in milliseconds for assist eligibility (5 seconds) */
  TIME_WINDOW: 5000,

  /** Multiplier for utility damage in assist calculation */
  UTILITY_DAMAGE_MULTIPLIER: 0.8,

  // ARMOR_ABSORPTION has been moved to src/data/shields.ts
  // Import SHIELDS from there instead: import { SHIELDS } from '../../data/shields';

  /** Probability of melee attack occurring in a round */
  MELEE_CHANCE: 1 / 5000,

  /** Distance unit for damage calculations */
  DISTANCE_UNIT: 'metres',

  /** Damage multipliers by hit location */
  HIT_LOCATION_MULTIPLIERS: {
    HEAD: 1.0,  // Base damage values are already headshot damage
    BODY: 0.4,  // Body damage is ~40% of headshot
    LEG: 0.34,  // Leg damage is ~34% of headshot
  } as const,

  /** Distance ranges for damage falloff (in metres) */
  DISTANCE_RANGES: {
    CLOSE: 15,    // Close range distance
    MEDIUM: 30,   // Medium range distance
    LONG: 50,     // Maximum effective range
  } as const,
} as const;

// ============================================
// NARRATIVE CONSTANTS
// Coefficients for the narrative modifier layer:
// hype pressure, rivalry emotion, personality archetypes, morale
// ============================================

export const NARRATIVE_CONSTANTS = {
  // ------------------------------------------
  // Hype pressure modifiers
  // High mental resists crowd pressure; high clutch thrives under it
  // ------------------------------------------
  HYPE: {
    /** Baseline mental score considered "neutral" for hype pressure */
    MENTAL_BASELINE: 70,
    /** Per-point mental deviation scaled by hype fraction (hype/100) */
    MENTAL_COEFFICIENT: 0.1,
    /** Baseline clutch score considered "neutral" for hype pressure */
    CLUTCH_BASELINE: 65,
    /** Per-point clutch deviation scaled by hype fraction (hype/100) */
    CLUTCH_COEFFICIENT: 0.15,
    /** Hype level above which crowd variance is applied */
    VARIANCE_THRESHOLD: 70,
    /** Random variance multiplier per hype point above threshold */
    VARIANCE_PER_POINT: 0.01,
    /** Maximum modifier from hype (±5%) */
    CAP: 0.05,
  },

  // ------------------------------------------
  // Rivalry emotional modifiers
  // Emotional control (mental + igl) determines whether rivalry helps or hurts
  // ------------------------------------------
  RIVALRY: {
    /** Weight of mental stat in emotional control calculation */
    MENTAL_WEIGHT: 0.6,
    /** Weight of igl stat in emotional control calculation */
    IGL_WEIGHT: 0.4,
    /** Emotional control fraction considered neutral (65%) */
    CONTROL_BASELINE: 0.65,
    /** Scale factor: (control - baseline) * (intensity/100) * scale */
    SCALE: 10,
    /** Rivalry intensity above which aggression boost is applied in round sim */
    AGGRESSION_THRESHOLD: 60,
    /** Maximum modifier from rivalry (±5%) */
    CAP: 0.05,
  },

  // ------------------------------------------
  // Personality archetype modifiers
  // Applied per-player based on match context (hype, playoff, rivalry)
  // STABLE halves all other narrative modifiers rather than having its own bonus
  // ------------------------------------------
  PERSONALITY: {
    BIG_STAGE: {
      /** Bonus when hype level is high (≥70) */
      HIGH_HYPE_BONUS: 0.04,
      /** Bonus in playoff matches */
      PLAYOFF_BONUS: 0.03,
      /** Bonus in high-intensity rivalry matches (intensity ≥60) */
      RIVALRY_BONUS: 0.02,
    },
    TEAM_FIRST: {
      /** Bonus when team chemistry is high (≥0.7 as fraction of max) */
      HIGH_CHEMISTRY_BONUS: 0.03,
      /** Small bonus in any playoff match (team cohesion under pressure) */
      PLAYOFF_BONUS: 0.01,
    },
    FAME_SEEKER: {
      /** Bonus when in the spotlight (hype ≥70) */
      HIGH_HYPE_BONUS: 0.03,
      /** Penalty when in low-key matches (hype <30) */
      LOW_HYPE_PENALTY: -0.02,
      /** Bonus in playoff matches (loves big moments) */
      PLAYOFF_BONUS: 0.02,
    },
    INTROVERT: {
      /** Bonus in low-hype, low-pressure matches (hype <30) */
      LOW_HYPE_BONUS: 0.02,
      /** Penalty when hype is high (≥70) */
      HIGH_HYPE_PENALTY: -0.03,
      /** Penalty in high-intensity rivalry matches */
      RIVALRY_PENALTY: -0.02,
    },
    /** STABLE halves every other narrative modifier for that player */
    STABLE_DAMPENING: 0.5,
    /** Maximum modifier from personality (±3%) */
    CAP: 0.03,
  },

  // ------------------------------------------
  // Morale modifier
  // Morale feeds into base team strength calculation
  // ------------------------------------------
  MORALE: {
    /** Baseline morale considered neutral */
    BASELINE: 70,
    /** Coefficient: (morale - baseline) / 100 * coefficient = modifier */
    COEFFICIENT: 0.05,
  },

  // ------------------------------------------
  // Hard caps
  // ------------------------------------------
  CAPS: {
    /** Hard cap on total narrative modifier (±10%) */
    TOTAL: 0.10,
  },
} as const;

// Type exports for consumers
export type { Player, TeamChemistry } from '../../types';
