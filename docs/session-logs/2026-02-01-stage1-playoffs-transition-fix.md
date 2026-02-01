# Stage 1 Playoffs Transition Fix

**Date**: 2026-02-01

## Problem

After Stage 1 round robin completes, users could click "Advance Day" many times without seeing Stage 1 Playoffs matches. The Stage 1 Playoffs bracket never appeared, and eventually Masters London Swiss Stage matches would start showing up prematurely (which shouldn't happen since Stage 1 Playoffs determines qualifiers for Masters London).

## Root Cause

In `StageCompletionModal.tsx`, when the modal closed, it called:

```typescript
tournamentTransitionService.executeTransition(data.nextTransitionId);
```

**Without passing the player's region.**

This caused a cascade of failures:

1. `resolveTournamentName(config, undefined)` returned `"VCT {REGION} Stage 1 Playoffs 2026"` (with placeholder)
2. The idempotency check couldn't find the existing tournament `"VCT Americas Stage 1 Playoffs 2026"`
3. `executeRegionalPlayoffTransition(config, undefined)` was called
4. Filter `t.region === undefined` matched NO teams
5. Transition returned `{ success: false, error: "Not enough teams..." }`
6. **Phase never changed from `stage1` to `stage1_playoffs`**
7. Stage 1 Playoffs matches never appeared on the calendar

## The Fix

**File**: `src/components/tournament/StageCompletionModal.tsx`

```typescript
// Added: Get player's region
const playerTeam = playerTeamId ? teams[playerTeamId] : null;
const playerRegion = playerTeam?.region;

// Changed: Pass region to executeTransition
const result = tournamentTransitionService.executeTransition(
  data.nextTransitionId,
  playerRegion  // Now passed correctly
);
```

## Why This Works

The VCT Manager uses an **upfront creation, lazy resolution** pattern:

1. **At game init**: `GlobalTournamentScheduler` creates Stage 1 Playoffs with TBD team slots
2. **When Stage 1 completes**: `TeamSlotResolver.resolveQualifications()` fills the TBD slots and generates the bracket
3. **When modal closes**: `executeTransition()` finds the existing tournament and changes the phase

With the region passed correctly:
1. `resolveTournamentName('Americas')` returns `"VCT Americas Stage 1 Playoffs 2026"`
2. Idempotency check finds the existing tournament
3. Phase is set to `stage1_playoffs`
4. Matches appear on calendar (bracket was already filled by step 2)

## Flow Diagram

```
Stage 1 Last Match Simulated
          │
          ▼
CalendarService.advanceDay()
          │
          ├── checkStageCompletion('stage1')
          │       │
          │       ▼
          │   handleStageCompletion(stage1Id)
          │       │
          │       ├── Mark tournament complete
          │       └── Open StageCompletionModal
          │
          └── checkAllTournamentCompletion('stage1')
                  │
                  ▼
              handleTournamentCompletion(stage1Id)
                  │
                  ▼
              teamSlotResolver.resolveQualifications(stage1Id)
                  │
                  ├── Extract top 8 from Stage 1 standings
                  ├── Find Stage 1 Playoffs (has TBD slots)
                  ├── Fill TBD slots with qualified teams
                  ├── Generate double-elim bracket
                  └── Create Match entities & calendar events
          │
          ▼
User Closes Modal
          │
          ▼
executeTransition('stage1_to_stage1_playoffs', 'Americas')
          │
          ├── Find existing "VCT Americas Stage 1 Playoffs 2026"
          ├── Set phase to 'stage1_playoffs'
          └── Return success
          │
          ▼
Stage 1 Playoffs matches appear on calendar
```

## Files Modified

- `src/components/tournament/StageCompletionModal.tsx`
  - Added `playerRegion` extraction from player's team
  - Pass `playerRegion` to `executeTransition()`

## Testing

1. Start a new game or load a save at Stage 1
2. Advance days until all Stage 1 matches complete
3. Stage Completion Modal should appear
4. Click "Continue to Stage 1 Playoffs"
5. Phase should change to `stage1_playoffs`
6. Stage 1 Playoffs matches should appear on calendar
7. Verify bracket shows all 8 qualified teams

## Related Documentation

- `docs/architecture/core-architecture.md` - Upfront Creation, Lazy Resolution pattern
- `docs/architecture/implementation-details-page-2.md` - Tournament Transitions section
