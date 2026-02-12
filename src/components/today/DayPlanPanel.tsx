// DayPlanPanel - Activity planning for Today view (plan-confirm workflow)
//
// Replaces ActionsPanel with a new workflow:
// - Events are pre-placed by EventScheduler
// - Users configure events before day advancement
// - Click event card to configure in modal
// - Shows status badges: Needs Setup / Configured / Skipped

import { useState } from 'react';
import { useGameStore } from '../../store';
import { useMatchDay } from '../../hooks';
import { TrainingModal } from '../calendar';
import { ScrimModal } from '../scrim';
import type { CalendarEvent } from '../../types';

export function DayPlanPanel() {
  const [selectedTrainingEventId, setSelectedTrainingEventId] = useState<string | null>(null);
  const [selectedScrimEventId, setSelectedScrimEventId] = useState<string | null>(null);

  const setActiveView = useGameStore((state) => state.setActiveView);
  const calendar = useGameStore((state) => state.calendar);
  const getActivityConfig = useGameStore((state) => state.getActivityConfig);
  const playerTeam = useGameStore((state) => {
    const teamId = state.playerTeamId;
    return teamId ? state.teams[teamId] : null;
  });

  const { isMatchDay, opponentName } = useMatchDay();

  // Get today's training and scrim events
  const todayEvents = calendar.scheduledEvents.filter(
    (event) =>
      event.date === calendar.currentDate &&
      !event.processed &&
      (event.type === 'training_available' || event.type === 'scrim_available')
  );

  const trainingEvents = todayEvents.filter((e) => e.type === 'training_available');
  const scrimEvents = todayEvents.filter((e) => e.type === 'scrim_available');

  // Helper: Get status badge for an event
  const getStatusBadge = (event: CalendarEvent) => {
    const config = getActivityConfig(event.id);

    if (!config || config.status === 'needs_setup') {
      return (
        <span className="px-2 py-0.5 text-xs rounded font-medium bg-amber-500/20 text-amber-400">
          Needs Setup
        </span>
      );
    }

    if (config.type === 'training') {
      const skippedCount = config.assignments.filter((a) => a.action === 'skip').length;
      const allSkipped = skippedCount === config.assignments.length;

      if (allSkipped) {
        return (
          <span className="px-2 py-0.5 text-xs rounded font-medium bg-vct-gray/20 text-vct-gray">
            Skipped
          </span>
        );
      }

      return (
        <span className="px-2 py-0.5 text-xs rounded font-medium bg-green-500/20 text-green-400">
          Configured
        </span>
      );
    }

    if (config.type === 'scrim') {
      if (config.action === 'skip') {
        return (
          <span className="px-2 py-0.5 text-xs rounded font-medium bg-vct-gray/20 text-vct-gray">
            Skipped
          </span>
        );
      }

      return (
        <span className="px-2 py-0.5 text-xs rounded font-medium bg-green-500/20 text-green-400">
          Configured
        </span>
      );
    }

    return null;
  };

  // Helper: Get summary text for configured event
  const getSummaryText = (event: CalendarEvent): string | null => {
    const config = getActivityConfig(event.id);

    if (!config || config.status === 'needs_setup') {
      return null;
    }

    if (config.type === 'training') {
      const trainingCount = config.assignments.filter((a) => a.action === 'train').length;
      const skippedCount = config.assignments.filter((a) => a.action === 'skip').length;

      if (trainingCount === 0 && skippedCount > 0) {
        return 'All players resting';
      }

      if (skippedCount === 0) {
        return `${trainingCount} player${trainingCount > 1 ? 's' : ''} training`;
      }

      return `${trainingCount} training, ${skippedCount} resting`;
    }

    if (config.type === 'scrim') {
      if (config.action === 'skip') {
        return 'Team rests for morale boost';
      }

      const mapCount = config.maps?.length || 0;
      const format =
        mapCount === 1 ? 'Single Map' : mapCount === 3 ? 'Best of 3' : 'Map Rotation';

      return `${format} • ${config.intensity || 'moderate'} intensity`;
    }

    return null;
  };

  // Match day - show disabled state
  if (isMatchDay) {
    return (
      <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
        <h3 className="text-sm font-semibold text-vct-gray mb-3">Today's Plan</h3>

        <div className="p-4 bg-vct-red/10 border border-vct-red/30 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-vct-red font-bold">MATCH DAY</span>
          </div>
          <p className="text-sm text-vct-gray">
            No training or scrims on match days. Focus on today's match vs {opponentName}.
          </p>
          <p className="text-xs text-vct-gray/60 mt-2">
            Use time controls to simulate the match
          </p>
        </div>

        {/* Roster quick link */}
        <button
          onClick={() => setActiveView('team')}
          className="w-full p-3 bg-vct-gray/10 border border-vct-gray/20 rounded-lg text-left hover:bg-vct-gray/20 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="text-vct-light">Roster</span>
            </div>
            <span className="text-vct-gray text-sm">
              {playerTeam?.playerIds.length || 0} active, {playerTeam?.reservePlayerIds.length || 0} reserve
            </span>
          </div>
        </button>
      </div>
    );
  }

  // Non-match day - show event cards
  return (
    <>
      <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
        <h3 className="text-sm font-semibold text-vct-gray mb-3">Today's Plan</h3>

        <div className="space-y-3">
          {/* Training Event Card */}
          {trainingEvents.map((event) => {
            const summary = getSummaryText(event);
            const badge = getStatusBadge(event);

            return (
              <button
                key={event.id}
                onClick={() => setSelectedTrainingEventId(event.id)}
                className="w-full p-3 border rounded-lg transition-colors text-left bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏋️</span>
                    <span className="text-blue-400 font-medium">Training Session</span>
                  </div>
                  {badge}
                </div>
                {summary && <p className="text-xs text-vct-gray mt-1">{summary}</p>}
              </button>
            );
          })}

          {/* Scrim Event Card */}
          {scrimEvents.map((event) => {
            const summary = getSummaryText(event);
            const badge = getStatusBadge(event);

            return (
              <button
                key={event.id}
                onClick={() => setSelectedScrimEventId(event.id)}
                className="w-full p-3 border rounded-lg transition-colors text-left bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤝</span>
                    <span className="text-purple-400 font-medium">Scrim</span>
                  </div>
                  {badge}
                </div>
                {summary && <p className="text-xs text-vct-gray mt-1">{summary}</p>}
              </button>
            );
          })}

          {/* No events message */}
          {trainingEvents.length === 0 && scrimEvents.length === 0 && (
            <div className="p-4 bg-vct-gray/5 border border-vct-gray/10 rounded-lg text-center">
              <p className="text-sm text-vct-gray">No activities scheduled for today</p>
            </div>
          )}

          {/* Roster Link */}
          <button
            onClick={() => setActiveView('team')}
            className="w-full p-3 bg-vct-gray/10 border border-vct-gray/20 rounded-lg text-left hover:bg-vct-gray/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">👥</span>
                <span className="text-vct-light">Roster</span>
              </div>
              <span className="text-vct-gray text-sm">
                {playerTeam?.playerIds.length || 0} active,{' '}
                {playerTeam?.reservePlayerIds.length || 0} reserve
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Training Modal */}
      {selectedTrainingEventId && (() => {
        const config = getActivityConfig(selectedTrainingEventId);
        return (
          <TrainingModal
            isOpen={selectedTrainingEventId !== null}
            onClose={() => setSelectedTrainingEventId(null)}
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
            onClose={() => setSelectedScrimEventId(null)}
            eventId={selectedScrimEventId}
            existingConfig={config?.type === 'scrim' ? config : undefined}
          />
        );
      })()}
    </>
  );
}
