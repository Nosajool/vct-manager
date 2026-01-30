# Session Log: Stage 1 Scheduling Fix

**Date**: 2026-01-29
**Feature**: Fix Stage 1 round-robin scheduling bugs

## Problem

When entering Stage 1, two critical bugs were occurring:

1. **Duplicate Matches**: Teams were playing multiple matches on the same day (e.g., Sentinels had 5 matches simulated in 1 day)
2. **Premature Phase Transition**: After simulating 1 day, the game would jump to Stage 1 Playoffs even though only 1 of 5 round-robin matches had been played

## Root Cause Analysis

### Bug 1: Duplicate Match Systems

Two separate systems were creating matches for Stage 1:

1. **EventScheduler.generateLeagueMatchSchedule()** - Legacy system that created league matches for the player's team only (5 opponents per stage)
2. **GlobalTournamentScheduler.createStageLeague()** - New system that creates round-robin bracket matches for ALL teams

Both systems were creating Match entities, causing:
- Sentinels to have matches from both systems
- Duplicate calendar events for the same logical matches

### Bug 2: Naive Round-Robin Scheduling

The `scheduleRoundRobinMatches()` method was using simple bucket distribution:
```typescript
const matchesPerDay = Math.ceil(allMatches.length / validMatchDays.length);
```

This distributed matches sequentially without checking if a team already had a match on that day. Since all of a team's matches were sequential in the match array, they could all cluster onto consecutive days.

### Bug 3: Missing Group Division

Stage 1 was calling `generateRoundRobin(teamIds)` without the `groups` parameter, creating:
- 12-team round-robin = 66 matches (incorrect)
- Should be: 2 groups of 6 = 30 matches total

## Solution

### 1. Consolidated Match Scheduling

Modified `EventScheduler` to skip match events when called from game initialization:

```typescript
// EventScheduler.ts - ScheduleOptions
export interface ScheduleOptions {
  // ...
  skipMatchEvents?: boolean;  // NEW: Skip match events when GlobalTournamentScheduler handles them
}

// generateInitialSchedule now passes skipMatchEvents: true
```

Now `EventScheduler` only generates:
- Salary payment events
- Training availability events
- Scrim availability events
- Tournament phase markers

All match scheduling is handled by `GlobalTournamentScheduler`.

### 2. Proper Group Division

Fixed `createStageLeague()` to pass `groups: 2`:

```typescript
// Before
let bracket = bracketManager.generateRoundRobin(teamIds);

// After
let bracket = bracketManager.generateRoundRobin(teamIds, 2);
```

### 3. Circle Method Scheduling

Rewrote `scheduleRoundRobinMatches()` to use the **circle method** (polygon algorithm):

```typescript
private generateCircleMethodPairings(teams: string[]): [string, string][][] {
  // Fix team 0, rotate teams 1 through n-1
  // Generates pairings where each team plays exactly once per week

  // For 6 teams, generates 5 weeks:
  // Week 1: A-B, C-F, D-E
  // Week 2: A-C, D-B, E-F
  // Week 3: A-D, E-C, F-B
  // Week 4: A-E, F-D, B-C
  // Week 5: A-F, B-E, C-D
}
```

This ensures:
- Each team plays exactly once per week
- No team has multiple matches on the same day
- All 15 group matches are spread across 5 weeks

### 4. Removed Unused Code

- Removed `linkLeagueMatchesToTournaments()` from `GameInitService` (was linking legacy matches to tournaments)
- Cleaned up related code paths

## Files Modified

1. **src/services/GlobalTournamentScheduler.ts**
   - Added `groups: 2` parameter to `generateRoundRobin()` call
   - Rewrote `scheduleRoundRobinMatches()` to use circle method
   - Added `generateCircleMethodPairings()` private method

2. **src/engine/calendar/EventScheduler.ts**
   - Added `skipMatchEvents` option to `ScheduleOptions`
   - Modified `generateSeasonSchedule()` to respect the option
   - Modified `generateInitialSchedule()` to pass `skipMatchEvents: true`

3. **src/services/GameInitService.ts**
   - Removed legacy match entity creation from EventScheduler events
   - Removed `linkLeagueMatchesToTournaments()` method and its call

4. **docs/architecture/core-architecture.md**
   - Updated Match Scheduling System section with circle method details

5. **docs/architecture/implementation-details-page-2.md**
   - Updated Round-Robin League Format section with new architecture

## Testing

Created temporary test file to verify circle method algorithm:
- 6 teams → 5 weeks, 3 matches/week, 15 total matches
- Each team appears exactly once per week
- All unique pairings covered

Test passed ✓ (test file deleted as project is not yet in testing phase)

## Architecture Changes

### Before
```
EventScheduler ─────────────────┬──→ Match Events (Stage 1/2)
                                │
GlobalTournamentScheduler ──────┴──→ Match Events (Stage 1/2)
                                     ↑ DUPLICATE!
```

### After
```
EventScheduler ──────────────────→ Non-match events only
                                   (salary, training, scrim, phase markers)

GlobalTournamentScheduler ───────→ ALL match events
                                   (Kickoff, Stage 1/2, Playoffs, Masters, Champions)
```

## Result

- Stage 1 now correctly has 2 groups of 6 teams
- Each team plays 5 matches (one per week) over 5 weeks
- No duplicate matches
- Proper phase progression after completing all league matches

## Notes

- Users must start a new game to see the fix (affects game initialization)
- The circle method is a classic algorithm for generating balanced round-robin schedules
