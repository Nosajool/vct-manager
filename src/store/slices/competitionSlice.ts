// Competition Slice - Zustand store slice for tournament and competition management
// Handles tournaments, brackets, and standings

import type { StateCreator } from 'zustand';
import type { Tournament, BracketStructure } from '../../types';

// Standings entry for league-style phases
export interface StandingsEntry {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  roundDiff: number; // Total rounds won - total rounds lost
  placement?: number;
}

export interface CompetitionSlice {
  // Normalized tournament entities
  tournaments: Record<string, Tournament>;

  // Standings by tournament ID
  standings: Record<string, StandingsEntry[]>;

  // Actions
  addTournament: (tournament: Tournament) => void;
  updateTournament: (id: string, updates: Partial<Tournament>) => void;
  removeTournament: (id: string) => void;
  updateBracket: (tournamentId: string, bracket: BracketStructure) => void;
  updateStandings: (tournamentId: string, standings: StandingsEntry[]) => void;
  setTournamentChampion: (tournamentId: string, championId: string) => void;

  // Selectors
  getTournament: (id: string) => Tournament | undefined;
  getTournamentsByRegion: (region: string) => Tournament[];
  getActiveTournaments: () => Tournament[];
  getCompletedTournaments: () => Tournament[];
  getUpcomingTournaments: () => Tournament[];
  getCurrentTournament: () => Tournament | undefined;
  getTournamentStandings: (tournamentId: string) => StandingsEntry[];
  getTeamTournaments: (teamId: string) => Tournament[];
  getAllTournaments: () => Tournament[];
}

export const createCompetitionSlice: StateCreator<
  CompetitionSlice,
  [],
  [],
  CompetitionSlice
> = (set, get) => ({
  // Initial state
  tournaments: {},
  standings: {},

  // Actions
  addTournament: (tournament) =>
    set((state) => ({
      tournaments: { ...state.tournaments, [tournament.id]: tournament },
    })),

  updateTournament: (id, updates) =>
    set((state) => {
      const existing = state.tournaments[id];
      if (!existing) return state;

      return {
        tournaments: {
          ...state.tournaments,
          [id]: { ...existing, ...updates },
        },
      };
    }),

  removeTournament: (id) =>
    set((state) => {
      const { [id]: removed, ...remaining } = state.tournaments;
      const { [id]: removedStandings, ...remainingStandings } = state.standings;
      return {
        tournaments: remaining,
        standings: remainingStandings,
      };
    }),

  updateBracket: (tournamentId, bracket) =>
    set((state) => {
      const existing = state.tournaments[tournamentId];
      if (!existing) return state;

      return {
        tournaments: {
          ...state.tournaments,
          [tournamentId]: { ...existing, bracket },
        },
      };
    }),

  updateStandings: (tournamentId, standings) =>
    set((state) => ({
      standings: { ...state.standings, [tournamentId]: standings },
    })),

  setTournamentChampion: (tournamentId, championId) =>
    set((state) => {
      const existing = state.tournaments[tournamentId];
      if (!existing) return state;

      return {
        tournaments: {
          ...state.tournaments,
          [tournamentId]: {
            ...existing,
            championId,
            status: 'completed' as const,
          },
        },
      };
    }),

  // Selectors
  getTournament: (id) => get().tournaments[id],

  getTournamentsByRegion: (region) =>
    Object.values(get().tournaments).filter(
      (tournament) => tournament.region === region
    ),

  getActiveTournaments: () =>
    Object.values(get().tournaments).filter(
      (tournament) => tournament.status === 'in_progress'
    ),

  getCompletedTournaments: () =>
    Object.values(get().tournaments).filter(
      (tournament) => tournament.status === 'completed'
    ),

  getUpcomingTournaments: () =>
    Object.values(get().tournaments)
      .filter((tournament) => tournament.status === 'upcoming')
      .sort((a, b) => a.startDate.localeCompare(b.startDate)),

  getCurrentTournament: () => {
    // Return the first active tournament, or the next upcoming one
    const tournaments = Object.values(get().tournaments);

    const active = tournaments.find((t) => t.status === 'in_progress');
    if (active) return active;

    const upcoming = tournaments
      .filter((t) => t.status === 'upcoming')
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    return upcoming[0];
  },

  getTournamentStandings: (tournamentId) =>
    get().standings[tournamentId] || [],

  getTeamTournaments: (teamId) =>
    Object.values(get().tournaments).filter((tournament) =>
      tournament.teamIds.includes(teamId)
    ),

  getAllTournaments: () => Object.values(get().tournaments),
});
