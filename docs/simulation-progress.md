# Simulation Progress Tracking Usage

This document explains how to use the new simulation progress tracking system in VCT Manager.

## Overview

The simulation progress tracking system allows services to show real-time progress for long-running operations like tournament simulations, calendar processing, and batch match simulations.

## Core Components

### 1. ProgressTrackingService

A centralized service that manages all simulation progress tracking.

```typescript
import { progressTrackingService } from '../services/ProgressTrackingService';

// Start tournament simulation
progressTrackingService.startTournamentSimulation(
  tournamentId,
  tournamentName,
  teamIds
);

// Update progress
progressTrackingService.updateProgress(current, status, details);

// Complete simulation
progressTrackingService.completeSimulation('Complete');
```

### 2. UI Store Integration

Progress state is stored in the UI slice:

```typescript
interface SimulationProgress {
  current: number;
  total: number;
  status: string;
  canCancel: boolean;
  type: 'bulk' | 'tournament' | 'calendar' | 'matches';
  details?: {
    tournamentId?: string;
    tournamentName?: string;
    currentMatch?: string;
    totalMatches?: number;
  };
}
```

### 3. useSimulationProgress Hook

Easy access to progress state in components:

```typescript
import { useSimulationProgress } from '../hooks/useSimulationProgress';

function SimulationProgressModal() {
  const { progress, percentage, status, type, isActive } = useSimulationProgress();
  
  if (!isActive) return null;
  
  return (
    <div className="progress-modal">
      <h3>{type}</h3>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p>{status}</p>
      <span>{progress.current}/{progress.total}</span>
    </div>
  );
}
```

## Service Integration

### TournamentService

```typescript
// Enable progress tracking
const { results, champion } = tournamentService.simulateTournament(
  tournamentId, 
  withProgress: true  // Enable progress tracking
);
```

### CalendarService

```typescript
// Enable progress tracking for day advancement
const result = calendarService.advanceDay(withProgress: true);
```

### MatchService

```typescript
// Simulate multiple matches with progress
const results = await matchService.simulateMatches(
  matchIds, 
  withProgress: true
);
```

## Direct Service Usage

Services can also use the ProgressTrackingService directly for custom progress tracking:

```typescript
export class CustomSimulationService {
  async runComplexSimulation(data: any[], withProgress?: boolean) {
    if (withProgress) {
      progressTrackingService.startSimulation({
        type: 'bulk',
        total: data.length,
        status: 'Starting custom simulation...',
        canCancel: false,
      });
    }

    try {
      for (let i = 0; i < data.length; i++) {
        if (withProgress) {
          progressTrackingService.updateProgress(
            i + 1,
            `Processing item ${i + 1}/${data.length}`
          );
        }
        
        await this.processItem(data[i]);
      }

      if (withProgress) {
        progressTrackingService.completeSimulation('Custom simulation complete');
      }
    } catch (error) {
      if (withProgress) {
        progressTrackingService.cancelSimulation();
      }
      throw error;
    }
  }
}
```

## UI Integration Examples

### Progress Bar Component

```typescript
function ProgressBar({ progress }: { progress: SimulationProgress }) {
  const percentage = Math.round((progress.current / progress.total) * 100);
  
  return (
    <div className="progress-container">
      <div className="progress-bar-bg">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="progress-text">
        {progress.current} / {progress.total} ({percentage}%)
      </div>
    </div>
  );
}
```

### Simulation Status Component

```typescript
function SimulationStatus() {
  const { progress, isActive, type, status, clearProgress } = useSimulationProgress();
  
  if (!isActive) return null;
  
  return (
    <div className="simulation-status">
      <h4>{type}</h4>
      <p>{status}</p>
      {progress && <ProgressBar progress={progress} />}
      <button onClick={clearProgress}>
        Dismiss
      </button>
    </div>
  );
}
```

## Best Practices

1. **Always clear progress** when simulation completes or is cancelled
2. **Use descriptive status messages** that help users understand what's happening
3. **Provide estimated totals** when possible to give users context
4. **Handle errors gracefully** by cancelling progress tracking on exceptions
5. **Use the hook in components** rather than accessing the store directly
6. **Test progress tracking** with both enabled and disabled states

## Integration Points

The progress tracking system is now integrated into:

- `TournamentService.simulateTournament()` and `simulateTournamentRound()`
- `CalendarService.advanceDay()`
- `MatchService.simulateMatches()`
- `ProgressTrackingService` for custom implementations

Components can consume progress state through the `useSimulationProgress()` hook.