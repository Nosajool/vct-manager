// Competition Slice - Zustand store slice for tournament and competition management
// Handles tournaments, brackets, standings, and qualifications

import type { StateCreator } from 'zustand';
import type { Tournament, BracketStructure, CompetitionType, Region, SwissStage, SwissTeamRecord } from '../../types';
import { isMultiStageTournament } from '../../types';

// Standings entry for league-style phases
export interface StandingsEntry {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  roundDiff: number; // Total rounds won - total rounds lost
  placement?: number;
}

// Qualification record for tracking teams that qualified from a tournament
export interface QualificationRecord {
  tournamentId: string;
  tournamentType: CompetitionType;
  region: Region | 'International';
  qualifiedTeams: Array<{
    teamId: string;
    teamName: string;
    bracket: 'alpha' | 'beta' | 'omega';  // Undefeated, 1 loss, 2 losses
  }>;
}

export interface CompetitionSlice {
  // Normalized tournament entities
  tournaments: Record<string, Tournament>;

  // Standings by tournament ID
  standings: Record<string, StandingsEntry[]>;

  // Qualifications keyed by tournament ID
  qualifications: Record<string, QualificationRecord>;

  // Actions
  addTournament: (tournament: Tournament) => void;
  updateTournament: (id: string, updates: Partial<Tournament>) => void;
  removeTournament: (id: string) => void;
  updateBracket: (tournamentId: string, bracket: BracketStructure) => void;
  updateStandings: (tournamentId: string, standings: StandingsEntry[]) => void;
  setTournamentChampion: (tournamentId: string, championId: string) => void;
  addQualification: (record: QualificationRecord) => void;

  // Swiss stage actions
  updateSwissStage: (tournamentId: string, swissStage: SwissStage) => void;
  setTournamentCurrentStage: (tournamentId: string, stage: 'swiss' | 'playoff') => void;

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
  getQualificationsForType: (type: CompetitionType) => QualificationRecord[];

  // Swiss stage selectors
  getSwissStandings: (tournamentId: string) => SwissTeamRecord[];
  getCurrentTournamentStage: (tournamentId: string) => 'swiss' | 'playoff' | null;
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
  qualifications: {},

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

  addQualification: (record) =>
    set((state) => ({
      qualifications: { ...state.qualifications, [record.tournamentId]: record },
    })),

  // Swiss stage actions
  updateSwissStage: (tournamentId, swissStage) =>
    set((state) => {
      const existing = state.tournaments[tournamentId];
      if (!existing || !isMultiStageTournament(existing)) return state;

      return {
        tournaments: {
          ...state.tournaments,
          [tournamentId]: { ...existing, swissStage },
        },
      };
    }),

  setTournamentCurrentStage: (tournamentId, stage) =>
    set((state) => {
      const existing = state.tournaments[tournamentId];
      if (!existing || !isMultiStageTournament(existing)) return state;

      return {
        tournaments: {
          ...state.tournaments,
          [tournamentId]: { ...existing, currentStage: stage },
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

  getQualificationsForType: (type) =>
    Object.values(get().qualifications).filter((q) => q.tournamentType === type),

  // Swiss stage selectors
  getSwissStandings: (tournamentId) => {
    const tournament = get().tournaments[tournamentId];
    if (!tournament || !isMultiStageTournament(tournament)) return [];

    // Return sorted standings
    return [...tournament.swissStage.standings].sort((a, b) => {
      // First by wins (descending)
      if (b.wins !== a.wins) return b.wins - a.wins;
      // Then by losses (ascending)
      if (a.losses !== b.losses) return a.losses - b.losses;
      // Then by round diff (descending)
      if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff;
      // Finally by seed (ascending)
      return (a.seed || 999) - (b.seed || 999);
    });
  },

  getCurrentTournamentStage: (tournamentId) => {
    const tournament = get().tournaments[tournamentId];
    if (!tournament || !isMultiStageTournament(tournament)) return null;
    return tournament.currentStage;
  },
});
