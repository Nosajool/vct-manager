// UI Slice - Zustand store slice for UI state management
// Handles selections, navigation, errors, and loading states

import type { StateCreator } from 'zustand';

export type ActiveView =
  | 'today'
  | 'team'
  | 'tournament'
  | 'finances';

export interface SimulationProgress {
  current: number;
  total: number;
  status: string;
  canCancel: boolean;
  type: 'bulk' | 'tournament' | 'calendar' | 'matches';
  details?: {
    tournamentId?: string;
    tournamentName?: string;
    currentMatch?: string;
    totalMatches?: number;
  };
}

export interface BulkSimulationProgress extends SimulationProgress {
  type: 'bulk';
}

export interface UISlice {
  // Selection state
  selectedPlayerId: string | null;
  selectedMatchId: string | null;
  selectedTournamentId: string | null;

  // Navigation
  activeView: ActiveView;

  // Error handling
  error: string | null;

  // Loading states
  isSimulating: boolean;
  bulkSimulation: BulkSimulationProgress | null;
  simulationProgress: SimulationProgress | null;

  // Modal states
  isModalOpen: boolean;
  modalType: string | null;
  modalData: unknown;

  // Selection actions
  setSelectedPlayer: (playerId: string | null) => void;
  setSelectedMatch: (matchId: string | null) => void;
  setSelectedTournament: (tournamentId: string | null) => void;
  clearSelections: () => void;

  // Navigation actions
  setActiveView: (view: ActiveView) => void;

  // Error actions
  setError: (error: string) => void;
  clearError: () => void;

  // Loading actions
  setSimulating: (isSimulating: boolean) => void;
  setBulkSimulation: (progress: BulkSimulationProgress | null) => void;
  updateBulkSimulationProgress: (current: number, status?: string) => void;
  setSimulationProgress: (progress: SimulationProgress | null) => void;
  updateSimulationProgress: (current: number, status?: string) => void;

  // Modal actions
  openModal: (type: string, data?: unknown) => void;
  closeModal: () => void;
}

export const createUISlice: StateCreator<
  UISlice,
  [],
  [],
  UISlice
> = (set) => ({
  // Initial state
  selectedPlayerId: null,
  selectedMatchId: null,
  selectedTournamentId: null,
  activeView: 'today',
  error: null,
  isSimulating: false,
  bulkSimulation: null,
  simulationProgress: null,
  isModalOpen: false,
  modalType: null,
  modalData: null,

  // Selection actions
  setSelectedPlayer: (playerId) =>
    set({ selectedPlayerId: playerId }),

  setSelectedMatch: (matchId) =>
    set({ selectedMatchId: matchId }),

  setSelectedTournament: (tournamentId) =>
    set({ selectedTournamentId: tournamentId }),

  clearSelections: () =>
    set({
      selectedPlayerId: null,
      selectedMatchId: null,
      selectedTournamentId: null,
    }),

  // Navigation actions
  setActiveView: (view) =>
    set({ activeView: view }),

  // Error actions
  setError: (error) =>
    set({ error }),

  clearError: () =>
    set({ error: null }),

  // Loading actions
  setSimulating: (isSimulating) =>
    set({ isSimulating }),

  setBulkSimulation: (progress) =>
    set({ bulkSimulation: progress }),

  updateBulkSimulationProgress: (current, status) =>
    set((state) => {
      if (!state.bulkSimulation) return state;

      return {
        bulkSimulation: {
          ...state.bulkSimulation,
          current,
          ...(status !== undefined ? { status } : {}),
        },
      };
    }),

  setSimulationProgress: (progress) =>
    set({ simulationProgress: progress }),

  updateSimulationProgress: (current, status) =>
    set((state) => {
      if (!state.simulationProgress) return state;

      return {
        simulationProgress: {
          ...state.simulationProgress,
          current,
          ...(status !== undefined ? { status } : {}),
        },
      };
    }),

  // Modal actions
  openModal: (type, data = null) =>
    set({
      isModalOpen: true,
      modalType: type,
      modalData: data,
    }),

  closeModal: () =>
    set({
      isModalOpen: false,
      modalType: null,
      modalData: null,
    }),
});
