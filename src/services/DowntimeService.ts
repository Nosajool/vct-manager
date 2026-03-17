import { useGameStore } from '../store';
import type { Tournament } from '../types/competition';

/**
 * DowntimeService - Detects whether the player's team is in a downtime period
 * (not currently participating in any active tournament).
 *
 * Also provides helpers for finding other teams' tournaments and matches,
 * which are used by the Watch Party activity system.
 */
export class DowntimeService {
  /**
   * Returns true if the player's team is NOT in any in_progress tournament.
   * Downtime activities (bootcamp, watch party, brand events) are only available in this state.
   */
  isTeamInDowntime(teamId: string): boolean {
    const { tournaments } = useGameStore.getState();
    return !Object.values(tournaments).some(
      t => t.status === 'in_progress' && t.teamIds.includes(teamId)
    );
  }

  /**
   * Returns all tournaments currently in progress that the player's team is NOT participating in.
   * Used by the Watch Party system to find matches worth watching.
   */
  getActiveOtherTournaments(playerTeamId: string): Tournament[] {
    const { tournaments } = useGameStore.getState();
    return Object.values(tournaments).filter(
      t => t.status === 'in_progress' && !t.teamIds.includes(playerTeamId)
    );
  }

  /**
   * Returns match results from other teams' tournaments within the last N days.
   * Used by the Watch Party activity to populate "which match did you review?" options.
   * Full implementation in Phase 4 when the watch party interview system is built.
   */
  getRecentOtherTeamMatchIds(playerTeamId: string, daysSince: number): string[] {
    const state = useGameStore.getState();
    const { calendar, matches } = state;

    const cutoff = new Date(calendar.currentDate);
    cutoff.setDate(cutoff.getDate() - daysSince);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    return Object.values(matches)
      .filter(match => {
        const matchDate = match.scheduledDate.slice(0, 10);
        return (
          matchDate >= cutoffStr &&
          matchDate <= calendar.currentDate.slice(0, 10) &&
          match.teamAId !== playerTeamId &&
          match.teamBId !== playerTeamId
        );
      })
      .map(match => match.id);
  }
}

export const downtimeService = new DowntimeService();
