// useActivityModals - Centralized modal state management for training/scrim activities
//
// Extracts duplicated modal state logic from ObjectivesPanel and WeekPlannerPanel.
// Provides methods to open training/scrim modals and track selected event IDs.

import { useState } from 'react';

export interface ActivityModalsState {
  selectedTrainingEventId: string | null;
  selectedScrimEventId: string | null;
  selectedWatchPartyEventId: string | null;
  selectedRegionalBootcampEventId: string | null;
  openTrainingModal: (eventId: string) => void;
  openScrimModal: (eventId: string) => void;
  openWatchPartyModal: (eventId: string) => void;
  openRegionalBootcampModal: (eventId: string) => void;
  closeTrainingModal: () => void;
  closeScrimModal: () => void;
  closeWatchPartyModal: () => void;
  closeRegionalBootcampModal: () => void;
}

/**
 * Hook to manage training/scrim/watch-party modal state
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
  const [selectedWatchPartyEventId, setSelectedWatchPartyEventId] = useState<string | null>(null);
  const [selectedRegionalBootcampEventId, setSelectedRegionalBootcampEventId] = useState<string | null>(null);

  const openTrainingModal = (eventId: string) => {
    setSelectedTrainingEventId(eventId);
  };

  const openScrimModal = (eventId: string) => {
    setSelectedScrimEventId(eventId);
  };

  const openWatchPartyModal = (eventId: string) => {
    setSelectedWatchPartyEventId(eventId);
  };

  const openRegionalBootcampModal = (eventId: string) => {
    setSelectedRegionalBootcampEventId(eventId);
  };

  const closeTrainingModal = () => {
    setSelectedTrainingEventId(null);
  };

  const closeScrimModal = () => {
    setSelectedScrimEventId(null);
  };

  const closeWatchPartyModal = () => {
    setSelectedWatchPartyEventId(null);
  };

  const closeRegionalBootcampModal = () => {
    setSelectedRegionalBootcampEventId(null);
  };

  return {
    selectedTrainingEventId,
    selectedScrimEventId,
    selectedWatchPartyEventId,
    selectedRegionalBootcampEventId,
    openTrainingModal,
    openScrimModal,
    openWatchPartyModal,
    openRegionalBootcampModal,
    closeTrainingModal,
    closeScrimModal,
    closeWatchPartyModal,
    closeRegionalBootcampModal,
  };
}
