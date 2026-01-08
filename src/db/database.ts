// VCT Manager Database - Dexie IndexedDB wrapper
// Handles save/load persistence

import Dexie, { type Table } from 'dexie';
import type { SaveSlot, MatchHistoryEntry } from './schema';

/**
 * VCT Manager IndexedDB Database
 *
 * Tables:
 * - saves: Game save slots (0 = auto-save, 1-3 = manual saves)
 * - matchHistory: Historical match records for statistics
 */
export class VCTDatabase extends Dexie {
  // Typed tables
  saves!: Table<SaveSlot, number>;
  matchHistory!: Table<MatchHistoryEntry, number>;

  constructor() {
    super('VCTManagerDB');

    // Define database schema
    // Only indexed fields need to be declared here
    this.version(1).stores({
      // saves: slot is primary key, saveDate for ordering
      saves: 'slot, saveDate',

      // matchHistory: auto-increment id, indexed by season, matchId, date
      matchHistory: '++id, season, matchId, date, [season+isNotable]',
    });
  }
}

// Singleton database instance
export const db = new VCTDatabase();

/**
 * Check if IndexedDB is available in the current browser
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Get database storage estimate (if available)
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
} | null> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
    };
  }
  return null;
}

/**
 * Clear all database data (use with caution!)
 */
export async function clearDatabase(): Promise<void> {
  await db.saves.clear();
  await db.matchHistory.clear();
}

/**
 * Export database for backup
 */
export async function exportDatabase(): Promise<{
  saves: SaveSlot[];
  matchHistory: MatchHistoryEntry[];
}> {
  const [saves, matchHistory] = await Promise.all([
    db.saves.toArray(),
    db.matchHistory.toArray(),
  ]);

  return { saves, matchHistory };
}

/**
 * Import database from backup
 */
export async function importDatabase(data: {
  saves: SaveSlot[];
  matchHistory: MatchHistoryEntry[];
}): Promise<void> {
  await db.transaction('rw', db.saves, db.matchHistory, async () => {
    await db.saves.clear();
    await db.matchHistory.clear();

    if (data.saves.length > 0) {
      await db.saves.bulkAdd(data.saves);
    }

    if (data.matchHistory.length > 0) {
      await db.matchHistory.bulkAdd(data.matchHistory);
    }
  });
}
