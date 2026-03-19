// Interview Slice - Zustand store slice for interview state management
// Part of the narrative layer (System 2: Interview System)

import type { StateCreator } from 'zustand';
import type {
  PendingInterview,
  InterviewHistoryEntry,
  InterviewTone,
  ManagerArchetype,
  ManagerProfile,
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
    set((state) => {
      const updated = [...state.interviewHistory, entry];
      return { interviewHistory: updated.slice(-100) };
    }),
});

// ============================================================================
// Manager Identity Selector
// Derives archetype from interview history — no new store state required
// ============================================================================

export function selectManagerProfile(history: InterviewHistoryEntry[]): ManagerProfile {
  const toneBreakdown: Partial<Record<InterviewTone, number>> = {};

  if (history.length < 5) {
    return { archetype: null, archetypeStrength: 0, toneBreakdown };
  }

  const counts: Partial<Record<InterviewTone, number>> = {};
  for (const entry of history) {
    counts[entry.chosenTone] = (counts[entry.chosenTone] ?? 0) + 1;
  }

  const total = history.length;
  for (const [tone, count] of Object.entries(counts) as [InterviewTone, number][]) {
    toneBreakdown[tone] = Math.round((count / total) * 100);
  }

  const pct = (tones: InterviewTone[]): number =>
    tones.reduce((sum, t) => sum + (toneBreakdown[t] ?? 0), 0);

  const hypePct = pct(['CONFIDENT', 'TRASH_TALK', 'AGGRESSIVE']);
  const teamPct = pct(['RESPECTFUL', 'BLAME_SELF']);
  const mavPct = pct(['TRASH_TALK', 'AGGRESSIVE', 'BLAME_TEAM']);
  const humblePct = pct(['HUMBLE']);
  const analystPct = pct(['DEFLECTIVE']);

  let archetype: ManagerArchetype = null;
  let dominantPct = 0;

  if (hypePct >= 50) {
    archetype = 'HYPE_MACHINE';
    dominantPct = hypePct;
  } else if (teamPct >= 40) {
    archetype = 'TEAM_BUILDER';
    dominantPct = teamPct;
  } else if (mavPct >= 40) {
    archetype = 'MAVERICK';
    dominantPct = mavPct;
  } else if (humblePct >= 35) {
    archetype = 'HUMBLE_GRINDER';
    dominantPct = humblePct;
  } else if (analystPct >= 30) {
    archetype = 'ANALYST';
    dominantPct = analystPct;
  }

  return { archetype, archetypeStrength: dominantPct, toneBreakdown };
}

// Re-export types for convenience
export type { ManagerProfile, ManagerArchetype };
