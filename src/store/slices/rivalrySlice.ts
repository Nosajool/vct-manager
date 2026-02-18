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

  getRivalryByOpponent: (opponentTeamId) => {
    return get().rivalries[opponentTeamId];
  },

  getTopRivalries: (n) => {
    return Object.values(get().rivalries)
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, n);
  },
});
