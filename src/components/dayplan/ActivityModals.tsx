// ActivityModals - Centralized modal rendering for training/scrim/downtime activities
//
// Replaces duplicated modal rendering logic from ObjectivesPanel and WeekPlannerPanel.
// Renders TrainingModal, ScrimModal, and WatchPartyModal based on the state from useActivityModals hook.

import { useGameStore } from '../../store';
import { TrainingModal } from '../calendar';
import { ScrimModal } from '../scrim';
import { WatchPartyModal } from '../today/WatchPartyModal';
import { RegionalBootcampModal } from '../today/RegionalBootcampModal';
import type { ActivityModalsState } from '../../hooks/useActivityModals';

export interface ActivityModalsProps extends ActivityModalsState {}

/**
 * Component that renders training, scrim, and downtime modals
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
  selectedWatchPartyEventId,
  selectedRegionalBootcampEventId,
  closeTrainingModal,
  closeScrimModal,
  closeWatchPartyModal,
  closeRegionalBootcampModal,
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

      {/* Watch Party Modal */}
      {selectedWatchPartyEventId && (
        <WatchPartyModal
          isOpen={true}
          eventId={selectedWatchPartyEventId}
          onClose={closeWatchPartyModal}
        />
      )}

      {/* Regional Bootcamp Modal */}
      {selectedRegionalBootcampEventId && (
        <RegionalBootcampModal
          isOpen={true}
          eventId={selectedRegionalBootcampEventId}
          onClose={closeRegionalBootcampModal}
        />
      )}
    </>
  );
}
