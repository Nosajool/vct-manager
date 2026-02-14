// WeekPlannerPanel - Shows next 7 days with scheduling status
// Allows scheduling activities on future days

import { useState, useMemo } from 'react';
import { useGameStore } from '../../store';
import { DayScheduleService } from '../../services/DayScheduleService';
import { timeProgression } from '../../engine/calendar';
import { TrainingModal } from '../calendar/TrainingModal';
import { ScrimModal } from '../scrim/ScrimModal';
import type { DaySchedule } from '../../types/scheduling';
import type { CalendarEvent, MatchEventData } from '../../types';

export function WeekPlannerPanel() {
  const [selectedDaySchedule, setSelectedDaySchedule] = useState<DaySchedule | null>(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showScrimModal, setShowScrimModal] = useState(false);

  const calendar = useGameStore((state) => state.calendar);
  const teams = useGameStore((state) => state.teams);
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  // Get week schedule using DayScheduleService
  const dayScheduleService = useMemo(() => new DayScheduleService(), []);
  const weekSchedule = useMemo(() => {
    return dayScheduleService.getWeekSchedule(calendar.currentDate);
  }, [calendar.currentDate, dayScheduleService]);

  // Handle scheduling training for a day
  const handleScheduleTraining = (daySchedule: DaySchedule) => {
    setSelectedDaySchedule(daySchedule);

    // Check if there's already a scheduled training event
    const existingEvent = daySchedule.scheduledActivities.find(
      (e) => e.type === 'scheduled_training'
    );

    if (!existingEvent) {
      // Create a new scheduled_training event
      try {
        dayScheduleService.scheduleActivity(daySchedule.date, 'training');
      } catch (err) {
        console.error('Failed to schedule training:', err);
        return;
      }
    }

    setShowTrainingModal(true);
  };

  // Handle scheduling scrim for a day
  const handleScheduleScrim = (daySchedule: DaySchedule) => {
    setSelectedDaySchedule(daySchedule);

    // Check if there's already a scheduled scrim event
    const existingEvent = daySchedule.scheduledActivities.find(
      (e) => e.type === 'scheduled_scrim'
    );

    if (!existingEvent) {
      // Create a new scheduled_scrim event
      try {
        dayScheduleService.scheduleActivity(daySchedule.date, 'scrim');
      } catch (err) {
        console.error('Failed to schedule scrim:', err);
        return;
      }
    }

    setShowScrimModal(true);
  };

  // Get the event ID for the modal
  const getEventForActivityType = (daySchedule: DaySchedule, activityType: 'training' | 'scrim') => {
    const eventType = activityType === 'training' ? 'scheduled_training' : 'scheduled_scrim';
    return daySchedule.scheduledActivities.find((e) => e.type === eventType);
  };

  // Get activity config for the event with proper type
  const getTrainingConfig = (event: CalendarEvent | undefined) => {
    if (!event) return undefined;
    const activityConfigs = useGameStore.getState().activityConfigs;
    const config = activityConfigs[event.id];
    return config?.type === 'training' ? config : undefined;
  };

  const getScrimConfig = (event: CalendarEvent | undefined) => {
    if (!event) return undefined;
    const activityConfigs = useGameStore.getState().activityConfigs;
    const config = activityConfigs[event.id];
    return config?.type === 'scrim' ? config : undefined;
  };

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-vct-light">Week Planner</h2>
        <p className="text-sm text-vct-gray">Schedule activities for the next 7 days</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {weekSchedule.map((daySchedule, idx) => (
          <DayScheduleCard
            key={daySchedule.date}
            daySchedule={daySchedule}
            dayIndex={idx}
            currentDate={calendar.currentDate}
            teams={teams}
            playerTeamId={playerTeamId}
            onScheduleTraining={() => handleScheduleTraining(daySchedule)}
            onScheduleScrim={() => handleScheduleScrim(daySchedule)}
          />
        ))}
      </div>

      {/* Modals */}
      {selectedDaySchedule && showTrainingModal && (
        <TrainingModal
          isOpen={showTrainingModal}
          onClose={() => {
            setShowTrainingModal(false);
            setSelectedDaySchedule(null);
          }}
          eventId={getEventForActivityType(selectedDaySchedule, 'training')?.id}
          existingConfig={getTrainingConfig(getEventForActivityType(selectedDaySchedule, 'training'))}
        />
      )}

      {selectedDaySchedule && showScrimModal && (
        <ScrimModal
          isOpen={showScrimModal}
          onClose={() => {
            setShowScrimModal(false);
            setSelectedDaySchedule(null);
          }}
          eventId={getEventForActivityType(selectedDaySchedule, 'scrim')?.id}
          existingConfig={getScrimConfig(getEventForActivityType(selectedDaySchedule, 'scrim'))}
        />
      )}
    </div>
  );
}

interface DayScheduleCardProps {
  daySchedule: DaySchedule;
  dayIndex: number;
  currentDate: string;
  teams: Record<string, { id: string; name: string }>;
  playerTeamId: string | null;
  onScheduleTraining: () => void;
  onScheduleScrim: () => void;
}

