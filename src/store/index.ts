// VCT Manager - Zustand Store
// Combines all slices into a single store

import { create } from 'zustand';
import { createPlayerSlice, type PlayerSlice } from './slices/playerSlice';
import { createTeamSlice, type TeamSlice } from './slices/teamSlice';
import { createGameSlice, type GameSlice } from './slices/gameSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';

// Combined game state type
export type GameState = PlayerSlice & TeamSlice & GameSlice & UISlice;

// Create the combined store
export const useGameStore = create<GameState>()((...args) => ({
  ...createPlayerSlice(...args),
  ...createTeamSlice(...args),
  ...createGameSlice(...args),
  ...createUISlice(...args),
}));

// Re-export slice types for convenience
export type { PlayerSlice } from './slices/playerSlice';
export type { TeamSlice } from './slices/teamSlice';
export type { GameSlice } from './slices/gameSlice';
export type { UISlice, ActiveView, BulkSimulationProgress } from './slices/uiSlice';

// Selector hooks for common patterns
// These provide better performance by only subscribing to specific state

export const usePlayer = (playerId: string) =>
  useGameStore((state) => state.players[playerId]);

export const useTeam = (teamId: string) =>
  useGameStore((state) => state.teams[teamId]);

export const usePlayerTeam = () =>
  useGameStore((state) =>
    state.playerTeamId ? state.teams[state.playerTeamId] : undefined
  );

export const useFreeAgents = () =>
  useGameStore((state) =>
    Object.values(state.players).filter((p) => p.teamId === null)
  );

export const useCurrentDate = () =>
  useGameStore((state) => state.calendar.currentDate);

export const useCurrentPhase = () =>
  useGameStore((state) => state.calendar.currentPhase);

export const useActiveView = () =>
  useGameStore((state) => state.activeView);

export const useError = () =>
  useGameStore((state) => state.error);

export const useIsSimulating = () =>
  useGameStore((state) => state.isSimulating);
