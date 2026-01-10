// Scrim Slice - Zustand store slice for scrim management
// Handles T2/T3 tier teams and scrim history

import type { StateCreator } from 'zustand';
import type { TierTeam, ScrimResult, Region } from '../../types';

export interface ScrimSlice {
  // T2/T3 team entities
  tierTeams: Record<string, TierTeam>;

  // Scrim history (last 50)
  scrimHistory: ScrimResult[];

  // Actions
  addTierTeam: (team: TierTeam) => void;
  addTierTeams: (teams: TierTeam[]) => void;
  updateTierTeam: (teamId: string, updates: Partial<TierTeam>) => void;
  removeTierTeam: (teamId: string) => void;

  // Scrim history
  addScrimResult: (result: ScrimResult) => void;
  clearScrimHistory: () => void;

  // Selectors
  getTierTeam: (teamId: string) => TierTeam | undefined;
  getTierTeamsByRegion: (region: Region) => TierTeam[];
  getTierTeamsByTier: (tier: 'T2' | 'T3') => TierTeam[];
  getScrimHistory: (limit?: number) => ScrimResult[];
  getScrimHistoryWithPartner: (partnerTeamId: string) => ScrimResult[];
  getRecentScrimMaps: (days?: number) => string[];
}

export const createScrimSlice: StateCreator<ScrimSlice, [], [], ScrimSlice> = (
  set,
  get
) => ({
  // Initial state
  tierTeams: {},
  scrimHistory: [],

  // Actions
  addTierTeam: (team) =>
    set((state) => ({
      tierTeams: { ...state.tierTeams, [team.id]: team },
    })),

  addTierTeams: (teams) =>
    set((state) => ({
      tierTeams: {
        ...state.tierTeams,
        ...Object.fromEntries(teams.map((t) => [t.id, t])),
      },
    })),

  updateTierTeam: (teamId, updates) =>
    set((state) => {
      const existing = state.tierTeams[teamId];
      if (!existing) return state;

      return {
        tierTeams: {
          ...state.tierTeams,
          [teamId]: { ...existing, ...updates },
        },
      };
    }),

  removeTierTeam: (teamId) =>
    set((state) => {
      const { [teamId]: removed, ...remaining } = state.tierTeams;
      return { tierTeams: remaining };
    }),

  // Scrim history
  addScrimResult: (result) =>
    set((state) => ({
      // Keep only last 50 scrims
      scrimHistory: [...state.scrimHistory, result].slice(-50),
    })),

  clearScrimHistory: () =>
    set({ scrimHistory: [] }),

  // Selectors
  getTierTeam: (teamId) => get().tierTeams[teamId],

  getTierTeamsByRegion: (region) =>
    Object.values(get().tierTeams).filter((team) => team.region === region),

  getTierTeamsByTier: (tier) =>
    Object.values(get().tierTeams).filter((team) => team.tier === tier),

  getScrimHistory: (limit) => {
    const history = get().scrimHistory;
    return limit ? history.slice(-limit) : history;
  },

  getScrimHistoryWithPartner: (partnerTeamId) =>
    get().scrimHistory.filter((s) => s.partnerTeamId === partnerTeamId),

  getRecentScrimMaps: (days = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffString = cutoffDate.toISOString();

    const recentScrims = get().scrimHistory.filter(
      (s) => s.date >= cutoffString
    );

    // Get unique maps from recent scrims
    const maps = new Set<string>();
    for (const scrim of recentScrims) {
      for (const map of scrim.maps) {
        maps.add(map.map);
      }
    }

    return Array.from(maps);
  },
});