function DayScheduleCard({
  daySchedule,
  dayIndex,
  teams,
  onScheduleTraining,
  onScheduleScrim,
}: DayScheduleCardProps) {
  const formattedDate = timeProgression.formatDate(daySchedule.date);

  // Get relative day label
  const getRelativeDay = () => {
    if (dayIndex === 0) return 'Today';
    if (dayIndex === 1) return 'Tomorrow';
    return `Day ${dayIndex + 1}`;
  };

  // Check for match event
  const matchEvent = daySchedule.fixedEvents.find(
    (e) => e.type === 'match' || e.type === 'placeholder_match'
  );

  // Get match display text
  const getMatchText = () => {
    if (!matchEvent) return null;

    if (matchEvent.type === 'match') {
      const data = matchEvent.data as MatchEventData;
      const homeTeam = teams[data.homeTeamId]?.name || 'TBD';
      const awayTeam = teams[data.awayTeamId]?.name || 'TBD';
      return `${homeTeam} vs ${awayTeam}`;
    }

    return 'Match (TBD)';
  };

  // Get scheduled activities status
  const trainingEvent = daySchedule.scheduledActivities.find(
    (e) => e.type === 'scheduled_training'
  );
  const scrimEvent = daySchedule.scheduledActivities.find(
    (e) => e.type === 'scheduled_scrim'
  );

  const canScheduleTraining = daySchedule.availableActivityTypes.includes('training');
  const canScheduleScrim = daySchedule.availableActivityTypes.includes('scrim');

  return (
    <div className="bg-vct-darker rounded-lg border border-vct-gray/20 p-3">
      {/* Date header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-vct-light">{formattedDate}</p>
          <p className="text-xs text-vct-gray">{getRelativeDay()}</p>
        </div>
        {dayIndex === 0 && (
          <span className="px-2 py-0.5 bg-vct-red/20 text-vct-red text-xs font-medium rounded">
            Today
          </span>
        )}
      </div>

      {/* Match status */}
      {matchEvent && (
        <div className="mb-3 p-2 rounded bg-vct-red/10 border border-vct-red/20">
          <p className="text-xs font-medium text-vct-red mb-1">
            {matchEvent.type === 'match' ? '⚔️ Match Day' : '⚔️ Placeholder Match'}
          </p>
          <p className="text-xs text-vct-gray">{getMatchText()}</p>
        </div>
      )}

      {/* Activities grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Training */}
        <div>
          {trainingEvent ? (
            <button
              onClick={onScheduleTraining}
              className="w-full p-2 rounded bg-blue-500/20 border border-blue-500/30 text-left hover:bg-blue-500/30 transition-colors"
            >
              <p className="text-xs font-medium text-blue-400 mb-1">Training</p>
              <p className="text-xs text-vct-gray">
                {trainingEvent.lifecycleState === 'needs_setup' && '⚠️ Needs Setup'}
                {trainingEvent.lifecycleState === 'configured' && '✓ Configured'}
                {trainingEvent.lifecycleState === 'locked' && '🔒 Locked'}
              </p>
            </button>
          ) : canScheduleTraining ? (
            <button
              onClick={onScheduleTraining}
              className="w-full p-2 rounded border border-dashed border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              <p className="text-xs">+ Schedule Training</p>
            </button>
          ) : (
            <div className="w-full p-2 rounded bg-vct-gray/10 border border-vct-gray/20">
              <p className="text-xs text-vct-gray">Training Unavailable</p>
            </div>
          )}
        </div>

        {/* Scrim */}
        <div>
          {scrimEvent ? (
            <button
              onClick={onScheduleScrim}
              className="w-full p-2 rounded bg-orange-500/20 border border-orange-500/30 text-left hover:bg-orange-500/30 transition-colors"
            >
              <p className="text-xs font-medium text-orange-400 mb-1">Scrim</p>
              <p className="text-xs text-vct-gray">
                {scrimEvent.lifecycleState === 'needs_setup' && '⚠️ Needs Setup'}
                {scrimEvent.lifecycleState === 'configured' && '✓ Configured'}
                {scrimEvent.lifecycleState === 'locked' && '🔒 Locked'}
              </p>
            </button>
          ) : canScheduleScrim ? (
            <button
              onClick={onScheduleScrim}
              className="w-full p-2 rounded border border-dashed border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors"
            >
              <p className="text-xs">+ Schedule Scrim</p>
            </button>
          ) : (
            <div className="w-full p-2 rounded bg-vct-gray/10 border border-vct-gray/20">
              <p className="text-xs text-vct-gray">Scrim Unavailable</p>
            </div>
          )}
        </div>
      </div>

      {/* Blockers */}
      {daySchedule.blockers.length > 0 && !matchEvent && (
        <div className="mt-2">
          {daySchedule.blockers.map((blocker, idx) => (
            <p key={idx} className="text-xs text-vct-gray">
              {blocker.reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
