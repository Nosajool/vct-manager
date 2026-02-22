// PreAdvanceValidationModal Component - Warns about unconfigured activities before advancing day

import type { CalendarEvent } from '../../types/calendar';

interface PreAdvanceValidationModalProps {
  isOpen: boolean;
  unconfiguredEvents: CalendarEvent[];
  hasInsufficientRoster?: boolean;
  activeRosterCount?: number;
  onAutoConfigAll: () => void;
  onReview: () => void;
  onCancel: () => void;
}

export function PreAdvanceValidationModal({
  isOpen,
  unconfiguredEvents,
  hasInsufficientRoster = false,
  activeRosterCount = 0,
  onAutoConfigAll,
  onReview,
  onCancel,
}: PreAdvanceValidationModalProps) {
  if (!isOpen) return null;

  const hasActivityIssue = unconfiguredEvents.length > 0;
  const hasAnyIssue = hasInsufficientRoster || hasActivityIssue;

  // Get a user-friendly label for each event type
  const getEventLabel = (event: CalendarEvent): string => {
    switch (event.type) {
      case 'scheduled_training':
        return 'Training Session';
      case 'scheduled_scrim':
        return 'Scrim';
      default:
        return event.type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20">
          <h2 className="text-xl font-bold text-vct-light flex items-center gap-2">
            <svg
              className="w-6 h-6 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {hasInsufficientRoster ? 'Action Required' : 'Unconfigured Activities'}
          </h2>
          <p className="text-sm text-vct-gray mt-1">
            {hasInsufficientRoster
              ? 'You must resolve these issues before advancing'
              : "You have activities that haven't been configured yet"}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Roster Warning - shown above events list */}
          {hasInsufficientRoster && (
            <div className="bg-vct-dark rounded-lg p-3 border border-red-500/40">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="font-medium text-sm">
                  Your active roster only has {activeRosterCount}/5 players
                </span>
              </div>
              <p className="text-xs text-vct-gray ml-7">
                You need exactly 5 players on the active roster before advancing
              </p>
            </div>
          )}

          {/* Unconfigured Events List */}
          {hasActivityIssue && (
            <div className="bg-vct-dark rounded-lg p-3 space-y-2">
              {unconfiguredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-2 text-vct-light"
                >
                  <svg
                    className="w-5 h-5 text-yellow-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">{getEventLabel(event)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-vct-dark/50 rounded-lg p-3 border border-vct-gray/20">
            <p className="text-xs text-vct-gray">
              <strong className="text-vct-light">Auto-Configure:</strong>{' '}
              {hasAnyIssue && hasInsufficientRoster
                ? 'Auto-Configure will promote the highest-rated available players to fill the roster and set up activities at 80% efficiency.'
                : 'Activities will be set up automatically at 80% efficiency. You can review and customize them first if you prefer.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2 border-t border-vct-gray/20">
          {/* Primary: Auto-Configure All */}
          <button
            onClick={onAutoConfigAll}
            className="w-full py-3 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
          >
            Auto-Configure All & Advance
          </button>

          {/* Secondary: Review / Fix Roster */}
          <button
            onClick={onReview}
            className="w-full py-3 bg-vct-dark hover:bg-vct-dark/80 text-vct-light border border-vct-gray/20 rounded-lg font-medium transition-colors"
          >
            {hasInsufficientRoster ? 'Fix Roster Manually' : 'Review Events'}
          </button>

          {/* Tertiary: Cancel */}
          <button
            onClick={onCancel}
            className="w-full py-2 text-vct-gray hover:text-vct-light transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
