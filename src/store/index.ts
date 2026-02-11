// VCT Manager - Zustand Store
// Combines all slices into a single store with persistence

// NOTE: Save/load UI functionality has been removed from the application.
// The backend persistence system remains intact for future development.
// Auto-save is currently disabled for development purposes.

import { create } from 'zustand';
import { createPlayerSlice, type PlayerSlice } from './slices/playerSlice';
import { createTeamSlice, type TeamSlice } from './slices/teamSlice';
import { createGameSlice, type GameSlice } from './slices/gameSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createMatchSlice, type MatchSlice } from './slices/matchSlice';
import { createCompetitionSlice, type CompetitionSlice } from './slices/competitionSlice';
import { createScrimSlice, type ScrimSlice } from './slices/scrimSlice';
import { createStrategySlice, type StrategySlice } from './slices/strategySlice';
import { createRoundDataSlice, type RoundDataSlice } from './slices/roundDataSlice';
import { createSeasonStatsSlice, type SeasonStatsSlice } from './slices/seasonStatsSlice';
import { createDramaSlice, type DramaSlice } from './slices/dramaSlice';
import { createActivityPlanSlice, type ActivityPlanSlice } from './slices/activityPlanSlice';
import {
  saveManager,
  applyLoadedState,
  type SaveSlotInfo,
} from './middleware/persistence';
import type { SaveSlotNumber } from '../db/schema';

// Combined game state type
export type GameState = PlayerSlice & TeamSlice & GameSlice & UISlice & MatchSlice & CompetitionSlice & ScrimSlice & StrategySlice & RoundDataSlice & SeasonStatsSlice & DramaSlice & ActivityPlanSlice;

// Create the combined store without auto-save middleware
export const useGameStore = create<GameState>()(
  (...args) => ({
    ...createPlayerSlice(...args),
    ...createTeamSlice(...args),
    ...createGameSlice(...args),
    ...createUISlice(...args),
    ...createMatchSlice(...args),
    ...createCompetitionSlice(...args),
    ...createScrimSlice(...args),
    ...createStrategySlice(...args),
    ...createRoundDataSlice(...args),
    ...createSeasonStatsSlice(...args),
    ...createDramaSlice(...args),
    ...createActivityPlanSlice(...args),
  })
);

// Re-export slice types for convenience
export type { PlayerSlice } from './slices/playerSlice';
export type { TeamSlice } from './slices/teamSlice';
export type { GameSlice } from './slices/gameSlice';
export type { UISlice, ActiveView, BulkSimulationProgress } from './slices/uiSlice';
export type { MatchSlice } from './slices/matchSlice';
export type { CompetitionSlice, StandingsEntry, QualificationRecord } from './slices/competitionSlice';
export type { ScrimSlice } from './slices/scrimSlice';
export type { StrategySlice } from './slices/strategySlice';
export type { RoundDataSlice, MatchRoundData } from './slices/roundDataSlice';
export type { SeasonStatsSlice } from './slices/seasonStatsSlice';
export type { DramaSlice } from './slices/dramaSlice';
export type { ActivityPlanSlice } from './slices/activityPlanSlice';

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

export const useCurrentSeason = () =>
  useGameStore((state) => state.calendar.currentSeason);

export const useActiveView = () =>
  useGameStore((state) => state.activeView);

export const useError = () =>
  useGameStore((state) => state.error);

export const useIsSimulating = () =>
  useGameStore((state) => state.isSimulating);

export const useMatch = (matchId: string) =>
  useGameStore((state) => state.matches[matchId]);

export const useMatchResult = (matchId: string) =>
  useGameStore((state) => state.results[matchId]);

export const useAllMatches = () =>
  useGameStore((state) => Object.values(state.matches));

export const useTournament = (tournamentId: string) =>
  useGameStore((state) => state.tournaments[tournamentId]);

export const useActiveTournaments = () =>
  useGameStore((state) =>
    Object.values(state.tournaments).filter((t) => t.status === 'in_progress')
  );

export const useCurrentTournament = () =>
  useGameStore((state) => {
    const tournaments = Object.values(state.tournaments);
    const active = tournaments.find((t) => t.status === 'in_progress');
    if (active) return active;
    return tournaments
      .filter((t) => t.status === 'upcoming')
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  });

export const useAllTournaments = () =>
  useGameStore((state) => Object.values(state.tournaments));

// ============================================
// Scrim-related selector hooks (Phase 6)
// ============================================

export const useTierTeams = () =>
  useGameStore((state) => Object.values(state.tierTeams));

export const useTierTeamsByRegion = (region: string) =>
  useGameStore((state) =>
    Object.values(state.tierTeams).filter((t) => t.region === region)
  );

export const useScrimHistory = (limit?: number) =>
  useGameStore((state) =>
    limit ? state.scrimHistory.slice(-limit) : state.scrimHistory
  );

export const useMapPool = (teamId: string) =>
  useGameStore((state) => state.teams[teamId]?.mapPool);

export const usePlayerTeamMapPool = () =>
  useGameStore((state) =>
    state.playerTeamId ? state.teams[state.playerTeamId]?.mapPool : undefined
  );

// ============================================
// Strategy-related selector hooks
// ============================================

export const useTeamStrategy = (teamId: string) =>
  useGameStore((state) => state.getTeamStrategy(teamId));

