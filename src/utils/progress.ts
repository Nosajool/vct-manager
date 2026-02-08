// Progress Tracking Utilities
// Helper functions for tracking simulation progress across services

import type { SimulationProgress } from '../store/slices/uiSlice';

// Re-export for convenience
export type { SimulationProgress } from '../store/slices/uiSlice';

/**
 * Create a new simulation progress object
 */
export function createSimulationProgress(params: {
  total: number;
  type: SimulationProgress['type'];
  status?: string;
  canCancel?: boolean;
  details?: SimulationProgress['details'];
}): SimulationProgress {
  return {
    current: 0,
    total: params.total,
    status: params.status || 'Starting simulation...',
    canCancel: params.canCancel ?? false,
    type: params.type,
    details: params.details,
  };
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (progress: SimulationProgress) => void;

/**
 * Create a progress callback that updates the UI store
 */
export function createProgressCallback(
  updateProgress: (current: number, status?: string) => void,
  startMessage?: string
): ProgressCallback {
  if (startMessage) {
    updateProgress(0, startMessage);
  }

  return (progress: SimulationProgress) => {
    updateProgress(progress.current, progress.status);
  };
}

/**
 * Helper to simulate with progress tracking
 */
export async function simulateWithProgress<T>(
  items: T[],
  simulateFn: (item: T, index: number, progress: ProgressCallback) => Promise<T> | T,
  progressCallback: ProgressCallback,
  statusMessage?: string
): Promise<T[]> {
  const total = items.length;
  const results: T[] = [];

  for (let i = 0; i < total; i++) {
    const item = items[i];
    const currentIndex = i + 1;

    // Update progress before simulating this item
    progressCallback({
      current: currentIndex,
      total,
      status: statusMessage ? `${statusMessage} (${currentIndex}/${total})` : `Processing item ${currentIndex}/${total}`,
      canCancel: false,
      type: 'bulk',
    });

    // Simulate the item
    const result = await simulateFn(item, i, progressCallback);
    results.push(result);
  }

  // Mark as complete
  progressCallback({
    current: total,
    total,
    status: 'Complete',
    canCancel: false,
    type: 'bulk',
  });

  return results;
}

/**
 * Estimate total matches for tournament simulation
 */
export function estimateTournamentMatches(teamCount: number): number {
  if (teamCount <= 2) return 1;
  
  // Single elimination bracket: n-1 matches
  // Double elimination: roughly 2n-2 matches
  // Swiss: approximately 4n matches (varies by format)
  // For now, use single elimination as baseline
  return teamCount - 1;
}

/**
 * Create tournament-specific progress
 */
export function createTournamentProgress(
  tournamentId: string,
  tournamentName: string,
  estimatedMatches: number
): SimulationProgress {
  return createSimulationProgress({
    total: estimatedMatches,
    type: 'tournament',
    status: 'Starting tournament simulation...',
    canCancel: false,
    details: {
      tournamentId,
      tournamentName,
      totalMatches: estimatedMatches,
    },
  });
}

/**
 * Create calendar simulation progress
 */
export function createCalendarProgress(eventCount: number): SimulationProgress {
  return createSimulationProgress({
    total: eventCount,
    type: 'calendar',
    status: 'Processing calendar events...',
    canCancel: false,
  });
}

/**
 * Create match batch simulation progress
 */
export function createMatchProgress(matchCount: number): SimulationProgress {
  return createSimulationProgress({
    total: matchCount,
    type: 'matches',
    status: 'Simulating matches...',
    canCancel: false,
  });
}