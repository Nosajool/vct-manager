// Team Slice - Zustand store slice for team management
// Follows normalized data pattern with entities stored by ID

import type { StateCreator } from 'zustand';
import type {
  Team,
  TeamFinances,
  TeamChemistry,
  MapPoolStrength,
  MapStrength,
  ScrimRelationship,
  MapStrengthAttributes,
} from '../../types';
import { SCRIM_CONSTANTS } from '../../types/scrim';

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

  // Map Pool Management (Phase 6 - Scrim System)
  updateTeamMapPool: (teamId: string, mapPool: MapPoolStrength) => void;
  updateMapStrength: (
    teamId: string,
    mapName: string,
    improvements: Partial<MapStrengthAttributes>
  ) => void;
  applyMapPoolImprovements: (
    teamId: string,
    improvements: Record<string, Partial<MapStrengthAttributes>>,
    currentDate: string
  ) => void;

  // Scrim Relationship Management (Phase 6)
  initializeScrimRelationship: (
    teamId: string,
    partnerTeamId: string,
    partnerTier: 'T1' | 'T2' | 'T3',
    isSameRegion: boolean
  ) => void;
  updateScrimRelationship: (
    teamId: string,
    partnerTeamId: string,
    change: number,
    currentDate: string
  ) => void;
  incrementVodLeakRisk: (teamId: string, partnerTeamId: string) => void;

  // Selectors
  getTeam: (teamId: string) => Team | undefined;
  getPlayerTeam: () => Team | undefined;
  getTeamsByRegion: (region: Team['region']) => Team[];
  getAllTeams: () => Team[];
  getMapPool: (teamId: string) => MapPoolStrength | undefined;
  getScrimRelationship: (
    teamId: string,
    partnerTeamId: string
  ) => ScrimRelationship | undefined;
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Map Pool Management (Phase 6 - Scrim System)
  updateTeamMapPool: (teamId, mapPool) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            mapPool,
          },
        },
      };
    }),

  updateMapStrength: (teamId, mapName, improvements) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team || !team.mapPool) return state;

      const existingMap = team.mapPool.maps[mapName];
      if (!existingMap) return state;

      const newAttributes: MapStrengthAttributes = {
        executes: Math.min(
          SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
          existingMap.attributes.executes + (improvements.executes || 0)
        ),
        retakes: Math.min(
          SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
          existingMap.attributes.retakes + (improvements.retakes || 0)
        ),
        utility: Math.min(
          SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
          existingMap.attributes.utility + (improvements.utility || 0)
        ),
        communication: Math.min(
          SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
          existingMap.attributes.communication + (improvements.communication || 0)
        ),
        mapControl: Math.min(
          SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
          existingMap.attributes.mapControl + (improvements.mapControl || 0)
        ),
        antiStrat: Math.min(
          SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
          existingMap.attributes.antiStrat + (improvements.antiStrat || 0)
        ),
      };

      const updatedMap: MapStrength = {
        ...existingMap,
        attributes: newAttributes,
      };

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            mapPool: {
              ...team.mapPool,
              maps: {
                ...team.mapPool.maps,
                [mapName]: updatedMap,
              },
            },
          },
        },
      };
    }),

  applyMapPoolImprovements: (teamId, improvements, currentDate) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team || !team.mapPool) return state;

      const updatedMaps = { ...team.mapPool.maps };

      for (const [mapName, mapImprovements] of Object.entries(improvements)) {
        const existing = updatedMaps[mapName];
        if (!existing) continue;

        updatedMaps[mapName] = {
          ...existing,
          attributes: {
            executes: Math.min(
              SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
              existing.attributes.executes + (mapImprovements.executes || 0)
            ),
            retakes: Math.min(
              SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
              existing.attributes.retakes + (mapImprovements.retakes || 0)
            ),
            utility: Math.min(
              SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
              existing.attributes.utility + (mapImprovements.utility || 0)
            ),
            communication: Math.min(
              SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
              existing.attributes.communication + (mapImprovements.communication || 0)
            ),
            mapControl: Math.min(
              SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
              existing.attributes.mapControl + (mapImprovements.mapControl || 0)
            ),
            antiStrat: Math.min(
              SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
              existing.attributes.antiStrat + (mapImprovements.antiStrat || 0)
            ),
          },
          lastPracticedDate: currentDate,
          totalPracticeHours: existing.totalPracticeHours + 2,
        };
      }

      // Recalculate strongest and ban priority
      const sortedMaps = Object.entries(updatedMaps).sort((a, b) => {
        const avgA =
          Object.values(a[1].attributes).reduce((s, v) => s + v, 0) / 6;
        const avgB =
          Object.values(b[1].attributes).reduce((s, v) => s + v, 0) / 6;
        return avgB - avgA;
      });

      const strongestMaps = sortedMaps.slice(0, 3).map(([name]) => name);
      const banPriority = sortedMaps.slice(-2).map(([name]) => name);

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            mapPool: {
              maps: updatedMaps,
              strongestMaps,
              banPriority,
            },
          },
        },
      };
    }),

  // Scrim Relationship Management (Phase 6)
  initializeScrimRelationship: (teamId, partnerTeamId, partnerTier, isSameRegion) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      const baseScore = isSameRegion
        ? SCRIM_CONSTANTS.BASE_RELATIONSHIP.SAME_REGION
        : SCRIM_CONSTANTS.BASE_RELATIONSHIP.CROSS_REGION;

      const newRelationship: ScrimRelationship = {
        teamId: partnerTeamId,
        tier: partnerTier,
        relationshipScore: baseScore,
        lastScrimDate: null,
        totalScrims: 0,
        vodLeakRisk: 0,
      };

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            scrimRelationships: {
              ...team.scrimRelationships,
              [partnerTeamId]: newRelationship,
            },
          },
        },
      };
    }),

  updateScrimRelationship: (teamId, partnerTeamId, change, currentDate) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      const existing = team.scrimRelationships?.[partnerTeamId];
      if (!existing) return state;

      const newScore = Math.max(0, Math.min(100, existing.relationshipScore + change));

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            scrimRelationships: {
              ...team.scrimRelationships,
              [partnerTeamId]: {
                ...existing,
                relationshipScore: newScore,
                totalScrims: existing.totalScrims + 1,
                lastScrimDate: currentDate,
              },
            },
          },
        },
      };
    }),

  incrementVodLeakRisk: (teamId, partnerTeamId) =>
    set((state) => {
      const team = state.teams[teamId];
      if (!team) return state;

      const existing = team.scrimRelationships?.[partnerTeamId];
      if (!existing) return state;

      // Risk increases by 2-5% per scrim
      const increase = 2 + Math.random() * 3;

      return {
        teams: {
          ...state.teams,
          [teamId]: {
            ...team,
            scrimRelationships: {
              ...team.scrimRelationships,
              [partnerTeamId]: {
                ...existing,
                vodLeakRisk: Math.min(100, existing.vodLeakRisk + increase),
              },
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

  getMapPool: (teamId) => get().teams[teamId]?.mapPool,

  getScrimRelationship: (teamId, partnerTeamId) =>
    get().teams[teamId]?.scrimRelationships?.[partnerTeamId],
});
