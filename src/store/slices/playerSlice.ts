// Player Slice - Zustand store slice for player management
// Follows normalized data pattern with entities stored by ID

import type { StateCreator } from 'zustand';
import type { Player } from '../../types';

export interface PlayerSlice {
  // Normalized player entities
  players: Record<string, Player>;

  // Actions
  addPlayer: (player: Player) => void;
  addPlayers: (players: Player[]) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  removePlayer: (playerId: string) => void;

  // Free agent interest actions
  setFreeAgentInterest: (playerId: string, teamId: string, score: number) => void;
  setOfferCooldown: (playerId: string, teamId: string, expiresDate: string) => void;
  clearFreeAgentData: (playerId: string, teamId: string) => void;

  // Selectors (return functions to be used with getState())
  getPlayer: (playerId: string) => Player | undefined;
  getFreeAgents: () => Player[];
  getPlayersByTeam: (teamId: string) => Player[];
  getPlayersByRegion: (region: Player['region']) => Player[];
}

export const createPlayerSlice: StateCreator<
  PlayerSlice,
  [],
  [],
  PlayerSlice
> = (set, get) => ({
  // Initial state
  players: {},

  // Actions
  addPlayer: (player) =>
    set((state) => ({
      players: { ...state.players, [player.id]: player },
    })),

  addPlayers: (players) =>
    set((state) => ({
      players: {
        ...state.players,
        ...Object.fromEntries(players.map((p) => [p.id, p])),
      },
    })),

  updatePlayer: (playerId, updates) =>
    set((state) => {
      const existing = state.players[playerId];
      if (!existing) return state;

      return {
        players: {
          ...state.players,
          [playerId]: { ...existing, ...updates },
        },
      };
    }),

  removePlayer: (playerId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [playerId]: removed, ...remaining } = state.players;
      return { players: remaining };
    }),

  setFreeAgentInterest: (playerId, teamId, score) =>
    set((state) => {
      const existing = state.players[playerId];
      if (!existing) return state;
      return {
        players: {
          ...state.players,
          [playerId]: {
            ...existing,
            teamInterests: {
              ...existing.teamInterests,
              [teamId]: score,
            },
          },
        },
      };
    }),

  setOfferCooldown: (playerId, teamId, expiresDate) =>
    set((state) => {
      const existing = state.players[playerId];
      if (!existing) return state;
      return {
        players: {
          ...state.players,
          [playerId]: {
            ...existing,
            offerCooldowns: {
              ...existing.offerCooldowns,
              [teamId]: expiresDate,
            },
          },
        },
      };
    }),

  clearFreeAgentData: (playerId, teamId) =>
    set((state) => {
      const existing = state.players[playerId];
      if (!existing) return state;
      const teamInterests = { ...existing.teamInterests };
      delete teamInterests[teamId];
      const offerCooldowns = { ...existing.offerCooldowns };
      delete offerCooldowns[teamId];
      return {
        players: {
          ...state.players,
          [playerId]: {
            ...existing,
            teamInterests,
            offerCooldowns,
          },
        },
      };
    }),

  // Selectors
  getPlayer: (playerId) => get().players[playerId],

  getFreeAgents: () =>
    Object.values(get().players).filter((player) => player.teamId === null),

  getPlayersByTeam: (teamId) =>
    Object.values(get().players).filter((player) => player.teamId === teamId),

  getPlayersByRegion: (region) =>
    Object.values(get().players).filter((player) => player.region === region),
});
