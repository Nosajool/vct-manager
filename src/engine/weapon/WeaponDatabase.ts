// Weapon Database - Real Valorant weapon data and characteristics
// Based on actual game values and Radiant-level performance data

import type { Weapon, HeadshotTier, WeaponCategory, RadiantWeaponData } from '../../types/weapons';

/**
 * Real Radiant weapon data provided by user
 * This is our baseline for realistic headshot percentages
 */
export const RADIANT_WEAPON_DATA: RadiantWeaponData[] = [
  { weaponName: 'Vandal', headshotPercent: 33.2, averageDamagePerRound: 0, usageRate: 0, sampleSize: 0 },
  { weaponName: 'Sheriff', headshotPercent: 33.2, averageDamagePerRound: 0, usageRate: 0, sampleSize: 0 },
  { weaponName: 'Phantom', headshotPercent: 30.5, averageDamagePerRound: 0, usageRate: 0, sampleSize: 0 },
  { weaponName: 'Operator', headshotPercent: 27.1, averageDamagePerRound: 0, usageRate: 0, sampleSize: 0 },
  { weaponName: 'Melee', headshotPercent: 0.0, averageDamagePerRound: 0, usageRate: 0, sampleSize: 0 },
];

/**
 * Complete weapon database with accurate Valorant stats
 */
