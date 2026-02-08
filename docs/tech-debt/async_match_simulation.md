Scalable Architecture Match Simulation (Web Worker)

     Overview
     Move all simulation logic to a Web Worker for true background processing. This provides:
     - Zero UI freeze during bulk operations
     - Clean separation of concerns
     - Foundation for future features (cancel, pause, real-time updates)

     ─────────────────────────────────────────────────────────────────────────────────────
     TEMPORARY UX FIX (LoadingOverlay Visibility)
     ─────────────────────────────────────────────────────────────────────────────────────

     Issue: LoadingOverlay wasn't appearing when clicking "Advance Day" or "Play Match"
     because CalendarService.advanceDay() was synchronous. The function completed so fast
     that React didn't have time to render the overlay before the loading state was cleared.

     Solution: Two-part fix to ensure overlay renders before blocking work:
     
     1. TimeBar.tsx: Yield to event loop before calling advanceDay()
        ```typescript
        await new Promise(resolve => setTimeout(resolve, 0));
        const result = await advanceFn(true);
        ```
     
     2. CalendarService.ts: Artificial delay at START of advanceDay()
        ```typescript
        if (withProgress && unprocessedEvents.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        ```
     
     This ensures:
     - Loading overlay renders immediately (event loop yields)
     - 0ms delay is imperceptible
     - Blocking simulation work happens after overlay is visible

     This is a TEMPORARY fix. The delay should be removed when:
     1. Web Worker infrastructure is implemented (Phases 1-6 below)
     2. Match simulation runs truly asynchronously
     3. Progress updates come from the worker in real-time

     ─────────────────────────────────────────────────────────────────────────────────────

     Architecture Diagram

     ┌─────────────────────────────────────────────────────────┐
     │                     MAIN THREAD                         │
     │  ┌─────────┐    ┌─────────┐    ┌───────────────────┐    │
     │  │ TimeBar │    │  Store  │    │ SimulationModal  │    │
     │  └────┬────┘    └────┬────┘    └───────────────────┘    │
     │       │              │                                 │
     │       └──────────────┴── postMessage ─────────────────┘
     │                          │
     │  ┌────────────────────────▼───────────────────────────┐  │
     │  │                   WORKER THREAD                    │  │
     │  │  ┌─────────────┐  ┌────────────┐  ┌──────────┐   │  │
     │  │  │ WorkerEntry │  │ Simulation │  │ Engines  │   │  │
     │  │  │    Point    │  │  Orchestrator│ │(pure fns)│   │  │
     │  │  └─────────────┘  └────────────┘  └──────────┘   │  │
     │  └────────────────────────────────────────────────────┘  │
     └─────────────────────────────────────────────────────────┘

     Phase 1: Extract Pure Engines (Already Mostly Done)

     | Engine | Location | Status |
     |--------|----------|--------|
     | TimeProgression | src/engine/calendar/timeProgression.ts | ✅ Pure |
     | EventScheduler | src/engine/calendar/eventScheduler.ts | ✅ Pure |
     | MatchSimulator | src/engine/match/matchSimulator.ts | ✅ Pure |
     | BracketManager | src/engine/competition/bracketManager.ts | ✅ Pure |
     | TournamentEngine | src/engine/competition/tournamentEngine.ts | ✅ Pure |
     | EconomyEngine | src/engine/team/economyEngine.ts | ✅ Pure |

     Phase 2: Refactor Services to Pure Functions

     Pattern: Convert stateful service methods to pure functions accepting all dependencies as parameters.

     Example: MatchService.ts

     // BEFORE (current)
     class MatchService {
       simulateMatch(matchId: string): MatchResult | null {
         const state = useGameStore.getState(); // ❌ Can't use in worker
         const match = state.matches[matchId];
         // ...
       }
     }

     // AFTER (worker-compatible)
     class MatchService {
       static simulateMatch(
         matchId: string,
         matches: Record<string, Match>,
         teams: Record<string, Team>,
         players: Record<string, Player>,
         strategies: Record<string, TeamStrategy>
       ): MatchResult | null {
         // Pure function using passed state
       }
     }

     Services to Refactor:
     1. MatchService - 14+ store calls
     2. TournamentService - 50+ store calls
     3. EconomyService - 10+ store calls
     4. TeamSlotResolver - 15+ store calls
     5. CalendarService - Heavy store usage

     Phase 3: Create Worker Entry Point

     File: src/workers/calendar.worker.ts
     // Worker entry point - handles calendar simulation off main thread

     import { calendarEngine } from '../engine/calendar/calendarEngine';
     import type { AdvanceDayInput, AdvanceDayResult, ProgressUpdate } from './types';

     self.onmessage = (event: MessageEvent<AdvanceDayInput>) => {
       const { type, payload } = event.data;

       if (type === 'ADVANCE_DAY') {
         try {
           const result = calendarEngine.advanceDay(payload, {
             onProgress: (progress: ProgressUpdate) => {
               self.postMessage({ type: 'PROGRESS', payload: progress });
             }
           });
           self.postMessage({ type: 'COMPLETE', payload: result });
         } catch (error) {
           self.postMessage({ type: 'ERROR', payload: error });
         }
       }
     };

     File: src/workers/types.ts
     // Shared types for worker communication

     export interface AdvanceDayInput {
       currentDate: string;
       scheduledEvents: CalendarEvent[];
       teams: Record<string, Team>;
       players: Record<string, Player>;
       matches: Record<string, Match>;
       tournaments: Record<string, Tournament>;
       calendar: {
         currentPhase: SeasonPhase;
         currentSeason: number;
         currentDate: string;
       };
       playerTeamId: string;
       lastSaveDate: string | null;
     }

     export interface AdvanceDayResult {
       success: boolean;
       newDate: string;
       processedEventIds: string[];
       skippedEventIds: string[];
       simulatedMatches: MatchResult[];
       newlyUnlockedFeatures: FeatureUnlock[];
       autoSaveTriggered: boolean;
     }
     export interface ProgressUpdate {
       current: number;
       total: number;
       status: string;
     }

     export type WorkerMessage =
       | { type: 'ADVANCE_DAY'; payload: AdvanceDayInput }
       | { type: 'PROGRESS'; payload: ProgressUpdate }
       | { type: 'COMPLETE'; payload: AdvanceDayResult }
       | { type: 'ERROR'; payload: Error };

     Phase 4: Create Worker Manager Service

     File: src/services/CalendarWorkerService.ts
     // Orchestrates worker communication

     import Worker from '../workers/calendar.worker.ts?worker';
     import type { AdvanceDayInput, AdvanceDayResult, ProgressUpdate, WorkerMessage } from '../workers/types';

     export class CalendarWorkerService {
       private worker: Worker | null = null;
       private progressCallback: ((progress: ProgressUpdate) => void) | null = null;

       advanceDay(
         input: AdvanceDayInput,
         options: {
           onProgress?: (progress: ProgressUpdate) => void;
         } = {}
       ): Promise<AdvanceDayResult> {
         return new Promise((resolve, reject) => {
           this.progressCallback = options.onProgress || null;

           this.worker = new Worker();

           this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
             const { type, payload } = event.data;

             switch (type) {
               case 'PROGRESS':
                 this.progressCallback?.(payload);
                 break;
               case 'COMPLETE':
                 this.terminate();
                 resolve(payload);
                break;
               case 'ERROR':
                 this.terminate();
                 reject(new Error(payload.message));
                 break;
             }
           };

           this.worker.onerror = (error) => {
             this.terminate();
             reject(error);
           };

           this.worker.postMessage({ type: 'ADVANCE_DAY', payload: input });
         });
       }

       terminate(): void {
         this.worker?.terminate();
         this.worker = null;
       }
     }

     export const calendarWorkerService = new CalendarWorkerService();

     Phase 5: Update UI Components

     TimeBar.tsx:
     const handleAdvanceDay = async () => {
       setIsAdvancing(true);

       // Show progress modal immediately
       setShowProgressModal(true);

       try {
         const result = await calendarWorkerService.advanceDay({
           // ... serialize current state ...
         });

         // Handle results...
       } finally {
         setIsAdvancing(false);
         setShowProgressModal(false);
       }
     };

     SimulationProgressModal.tsx:
     - Subscribe to progress updates from worker service
     - Update progress bar in real-time
     - Show cancel button (sends termination signal to worker)

     Phase 6: Error Handling & Edge Cases

     1. Worker Termination: Handle user cancellation gracefully
     2. State Snapshot: Worker operates on snapshot; implement merge strategy
     3. Timeout Handling: Max simulation time to prevent stuck workers
     4. Progress Serialization: Ensure progress objects are serializable

     Effort Estimate

     | Phase | Effort | Complexity |
     |-------|--------|------------|
     | Phase 1: Pure Engines | 0 hrs (already done) | Low |
     | Phase 2: Refactor Services | 8-12 hrs | Medium |
     | Phase 3: Worker Entry | 2-3 hrs | Low |
     | Phase 4: Worker Service | 3-4 hrs | Medium |
     | Phase 5: UI Integration | 2-3 hrs | Low |
     | Phase 6: Error Handling | 2-3 hrs | Medium |
     | Total | 17-25 hrs | - |

     Future Extensions

     Once the worker infrastructure is in place, adding these features becomes trivial:

     1. Bulk Simulation: Simulate entire season in background
     2. Pause/Resume: Worker can pause and resume long simulations
     3. Background Saving: Auto-save while user continues playing
     4. Progress Notifications: macOS-style progress in dock/menu bar
     5. Resource Throttling: performance.workerIdleBusy for adaptive processing

