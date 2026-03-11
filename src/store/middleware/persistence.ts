// Persistence Middleware and SaveManager
// Handles auto-save and manual save/load operations

import type { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { db, isIndexedDBAvailable } from '../../db/database';
import {
  type SaveSlot,
  type SaveSlotNumber,
  type SaveMetadata,
  type SerializedGameState,
  SAVE_VERSION,
  AUTO_SAVE_INTERVAL_DAYS,
  checkSaveCompatibility,
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
  currentPatch?: unknown;
  upcomingPatch?: unknown;
  matches?: Record<string, unknown>;
  results?: Record<string, unknown>;
  tournaments?: Record<string, unknown>;
  standings?: Record<string, unknown>;
  qualifications?: Record<string, unknown>;
  tierTeams?: Record<string, unknown>;
  scrimHistory?: unknown[];
  teamStrategies?: Record<string, unknown>;
  playerAgentPreferences?: Record<string, unknown>;
  matchStrategies?: Record<string, unknown>;
  roundData?: Record<string, unknown>;
  roundDataSeasonId?: string;
  historicalSeasonStats?: Record<string, unknown>;
  drama?: {
    activeEvents: unknown[];
    eventHistory: unknown[];
    activeFlags: Record<string, string | { setDate: string; expiresDate?: string }>;
    cooldowns: Record<string, string>;
    lastEventByCategory: Record<string, string>;
    totalEventsTriggered: number;
    totalMajorDecisions: number;
  };
  activityConfigs?: Record<string, unknown>;
  rivalries?: Record<string, unknown>;
  pendingInterview?: unknown;
  interviewQueue?: unknown[];
  pendingDramaBoost?: number;
  interviewHistory?: unknown[];
  autoSaveStatus?: 'idle' | 'saving' | 'saved';
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
 * Cap/prune data before saving to prevent unbounded growth
 */
function sanitizeBeforeSave(state: MinimalGameState): MinimalGameState {
  return {
    ...state,
    // Cap interview history to last 100 entries
    interviewHistory: state.interviewHistory
      ? state.interviewHistory.slice(-100)
      : [],
  };
}

/**
 * Extract serializable state from GameState
 * Excludes UI state and functions
 */
function serializeGameState(state: MinimalGameState): SerializedGameState {
  const sanitized = sanitizeBeforeSave(state);
  return {
    players: sanitized.players,
    teams: sanitized.teams,
    playerTeamId: sanitized.playerTeamId,
    initialized: sanitized.initialized,
    gameStarted: sanitized.gameStarted,
    calendar: {
      currentDate: sanitized.calendar.currentDate,
      currentSeason: sanitized.calendar.currentSeason,
      currentPhase: sanitized.calendar.currentPhase,
      scheduledEvents: sanitized.calendar.scheduledEvents,
    },
    currentPatch: sanitized.currentPatch,
    upcomingPatch: sanitized.upcomingPatch,
    matches: sanitized.matches,
    results: sanitized.results,
    tournaments: sanitized.tournaments,
    standings: sanitized.standings,
    qualifications: sanitized.qualifications,
    tierTeams: sanitized.tierTeams,
    scrimHistory: sanitized.scrimHistory,
    teamStrategies: sanitized.teamStrategies,
    playerAgentPreferences: sanitized.playerAgentPreferences,
    matchStrategies: sanitized.matchStrategies,
    roundData: sanitized.roundData,
    roundDataSeasonId: sanitized.roundDataSeasonId,
    historicalSeasonStats: sanitized.historicalSeasonStats,
    drama: sanitized.drama,
    activityConfigs: sanitized.activityConfigs,
    rivalries: sanitized.rivalries,
    pendingInterview: sanitized.pendingInterview,
    interviewQueue: sanitized.interviewQueue,
    pendingDramaBoost: sanitized.pendingDramaBoost,
    interviewHistory: sanitized.interviewHistory,
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
    compatibility?: 'compatible' | 'incompatible';
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

      const compatibility = checkSaveCompatibility(saveSlot.metadata.version);
      this.setPlaytime(saveSlot.metadata.playtime);
      console.log(`Game loaded from slot ${slot}`);
      return {
        success: true,
        data: saveSlot.gameState,
        metadata: saveSlot.metadata,
        compatibility,
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

let saveInProgress = false;
let isUpdatingUI = false;

/**
 * Create auto-save middleware for Zustand
 */
const autoSaveImpl: AutoSaveImpl = (f) => (set, get, store) => {
  const wrappedSet: typeof set = (partial, replace) => {
    if (replace) {
      set(partial as Parameters<typeof set>[0], true);
    } else {
      set(partial);
    }

    // Skip the save check when we ourselves are updating autoSaveStatus
    if (isUpdatingUI) return;

    const state = get();
    if (!saveInProgress && shouldAutoSave(state)) {
      saveInProgress = true;
      lastAutoSaveDate = state.calendar.currentDate; // optimistic update

      isUpdatingUI = true;
      set({ autoSaveStatus: 'saving' } as Parameters<typeof set>[0]);
      isUpdatingUI = false;

      const doSave = () => {
        const freshState = get();
        saveManager.autoSave(freshState)
          .then(() => {
            isUpdatingUI = true;
            set({ autoSaveStatus: 'saved' } as Parameters<typeof set>[0]);
            isUpdatingUI = false;
            setTimeout(() => {
              isUpdatingUI = true;
              set({ autoSaveStatus: 'idle' } as Parameters<typeof set>[0]);
              isUpdatingUI = false;
            }, 3000);
          })
          .catch((error) => {
            console.error('Auto-save error:', error);
            isUpdatingUI = true;
            set({ autoSaveStatus: 'idle' } as Parameters<typeof set>[0]);
            isUpdatingUI = false;
          })
          .finally(() => {
            saveInProgress = false;
          });
      };

      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(doSave, { timeout: 5000 });
      } else {
        setTimeout(doSave, 0);
      }
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

  // Migrate old flag format (string) to new format (object with setDate/expiresDate)
  const migratedFlags: Record<string, { setDate: string; expiresDate?: string }> = {};
  for (const [flag, data] of Object.entries(dramaState.activeFlags)) {
    if (typeof data === 'string') {
      migratedFlags[flag] = { setDate: data, expiresDate: undefined };
    } else {
      migratedFlags[flag] = data;
    }
  }
  dramaState.activeFlags = migratedFlags;

  // Prune activity configs for past dates
  const activityConfigs = loadedState.activityConfigs || {};
  const prunedActivityConfigs = pruneOldActivityConfigs(
    activityConfigs,
    loadedState.calendar
  );

  // Defaults for all optional slices
  const matches = loadedState.matches ?? {};
  const results = loadedState.results ?? {};
  const tournaments = loadedState.tournaments ?? {};
  const standings = loadedState.standings ?? {};
  const qualifications = loadedState.qualifications ?? {};
  const tierTeams = loadedState.tierTeams ?? {};
  const scrimHistory = loadedState.scrimHistory ?? [];
  const teamStrategies = loadedState.teamStrategies ?? {};
  const playerAgentPreferences = loadedState.playerAgentPreferences ?? {};
  const matchStrategies = loadedState.matchStrategies ?? {};
  const roundData = loadedState.roundData ?? {};
  const roundDataSeasonId = loadedState.roundDataSeasonId ?? String(loadedState.calendar.currentSeason);
  const historicalSeasonStats = loadedState.historicalSeasonStats ?? {};
  const rivalries = loadedState.rivalries ?? {};
  const pendingInterview = loadedState.pendingInterview ?? null;
  const interviewQueue = loadedState.interviewQueue ?? [];
  const pendingDramaBoost = loadedState.pendingDramaBoost ?? 0;
  const interviewHistory = loadedState.interviewHistory ?? [];

  setState({
    players: loadedState.players,
    teams: loadedState.teams,
    playerTeamId: loadedState.playerTeamId,
    initialized: loadedState.initialized,
    gameStarted: loadedState.gameStarted,
    calendar: loadedState.calendar,
    currentPatch: loadedState.currentPatch ?? null,
    upcomingPatch: loadedState.upcomingPatch ?? null,
    matches,
    results,
    tournaments,
    standings,
    qualifications,
    tierTeams,
    scrimHistory,
    teamStrategies,
    playerAgentPreferences,
    matchStrategies,
    roundData,
    roundDataSeasonId,
    historicalSeasonStats,
    drama: dramaState,
    activityConfigs: prunedActivityConfigs,
    rivalries,
    pendingInterview,
    interviewQueue,
    pendingDramaBoost,
    interviewHistory,
  } as Partial<T>);
}

/**
 * Prune activity configs for dates in the past
 * This prevents accumulation of old configs after save/load cycles
 */
function pruneOldActivityConfigs(
  activityConfigs: Record<string, unknown>,
  calendar: { currentDate: string; scheduledEvents: unknown[] }
): Record<string, unknown> {
  const currentDate = new Date(calendar.currentDate);
  const pruned: Record<string, unknown> = {};

  // Get all event IDs grouped by date
  const eventsByDate = new Map<string, Set<string>>();
  for (const event of calendar.scheduledEvents as Array<{ id: string; date: string }>) {
    if (!eventsByDate.has(event.date)) {
      eventsByDate.set(event.date, new Set());
    }
    eventsByDate.get(event.date)!.add(event.id);
  }

  // Only keep configs for events on current date or future dates
  for (const [eventId, config] of Object.entries(activityConfigs)) {
    // Find which date this event belongs to
    let eventDate: Date | null = null;
    for (const [dateStr, eventIds] of eventsByDate.entries()) {
      if (eventIds.has(eventId)) {
        eventDate = new Date(dateStr);
        break;
      }
    }

    // If event date is current or future, keep the config
    if (eventDate && eventDate >= currentDate) {
      pruned[eventId] = config;
    }
    // Otherwise, skip (prune) this config
  }

  return pruned;
}
