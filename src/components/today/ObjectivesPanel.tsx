// ObjectivesPanel - Display daily objectives for the manager
//
// Shows 2-4 context-aware objectives computed from game state.
// Primary objectives (CRITICAL/HIGH priority) highlighted with red border.
// Clicking objectives navigates to relevant view or opens modals.

import { useGameStore } from '../../store';
import { useObjectives, type DailyObjective } from '../../hooks/useObjectives';

export function ObjectivesPanel() {
  const setActiveView = useGameStore((state) => state.setActiveView);
  const objectives = useObjectives();

  const handleObjectiveClick = (objective: DailyObjective) => {
    if (!objective.action) return;

    // Navigate to the specified view
    setActiveView(objective.action.view);

    // Note: Modal opening for specific matches/tournaments would need
    // additional props passed from parent (similar to AlertsPanel)
    // For now, just navigate to the main view
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
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <h3 className="text-sm font-semibold text-vct-gray mb-3">Today's Objectives</h3>

      <div className="space-y-2">
        {objectives.map((objective) => (
          <ObjectiveItem
            key={objective.id}
            objective={objective}
            onClick={() => handleObjectiveClick(objective)}
          />
        ))}
      </div>
    </div>
  );
}

interface ObjectiveItemProps {
  objective: DailyObjective;
  onClick: () => void;
}

function ObjectiveItem({ objective, onClick }: ObjectiveItemProps) {
  // Primary objectives (CRITICAL/HIGH priority >= 80) get red left border
  const isPrimary = objective.priority >= 80;

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 border rounded-lg text-left transition-colors ${
        isPrimary
          ? 'bg-vct-red/10 border-vct-red/30 hover:bg-vct-red/20 border-l-4 border-l-vct-red'
          : 'bg-vct-gray/10 border-vct-gray/20 hover:bg-vct-gray/20'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="mt-0.5">
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              objective.completed
                ? 'bg-green-500 border-green-500'
                : isPrimary
                ? 'border-vct-red/50'
                : 'border-vct-gray/50'
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
                  : isPrimary
                  ? 'text-vct-red'
                  : 'text-vct-light'
              }`}
            >
              {objective.label}
            </span>
            {objective.action && !objective.completed && (
              <span className="text-xs text-vct-gray/60 ml-2">→</span>
            )}
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
