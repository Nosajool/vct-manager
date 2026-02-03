// Weapon Engine Index
// Exports all weapon system components

export { WEAPONS, RADIANT_WEAPON_DATA, BASELINE_HEADSHOT_RATES, MECHANICS_MULTIPLIER } from './WeaponDatabase';
export { HeadshotCalculator, headshotCalculator } from './HeadshotCalculator';
export { WeaponAnalyzer, weaponAnalyzer } from './WeaponAnalyzer';

// Re-export types for convenience
export type {
  Weapon,
  WeaponCategory,
  HitZone,
  HeadshotTier,
  WeaponProficiency,
  HeadshotContext,
  HeadshotResult,
  WeaponStats,
  RadiantWeaponData,
  DamageResult,
} from '../../types/weapons';
