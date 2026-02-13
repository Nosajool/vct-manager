// ObjectivesPanel - Display daily objectives for the manager
//
// Shows 2-4 context-aware objectives computed from game state.
// Primary objectives (CRITICAL/HIGH priority) highlighted with red border.
// Clicking objectives navigates to relevant view or opens modals.

import { useState } from 'react';
import { useGameStore } from '../../store';
import { useObjectives, type DailyObjective } from '../../hooks/useObjectives';
import { TrainingModal } from '../calendar';
import { ScrimModal } from '../scrim';
import { ACTIVITY_COLORS } from '../../constants/activityColors';

export function ObjectivesPanel() {
  const [selectedTrainingEventId, setSelectedTrainingEventId] = useState<string | null>(null);
  const [selectedScrimEventId, setSelectedScrimEventId] = useState<string | null>(null);

  const setActiveView = useGameStore((state) => state.setActiveView);
  const getActivityConfig = useGameStore((state) => state.getActivityConfig);
  const objectives = useObjectives();

  const handleObjectiveClick = (objective: DailyObjective) => {
    if (!objective.action) return;

    // Check if we should open a modal instead of navigating
    if (objective.action.openModal) {
      if (objective.action.openModal === 'training' && objective.action.eventId) {
        setSelectedTrainingEventId(objective.action.eventId);
        return;
      }
      if (objective.action.openModal === 'scrim' && objective.action.eventId) {
        setSelectedScrimEventId(objective.action.eventId);
        return;
      }
    }

    // Otherwise, navigate to the specified view
    setActiveView(objective.action.view);
  };

  // Helper: Get status badge for an objective based on activity config
  const getStatusBadge = (objective: DailyObjective) => {
    if (!objective.action?.eventId) return null;

    const config = getActivityConfig(objective.action.eventId);

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

  if (objectives.length === 0) {
    return (
      <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
        <h3 className="text-sm font-semibold text-vct-gray mb-3">Today's Objectives</h3>
        <p className="text-sm text-vct-gray/60 italic">No objectives for today</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
        <h3 className="text-sm font-semibold text-vct-gray mb-3">Today's Objectives</h3>

        <div className="space-y-2">
          {objectives.map((objective) => (
            <ObjectiveItem
              key={objective.id}
              objective={objective}
              onClick={() => handleObjectiveClick(objective)}
              statusBadge={getStatusBadge(objective)}
            />
          ))}
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

interface ObjectiveItemProps {
  objective: DailyObjective;
  onClick: () => void;
  statusBadge?: React.ReactNode;
}

function ObjectiveItem({ objective, onClick, statusBadge }: ObjectiveItemProps) {
  // Primary objectives (CRITICAL/HIGH priority >= 80) get red left border
  const isPrimary = objective.priority >= 80;

  // Use activity colors if available, otherwise fallback to priority-based colors
  const colors = objective.activityType
    ? ACTIVITY_COLORS[objective.activityType]
    : null;

  // Build className based on activity type or priority
  const baseClasses = 'w-full p-3 border rounded-lg text-left transition-colors';

  const bgClass = colors?.bg ?? (isPrimary ? 'bg-vct-red/10' : 'bg-vct-gray/10');
  const bgHoverClass = colors?.bgHover ?? (isPrimary ? 'hover:bg-vct-red/20' : 'hover:bg-vct-gray/20');
  const borderClass = colors?.border ?? (isPrimary ? 'border-vct-red/30' : 'border-vct-gray/20');
  const borderLeftClass = colors ? `border-l-4 ${colors.borderLeft}` : (isPrimary ? 'border-l-4 border-l-vct-red' : '');
  const textClass = colors?.text ?? (isPrimary ? 'text-vct-red' : 'text-vct-light');
  const checkboxBorderClass = colors?.checkboxBorder ?? (isPrimary ? 'border-vct-red/50' : 'border-vct-gray/50');

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${bgClass} ${bgHoverClass} ${borderClass} ${borderLeftClass}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="mt-0.5">
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              objective.completed
                ? 'bg-green-500 border-green-500'
                : checkboxBorderClass
            }`}
          >
            {objective.completed && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span
              className={`font-medium text-sm ${
                objective.completed
                  ? 'text-vct-gray line-through'
                  : textClass
              }`}
            >
              {objective.label}
            </span>
            <div className="flex items-center gap-2">
              {statusBadge}
              {objective.action && !objective.completed && (
                <span className="text-xs text-vct-gray/60 ml-2">→</span>
              )}
            </div>
          </div>
          <p
            className={`text-xs ${
              objective.completed ? 'text-vct-gray/60 line-through' : 'text-vct-gray'
            }`}
          >
            {objective.description}
          </p>
        </div>
      </div>
    </button>
  );
}
