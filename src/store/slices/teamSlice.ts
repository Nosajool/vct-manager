// Team Slice - Zustand store slice for team management
// Follows normalized data pattern with entities stored by ID

import type { StateCreator } from 'zustand';
import type { Team, TeamFinances, TeamChemistry } from '../../types';

export interface TeamSlice {
  // Normalized team entities
  teams: Record<string, Team>;

  // Player's controlled team ID
  playerTeamId: string | null;

  // Actions
  addTeam: (team: Team) => void;
  addTeams: (teams: Team[]) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  removeTeam: (teamId: string) => void;
  setPlayerTeam: (teamId: string) => void;

  // Roster management
  addPlayerToTeam: (teamId: string, playerId: string) => void;
  removePlayerFromTeam: (teamId: string, playerId: string) => void;
  addPlayerToReserve: (teamId: string, playerId: string) => void;
  movePlayerToActive: (teamId: string, playerId: string) => void;

  // Finance updates
  updateTeamFinances: (teamId: string, finances: Partial<TeamFinances>) => void;
  updateTeamBalance: (teamId: string, amount: number) => void;

  // Chemistry updates
  updateTeamChemistry: (teamId: string, chemistry: TeamChemistry) => void;

  // Standings updates
  recordWin: (teamId: string, roundDiff: number) => void;
  recordLoss: (teamId: string, roundDiff: number) => void;

  // Selectors
  getTeam: (teamId: string) => Team | undefined;
  getPlayerTeam: () => Team | undefined;
  getTeamsByRegion: (region: Team['region']) => Team[];
  getAllTeams: () => Team[];
}

export const createTeamSlice: StateCreator<
  TeamSlice,
  [],
  [],
  TeamSlice
> = (set, get) => ({
  // Initial state
  teams: {},
  playerTeamId: null,

  // Actions
  addTeam: (team) =>
    set((state) => ({
      teams: { ...state.teams, [team.id]: team },
    })),

  addTeams: (teams) =>
    set((state) => ({
      teams: {
        ...state.teams,
        ...Object.fromEntries(teams.map((t) => [t.id, t])),
      },
    })),

  updateTeam: (teamId, updates) =>
    set((state) => {
      const existing = state.teams[teamId];
      if (!existing) return state;

      return {
        teams: {
          ...state.teams,
          [teamId]: { ...existing, ...updates },
        },
      };
    }),

  removeTeam: (teamId) =>
    set((state) => {
      const { [teamId]: removed, ...remaining } = state.teams;
      return { teams: remaining };
    }),

  setPlayerTeam: (teamId) =>
    set({ playerTeamId: teamId }),

  // Roster management
  addPlayerToTeam: (teamId, playerId) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      // Don't add if already on roster
      if (team.playerIds.includes(playerId)) return state;

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            playerIds: [...team.playerIds, playerId],
          },
        },
      };
    }),

  removePlayerFromTeam: (teamId, playerId) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            playerIds: team.playerIds.filter((id) => id !== playerId),
            reservePlayerIds: team.reservePlayerIds.filter((id) => id !== playerId),
          },
        },
      };
    }),

  addPlayerToReserve: (teamId, playerId) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      if (team.reservePlayerIds.includes(playerId)) return state;

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            reservePlayerIds: [...team.reservePlayerIds, playerId],
          },
        },
      };
    }),

  movePlayerToActive: (teamId, playerId) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      // Remove from reserve, add to active
      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            playerIds: [...team.playerIds, playerId],
            reservePlayerIds: team.reservePlayerIds.filter((id) => id !== playerId),
          },
        },
      };
    }),

  // Finance updates
  updateTeamFinances: (teamId, finances) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            finances: { ...team.finances, ...finances },
          },
        },
      };
    }),

  updateTeamBalance: (teamId, amount) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            finances: {
              ...team.finances,
              balance: team.finances.balance + amount,
            },
          },
        },
      };
    }),

  // Chemistry updates
  updateTeamChemistry: (teamId, chemistry) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            chemistry,
          },
        },
      };
    }),

  // Standings updates
  recordWin: (teamId, roundDiff) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      const currentStreak = team.standings.currentStreak;
      const newStreak = currentStreak >= 0 ? currentStreak + 1 : 1;

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            standings: {
              ...team.standings,
              wins: team.standings.wins + 1,
              roundDiff: team.standings.roundDiff + roundDiff,
              currentStreak: newStreak,
            },
          },
        },
      };
    }),

  recordLoss: (teamId, roundDiff) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      const currentStreak = team.standings.currentStreak;
      const newStreak = currentStreak <= 0 ? currentStreak - 1 : -1;

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            standings: {
              ...team.standings,
              losses: team.standings.losses + 1,
              roundDiff: team.standings.roundDiff - roundDiff,
              currentStreak: newStreak,
            },
          },
        },
      };
    }),

  // Selectors
  getTeam: (teamId) => get().teams[teamId],

  getPlayerTeam: () => {
    const { playerTeamId, teams } = get();
    return playerTeamId ? teams[playerTeamId] : undefined;
  },

  getTeamsByRegion: (region) =>
    Object.values(get().teams).filter((team) => team.region === region),

  getAllTeams: () => Object.values(get().teams),
});
