// TimelineValidator - Validates timeline before finalizing round
// Ensures timeline integrity with comprehensive validation rules
// Returns specific errors with event indices for regeneration

import type {
  TimelineEvent,
  ValidationResult,
  ValidationError,
  SimDamageEvent,
  SimKillEvent,
  PlantStartEvent,
  PlantCompleteEvent,
  DefuseStartEvent,
  DefuseCompleteEvent,
  PlayerRoundState,
  SpikeState,
} from '../../types/round-simulation';
import { WEAPONS } from '../../data/weapons';

// ============================================
// VALIDATION CONTEXT
// ============================================

/**
 * Internal state tracker for validation
 * Reconstructs player/spike state at each timeline event
 */
interface ValidationContext {
  // Player tracking
  playerStates: Map<string, PlayerRoundState>;
  deadPlayers: Set<string>; // Players who are dead at current point

  // Spike tracking
  spikeState: SpikeState;
  plantTime: number | null;

  // Round tracking
  roundEnded: boolean;
  roundEndCount: number;

  // Current validation position
  currentTimestamp: number;
  lastTimestamp: number;
}

// ============================================
// TIMELINE VALIDATOR CLASS
// ============================================

export class TimelineValidator {
  /**
   * Validate timeline before finalizing round
   *
   * Validation rules:
   * 1. No dead-player interactions (dead cannot deal/receive damage, plant, defuse)
   * 2. Spike timing legality (defuse must complete within 45s of plant)
   * 3. Damage math correctness (damage matches weapon tables for distance)
   * 4. Chronological ordering (timestamps monotonically increasing, except trade kills)
   * 5. State consistency (player HP never negative, shield depletes before HP)
   * 6. Exactly one win condition per round
   * 7. Spike state transitions valid (can't defuse before plant, etc)
   *
   * @param timeline - Timeline events to validate
   * @param initialPlayerStates - Initial player states at round start
   * @param config - Round configuration (for timing constants)
   * @returns ValidationResult with specific errors and event indices
   */
  validate(
    timeline: TimelineEvent[],
    initialPlayerStates: PlayerRoundState[],
    config?: { postPlantTime?: number }
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Initialize validation context
    const ctx = this.initializeContext(initialPlayerStates);

    // Run validation rules
    this.validateRoundEndCount(timeline, errors);
    this.validateChronologicalOrder(timeline, ctx, errors, warnings);
    this.validateEventSequence(timeline, ctx, errors, warnings, config?.postPlantTime || 45000);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize validation context with initial player states
   */
  private initializeContext(initialStates: PlayerRoundState[]): ValidationContext {
    const playerStates = new Map<string, PlayerRoundState>();

    for (const state of initialStates) {
      playerStates.set(state.playerId, { ...state });
    }

    return {
      playerStates,
      deadPlayers: new Set(),
      spikeState: 'carried',
      plantTime: null,
      roundEnded: false,
      roundEndCount: 0,
      currentTimestamp: 0,
      lastTimestamp: 0,
    };
  }

  // ============================================
  // VALIDATION RULE 6: EXACTLY ONE WIN CONDITION
  // ============================================

  /**
   * Rule 6: Exactly one round_end event per timeline
   */
  private validateRoundEndCount(timeline: TimelineEvent[], errors: ValidationError[]): void {
    const roundEndEvents = timeline.filter(e => e.type === 'round_end');

    if (roundEndEvents.length === 0) {
      errors.push({
        eventId: '',
        eventType: 'round_end',
        timestamp: 0,
        rule: 'single_win_condition',
        message: 'Timeline must have exactly one round_end event (found 0)',
        severity: 'error',
      });
    } else if (roundEndEvents.length > 1) {
      errors.push({
        eventId: roundEndEvents[1].id,
        eventType: 'round_end',
        timestamp: roundEndEvents[1].timestamp,
        rule: 'single_win_condition',
        message: `Timeline must have exactly one round_end event (found ${roundEndEvents.length})`,
        severity: 'error',
      });
    }
  }

  // ============================================
  // VALIDATION RULE 4: CHRONOLOGICAL ORDERING
  // ============================================

  /**
   * Rule 4: Timestamps must be monotonically increasing
   * Exception: Trade kills can have same timestamp as original kill
   */
  private validateChronologicalOrder(
    timeline: TimelineEvent[],
    _ctx: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    let lastTimestamp = 0;
    let lastKillTimestamp = 0;

    for (const event of timeline) {
      // Trade kills can happen at same timestamp as recent kill
      if (event.type === 'trade_kill') {
        const timeSinceLastKill = event.timestamp - lastKillTimestamp;
        if (timeSinceLastKill > 3000) {
          warnings.push({
            eventId: event.id,
            eventType: event.type,
            timestamp: event.timestamp,
            rule: 'trade_timing',
            message: `Trade kill happened ${timeSinceLastKill}ms after original kill (expected <3000ms)`,
            severity: 'warning',
          });
        }
      } else {
        // All other events must be strictly chronological
        if (event.timestamp < lastTimestamp) {
          errors.push({
            eventId: event.id,
            eventType: event.type,
            timestamp: event.timestamp,
            rule: 'chronological',
            message: `Event timestamp ${event.timestamp}ms is before previous event at ${lastTimestamp}ms`,
            severity: 'error',
          });
        }
      }

      // Track kill timestamps for trade validation
      if (event.type === 'kill') {
        lastKillTimestamp = event.timestamp;
      }

      lastTimestamp = event.timestamp;
    }
  }

  // ============================================
  // VALIDATION RULES 1-7: EVENT SEQUENCE VALIDATION
  // ============================================

  /**
   * Validate event sequence with all remaining rules
   * Rules: 1 (dead-player), 2 (spike timing), 3 (damage math), 5 (state consistency), 7 (spike transitions)
   */
  private validateEventSequence(
    timeline: TimelineEvent[],
    ctx: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationError[],
    postPlantTime: number
  ): void {
    for (const event of timeline) {
      // Update current timestamp
      ctx.currentTimestamp = event.timestamp;

      // Validate event based on type
      switch (event.type) {
        case 'damage':
          this.validateDamageEvent(event, ctx, errors, warnings);
          break;

        case 'kill':
          this.validateKillEvent(event, ctx, errors);
          break;

        case 'plant_start':
          this.validatePlantStartEvent(event, ctx, errors);
          break;

        case 'plant_complete':
          this.validatePlantCompleteEvent(event, ctx, errors);
          break;

        case 'defuse_start':
          this.validateDefuseStartEvent(event, ctx, errors);
          break;

        case 'defuse_complete':
          this.validateDefuseCompleteEvent(event, ctx, errors, warnings, postPlantTime);
          break;

        case 'plant_interrupt':
        case 'defuse_interrupt':
          // Transitions back to previous state - minimal validation needed
          if (event.type === 'plant_interrupt') {
            ctx.spikeState = 'carried';
          } else {
            ctx.spikeState = 'planted';
          }
          break;

        case 'spike_drop':
          ctx.spikeState = 'dropped';
          break;

        case 'spike_pickup':
          ctx.spikeState = 'carried';
          break;

        case 'spike_detonation':
          ctx.spikeState = 'detonated';
          break;

        case 'ability_use':
          this.validateAbilityUseEvent(event, ctx, errors);
          break;

        case 'heal':
          this.validateHealEvent(event, ctx, errors);
          break;

        case 'round_end':
          ctx.roundEnded = true;
          ctx.roundEndCount++;
          break;

        case 'trade_kill':
          // Validated in chronological check
          this.applyKill(event.victimId, ctx);
          break;
      }

      ctx.lastTimestamp = event.timestamp;
    }
  }

  // ============================================
  // DAMAGE EVENT VALIDATION
  // ============================================

  /**
   * Validate damage event
   * Rule 1: Attacker/defender must be alive
   * Rule 3: Damage must match weapon damage tables
   * Rule 5: Shield/HP state consistency
   */
  private validateDamageEvent(
    event: SimDamageEvent,
    ctx: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // Rule 1: Dead-player interaction check
    if (ctx.deadPlayers.has(event.attackerId)) {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'no_dead_interactions',
        message: `Dead player ${event.attackerId} cannot deal damage`,
        severity: 'error',
      });
    }

