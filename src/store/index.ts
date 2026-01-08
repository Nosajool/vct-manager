import { create } from 'zustand';

// Placeholder store - will be expanded with slices
interface GameState {
  // Game metadata
  initialized: boolean;

  // Actions
  setInitialized: (value: boolean) => void;
}

export const useGameStore = create<GameState>()((set) => ({
  initialized: false,
  setInitialized: (value) => set({ initialized: value }),
}));
