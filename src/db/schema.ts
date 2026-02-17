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

  // Drama slice (optional for backwards compatibility)
  drama?: {
    activeEvents: unknown[];
    eventHistory: unknown[];
    activeFlags: Record<string, string | { setDate: string; expiresDate?: string }>;
    cooldowns: Record<string, string>;
    lastEventByCategory: Record<string, string>;
    totalEventsTriggered: number;
    totalMajorDecisions: number;
  };

  // Activity Plan slice (optional for backwards compatibility)
  activityConfigs?: Record<string, unknown>;

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
 * Current version of the save format
 * Increment when making breaking changes to save structure
 */
export const SAVE_VERSION = '1.0.0';

/**
 * Auto-save interval in days
 */
export const AUTO_SAVE_INTERVAL_DAYS = 7;

/**
 * Maximum number of match history entries to keep per season
 */
export const MAX_MATCH_HISTORY_PER_SEASON = 500;