    if (ctx.deadPlayers.has(event.defenderId)) {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'no_dead_interactions',
        message: `Dead player ${event.defenderId} cannot receive damage`,
        severity: 'error',
      });
    }

    // Rule 5: State consistency - validate HP/shield state
    const defender = ctx.playerStates.get(event.defenderId);
    if (defender) {
      // Check shield/HP after damage
      if (event.defenderHpAfter < 0) {
        errors.push({
          eventId: event.id,
          eventType: event.type,
          timestamp: event.timestamp,
          rule: 'state_consistency',
          message: `Player HP cannot be negative (after: ${event.defenderHpAfter})`,
          severity: 'error',
        });
      }

      if (event.defenderShieldAfter < 0) {
        errors.push({
          eventId: event.id,
          eventType: event.type,
          timestamp: event.timestamp,
          rule: 'state_consistency',
          message: `Player shield cannot be negative (after: ${event.defenderShieldAfter})`,
          severity: 'error',
        });
      }

      // Validate shield depletes before HP
      const totalHpDamage = event.hits.reduce((sum, h) => sum + h.hpDamage, 0);

      if (totalHpDamage > 0 && event.defenderShieldAfter > 0) {
        // HP damage should only happen if shield is broken or penetrated
        const hasPenetration = event.hits.some(h => h.penetrated);
        if (!hasPenetration) {
          warnings.push({
            eventId: event.id,
            eventType: event.type,
            timestamp: event.timestamp,
            rule: 'state_consistency',
            message: `HP damage dealt while shield still active (${event.defenderShieldAfter}HP remaining)`,
            severity: 'warning',
          });
        }
      }

      // Rule 3: Damage math correctness (basic validation)
      if (event.weapon) {
        this.validateDamageMath(event, warnings);
      }

      // Apply damage to context state
      defender.hp = event.defenderHpAfter;
      defender.shieldHp = event.defenderShieldAfter;
      defender.damageTakenThisRound += event.totalDamage;
    }

    const attacker = ctx.playerStates.get(event.attackerId);
    if (attacker) {
      attacker.damageDealtThisRound += event.totalDamage;
    }
  }

  /**
   * Rule 3: Validate damage matches weapon damage tables
   */
  private validateDamageMath(event: SimDamageEvent, warnings: ValidationError[]): void {
    if (!event.weapon) return;

    const weaponData = WEAPONS[event.weapon.toLowerCase()];
    if (!weaponData) {
      warnings.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'damage_math',
        message: `Unknown weapon: ${event.weapon}`,
        severity: 'warning',
      });
      return;
    }

    // Validate each hit's damage is within weapon's possible damage range
    for (const hit of event.hits) {
      const expectedDamage = this.calculateExpectedDamage(
        weaponData,
        event.distance,
        hit.location
      );

      // Allow 10% tolerance for rounding/calculation differences
      const tolerance = expectedDamage * 0.1;
      const minExpected = expectedDamage - tolerance;
      const maxExpected = expectedDamage + tolerance;

      if (hit.baseDamage < minExpected || hit.baseDamage > maxExpected) {
        warnings.push({
          eventId: event.id,
          eventType: event.type,
          timestamp: event.timestamp,
          rule: 'damage_math',
          message: `Hit base damage ${hit.baseDamage} outside expected range [${minExpected.toFixed(1)}, ${maxExpected.toFixed(1)}] for ${event.weapon} at ${event.distance}m to ${hit.location}`,
          severity: 'warning',
        });
      }
    }
  }

  /**
   * Calculate expected base damage for a weapon at a given distance and location
   */
  private calculateExpectedDamage(
    weaponData: any,
    distance: number,
    hitLocation: 'head' | 'body' | 'leg'
  ): number {
    // Find appropriate damage range based on distance
    const damageRange = weaponData.damageRanges?.find(
      (range: any) => distance >= range.minDistance && distance <= range.maxDistance
    );

    if (!damageRange) {
      // Out of range, use last range's minimum damage
      const lastRange = weaponData.damageRanges?.[weaponData.damageRanges.length - 1];
      if (!lastRange) return 0;

      switch (hitLocation) {
        case 'head':
          return lastRange.head || 0;
        case 'body':
          return lastRange.body || 0;
        case 'leg':
          return lastRange.leg || 0;
        default:
          return 0;
      }
    }

    // Get base damage for hit location
    switch (hitLocation) {
      case 'head':
        return damageRange.head || 0;
      case 'body':
        return damageRange.body || 0;
      case 'leg':
        return damageRange.leg || 0;
      default:
        return 0;
    }
  }

  // ============================================
  // KILL EVENT VALIDATION
  // ============================================

  /**
   * Validate kill event
   * Rule 1: Killer/victim must be alive
   */
  private validateKillEvent(
    event: SimKillEvent,
    ctx: ValidationContext,
    errors: ValidationError[]
  ): void {
    // Rule 1: Dead-player interaction check
    if (ctx.deadPlayers.has(event.killerId)) {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'no_dead_interactions',
        message: `Dead player ${event.killerId} cannot get kills`,
        severity: 'error',
      });
    }

    if (ctx.deadPlayers.has(event.victimId)) {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'no_dead_interactions',
        message: `Dead player ${event.victimId} cannot be killed again`,
        severity: 'error',
      });
    }

    // Apply kill
    this.applyKill(event.victimId, ctx);
  }

  /**
   * Apply kill to context state
   */
  private applyKill(victimId: string, ctx: ValidationContext): void {
    ctx.deadPlayers.add(victimId);

    const victim = ctx.playerStates.get(victimId);
    if (victim) {
      victim.state = 'dead';
      victim.hp = 0;
      victim.shieldHp = 0;
    }
  }

  // ============================================
  // SPIKE EVENT VALIDATION
  // ============================================

  /**
   * Validate plant start event
   * Rule 1: Planter must be alive
   * Rule 7: Spike must be in valid state
   */
  private validatePlantStartEvent(
    event: PlantStartEvent,
    ctx: ValidationContext,
    errors: ValidationError[]
  ): void {
    // Rule 1: Planter must be alive
    if (ctx.deadPlayers.has(event.planterId)) {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'no_dead_interactions',
        message: `Dead player ${event.planterId} cannot plant spike`,
        severity: 'error',
      });
    }

    // Rule 7: Spike state transition validation
    if (ctx.spikeState !== 'carried') {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'spike_transitions',
        message: `Cannot start plant when spike is ${ctx.spikeState} (must be carried)`,
        severity: 'error',
      });
    }

    ctx.spikeState = 'planting';
  }

  /**
   * Validate plant complete event
   * Rule 7: Spike must be planting
   */
  private validatePlantCompleteEvent(
    event: PlantCompleteEvent,
    ctx: ValidationContext,
    errors: ValidationError[]
  ): void {
    // Rule 7: Spike state transition validation
    if (ctx.spikeState !== 'planting') {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'spike_transitions',
        message: `Cannot complete plant when spike is ${ctx.spikeState} (must be planting)`,
        severity: 'error',
      });
    }

    ctx.spikeState = 'planted';
    ctx.plantTime = event.timestamp;
  }

  /**
   * Validate defuse start event
   * Rule 1: Defuser must be alive
   * Rule 7: Spike must be planted
   */
  private validateDefuseStartEvent(
    event: DefuseStartEvent,
    ctx: ValidationContext,
    errors: ValidationError[]
  ): void {
    // Rule 1: Defuser must be alive
    if (ctx.deadPlayers.has(event.defuserId)) {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'no_dead_interactions',
        message: `Dead player ${event.defuserId} cannot defuse spike`,
        severity: 'error',
      });
    }

    // Rule 7: Spike state transition validation
    if (ctx.spikeState !== 'planted') {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'spike_transitions',
        message: `Cannot start defuse when spike is ${ctx.spikeState} (must be planted)`,
        severity: 'error',
      });
    }

    ctx.spikeState = 'defusing';
  }

  /**
   * Validate defuse complete event
   * Rule 2: Defuse must complete within post-plant time (45s)
   * Rule 7: Spike must be defusing
   */
  private validateDefuseCompleteEvent(
    event: DefuseCompleteEvent,
    ctx: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationError[],
    postPlantTime: number
  ): void {
    // Rule 7: Spike state transition validation
    if (ctx.spikeState !== 'defusing') {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'spike_transitions',
        message: `Cannot complete defuse when spike is ${ctx.spikeState} (must be defusing)`,
        severity: 'error',
      });
    }

    // Rule 2: Spike timing legality
    if (ctx.plantTime !== null) {
      const timeSincePlant = event.timestamp - ctx.plantTime;

      if (timeSincePlant > postPlantTime) {
        errors.push({
          eventId: event.id,
          eventType: event.type,
          timestamp: event.timestamp,
          rule: 'spike_timing',
          message: `Defuse completed ${timeSincePlant}ms after plant (max: ${postPlantTime}ms)`,
          severity: 'error',
        });
      }

      // Warning if cutting it close
      if (timeSincePlant > postPlantTime * 0.95) {
        warnings.push({
          eventId: event.id,
          eventType: event.type,
          timestamp: event.timestamp,
          rule: 'spike_timing',
          message: `Defuse completed with only ${postPlantTime - timeSincePlant}ms remaining`,
          severity: 'warning',
        });
      }
    } else {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'spike_timing',
        message: 'Defuse completed but no plant time recorded',
        severity: 'error',
      });
    }

    ctx.spikeState = 'defused';
  }

  // ============================================
  // ABILITY EVENT VALIDATION
  // ============================================

  /**
   * Validate ability use event
   * Rule 1: Player must be alive
   */
  private validateAbilityUseEvent(
    event: { type: 'ability_use'; id: string; timestamp: number; playerId: string },
    ctx: ValidationContext,
    errors: ValidationError[]
  ): void {
    // Rule 1: Player must be alive to use abilities
    if (ctx.deadPlayers.has(event.playerId)) {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'no_dead_interactions',
        message: `Dead player ${event.playerId} cannot use abilities`,
        severity: 'error',
      });
    }
  }

  /**
   * Validate heal event
   * Rule 1: Healer and target must be alive
   * Rule 5: HP cannot exceed max HP
   */
  private validateHealEvent(
    event: { type: 'heal'; id: string; timestamp: number; healerId: string; targetId: string; targetHpAfter: number },
    ctx: ValidationContext,
    errors: ValidationError[]
  ): void {
    // Rule 1: Healer must be alive
    if (ctx.deadPlayers.has(event.healerId)) {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'no_dead_interactions',
        message: `Dead player ${event.healerId} cannot heal`,
        severity: 'error',
      });
    }

    // Rule 1: Target must be alive
    if (ctx.deadPlayers.has(event.targetId)) {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'no_dead_interactions',
        message: `Dead player ${event.targetId} cannot receive healing`,
        severity: 'error',
      });
    }

    // Rule 5: HP cannot exceed max HP
    const target = ctx.playerStates.get(event.targetId);
    if (target && event.targetHpAfter > target.maxHp) {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'state_consistency',
        message: `HP after heal (${event.targetHpAfter}) exceeds max HP (${target.maxHp})`,
        severity: 'error',
      });
    }

    // Apply heal to context
    if (target) {
      target.hp = event.targetHpAfter;
    }
  }
}

// Export singleton instance
export const timelineValidator = new TimelineValidator();
