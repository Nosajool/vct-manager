// VCT Manager - Zustand Store
// Combines all slices into a single store with persistence

import { create } from 'zustand';
import { createPlayerSlice, type PlayerSlice } from './slices/playerSlice';
import { createTeamSlice, type TeamSlice } from './slices/teamSlice';
import { createGameSlice, type GameSlice } from './slices/gameSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';
import {
  autoSave,
  saveManager,
  applyLoadedState,
  type SaveSlotInfo,
} from './middleware/persistence';
import type { SaveSlotNumber } from '../db/schema';

// Combined game state type
export type GameState = PlayerSlice & TeamSlice & GameSlice & UISlice;

// Create the combined store with auto-save middleware
export const useGameStore = create<GameState>()(
  autoSave((...args) => ({
    ...createPlayerSlice(...args),
    ...createTeamSlice(...args),
    ...createGameSlice(...args),
    ...createUISlice(...args),
  }))
);

// Re-export slice types for convenience
export type { PlayerSlice } from './slices/playerSlice';
export type { TeamSlice } from './slices/teamSlice';
export type { GameSlice } from './slices/gameSlice';
export type { UISlice, ActiveView, BulkSimulationProgress } from './slices/uiSlice';

// ============================================
// Save/Load API
// ============================================

/**
 * Save current game state to a slot
 * @param slot - Save slot (0 = auto, 1-3 = manual)
 */
export async function saveGame(slot: SaveSlotNumber): Promise<{
  success: boolean;
  error?: string;
}> {
  const state = useGameStore.getState();
  return saveManager.saveGame(slot, state);
}

/**
 * Load game state from a slot
 * @param slot - Save slot to load from
 */
export async function loadGame(slot: SaveSlotNumber): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await saveManager.loadGame(slot);

  if (result.success && result.data) {
    // Apply loaded state to store
    applyLoadedState(useGameStore.setState, result.data);
    return { success: true };
  }

  return { success: false, error: result.error };
}

/**
 * Delete a save slot
 * @param slot - Save slot to delete
 */
export async function deleteSave(slot: SaveSlotNumber): Promise<{
  success: boolean;
  error?: string;
}> {
  return saveManager.deleteSave(slot);
}

/**
 * List all save slots with their info
 */
export async function listSaves(): Promise<SaveSlotInfo[]> {
  return saveManager.listSaves();
}

/**
 * Trigger manual auto-save
 */
export async function triggerAutoSave(): Promise<{
  success: boolean;
  error?: string;
}> {
  const state = useGameStore.getState();
  return saveManager.autoSave(state);
}

/**
 * Check if a save exists in a slot
 */
export async function hasSave(slot: SaveSlotNumber): Promise<boolean> {
  return saveManager.hasSave(slot);
}

/**
 * Get current playtime in minutes
 */
export function getPlaytime(): number {
  return saveManager.getPlaytime();
}

// ============================================
// Selector hooks for common patterns
// These provide better performance by only subscribing to specific state
// ============================================

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

// Re-export persistence types
export type { SaveSlotInfo } from './middleware/persistence';
export type { SaveSlotNumber, SaveMetadata } from '../db/schema';
