// Narrative Collection Slice
// Tracks which drama/interview templates have been seen globally, persisting
// across new-game resets (stored in localStorage independently of save files).

import type { StateCreator } from 'zustand';

const STORAGE_KEY = 'vct-narrative-collection';

interface PersistedCollection {
  seenTemplateIds: string[];
  resetCount: number;
  lastResetDate?: string;
}

function loadFromStorage(): PersistedCollection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedCollection>;
      return {
        seenTemplateIds: Array.isArray(parsed.seenTemplateIds) ? parsed.seenTemplateIds : [],
        resetCount: typeof parsed.resetCount === 'number' ? parsed.resetCount : 0,
        lastResetDate: parsed.lastResetDate,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { seenTemplateIds: [], resetCount: 0 };
}

function saveToStorage(data: PersistedCollection): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors (e.g. private browsing)
  }
}

export interface NarrativeCollectionSlice {
  // State
  seenTemplateIds: string[];
  collectionResetCount: number;
  collectionLastResetDate?: string;

  // Actions
  markTemplateSeen: (templateId: string) => void;
  isTemplateSeen: (templateId: string) => boolean;
  resetCollection: (currentDate: string) => void;
}

export const createNarrativeCollectionSlice: StateCreator<
  NarrativeCollectionSlice,
  [],
  [],
  NarrativeCollectionSlice
> = (set, get) => {
  // Load initial state from localStorage
  const persisted = loadFromStorage();

  return {
    seenTemplateIds: persisted.seenTemplateIds,
    collectionResetCount: persisted.resetCount,
    collectionLastResetDate: persisted.lastResetDate,

    markTemplateSeen: (templateId) => {
      const current = get().seenTemplateIds;
      if (current.includes(templateId)) return; // already seen

      const updated = [...current, templateId];
      set({ seenTemplateIds: updated });
      saveToStorage({
        seenTemplateIds: updated,
        resetCount: get().collectionResetCount,
        lastResetDate: get().collectionLastResetDate,
      });
    },

    isTemplateSeen: (templateId) => get().seenTemplateIds.includes(templateId),

    resetCollection: (currentDate) => {
      const newResetCount = get().collectionResetCount + 1;
      const newState = {
        seenTemplateIds: [],
        collectionResetCount: newResetCount,
        collectionLastResetDate: currentDate,
      };
      set(newState);
      saveToStorage({
        seenTemplateIds: [],
        resetCount: newResetCount,
        lastResetDate: currentDate,
      });
    },
  };
};
