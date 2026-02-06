// Consolidated Weapon Data
// Single source of truth for all weapon information in VCT Manager
// Merges data from WeaponDatabase.ts, match.ts WEAPON_PROFILES, and types/weapons.ts

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Weapon categories in Valorant
 */
export type WeaponCategory = 'sidearm' | 'smg' | 'shotgun' | 'rifle' | 'sniper' | 'heavy' | 'melee';

/**
 * Headshot tiers for weapon balance (used in simulation)
 */
export type HeadshotTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Hit location for damage calculation
 */
export type HitLocation = 'head' | 'body' | 'leg';

/**
 * Wall penetration levels
 */
export type WallPenetration = 'low' | 'medium' | 'high';

/**
 * Damage values at a specific range
 */
export interface DamageAtRange {
  /** Minimum distance in metres for this damage tier */
  minDistance: number;
  /** Maximum distance in metres for this damage tier */
  maxDistance: number;
  /** Headshot damage */
  head: number;
  /** Body shot damage */
  body: number;
  /** Leg shot damage */
  leg: number;
}

/**
 * Weapon firing characteristics
 */
export interface WeaponCharacteristics {
  /** Fire rate in rounds per second */
  fireRate: number;
  /** Magazine capacity */
  magazineSize: number;
  /** Reload time in seconds */
  reloadTime: number;
  /** Equip time in seconds */
  equipTime: number;
  /** Accuracy rating (0-100) */
  accuracy: number;
  /** Recoil difficulty (0-100) */
  recoil: number;
  /** Wall penetration level */
  wallPenetration: WallPenetration;
}

/**
 * Effective range configuration
 */
export interface EffectiveRange {
  /** Optimal engagement distance in metres */
  optimal: number;
  /** Maximum effective distance in metres */
  max: number;
}

/**
 * Expected shots fired per round (for simulation)
 */
export interface ShotsPerRound {
  min: number;
  max: number;
}

/**
 * Complete weapon definition
 */
