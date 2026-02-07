# Per-Player Training Assignment System

## Overview

The new per-player training assignment system allows each player to have different training goals and intensities in a single training session. This enables more flexible and realistic training management.

## Data Structures

### PlayerTrainingAssignment

Represents a single player's training assignment:

```typescript
interface PlayerTrainingAssignment {
  playerId: string;
  goal: TrainingGoal;
  intensity: TrainingIntensity;
  isAutoAssigned: boolean;  // Whether this was auto-assigned by recommendation engine
}
```

### TrainingPlan

A collection of player training assignments for a training session:

```typescript
type TrainingPlan = Map<string, PlayerTrainingAssignment>;
```

The key is the `playerId`, and the value is the assignment for that player.

## Usage

### Creating a Training Plan

```typescript
import type { TrainingPlan, PlayerTrainingAssignment } from '../types';

// Create a new training plan
const plan: TrainingPlan = new Map();

// Add player assignments
plan.set('player1', {
  playerId: 'player1',
  goal: 'mechanical_ceiling',
  intensity: 'intense',
  isAutoAssigned: false,  // User manually selected this
});

plan.set('player2', {
  playerId: 'player2',
  goal: 'leadership_comms',
  intensity: 'moderate',
  isAutoAssigned: true,  // Auto-assigned by recommendation engine
});
```

### Executing a Training Plan

```typescript
import { trainingService } from '../services/TrainingService';

const result = trainingService.executeTrainingPlan(plan);

// Check results for each player
result.results.forEach((playerResult) => {
  if (playerResult.success) {
    console.log(`Player ${playerResult.playerId} trained successfully`);
    console.log(`Goal: ${playerResult.result?.goal}`);
    console.log(`Effectiveness: ${playerResult.result?.effectiveness}`);
  } else {
    console.error(`Training failed for ${playerResult.playerId}: ${playerResult.error}`);
  }
});
```

### Using Auto-Assignments

You can use the recommendation engine to auto-fill assignments:

```typescript
import { trainingService } from '../services/TrainingService';

const plan: TrainingPlan = new Map();

// For each player, get recommended goal and add to plan
const players = trainingService.getTrainablePlayers();
players.forEach((player) => {
  const recommendedGoal = trainingService.getRecommendedGoal(player.id);
  if (recommendedGoal) {
    plan.set(player.id, {
      playerId: player.id,
      goal: recommendedGoal,
      intensity: 'moderate',  // Default intensity
      isAutoAssigned: true,
    });
  }
});

// Execute the plan
const result = trainingService.executeTrainingPlan(plan);
```

## Integration with Single-Modal UX

The per-player assignment system is designed to work with the new single-modal training UX:

1. **Left Column**: Player list with selection
2. **Middle Column**: Training goal selector (per selected player)
3. **Right Column**: Intensity selector and preview (per selected player)

### Workflow:

1. User selects a player → auto-fills recommended goal + last-used intensity
2. User can modify the goal/intensity for that specific player
3. User selects another player → sees/modifies their assignment
4. When satisfied, user submits → `executeTrainingPlan()` trains all players with their individual assignments

### State Management:

The training plan should be maintained as modal-local state (not persisted to the store until training executes). This allows users to:

- Build up assignments for multiple players
- Review and modify assignments before committing
- Cancel without affecting the game state

## Benefits

1. **Flexibility**: Each player can focus on their specific needs
2. **Realistic**: Reflects real-world training where players work on different skills
3. **Efficient**: Single modal for managing all players' training
4. **Intelligent**: Auto-assignment uses recommendation engine to suggest optimal goals
5. **Transparent**: `isAutoAssigned` flag allows UI to show which assignments were auto-generated

## API Reference

### TrainingService Methods

- `executeTrainingPlan(plan: TrainingPlan)` - Execute a training plan with per-player assignments
- `getRecommendedGoal(playerId: string)` - Get recommended training goal for a player
- `getTrainablePlayers()` - Get all players eligible for training
- `previewStatChanges(playerId, goal, intensity)` - Preview stat changes before training
- `previewOvrChange(playerId, goal, intensity)` - Preview OVR change before training

## Related Files

- Types: `src/types/economy.ts`
- Service: `src/services/TrainingService.ts`
- Tests: `src/services/__tests__/TrainingService.executeTrainingPlan.test.ts`
