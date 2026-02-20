// RivalryService - Tracks and updates rivalry intensity between teams
// Part of the narrative layer (System 4: Rivalry)

import type { MatchResult } from '../types/match';
import { useGameStore } from '../store';
import { interviewService } from './InterviewService';

/**
 * The intensity change resulting from a match
 */
export interface RivalryDelta {
  opponentTeamId: string;
  intensityDelta: number;
  newIntensity: number;
}

export class RivalryService {
  /**
   * Process a completed match for rivalry effects.
   * Calculates intensity delta, updates the store, sets drama flags,
   * and records the match in rivalry history.
   *
   * Returns null if this is not a player team match or opponent cannot be resolved.
   */
  processMatchRivalry(
    matchResult: MatchResult,
    playerTeamId: string,
    isPlayoffMatch?: boolean,
    wasElimination?: boolean,
  ): RivalryDelta | null {
    const state = useGameStore.getState();

    // Resolve opponent
    const match = state.matches[matchResult.matchId];
    if (!match) return null;

    const opponentTeamId =
      match.teamAId === playerTeamId ? match.teamBId : match.teamAId;

    if (!opponentTeamId || opponentTeamId === playerTeamId) return null;

    // Calculate intensity delta
    let delta = 2; // +2 for any match

    // Close match: sum round differences across all maps
    const totalRoundDiff = matchResult.maps.reduce((sum, map) => {
      return sum + Math.abs(map.teamAScore - map.teamBScore);
    }, 0);
    if (totalRoundDiff <= 3) delta += 5;

    if (isPlayoffMatch) delta += 8;

    const wasEliminatedBy =
      wasElimination === true && matchResult.winnerId === opponentTeamId;
    const didEliminate =
      wasElimination === true && matchResult.winnerId === playerTeamId;

    if (wasEliminatedBy) delta += 15;

    // Trash talk bonus — read from interviewHistory via InterviewService
    if (interviewService.hadTrashTalkBeforeMatch(opponentTeamId)) delta += 10;

    // Apply to store
    state.updateRivalryIntensity(opponentTeamId, delta);
    state.recordMatch(
      opponentTeamId,
      state.calendar.currentDate,
      wasEliminatedBy,
      didEliminate,
    );

    const rivalry = state.getRivalryByOpponent(opponentTeamId);
    const newIntensity = rivalry ? rivalry.intensity + delta : delta;
    const clampedIntensity = Math.max(0, Math.min(100, newIntensity));

    // Sync rivalry_match drama flag (intensity > 40)
    this.syncRivalryFlag(opponentTeamId, clampedIntensity, state);

    return { opponentTeamId, intensityDelta: delta, newIntensity: clampedIntensity };
  }

  /**
   * Decay all rivalry intensities by 1 per 30 days without a match.
   * Should be called weekly (every Sunday) from CalendarService.
   */
  processRivalryDecay(currentDate: string): void {
    const state = useGameStore.getState();
    const current = new Date(currentDate).getTime();

    for (const [opponentTeamId, rivalry] of Object.entries(state.rivalries)) {
      if (!rivalry.lastMatchDate || rivalry.intensity <= 0) continue;

      const daysSince = Math.floor(
        (current - new Date(rivalry.lastMatchDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSince < 30) continue;

      // Decay by 1 and advance lastMatchDate by 30 days atomically
      state.decayRivalryIntensity(opponentTeamId);

      // Sync drama flag for updated intensity
      const updated = useGameStore.getState().rivalries[opponentTeamId];
      if (updated) {
        this.syncRivalryFlag(opponentTeamId, updated.intensity, useGameStore.getState());
      }
    }
  }

  /**
   * Set or clear the rivalry_match drama flag based on intensity.
   * intensity > 40 → set flag; otherwise clear it.
   */
  private syncRivalryFlag(
    opponentTeamId: string,
    intensity: number,
    state: ReturnType<typeof useGameStore.getState>,
  ): void {
    const FLAG = `rivalry_match_${opponentTeamId}`;
    if (intensity > 40) {
      if (!state.activeFlags[FLAG]) {
        state.setDramaFlag(FLAG, { setDate: state.calendar.currentDate });
      }
    } else {
      if (state.activeFlags[FLAG]) {
        state.clearDramaFlag(FLAG);
      }
    }
  }
}

export const rivalryService = new RivalryService();
