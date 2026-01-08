// Database Module - Re-export all database utilities

export {
  db,
  VCTDatabase,
  isIndexedDBAvailable,
  getStorageEstimate,
  clearDatabase,
  exportDatabase,
  importDatabase,
} from './database';

export type {
  SaveSlot,
  SaveSlotNumber,
  SaveMetadata,
  SerializedGameState,
  MatchHistoryEntry,
  CompressedSeasonHistory,
} from './schema';

export {
  SAVE_VERSION,
  AUTO_SAVE_INTERVAL_DAYS,
  MAX_MATCH_HISTORY_PER_SEASON,
} from './schema';
