// Drama Effect Resolver
// Translates abstract DramaEffect descriptors into concrete game state mutations

import type { DramaEffect, DramaGameStateSnapshot } from '../../types/drama';
import type { PlayerStats } from '../../types/player';

// ============================================================================
// Types
// ============================================================================

/**
 * Concrete mutation to apply to game state
 */
export interface ResolvedEffect {
  type: 'update_player' | 'update_team' | 'set_flag' | 'clear_flag';

  // Player updates
  playerId?: string;
  field?: string;
  delta?: number;
  absoluteValue?: number;

  // Flag operations
  flag?: string;
  flagDuration?: number;
}

/**
 * Extended player selector types for effect resolution
 */
type EffectPlayerSelector =
  | 'triggering'      // First player in involvedPlayerIds
  | 'all_team'        // All players in snapshot
  | 'random_teammate' // Random player excluding triggering player
  | 'specific';       // Specific player by ID

// ============================================================================
// Constants
// ============================================================================

/** Valid range for percentage-based values (morale, form, chemistry, fanbase) */
const PERCENTAGE_MIN = 0;
const PERCENTAGE_MAX = 100;

/** Valid range for player stats */
const STAT_MIN = 0;
const STAT_MAX = 100;

// ============================================================================
// Main Resolver Function
// ============================================================================

/**
 * Resolves abstract DramaEffect descriptors into concrete mutations
 *
 * @param effects - Array of abstract effect descriptors from event template
 * @param snapshot - Current game state snapshot for context
 * @param involvedPlayerIds - Players involved in the triggering event
 * @returns Array of concrete mutations to apply to game state
 */
export function resolveEffects(
  effects: DramaEffect[],
  snapshot: DramaGameStateSnapshot,
  involvedPlayerIds: string[]
): ResolvedEffect[] {
  const resolved: ResolvedEffect[] = [];

  for (const effect of effects) {
    const effectResults = resolveEffect(effect, snapshot, involvedPlayerIds);
    resolved.push(...effectResults);
  }

  return resolved;
}

// ============================================================================
// Effect Resolution
// ============================================================================

/**
 * Resolves a single DramaEffect into one or more ResolvedEffects
 */
function resolveEffect(
  effect: DramaEffect,
  snapshot: DramaGameStateSnapshot,
  involvedPlayerIds: string[]
): ResolvedEffect[] {
  const { target } = effect;

  // Handle flag operations
  if (target === 'set_flag') {
    return [{
      type: 'set_flag',
      flag: effect.flag!,
      flagDuration: effect.flagDuration,
    }];
  }

  if (target === 'clear_flag') {
    return [{
      type: 'clear_flag',
      flag: effect.flag!,
    }];
  }

  // Handle team modifications
  if (target === 'team_chemistry' || target === 'team_budget') {
    return resolveTeamEffect(effect);
  }

  // Handle player modifications
  if (target === 'player_morale' || target === 'player_form' || target === 'player_stat') {
    return resolvePlayerEffect(effect, snapshot, involvedPlayerIds);
  }

  // Handle special targets mentioned in spec
  if (target === 'trigger_event' || target === 'escalate_event' || target === 'add_cooldown') {
    // These are handled by the drama engine, not the effect resolver
    return [];
  }

  return [];
}

/**
 * Resolves team-level effects
 */
function resolveTeamEffect(effect: DramaEffect): ResolvedEffect[] {
  const { target, delta, absoluteValue } = effect;

  const field = target === 'team_chemistry' ? 'chemistry' : 'fanbase';
  const resolved: ResolvedEffect = {
    type: 'update_team',
    field,
  };

  if (absoluteValue !== undefined) {
    resolved.absoluteValue = clampPercentage(absoluteValue);
  } else if (delta !== undefined) {
    resolved.delta = delta;
  }

  return [resolved];
}

/**
 * Resolves player-level effects
 */
function resolvePlayerEffect(
  effect: DramaEffect,
  snapshot: DramaGameStateSnapshot,
  involvedPlayerIds: string[]
): ResolvedEffect[] {
  const { target, delta, absoluteValue, stat } = effect;

  // Resolve which players to affect
  const targetPlayerIds = resolvePlayerSelector(
    effect.playerSelector as EffectPlayerSelector | undefined,
    effect.playerId,
    snapshot,
    involvedPlayerIds
  );

  if (targetPlayerIds.length === 0) {
    return [];
  }

  // Determine the field to modify
  let field: string;
  if (target === 'player_morale') {
    field = 'morale';
  } else if (target === 'player_form') {
    field = 'form';
  } else if (target === 'player_stat' && stat) {
    field = `stats.${stat}`;
  } else {
    return [];
  }

  // Create one resolved effect per affected player
  return targetPlayerIds.map(playerId => {
    const resolved: ResolvedEffect = {
      type: 'update_player',
      playerId,
      field,
    };

    // Handle absolute value or delta
    if (absoluteValue !== undefined) {
      const clamped = field.startsWith('stats.')
        ? clampStat(absoluteValue)
        : clampPercentage(absoluteValue);
      resolved.absoluteValue = clamped;
    } else if (delta !== undefined) {
      resolved.delta = delta;
    }

    return resolved;
  });
}

// ============================================================================
// Player Selection
// ============================================================================

/**
 * Resolves player selector into concrete player IDs
 */
function resolvePlayerSelector(
  selector: EffectPlayerSelector | undefined,
  playerId: string | undefined,
  snapshot: DramaGameStateSnapshot,
  involvedPlayerIds: string[]
): string[] {
  // Default to triggering player if no selector specified
  if (!selector) {
    return involvedPlayerIds.length > 0 ? [involvedPlayerIds[0]] : [];
  }

  switch (selector) {
    case 'triggering':
      return involvedPlayerIds.length > 0 ? [involvedPlayerIds[0]] : [];

    case 'specific':
      return playerId ? [playerId] : [];

    case 'all_team': {
      // All players in the snapshot
      return snapshot.players.map(p => p.id);
    }

    case 'random_teammate': {
      if (involvedPlayerIds.length === 0) {
        return [];
      }

      const triggeringPlayerId = involvedPlayerIds[0];
      const teammates = snapshot.players.filter(p => p.id !== triggeringPlayerId);

      if (teammates.length === 0) {
        return [];
      }

      const randomIndex = Math.floor(Math.random() * teammates.length);
      return [teammates[randomIndex].id];
    }

    default:
      return [];
  }
}

// ============================================================================
// Value Clamping
// ============================================================================

/**
 * Clamps a percentage value to valid range (0-100)
 */
function clampPercentage(value: number): number {
  return Math.max(PERCENTAGE_MIN, Math.min(PERCENTAGE_MAX, value));
}

/**
 * Clamps a stat value to valid range (0-100)
 */
function clampStat(value: number): number {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, value));
}
