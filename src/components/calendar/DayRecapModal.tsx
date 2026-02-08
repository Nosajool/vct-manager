// DayRecapModal - Shows a brief recap for non-match days
//
// Displays what happened during the day when advancing time on days
// without matches. Shows training narratives if available, or a
// "quiet day" message if nothing significant occurred.

import type { TimeAdvanceResult } from '../../services';

interface DayRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TimeAdvanceResult | null;
}

export function DayRecapModal({
  isOpen,
  onClose,
  result,
}: DayRecapModalProps) {
  if (!isOpen || !result) return null;

  // Check if anything significant happened
  const hasProcessedEvents = result.processedEvents.length > 0;
  const hasSkippedEvents = result.skippedEvents.length > 0;

  // For now, show a simple message
  // TODO: Integrate training narratives when training results are tracked
  const getMessage = (): string => {
    if (hasProcessedEvents) {
      // Some events were processed (could be salary payments, tournament starts, etc.)
      return "The day passes quietly as the team prepares for upcoming challenges.";
    }

    if (hasSkippedEvents) {
      // Optional events were available but not taken
      return "A quiet day of rest and preparation.";
    }

    // Completely quiet day
    return "A quiet day. The team rests and recovers.";
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20">
          <h2 className="text-xl font-bold text-vct-light">Day Recap</h2>
          <p className="text-sm text-vct-gray">
            {result.newDate}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-vct-light text-lg italic">
            {getMessage()}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-vct-gray/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
