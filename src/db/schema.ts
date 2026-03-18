// Database Schema Types for IndexedDB persistence
// Based on VCT Manager Technical Specification

import type { MatchResult } from '../types';

/**
 * Save slot numbers:
 * - 0: Auto-save slot (weekly auto-save)
 * - 1-3: Manual save slots
 */
export type SaveSlotNumber = 0 | 1 | 2 | 3;

/**
 * Metadata for save files - displayed in save/load UI
 */
export interface SaveMetadata {
  teamName: string;
  currentDate: string;      // ISO date string
  season: number;
  playtime: number;         // Total playtime in minutes
  version: string;          // Game version for compatibility
  lastModified: string;     // ISO date string
}

/**
 * Complete save slot structure stored in IndexedDB
 */
export interface SaveSlot {
  slot: SaveSlotNumber;
  saveDate: string;         // ISO date string
  metadata: SaveMetadata;
  gameState: SerializedGameState;
}

/**
 * Serialized game state for storage
 * Matches the structure of GameState but with serializable types
 *
 * DEVELOPER INSTRUCTIONS:
 * When adding a new slice or new state to persist:
 * 1. Add an optional field here (always optional for forward compatibility)
 * 2. Extract it in `serializeGameState()` in persistence.ts
 * 3. Provide a default in `applyLoadedState()` in persistence.ts
 * 4. Bump the minor version in SAVE_VERSION (e.g. 0.1.0 → 0.2.0)
 *
 * NOT persisted (intentionally):
 * - UISlice — transient (selections, modals, loading states)
 * - NarrativeCollectionSlice — uses localStorage intentionally
 *   (survives across new-game resets, which is the intended behavior)
 */
export interface SerializedGameState {
  // Player slice
  players: Record<string, unknown>;

  // Team slice
  teams: Record<string, unknown>;
  playerTeamId: string | null;

  // Game slice
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

  // Match slice
  matches?: Record<string, unknown>;
  results?: Record<string, unknown>;

  // Competition slice
  tournaments?: Record<string, unknown>;
  standings?: Record<string, unknown>;
  qualifications?: Record<string, unknown>;

  // Scrim slice
  tierTeams?: Record<string, unknown>;
  scrimHistory?: unknown[];

  // Strategy slice
  teamStrategies?: Record<string, unknown>;
  playerAgentPreferences?: Record<string, unknown>;

  // Match strategy slice
  matchStrategies?: Record<string, unknown>;

  // Round data slice
  roundData?: Record<string, unknown>;
  roundDataSeasonId?: string;

  // Season stats slice
  historicalSeasonStats?: Record<string, unknown>;

  // Drama slice (optional for backwards compatibility)
  drama?: {
    activeEvents: unknown[];
    eventHistory: unknown[];
    activeFlags: Record<string, string | { setDate: string; expiresDate?: string }>;
    cooldowns: Record<string, string>;
    lastEventByCategory: Record<string, string>;
    totalEventsTriggered: number;
    totalMajorDecisions: number;
    pendingEventTriggers?: Array<{
      templateId: string;
      fireDate: string;
      involvedPlayerIds: string[];
    }>;
  };

  // Activity Plan slice (optional for backwards compatibility)
  activityConfigs?: Record<string, unknown>;

  // Rivalry slice
  rivalries?: Record<string, unknown>;

  // Interview slice
  pendingInterview?: unknown;
  interviewQueue?: unknown[];
  pendingDramaBoost?: number;
  interviewHistory?: unknown[];

  // UI slice is NOT persisted (transient state)
}

/**
 * Compressed match history entry for archived seasons
 * Only stores summary data to save space
 */
export interface MatchHistoryEntry {
  id?: number;              // Auto-incremented by Dexie
  season: number;
  matchId: string;
  date: string;             // ISO date string

  // Match summary
  teamAId: string;
  teamBId: string;
  winnerId: string;
  scoreTeamA: number;
  scoreTeamB: number;

  // Was this a notable match? (playoffs, championship, etc.)
  isNotable: boolean;
  tournamentId?: string;
  tournamentName?: string;
}

/**
 * Compressed season history for older seasons
 */
export interface CompressedSeasonHistory {
  season: number;
  totalMatches: number;
  teamPerformance: {
    wins: number;
    losses: number;
    roundDiff: number;
  };
  notableMatches: MatchResult[];  // Playoffs, important games only
  tournamentsWon: string[];       // Tournament IDs
}

/**
 * Current version of the save format.
 * - Bump minor (0.x.0 → 0.x+1.0) when adding new optional fields.
 * - Bump major (0.x.0 → 1.0.0) only for structural breaking changes.
 */
export const SAVE_VERSION = '0.1.0';

/**
 * Oldest save version that can be loaded without a migration.
 * Saves with a different major version are considered incompatible.
 */
export const MINIMUM_COMPATIBLE_VERSION = '0.1.0';

/**
 * Check whether a saved version is compatible with the current game.
 * Same major version = compatible (minor differences handled via defaults).
 * Different major version = incompatible (show warning, refuse to load).
 */
export function checkSaveCompatibility(
  savedVersion: string
): 'compatible' | 'incompatible' {
  const savedMajor = parseInt(savedVersion.split('.')[0], 10);
  const currentMajor = parseInt(SAVE_VERSION.split('.')[0], 10);
  return savedMajor === currentMajor ? 'compatible' : 'incompatible';
}

/**
 * Auto-save interval in days
 */
export const AUTO_SAVE_INTERVAL_DAYS = 7;

/**
 * Maximum number of match history entries to keep per season
 */
export const MAX_MATCH_HISTORY_PER_SEASON = 500;