export interface WeaponData {
  /** Unique weapon identifier (lowercase) */
  id: string;
  /** Display name */
  name: string;
  /** Weapon category */
  category: WeaponCategory;
  /** Cost in credits (0 for free weapons) */
  cost: number;
  /** Range-based damage falloff */
  damageRanges: DamageAtRange[];
  /** Firing characteristics */
  characteristics: WeaponCharacteristics;
  /** Effective engagement range */
  effectiveRange: EffectiveRange;
  /** Expected shots per round in simulation */
  shotsPerRound: ShotsPerRound;
  /** Headshot tier for balance calculations */
  headshotTier: HeadshotTier;
  /** Base headshot rate at Radiant level (percentage) */
  baseHeadshotRate: number;
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

// ============================================
// WEAPON DATA
// ============================================

/**
 * Complete weapon database with accurate Valorant stats and range-based damage
 */
export const WEAPONS: Record<string, WeaponData> = {
  // ==========================================
  // RIFLES
  // ==========================================
  vandal: {
    id: 'vandal',
    name: 'Vandal',
    category: 'rifle',
    cost: 2900,
    damageRanges: [
      { minDistance: 0, maxDistance: 50, head: 160, body: 40, leg: 34 }
    ],
    characteristics: {
      fireRate: 9.75,
      magazineSize: 25,
      reloadTime: 2.5,
      equipTime: 1.0,
      accuracy: 85,
      recoil: 75,
      wallPenetration: 'medium',
    },
    effectiveRange: { optimal: 30, max: 50 },
    shotsPerRound: { min: 8, max: 15 },
    headshotTier: 'A',
    baseHeadshotRate: 33.2,
  },

  phantom: {
    id: 'phantom',
    name: 'Phantom',
    category: 'rifle',
    cost: 2900,
    damageRanges: [
      { minDistance: 0, maxDistance: 15, head: 156, body: 39, leg: 33 },
      { minDistance: 15, maxDistance: 30, head: 140, body: 35, leg: 29 },
      { minDistance: 30, maxDistance: 50, head: 124, body: 31, leg: 26 }
    ],
    characteristics: {
      fireRate: 11.0,
      magazineSize: 30,
      reloadTime: 2.5,
      equipTime: 1.0,
      accuracy: 88,
      recoil: 70,
      wallPenetration: 'medium',
    },
    effectiveRange: { optimal: 20, max: 40 },
    shotsPerRound: { min: 10, max: 18 },
    headshotTier: 'A',
    baseHeadshotRate: 30.5,
  },

  bulldog: {
    id: 'bulldog',
    name: 'Bulldog',
    category: 'rifle',
    cost: 2050,
    damageRanges: [
      { minDistance: 0, maxDistance: 50, head: 116, body: 35, leg: 29 }
    ],
    characteristics: {
      fireRate: 9.15,
      magazineSize: 24,
      reloadTime: 2.5,
      equipTime: 1.0,
      accuracy: 82,
      recoil: 78,
      wallPenetration: 'medium',
    },
    effectiveRange: { optimal: 25, max: 45 },
    shotsPerRound: { min: 8, max: 15 },
    headshotTier: 'A',
    baseHeadshotRate: 31.0,
  },

  guardian: {
    id: 'guardian',
    name: 'Guardian',
    category: 'rifle',
    cost: 2250,
    damageRanges: [
      { minDistance: 0, maxDistance: 50, head: 195, body: 65, leg: 48 }
    ],
    characteristics: {
      fireRate: 5.25,
      magazineSize: 12,
      reloadTime: 2.5,
      equipTime: 1.0,
      accuracy: 90,
      recoil: 65,
      wallPenetration: 'high',
    },
    effectiveRange: { optimal: 40, max: 60 },
    shotsPerRound: { min: 5, max: 10 },
    headshotTier: 'A',
    baseHeadshotRate: 32.0,
  },

  // ==========================================
  // SNIPERS
  // ==========================================
  operator: {
    id: 'operator',
    name: 'Operator',
    category: 'sniper',
    cost: 4700,
    damageRanges: [
      { minDistance: 0, maxDistance: 50, head: 255, body: 150, leg: 120 }
    ],
    characteristics: {
      fireRate: 0.6,
      magazineSize: 5,
      reloadTime: 3.7,
      equipTime: 1.5,
      accuracy: 95,
      recoil: 20,
      wallPenetration: 'high',
    },
    effectiveRange: { optimal: 80, max: 100 },
    shotsPerRound: { min: 2, max: 5 },
    headshotTier: 'S',
    baseHeadshotRate: 27.1,
  },

  marshal: {
    id: 'marshal',
    name: 'Marshal',
    category: 'sniper',
    cost: 950,
    damageRanges: [
      { minDistance: 0, maxDistance: 50, head: 202, body: 101, leg: 85 }
    ],
    characteristics: {
      fireRate: 1.5,
      magazineSize: 5,
      reloadTime: 2.5,
      equipTime: 1.25,
      accuracy: 92,
      recoil: 25,
      wallPenetration: 'medium',
    },
    effectiveRange: { optimal: 60, max: 80 },
    shotsPerRound: { min: 2, max: 5 },
    headshotTier: 'S',
    baseHeadshotRate: 27.1,
  },

  outlaw: {
    id: 'outlaw',
    name: 'Outlaw',
    category: 'sniper',
    cost: 2400,
    damageRanges: [
      { minDistance: 0, maxDistance: 50, head: 238, body: 140, leg: 119 }
    ],
    characteristics: {
      fireRate: 2.75,
      magazineSize: 2,
      reloadTime: 2.8,
      equipTime: 1.0,
      accuracy: 90,
      recoil: 30,
      wallPenetration: 'high',
    },
    effectiveRange: { optimal: 50, max: 70 },
    shotsPerRound: { min: 2, max: 4 },
    headshotTier: 'S',
    baseHeadshotRate: 28.0,
  },

  // ==========================================
  // SMGs
  // ==========================================
  spectre: {
    id: 'spectre',
    name: 'Spectre',
    category: 'smg',
    cost: 1600,
    damageRanges: [
      { minDistance: 0, maxDistance: 15, head: 78, body: 26, leg: 22 },
      { minDistance: 15, maxDistance: 30, head: 66, body: 22, leg: 18 },
      { minDistance: 30, maxDistance: 50, head: 60, body: 20, leg: 17 }
    ],
    characteristics: {
      fireRate: 13.33,
      magazineSize: 30,
      reloadTime: 2.25,
      equipTime: 0.75,
      accuracy: 80,
      recoil: 60,
      wallPenetration: 'low',
    },
    effectiveRange: { optimal: 15, max: 30 },
    shotsPerRound: { min: 12, max: 22 },
    headshotTier: 'B',
    baseHeadshotRate: 36.0,
  },

  stinger: {
    id: 'stinger',
    name: 'Stinger',
    category: 'smg',
    cost: 1100,
    damageRanges: [
      { minDistance: 0, maxDistance: 15, head: 67, body: 27, leg: 22 },
      { minDistance: 15, maxDistance: 50, head: 57, body: 23, leg: 19 }
    ],
    characteristics: {
      fireRate: 16.0,
      magazineSize: 20,
      reloadTime: 2.25,
      equipTime: 0.75,
      accuracy: 78,
      recoil: 65,
      wallPenetration: 'low',
    },
    effectiveRange: { optimal: 12, max: 25 },
    shotsPerRound: { min: 12, max: 20 },
    headshotTier: 'B',
    baseHeadshotRate: 35.0,
  },

  // ==========================================
  // SHOTGUNS
  // ==========================================
  bucky: {
    id: 'bucky',
    name: 'Bucky',
    category: 'shotgun',
    cost: 850,
    damageRanges: [
      { minDistance: 0, maxDistance: 8, head: 40, body: 20, leg: 17 },
      { minDistance: 8, maxDistance: 12, head: 26, body: 13, leg: 11 },
      { minDistance: 12, maxDistance: 50, head: 18, body: 9, leg: 7 }
    ],
    characteristics: {
      fireRate: 1.1,
      magazineSize: 5,
      reloadTime: 2.5,
      equipTime: 1.0,
      accuracy: 70,
      recoil: 30,
      wallPenetration: 'low',
    },
    effectiveRange: { optimal: 8, max: 15 },
    shotsPerRound: { min: 3, max: 6 },
    headshotTier: 'C',
    baseHeadshotRate: 42.0,
  },

  judge: {
    id: 'judge',
    name: 'Judge',
    category: 'shotgun',
    cost: 1850,
    damageRanges: [
      { minDistance: 0, maxDistance: 10, head: 34, body: 17, leg: 14 },
      { minDistance: 10, maxDistance: 15, head: 20, body: 10, leg: 8 },
      { minDistance: 15, maxDistance: 50, head: 14, body: 7, leg: 5 }
    ],
    characteristics: {
      fireRate: 3.5,
      magazineSize: 7,
      reloadTime: 2.2,
      equipTime: 1.0,
      accuracy: 72,
      recoil: 35,
      wallPenetration: 'low',
    },
    effectiveRange: { optimal: 7, max: 12 },
    shotsPerRound: { min: 4, max: 7 },
    headshotTier: 'C',
    baseHeadshotRate: 40.0,
  },

  // ==========================================
  // HEAVY WEAPONS
  // ==========================================
  odin: {
    id: 'odin',
    name: 'Odin',
    category: 'heavy',
    cost: 3200,
    damageRanges: [
      { minDistance: 0, maxDistance: 30, head: 95, body: 38, leg: 32 },
      { minDistance: 30, maxDistance: 50, head: 77, body: 31, leg: 26 }
    ],
    characteristics: {
      fireRate: 12.0,
      magazineSize: 100,
      reloadTime: 5.0,
      equipTime: 1.25,
      accuracy: 78,
      recoil: 80,
      wallPenetration: 'high',
    },
    effectiveRange: { optimal: 30, max: 50 },
    shotsPerRound: { min: 20, max: 40 },
    headshotTier: 'B',
    baseHeadshotRate: 37.0,
  },

  ares: {
    id: 'ares',
    name: 'Ares',
    category: 'heavy',
    cost: 1600,
    damageRanges: [
      { minDistance: 0, maxDistance: 30, head: 72, body: 30, leg: 25 },
      { minDistance: 30, maxDistance: 50, head: 67, body: 28, leg: 23 }
    ],
    characteristics: {
      fireRate: 10.0,
      magazineSize: 50,
      reloadTime: 3.25,
      equipTime: 1.25,
      accuracy: 76,
      recoil: 75,
      wallPenetration: 'high',
    },
    effectiveRange: { optimal: 25, max: 45 },
    shotsPerRound: { min: 15, max: 30 },
    headshotTier: 'B',
    baseHeadshotRate: 36.0,
  },

  // ==========================================
  // SIDEARMS
  // ==========================================
  classic: {
    id: 'classic',
    name: 'Classic',
    category: 'sidearm',
    cost: 0,
    damageRanges: [
      { minDistance: 0, maxDistance: 30, head: 78, body: 26, leg: 22 },
      { minDistance: 30, maxDistance: 50, head: 66, body: 22, leg: 18 }
    ],
    characteristics: {
      fireRate: 6.75,
      magazineSize: 12,
      reloadTime: 1.75,
      equipTime: 0.75,
      accuracy: 75,
      recoil: 50,
      wallPenetration: 'low',
    },
    effectiveRange: { optimal: 15, max: 25 },
    shotsPerRound: { min: 5, max: 10 },
    headshotTier: 'D',
    baseHeadshotRate: 28.0,
  },

  shorty: {
    id: 'shorty',
    name: 'Shorty',
    category: 'sidearm',
    cost: 150,
    damageRanges: [
      { minDistance: 0, maxDistance: 7, head: 24, body: 12, leg: 10 },
      { minDistance: 7, maxDistance: 15, head: 12, body: 6, leg: 5 },
      { minDistance: 15, maxDistance: 50, head: 6, body: 3, leg: 2 }
    ],
    characteristics: {
      fireRate: 3.3,
      magazineSize: 2,
      reloadTime: 1.75,
      equipTime: 0.75,
      accuracy: 68,
      recoil: 40,
      wallPenetration: 'low',
    },
    effectiveRange: { optimal: 8, max: 15 },
    shotsPerRound: { min: 2, max: 4 },
    headshotTier: 'D',
    baseHeadshotRate: 25.0,
  },

  frenzy: {
    id: 'frenzy',
    name: 'Frenzy',
    category: 'sidearm',
    cost: 450,
    damageRanges: [
      { minDistance: 0, maxDistance: 20, head: 78, body: 26, leg: 22 },
      { minDistance: 20, maxDistance: 50, head: 63, body: 21, leg: 17 }
    ],
    characteristics: {
      fireRate: 10.0,
      magazineSize: 13,
      reloadTime: 1.5,
      equipTime: 0.75,
      accuracy: 73,
      recoil: 60,
      wallPenetration: 'low',
    },
    effectiveRange: { optimal: 12, max: 20 },
    shotsPerRound: { min: 6, max: 13 },
    headshotTier: 'D',
    baseHeadshotRate: 29.0,
  },

  ghost: {
    id: 'ghost',
    name: 'Ghost',
    category: 'sidearm',
    cost: 500,
    damageRanges: [
      { minDistance: 0, maxDistance: 30, head: 105, body: 30, leg: 25 },
      { minDistance: 30, maxDistance: 50, head: 87, body: 25, leg: 21 }
    ],
    characteristics: {
      fireRate: 6.75,
      magazineSize: 15,
      reloadTime: 1.5,
      equipTime: 0.75,
      accuracy: 83,
      recoil: 55,
      wallPenetration: 'medium',
    },
    effectiveRange: { optimal: 20, max: 35 },
    shotsPerRound: { min: 5, max: 10 },
    headshotTier: 'D',
    baseHeadshotRate: 30.0,
  },

  sheriff: {
    id: 'sheriff',
    name: 'Sheriff',
    category: 'sidearm',
    cost: 800,
    damageRanges: [
      { minDistance: 0, maxDistance: 30, head: 159, body: 55, leg: 46 },
      { minDistance: 30, maxDistance: 50, head: 145, body: 50, leg: 42 }
    ],
    characteristics: {
      fireRate: 4.0,
      magazineSize: 6,
      reloadTime: 2.25,
      equipTime: 1.0,
      accuracy: 86,
      recoil: 70,
      wallPenetration: 'high',
    },
    effectiveRange: { optimal: 30, max: 45 },
    shotsPerRound: { min: 4, max: 8 },
    headshotTier: 'D',
    baseHeadshotRate: 33.2,
  },

  // ==========================================
  // MELEE
  // ==========================================
  melee: {
    id: 'melee',
    name: 'Melee',
    category: 'melee',
    cost: 0,
    damageRanges: [
      // Front attack: 75/50/25, Back attack: 150/100/50
      { minDistance: 0, maxDistance: 4, head: 75, body: 50, leg: 25 }
    ],
    characteristics: {
      fireRate: 1.5,
      magazineSize: 1,
      reloadTime: 0,
      equipTime: 0.75,
      accuracy: 100,
      recoil: 0,
      wallPenetration: 'low',
    },
    effectiveRange: { optimal: 2, max: 4 },
    shotsPerRound: { min: 1, max: 2 },
    headshotTier: 'F',
    baseHeadshotRate: 0,
  },
} as const;

// ============================================
// BASELINE HEADSHOT RATES
// ============================================

/**
 * Baseline headshot percentages for each tier at Radiant level (90+ mechanics)
 * These are derived from real Radiant player data
 */
export const BASELINE_HEADSHOT_RATES: Record<HeadshotTier, number> = {
  'S': 0.271,  // Operator: 27.1%
  'A': 0.325,  // Rifles average: ~32.5%
  'B': 0.365,  // SMGs/Heavy: 35-38%
  'C': 0.425,  // Shotguns: 40-45% at close range
  'D': 0.332,  // Sidearms: 33.2% (Sheriff as baseline)
  'F': 0.0,    // Melee: 0%
};

// ============================================
// RADIANT WEAPON DATA
// ============================================

/**
 * Real Radiant weapon data for baseline statistics
 * Used for calibrating simulation accuracy
 */
export const RADIANT_WEAPON_DATA: RadiantWeaponData[] = [
  { weaponName: 'Vandal', headshotPercent: 33.2, averageDamagePerRound: 0, usageRate: 0, sampleSize: 0 },
  { weaponName: 'Sheriff', headshotPercent: 33.2, averageDamagePerRound: 0, usageRate: 0, sampleSize: 0 },
  { weaponName: 'Phantom', headshotPercent: 30.5, averageDamagePerRound: 0, usageRate: 0, sampleSize: 0 },
  { weaponName: 'Operator', headshotPercent: 27.1, averageDamagePerRound: 0, usageRate: 0, sampleSize: 0 },
  { weaponName: 'Melee', headshotPercent: 0.0, averageDamagePerRound: 0, usageRate: 0, sampleSize: 0 },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get damage for a weapon at a specific distance
 */
export function getDamageAtDistance(
  weapon: WeaponData,
  distance: number,
  hitLocation: HitLocation
): number {
  const range = weapon.damageRanges.find(
    r => distance >= r.minDistance && distance <= r.maxDistance
  );

  if (!range) {
    // Use the last range (furthest) if beyond all defined ranges
    const lastRange = weapon.damageRanges[weapon.damageRanges.length - 1];
    return lastRange[hitLocation];
  }

  return range[hitLocation];
}

/**
 * Get a weapon by its ID
 */
export function getWeaponById(id: string): WeaponData | undefined {
  return WEAPONS[id.toLowerCase()];
}

/**
 * Get a weapon by its display name (case-insensitive)
 */
export function getWeaponByName(name: string): WeaponData | undefined {
  const normalizedName = name.toLowerCase();
  return Object.values(WEAPONS).find(
    w => w.name.toLowerCase() === normalizedName || w.id === normalizedName
  );
}

/**
 * Get all weapons in a category
 */
export function getWeaponsByCategory(category: WeaponCategory): WeaponData[] {
  return Object.values(WEAPONS).filter(w => w.category === category);
}

/**
 * Get all weapons the player can afford
 */
export function getAffordableWeapons(credits: number): WeaponData[] {
  return Object.values(WEAPONS).filter(w => w.cost <= credits);
}

/**
 * Check if a weapon can one-shot headshot at a given distance
 * Assumes 150 HP (100 HP + 50 heavy shields)
 */
export function canOneShot(weapon: WeaponData, distance: number): boolean {
  const damage = getDamageAtDistance(weapon, distance, 'head');
  return damage >= 150;
}

/**
 * Get all weapon IDs
 */
export function getAllWeaponIds(): string[] {
  return Object.keys(WEAPONS);
}

/**
 * Get all weapons as an array
 */
export function getAllWeapons(): WeaponData[] {
  return Object.values(WEAPONS);
}

// ============================================
// BACKWARD COMPATIBILITY
// ============================================

/**
 * Legacy WeaponProfile interface for backward compatibility
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
 * Legacy WEAPON_PROFILES export for backward compatibility
 * Maps WeaponData to the old WeaponProfile format with PascalCase keys
 * @deprecated Use WEAPONS instead
 */
export const WEAPON_PROFILES: Record<string, WeaponProfile> = Object.entries(WEAPONS).reduce(
  (acc, [_id, weapon]) => {
    acc[weapon.name] = {
      name: weapon.name,
      category: weapon.category as WeaponProfile['category'],
      cost: weapon.cost,
      damageRanges: weapon.damageRanges,
    };
    return acc;
  },
  {} as Record<string, WeaponProfile>
);
