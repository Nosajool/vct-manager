// Weapon System Types
// Defines weapons, their characteristics, and damage patterns for realistic headshot calculation

/**
 * Weapon categories in Valorant
 */
export type WeaponCategory = 'sidearm' | 'smg' | 'shotgun' | 'rifle' | 'sniper' | 'machine' | 'melee';

/**
 * Headshot tiers for weapon balance
 */
export type HeadshotTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Hit zones for damage calculation
 */
export type HitZone = 'head' | 'body' | 'legs';

/**
 * Main weapon interface
 */
export interface Weapon {
  id: string;
  name: string;
  displayName: string;
  cost: number;
  category: WeaponCategory;
  baseHeadshotRate: number; // From Radiant data (e.g., Vandal: 33.2%)
  shotsPerRound: { min: number; max: number };
  baseDamage: {
    head: number;
    body: number;
    legs: number;
  };
  headshotMultiplier: number;
  effectiveRange: {
    optimal: number;
    max: number;
  };
  characteristics: {
    accuracy: number;
    fireRate: number;
    recoil: number;
    magazineSize: number;
    reloadTime: number;
    equipTime: number;
  };
  headshotTier: HeadshotTier;
}

// BASELINE_HEADSHOT_RATES and MECHANICS_MULTIPLIER have been moved to src/engine/weapon/WeaponDatabase.ts
// Import from there instead: import { BASELINE_HEADSHOT_RATES, MECHANICS_MULTIPLIER } from '../../engine/weapon/WeaponDatabase';

/**
 * Weapon usage statistics and proficiency
 */
export interface WeaponStats {
  totalShots: number;
  totalHits: number;
  headshots: number;
  hitsPerRound: number;
  accuracy: number;
  headshotPercentage: number;
  averageDamage: number;
}

/**
 * Weapon proficiency tracking (deferred per user request)
 */
export interface WeaponProficiency {
  weaponId: string;
  proficiency: number; // 0-100
  lastUsed: Date;
  totalUses: number;
}

/**
 * Player stats for headshot calculation
 */
export interface HeadshotPlayer {
  mechanics: number;
  weaponSkill: number;
  confidence: number;
}

/**
 * Situation context for headshot calculation
 */
export interface HeadshotSituation {
  distance: number;
  moving: boolean;
  enemyMoving: boolean;
  scoped: boolean;
  duelTime: number;
  pressure: number;
}

/**
 * Headshot calculation context
 */
export interface HeadshotContext {
  player: HeadshotPlayer;
  weapon: Weapon;
  situation: HeadshotSituation;
}

/**
 * Result of headshot probability calculation
 */
export interface HeadshotResult {
  probability: number;
  hitZone: HitZone;
  damage: number;
  isKill: boolean;
}

/**
 * Damage calculation result
 */
export interface DamageResult {
  hitZone: HitZone;
  damage: number;
  isHeadshot: boolean;
  isKill: boolean;
  remainingHealth: number;
}

/**
 * Radiant weapon data for baseline statistics
 */
export interface RadiantWeaponData {
  weaponName: string;
  headshotPercent: number;
  averageDamagePerRound: number;
  usageRate: number;
  sampleSize: number;
}
