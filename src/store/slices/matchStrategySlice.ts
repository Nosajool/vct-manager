// Match Strategy Slice - Manages per-match strategy overrides
// Allows customizing team strategy for specific future matches

import type { StateCreator } from 'zustand';
import type { MatchStrategySnapshot, TeamStrategy } from '../../types/strategy';

/**
 * State for match-specific strategy snapshots
 */
export interface MatchStrategySliceState {
  /** Match strategy snapshots indexed by matchId-teamId composite key */
  matchStrategies: Record<string, MatchStrategySnapshot>;
}

/**
 * Actions for managing match strategies
 */
export interface MatchStrategySliceActions {
  /** Set strategy override for a specific match and team */
  setMatchStrategy: (matchId: string, teamId: string, strategy: TeamStrategy) => void;

  /** Get strategy override for a match and team (returns undefined if not set) */
  getMatchStrategy: (matchId: string, teamId: string) => MatchStrategySnapshot | undefined;

  /** Delete strategy override for a match (cleanup after completion) */
  deleteMatchStrategy: (matchId: string) => void;

  /** Check if a match has any strategy overrides */
  hasMatchStrategy: (matchId: string) => boolean;
}

export type MatchStrategySlice = MatchStrategySliceState & MatchStrategySliceActions;

/**
 * Initial state
 */
const initialState: MatchStrategySliceState = {
  matchStrategies: {},
};

/**
 * Generate composite key for match-team strategy lookup
 */
function getStrategyKey(matchId: string, teamId: string): string {
  return `${matchId}-${teamId}`;
}

/**
 * Create the match strategy slice
 */
export const createMatchStrategySlice: StateCreator<
  MatchStrategySlice,
  [],
  [],
  MatchStrategySlice
> = (set, get) => ({
  ...initialState,

  // Set strategy for a specific match and team
  setMatchStrategy: (matchId, teamId, strategy) => {
    const key = getStrategyKey(matchId, teamId);
    const snapshot: MatchStrategySnapshot = {
      matchId,
      teamId,
      strategy,
    };

    set((state) => ({
      matchStrategies: {
        ...state.matchStrategies,
        [key]: snapshot,
      },
    }));
  },

  // Get strategy for a specific match and team
  getMatchStrategy: (matchId, teamId) => {
    const key = getStrategyKey(matchId, teamId);
    return get().matchStrategies[key];
  },

  // Delete all strategy overrides for a match
  deleteMatchStrategy: (matchId) => {
    set((state) => {
      const newStrategies = { ...state.matchStrategies };

      // Find and delete all keys that start with this matchId
      Object.keys(newStrategies).forEach((key) => {
        if (key.startsWith(`${matchId}-`)) {
          delete newStrategies[key];
        }
      });

      return { matchStrategies: newStrategies };
    });
  },

  // Check if match has any strategy overrides
  hasMatchStrategy: (matchId) => {
    const strategies = get().matchStrategies;
    return Object.keys(strategies).some((key) => key.startsWith(`${matchId}-`));
  },
});
