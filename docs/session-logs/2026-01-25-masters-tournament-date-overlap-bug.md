# Session Log: Masters Tournament Date Overlap Bug Analysis

**Date**: 2026-01-25
**Feature**: Bug investigation - Masters Santiago and Masters London matches on same day
**Status**: Bug Analysis Complete (Fixes Required)

---

## Problem Statement

When viewing the calendar, VCT Masters Santiago 2026 and VCT Masters London 2026 both have matches scheduled on January 15th, 2026. This violates the expected tournament schedule where:

- Masters Santiago should run approximately Feb 5-23 (days 35-53 from season start)
- Masters London should run approximately Apr 30 - May 18 (days 119-137 from season start)

These tournaments should never overlap - they are sequential international events.

---

## Root Cause Analysis

### Expected Timing (from SEASON_TIMING constants)

```typescript
// GlobalTournamentScheduler.ts:29-38
const SEASON_TIMING = {
  kickoff: { start: 0, duration: 28 },        // Jan 1-29
  masters1: { start: 35, duration: 14 },      // Feb 5-19
  stage1: { start: 56, duration: 35 },        // Feb 26 - Apr 1
  stage1_playoffs: { start: 98, duration: 14 }, // Apr 13-27
  masters2: { start: 119, duration: 14 },     // May 4-18
  stage2: { start: 140, duration: 35 },       // May 25 - Jun 29
  stage2_playoffs: { start: 182, duration: 14 }, // Jul 11-25
  champions: { start: 217, duration: 21 },    // Aug 15 - Sep 5
};
```

### Bug 1: Dynamic Match Scheduling Ignores Tournament Date Ranges

**Location**: `TeamSlotResolver.ts:389-393` and `TournamentService.ts:1180-1183`

When matches become "ready" (teams get resolved into TBD slots), they are scheduled for "current game date + 1 day" instead of respecting the tournament's intended date range:

```typescript
// TeamSlotResolver.ts:389-393
if (!match.scheduledDate) {
  const nextDay = new Date(currentDate);
  nextDay.setDate(nextDay.getDate() + 1);
  match.scheduledDate = nextDay.toISOString();
}
```

**Impact**: If Kickoff tournaments complete early (around January 14), and teams are immediately resolved into Masters tournaments, their Swiss matches would be scheduled for January 15 - during the Kickoff phase, not the Masters phase.

### Bug 2: Match Date Fallback to Tournament Start Date

**Location**: `TournamentService.ts:1267`, `TournamentService.ts:1520`, `GlobalTournamentScheduler.ts:544`

When bracket matches don't have a `scheduledDate`, they fall back to `tournament.startDate`:

```typescript
// TournamentService.ts:1267
const match: Match = {
  id: bracketMatch.matchId,
  // ...
  scheduledDate: bracketMatch.scheduledDate || tournament.startDate,  // FALLBACK
  // ...
};
```

**Impact**: If there's any code path where matches become "ready" without being properly scheduled, they all appear on the tournament's start date.

### Bug 3: Hardcoded Duration Mismatch in createMasters

**Location**: `GlobalTournamentScheduler.ts:216`

```typescript
private createMasters(...) {
  const startDate = new Date(seasonStart);
  startDate.setDate(startDate.getDate() + dayOffset);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 18); // HARDCODED - should use SEASON_TIMING duration (14)
```

**Impact**: Masters tournament endDate is 4 days longer than SEASON_TIMING.duration suggests, causing inconsistency in date calculations.

### Bug 4: Potential Timezone Issues

**Location**: Throughout date calculations

The code creates Date objects from ISO strings (UTC) but uses `getDate()` and `setDate()` which operate on LOCAL time:

```typescript
const date = new Date('2026-01-01T00:00:00.000Z'); // UTC midnight
date.setDate(date.getDate() + 35);  // Uses LOCAL timezone getDate/setDate
```

**Impact**: Can cause off-by-one day errors depending on the server/client timezone.

---

## Technical Details

### How Tournament Matches Should Be Scheduled

1. **Game Initialization**: `GlobalTournamentScheduler.createAllTournaments()` creates all tournaments with:
   - Correct `startDate` and `endDate` based on `SEASON_TIMING`
   - TBD team slots for Masters/Champions tournaments
   - Empty brackets for tournaments with TBD teams

