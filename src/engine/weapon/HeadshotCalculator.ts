// Headshot Calculator Engine
// Calculates realistic headshot probabilities based on weapon data, player skill, and situation

import type { 
  Weapon, 
  HeadshotTier, 
  HeadshotContext, 
  HeadshotResult, 
  DamageResult,
  HitZone 
} from '../../types/weapons';
import { WEAPONS, BASELINE_HEADSHOT_RATES, MECHANICS_MULTIPLIER } from './WeaponDatabase';

export class HeadshotCalculator {
  /**
   * Calculate headshot probability for a given context
   */
  static calculateHeadshotProbability(context: HeadshotContext): HeadshotResult {
    const { player, weapon, situation } = context;
    
    // 1. Get baseline rate for weapon tier
    const baselineRate = BASELINE_HEADSHOT_RATES[weapon.headshotTier];
    
    // 2. Apply mechanics multiplier
    const mechanicsMultiplier = MECHANICS_MULTIPLIER.calculateMultiplier(
      player.mechanics, 
      weapon.headshotTier
    );
    
    // 3. Apply situational modifiers
    const situationalModifiers = this.calculateSituationalModifiers(weapon, situation);
    
    // 4. Apply player-specific weapon skill modifier
    const weaponSkillModifier = 0.7 + (player.weaponSkill / 100) * 0.6; // 0.7-1.3 range
    
    // 5. Apply confidence modifier
    const confidenceModifier = 0.8 + (player.confidence / 100) * 0.4; // 0.8-1.2 range
    
    // 6. Calculate final probability
    let probability = baselineRate * 
                     mechanicsMultiplier * 
                     situationalModifiers * 
                     weaponSkillModifier * 
                     confidenceModifier;
    
    // 7. Clamp to reasonable bounds
    probability = Math.max(0, Math.min(1, probability));
    
    // 8. Determine likely hit zone and damage
    const hitZone = this.determineHitZone(probability);
    const damage = this.calculateDamage(weapon, hitZone, situation.distance);
    const isKill = damage >= 100; // Assuming 100 HP
    
    return {
      probability,
      hitZone,
      damage,
      isKill,
    };
  }
  
  /**
   * Calculate situational modifiers based on combat conditions
   */
  private static calculateSituationalModifiers(weapon: Weapon, situation: {
    distance: number;
    moving: boolean;
    enemyMoving: boolean;
    scoped: boolean;
    duelTime: number;
    pressure: number;
  }): number {
    let modifier = 1.0;
    
    // Distance modifier
    const distanceModifier = this.calculateDistanceModifier(weapon, situation.distance);
    modifier *= distanceModifier;
    
    // Movement modifiers
    if (situation.moving) {
      modifier *= 0.85; // 15% penalty for shooting while moving
    }
    
    if (situation.enemyMoving) {
      modifier *= 0.9; // 10% penalty for hitting moving target
    }
    
    // Scoped bonus for snipers
    if (weapon.category === 'sniper' && situation.scoped) {
      modifier *= 1.3; // 30% bonus when scoped
    } else if (weapon.category === 'sniper' && !situation.scoped) {
      modifier *= 0.4; // 60% penalty for no-scoping
    }
    
    // Duel time modifier (longer duels = harder to headshot)
    if (situation.duelTime > 2) {
      modifier *= 0.9; // 10% penalty for extended duels
    } else if (situation.duelTime < 0.3) {
      modifier *= 1.1; // 10% bonus for quick reactions
    }
    
    // Pressure modifier
    const pressurePenalty = 1.0 - (situation.pressure / 100) * 0.2; // Max 20% penalty
    modifier *= pressurePenalty;
    
    return modifier;
  }
  
  /**
   * Calculate distance-based modifier
   */
  private static calculateDistanceModifier(weapon: Weapon, distance: number): number {
    const { optimal, max } = weapon.effectiveRange;
    
    if (distance <= optimal) {
      // Optimal range - full accuracy
      return 1.0;
    } else if (distance <= max) {
      // Falloff range - linear decrease
      const falloffRatio = (distance - optimal) / (max - optimal);
      return 1.0 - falloffRatio * 0.4; // 40% max penalty at max range
    } else {
      // Beyond effective range - severe penalty
      const overRatio = (distance - max) / max;
      return 0.6 - overRatio * 0.4; // Continue decreasing beyond max range
    }
  }
  
