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

import { useState, useMemo } from 'react';
import { calendarService, type TimeAdvanceResult } from '../../services';
import { useGameStore } from '../../store';
import { timeProgression } from '../../engine/calendar';
import { useMatchDay } from '../../hooks';
import { SimulationResultsModal, DayRecapModal, SimulationProgressModal } from '../calendar';
import { progressTrackingService } from '../../services';
import { QualificationModal, type QualificationModalData } from '../tournament/QualificationModal';
import { MastersCompletionModal, type MastersCompletionModalData } from '../tournament/MastersCompletionModal';
import { StageCompletionModal, type StageCompletionModalData } from '../tournament/StageCompletionModal';
import { UnlockNotification } from '../today/UnlockNotification';
import { DramaEventToast, DramaEventModal } from '../drama';
import { dramaService } from '../../services/DramaService';
import { DRAMA_EVENT_TEMPLATES } from '../../data/dramaEvents';
import { substituteNarrative } from '../../engine/drama/DramaEngine';
import type { FeatureUnlock } from '../../data/featureUnlocks';
import type { DramaEventInstance, DramaChoice } from '../../types/drama';
import { PreAdvanceValidationModal } from '../today/PreAdvanceValidationModal';
import { trainingService } from '../../services/TrainingService';
import { scrimService } from '../../services/ScrimService';
import { DayScheduleService } from '../../services/DayScheduleService';
import type { CalendarEvent, SchedulableActivityType } from '../../types/calendar';
import type { TrainingActivityConfig, ScrimActivityConfig } from '../../types/activityPlan';

/**
 * Helper to enrich drama event with template data and substitute narrative placeholders
 */
function enrichEventWithNarrative(
  event: DramaEventInstance,
  template: { title: string; description: string }
) {
  const state = useGameStore.getState();

  // Build context for narrative substitution
  const context: Record<string, string> = {};

  // Add player name if event has affected players
  if (event.affectedPlayerIds && event.affectedPlayerIds.length > 0) {
    const playerId = event.affectedPlayerIds[0];
    const player = state.players[playerId];
    if (player) {
      context.playerName = player.name;
    }
  }

  // Add team name
  if (event.teamId) {
    const team = state.teams[event.teamId];
    if (team) {
      context.teamName = team.name;
    }
  }

  // Substitute placeholders in the narrative
  const narrative = substituteNarrative(template.description, context);

  return {
    ...event,
    title: template.title,
    narrative,
  };
}

