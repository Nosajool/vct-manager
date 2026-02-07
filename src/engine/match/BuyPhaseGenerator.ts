// BuyPhaseGenerator - Generates detailed buy phase before each round
// Uses consolidated data from weapons.ts, shields.ts, and abilities.ts
// Outputs BuyPhaseResult with per-player equipment decisions

import type { BuyType } from '../../types/strategy';
import type {
  WeaponId,
  AgentId,
  TeamSide,
  BuyPhaseEntry,
  BuyPhaseResult,
  AbilityPurchase,
} from '../../types/round-simulation';
import { WEAPONS } from '../../data/weapons';
import { SHIELDS, type ShieldType } from '../../data/shields';
import {
  AGENT_ABILITIES,
  type AbilitySlot,
} from '../../data/abilities';
import { ECONOMY_CONSTANTS } from './constants';

// ============================================
// TYPES
// ============================================

/** Player info needed for buy phase decisions */
export interface BuyPhasePlayerInfo {
  playerId: string;
  playerName: string;
  agentId: AgentId;
  teamSide: TeamSide;
  credits: number;
  /** Weapon kept from previous round (null if died or first round) */
  previousWeapon: WeaponId | null;
  /** Whether the player survived the previous round */
  survivedPreviousRound: boolean;
}

/** Team-level buy phase input */
export interface BuyPhaseTeamInput {
  players: BuyPhasePlayerInfo[];
  roundNumber: number;
  isOvertime: boolean;
  /** If provided, overrides the auto-detected buy type */
  forceBuyType?: BuyType;
}

// ============================================
// WEAPON SELECTION PREFERENCES BY BUY TYPE
// ============================================

interface BuyTypeWeaponPool {
  primary: WeaponId[];
  secondary: WeaponId[];
  shield: ShieldType;
}

const BUY_TYPE_POOLS: Record<BuyType, BuyTypeWeaponPool> = {
  eco: {
    primary: [],
    secondary: ['classic', 'shorty', 'frenzy'],
    shield: 'none',
  },
  half_buy: {
    primary: ['spectre', 'marshal', 'stinger', 'ares'],
    secondary: ['classic', 'ghost', 'frenzy'],
    shield: 'light',
  },
  force_buy: {
    primary: ['phantom', 'vandal', 'bulldog', 'guardian', 'judge'],
    secondary: ['classic', 'ghost', 'frenzy'],
    shield: 'light',
  },
  full_buy: {
    primary: ['vandal', 'phantom', 'operator', 'odin'],
    secondary: ['ghost', 'sheriff', 'classic'],
    shield: 'heavy',
  },
};

// ============================================
// BUY PHASE GENERATOR
// ============================================

export class BuyPhaseGenerator {
  /**
   * Generate a complete buy phase for both teams
   */
  generateBuyPhase(
    attackerInput: BuyPhaseTeamInput,
    defenderInput: BuyPhaseTeamInput
  ): BuyPhaseResult {
    const attackerBuyType = attackerInput.forceBuyType ?? this.detectBuyType(attackerInput);
    const defenderBuyType = defenderInput.forceBuyType ?? this.detectBuyType(defenderInput);

    const attackerEntries = this.generateTeamBuyPhase(
      attackerInput,
      attackerBuyType
    );
    const defenderEntries = this.generateTeamBuyPhase(
      defenderInput,
      defenderBuyType
    );

    const attackerTotalSpend = attackerEntries.reduce((sum, e) => sum + e.creditsSpent, 0);
    const defenderTotalSpend = defenderEntries.reduce((sum, e) => sum + e.creditsSpent, 0);

    return {
      roundNumber: attackerInput.roundNumber,
      attackerEntries,
      defenderEntries,
      attackerTotalSpend,
      defenderTotalSpend,
      attackerBuyType,
      defenderBuyType,
    };
  }

  /**
   * Generate buy phase entries for a single team
   */
  private generateTeamBuyPhase(
    input: BuyPhaseTeamInput,
    buyType: BuyType
  ): BuyPhaseEntry[] {
    return input.players.map((player) =>
      this.generatePlayerBuyPhase(player, buyType, input)
    );
  }

