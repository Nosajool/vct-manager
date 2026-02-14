// useActivityModals - Centralized modal state management for training/scrim activities
//
// Extracts duplicated modal state logic from ObjectivesPanel and WeekPlannerPanel.
// Provides methods to open training/scrim modals and track selected event IDs.

import { useState } from 'react';

export interface ActivityModalsState {
  selectedTrainingEventId: string | null;
  selectedScrimEventId: string | null;
  openTrainingModal: (eventId: string) => void;
  openScrimModal: (eventId: string) => void;
  closeTrainingModal: () => void;
  closeScrimModal: () => void;
}

/**
 * Hook to manage training/scrim modal state
 *
 * @returns State and methods for opening/closing activity modals
 *
 * @example
 * ```tsx
 * const modals = useActivityModals();
 *
 * // Open training modal
 * <button onClick={() => modals.openTrainingModal(eventId)}>
 *   Configure Training
 * </button>
 *
 * // Render modals
 * <ActivityModals {...modals} />
 * ```
 */
export function useActivityModals(): ActivityModalsState {
  const [selectedTrainingEventId, setSelectedTrainingEventId] = useState<string | null>(null);
  const [selectedScrimEventId, setSelectedScrimEventId] = useState<string | null>(null);

  const openTrainingModal = (eventId: string) => {
    setSelectedTrainingEventId(eventId);
  };

  const openScrimModal = (eventId: string) => {
    setSelectedScrimEventId(eventId);
  };

  const closeTrainingModal = () => {
    setSelectedTrainingEventId(null);
  };

  const closeScrimModal = () => {
    setSelectedScrimEventId(null);
  };

  return {
    selectedTrainingEventId,
    selectedScrimEventId,
    openTrainingModal,
    openScrimModal,
    closeTrainingModal,
    closeScrimModal,
  };
}