export const WEAPONS: Record<string, Weapon> = {
  // Rifles (Tier A - 30-33% HS at Radiant)
  vandal: {
    id: 'vandal',
    name: 'Vandal',
    displayName: 'Vandal',
    category: 'rifle',
    baseHeadshotRate: 33.2,
    shotsPerRound: { min: 8, max: 15 },
    baseDamage: { head: 160, body: 40, legs: 34 },
    headshotMultiplier: 4.0,  // 40 * 4 = 160
    effectiveRange: { optimal: 30, max: 50 },
    characteristics: {
      accuracy: 85,
      fireRate: 9.25,  // rounds/sec
      recoil: 75,
      magazineSize: 25,
      reloadTime: 2.5,
      equipTime: 0.5,
    },
    cost: 2900,
    headshotTier: 'A',
  },
  
  phantom: {
    id: 'phantom',
    name: 'Phantom',
    displayName: 'Phantom',
    category: 'rifle',
    baseHeadshotRate: 30.5,
    shotsPerRound: { min: 10, max: 18 },
    baseDamage: { head: 140, body: 35, legs: 29 },
    headshotMultiplier: 4.0,  // 35 * 4 = 140
    effectiveRange: { optimal: 20, max: 40 },
    characteristics: {
      accuracy: 88,
      fireRate: 11,    // rounds/sec
      recoil: 70,
      magazineSize: 30,
      reloadTime: 1.6,
      equipTime: 0.5,
    },
    cost: 2900,
    headshotTier: 'A',
  },
  
  bulldog: {
    id: 'bulldog',
    name: 'Bulldog',
    displayName: 'Bulldog',
    category: 'rifle',
    baseHeadshotRate: 31.0,
    shotsPerRound: { min: 8, max: 15 },
    baseDamage: { head: 157, body: 35, legs: 30 },
    headshotMultiplier: 4.5,  // 35 * 4.5 = 157
    effectiveRange: { optimal: 25, max: 45 },
    characteristics: {
      accuracy: 82,
      fireRate: 9.33,
      recoil: 78,
      magazineSize: 24,
      reloadTime: 2.1,
      equipTime: 0.5,
    },
    cost: 2050,
    headshotTier: 'A',
  },
  
  guardian: {
    id: 'guardian',
    name: 'Guardian',
    displayName: 'Guardian',
    category: 'rifle',
    baseHeadshotRate: 32.0,
    shotsPerRound: { min: 5, max: 10 },
    baseDamage: { head: 195, body: 65, legs: 55 },
    headshotMultiplier: 3.0,  // 65 * 3 = 195
    effectiveRange: { optimal: 40, max: 60 },
    characteristics: {
      accuracy: 90,
      fireRate: 6.5,
      recoil: 65,
      magazineSize: 12,
      reloadTime: 2.2,
      equipTime: 0.6,
    },
    cost: 2500,
    headshotTier: 'A',
  },

  // Snipers (Tier S - 27% HS at Radiant)
  operator: {
    id: 'operator',
    name: 'Operator',
    displayName: 'Operator',
    category: 'sniper',
    baseHeadshotRate: 27.1,
    shotsPerRound: { min: 2, max: 5 },
    baseDamage: { head: 255, body: 150, legs: 127 },
    headshotMultiplier: 1.7,  // 150 * 1.7 = 255
    effectiveRange: { optimal: 80, max: 100 },
    characteristics: {
      accuracy: 95,
      fireRate: 0.6,
      recoil: 20,
      magazineSize: 5,
      reloadTime: 3.5,
      equipTime: 1.2,
    },
    cost: 4700,
    headshotTier: 'S',
  },
  
  marshal: {
    id: 'marshal',
    name: 'Marshal',
    displayName: 'Marshal',
    category: 'sniper',
    baseHeadshotRate: 27.1,
    shotsPerRound: { min: 2, max: 5 },
    baseDamage: { head: 202, body: 101, legs: 86 },
    headshotMultiplier: 2.0,  // 101 * 2 = 202
    effectiveRange: { optimal: 60, max: 80 },
    characteristics: {
      accuracy: 92,
      fireRate: 1.2,
      recoil: 25,
      magazineSize: 5,
      reloadTime: 2.0,
      equipTime: 0.9,
    },
    cost: 1100,
    headshotTier: 'S',
  },

  // SMGs (Tier B - 35-38% HS at Radiant)
  spectre: {
    id: 'spectre',
    name: 'Spectre',
    displayName: 'Spectre',
    category: 'smg',
    baseHeadshotRate: 36.0,
    shotsPerRound: { min: 12, max: 22 },
    baseDamage: { head: 78, body: 26, legs: 22 },
    headshotMultiplier: 3.0,  // 26 * 3 = 78
    effectiveRange: { optimal: 15, max: 30 },
    characteristics: {
      accuracy: 80,
      fireRate: 13.33,
      recoil: 60,
      magazineSize: 30,
      reloadTime: 1.8,
      equipTime: 0.4,
    },
    cost: 1600,
    headshotTier: 'B',
  },
  
  stinger: {
    id: 'stinger',
    name: 'Stinger',
    displayName: 'Stinger',
    category: 'smg',
    baseHeadshotRate: 35.0,
    shotsPerRound: { min: 12, max: 20 },
    baseDamage: { head: 83, body: 22, legs: 19 },
    headshotMultiplier: 3.75,  // 22 * 3.75 = 83
    effectiveRange: { optimal: 12, max: 25 },
    characteristics: {
      accuracy: 78,
      fireRate: 16,
      recoil: 65,
      magazineSize: 20,
      reloadTime: 1.7,
      equipTime: 0.4,
    },
    cost: 950,
    headshotTier: 'B',
  },

  // Shotguns (Tier C - 40-45% HS at Radiant, close range)
  bucky: {
    id: 'bucky',
    name: 'Bucky',
    displayName: 'Bucky',
    category: 'shotgun',
    baseHeadshotRate: 42.0,
    shotsPerRound: { min: 3, max: 6 },
    baseDamage: { head: 44, body: 22, legs: 19 },
    headshotMultiplier: 2.0,  // 22 * 2 = 44
    effectiveRange: { optimal: 8, max: 15 },
    characteristics: {
      accuracy: 70,
      fireRate: 1.1,
      recoil: 30,
      magazineSize: 5,
      reloadTime: 2.3,
      equipTime: 0.7,
    },
    cost: 850,
    headshotTier: 'C',
  },
  
  judge: {
    id: 'judge',
    name: 'Judge',
    displayName: 'Judge',
    category: 'shotgun',
    baseHeadshotRate: 40.0,
    shotsPerRound: { min: 4, max: 7 },
    baseDamage: { head: 65, body: 34, legs: 29 },
    headshotMultiplier: 1.9,  // 34 * 1.9 = 65
    effectiveRange: { optimal: 7, max: 12 },
    characteristics: {
      accuracy: 72,
      fireRate: 1.3,
      recoil: 35,
      magazineSize: 7,
      reloadTime: 2.0,
      equipTime: 0.6,
    },
    cost: 1850,
    headshotTier: 'C',
  },

  // Sidearms (Tier D - 33% baseline at Radiant)
  sheriff: {
    id: 'sheriff',
    name: 'Sheriff',
    displayName: 'Sheriff',
    category: 'sidearm',
    baseHeadshotRate: 33.2,
    shotsPerRound: { min: 4, max: 8 },
    baseDamage: { head: 159, body: 55, legs: 47 },
    headshotMultiplier: 2.9,  // 55 * 2.9 = 159
    effectiveRange: { optimal: 30, max: 45 },
    characteristics: {
      accuracy: 86,
      fireRate: 4.0,
      recoil: 70,
      magazineSize: 6,
      reloadTime: 1.5,
      equipTime: 0.4,
    },
    cost: 800,
    headshotTier: 'D',
  },
  
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    displayName: 'Ghost',
    category: 'sidearm',
    baseHeadshotRate: 30.0,
    shotsPerRound: { min: 5, max: 10 },
    baseDamage: { head: 105, body: 35, legs: 30 },
    headshotMultiplier: 3.0,  // 35 * 3 = 105
    effectiveRange: { optimal: 20, max: 35 },
    characteristics: {
      accuracy: 83,
      fireRate: 6.75,
      recoil: 55,
      magazineSize: 12,
      reloadTime: 1.4,
      equipTime: 0.3,
    },
    cost: 500,
    headshotTier: 'D',
  },
  
  classic: {
    id: 'classic',
    name: 'Classic',
    displayName: 'Classic',
    category: 'sidearm',
    baseHeadshotRate: 28.0,
    shotsPerRound: { min: 5, max: 10 },
    baseDamage: { head: 78, body: 26, legs: 22 },
    headshotMultiplier: 3.0,  // 26 * 3 = 78
    effectiveRange: { optimal: 15, max: 25 },
    characteristics: {
      accuracy: 75,
      fireRate: 6.67,
      recoil: 50,
      magazineSize: 12,
      reloadTime: 1.2,
      equipTime: 0.2,
    },
    cost: 0,
    headshotTier: 'D',
  },
  
  frenzy: {
    id: 'frenzy',
    name: 'Frenzy',
    displayName: 'Frenzy',
    category: 'sidearm',
    baseHeadshotRate: 29.0,
    shotsPerRound: { min: 6, max: 13 },
    baseDamage: { head: 78, body: 26, legs: 22 },
    headshotMultiplier: 3.0,  // 26 * 3 = 78
    effectiveRange: { optimal: 12, max: 20 },
    characteristics: {
      accuracy: 73,
      fireRate: 10,
      recoil: 60,
      magazineSize: 13,
      reloadTime: 1.3,
      equipTime: 0.2,
    },
    cost: 400,
    headshotTier: 'D',
  },
  
  shorty: {
    id: 'shorty',
    name: 'Shorty',
    displayName: 'Shorty',
    category: 'sidearm',
    baseHeadshotRate: 25.0,
    shotsPerRound: { min: 2, max: 4 },
    baseDamage: { head: 52, body: 13, legs: 11 },
    headshotMultiplier: 4.0,  // 13 * 4 = 52
    effectiveRange: { optimal: 8, max: 15 },
    characteristics: {
      accuracy: 68,
      fireRate: 2.0,
      recoil: 40,
      magazineSize: 2,
      reloadTime: 1.1,
      equipTime: 0.2,
    },
    cost: 200,
    headshotTier: 'D',
  },

  // Machine Guns (Tier B - 35-38% HS at Radiant)
  ares: {
    id: 'ares',
    name: 'Ares',
    displayName: 'Ares',
    category: 'machine',
    baseHeadshotRate: 36.0,
    shotsPerRound: { min: 15, max: 30 },
    baseDamage: { head: 104, body: 30, legs: 25 },
    headshotMultiplier: 3.5,  // 30 * 3.5 = 104
    effectiveRange: { optimal: 25, max: 45 },
    characteristics: {
      accuracy: 76,
      fireRate: 10,
      recoil: 75,
      magazineSize: 50,
      reloadTime: 3.5,
      equipTime: 0.8,
    },
    cost: 1600,
    headshotTier: 'B',
  },
  
  odin: {
    id: 'odin',
    name: 'Odin',
    displayName: 'Odin',
    category: 'machine',
    baseHeadshotRate: 37.0,
    shotsPerRound: { min: 20, max: 40 },
    baseDamage: { head: 95, body: 38, legs: 32 },
    headshotMultiplier: 2.5,  // 38 * 2.5 = 95
    effectiveRange: { optimal: 30, max: 50 },
    characteristics: {
      accuracy: 78,
      fireRate: 12.5,
      recoil: 80,
      magazineSize: 100,
      reloadTime: 4.0,
      equipTime: 0.8,
    },
    cost: 3200,
    headshotTier: 'B',
  },

  // Melee (Tier F - 0% HS)
  melee: {
    id: 'melee',
    name: 'Melee',
    displayName: 'Melee',
    category: 'melee',
    baseHeadshotRate: 0,
    shotsPerRound: { min: 1, max: 2 },
    baseDamage: { head: 50, body: 50, legs: 50 },
    headshotMultiplier: 1.0,
    effectiveRange: { optimal: 2, max: 2 },
    characteristics: {
      accuracy: 100,
      fireRate: 1.5,
      recoil: 0,
      magazineSize: 1,
      reloadTime: 0,
      equipTime: 0.1,
    },
    cost: 0,
    headshotTier: 'F',
  },
};

