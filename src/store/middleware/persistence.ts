// Persistence Middleware and SaveManager
// Handles auto-save and manual save/load operations

// NOTE: Save/load UI functionality has been removed from the application.
// The backend persistence system remains intact for future development.
// Auto-save is currently disabled for development purposes.

import type { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { db, isIndexedDBAvailable } from '../../db/database';
import {
  type SaveSlot,
  type SaveSlotNumber,
  type SaveMetadata,
  type SerializedGameState,
  SAVE_VERSION,
  AUTO_SAVE_INTERVAL_DAYS,
} from '../../db/schema';

// Forward declaration to avoid circular import
// The actual GameState type will be inferred from usage
interface MinimalGameState {
  players: Record<string, unknown>;
  teams: Record<string, unknown>;
  playerTeamId: string | null;
  initialized: boolean;
  gameStarted: boolean;
  calendar: {
    currentDate: string;
    currentSeason: number;
    currentPhase: string;
    scheduledEvents: unknown[];
  };
  drama?: {
    activeEvents: unknown[];
    eventHistory: unknown[];
    activeFlags: Record<string, string>;
    cooldowns: Record<string, string>;
    lastEventByCategory: Record<string, string>;
    totalEventsTriggered: number;
    totalMajorDecisions: number;
  };
  activityConfigs?: Record<string, unknown>;
}

/**
 * Result type for save/load operations
 */
export interface SaveResult {
  success: boolean;
  error?: string;
}

/**
 * Save slot info for UI display
 */
export interface SaveSlotInfo {
  slot: SaveSlotNumber;
  isEmpty: boolean;
  metadata?: SaveMetadata;
}

/**
 * Tracks last auto-save date
 */
let lastAutoSaveDate: string | null = null;

/**
 * Extract serializable state from GameState
 * Excludes UI state and functions
 */
function serializeGameState(state: MinimalGameState): SerializedGameState {
  return {
    players: state.players,
    teams: state.teams,
    playerTeamId: state.playerTeamId,
    initialized: state.initialized,
    gameStarted: state.gameStarted,
    calendar: {
      currentDate: state.calendar.currentDate,
      currentSeason: state.calendar.currentSeason,
      currentPhase: state.calendar.currentPhase,
      scheduledEvents: state.calendar.scheduledEvents,
    },
    drama: state.drama,
    activityConfigs: state.activityConfigs,
  };
}

/**
 * Create save metadata from current state
 */
function createSaveMetadata(
  state: MinimalGameState,
  playtime: number = 0
): SaveMetadata {
  const playerTeam = state.playerTeamId
    ? (state.teams[state.playerTeamId] as { name?: string } | undefined)
    : null;
  const teamName = playerTeam?.name ?? 'No Team';

  return {
    teamName,
    currentDate: state.calendar.currentDate,
    season: state.calendar.currentSeason,
    playtime,
    version: SAVE_VERSION,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Check if auto-save should trigger
 */
function shouldAutoSave(state: MinimalGameState): boolean {
  if (!state.gameStarted || !state.initialized) {
    return false;
  }

  const currentDate = new Date(state.calendar.currentDate);

  if (!lastAutoSaveDate) {
    lastAutoSaveDate = state.calendar.currentDate;
    return true;
  }

  const lastSave = new Date(lastAutoSaveDate);
  const daysDiff = Math.floor(
    (currentDate.getTime() - lastSave.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysDiff >= AUTO_SAVE_INTERVAL_DAYS;
}

/**
 * SaveManager - handles all save/load operations
 */
export class SaveManager {
  private playtimeMinutes: number = 0;
  private sessionStartTime: number = Date.now();

  constructor() {
    this.sessionStartTime = Date.now();
  }

  getPlaytime(): number {
    const sessionMinutes = Math.floor(
      (Date.now() - this.sessionStartTime) / (1000 * 60)
    );
    return this.playtimeMinutes + sessionMinutes;
  }

  setPlaytime(minutes: number): void {
    this.playtimeMinutes = minutes;
    this.sessionStartTime = Date.now();
  }

  async saveGame(
    slot: SaveSlotNumber,
    state: MinimalGameState
  ): Promise<SaveResult> {
    if (!isIndexedDBAvailable()) {
      return { success: false, error: 'IndexedDB not available' };
    }

    try {
      const saveSlot: SaveSlot = {
        slot,
        saveDate: new Date().toISOString(),
        metadata: createSaveMetadata(state, this.getPlaytime()),
        gameState: serializeGameState(state),
      };

      await db.saves.put(saveSlot);
      console.log(`Game saved to slot ${slot}`);
      return { success: true };
    } catch (error) {
      console.error('Save failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async loadGame(slot: SaveSlotNumber): Promise<{
    success: boolean;
    data?: SerializedGameState;
    metadata?: SaveMetadata;
    error?: string;
  }> {
    if (!isIndexedDBAvailable()) {
      return { success: false, error: 'IndexedDB not available' };
    }

    try {
      const saveSlot = await db.saves.get(slot);

      if (!saveSlot) {
        return { success: false, error: 'Save slot is empty' };
      }

      this.setPlaytime(saveSlot.metadata.playtime);
      console.log(`Game loaded from slot ${slot}`);
      return {
        success: true,
        data: saveSlot.gameState,
        metadata: saveSlot.metadata,
      };
    } catch (error) {
      console.error('Load failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async autoSave(state: MinimalGameState): Promise<SaveResult> {
    const result = await this.saveGame(0, state);

    if (result.success) {
      lastAutoSaveDate = state.calendar.currentDate;
      console.log('Auto-save completed');
    }

    return result;
  }

  async deleteSave(slot: SaveSlotNumber): Promise<SaveResult> {
    if (!isIndexedDBAvailable()) {
      return { success: false, error: 'IndexedDB not available' };
    }

    try {
      await db.saves.delete(slot);
      console.log(`Save slot ${slot} deleted`);
      return { success: true };
    } catch (error) {
      console.error('Delete failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async listSaves(): Promise<SaveSlotInfo[]> {
    if (!isIndexedDBAvailable()) {
      return [0, 1, 2, 3].map((slot) => ({
        slot: slot as SaveSlotNumber,
        isEmpty: true,
      }));
    }

    try {
      const saves = await db.saves.toArray();
      const saveMap = new Map(saves.map((s) => [s.slot, s]));

      return ([0, 1, 2, 3] as SaveSlotNumber[]).map((slot) => {
        const save = saveMap.get(slot);
        return {
          slot,
          isEmpty: !save,
          metadata: save?.metadata,
        };
      });
    } catch (error) {
      console.error('List saves failed:', error);
      return [0, 1, 2, 3].map((slot) => ({
        slot: slot as SaveSlotNumber,
        isEmpty: true,
      }));
    }
  }

  async hasSave(slot: SaveSlotNumber): Promise<boolean> {
    if (!isIndexedDBAvailable()) {
      return false;
    }

    try {
      const count = await db.saves.where('slot').equals(slot).count();
      return count > 0;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const saveManager = new SaveManager();

/**
 * Auto-save middleware type
 */
type AutoSave = <
  T extends MinimalGameState,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>
) => StateCreator<T, Mps, Mcs>;

/**
 * Auto-save middleware implementation
 */
type AutoSaveImpl = <T extends MinimalGameState>(
  f: StateCreator<T, [], []>
) => StateCreator<T, [], []>;

/**
 * Create auto-save middleware for Zustand
 */
const autoSaveImpl: AutoSaveImpl = (f) => (set, get, store) => {
  const wrappedSet: typeof set = (partial, replace) => {
    // Call original set
    if (replace) {
      set(partial as Parameters<typeof set>[0], true);
    } else {
      set(partial);
    }

    // Check if we should auto-save after state update
    const state = get();
    if (shouldAutoSave(state)) {
      saveManager.autoSave(state).catch((error) => {
        console.error('Auto-save error:', error);
      });
    }
  };

  return f(wrappedSet, get, store);
};

export const autoSave = autoSaveImpl as AutoSave;

/**
 * Apply loaded state to store
 */
export function applyLoadedState<T extends MinimalGameState>(
  setState: (state: Partial<T>) => void,
  loadedState: SerializedGameState
): void {
  // Backwards compatibility: initialize empty drama state if missing
  const dramaState = loadedState.drama || {
    activeEvents: [],
    eventHistory: [],
    activeFlags: {},
    cooldowns: {},
    lastEventByCategory: {},
    totalEventsTriggered: 0,
    totalMajorDecisions: 0,
  };

  // Backwards compatibility: initialize empty activity configs if missing
  const activityConfigs = loadedState.activityConfigs || {};

  setState({
    players: loadedState.players,
    teams: loadedState.teams,
    playerTeamId: loadedState.playerTeamId,
    initialized: loadedState.initialized,
    gameStarted: loadedState.gameStarted,
    calendar: loadedState.calendar,
    drama: dramaState,
    activityConfigs: activityConfigs,
  } as Partial<T>);
}
