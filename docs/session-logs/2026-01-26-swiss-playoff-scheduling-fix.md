# Session Log: Fix Swiss Stage and Playoff Bracket Scheduling

**Date**: 2026-01-26
**Phase**: 21
**Status**: Complete

## Problem

Masters Santiago gets stuck at Swiss Stage Round 2 of 3. Clicking "Advance Day" does nothing. Additionally, when the Swiss stage finally completes, the playoff bracket has its matches scheduled in the past (e.g., Swiss ends Feb 8, but bracket matches are on Feb 6).

### Root Cause 1: Swiss Round Matches Scheduled for Today (Past)

When Round 1 completes on a match day (e.g., Thursday):

1. `advanceDay()` fetches today's events and processes Round 1 matches
2. After the last Round 1 match, `generateNextSwissRound()` is called
3. `createMatchEntitiesForSwissRound()` schedules Round 2 matches for "next valid match day from current date"
4. Since today (Thursday) is already a valid match day, `getNextMatchDay()` returns Thursday
5. Round 2 calendar events are created for Thursday
6. BUT `advanceDay()` already fetched today's events BEFORE Round 2 events were added
7. The day advances to Friday
8. On Friday, Round 2 matches are scheduled for Thursday (yesterday) — they're never processed

### Root Cause 2: Playoff Bracket Scheduled in the Past

When Swiss stage completes and `transitionToPlayoffs()` is called:

1. `schedulePlayoffMatches()` uses `tournament.endDate` as the end date
2. If the Swiss stage took longer than expected, `tournament.endDate` is already in the past
3. `scheduleAllBracketMatches()` calculates `lastMatchDay` from the past `endDate`
4. All playoff matches get scheduled in the past

### Root Cause 3: Same Issue in TeamSlotResolver

`TeamSlotResolver.createMatchEntitiesForBracket()` used `tournament.startDate` and `tournament.endDate` when generating brackets for resolved tournaments (e.g., Stage 1 Playoffs after Stage 1 League). If the league phase ran longer than expected, playoff matches would be scheduled in the past.

### Root Cause 4: Timezone Date Display Mismatch

`BracketMatch`, `MatchCard`, `MatchResult`, and `TournamentCard` components used `new Date(isoString).toLocaleDateString()` to display dates. This parses ISO strings as UTC, then converts to local time, which can shift the displayed date by one day. Meanwhile, `TimeBar` used `timeProgression.formatDate()` which correctly extracts the `YYYY-MM-DD` portion and creates a local date. This caused the TimeBar to show "Feb 8" while BracketMatch showed "Feb 7" for the same date.

## Solution

### Fix 1: Schedule Swiss Round Matches for Tomorrow

**File:** `src/services/TournamentService.ts` — `createMatchEntitiesForSwissRound()`

Changed `getNextMatchDay()` to start from `currentDate + 1` instead of `currentDate`:

```typescript
// Before (broken):
let matchDate = globalTournamentScheduler.getNextMatchDay(new Date(currentDate), matchDays);

// After (fixed):
const tomorrow = new Date(currentDate);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
let matchDate = globalTournamentScheduler.getNextMatchDay(tomorrow, matchDays);
```

### Fix 2: Extend Playoff End Date if Past

**File:** `src/services/TournamentService.ts` — `schedulePlayoffMatches()`

Start from tomorrow and extend `endDate` if it's in the past:

```typescript
const tomorrow = new Date(currentCalendarDate);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
const startDate = tomorrow;

let endDate = new Date(tournament.endDate);
if (endDate <= startDate) {
  endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 14);
}
```

### Fix 3: Same Fix in TeamSlotResolver

**File:** `src/services/TeamSlotResolver.ts` — `createMatchEntitiesForBracket()`

Applied the same tomorrow + endDate extension pattern for resolved tournament brackets (Stage Playoffs, etc.).

### Fix 4: Timezone-Safe Date Formatting

**Files:** `BracketMatch.tsx`, `MatchCard.tsx`, `MatchResult.tsx`, `TournamentCard.tsx`

Added `parseAsLocalDate()` helper to each component:

```typescript
const parseAsLocalDate = (dateStr: string): Date => {
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};
```

Replaced all `new Date(dateStr).toLocaleDateString(...)` calls with `parseAsLocalDate(dateStr).toLocaleDateString(...)`.

## Files Changed

1. **`src/services/TournamentService.ts`**
   - `createMatchEntitiesForSwissRound()`: Schedule from tomorrow, not today
   - `schedulePlayoffMatches()`: Schedule from tomorrow, extend endDate if past

2. **`src/services/TeamSlotResolver.ts`**
   - `createMatchEntitiesForBracket()`: Schedule from tomorrow, extend endDate if past

3. **`src/components/tournament/BracketMatch.tsx`**
   - Added `parseAsLocalDate()` helper
   - Fixed `formatCompactDate()` and regular date display

4. **`src/components/match/MatchCard.tsx`**
   - Added `parseAsLocalDate()` helper for `formatDate()`

5. **`src/components/match/MatchResult.tsx`**
   - Added `parseAsLocalDate()` helper for `formatDate()`

6. **`src/components/tournament/TournamentCard.tsx`**
   - Added `parseAsLocalDate()` helper for `formatDate()` in main component
   - Added `formatDateLocal()` in `TournamentCardMini` component

7. **`docs/architecture/core-architecture.md`**
   - Updated Match Scheduling System section with Swiss stage transition scheduling rules
   - Added Stage Transitions documentation (Swiss → Playoff, League → Playoff)
   - Added Date Display Convention section

## Key Insight

When a tournament phase completes (Swiss round, Swiss stage, or League), the completion happens **during** `advanceDay()` processing. At that point, today's events have already been fetched and are being processed. Any new matches generated must be scheduled for a **future** date (tomorrow or later), not the current date — otherwise they end up in the past after the day advances.
