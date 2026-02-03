// Round Data Slice - Stores detailed round-by-round data for the current season
// This data is cleared at season end to prevent save file bloat

import type { StateCreator } from 'zustand';
import type { EnhancedRoundInfo, MapResult } from '../../types';

/**
 * Stored round data for a match
 */
export interface MatchRoundData {
  matchId: string;
  maps: {
    mapName: string;
    rounds: EnhancedRoundInfo[];
  }[];
  storedAt: string; // ISO date
}

/**
 * State for round data storage
 */
export interface RoundDataSliceState {
  /** Round data indexed by match ID */
  roundData: Record<string, MatchRoundData>;

  /** Current season identifier for cleanup (string format) */
  roundDataSeasonId: string;

  /** Maximum number of matches to store (older ones get pruned) */
  maxStoredMatches: number;
}

/**
 * Actions for managing round data
 */
export interface RoundDataSliceActions {
  // Storage actions
  storeMatchRoundData: (matchId: string, maps: MapResult[]) => void;
  getMatchRoundData: (matchId: string) => MatchRoundData | undefined;
  clearMatchRoundData: (matchId: string) => void;

  // Season management
  clearSeasonRoundData: () => void;
  setRoundDataSeasonId: (seasonId: string) => void;

  // Maintenance
  pruneOldRoundData: () => void;
  getRoundDataCount: () => number;
}

export type RoundDataSlice = RoundDataSliceState & RoundDataSliceActions;

/**
 * Initial state
 */
const initialState: RoundDataSliceState = {
  roundData: {},
  roundDataSeasonId: '2026',
  maxStoredMatches: 200, // Keep last 200 matches worth of detailed data
};

/**
 * Create the round data slice
 */
export const createRoundDataSlice: StateCreator<
  RoundDataSlice,
  [],
  [],
  RoundDataSlice
> = (set, get) => ({
  ...initialState,

  // Store round data from a completed match
  storeMatchRoundData: (matchId, maps) => {
    const roundData: MatchRoundData = {
      matchId,
      maps: maps.map((map) => ({
        mapName: map.map,
        rounds: map.enhancedRounds || [],
      })),
      storedAt: new Date().toISOString(),
    };

    set((state) => ({
      roundData: {
        ...state.roundData,
        [matchId]: roundData,
      },
    }));

    // Auto-prune if over limit
    const count = get().getRoundDataCount();
    if (count > get().maxStoredMatches) {
      get().pruneOldRoundData();
    }
  },

  // Get round data for a specific match
  getMatchRoundData: (matchId) => {
    return get().roundData[matchId];
  },

  // Clear round data for a specific match
  clearMatchRoundData: (matchId) => {
    set((state) => {
      const newRoundData = { ...state.roundData };
      delete newRoundData[matchId];
      return { roundData: newRoundData };
    });
  },

  // Clear all round data (called at season end)
  clearSeasonRoundData: () => {
    set({ roundData: {} });
  },

  // Set current season identifier
  setRoundDataSeasonId: (seasonId) => {
    set({ roundDataSeasonId: seasonId });
  },

  // Prune oldest round data to stay under limit
  pruneOldRoundData: () => {
    set((state) => {
      const entries = Object.entries(state.roundData);

      // Sort by stored date (oldest first)
      entries.sort((a, b) => a[1].storedAt.localeCompare(b[1].storedAt));

      // Keep only the most recent matches
      const toKeep = entries.slice(-state.maxStoredMatches);

      const newRoundData: Record<string, MatchRoundData> = {};
      for (const [id, data] of toKeep) {
        newRoundData[id] = data;
      }

      return { roundData: newRoundData };
    });
  },

  // Get count of stored matches
  getRoundDataCount: () => {
    return Object.keys(get().roundData).length;
  },
});
