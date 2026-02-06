// WeaponEngine - Handles weapon acquisition, damage calculation, and weapon management
// Pure class with no React/store dependencies

import type { BuyType } from '../../types';
import { WEAPON_PROFILES, type WeaponProfile, type HitLocation } from '../../types/match';
import { SHIELDS } from '../../data/shields';
import { WEAPONS } from '../../data/weapons';
import type { PlayerRoundState, HitBreakdown } from '../../types/round-simulation';

/**
 * Player weapon loadout for a round
 */
export interface PlayerLoadout {
  /** Primary weapon (rifle, smg, shotgun, heavy) */
  primary: WeaponProfile | null;
  /** Secondary weapon (sidearm) */
  secondary: WeaponProfile;
  /** Shield type */
  shield: 'none' | 'light' | 'heavy' | 'regen';
  /** Whether player has ultimate ready */
  hasUltimate: boolean;
}

/**
 * Damage calculation result
 */
export interface DamageResult {
  /** Base damage before armor */
  baseDamage: number;
  /** Final damage after armor reduction */
  finalDamage: number;
  /** Damage absorbed by shield */
  shieldDamage: number;
  /** Damage dealt to HP */
  hpDamage: number;
  /** Remaining shield */
  remainingShield: number;
  /** Remaining HP */
  remainingHp: number;
}

/**
 * Weapon acquisition preferences by buy type
 */
const BUY_TYPE_WEAPON_PREFERENCES = {
  eco: {
    // Save money, maybe a light sidearm or armor
    primary: [] as string[], // No primary weapons in eco
    secondary: ['Classic', 'Shorty', 'Frenzy'],
    shield: 'none',
  },
  half_buy: {
    // SMGs or light rifles + light armor
    primary: ['Spectre', 'Stinger', 'Bucky', 'Marshal'],
    secondary: ['Classic', 'Ghost', 'Frenzy', 'Shorty'],
    shield: 'light',
  },
  force_buy: {
    // Basic rifles + basic armor
    primary: ['Phantom', 'Vandal', 'Bulldog', 'Judge'],
    secondary: ['Classic', 'Ghost', 'Frenzy'],
    shield: 'light',
  },
  full_buy: {
    // Best rifles + full armor + abilities
    primary: ['Vandal', 'Phantom', 'Operator', 'Odin'],
    secondary: ['Ghost', 'Sheriff', 'Classic'],
    shield: 'heavy',
  },
} as const satisfies Record<BuyType, {
  primary: (string | null)[];
  secondary: string[];
  shield: 'none' | 'light' | 'heavy' | 'regen';
}>;

/**
 * Shield costs and absorption values
 */
const SHIELD_DATA = {
  none: { cost: 0, absorption: 0 },
  light: { cost: 400, absorption: 25 },
  heavy: { cost: 1000, absorption: 50 },
  regen: { cost: 650, absorption: 25 },
} as const;

export class WeaponEngine {
  /**
   * Generate player loadout based on economy and buy type
   */
  generateLoadout(
    buyType: BuyType,
    playerCredits: number,
    playerStats?: { mechanics: number; [key: string]: number }
  ): PlayerLoadout {
    const preferences = BUY_TYPE_WEAPON_PREFERENCES[buyType];
    let totalCost = 0;

    // Select secondary weapon (always have one)
    const secondary = this.selectWeapon(
      preferences.secondary,
      playerCredits - totalCost,
      playerStats
    );
    totalCost += secondary.cost;

    // Select primary weapon based on buy type and remaining credits
    let primary: WeaponProfile | null = null;
    if (preferences.primary && preferences.primary[0] !== null) {
      primary = this.selectWeapon(
        preferences.primary as string[],
        playerCredits - totalCost,
        playerStats
      );
      if (primary) {
        totalCost += primary.cost;
      }
    }

    // Select shield if budget allows
    let shield: 'none' | 'light' | 'heavy' | 'regen' = preferences.shield;
    const shieldCost = SHIELD_DATA[shield].cost;
    
    if (totalCost + shieldCost > playerCredits) {
      // Can't afford preferred shield, downgrade
      if (shield === 'heavy') {
        shield = 'light';
      } else if (shield === 'light') {
        shield = 'none';
      }
    } else {
      totalCost += shieldCost;
    }

    return {
      primary,
      secondary,
      shield,
      hasUltimate: false, // Will be set by UltimateEngine
    };
  }

