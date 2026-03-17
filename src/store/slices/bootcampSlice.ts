import type { StateCreator } from 'zustand';
import type { BootcampRegion } from '../../types/activityPlan';

export type BootcampStatus = 'active' | 'completed' | 'cancelled';

export interface BootcampConfig {
  id: string;
  region: BootcampRegion;
  startDate: string;            // ISO date string
  endDate: string;              // ISO date string (startDate + 6 days)
  currentDay: number;           // 1-7, incremented on each day advance
  status: BootcampStatus;
  linkedEventIds: string[];     // IDs of the 7 team_activity CalendarEvents
  cumulativeStatGains: Record<string, number>;  // playerId -> cumulative gain (for display)
  dailyMoraleChanges: number[]; // one entry per completed day (for audit/display)
}

export interface BootcampSlice {
  activeBootcamp: BootcampConfig | null;
  bootcampHistory: BootcampConfig[];

  // Actions
  setActiveBootcamp: (bootcamp: BootcampConfig) => void;
  updateActiveBootcamp: (updates: Partial<BootcampConfig>) => void;
  finalizeBootcamp: (status: 'completed' | 'cancelled') => void;
}

export const createBootcampSlice: StateCreator<
  BootcampSlice,
  [],
  [],
  BootcampSlice
> = (set) => ({
  activeBootcamp: null,
  bootcampHistory: [],

  setActiveBootcamp: (bootcamp) =>
    set({ activeBootcamp: bootcamp }),

  updateActiveBootcamp: (updates) =>
    set((state) => ({
      activeBootcamp: state.activeBootcamp
        ? { ...state.activeBootcamp, ...updates }
        : null,
    })),

  finalizeBootcamp: (status) =>
    set((state) => {
      if (!state.activeBootcamp) return state;
      const finalized: BootcampConfig = { ...state.activeBootcamp, status };
      return {
        activeBootcamp: null,
        bootcampHistory: [...state.bootcampHistory, finalized],
      };
    }),
});
