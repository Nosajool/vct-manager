// rosterValidation.ts - Pre-match roster validity checks
//
// Drama events (visa_arc, org_culture, coaching_overhaul, player_conflict, etc.)
// can move players to reserve mid-season, leaving the roster in an invalid state.
// This utility detects those violations so the advance-day flow can block and
// offer an auto-fix before simulating a match.

import type { Team } from '../types/team';
import type { Player } from '../types/player';

// Flags that indicate a player is temporarily unavailable for active play.
// These are pattern-prefixed — checked as `flag + playerId`.
const PLAYER_UNAVAILABILITY_FLAG_PREFIXES = [
  'visa_delayed_',
  'home_visit_paid_',
  'home_visit_approved_',
  'home_visit_delayed_',
  'conflict_rival_benched_',
];

function isPlayerFlaggedUnavailable(
  playerId: string,
  activeFlags: Record<string, { setDate: string; expiresDate?: string; value?: unknown }>
): boolean {
  return PLAYER_UNAVAILABILITY_FLAG_PREFIXES.some(
    (prefix) => `${prefix}${playerId}` in activeFlags
  );
}

function totalStats(player: Player): number {
  return Object.values(player.stats).reduce((sum, v) => sum + v, 0);
}

export type RosterViolation =
  | {
      type: 'insufficient_players';
      activeCount: number;
      /** Reserves eligible for immediate promotion (not flagged unavailable) */
      promotablePlayers: Player[];
    }
  | {
      type: 'no_active_igl';
      iglName: string | null;
      /** The IGL player if they are in reserves (can be promoted); null if released */
      iglInReserves: Player | null;
    };

export interface RosterValidationResult {
  valid: boolean;
  violations: RosterViolation[];
}

export function validateRosterForMatch(
  team: Team,
  players: Record<string, Player>,
  activeFlags: Record<string, { setDate: string; expiresDate?: string; value?: unknown }>
): RosterValidationResult {
  const violations: RosterViolation[] = [];

  // --- Check 1: Must have 5 active players ---
  const activeCount = team.playerIds.length;
  if (activeCount < 5) {
    const promotablePlayers = (team.reservePlayerIds ?? [])
      .filter((id) => !isPlayerFlaggedUnavailable(id, activeFlags))
      .map((id) => players[id])
      .filter(Boolean)
      .sort((a, b) => totalStats(b) - totalStats(a));

    violations.push({ type: 'insufficient_players', activeCount, promotablePlayers });
  }

  // --- Check 2: IGL must be in the active lineup ---
  if (team.iglPlayerId) {
    const iglIsActive = team.playerIds.includes(team.iglPlayerId);
    if (!iglIsActive) {
      const iglPlayer = players[team.iglPlayerId] ?? null;
      const iglInReserves =
        iglPlayer && (team.reservePlayerIds ?? []).includes(team.iglPlayerId)
          ? iglPlayer
          : null;
      const iglName = iglPlayer?.name ?? null;
      violations.push({ type: 'no_active_igl', iglName, iglInReserves });
    }
  }
  // If iglPlayerId is unset entirely we don't block — no IGL assigned is an
  // org choice, not a roster violation (the IGL stat still contributes to
  // simulated performance via the highest-igl player on the team).

  return { valid: violations.length === 0, violations };
}