  /**
   * Calculate damage for a hit with distance-based damage falloff
   * @deprecated Use calculateSimDamage for new round simulation system
   */
  calculateDamage(
    weapon: WeaponProfile,
    distance: number,
    hitLocation: HitLocation,
    targetShield: 'none' | 'light' | 'heavy' | 'regen',
    targetShieldHealth: number,
    targetRegenPool: number,
    targetHp: number
  ): DamageResult {
    // Find appropriate damage range based on distance
    const damageRange = weapon.damageRanges.find(
      range => distance >= range.minDistance && distance <= range.maxDistance
    );

    if (!damageRange) {
      // Out of range, use minimum damage
      const lastRange = weapon.damageRanges[weapon.damageRanges.length - 1];
      return this.applyArmorAndCalculate(lastRange.head, hitLocation, targetShield, targetShieldHealth, targetRegenPool, targetHp);
    }

    // Get base damage for hit location
    let baseDamage: number;
    switch (hitLocation) {
      case 'head':
        baseDamage = damageRange.head;
        break;
      case 'body':
        baseDamage = damageRange.body;
        break;
      case 'leg':
        baseDamage = damageRange.leg;
        break;
    }

    return this.applyArmorAndCalculate(baseDamage, hitLocation, targetShield, targetShieldHealth, targetRegenPool, targetHp);
  }

  /**
   * Calculate damage for the new round simulation system.
   * Processes multiple sequential shots against a target, applying proper
   * shield absorption from shields.ts and returning per-hit breakdowns.
   */
  calculateSimDamage(params: {
    weapon: WeaponProfile;
    distance: number;
    targetState: PlayerRoundState;
    shotCount: number;
    headshotProbability: number;
  }): { hits: HitBreakdown[]; targetStateAfter: PlayerRoundState } {
    const { weapon, distance, shotCount, headshotProbability } = params;

    // Shallow-copy target state so we can mutate across shots
    const state: PlayerRoundState = {
      ...params.targetState,
      abilities: { ...params.targetState.abilities },
    };

    const hits: HitBreakdown[] = [];

    for (let i = 0; i < shotCount; i++) {
      if (state.hp <= 0) break;

      const location = this.rollHitLocation(headshotProbability);
      const baseDamage = this.lookupBaseDamage(weapon, distance, location);

      const shieldData = SHIELDS[state.shieldType];
      const absorption = shieldData.absorption; // 0.66 for standard, 1.0 for regen, 0 for none

      // Calculate how much the shield tries to absorb
      const shieldPortion = Math.floor(baseDamage * absorption);
      const bleedThrough = baseDamage - shieldPortion;

      // Shield can only absorb up to its remaining HP
      const shieldAbsorbed = Math.min(shieldPortion, state.shieldHp);
      const shieldExcess = shieldPortion - shieldAbsorbed;
      const penetrated = shieldAbsorbed > 0 && shieldAbsorbed < shieldPortion;

      // HP damage = bleed-through + any excess the broken shield couldn't absorb
      let hpDamage = bleedThrough + shieldExcess;
      hpDamage = Math.min(hpDamage, state.hp);

      // Update running state
      state.shieldHp -= shieldAbsorbed;
      state.hp -= hpDamage;
      if (state.hp <= 0) {
        state.hp = 0;
        state.state = 'dead';
      }

      hits.push({
        location,
        baseDamage,
        shieldAbsorbed,
        hpDamage,
        penetrated,
      });
    }

    return { hits, targetStateAfter: state };
  }

  /**
   * Roll a random hit location based on headshot probability.
   * Remaining probability is split 85% body / 15% leg.
   */
  private rollHitLocation(headshotProbability: number): HitLocation {
    const roll = Math.random();
    if (roll < headshotProbability) return 'head';
    const bodyThreshold = headshotProbability + (1 - headshotProbability) * 0.85;
    return roll < bodyThreshold ? 'body' : 'leg';
  }

  /**
   * Look up base damage for a weapon at a given distance and hit location.
   * Falls back to the last damage range if distance exceeds all ranges.
   */
  private lookupBaseDamage(weapon: WeaponProfile, distance: number, location: HitLocation): number {
    const damageRange = weapon.damageRanges.find(
      range => distance >= range.minDistance && distance <= range.maxDistance
    );

    const range = damageRange ?? weapon.damageRanges[weapon.damageRanges.length - 1];
    return range[location];
  }

  /**
   * Apply armor calculations and return final damage breakdown
   */
  private applyArmorAndCalculate(
    baseDamage: number,
    _hitLocation: HitLocation,
    shieldType: 'none' | 'light' | 'heavy' | 'regen',
    shieldHealth: number,
    _regenPool: number,
    currentHp: number
  ): DamageResult {
    const shieldAbsorption = SHIELD_DATA[shieldType].absorption;
    const shieldDamage = Math.min(baseDamage, shieldAbsorption);
    let hpDamage = Math.max(0, baseDamage - shieldAbsorption);

    // Apply damage to shield first
    const remainingShield = Math.max(0, shieldHealth - shieldDamage);
    const actualShieldDamage = shieldHealth - remainingShield;

    // If shield is broken, excess damage goes to HP
    if (actualShieldDamage < shieldDamage) {
      hpDamage += shieldDamage - actualShieldDamage;
    }

    // Apply damage to HP
    const remainingHp = Math.max(0, currentHp - hpDamage);
    const actualHpDamage = currentHp - remainingHp;

    return {
      baseDamage,
      finalDamage: actualShieldDamage + actualHpDamage,
      shieldDamage: actualShieldDamage,
      hpDamage: actualHpDamage,
      remainingShield,
      remainingHp,
    };
  }

