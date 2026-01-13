# Training Capacity Indicator - Session Log

**Date:** 2026-01-12
**Author:** Minimax M2.1

## Problem

When performing training from Today's Activities, the training option was being removed from the list after any training session was completed. This was inconsistent with the Schedule tab behavior where training remains available.

The issue was that each player on the team can have 2 training sessions per week, but the training activity was being marked as processed after any single player's training session, hiding the option for other players who still had capacity.

## Root Cause

In `TrainingService.ts`, after a training session completed, the code was calling `state.markEventProcessed(trainingEvent.id)` which removed the training event from Today's Activities entirely.

```typescript
// Old code that caused the issue
const trainingEvent = todaysActivities.find((e) => e.type === 'training_available');
if (trainingEvent) {
  state.markEventProcessed(trainingEvent.id);
}
```

## Solution

### 1. TrainingService.ts
- Removed the `markEventProcessed` call for training events
- Added a comment explaining the rationale for not marking events as processed
- Training now remains available until all players reach their weekly limit (2 sessions per player)

### 2. TodayActivities.tsx
- Added `trainingService` import
- Added `trainingSummary` to get team training capacity
- Updated the Training button to show a capacity indicator: `{playersCanTrain}/{totalPlayers} players can train`
- Added disabled state when all players have reached their weekly limit
- Added descriptive text when at capacity: "All players have reached their weekly training limit"

## Behavior Changes

| Before | After |
|--------|-------|
| Training disappears after any player's session | Training stays visible until all players at limit |
| No capacity indicator shown | Shows "X/Y players can train" |
| Inconsistent with Schedule tab | Consistent with Schedule tab behavior |

## Files Modified

1. `src/services/TrainingService.ts` - Removed event processing
2. `src/components/calendar/TodayActivities.tsx` - Added capacity indicator

## UI Changes

The Training button in Today's Activities now:
- Shows a capacity badge: "3/5 players can train" (matching scrims pattern)
- Is disabled with a message when all players are at capacity
- Remains visible throughout the week until weekly reset

## Testing

To verify this fix:
1. Start a new game or load an existing save
2. Advance to a day with training available
3. Note the number of players who can train
4. Train one or more players
5. Verify the training button remains visible
6. Verify the capacity count decreases appropriately
7. Train until all players reach capacity
8. Verify button is disabled with appropriate message
