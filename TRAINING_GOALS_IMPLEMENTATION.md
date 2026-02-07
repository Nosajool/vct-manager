# Training Goals Implementation Summary

## Overview
Implemented a goal-based training system to replace the raw stat-based `TrainingFocus` with user-friendly `TrainingGoal` options.

## New Types Added (`src/types/economy.ts`)

### TrainingGoal Enum
- `role_mastery_entry` - Entry fragging role training
- `role_mastery_lurk` - Lurk/flank role training
- `role_mastery_support` - Support/utility role training
- `mechanical_ceiling` - Raw aim and gunplay improvement
- `decision_making` - Mid-round decisions, clutch play, composure
- `leadership_comms` - IGL skills, callouts, team coordination
- `all_round_growth` - Balanced improvement across all stats

### GoalMapping Interface
```typescript
interface GoalMapping {
  displayName: string;           // UI-friendly name
  description: string;            // Detailed description
  primaryStats: string[];         // Full boost stats
  secondaryStats: string[];       // Partial boost stats
  previewDescriptors: string[];   // UI preview text (e.g., '+First Blood Rate')
  underlyingFocus: TrainingFocus; // Backward compatibility mapping
}
```

### TRAINING_GOAL_MAPPINGS
Complete configuration object mapping each `TrainingGoal` to its:
- Display information
- Affected stats (primary/secondary)
- Preview descriptors for UI
- Underlying `TrainingFocus` for backward compatibility

## Updated PlayerDevelopment Class (`src/engine/player/PlayerDevelopment.ts`)

### New Methods
1. **`goalToFocus(goal: TrainingGoal): TrainingFocus`** (static)
   - Converts a training goal to its underlying focus
   - Enables backward compatibility

2. **`getGoalInfo(goal: TrainingGoal): GoalMapping`** (static)
   - Returns complete goal information

3. **`getAllGoals(): TrainingGoal[]`** (static)
   - Returns all available training goals

4. **`trainPlayerWithGoal(player, goal, intensity, coachBonus): TrainingResult`**
   - Trains a player using a goal
   - Delegates to existing `trainPlayer` method
   - Adds goal field to result for tracking

5. **`getRecommendedGoal(player: Player): TrainingGoal`**
   - Recommends a goal based on player's weakest stats
   - Replaces `getRecommendedFocus` for new system

## Backward Compatibility

The system maintains full backward compatibility:
- `TrainingFocus` type is preserved
- `TrainingSession` and `TrainingResult` support both `focus` (legacy) and `goal` (new)
- Existing training logic unchanged
- Goals map to underlying focuses internally

## Example Usage

```typescript
import { playerDevelopment, TRAINING_GOAL_MAPPINGS } from './path/to/files';

// Get all available goals
const goals = playerDevelopment.getAllGoals();

// Get goal information
const goalInfo = TRAINING_GOAL_MAPPINGS.mechanical_ceiling;
console.log(goalInfo.displayName); // "Mechanical Ceiling"
console.log(goalInfo.previewDescriptors); // ['+Aim Precision', '+Spray Control', '+Flick Shots']

// Train with a goal
const result = playerDevelopment.trainPlayerWithGoal(
  player,
  'mechanical_ceiling',
  'intense',
  15 // coach bonus
);

// Get recommended goal
const recommended = playerDevelopment.getRecommendedGoal(player);
```

## Next Steps (Dependent Tasks)

The following tasks depend on this foundation:
- `vct-manager-5q1` - Single-modal training layout (3-column)
- `vct-manager-9nm` - Training outcome preview calculations
- `vct-manager-b47` - Goal-based training selector UI
- `vct-manager-eyd` - Update recommendation engine for goal-based system
- `vct-manager-go9` - Auto-assign optimal training algorithm
- `vct-manager-ruh` - Enhanced player list with Starting 5 / Bench split

## Files Modified
1. `/src/types/economy.ts` - Added goal types and mappings
2. `/src/engine/player/PlayerDevelopment.ts` - Added goal-based methods
3. `/src/types/index.ts` - Exported new types
