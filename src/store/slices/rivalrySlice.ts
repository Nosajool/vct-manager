// Rivalry Slice - Zustand store slice for rivalry tracking
// Part of the narrative layer (System 4: Rivalry)

import type { StateCreator } from 'zustand';
import type { Rivalry } from '../../types/rivalry';

export interface RivalrySlice {
  // State
  rivalries: Record<string, Rivalry>; // keyed by opponentTeamId

  // Actions
  updateRivalryIntensity: (opponentTeamId: string, delta: number) => void;
  recordMatch: (
    opponentTeamId: string,
    date: string,
    wasEliminatedBy: boolean,
    didEliminate: boolean
  ) => void;
  /**
   * Apply one unit of time-based decay to a rivalry.
   * Decrements intensity by 1 and advances lastMatchDate by 30 days
   * so the same period isn't double-counted on the next weekly check.
   */
  decayRivalryIntensity: (opponentTeamId: string) => void;

  // Selectors
  getRivalryByOpponent: (opponentTeamId: string) => Rivalry | undefined;
  getTopRivalries: (n: number) => Rivalry[];
}

export const createRivalrySlice: StateCreator<RivalrySlice, [], [], RivalrySlice> = (
  set,
  get
) => ({
  rivalries: {},

  updateRivalryIntensity: (opponentTeamId, delta) => {
    set((state) => {
      const existing = state.rivalries[opponentTeamId];
      const currentIntensity = existing?.intensity ?? 0;
      const newIntensity = Math.max(0, Math.min(100, currentIntensity + delta));

      const updated: Rivalry = existing
        ? { ...existing, intensity: newIntensity }
        : {
            id: `rivalry-${opponentTeamId}`,
            opponentTeamId,
            intensity: newIntensity,
            lastMatchDate: '',
            totalMatches: 0,
            eliminatedByCount: 0,
            eliminatedCount: 0,
          };

      return { rivalries: { ...state.rivalries, [opponentTeamId]: updated } };
    });
  },

  recordMatch: (opponentTeamId, date, wasEliminatedBy, didEliminate) => {
    set((state) => {
      const existing = state.rivalries[opponentTeamId];
      const base: Rivalry = existing ?? {
        id: `rivalry-${opponentTeamId}`,
        opponentTeamId,
        intensity: 0,
        lastMatchDate: date,
        totalMatches: 0,
        eliminatedByCount: 0,
        eliminatedCount: 0,
      };

      const updated: Rivalry = {
        ...base,
        lastMatchDate: date,
        totalMatches: base.totalMatches + 1,
        eliminatedByCount: base.eliminatedByCount + (wasEliminatedBy ? 1 : 0),
        eliminatedCount: base.eliminatedCount + (didEliminate ? 1 : 0),
      };

      return { rivalries: { ...state.rivalries, [opponentTeamId]: updated } };
    });
  },

  decayRivalryIntensity: (opponentTeamId) => {
    set((state) => {
      const existing = state.rivalries[opponentTeamId];
      if (!existing) return state;

      const newIntensity = Math.max(0, existing.intensity - 1);

      // Advance lastMatchDate by 30 days so this period isn't double-counted
      const prev = new Date(existing.lastMatchDate);
      prev.setDate(prev.getDate() + 30);
      const advancedDate = prev.toISOString().split('T')[0];

      const updated: Rivalry = { ...existing, intensity: newIntensity, lastMatchDate: advancedDate };
      return { rivalries: { ...state.rivalries, [opponentTeamId]: updated } };
    });
  },

  getRivalryByOpponent: (opponentTeamId) => {
    return get().rivalries[opponentTeamId];
  },

  getTopRivalries: (n) => {
    return Object.values(get().rivalries)
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, n);
  },
});
