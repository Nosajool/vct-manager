// Interview Slice - Zustand store slice for interview state management
// Part of the narrative layer (System 2: Interview System)

import type { StateCreator } from 'zustand';
import type {
  PendingInterview,
  InterviewHistoryEntry,
} from '../../types/interview';

export interface InterviewSlice {
  // State
  pendingInterview: PendingInterview | null;
  pendingDramaBoost: number;      // accumulated dramaChance from interview choices
  interviewHistory: InterviewHistoryEntry[];

  // Actions
  setPendingInterview: (interview: PendingInterview | null) => void;
  clearPendingInterview: () => void;
  consumeDramaBoost: () => number; // returns the boost value and resets to 0
  addInterviewHistory: (entry: InterviewHistoryEntry) => void;
}

export const createInterviewSlice: StateCreator<
  InterviewSlice,
  [],
  [],
  InterviewSlice
> = (set, get) => ({
  pendingInterview: null,
  pendingDramaBoost: 0,
  interviewHistory: [],

  setPendingInterview: (interview) =>
    set({ pendingInterview: interview }),

  clearPendingInterview: () =>
    set({ pendingInterview: null }),

  consumeDramaBoost: () => {
    const boost = get().pendingDramaBoost;
    set({ pendingDramaBoost: 0 });
    return boost;
  },

  addInterviewHistory: (entry) =>
    set((state) => ({
      interviewHistory: [...state.interviewHistory, entry],
    })),
});
