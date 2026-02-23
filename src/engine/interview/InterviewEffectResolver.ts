// Interview Effect Resolver
// Translates InterviewEffects descriptors into concrete ResolvedInterviewEffect mutations

import type { InterviewEffects, InterviewSnapshot } from '../../types/interview';

// ============================================================================
// Types
// ============================================================================

/**
 * Concrete mutation to apply to game state
 */
export interface ResolvedInterviewEffect {
  type: 'update_player' | 'update_team' | 'set_flag' | 'clear_flag' | 'rivalry_delta' | 'drama_boost';

  // update_player
  playerId?: string;

  // update_player | update_team | rivalry_delta | drama_boost
  field?: string;   // 'morale' for player; 'fanbase'|'hypeLevel'|'sponsorTrust' for team
  delta?: number;

  // set_flag / clear_flag
  flag?: string;
  flagDuration?: number;  // days (not a date string — date computation stays in service)

  // rivalry_delta
  opponentTeamId?: string;
}

// ============================================================================
// Main Resolver Function
// ============================================================================

/**
 * Translates abstract InterviewEffects into concrete mutations.
 *
 * Pure function — reads no store state, applies no mutations.
 * Clamping is NOT done here; it stays in the service's apply loop.
 *
 * @param effects - The effects descriptor from the chosen interview option
 * @param snapshot - Snapshot providing the players list for morale fallback
 * @param opponentTeamId - Required for rivalry_delta effects
 * @returns Array of concrete mutations to apply to game state
 */
export function resolveInterviewEffects(
  effects: InterviewEffects,
  snapshot: InterviewSnapshot,
  opponentTeamId?: string,
): ResolvedInterviewEffect[] {
  const resolved: ResolvedInterviewEffect[] = [];

  // morale — one effect per targeted player (or all snapshot players as fallback)
  if (effects.morale !== undefined && effects.morale !== 0) {
    const targets = effects.targetPlayerIds ?? snapshot.players.map((p) => p.id);
    for (const playerId of targets) {
      resolved.push({ type: 'update_player', playerId, field: 'morale', delta: effects.morale });
    }
  }

  // fanbase
  if (effects.fanbase !== undefined) {
    resolved.push({ type: 'update_team', field: 'fanbase', delta: effects.fanbase });
  }

  // hype → hypeLevel field name
  if (effects.hype !== undefined) {
    resolved.push({ type: 'update_team', field: 'hypeLevel', delta: effects.hype });
  }

  // sponsorTrust
  if (effects.sponsorTrust !== undefined) {
    resolved.push({ type: 'update_team', field: 'sponsorTrust', delta: effects.sponsorTrust });
  }

  // rivalryDelta — only emitted when opponentTeamId is known
  if (effects.rivalryDelta !== undefined && effects.rivalryDelta !== 0 && opponentTeamId) {
    resolved.push({ type: 'rivalry_delta', opponentTeamId, delta: effects.rivalryDelta });
  }

  // dramaChance — only emitted when positive
  if (effects.dramaChance !== undefined && effects.dramaChance > 0) {
    resolved.push({ type: 'drama_boost', delta: effects.dramaChance });
  }

  // setsFlags
  if (effects.setsFlags?.length) {
    for (const { key, durationDays } of effects.setsFlags) {
      resolved.push({ type: 'set_flag', flag: key, flagDuration: durationDays });
    }
  }

  // clearsFlags
  if (effects.clearsFlags?.length) {
    for (const key of effects.clearsFlags) {
      resolved.push({ type: 'clear_flag', flag: key });
    }
  }

  return resolved;
}
