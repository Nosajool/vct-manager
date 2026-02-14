// ActivityModals - Centralized modal rendering for training/scrim activities
//
// Replaces duplicated modal rendering logic from ObjectivesPanel and WeekPlannerPanel.
// Renders TrainingModal and ScrimModal based on the state from useActivityModals hook.

import { useGameStore } from '../../store';
import { TrainingModal } from '../calendar';
import { ScrimModal } from '../scrim';
import type { ActivityModalsState } from '../../hooks/useActivityModals';

export interface ActivityModalsProps extends ActivityModalsState {}

/**
 * Component that renders training and scrim modals
 *
 * @param props - Modal state from useActivityModals hook
 *
 * @example
 * ```tsx
 * const modals = useActivityModals();
 *
 * return (
 *   <>
 *     <YourContent onOpenTraining={modals.openTrainingModal} />
 *     <ActivityModals {...modals} />
 *   </>
 * );
 * ```
 */
export function ActivityModals({
  selectedTrainingEventId,
  selectedScrimEventId,
  closeTrainingModal,
  closeScrimModal,
}: ActivityModalsProps) {
  const getActivityConfig = useGameStore((state) => state.getActivityConfig);

  return (
    <>
      {/* Training Modal */}
      {selectedTrainingEventId && (() => {
        const config = getActivityConfig(selectedTrainingEventId);
        return (
          <TrainingModal
            isOpen={selectedTrainingEventId !== null}
            onClose={closeTrainingModal}
            eventId={selectedTrainingEventId}
            existingConfig={config?.type === 'training' ? config : undefined}
          />
        );
      })()}

      {/* Scrim Modal */}
      {selectedScrimEventId && (() => {
        const config = getActivityConfig(selectedScrimEventId);
        return (
          <ScrimModal
            isOpen={selectedScrimEventId !== null}
            onClose={closeScrimModal}
            eventId={selectedScrimEventId}
            existingConfig={config?.type === 'scrim' ? config : undefined}
          />
        );
      })()}
    </>
  );
}