  /**
   * Determine hit zone based on headshot probability
   */
  private static determineHitZone(headshotProb: number): HitZone {
    // Weighted random selection based on probabilities
    const bodyProb = (1 - headshotProb) * 0.7; // 70% of non-headshots hit body
    const legsProb = 1 - headshotProb - bodyProb; // Remaining hit legs
    
    const random = Math.random();
    
    if (random < headshotProb) {
      return 'head';
    } else if (random < headshotProb + bodyProb) {
      return 'body';
    } else {
      return 'legs';
    }
  }
  
  /**
   * Calculate damage based on weapon, hit zone, and distance
   */
  private static calculateDamage(weapon: Weapon, hitZone: HitZone, distance: number): number {
    let baseDamage = weapon.baseDamage[hitZone];
    
    // Apply distance falloff to damage
    const { optimal, max } = weapon.effectiveRange;
    
    if (distance > optimal) {
      if (distance <= max) {
        const falloffRatio = (distance - optimal) / (max - optimal);
        baseDamage *= 1.0 - falloffRatio * 0.3; // 30% max damage falloff
      } else {
        const overRatio = (distance - max) / max;
        baseDamage *= 0.7 - overRatio * 0.2; // Continue decreasing beyond max range
      }
    }
    
    return Math.max(1, Math.round(baseDamage)); // Min 1 damage
  }
  
  /**
   * Simulate a shot and return the damage result
   */
  static simulateShot(context: HeadshotContext): DamageResult {
    const result = this.calculateHeadshotProbability(context);
    const hitZone = this.determineHitZone(result.probability);
    const damage = this.calculateDamage(context.weapon, hitZone, context.situation.distance);
    const isHeadshot = hitZone === 'head';
    
    // Assume target has 100 HP + 50 armor for kill calculation
    const totalHealth = 150;
    const isKill = damage >= totalHealth;
    
    return {
      hitZone,
      damage,
      isHeadshot,
      isKill,
      remainingHealth: Math.max(0, totalHealth - damage),
    };
  }
  
  /**
   * Get expected headshot percentage for a player with given mechanics
   */
  static getExpectedHeadshotRate(
    mechanics: number, 
    weaponId: string, 
    weaponSkill?: number,
    confidence?: number
  ): number {
    const weapon = WEAPONS[weaponId];
    if (!weapon || weapon.headshotTier === 'F') return 0;
    
    const context: HeadshotContext = {
      player: {
        mechanics,
        weaponSkill: weaponSkill || mechanics, // Default to mechanics
        confidence: confidence || 70, // Default neutral confidence
      },
      weapon,
      situation: {
        distance: 20, // Medium range average
        moving: false,
        enemyMoving: false,
        scoped: weapon.category === 'sniper',
        duelTime: 1.0,
        pressure: 50,
      },
    };
    
    return this.calculateHeadshotProbability(context).probability;
  }
  
  /**
   * Analyze weapon tier and recommend improvements
   */
  static analyzeWeaponTier(mechanics: number): Record<HeadshotTier, number> {
    const analysis: Record<HeadshotTier, number> = {} as Record<HeadshotTier, number>;
    
    for (const tier of ['S', 'A', 'B', 'C', 'D', 'F'] as HeadshotTier[]) {
      const baseline = BASELINE_HEADSHOT_RATES[tier];
      const multiplier = MECHANICS_MULTIPLIER.calculateMultiplier(mechanics, tier);
      analysis[tier] = baseline * multiplier;
    }
    
    return analysis;
  }
  
  /**
   * Generate weapon recommendation for player mechanics
   */
  static getWeaponRecommendations(mechanics: number): Array<{weapon: Weapon; expectedHsRate: number; suitability: string}> {
    const recommendations: Array<{weapon: Weapon; expectedHsRate: number; suitability: string}> = [];
    
    for (const weapon of Object.values(WEAPONS)) {
      if (weapon.headshotTier === 'F') continue; // Skip melee
      
      const hsRate = this.getExpectedHeadshotRate(mechanics, weapon.id);
      
      let suitability = 'Fair';
      if (hsRate >= 0.40) suitability = 'Excellent';
      else if (hsRate >= 0.35) suitability = 'Good';
      else if (hsRate >= 0.25) suitability = 'Average';
      else if (hsRate < 0.15) suitability = 'Poor';
      
      recommendations.push({
        weapon,
        expectedHsRate: hsRate,
        suitability,
      });
    }
    
    // Sort by expected headshot rate
    return recommendations.sort((a, b) => b.expectedHsRate - a.expectedHsRate);
  }
}

// Export singleton instance
export const headshotCalculator = new HeadshotCalculator();
