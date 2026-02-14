// ActivityStatusBadge - Display status badge for scheduled activities
//
// Extracted from ObjectivesPanel.getStatusBadge() to provide reusable
// activity status badges for the unified day planning system.
//
// Renders styled badges for different activity lifecycle states:
// - 'needs_setup': Amber badge indicating configuration needed
// - 'configured': Green badge indicating ready to execute
// - 'skipped': Gray badge indicating explicitly skipped
// - 'locked': Blue-gray badge indicating past/immutable event

import type { ActivityState } from '../../types/dayPlan';

interface ActivityStatusBadgeProps {
  /** The current state of the activity */
  state: ActivityState;
}

export function ActivityStatusBadge({ state }: ActivityStatusBadgeProps) {
  // Don't render badges for 'available' or 'unavailable' states
  // These are handled differently in the UI (buttons/disabled states)
  if (state === 'available' || state === 'unavailable') {
    return null;
  }

  // Render appropriate badge based on activity state
  switch (state) {
    case 'needs_setup':
      return (
        <span className="px-2 py-0.5 text-xs rounded font-medium bg-amber-500/20 text-amber-400">
          Needs Setup
        </span>
      );

    case 'configured':
      return (
        <span className="px-2 py-0.5 text-xs rounded font-medium bg-green-500/20 text-green-400">
          Configured
        </span>
      );

    case 'skipped':
      return (
        <span className="px-2 py-0.5 text-xs rounded font-medium bg-vct-gray/20 text-vct-gray">
          Skipped
        </span>
      );

    case 'locked':
      return (
        <span className="px-2 py-0.5 text-xs rounded font-medium bg-slate-500/20 text-slate-400">
          Locked
        </span>
      );

    default:
      return null;
  }
}
