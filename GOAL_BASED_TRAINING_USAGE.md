# Goal-Based Training System - Usage Guide

This document describes how to use the new goal-based training recommendation system.

## Overview

The goal-based training system provides a more intuitive training experience by recommending training goals (e.g., "Mechanical Ceiling", "Leadership & Comms") instead of raw stat focuses. The system analyzes player weaknesses and suggests the most beneficial training approach.

## Key Changes

### PlayerDevelopment (Engine Layer)

Already implemented (from vct-manager-2v9):

- `getRecommendedGoal(player: Player): TrainingGoal` - Recommends goal based on player's weakest stats
- `trainPlayerWithGoal(player, goal, intensity, coachBonus)` - Trains using a goal
- Static methods:
  - `PlayerDevelopment.getGoalInfo(goal)` - Get goal metadata (display name, description, affected stats)
  - `PlayerDevelopment.getAllGoals()` - Get all available training goals
  - `PlayerDevelopment.goalToFocus(goal)` - Convert goal to underlying focus

### TrainingService (Service Layer) - NEW

New methods added to expose goal-based functionality:

1. **Get Recommended Goal**
   ```typescript
   const goal = trainingService.getRecommendedGoal(playerId);
   // Returns: TrainingGoal | null
   // Example: 'mechanical_ceiling' for player with low mechanics
   ```

2. **Get Goal Information**
   ```typescript
   const info = trainingService.getGoalInfo('mechanical_ceiling');
   /* Returns:
   {
     displayName: 'Mechanical Ceiling',
     description: 'Raw aim and gunplay training...',
     primaryStats: ['mechanics'],
     secondaryStats: ['clutch', 'entry'],
     previewDescriptors: ['+Aim Precision', '+Spray Control', '+Flick Shots'],
     underlyingFocus: 'mechanics'
   }
   */
   ```

3. **Get All Available Goals**
   ```typescript
   const goals = trainingService.getAllGoals();
   // Returns: TrainingGoal[]
   // ['role_mastery_entry', 'role_mastery_lurk', 'role_mastery_support', ...]
   ```

4. **Train Player with Goal**
   ```typescript
   const result = trainingService.trainPlayerWithGoal(
     playerId,
     'mechanical_ceiling',
     'moderate'
   );
   /* Returns:
   {
     success: true,
     result: {
       playerId: 'p1',
       focus: 'mechanics', // Underlying focus
       goal: 'mechanical_ceiling', // Goal used
       statImprovements: { mechanics: 2, clutch: 1 },
       effectiveness: 75,
       moraleChange: 1,
       fatigueIncrease: 10,
       ...
     }
   }
   */
   ```

5. **Preview Training Effectiveness**
   ```typescript
   const effectiveness = trainingService.previewTrainingEffectiveness(
     playerId,
     'moderate',
     'mechanical_ceiling' // Optional - goal doesn't affect effectiveness calculation
   );
   // Returns: number (0-100) or null
   ```

## Training Goals

The system includes 7 training goals:

1. **role_mastery_entry** - Entry Fragging Mastery
2. **role_mastery_lurk** - Lurk & Flank Mastery
3. **role_mastery_support** - Support & Utility Mastery
4. **mechanical_ceiling** - Mechanical Ceiling (aim training)
5. **decision_making** - Decision Making (mental + clutch)
6. **leadership_comms** - Leadership & Comms (IGL)
7. **all_round_growth** - All-Round Growth (balanced)

## Recommendation Logic

The `getRecommendedGoal()` method:
1. Analyzes all player stats
2. Identifies the weakest stat
3. Maps it to the most beneficial training goal:
   - Low mechanics → `mechanical_ceiling`
   - Low IGL → `leadership_comms`
   - Low mental/clutch → `decision_making`
   - Low entry → `role_mastery_entry`
   - Low lurking → `role_mastery_lurk`
   - Low support → `role_mastery_support`
   - Balanced/uncertain → `all_round_growth`

## Backward Compatibility

The old `trainPlayer(playerId, focus, intensity)` method still works and is fully supported. Both systems can coexist:

- **Legacy**: `trainPlayer('p1', 'mechanics', 'moderate')`
- **New**: `trainPlayerWithGoal('p1', 'mechanical_ceiling', 'moderate')`

Both achieve the same stat improvements - goals just provide better UX and semantics.

## Integration Example

```typescript
import { trainingService } from '@/services';

// Get all trainable players
const players = trainingService.getTrainablePlayers();

// For each player, get recommended goal
players.forEach(player => {
  const recommendedGoal = trainingService.getRecommendedGoal(player.id);
  const goalInfo = trainingService.getGoalInfo(recommendedGoal);

  console.log(`${player.name}: ${goalInfo.displayName}`);
  console.log(`  ${goalInfo.description}`);
  console.log(`  Preview: ${goalInfo.previewDescriptors.join(', ')}`);

  // Preview effectiveness
  const effectiveness = trainingService.previewTrainingEffectiveness(
    player.id,
    'moderate'
  );
  console.log(`  Effectiveness: ${effectiveness}%`);
});

// Train a player with recommended goal
const result = trainingService.trainPlayerWithGoal(
  players[0].id,
  recommendedGoal,
  'moderate'
);

if (result.success) {
  console.log(`Training complete! Stats improved:`, result.result.statImprovements);
} else {
  console.error(`Training failed:`, result.error);
}
```

## Testing

Comprehensive tests are available in:
- `/src/services/__tests__/TrainingService.goals.test.ts`

Run tests with:
```bash
npm test -- TrainingService.goals.test.ts
```

## Next Steps

This update (vct-manager-eyd) completes the recommendation engine. Upcoming tasks:

- **vct-manager-9nm**: Training outcome preview calculations
- **vct-manager-go9**: Auto-assign optimal training algorithm
- **vct-manager-5q1**: Single-modal training layout UI
- **vct-manager-b47**: Goal-based training selector UI
- **vct-manager-ai8**: Intensity selector with consequence preview panel

These will build on top of this recommendation engine to create the complete goal-based training UX.