  /**
   * Get hit location probabilities based on weapon type and player skill
   */
  getHitLocationProbabilities(
    weapon: WeaponProfile,
    playerMechanics: number,
    distance: number
  ): Record<HitLocation, number> {
    const baseProbabilities = {
      sniper: { head: 0.4, body: 0.5, leg: 0.1 },
      rifle: { head: 0.15, body: 0.75, leg: 0.1 },
      smg: { head: 0.08, body: 0.72, leg: 0.2 },
      shotgun: { head: 0.25, body: 0.65, leg: 0.1 },
      heavy: { head: 0.12, body: 0.78, leg: 0.1 },
      sidearm: { head: 0.1, body: 0.75, leg: 0.15 },
      melee: { head: 0.5, body: 0.4, leg: 0.1 },
    };

    const weaponBase = baseProbabilities[weapon.category];
    const headshotBonus = (playerMechanics / 100 - 0.5) * 0.2; // Up to 10% headshot bonus for high mechanics
    const distancePenalty = distance > 30 ? 0.05 : 0; // Less headshots at long range

    return {
      head: Math.max(0.02, Math.min(0.8, weaponBase.head + headshotBonus - distancePenalty)),
      body: weaponBase.body - (headshotBonus / 2),
      leg: weaponBase.leg - (headshotBonus / 2),
    };
  }

  /**
   * Select weapon from preferences based on budget and player stats
   */
  private selectWeapon(
    weaponNames: string[],
    budget: number,
    playerStats?: { mechanics: number; [key: string]: number }
  ): WeaponProfile {
    // Filter weapons by budget
    const affordableWeapons = weaponNames
      .map(name => WEAPON_PROFILES[name])
      .filter(weapon => weapon && weapon.cost <= budget);

    if (affordableWeapons.length === 0) {
      // Fallback to cheapest option (Classic is always available)
      return WEAPON_PROFILES.Classic;
    }

    // Select weapon based on player mechanics and preferences
    if (playerStats?.mechanics && playerStats.mechanics > 0.7) {
      // High mechanics players prefer high-skill weapons
      const highSkillWeapons = affordableWeapons.filter(w => 
        ['sniper', 'rifle'].includes(w.category)
      );
      if (highSkillWeapons.length > 0) {
        return highSkillWeapons[Math.floor(Math.random() * highSkillWeapons.length)];
      }
    }

    // Random selection from affordable options
    return affordableWeapons[Math.floor(Math.random() * affordableWeapons.length)];
  }

  /**
   * Get random distance for combat encounter (in metres)
   */
  getRandomCombatDistance(): number {
    // Weighted distance distribution based on typical Valorant engagements
    const ranges = [
      { min: 0, max: 10, weight: 0.3 },    // Close range
      { min: 10, max: 20, weight: 0.35 },  // Medium-close
      { min: 20, max: 30, weight: 0.25 },  // Medium
      { min: 30, max: 50, weight: 0.1 },   // Long range
    ];

    const random = Math.random();
    let cumulative = 0;

    for (const range of ranges) {
      cumulative += range.weight;
      if (random <= cumulative) {
        return range.min + Math.random() * (range.max - range.min);
      }
    }

    return 15; // Default medium distance
  }

  /**
   * Check if melee attack should occur (1/5000 chance per round)
   */
  shouldMeleeAttack(): boolean {
    return Math.random() < 1 / 5000;
  }

  /**
   * Bridge from WeaponId string to WeaponProfile.
   * BuyPhaseGenerator outputs lowercase WeaponId strings (e.g. 'vandal'),
   * while calculateSimDamage and old systems use WeaponProfile objects.
   */
  getWeaponProfileById(weaponId: string): WeaponProfile {
    // Try new data first (lowercase keys)
    const weaponData = WEAPONS[weaponId.toLowerCase()];
    if (weaponData) {
      return {
        name: weaponData.name,
        category: weaponData.category,
        cost: weaponData.cost,
        damageRanges: [...weaponData.damageRanges],
      };
    }

    // Fall back to old WEAPON_PROFILES (PascalCase keys)
    const profile = WEAPON_PROFILES[weaponId] ||
                    WEAPON_PROFILES[weaponId.charAt(0).toUpperCase() + weaponId.slice(1)];
    if (profile) {
      return profile;
    }

    // Ultimate fallback: Classic
    return WEAPON_PROFILES.Classic;
  }
}

// Export singleton instance
export const weaponEngine = new WeaponEngine();