2. **Team Resolution**: When Kickoff completes, `TeamSlotResolver.resolveQualifications()`:
   - Resolves TBD slots with qualified team IDs
   - Initializes Swiss stage for Masters
   - Creates matches for the first Swiss round

3. **Match Scheduling**: The bug occurs here - matches should be scheduled within the tournament's date range, not based on current game date.

### Flow Diagram

```
Game Init (Jan 1)
    │
    ▼
GlobalTournamentScheduler creates:
  - Kickoffs (Jan 1-29, teams known)
  - Masters 1 (Feb 5-23, TBD slots)
  - Masters 2 (May 4-18, TBD slots)
    │
    ▼
Kickoff completes (~Jan 14-28)
    │
    ▼
TeamSlotResolver.resolveQualifications()
    │
    ├── Resolves Masters 1 team slots
    ├── Initializes Swiss stage
    └── BUG: Schedules matches for "currentDate + 1"
            instead of within Masters 1 date range (Feb 5-23)
```

---

## Recommended Fixes

### Fix 1: Schedule Matches Within Tournament Date Range

**File**: `TeamSlotResolver.ts`

When creating matches, calculate the scheduled date based on the tournament's `startDate` and `endDate`, not the current game date:

```typescript
// Instead of:
const nextDay = new Date(currentDate);
nextDay.setDate(nextDay.getDate() + 1);

// Use:
const tournamentStart = new Date(tournament.startDate);
const matchDate = new Date(tournamentStart);
matchDate.setDate(matchDate.getDate() + matchIndex * 2); // Spread matches out
```

### Fix 2: Use UTC-Safe Date Calculations

**Files**: All files with date calculations

Use UTC-specific methods for consistent behavior:

```typescript
// Instead of:
date.setDate(date.getDate() + days);

// Use:
date.setUTCDate(date.getUTCDate() + days);
```

### Fix 3: Fix Hardcoded Duration

**File**: `GlobalTournamentScheduler.ts:216`

```typescript
// Change from:
endDate.setDate(endDate.getDate() + 18);

// To:
const duration = mastersId === 'masters1'
  ? SEASON_TIMING.masters1.duration
  : SEASON_TIMING.masters2.duration;
endDate.setDate(endDate.getDate() + duration);
```

### Fix 4: Add Validation

**File**: `GlobalTournamentScheduler.ts`

Add validation to ensure no tournaments have overlapping date ranges:

```typescript
private validateNoOverlap(tournaments: Tournament[]): void {
  tournaments.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  for (let i = 1; i < tournaments.length; i++) {
    const prev = tournaments[i - 1];
    const curr = tournaments[i];
    if (new Date(prev.endDate) > new Date(curr.startDate)) {
      console.error(`Tournament overlap: ${prev.name} ends ${prev.endDate} but ${curr.name} starts ${curr.startDate}`);
    }
  }
}
```

---

## Files Affected

1. **`src/services/TeamSlotResolver.ts`**
   - `createSwissRoundMatches()` - lines 389-393
   - `createMatchEntitiesForBracket()` - lines 519-523

2. **`src/services/TournamentService.ts`**
   - `createMatchEntitiesForReadyBracketMatches()` - line 1267
   - `createMatchEntitiesForSwissRound()` - lines 1180-1183
   - `addTournamentCalendarEvents()` - line 1520

3. **`src/services/GlobalTournamentScheduler.ts`**
   - `createMasters()` - line 216 (hardcoded duration)

4. **`src/services/TournamentTransitionService.ts`**
   - Line 341 and 386 (fallback to tournament.startDate)

---

## Verification Steps

After implementing fixes:

1. Start a new game
2. Verify Masters 1 (Santiago) has startDate around Feb 5, 2026
3. Verify Masters 2 (London) has startDate around May 4, 2026
4. Advance through Kickoff completion
5. Verify Swiss stage matches are scheduled within Feb 5-23, not in January
6. Verify no matches from different Masters tournaments appear on the same day

---

## Related Files

- `docs/architecture/core-architecture.md` - Tournament system overview
- `docs/architecture/development-status.md` - Phase 16 documentation
- `docs/session-logs/2026-01-25-phase-filtering-bugfix.md` - Related phase filtering fix
