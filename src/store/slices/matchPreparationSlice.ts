// Match Preparation Slice - Stores pre-match veto + agent config per match
// Follows the same pattern as matchStrategySlice.ts

import type { StateCreator } from 'zustand';
import type { PreMatchConfig } from '../../types/prematch';

export interface MatchPreparationSliceState {
  /** Pre-match configs indexed by matchId */
  preMatchConfigs: Record<string, PreMatchConfig>;
}

export interface MatchPreparationSliceActions {
  /** Store the prep config for a match (set before advancing day) */
  setPreMatchConfig: (matchId: string, config: PreMatchConfig) => void;

  /** Retrieve the prep config for a match (used by MatchService) */
  getPreMatchConfig: (matchId: string) => PreMatchConfig | undefined;

  /** Clean up after the match is simulated */
  deletePreMatchConfig: (matchId: string) => void;
}

export type MatchPreparationSlice = MatchPreparationSliceState & MatchPreparationSliceActions;

const initialState: MatchPreparationSliceState = {
  preMatchConfigs: {},
};

export const createMatchPreparationSlice: StateCreator<
  MatchPreparationSlice,
  [],
  [],
  MatchPreparationSlice
> = (set, get) => ({
  ...initialState,

  setPreMatchConfig: (matchId, config) => {
    set((state) => ({
      preMatchConfigs: {
        ...state.preMatchConfigs,
        [matchId]: config,
      },
    }));
  },

  getPreMatchConfig: (matchId) => {
    return get().preMatchConfigs[matchId];
  },

  deletePreMatchConfig: (matchId) => {
    set((state) => {
      const newConfigs = { ...state.preMatchConfigs };
      delete newConfigs[matchId];
      return { preMatchConfigs: newConfigs };
    });
  },
});
