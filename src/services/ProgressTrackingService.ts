// ProgressTrackingService - Centralized progress tracking for simulations
// Provides a convenient interface for all services to track simulation progress

import { useGameStore } from '../store';
import {
  createSimulationProgress,
  createTournamentProgress,
  createCalendarProgress,
  createMatchProgress,
  estimateTournamentMatches,
  type ProgressCallback,
  type SimulationProgress,
} from '../utils/progress';

export class ProgressTrackingService {
  private activeSession: SimulationProgress | null = null;

  /**
   * Start tracking a new simulation session
   */
  startSimulation(params: {
    type: SimulationProgress['type'];
    total: number;
    status?: string;
    canCancel?: boolean;
    details?: SimulationProgress['details'];
  }): void {
    const progress = createSimulationProgress(params);
    this.activeSession = progress;
    useGameStore.getState().setSimulationProgress(progress);
  }

  /**
   * Start tournament simulation tracking
   */
  startTournamentSimulation(
    tournamentId: string,
    tournamentName: string,
    teamIds: string[]
  ): void {
    const estimatedMatches = estimateTournamentMatches(teamIds.length);
    const progress = createTournamentProgress(tournamentId, tournamentName, estimatedMatches);
    this.activeSession = progress;
    useGameStore.getState().setSimulationProgress(progress);
  }

  /**
   * Start calendar simulation tracking
   */
  startCalendarSimulation(eventCount: number): void {
    const progress = createCalendarProgress(eventCount);
    this.activeSession = progress;
    useGameStore.getState().setSimulationProgress(progress);
  }

  /**
   * Start match batch simulation tracking
   */
  startMatchSimulation(matchCount: number): void {
    const progress = createMatchProgress(matchCount);
    this.activeSession = progress;
    useGameStore.getState().setSimulationProgress(progress);
  }

  /**
   * Update the current simulation progress
   */
  updateProgress(current: number, status?: string, details?: Partial<SimulationProgress['details']>): void {
    if (!this.activeSession) return;

    const updatedProgress: SimulationProgress = {
      ...this.activeSession,
      current,
      ...(status && { status }),
      ...(details && {
        details: { ...this.activeSession.details, ...details },
      }),
    };

    this.activeSession = updatedProgress;
    useGameStore.getState().setSimulationProgress(updatedProgress);
  }

  /**
   * Complete the current simulation
   */
  completeSimulation(status: string = 'Complete'): void {
    if (!this.activeSession) return;

    this.updateProgress(this.activeSession.total, status);
    this.activeSession = null;
  }

  /**
   * Cancel the current simulation
   */
  cancelSimulation(): void {
    if (!this.activeSession) return;

    this.updateProgress(this.activeSession.current, 'Cancelled');
    this.activeSession = null;
  }

  /**
   * Check if there's an active simulation
   */
  isActive(): boolean {
    return this.activeSession !== null;
  }

  /**
   * Get the current progress
   */
  getCurrentProgress(): SimulationProgress | null {
    return this.activeSession;
  }

  /**
   * Create a progress callback for use in loops
   */
  createCallback(statusTemplate?: string): ProgressCallback {
    return (progress: SimulationProgress) => {
      this.updateProgress(
        progress.current,
        statusTemplate ? statusTemplate.replace('{current}', String(progress.current)).replace('{total}', String(progress.total)) : progress.status,
        progress.details
      );
    };
  }

  /**
   * Simulate items with automatic progress tracking
   */
  async simulateWithProgress<T>(
    items: T[],
    simulateFn: (item: T, index: number) => Promise<T> | T,
    options: {
      statusTemplate?: string;
      itemType?: string;
    } = {}
  ): Promise<T[]> {
    if (items.length === 0) return [];

    const { statusTemplate = `Processing {itemType} {current}/{total}`, itemType = 'item' } = options;

    // Start tracking
    this.startSimulation({
      type: 'bulk',
      total: items.length,
      status: statusTemplate.replace('{current}', '0').replace('{total}', String(items.length)).replace('{itemType}', itemType),
      canCancel: false,
    });

    const results: T[] = [];

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Update progress
        this.updateProgress(
          i + 1,
          statusTemplate
            .replace('{current}', String(i + 1))
            .replace('{total}', String(items.length))
            .replace('{itemType}', itemType)
        );

        // Simulate the item
        const result = await simulateFn(item, i);
        results.push(result);
      }

      // Complete simulation
      this.completeSimulation('Simulation complete');
      return results;
    } catch (error) {
      // Cancel simulation on error
      this.cancelSimulation();
      throw error;
    }
  }

  /**
   * Clear the simulation progress from UI (used when simulation is finished elsewhere)
   */
  clearProgress(): void {
    this.activeSession = null;
    useGameStore.getState().setSimulationProgress(null);
  }
}

// Export singleton instance
export const progressTrackingService = new ProgressTrackingService();