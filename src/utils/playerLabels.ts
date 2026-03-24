// Player Identity Labels
// Derives human-readable role and status labels from player data.
// Labels are purely computed — no new data is stored.
//
// Role assignment is TEAM-RELATIVE: roles are assigned based on which player
// is best at each role stat within the team, not absolute thresholds.

import type { Player, PlayerStats } from '../types';
import { playerGenerator } from '../engine/player';

// ─── Types ───────────────────────────────────────────────────────────────────

export type RoleLabel =
  | 'Entry Fragger'
  | 'Lurker'
  | 'Support'
  | 'Clutch Player'
  | 'Rifler'
  | 'Mid-Rounder';

/** Notable-only status labels. Returns null for average players to avoid noise. */
export type StatusLabel =
  | 'Star'
  | 'Rising Star'
  | 'Veteran'
  | 'Washed'
  | 'Struggling'
  | 'Raw Talent';

export interface LabelStyle {
  color: string; // Tailwind text color class
  bg: string;    // Tailwind bg + border classes
}

// ─── Style configs ────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<RoleLabel, LabelStyle> = {
  'Entry Fragger': { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'       },
  'Lurker':        { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  'Support':       { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'     },
  'Clutch Player': { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'Rifler':        { color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20'   },
  'Mid-Rounder':   { color: 'text-vct-gray',   bg: 'bg-vct-gray/10 border-vct-gray/20'     },
};

const STATUS_STYLES: Record<StatusLabel, LabelStyle> = {
  'Star':         { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20'   },
  'Rising Star':  { color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20'       },
  'Veteran':      { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'     },
  'Washed':       { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'         },
  'Struggling':   { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'         },
  'Raw Talent':   { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

// ─── Role assignment (team-relative) ─────────────────────────────────────────

/**
 * Roles assigned in priority order. For each role, the unassigned player with
 * the highest value for that stat wins the role.
 */
const ROLE_ASSIGNMENT_ORDER: { stat: keyof PlayerStats; label: RoleLabel }[] = [
  { stat: 'entry',     label: 'Entry Fragger' },
  { stat: 'lurking',   label: 'Lurker'        },
  { stat: 'support',   label: 'Support'       },
  { stat: 'clutch',    label: 'Clutch Player' },
  { stat: 'mechanics', label: 'Rifler'        },
];

/**
 * Assign one role label per player based on their relative stats within the team.
 * The player with the highest value for each role stat gets that role.
 * Leftover players (reserves, extras) receive 'Mid-Rounder'.
 *
 * Returns a map of playerId → RoleLabel.
 */
export function assignTeamRoleLabels(players: Player[]): Record<string, RoleLabel> {
  const assigned: Record<string, RoleLabel> = {};
  const taken = new Set<string>();

  for (const { stat, label } of ROLE_ASSIGNMENT_ORDER) {
    const best = [...players]
      .filter((p) => !taken.has(p.id))
      .sort((a, b) => b.stats[stat] - a.stats[stat])[0];

    if (best) {
      assigned[best.id] = label;
      taken.add(best.id);
    }
  }

  // Any remaining players (reserves, extras past 5) get Mid-Rounder
  for (const player of players) {
    if (!assigned[player.id]) {
      assigned[player.id] = 'Mid-Rounder';
    }
  }

  return assigned;
}

// ─── Role label (self-relative fallback) ──────────────────────────────────────

/**
 * Derive a role label for a single player without team context.
 * Uses the player's own highest role stat (self-relative).
 * Falls back to 'Mid-Rounder' when no single stat dominates.
 *
 * Use this for free agents, standalone card views, and non-team contexts.
 * Prefer assignTeamRoleLabels() when team roster is available.
 */
export function getPlayerRoleLabel(player: Player): RoleLabel {
  const best = ROLE_ASSIGNMENT_ORDER
    .map(({ stat, label }) => ({ label, value: player.stats[stat] }))
    .sort((a, b) => b.value - a.value)[0];

  return best ? best.label : 'Mid-Rounder';
}

// ─── Status logic ─────────────────────────────────────────────────────────────

/**
 * Derive a notable status label for the player.
 * Returns null for average players — only surfaces when the label adds signal.
 * Priority: Star > Rising Star > Veteran > Washed > Struggling > Raw Talent
 */
export function getPlayerStatusLabel(player: Player): StatusLabel | null {
  const overall = playerGenerator.calculateOverall(player.stats);

  if (overall >= 85 && player.form >= 70) return 'Star';
  if (player.age <= 22 && player.potential >= 80) return 'Rising Star';
  if (player.careerStats.matchesPlayed >= 50 && player.age >= 27) return 'Veteran';
  if (player.age >= 28 && player.form < 40) return 'Washed';
  if (player.form < 35) return 'Struggling';
  if (player.potential >= 88 && overall < 72) return 'Raw Talent';

  return null;
}

// ─── Style accessors ──────────────────────────────────────────────────────────

export function getRoleLabelStyle(label: RoleLabel): LabelStyle {
  return ROLE_STYLES[label];
}

export function getStatusLabelStyle(label: StatusLabel): LabelStyle {
  return STATUS_STYLES[label];
}

// ─── Convenience: build a playerId → role string map ──────────────────────────

/**
 * Build a map of playerId → role label string for use in match narratives.
 * When players are from the same team, uses team-relative assignment.
 * For mixed groups (e.g. both teams), each player's self-relative label is used.
 */
export function buildPlayerRoleMap(players: Player[]): Record<string, string> {
  // Group by team, assign roles within each team, fall back to self-relative for teamless
  const byTeam = new Map<string, Player[]>();
  const teamless: Player[] = [];

  for (const p of players) {
    if (p.teamId) {
      const group = byTeam.get(p.teamId) ?? [];
      group.push(p);
      byTeam.set(p.teamId, group);
    } else {
      teamless.push(p);
    }
  }

  const result: Record<string, string> = {};

  for (const teamPlayers of byTeam.values()) {
    const labels = assignTeamRoleLabels(teamPlayers);
    Object.assign(result, labels);
  }

  for (const p of teamless) {
    result[p.id] = getPlayerRoleLabel(p);
  }

  return result;
}
