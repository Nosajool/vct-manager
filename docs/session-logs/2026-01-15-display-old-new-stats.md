# Session Log: Display Old/New Stats in Training/Scrim Results

**Date:** 2026-01-15
**Feature:** Display old and new stats in "old → new" format for training and scrim results

## Summary

Implemented the feature to show "old → new" format for stat changes in both training and scrim results. This provides better visibility into player and team progression.

## Changes Made

### Type Definitions

**`src/types/economy.ts`**
- Added optional `statsBefore?: Record<string, number>` field to `TrainingResult`
- Added optional `moraleBefore?: number` field to `TrainingResult`
- These are populated by the service layer after engine processing

**`src/types/scrim.ts`**
- Added `chemistryBefore: number` field to `ScrimResult`
- Added `relationshipBefore: number` field to `ScrimResult`
- Added `mapStatsBefore: Record<string, MapStrengthAttributes>` field to `ScrimResult`

### Services

**`src/services/TrainingService.ts`**
- Captures `statsBefore` snapshot of player stats before training
- Captures `moraleBefore` value before training
- Adds these to the result after engine processing

**`src/services/ScrimService.ts`**
- Captures `chemistryBefore` from team chemistry before scrim
- Captures `relationshipBefore` from existing relationship score
- Captures `mapStatsBefore` for all maps being practiced
- Adds all values to the scrim result

### UI Components

**`src/components/calendar/TrainingModal.tsx`**
- Updated results display to show all stats with "old → new" format
- Shows unchanged stats in gray, improved stats in green
- Morale now shows "old → new" format
- Includes fallback to original "+X" format if before values unavailable

**`src/components/scrim/ScrimModal.tsx`**
- Chemistry now displays as "old → new" format (e.g., "82.3 → 84.5")
- Relationship now displays as "old → new" format (e.g., "45 → 48")
- Map improvements show "old → new" for each attribute
- Grid layout updated from 3 columns to 2 for better readability

## Approach Improvement

The original spec proposed storing both `oldStats` AND `newStats` which would be redundant since `newStats = oldStats + improvements`.

**Our cleaner approach:**
- Store only "before" snapshots
- Compute "after" = "before" + "change" in the UI
- Avoids data redundancy
- Keeps existing code working (change amounts still stored)
- Service layer adds context, engine stays pure

## Architecture Compliance

- **Engine layer**: No changes - pure functions remain pure
- **Services layer**: Captures "before" values and adds to results
- **UI layer**: Computes "after" values and renders "old → new" format
- **Types**: New fields are optional to maintain backward compatibility

## Testing

- TypeScript compilation: Passed
- Build: Successful
- No test files in project (no tests to run)

## Files Modified

1. `src/types/economy.ts` - Added TrainingResult before snapshot fields
2. `src/types/scrim.ts` - Added ScrimResult before snapshot fields
3. `src/services/TrainingService.ts` - Capture before values in trainPlayer()
4. `src/services/ScrimService.ts` - Capture before values in scheduleScrim()
5. `src/components/calendar/TrainingModal.tsx` - Updated results display
6. `src/components/scrim/ScrimModal.tsx` - Updated results display

## Example Output

### Training Results
```
Training Complete!
Player Name - Effectiveness: 80%
mechanics: 82 → 84
igl: 78 → 78
mental: 75 → 78
...
Morale: 85 → 84
```

### Scrim Results
```
Scrim Complete!
vs Cloud90 - 1
Chemistry: 82.3 → 84.5
Relationship: 45 → 48
Map Improvements:
  Bind
    executes: 65.2 → 67.4
    retakes: 68.1 → 69.3
    ...
```
