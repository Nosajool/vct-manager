// Interview Effect Resolver
// Translates InterviewEffects descriptors into concrete ResolvedInterviewEffect mutations

import type { InterviewEffects, InterviewSnapshot, InterviewTone, ManagerProfile } from '../../types/interview';

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
 * @param managerProfile - Optional: when present, applies archetype magnitude modifiers
 * @param chosenTone - Required with managerProfile to apply correct modifiers
 * @returns Array of concrete mutations to apply to game state
 */
export function resolveInterviewEffects(
  effects: InterviewEffects,
  snapshot: InterviewSnapshot,
  opponentTeamId?: string,
  managerProfile?: ManagerProfile,
  chosenTone?: InterviewTone,
): ResolvedInterviewEffect[] {
  const resolved: ResolvedInterviewEffect[] = [];

  // Compute archetype magnitude multipliers
  let moraleMult = 1;
  let fanbaseMult = 1;
  let rivalryMult = 1;
  let addOrgPressureFlag = false;

  if (managerProfile?.archetype && chosenTone) {
    const { archetype, archetypeStrength } = managerProfile;
    if (archetype === 'HYPE_MACHINE' && chosenTone === 'CONFIDENT') {
      fanbaseMult = 1.25;
      if (archetypeStrength > 60) addOrgPressureFlag = true;
    } else if (archetype === 'HUMBLE_GRINDER' && chosenTone === 'HUMBLE') {
      moraleMult = 1.2;
    } else if (archetype === 'TEAM_BUILDER' && chosenTone === 'RESPECTFUL') {
      moraleMult = 1.2;
    } else if (archetype === 'MAVERICK' && chosenTone === 'TRASH_TALK') {
      rivalryMult = 1.5;
    }
  }

  // morale — one effect per targeted player (or all snapshot players as fallback)
  if (effects.morale !== undefined && effects.morale !== 0) {
    const delta = moraleMult !== 1 ? Math.round(effects.morale * moraleMult) : effects.morale;
    const targets = effects.targetPlayerIds ?? snapshot.players.map((p) => p.id);
    for (const playerId of targets) {
      resolved.push({ type: 'update_player', playerId, field: 'morale', delta });
    }
  }

  // fanbase
  if (effects.fanbase !== undefined) {
    const delta = fanbaseMult !== 1 ? Math.round(effects.fanbase * fanbaseMult) : effects.fanbase;
    resolved.push({ type: 'update_team', field: 'fanbase', delta });
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
    const delta = rivalryMult !== 1 ? Math.round(effects.rivalryDelta * rivalryMult) : effects.rivalryDelta;
    resolved.push({ type: 'rivalry_delta', opponentTeamId, delta });
  }

  // org_pressure flag — triggered when HYPE_MACHINE strength > 60 and choosing CONFIDENT
  if (addOrgPressureFlag) {
    resolved.push({ type: 'set_flag', flag: 'org_pressure', flagDuration: 14 });
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
