// TimeBar Component - Global time control bar
//
// Single unified interface for all time advancement in the game.
// Appears on all pages. Every match simulation goes through here.
//
// Game loop flow:
// 1. User starts at beginning of Day X
// 2. User does activities (training, roster changes, etc.) on any page
// 3. User clicks button in TimeBar
// 4. TODAY's events (Day X) are simulated (including matches)
// 5. SimulationResultsModal shows what happened
// 6. User is now at beginning of Day X+1

import { useState } from 'react';
import { calendarService, type TimeAdvanceResult } from '../../services';
import { useGameStore } from '../../store';
import { timeProgression } from '../../engine/calendar';
import { useMatchDay } from '../../hooks';
import { SimulationResultsModal, DayRecapModal } from '../calendar';
import { QualificationModal, type QualificationModalData } from '../tournament/QualificationModal';
import { MastersCompletionModal, type MastersCompletionModalData } from '../tournament/MastersCompletionModal';
import { StageCompletionModal, type StageCompletionModalData } from '../tournament/StageCompletionModal';
import { UnlockNotification } from '../today/UnlockNotification';
import type { FeatureUnlock } from '../../data/featureUnlocks';

export function TimeBar() {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [simulationResult, setSimulationResult] = useState<TimeAdvanceResult | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showDayRecapModal, setShowDayRecapModal] = useState(false);
  const [unlockedFeatures, setUnlockedFeatures] = useState<FeatureUnlock[]>([]);

  const calendar = useGameStore((state) => state.calendar);
  const gameStarted = useGameStore((state) => state.gameStarted);

  // Modal state from UISlice
  const isModalOpen = useGameStore((state) => state.isModalOpen);
  const modalType = useGameStore((state) => state.modalType);
  const modalData = useGameStore((state) => state.modalData);
  const closeModal = useGameStore((state) => state.closeModal);

  // Use centralized match day detection
  const { isMatchDay: hasMatchToday, opponentName } = useMatchDay();

  // Don't show if game hasn't started
  if (!gameStarted) {
    return null;
  }

  const handleTimeAdvance = (advanceFn: () => TimeAdvanceResult) => {
    setIsAdvancing(true);
    try {
      const result = advanceFn();

      // Show newly unlocked features
      if (result.newlyUnlockedFeatures.length > 0) {
        setUnlockedFeatures(result.newlyUnlockedFeatures);
      }

      // Show results modal if matches were simulated
      if (result.simulatedMatches.length > 0) {
        setSimulationResult(result);
        setShowResultsModal(true);
      } else {
        // Show day recap for non-match days
        setSimulationResult(result);
        setShowDayRecapModal(true);
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAdvanceDay = () => {
    handleTimeAdvance(() => calendarService.advanceDay());
  };

  const handleCloseModal = () => {
    setShowResultsModal(false);
    setSimulationResult(null);
  };

  const handleCloseDayRecap = () => {
    setShowDayRecapModal(false);
    setSimulationResult(null);
  };

  const handleDismissUnlock = (index: number) => {
    setUnlockedFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  // Format date for display
  const formattedDate = timeProgression.formatDate(calendar.currentDate);

  // Format phase for display
  const phaseDisplayMap: Record<string, string> = {
    offseason: 'Offseason',
    kickoff: 'Kickoff',
    stage1: 'Stage 1',
    stage1_playoffs: 'Stage 1 Playoffs',
    stage2: 'Stage 2',
    stage2_playoffs: 'Stage 2 Playoffs',
    masters1: 'Masters Santiago',
    masters2: 'Masters London',
    champions: 'Champions',
  };
  const phaseDisplay = phaseDisplayMap[calendar.currentPhase] || calendar.currentPhase;

  return (
    <>
      <div className="bg-vct-darker border-b border-vct-gray/20">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Left: Date and Phase Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-vct-gray text-sm">Date:</span>
                <span className="text-vct-light font-medium">{formattedDate}</span>
              </div>
              <div className="h-4 w-px bg-vct-gray/30" />
              <div className="flex items-center gap-2">
                <span className="text-vct-gray text-sm">Phase:</span>
                <span className="text-vct-light font-medium">{phaseDisplay}</span>
              </div>
              {hasMatchToday && (
                <>
                  <div className="h-4 w-px bg-vct-gray/30" />
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-vct-red/20 text-vct-red text-xs font-semibold rounded uppercase">
                      Match Today
                    </span>
                    <span className="text-vct-light text-sm">vs {opponentName}</span>
                  </div>
                </>
              )}
            </div>

            {/* Right: Time Control Buttons */}
            <div className="flex items-center gap-2">
              {/* Advance Day */}
              <button
                onClick={handleAdvanceDay}
                disabled={isAdvancing}
                className={`px-4 py-1.5 text-sm font-medium rounded transition-colors disabled:opacity-50 ${
                  hasMatchToday
                    ? 'bg-vct-red hover:bg-vct-red/80 text-white'
                    : 'bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light'
                }`}
              >
                {hasMatchToday ? 'Play Match' : 'Advance Day'}
              </button>

              {/* Loading indicator */}
              {isAdvancing && (
                <span className="text-vct-gray text-sm ml-2">Processing...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Results Modal */}
      <SimulationResultsModal
        isOpen={showResultsModal}
        onClose={handleCloseModal}
        result={simulationResult}
      />

      {/* Day Recap Modal - shown on non-match days */}
      <DayRecapModal
        isOpen={showDayRecapModal}
        onClose={handleCloseDayRecap}
        result={simulationResult}
      />

      {/* Qualification Modal - triggered by TournamentService after Kickoff completion */}
      {isModalOpen && modalType === 'qualification' && (
        <QualificationModal
          data={modalData as QualificationModalData}
          onClose={closeModal}
        />
      )}

      {/* Masters Completion Modal - triggered by TournamentService after Masters/Champions completion */}
      {isModalOpen && modalType === 'masters_completion' && (
        <MastersCompletionModal
          data={modalData as MastersCompletionModalData}
          onClose={closeModal}
        />
      )}

      {/* Stage Completion Modal - triggered by TournamentService after Stage 1/2 league completion */}
      {isModalOpen && modalType === 'stage_completion' && (
        <StageCompletionModal
          data={modalData as StageCompletionModalData}
          onClose={closeModal}
        />
      )}

      {/* Unlock Notifications - show newly unlocked features */}
      {unlockedFeatures.map((unlock, index) => (
        <UnlockNotification
          key={`${unlock.feature}-${index}`}
          feature={unlock.feature}
          description={unlock.description}
          onDismiss={() => handleDismissUnlock(index)}
        />
      ))}
    </>
  );
}