export const usePlayerTeamStrategy = () =>
  useGameStore((state) =>
    state.playerTeamId ? state.getTeamStrategy(state.playerTeamId) : undefined
  );

export const usePlayerAgentPrefs = (playerId: string) =>
  useGameStore((state) => state.getPlayerAgentPreferences(playerId));

// ============================================
// Round data selector hooks
// ============================================

export const useMatchRoundData = (matchId: string) =>
  useGameStore((state) => state.getMatchRoundData(matchId));

// ============================================
// Team Stats selector hooks (all support optional season filtering)
// ============================================

export const useTeamWinRate = (teamId: string, season?: number) =>
  useGameStore((state) => state.getTeamWinRate(teamId, season));

export const useTeamRecentForm = (teamId: string, count = 5, season?: number) =>
  useGameStore((state) => state.getTeamRecentForm(teamId, count, season));

export const useTeamMapStats = (teamId: string, season?: number) =>
  useGameStore((state) => state.getTeamMapStats(teamId, season));

export const useHeadToHead = (teamIdA: string, teamIdB: string, season?: number) =>
  useGameStore((state) => state.getHeadToHead(teamIdA, teamIdB, season));

export const useTeamAverageRoundDiff = (teamId: string, season?: number) =>
  useGameStore((state) => state.getTeamAverageRoundDiff(teamId, season));

export const useTeamClutchStats = (teamId: string, season?: number) =>
  useGameStore((state) => state.getTeamClutchStats(teamId, season));

export const useTeamPlayerAggregateStats = (teamId: string, season?: number) =>
  useGameStore((state) => state.getTeamPlayerAggregateStats(teamId, season));

export const useTeamMatchHistory = (teamId: string, season?: number) =>
  useGameStore((state) => state.getTeamMatchHistory(teamId, season));

export const useUpcomingMatches = (teamId: string) =>
  useGameStore((state) => state.getUpcomingMatches(teamId));

export const useCompletedMatches = (teamId: string, season?: number) =>
  useGameStore((state) => state.getCompletedMatches(teamId, season));

/**
 * Comprehensive team stats hook
 * Combines multiple stats into a single object for easy consumption
 * @param season - Optional season number for filtering (undefined = all seasons)
 */
export const useTeamStats = (teamId: string, season?: number) =>
  useGameStore((state) => {
    const team = state.teams[teamId];
    if (!team) return null;

    const matchHistory = state.getTeamMatchHistory(teamId, season);
    const winRate = state.getTeamWinRate(teamId, season);
    const recentForm = state.getTeamRecentForm(teamId, 5, season);
    const mapStats = state.getTeamMapStats(teamId, season);
    const avgRoundDiff = state.getTeamAverageRoundDiff(teamId, season);
    const clutchStats = state.getTeamClutchStats(teamId, season);
    const playerStats = state.getTeamPlayerAggregateStats(teamId, season);

    return {
      team,
      standings: team.standings,
      chemistry: team.chemistry,
      matchHistory,
      matchCount: matchHistory.length,
      winRate,
      recentForm,
      mapStats,
      avgRoundDiff,
      clutchStats,
      playerStats,
      mapPool: team.mapPool,
    };
  });

/**
 * Player team stats hook - shorthand for useTeamStats with player's team
 * @param season - Optional season number for filtering (undefined = all seasons)
 */
export const usePlayerTeamStats = (season?: number) =>
  useGameStore((state) => {
    const teamId = state.playerTeamId;
    if (!teamId) return null;

    const team = state.teams[teamId];
    if (!team) return null;

    const matchHistory = state.getTeamMatchHistory(teamId, season);
    const winRate = state.getTeamWinRate(teamId, season);
    const recentForm = state.getTeamRecentForm(teamId, 5, season);
    const mapStats = state.getTeamMapStats(teamId, season);
    const avgRoundDiff = state.getTeamAverageRoundDiff(teamId, season);
    const clutchStats = state.getTeamClutchStats(teamId, season);
    const playerStats = state.getTeamPlayerAggregateStats(teamId, season);

    return {
      team,
      standings: team.standings,
      chemistry: team.chemistry,
      matchHistory,
      matchCount: matchHistory.length,
      winRate,
      recentForm,
      mapStats,
      avgRoundDiff,
      clutchStats,
      playerStats,
      mapPool: team.mapPool,
    };
  });

// ============================================
// Season Stats selector hooks
// ============================================

export const usePlayerSeasonStats = (playerId: string, season: number) =>
  useGameStore((state) => state.getPlayerSeasonStats(playerId, season));

export const usePlayerAllSeasons = (playerId: string) =>
  useGameStore((state) => state.getPlayerAllSeasons(playerId));

export const useAllPlayersSeasonStats = (season: number) =>
  useGameStore((state) => state.getAllPlayersSeasonStats(season));

// ============================================
// Drama selector hooks
// ============================================

export const useDramaActiveEvents = () =>
  useGameStore((state) => state.getActiveEvents());

export const useDramaHistory = (limit?: number) =>
  useGameStore((state) => state.getEventHistory(limit));

export const usePendingMajorEvents = () =>
  useGameStore((state) => state.getPendingMajorEvents());

// Re-export persistence types
export type { SaveSlotInfo } from './middleware/persistence';
export type { SaveSlotNumber, SaveMetadata } from '../db/schema';
