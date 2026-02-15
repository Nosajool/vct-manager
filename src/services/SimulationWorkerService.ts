// SimulationWorkerService - Main-thread wrapper for simulation worker
// Provides Promise-based API for offloading compute to Web Worker

import type {
  WorkerRequest,
  WorkerResponse,
  WorkerResult,
  MatchSimInput,
  TrainingInput,
  TrainingBatchInput,
  ScrimInput,
  DramaInput,
  ProgressUpdate,
} from '../workers/types';
import type {
  MatchResult,
  TrainingResult,
  ScrimResult,
  DramaEvaluationResult,
} from '../types';

/**
 * Pending promise for a worker request
 */
interface PendingRequest {
  resolve: (result: WorkerResult) => void;
  reject: (error: Error) => void;
}

/**
 * SimulationWorkerService - Manages Web Worker lifecycle and provides async API
 *
 * Usage:
 *   const service = new SimulationWorkerService();
 *   service.onProgress((update) => console.log(update.stage, update.progress));
 *   const result = await service.simulateMatch({ teamA, teamB, ... });
 */
export class SimulationWorkerService {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingRequest>();
  private progressCallback: ((update: ProgressUpdate) => void) | null = null;
  private requestIdCounter = 0;

  /**
   * Lazy initialization of worker
   * Creates worker on first call, reuses for subsequent calls
   */
  private ensureWorker(): Worker {
    if (!this.worker) {
      // Vite's ?worker import syntax for Web Workers
      this.worker = new Worker(
        new URL('../workers/simulation.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set up message handler
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(event.data);
      };

      // Handle worker errors
      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reject all pending requests
        this.pending.forEach(({ reject }) => {
          reject(new Error('Worker encountered an error'));
        });
        this.pending.clear();
      };
    }

    return this.worker;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${++this.requestIdCounter}`;
  }

  /**
   * Send request to worker and return Promise
   */
  private sendRequest<T extends WorkerResult>(request: WorkerRequest): Promise<T> {
    const worker = this.ensureWorker();

    return new Promise<T>((resolve, reject) => {
      this.pending.set(request.id, {
        resolve: resolve as (result: WorkerResult) => void,
        reject,
      });

      worker.postMessage(request);
    });
  }

  /**
   * Handle incoming messages from worker
   */
  private handleWorkerMessage(response: WorkerResponse): void {
    switch (response.type) {
      case 'RESULT': {
        const pending = this.pending.get(response.id);
        if (pending) {
          pending.resolve(response.payload);
          this.pending.delete(response.id);
        }
        break;
      }

      case 'PROGRESS': {
        if (this.progressCallback) {
          this.progressCallback(response.payload);
        }
        break;
      }

      case 'ERROR': {
        const pending = this.pending.get(response.id);
        if (pending) {
          pending.reject(new Error(response.error));
          this.pending.delete(response.id);
        }
        break;
      }

      default:
        // @ts-expect-error - exhaustiveness check
        console.warn('Unknown worker response type:', response.type);
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Simulate a match between two teams
   */
  async simulateMatch(input: MatchSimInput): Promise<MatchResult> {
    const request: WorkerRequest = {
      type: 'SIMULATE_MATCH',
      id: this.generateRequestId(),
      payload: input,
    };

    const result = await this.sendRequest<WorkerResult>(request);

    if (result.resultType !== 'match') {
      throw new Error(`Expected match result, got ${result.resultType}`);
    }

    return result.data;
  }

  /**
   * Train a single player
   */
  async trainPlayer(input: TrainingInput): Promise<TrainingResult> {
    const request: WorkerRequest = {
      type: 'TRAIN_PLAYER',
      id: this.generateRequestId(),
      payload: input,
    };

    const result = await this.sendRequest<WorkerResult>(request);

    if (result.resultType !== 'training') {
      throw new Error(`Expected training result, got ${result.resultType}`);
    }

    return result.data;
  }

  /**
   * Train multiple players in a batch
   */
  async trainBatch(input: TrainingBatchInput): Promise<TrainingResult[]> {
    const request: WorkerRequest = {
      type: 'TRAIN_BATCH',
      id: this.generateRequestId(),
      payload: input,
    };

    const result = await this.sendRequest<WorkerResult>(request);

    if (result.resultType !== 'training_batch') {
      throw new Error(`Expected training_batch result, got ${result.resultType}`);
    }

    return result.data;
  }

  /**
   * Resolve a scrim session
   */
  async resolveScrim(input: ScrimInput): Promise<ScrimResult> {
    const request: WorkerRequest = {
      type: 'RESOLVE_SCRIM',
      id: this.generateRequestId(),
      payload: input,
    };

    const result = await this.sendRequest<WorkerResult>(request);

    if (result.resultType !== 'scrim') {
      throw new Error(`Expected scrim result, got ${result.resultType}`);
    }

    return result.data;
  }

  /**
   * Evaluate drama triggers
   */
  async evaluateDrama(input: DramaInput): Promise<DramaEvaluationResult> {
    const request: WorkerRequest = {
      type: 'EVALUATE_DRAMA',
      id: this.generateRequestId(),
      payload: input,
    };

    const result = await this.sendRequest<WorkerResult>(request);

    if (result.resultType !== 'drama') {
      throw new Error(`Expected drama result, got ${result.resultType}`);
    }

    return result.data;
  }

  /**
   * Set callback for progress updates
   * Call with null to clear the callback
   */
  onProgress(callback: ((update: ProgressUpdate) => void) | null): void {
    this.progressCallback = callback;
  }

  /**
   * Terminate the worker and clean up resources
   * Call this when the service is no longer needed
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending requests
    this.pending.forEach(({ reject }) => {
      reject(new Error('Worker was terminated'));
    });
    this.pending.clear();

    this.progressCallback = null;
  }

  /**
   * Check if worker is currently active
   */
  get isActive(): boolean {
    return this.worker !== null;
  }

  /**
   * Get number of pending requests
   */
  get pendingCount(): number {
    return this.pending.size;
  }
}

// Singleton instance for global use
// Services can import this instance rather than creating their own
export const simulationWorkerService = new SimulationWorkerService();