/**
 * Baseline headshot percentages for each tier at Radiant level (90+ mechanics)
 * These are derived from the real data provided
 */
export const BASELINE_HEADSHOT_RATES: Record<HeadshotTier, number> = {
  'S': 0.271,  // Operator: 27.1%
  'A': 0.325,  // Rifles average: (33.2 + 30.5) / 2 = 31.85%, adjusted to 32.5%
  'B': 0.365,  // SMGs/Machine: 35-38% estimated
  'C': 0.425,  // Shotguns: 40-45% at close range
  'D': 0.332,  // Sidearms: 33.2% (Sheriff as baseline)
  'F': 0.0,    // Melee: 0%
};

/**
 * Headshot rate modifiers based on player mechanics (0-100)
 * Creates the 15-45% range for pro players (70-90 mechanics)
 */
export const MECHANICS_MULTIPLIER = {
  // Lower bound (15% at 50 mechanics for T1 weapons)
  getLowMechanics: (tier: HeadshotTier): number => {
    const baseline = BASELINE_HEADSHOT_RATES[tier];
    return tier === 'F' ? 0 : 0.15 / baseline; // ~0.46x for tier A at 15%
  },
  
  // Upper bound (45% at 100 mechanics for optimal weapons)
  getHighMechanics: (tier: HeadshotTier): number => {
    const baseline = BASELINE_HEADSHOT_RATES[tier];
    return tier === 'F' ? 0 : 0.45 / baseline; // ~1.38x for tier A at 45%
  },
  
  // Calculate multiplier based on mechanics stat
  calculateMultiplier: (mechanics: number, tier: HeadshotTier): number => {
    if (tier === 'F') return 0;

    const lowMult = MECHANICS_MULTIPLIER.getLowMechanics(tier);
    const highMult = MECHANICS_MULTIPLIER.getHighMechanics(tier);

    // Linear interpolation from 50-100 mechanics
    if (mechanics <= 50) {
      return lowMult * (mechanics / 50);
    } else {
      const normalized = (mechanics - 50) / 50; // 0-1
      return lowMult + (highMult - lowMult) * normalized;
    }
  },
};

/**
 * Return all weapons the player can afford given their current credits
 */
export function getAffordableWeapons(credits: number) {
  return Object.values(WEAPONS).filter(w => w.cost <= credits);
}

/**
 * Return the preferred weapon category for a given agent.
 * Used as a preference hint — callers fall back to 'rifle' if no match.
 */
export function getAgentWeaponCategory(agent: string): WeaponCategory {
  const name = agent.toLowerCase();

  // Operator-style agents prefer snipers
  if (name === 'jett' || name === 'chamber') return 'sniper';

  // Entry/close-range agents may prefer SMGs
  if (name === 'neon' || name === 'raze') return 'smg';

  // Default: rifles are the standard competitive choice
  return 'rifle';
}
