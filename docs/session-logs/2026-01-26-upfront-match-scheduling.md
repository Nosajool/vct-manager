# Session Log: Upfront Match Scheduling with Proper Match Days

**Date**: 2026-01-26
**Phase**: 19
**Status**: Complete

## Problem

Matches were being scheduled dynamically as they became "ready", causing several issues:

1. **Cross-Tournament Date Overlap**: Matches from different tournaments (e.g., Masters Santiago and Masters London) could be scheduled on the same day
2. **Missed Match Simulation**: Matches weren't being simulated because their dates had already passed by the time they were scheduled
3. **Unrealistic Scheduling**: Matches didn't follow real VCT scheduling patterns (specific days of week per region)

### Root Causes

1. `TeamSlotResolver` and `TournamentService` scheduled matches for `currentDate + 1` instead of within tournament date ranges
2. When matches became "ready" (both teams known), they were dynamically assigned dates
3. No consideration for region-specific match days (Thu-Sun for Americas, Tue-Fri for EMEA, etc.)

## Solution

Implemented upfront match scheduling where ALL matches are scheduled at tournament creation time based on:
1. Bracket round structure (earlier rounds = earlier dates)
2. Region-specific match days
3. Tournament date range constraints

### Match Day Configuration

```typescript
const MATCH_DAYS = {
  // Americas, Pacific, China: Thursday(4), Friday(5), Saturday(6), Sunday(0)
  regional_standard: [4, 5, 6, 0],
  // EMEA: Tuesday(2), Wednesday(3), Thursday(4), Friday(5)
  emea: [2, 3, 4, 5],
  // International: Thu-Sun, can extend to Mon(1), Tue(2) if needed
  international: [4, 5, 6, 0, 1, 2],
} as const;
```

## Implementation

### 1. GlobalTournamentScheduler.ts

Added match day configuration and utilities:

- `MATCH_DAYS` constant with region-specific patterns
- `getMatchDays(region)` - returns valid match days for a region
- `getNextMatchDay(date, matchDays)` - finds next valid match day from a date
- `getLastMatchDayBefore(date, matchDays)` - finds last valid match day before a date
- `scheduleAllBracketMatches(bracket, startDate, endDate, region)` - schedules all bracket matches by round
- `scheduleRoundRobinMatches(bracket, startDate, endDate, region)` - distributes round-robin matches evenly

Updated tournament creation:
- `createKickoff()` now calls `scheduleAllBracketMatches()` after bracket generation
- `createStageLeague()` now calls `scheduleRoundRobinMatches()` after bracket generation

### 2. TournamentService.ts

Simplified scheduling methods:

- `scheduleTournamentMatches()` - now only provides fallback for matches without dates
- `scheduleNewlyReadyMatches()` - only creates calendar events, trusts upfront scheduling
- `schedulePlayoffMatches()` - uses `scheduleAllBracketMatches()` for proper match days
- `createMatchEntitiesForSwissRound()` - uses proper match days from GlobalTournamentScheduler

Removed:
- `calculateMatchDateWithinTournament()` helper (no longer needed)
- `countReadyMatches()` helper (no longer used)

### 3. TeamSlotResolver.ts

Updated to use GlobalTournamentScheduler utilities:

- `createSwissRoundMatches()` - uses proper match days for Swiss stage matches
- `createMatchEntitiesForBracket()` - calls `scheduleAllBracketMatches()` for resolved tournaments

Removed:
- `calculateMatchDateWithinTournament()` helper (no longer needed)

## Scheduling Algorithm

```typescript
scheduleAllBracketMatches(bracket, startDate, endDate, region):
  matchDays = getMatchDays(region)

  // Collect all rounds in order: upper R1, R2..., middle R1, R2..., lower R1, R2...
  allRounds = collectRoundsInOrder(bracket)

  // Start from first valid match day
  currentDate = getNextMatchDay(startDate, matchDays)

  for each round in allRounds:
    // Assign same date to all matches in round (parallel play)
    for each match in round:
      match.scheduledDate = currentDate

    // Move to next match day for next round
    currentDate = getNextMatchDay(currentDate + 1 day, matchDays)

  // Grand final on last match day before endDate
  if bracket.grandfinal:
    bracket.grandfinal.scheduledDate = getLastMatchDayBefore(endDate, matchDays)
```

## Files Changed

1. **`src/services/GlobalTournamentScheduler.ts`**
   - Added `MATCH_DAYS` configuration
   - Added `getMatchDays()`, `getNextMatchDay()`, `getLastMatchDayBefore()`
   - Added `scheduleAllBracketMatches()`, `scheduleRoundRobinMatches()`
   - Updated `createKickoff()` and `createStageLeague()`

2. **`src/services/TournamentService.ts`**
   - Simplified `scheduleTournamentMatches()`
   - Simplified `scheduleNewlyReadyMatches()`
   - Updated `schedulePlayoffMatches()` and `createMatchEntitiesForSwissRound()`
   - Removed `calculateMatchDateWithinTournament()` and `countReadyMatches()`

3. **`src/services/TeamSlotResolver.ts`**
   - Updated `createSwissRoundMatches()` and `createMatchEntitiesForBracket()`
   - Removed `calculateMatchDateWithinTournament()`

## Verification

To verify the fix:

1. Start a new game
2. Check Kickoff tournament bracket matches:
   - All matches should have `scheduledDate` set
   - Dates should be on Thu/Fri/Sat/Sun (Americas) or Tue/Wed/Thu/Fri (EMEA)
   - Earlier rounds have earlier dates
3. Advance through several days - matches should simulate on their scheduled dates
4. Complete Kickoff - Masters Swiss matches should be scheduled within Masters date range
5. No matches from different tournaments should overlap on the same day

## Key Benefits

1. **No More Date Overlap**: Each tournament's matches are strictly within its date range
2. **Realistic Scheduling**: Matches follow actual VCT scheduling patterns
3. **Predictable**: All match dates known at tournament creation
4. **Simpler Code**: No complex dynamic scheduling logic

## Related

- Bug report: `docs/session-logs/2026-01-25-masters-tournament-date-overlap-bug.md`
- Architecture update: `docs/architecture/core-architecture.md` (Match Scheduling System section)
