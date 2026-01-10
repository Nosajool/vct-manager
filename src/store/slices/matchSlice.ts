// Match Slice - Zustand store slice for match management
// Follows normalized data pattern with entities stored by ID

import type { StateCreator } from 'zustand';
import type { Match, MatchResult } from '../../types';

export interface MatchSlice {
  // Normalized match entities
  matches: Record<string, Match>;

  // Normalized match results (separate for efficient lookup)
  results: Record<string, MatchResult>;

  // Actions
  addMatch: (match: Match) => void;
  addMatches: (matches: Match[]) => void;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
  removeMatch: (matchId: string) => void;
  addResult: (result: MatchResult) => void;

  // Selectors
  getMatch: (matchId: string) => Match | undefined;
  getResult: (matchId: string) => MatchResult | undefined;
  getMatchesByTeam: (teamId: string) => Match[];
  getTeamMatchHistory: (teamId: string) => MatchResult[];
  getUpcomingMatches: (teamId: string) => Match[];
  getCompletedMatches: (teamId: string) => Match[];
  getAllMatches: () => Match[];
}

export const createMatchSlice: StateCreator<
  MatchSlice,
  [],
  [],
  MatchSlice
> = (set, get) => ({
  // Initial state
  matches: {},
  results: {},

  // Actions
  addMatch: (match) =>
    set((state) => ({
      matches: { ...state.matches, [match.id]: match },
    })),

  addMatches: (matches) =>
    set((state) => ({
      matches: {
        ...state.matches,
        ...Object.fromEntries(matches.map((m) => [m.id, m])),
      },
    })),

  updateMatch: (matchId, updates) =>
    set((state) => {
      const existing = state.matches[matchId];
      if (!existing) return state;

      return {
        matches: {
          ...state.matches,
          [matchId]: { ...existing, ...updates },
        },
      };
    }),

  removeMatch: (matchId) =>
    set((state) => {
      const { [matchId]: removedMatch, ...remainingMatches } = state.matches;
      const { [matchId]: removedResult, ...remainingResults } = state.results;
      return {
        matches: remainingMatches,
        results: remainingResults,
      };
    }),

  addResult: (result) =>
    set((state) => ({
      results: { ...state.results, [result.matchId]: result },
    })),

  // Selectors
  getMatch: (matchId) => get().matches[matchId],

  getResult: (matchId) => get().results[matchId],

  getMatchesByTeam: (teamId) =>
    Object.values(get().matches).filter(
      (match) => match.teamAId === teamId || match.teamBId === teamId
    ),

  getTeamMatchHistory: (teamId) => {
    const { matches, results } = get();
    return Object.values(matches)
      .filter(
        (match) =>
          match.status === 'completed' &&
          (match.teamAId === teamId || match.teamBId === teamId)
      )
      .map((match) => results[match.id])
      .filter((result): result is MatchResult => result !== undefined);
  },

  getUpcomingMatches: (teamId) =>
    Object.values(get().matches)
      .filter(
        (match) =>
          match.status === 'scheduled' &&
          (match.teamAId === teamId || match.teamBId === teamId)
      )
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),

  getCompletedMatches: (teamId) =>
    Object.values(get().matches)
      .filter(
        (match) =>
          match.status === 'completed' &&
          (match.teamAId === teamId || match.teamBId === teamId)
      )
      .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)),

  getAllMatches: () => Object.values(get().matches),
});
