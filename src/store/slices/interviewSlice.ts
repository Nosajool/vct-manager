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
  interviewQueue: PendingInterview[];
  pendingDramaBoost: number;      // accumulated dramaChance from interview choices
  interviewHistory: InterviewHistoryEntry[];

  // Actions
  setPendingInterview: (interview: PendingInterview | null) => void;
  clearPendingInterview: () => void;
  setInterviewQueue: (queue: PendingInterview[]) => void;
  shiftInterviewQueue: () => PendingInterview | undefined;
  clearInterviewQueue: () => void;
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
  interviewQueue: [],
  pendingDramaBoost: 0,
  interviewHistory: [],

  // Backward-compat shim: wraps single interview as a 1-item queue
  setPendingInterview: (interview) => {
    const queue = interview ? [interview] : [];
    set({ interviewQueue: queue, pendingInterview: queue[0] ?? null });
  },

  // Backward-compat shim: clears the queue
  clearPendingInterview: () =>
    set({ interviewQueue: [], pendingInterview: null }),

  setInterviewQueue: (queue) =>
    set({ interviewQueue: queue, pendingInterview: queue[0] ?? null }),

  shiftInterviewQueue: () => {
    const [first, ...rest] = get().interviewQueue;
    set({ interviewQueue: rest, pendingInterview: rest[0] ?? null });
    return first;
  },

  clearInterviewQueue: () =>
    set({ interviewQueue: [], pendingInterview: null }),

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
