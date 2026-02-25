// Team Utilities - Helper functions for team operations

import type { Player, Team } from '../types';

/**
 * Get the designated IGL for a team
 * First checks team.iglPlayerId, then falls back to player with highest igl stat
 * 
 * @param team - The team object
 * @param players - Array of players on the team
 * @returns The IGL player or undefined if no IGL found
 */
export function getTeamIGL(team: Team, players: Player[]): Player | undefined {
  // First check if team has a designated IGL
  if (team.iglPlayerId) {
    return players.find((p) => p.id === team.iglPlayerId);
  }

  // Fallback: find player with highest IGL stat
  if (players.length === 0) return undefined;

  return players.reduce((best, player) => {
    if (!best) return player;
    return player.stats.igl > best.stats.igl ? player : best;
  }, players[0]);
}

/**
 * Check if a player is the team's designated IGL
 * 
 * @param player - The player to check
 * @param team - The team to check against
 * @returns True if player is the designated IGL
 */
export function isTeamIGL(player: Player, team: Team): boolean {
  return team.iglPlayerId === player.id;
}
