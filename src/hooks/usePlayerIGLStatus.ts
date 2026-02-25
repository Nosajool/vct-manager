// usePlayerIGLStatus Hook - Get IGL status for a player
//
// Automatically determines if a player is current or former IGL
// based on their team assignment in the store.

import { useGameStore } from '../store';
import type { Player } from '../types';

interface IGLStatus {
  isIGL: boolean;
  isFormerIGL: boolean;
}

/**
 * Get IGL status for a player
 *
 * Checks if the player is the designated IGL for their current team
 * or if they have the former IGL flag set.
 *
 * @param player - The player to check
 * @returns Object with isIGL and isFormerIGL boolean flags
 *
 * @example
 * ```tsx
 * function PlayerCard({ player }) {
 *   const { isIGL, isFormerIGL } = usePlayerIGLStatus(player);
 *
 *   return (
 *     <div>
 *       {isIGL && <span className="badge">IGL</span>}
 *       {isFormerIGL && <span className="badge">Former IGL</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlayerIGLStatus(player: Player): IGLStatus {
  const teams = useGameStore((state) => state.teams);
  const team = player.teamId ? teams[player.teamId] : undefined;
  const iglPlayerId = team?.iglPlayerId;

  const isIGL = iglPlayerId !== undefined && player.id === iglPlayerId;
  const isFormerIGL = player.isFormerIGL === true;

  return { isIGL, isFormerIGL };
}