  /**
   * Generate buy phase for a single player
   */
  private generatePlayerBuyPhase(
    player: BuyPhasePlayerInfo,
    buyType: BuyType,
    input: BuyPhaseTeamInput
  ): BuyPhaseEntry {
    const startCredits = input.isOvertime ? 5000 : player.credits;
    let remaining = startCredits;
    let totalSpent = 0;

    // 1. Determine weapon kept from previous round
    let weaponKept: WeaponId | null = null;
    if (player.survivedPreviousRound && player.previousWeapon) {
      weaponKept = player.previousWeapon;
    }

    // 2. Buy shield
    const shieldType = this.selectShield(buyType, remaining);
    const shieldCost = SHIELDS[shieldType].cost;
    remaining -= shieldCost;
    totalSpent += shieldCost;

    // 3. Buy abilities (always before weapons so essential util is secured)
    const abilitiesPurchased = this.purchaseAbilities(player.agentId, buyType, remaining);
    const abilityCost = abilitiesPurchased.reduce((sum, a) => sum + a.cost, 0);
    remaining -= abilityCost;
    totalSpent += abilityCost;

    // 4. Buy weapon (or keep previous)
    let weaponPurchased: WeaponId | null = null;
    let sidearmPurchased: WeaponId | null = null;

    if (weaponKept) {
      // Survivor keeps their weapon, might upgrade sidearm
      const keptWeapon = WEAPONS[weaponKept];
      if (keptWeapon && keptWeapon.category !== 'sidearm') {
        // Has a primary, maybe upgrade sidearm
        sidearmPurchased = this.selectSidearm(buyType, remaining);
        if (sidearmPurchased) {
          const sidearmData = WEAPONS[sidearmPurchased];
          if (sidearmData && sidearmData.cost <= remaining) {
            remaining -= sidearmData.cost;
            totalSpent += sidearmData.cost;
          } else {
            sidearmPurchased = null;
          }
        }
      } else {
        // Keeping a sidearm from previous round, maybe buy a primary
        weaponPurchased = this.selectPrimary(buyType, remaining);
        if (weaponPurchased) {
          const weaponData = WEAPONS[weaponPurchased];
          if (weaponData) {
            remaining -= weaponData.cost;
            totalSpent += weaponData.cost;
          }
        }
      }
    } else {
      // No weapon kept — buy fresh
      weaponPurchased = this.selectPrimary(buyType, remaining);
      if (weaponPurchased) {
        const weaponData = WEAPONS[weaponPurchased];
        if (weaponData) {
          remaining -= weaponData.cost;
          totalSpent += weaponData.cost;
        }
      }

      // Buy sidearm if budget allows and not eco
      if (buyType !== 'eco') {
        sidearmPurchased = this.selectSidearm(buyType, remaining);
        if (sidearmPurchased) {
          const sidearmData = WEAPONS[sidearmPurchased];
          if (sidearmData && sidearmData.cost <= remaining) {
            remaining -= sidearmData.cost;
            totalSpent += sidearmData.cost;
          } else {
            sidearmPurchased = null;
          }
        }
      }
    }

    return {
      playerId: player.playerId,
      playerName: player.playerName,
      agentId: player.agentId,
      teamSide: player.teamSide,
      weaponPurchased,
      weaponKept,
      sidearmPurchased,
      shieldPurchased: shieldCost > 0 ? shieldType : null,
      abilitiesPurchased,
      creditsAtStart: startCredits,
      creditsSpent: totalSpent,
      creditsRemaining: remaining,
      buyType,
    };
  }

  // ============================================
  // WEAPON SELECTION
  // ============================================

  /**
   * Select a primary weapon based on buy type and budget
   */
  private selectPrimary(buyType: BuyType, budget: number): WeaponId | null {
    const pool = BUY_TYPE_POOLS[buyType].primary;
    if (pool.length === 0) return null;

    // Filter to affordable weapons
    const affordable = pool.filter((id) => {
      const weapon = WEAPONS[id];
      return weapon && weapon.cost <= budget;
    });

    if (affordable.length === 0) return null;

    // Weighted random selection — earlier entries in pool are preferred
    return this.weightedPoolSelect(affordable);
  }

