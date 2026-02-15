# Web Worker Infrastructure

This directory contains the Web Worker implementation for offloading heavy simulation compute from the main thread.

## Architecture

```
Main Thread                              Worker Thread
┌──────────────────────┐                ┌──────────────────────┐
│ CalendarService      │  postMessage   │ SimulationWorker     │
│  (orchestrator)      │ ──────────────>│                      │
│                      │                │  MatchSimulator      │
│  1. Read store state │  results back  │  ScrimEngine         │
│  2. Send compute job │ <──────────────│  PlayerDevelopment   │
│  3. Apply results    │                │  DramaEngine         │
│     to store         │  progress msgs │                      │
│  4. Update UI        │ <──────────────│                      │
└──────────────────────┘                └──────────────────────┘
```

## Files

- **`types.ts`** - Message protocol with discriminated unions for type-safe communication
- **`simulation.worker.ts`** - Worker entry point that handles all simulation requests
- **`../services/SimulationWorkerService.ts`** - Main-thread wrapper with Promise-based API

## Usage

### Basic Example

```typescript
import { simulationWorkerService } from '@/services/SimulationWorkerService';

// Set up progress callback (optional)
simulationWorkerService.onProgress((update) => {
  console.log(`${update.stage}: ${update.progress}%`);
});

// Simulate a match
const result = await simulationWorkerService.simulateMatch({
  teamA,
  teamB,
  playersA,
  playersB,
  strategyA,
  strategyB,
});

// Process results
console.log('Match winner:', result.winnerId);
```

### Supported Operations

#### Match Simulation

```typescript
const result: MatchResult = await simulationWorkerService.simulateMatch({
  teamA: Team,
  teamB: Team,
  playersA: Player[],
  playersB: Player[],
  strategyA?: TeamStrategy,
  strategyB?: TeamStrategy,
});
```

#### Player Training

```typescript
// Single player
const result: TrainingResult = await simulationWorkerService.trainPlayer({
  player: Player,
  goal: TrainingGoal,
  intensity: TrainingIntensity,
  coachBonus: number,
});

// Batch training (multiple players)
const results: TrainingResult[] = await simulationWorkerService.trainBatch({
  assignments: [
    { player, goal, intensity, coachBonus },
    { player, goal, intensity, coachBonus },
    // ...
  ],
});
```

#### Scrim Resolution

```typescript
const result: ScrimResult = await simulationWorkerService.resolveScrim({
  playerTeam: Team,
  partnerTeam: TierTeam | (Team & { tier: TeamTier }),
  playerTeamPlayers: Player[],
  partnerTeamPlayers: Player[],
  options: ScrimOptions,
  relationship: ScrimRelationship,
  mapPool: MapPoolStrength,
  currentDate: string,
  playerTeamStrength: number,
  partnerTeamStrength: number,
  chemistryBefore: number,
  relationshipBefore: number,
});
```

#### Drama Evaluation

```typescript
const result: DramaEvaluationResult = await simulationWorkerService.evaluateDrama({
  snapshot: DramaGameStateSnapshot,
  templates: DramaEventTemplate[],
});
```

### Progress Tracking

```typescript
// Set up progress callback
simulationWorkerService.onProgress((update: ProgressUpdate) => {
  console.log(`Stage: ${update.stage}`);
  console.log(`Progress: ${update.progress}%`);
  if (update.details) {
    console.log(`Details: ${update.details}`);
  }
});

// Clear progress callback
simulationWorkerService.onProgress(null);
```

### Cleanup

```typescript
// Terminate worker when no longer needed
// (e.g., when service is destroyed or user logs out)
simulationWorkerService.terminate();
```

## Implementation Status

### Phase 1: Infrastructure ✅ (Current)

- [x] Worker message protocol types
- [x] Worker implementation with all engines
- [x] SimulationWorkerService with Promise-based API
- [x] Progress reporting
- [x] Error handling

### Phase 2: Match Simulation (Next)

- [ ] Update `MatchService.simulateMatch()` to use worker
- [ ] Update `CalendarService.processMatchEvent()` for async flow
- [ ] Remove `setTimeout(0)` hack after testing

### Phase 3: Scrim Resolution

- [ ] Update `ScrimService.scheduleScrim()` to use worker
- [ ] Update `ActivityResolutionService` scrim path

### Phase 4: Training Batch

- [ ] Update `ActivityResolutionService` to batch training calls
- [ ] Use `trainBatch()` for multiple players

### Phase 5: Progress UI Integration

- [ ] Connect worker progress to `ProgressTrackingService`
- [ ] Wire up `SimulationProgressModal` in `TimeBar.tsx`

### Phase 6: Cleanup

- [ ] Remove all `setTimeout(0)` hacks
- [ ] Remove synchronous fallback paths

## Technical Notes

### Worker Lifecycle

- Worker is lazily initialized on first API call
- Single worker instance handles all compute tasks sequentially
- Worker is reused across the session for performance
- Call `terminate()` to clean up when done

### Error Handling

All worker operations are wrapped in try/catch:
- Worker-side errors are sent back as `ERROR` responses
- Main-thread API rejects Promises with descriptive errors
- Pending requests are rejected if worker crashes or is terminated

### Type Safety

All communication uses discriminated unions for type safety:
- `WorkerRequest` - Tagged union of all request types
- `WorkerResponse` - Tagged union of all response types
- `WorkerResult` - Tagged union of all result payloads

TypeScript ensures exhaustive handling of all message types.

### Serialization

All data passed between threads must be serializable (structured clone algorithm):
- Plain objects ✅
- Arrays ✅
- Primitives ✅
- Functions ❌
- Store references ❌
- DOM nodes ❌

All engine functions are pure and only use serializable data.

## Testing

To test the worker locally:

```typescript
import { simulationWorkerService } from '@/services/SimulationWorkerService';

// Enable console logging for progress
simulationWorkerService.onProgress((update) => {
  console.log(`[Worker Progress] ${update.stage}: ${update.progress}%`);
});

// Run a test simulation
const testMatch = await simulationWorkerService.simulateMatch({
  // ... test data
});

console.log('Worker test successful!', testMatch);
```

## Performance

Expected performance improvements:
- **Match simulation**: 200-500ms per match → non-blocking, UI stays responsive
- **Scrim resolution**: 300-800ms → non-blocking
- **Training batch**: ~1ms per player → negligible but allows future scaling

The UI will remain fully responsive during all simulation operations.
