// Season Stats Slice - Zustand store slice for historical season stats
// Stores archived season stats for players across multiple seasons

import type { StateCreator } from 'zustand';
import type { PlayerSeasonStats } from '../../types';

// Historical season stats storage structure
// Maps playerId -> season number -> stats
export interface SeasonStatsSlice {
  // Normalized historical season stats
  // Structure: { [playerId]: { [season]: PlayerSeasonStats } }
  historicalSeasonStats: Record<string, Record<number, PlayerSeasonStats>>;

  // Actions
  archiveSeasonStats: (playerId: string, stats: PlayerSeasonStats) => void;
  archiveAllPlayersSeasonStats: (
    playerStats: Array<{ playerId: string; stats: PlayerSeasonStats }>
  ) => void;

  // Selectors
  getPlayerSeasonStats: (
    playerId: string,
    season: number
  ) => PlayerSeasonStats | undefined;
  getPlayerAllSeasons: (
    playerId: string
  ) => Array<{ season: number; stats: PlayerSeasonStats }>;
  getAllPlayersSeasonStats: (
    season: number
  ) => Array<{ playerId: string; stats: PlayerSeasonStats }>;
}

export const createSeasonStatsSlice: StateCreator<
  SeasonStatsSlice,
  [],
  [],
  SeasonStatsSlice
> = (set, get) => ({
  // Initial state
  historicalSeasonStats: {},

  // Actions
  archiveSeasonStats: (playerId, stats) =>
    set((state) => ({
      historicalSeasonStats: {
        ...state.historicalSeasonStats,
        [playerId]: {
          ...state.historicalSeasonStats[playerId],
          [stats.season]: stats,
        },
      },
    })),

  archiveAllPlayersSeasonStats: (playerStats) =>
    set((state) => {
      const newStats = { ...state.historicalSeasonStats };

      for (const { playerId, stats } of playerStats) {
        if (!newStats[playerId]) {
          newStats[playerId] = {};
        }
        newStats[playerId] = {
          ...newStats[playerId],
          [stats.season]: stats,
        };
      }

      return { historicalSeasonStats: newStats };
    }),

  // Selectors
  getPlayerSeasonStats: (playerId, season) => {
    const playerStats = get().historicalSeasonStats[playerId];
    return playerStats?.[season];
  },

  getPlayerAllSeasons: (playerId) => {
    const playerStats = get().historicalSeasonStats[playerId];
    if (!playerStats) return [];

    return Object.entries(playerStats)
      .map(([season, stats]) => ({
        season: parseInt(season),
        stats,
      }))
      .sort((a, b) => b.season - a.season); // Most recent first
  },

  getAllPlayersSeasonStats: (season) => {
    const allStats = get().historicalSeasonStats;
    const result: Array<{ playerId: string; stats: PlayerSeasonStats }> = [];

    for (const [playerId, playerSeasons] of Object.entries(allStats)) {
      const stats = playerSeasons[season];
      if (stats) {
        result.push({ playerId, stats });
      }
    }

    return result;
  },
});
