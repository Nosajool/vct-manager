// SimulationProgressModal - Shows progress during simulation
//
// Displays a modal with progress bar and current status while compute work runs in the Web Worker
// Reads real-time progress from the store (updated by ProgressTrackingService via worker messages)

import type { SimulationProgress } from '../../store/slices/uiSlice';

interface SimulationProgressModalProps {
  isOpen: boolean;
  progress: SimulationProgress | null;
}

export function SimulationProgressModal({
  isOpen,
  progress,
}: SimulationProgressModalProps) {
  // Early return if not open or no progress data
  if (!isOpen || !progress) return null;

  // Calculate progress percentage
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20">
          <h2 className="text-xl font-bold text-vct-light">Processing...</h2>
          <p className="text-sm text-vct-gray mt-1">
            {progress.current} of {progress.total} {progress.type === 'matches' ? 'matches' : 'tasks'} completed
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="relative">
              <div className="h-2 bg-vct-gray/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-vct-red transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="mt-1 text-center text-xs text-vct-gray">
                {Math.round(progressPercentage)}%
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-vct-dark rounded-lg p-3">
            <div className="text-sm text-vct-light">{progress.status}</div>
            {progress.details?.currentMatch && (
              <div className="text-xs text-vct-gray mt-1">
                {progress.details.currentMatch}
              </div>
            )}
          </div>

          {/* Spinner */}
          <div className="flex justify-center pt-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vct-red"></div>
          </div>
        </div>
      </div>
    </div>
  );
}