export function TimeBar() {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [simulationResult, setSimulationResult] = useState<TimeAdvanceResult | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showDayRecapModal, setShowDayRecapModal] = useState(false);
  const [unlockedFeatures, setUnlockedFeatures] = useState<FeatureUnlock[]>([]);
  const [dramaToasts, setDramaToasts] = useState<DramaEventInstance[]>([]);
  const [currentMajorEvent, setCurrentMajorEvent] = useState<DramaEventInstance | null>(null);
  const [majorEventQueue, setMajorEventQueue] = useState<DramaEventInstance[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [unconfiguredEvents, setUnconfiguredEvents] = useState<CalendarEvent[]>([]);

  // Compute valid enriched drama toasts
  const validDramaToasts = useMemo(() => {
    return dramaToasts
      .map(event => {
        const template = DRAMA_EVENT_TEMPLATES.find(t => t.id === event.templateId);
        return template ? enrichEventWithNarrative(event, template) : null;
      })
      .filter((e): e is ReturnType<typeof enrichEventWithNarrative> => e !== null);
  }, [dramaToasts]);

  // Compute enriched major event
  const enrichedMajorEvent = useMemo(() => {
    if (!currentMajorEvent) return null;
    const template = DRAMA_EVENT_TEMPLATES.find(t => t.id === currentMajorEvent.templateId);
    if (!template) return null;
    return enrichEventWithNarrative(currentMajorEvent, template);
  }, [currentMajorEvent]);

  // Get simulation progress from store (updated by ProgressTrackingService)
  const simulationProgress = useGameStore((state) => state.simulationProgress);

  const calendar = useGameStore((state) => state.calendar);
  const gameStarted = useGameStore((state) => state.gameStarted);
  const setActiveView = useGameStore((state) => state.setActiveView);

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

  const handleTimeAdvance = async (advanceFn: (withProgress: boolean) => Promise<TimeAdvanceResult>) => {
    setIsAdvancing(true);

    try {
      const result = await advanceFn(true); // Pass true for withProgress

      // Show newly unlocked features
      if (result.newlyUnlockedFeatures.length > 0) {
        setUnlockedFeatures(result.newlyUnlockedFeatures);
      }

      // Process drama events - split into minor and major
      if (result.dramaEvents && result.dramaEvents.length > 0) {
        const minorEvents = result.dramaEvents.filter(e => e.severity === 'minor');
        const majorEvents = result.dramaEvents.filter(e => e.severity === 'major');

        setDramaToasts(minorEvents);
        setMajorEventQueue(majorEvents);
      }

      // Show results modal if matches were simulated
      if (result.simulatedMatches.length > 0) {
        setSimulationResult(result);
        setShowResultsModal(true);
      } else {
        // Show day recap for non-match days
        setSimulationResult(result);
      }
      setShowDayRecapModal(true);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAdvanceDay = () => {
    // Check for unconfigured activities before advancing
    const state = useGameStore.getState();
    const hasUnconfigured = state.hasUnconfiguredActivities();

    if (hasUnconfigured) {
      // Get unconfigured IDs (may include "unscheduled:training" sentinel values)
      const unconfiguredIds = state.getUnconfiguredActivities();

      // Auto-schedule any available-but-unscheduled activities so they get CalendarEvents
      const dayScheduleService = new DayScheduleService();
      const today = state.calendar?.currentDate;
      const newlyScheduledEvents: CalendarEvent[] = [];

      for (const id of unconfiguredIds) {
        if (id.startsWith('unscheduled:') && today) {
          const activityType = id.replace('unscheduled:', '') as SchedulableActivityType;
          try {
            const event = dayScheduleService.scheduleActivity(today, activityType);
            newlyScheduledEvents.push(event);
          } catch {
            // Activity couldn't be scheduled (e.g., blocked), skip it
          }
        }
      }

      // Now collect ALL unconfigured CalendarEvents (existing + newly created)
      const freshState = useGameStore.getState();
      const freshUnconfiguredIds = freshState.getUnconfiguredActivities();
      const events = freshState.calendar.scheduledEvents.filter(event =>
        freshUnconfiguredIds.includes(event.id)
      );

      if (events.length > 0) {
        setUnconfiguredEvents(events);
        setShowValidationModal(true);
      } else {
        // All resolved after auto-scheduling - proceed normally
        handleTimeAdvance(() => calendarService.advanceDay(true));
      }
    } else {
      // All configured - proceed normally
      handleTimeAdvance(() => calendarService.advanceDay(true));
    }
  };

   const handleCloseModal = () => {
     setShowResultsModal(false);
     setSimulationResult(null);
     progressTrackingService.clearProgress();

     // Check if there are major drama events to show
     if (majorEventQueue.length > 0) {
       const [firstEvent, ...rest] = majorEventQueue;
       setCurrentMajorEvent(firstEvent);
       setMajorEventQueue(rest);
     }
   };

  const handleCloseDayRecap = () => {
    setShowDayRecapModal(false);
  };

  const handleDismissUnlock = (index: number) => {
    setUnlockedFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDramaChoice = (choiceId: string) => {
    if (!currentMajorEvent) return;

    // Resolve the event through the drama service
    dramaService.resolveEvent(currentMajorEvent.id, choiceId);
  };

  const handleDramaClose = () => {
    // Close current modal
    setCurrentMajorEvent(null);

    // Check if there are more major events to show
    if (majorEventQueue.length > 0) {
      const [nextEvent, ...rest] = majorEventQueue;
      setCurrentMajorEvent(nextEvent);
      setMajorEventQueue(rest);
    }
  };

  const handleDismissDramaToast = (index: number) => {
    setDramaToasts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAutoConfigAll = () => {
    // Generate auto-configs for all unconfigured events
    const state = useGameStore.getState();

    for (const event of unconfiguredEvents) {
      if (event.type === 'scheduled_training') {
        // Auto-configure training
        const trainingPlan = trainingService.autoAssignTraining();

        // Convert TrainingPlan to TrainingActivityConfig
        const assignments = Array.from(trainingPlan.values()).map(assignment => ({
          playerId: assignment.playerId,
          action: 'train' as const,
          goal: assignment.goal,
          intensity: assignment.intensity,
        }));

        const config: TrainingActivityConfig = {
          type: 'training',
          id: crypto.randomUUID(),
          date: event.date,
          eventId: event.id,
          status: 'configured',
          assignments,
          autoConfigured: true,
        };

        state.setActivityConfig(config);
      } else if (event.type === 'scheduled_scrim') {
        // Auto-configure scrim
        const scrimOptions = scrimService.generateAutoConfig();

        if (scrimOptions) {
          const config: ScrimActivityConfig = {
            type: 'scrim',
            id: crypto.randomUUID(),
            date: event.date,
            eventId: event.id,
            status: 'configured',
            action: 'play',
            partnerTeamId: scrimOptions.partnerTeamId,
            maps: scrimOptions.focusMaps || [],
            intensity: scrimOptions.intensity || 'moderate',
            autoConfigured: true,
          };

          state.setActivityConfig(config);
        } else {
          // If auto-config fails, skip the scrim
          const config: ScrimActivityConfig = {
            type: 'scrim',
            id: crypto.randomUUID(),
            date: event.date,
            eventId: event.id,
            status: 'configured',
            action: 'skip',
            autoConfigured: true,
          };

          state.setActivityConfig(config);
        }
      }
    }

    // Close modal and proceed with day advancement
    setShowValidationModal(false);
    setUnconfiguredEvents([]);
    handleTimeAdvance(() => calendarService.advanceDay(true));
  };

  const handleReviewEvents = () => {
    // Close modal and return to Today page (user can configure manually)
    setShowValidationModal(false);
    setUnconfiguredEvents([]);
    setActiveView('today');
  };

  const handleCancelValidation = () => {
    // Just close the modal
    setShowValidationModal(false);
    setUnconfiguredEvents([]);
  };

  // Helper: Get choices for an event from its template with substituted outcome texts
  const getChoicesForEvent = (event: DramaEventInstance): DramaChoice[] => {
    const template = DRAMA_EVENT_TEMPLATES.find(t => t.id === event.templateId);
    if (!template?.choices) return [];

    const state = useGameStore.getState();

    // Build context for narrative substitution
    const context: Record<string, string> = {};

    // Add player name if event has affected players
    if (event.affectedPlayerIds && event.affectedPlayerIds.length > 0) {
      const playerId = event.affectedPlayerIds[0];
      const player = state.players[playerId];
      if (player) {
        context.playerName = player.name;
      }
    }

    // Add team name
    if (event.teamId) {
      const team = state.teams[event.teamId];
      if (team) {
        context.teamName = team.name;
      }
    }

    // Substitute placeholders in outcome texts
    return template.choices.map(choice => ({
      ...choice,
      outcomeText: substituteNarrative(choice.outcomeText, context),
    }));
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

      {/* Simulation Progress Modal - shown during worker simulation */}
      <SimulationProgressModal
        isOpen={isAdvancing && !!simulationProgress}
        progress={simulationProgress}
      />

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
        activityResults={simulationResult?.activityResults}
      />

      {/* Pre-Advance Validation Modal - shown when unconfigured activities exist */}
      <PreAdvanceValidationModal
        isOpen={showValidationModal}
        unconfiguredEvents={unconfiguredEvents}
        onAutoConfigAll={handleAutoConfigAll}
        onReview={handleReviewEvents}
        onCancel={handleCancelValidation}
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

      {/* Drama Event Toasts - show minor events */}
      {validDramaToasts.map((enrichedEvent, index) => (
        <DramaEventToast
          key={enrichedEvent.id}
          event={enrichedEvent}
          onDismiss={() => handleDismissDramaToast(index)}
        />
      ))}

      {/* Drama Event Modal - show major events */}
      {enrichedMajorEvent && (
        <DramaEventModal
          event={enrichedMajorEvent}
          choices={getChoicesForEvent(currentMajorEvent!)}
          onChoose={handleDramaChoice}
          onClose={handleDramaClose}
          isOpen={true}
        />
      )}
    </>
  );
}
