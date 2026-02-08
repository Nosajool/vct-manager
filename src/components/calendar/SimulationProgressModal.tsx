// SimulationProgressModal - Shows progress during simulation
//
// Displays a modal with progress bar and estimated time remaining while matches are being simulated
// This will replace the simple "Processing..." text with a more informative progress indicator

import { useState, useEffect } from 'react';
import { useGameStore } from '../../store';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import type { TimeAdvanceResult } from '../../services';

interface SimulationProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TimeAdvanceResult | null;
  onProgressUpdate?: (progress: number) => void;
}

interface ProgressState {
  totalMatches: number;
  completedMatches: number;
  currentMatchIndex: number;
  currentMatchName: string;
  progressPercentage: number;
  estimatedTimeRemaining: string;
}

export function SimulationProgressModal({
  isOpen,
  onClose,
  result,
  onProgressUpdate,
}: SimulationProgressModalProps) {
  const [progress, setProgress] = useState<ProgressState>({
    totalMatches: 0,
    completedMatches: 0,
    currentMatchIndex: 0,
    currentMatchName: '',
    progressPercentage: 0,
    estimatedTimeRemaining: 'Calculating...',
  });

  const teams = useGameStore((state) => state.teams);
  const matches = useGameStore((state) => state.matches);

  // Update progress when result changes
  useEffect(() => {
    if (!result || !isOpen) {
      setProgress((prev) => ({
        ...prev,
        totalMatches: 0,
        completedMatches: 0,
        currentMatchIndex: 0,
        currentMatchName: '',
        progressPercentage: 0,
        estimatedTimeRemaining: 'Calculating...',
      }));
      return;
    }

    const totalMatches = result.simulatedMatches.length;
    setProgress({
      totalMatches,
      completedMatches: 0,
      currentMatchIndex: 0,
      currentMatchName: 'Starting simulation...',
      progressPercentage: 0,
      estimatedTimeRemaining: 'Calculating...',
    });
  }, [result, isOpen]);

  // Simulate progress updates (in real implementation, this would be driven by the simulation process)
  useEffect(() => {
    if (!result || !isOpen) return;

    let currentMatchIndex = 0;
    const startTime = Date.now();

    const timer = setInterval(() => {
      if (!isOpen || !result) {
        clearInterval(timer);
        return;
      }

      currentMatchIndex = Math.min(currentMatchIndex + 1, result.simulatedMatches.length);
      const completedMatches = Math.min(currentMatchIndex, result.simulatedMatches.length);
      const totalMatches = result.simulatedMatches.length;
      const progressPercentage = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

      // Get current match name for display
      const currentMatch = matches[result.simulatedMatches[completedMatches - 1]?.matchId];
      let currentMatchName = 'Simulating match...';
      if (currentMatch) {
        const teamA = teams[currentMatch.teamAId];
        const teamB = teams[currentMatch.teamBId];
        if (teamA && teamB) {
          currentMatchName = `${teamA.name} vs ${teamB.name}`;
        }
      }

      // Calculate estimated time remaining
      const elapsedTime = Date.now() - startTime;
      const estimatedTotalTime = totalMatches > 0 ? (elapsedTime / completedMatches) * totalMatches : 0;
      const estimatedRemainingTime = estimatedTotalTime - elapsedTime;
      
      const estimatedTimeRemaining = formatTime(estimatedRemainingTime);

      setProgress({
        totalMatches: result.simulatedMatches.length,
        completedMatches,
        currentMatchIndex,
        currentMatchName,
        progressPercentage,
        estimatedTimeRemaining,
      });

      // Call progress update callback if provided
      onProgressUpdate?.(progressPercentage);

      // Complete when all matches are done
      if (completedMatches >= result.simulatedMatches.length) {
        clearInterval(timer);
      }
    }, 100); // Update every 100ms

    return () => clearInterval(timer);
  }, [isOpen, result, matches, teams, onProgressUpdate]);

  // Early return if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-vct-light">Simulating Matches</h2>
            <p className="text-sm text-vct-gray">
              {progress.completedMatches} of {progress.totalMatches} matches completed
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-vct-gray hover:text-vct-light transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="text-sm text-vct-gray">Progress</div>
            <div className="relative">
              <div className="h-2 bg-vct-gray/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-vct-red transition-all duration-300 ease-out"
                  style={{ width: `${progress.progressPercentage}%` }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-xs text-vct-light">
                {Math.round(progress.progressPercentage)}%
              </div>
            </div>
          </div>

          {/* Current Match Info */}
          <div className="space-y-2">
            <div className="text-sm text-vct-gray">Current Match</div>
            <div className="bg-vct-dark rounded-lg p-3">
              <div className="text-sm text-vct-light font-medium">{progress.currentMatchName}</div>
              <div className="text-xs text-vct-gray mt-1">
                Match {progress.currentMatchIndex} of {progress.totalMatches}
              </div>
            </div>
          </div>

          {/* Estimated Time Remaining */}
          <div className="space-y-2">
            <div className="text-sm text-vct-gray">Estimated Time Remaining</div>
            <div className="text-vct-light font-medium text-lg">{progress.estimatedTimeRemaining}</div>
          </div>

          {/* Loading Spinner */}
          <div className="flex items-center justify-center">
            <LoadingSpinner size="lg" variant="pulse" text="Simulating..." />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-vct-gray/20 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vct-gray hover:bg-vct-gray/80 text-vct-light rounded-lg font-medium transition-colors"
          >
            Cancel Simulation
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to format time
function formatTime(milliseconds: number): string {
  if (milliseconds <= 0) return 'Less than a second';
  
  const totalSeconds = Math.round(milliseconds / 1000);
  
  if (totalSeconds < 60) {
    return `${totalSeconds} second${totalSeconds !== 1 ? 's' : ''}`;
  }
  
  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}${remainingSeconds > 0 ? ` ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}` : ''}`;
  }
  
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  
  return `${totalHours} hour${totalHours !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}` : ''}`;
}