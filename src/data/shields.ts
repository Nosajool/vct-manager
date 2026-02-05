// Shield System Data
// Consolidated shield definitions for Valorant economy and damage calculations
// Source of truth for all shield-related constants

/**
 * Shield type identifiers
 */
export type ShieldType = 'none' | 'light' | 'heavy' | 'regen';

/**
 * Standard shield data structure (non-regenerating shields)
 */
export interface StandardShieldData {
  /** Cost in credits */
  cost: number;
  /** Maximum shield HP */
  maxHp: number;
  /** Damage absorption rate (0.66 = 66% absorbed by shield) */
  absorption: number;
  /** Shield category */
  type: 'none' | 'standard';
}

/**
 * Regenerating shield data structure (Reyna's shield)
 */
export interface RegenShieldData {
  /** Cost in credits */
  cost: number;
  /** Maximum shield HP */
  maxHp: number;
  /** Reserve pool for regeneration */
  reservePool: number;
  /** Damage absorption rate (1.0 = 100% absorbed by shield) */
  absorption: number;
  /** Delay before regeneration starts (in milliseconds) */
  regenDelay: number;
  /** Shield category */
  type: 'regen';
}

/**
 * Union type for all shield data
 */
export type ShieldData = StandardShieldData | RegenShieldData;

/**
 * Shield definitions for all shield types
 *
 * Absorption rates:
 * - Standard shields (light/heavy): 66% of damage absorbed by shield, 34% bleeds through to HP
 * - Regen shields: 100% of damage absorbed by shield (no bleed-through)
 */
export const SHIELDS = {
  none: {
    cost: 0,
    maxHp: 0,
    absorption: 0,
    type: 'none',
  },
  light: {
    cost: 400,
    maxHp: 25,
    absorption: 0.66,
    type: 'standard',
  },
  heavy: {
    cost: 1000,
    maxHp: 50,
    absorption: 0.66,
    type: 'standard',
  },
  regen: {
    cost: 650,
    maxHp: 25,
    reservePool: 50,
    absorption: 1.0,
    regenDelay: 3000,
    type: 'regen',
  },
} as const satisfies Record<ShieldType, ShieldData>;

/**
 * Type for the SHIELDS constant
 */
export type ShieldsConfig = typeof SHIELDS;

/**
 * Get shield data by type
 */
export function getShieldData(shieldType: ShieldType): ShieldData {
  return SHIELDS[shieldType];
}

/**
 * Get shield cost by type
 */
export function getShieldCost(shieldType: ShieldType): number {
  return SHIELDS[shieldType].cost;
}

/**
 * Get shield max HP by type
 */
export function getShieldMaxHp(shieldType: ShieldType): number {
  return SHIELDS[shieldType].maxHp;
}

/**
 * Check if a shield type is regenerating
 */
export function isRegenShield(shieldType: ShieldType): shieldType is 'regen' {
  return shieldType === 'regen';
}

/**
 * Get available shield types sorted by cost
 */
export function getShieldsByBudget(credits: number): ShieldType[] {
  return (Object.keys(SHIELDS) as ShieldType[])
    .filter(type => SHIELDS[type].cost <= credits)
    .sort((a, b) => SHIELDS[b].cost - SHIELDS[a].cost);
}

/**
 * Get best affordable shield type
 */
export function getBestAffordableShield(credits: number): ShieldType {
  const affordable = getShieldsByBudget(credits);
  return affordable[0] ?? 'none';
}