  /**
   * Select a sidearm based on buy type and budget
   */
  private selectSidearm(buyType: BuyType, budget: number): WeaponId | null {
    const pool = BUY_TYPE_POOLS[buyType].secondary;

    // Filter to affordable and non-free (classic is free, only buy if upgrading)
    const affordable = pool.filter((id) => {
      const weapon = WEAPONS[id];
      return weapon && weapon.cost > 0 && weapon.cost <= budget;
    });

    if (affordable.length === 0) return null;
    return this.weightedPoolSelect(affordable);
  }

  // ============================================
  // SHIELD SELECTION
  // ============================================

  /**
   * Select shield based on buy type and available credits
   */
  private selectShield(buyType: BuyType, budget: number): ShieldType {
    const preferred = BUY_TYPE_POOLS[buyType].shield;
    const preferredCost = SHIELDS[preferred].cost;

    if (preferredCost <= budget) {
      return preferred;
    }

    // Downgrade if can't afford
    if (preferred === 'heavy' && SHIELDS.light.cost <= budget) {
      return 'light';
    }

    return 'none';
  }

  // ============================================
  // ABILITY PURCHASING
  // ============================================

  /**
   * Purchase abilities for a player based on agent and buy type
   *
   * Logic:
   * - Signature ability (E slot) is always free
   * - On eco: buy 0-1 cheap utility
   * - On half_buy: buy 1 charge of each ability if affordable
   * - On force_buy/full_buy: buy max charges of all abilities
   */
  private purchaseAbilities(
    agentId: AgentId,
    buyType: BuyType,
    budget: number
  ): AbilityPurchase[] {
    const agentData = AGENT_ABILITIES[agentId];
    if (!agentData) return [];

    const purchases: AbilityPurchase[] = [];
    let remaining = budget;

    const purchasableSlots: AbilitySlot[] = ['C', 'Q'];
    const slotNames: Record<AbilitySlot, 'basic1' | 'basic2'> = {
      C: 'basic1',
      Q: 'basic2',
      E: 'basic1', // unused — signature is free
      X: 'basic1', // unused — ultimate not purchased
    };

    for (const slot of purchasableSlots) {
      const ability = agentData.abilities[slot];
      if (ability.cost === 0) continue; // Some agents have free C/Q (Astra)

      let chargesToBuy: number;
      switch (buyType) {
        case 'eco':
          // Maybe buy 1 charge of cheaper ability
          chargesToBuy = ability.cost <= 200 ? 1 : 0;
          break;
        case 'half_buy':
          chargesToBuy = 1;
          break;
        case 'force_buy':
        case 'full_buy':
          chargesToBuy = ability.maxCharges;
          break;
      }

      // Clamp to what we can afford
      while (chargesToBuy > 0 && chargesToBuy * ability.cost > remaining) {
        chargesToBuy--;
      }

      if (chargesToBuy > 0) {
        const cost = chargesToBuy * ability.cost;
        purchases.push({
          abilityId: ability.id,
          abilityName: ability.name,
          slot: slotNames[slot],
          cost,
          charges: chargesToBuy,
        });
        remaining -= cost;
      }
    }

    return purchases;
  }

  // ============================================
  // BUY TYPE DETECTION
  // ============================================

  /**
   * Detect buy type from team average credits
   * Uses the same thresholds as EconomyEngine
   */
  private detectBuyType(input: BuyPhaseTeamInput): BuyType {
    const { BUY_THRESHOLDS } = ECONOMY_CONSTANTS;

    // Overtime: everyone gets 5000 credits — always full buy
    if (input.isOvertime) return 'full_buy';

    // Pistol rounds
    if (input.roundNumber === 1 || input.roundNumber === 13) return 'eco';

    const avgCredits =
      input.players.reduce((sum, p) => sum + p.credits, 0) / input.players.length;

    if (avgCredits >= BUY_THRESHOLDS.full_buy) return 'full_buy';
    if (avgCredits >= BUY_THRESHOLDS.force_buy) return 'force_buy';
    if (avgCredits >= BUY_THRESHOLDS.half_buy) return 'half_buy';
    return 'eco';
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Weighted random selection from a pool — first items are preferred
   * Weight decays linearly: first item weight = pool.length, last = 1
   */
  private weightedPoolSelect(pool: WeaponId[]): WeaponId {
    const weights = pool.map((_, i) => pool.length - i);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * totalWeight;

    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return pool[i];
    }

    return pool[pool.length - 1];
  }
}

export const buyPhaseGenerator = new BuyPhaseGenerator();
