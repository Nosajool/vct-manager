// Weapon System Types
// Defines weapons, their characteristics, and damage patterns for realistic headshot calculation

/**
 *  * Weapon categories in Valorant
 */
export type WeaponCategory = 'sidearm' | 'smg' | 'shotgun' | 'rifle' | 'sniper' | 'heavy';

/**
 *  * Headshot tiers for weapon balance
 */
export type HeadshotTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

/**
 *  * Hit zones for damage calculation
 */
export type HitZone = 'head' | 'chest' | 'stomach' | 'legs' | 'arms';

/**
 *  * Main weapon interface
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

/**
 *  * Baseline headshot percentages from Radiant player data
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
 *  * Headshot rate modifiers based on player mechanics (0-100)
 */
export const MECHANICS_MULTIPLIER = {
  // Lower bound (15% at 50 mechanics for optimal weapons)
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
  }
};

/**
 *  * Weapon usage statistics and proficiency
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
 *  * Weapon proficiency tracking (deferred per user request)
 */
export interface WeaponProficiency {
  weaponId: string;
  proficiency: number; // 0-100
  lastUsed: Date;
  totalUses: number;
}

/**
 *  * Headshot calculation context
 */
export interface HeadshotContext {
  headshot: boolean;
  hitZone: HitZone;
  damage: number;
  agent?: string;
  weapon?: string;
}

/**
 *  * Result of headshot attempt
 */
export interface HeadshotResult {
  success: boolean;
  headshot: boolean;
  damage: number;
  hitZone: HitZone;
  agent?: string;
  weapon?: string;
}

/**
 *  * Damage calculation result
 */
export interface DamageResult {
  success: boolean;
  damage: number;
  hitZone: HitZone;
  hitPoints: number;
  isHeadshot: boolean;
  weapon?: string;
}

/**
 *  * Radiant weapon data for baseline statistics
 */
export interface RadiantWeaponData {
  weaponName: string;
  headshotPercent: number;
  averageDamagePerRound: number;
  usageRate: number;
  sampleSize: number;
}