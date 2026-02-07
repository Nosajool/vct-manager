// Match Result Utilities - Helper functions for working with match results and modals

import type { Match, MatchResult } from '../types';
import type { GameState } from '../store';

/**
 * Converts a MatchResult to its corresponding Match object for modal display
 *
 * This utility is used when you have a MatchResult from match history
 * and need to display it in the MatchResult modal, which expects a Match object.
 *
 * @param result - The MatchResult object from match history
 * @param store - The game store instance
 * @returns The corresponding Match object, or null if not found
 *
 * @example
 * ```ts
 * const matchHistory = useGameStore((state) => state.getTeamMatchHistory(teamId));
 * const result = matchHistory[0];
 * const match = getMatchForResult(result, useGameStore.getState());
 *
 * if (match) {
 *   setSelectedMatch(match);
 *   setShowModal(true);
 * }
 * ```
 */
export function getMatchForResult(
  result: MatchResult,
  store: GameState
): Match | null {
  const match = store.matches[result.matchId];

  if (!match) {
    console.warn(`Match not found for result with matchId: ${result.matchId}`);
    return null;
  }

  return match;
}

/**
 * Checks if a match result can be displayed in the modal
 *
 * @param result - The MatchResult to check
 * @param store - The game store instance
 * @returns True if the match exists and can be displayed
 */
export function canDisplayMatchResult(
  result: MatchResult,
  store: GameState
): boolean {
  const match = store.matches[result.matchId];

  if (!match) return false;

  // Check that required teams exist
  const teamA = store.teams[match.teamAId];
  const teamB = store.teams[match.teamBId];

  return !!teamA && !!teamB;
}

/**
 * Gets match display data for a result
 *
 * This is a convenience function that returns all the data needed
 * to display a match result, including team names and the match object.
 *
 * @param result - The MatchResult object
 * @param store - The game store instance
 * @returns Display data object or null if match not found
 */
export function getMatchDisplayData(
  result: MatchResult,
  store: GameState
): {
  match: Match;
  teamAName: string;
  teamBName: string;
  isWin: (teamId: string) => boolean;
} | null {
  const match = getMatchForResult(result, store);

  if (!match) return null;

  const teamA = store.teams[match.teamAId];
  const teamB = store.teams[match.teamBId];

  if (!teamA || !teamB) {
    console.warn(`Teams not found for match: ${match.id}`);
    return null;
  }

  return {
    match,
    teamAName: teamA.name,
    teamBName: teamB.name,
    isWin: (teamId: string) => result.winnerId === teamId,
  };
}
