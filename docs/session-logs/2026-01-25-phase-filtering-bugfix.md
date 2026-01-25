# Session Log: Phase-Based Match Filtering Bugfix

**Date**: 2026-01-25
**Feature**: Fix Stage 1/Stage 2 standings updates during Masters Santiago phase
**Status**: Fixed

---

## Problem Statement

When playing the game during the Masters Santiago phase (`masters1`), standings updates were incorrectly appearing for VCT Americas Stage 1 2026 and VCT Americas Stage 2 2026. These tournaments should not have any overlap - Stage 1 league matches should only be simulated during the `stage1` phase.

### Symptoms

- Team standings for Stage 1/2 leagues being updated while in Masters phase
- League match results appearing in simulation results during wrong phase
- Data integrity issues with standings being modified outside their intended timeline

---

## Root Cause Analysis

### How Matches Are Scheduled

1. **Game Initialization** (`GameInitService.ts`):
   - Stage 1 and Stage 2 league tournaments are created with `round_robin` format
   - All league matches for the entire season are pre-generated at game init time

2. **Match Generation** (`EventScheduler.ts:223-238`):
   - `generateLeagueMatchSchedule()` creates match events with scheduled dates
   - Matches are tagged with `phase: phase.phase` in their event data (line 236)
   - Example: Stage 1 matches have `phase: 'stage1'` in their data

3. **Calendar Event Storage**:
   - All match events (kickoff, stage1, stage2, masters, etc.) are added to the calendar
   - Events are scheduled by their `date` property, not by phase

### The Bug

**Location**: `CalendarService.advanceDay()` (lines 62-68)

```typescript
} else if (event.type === 'match') {
  // Simulate today's matches before advancing
  const result = this.simulateMatchEvent(event);
  if (result) {
    simulatedMatches.push(result);
    processedEvents.push(event);
  }
}
```

**Problem**: The code simulated ALL match events for a given day without checking if the match's phase property matched the current game phase. This meant:

- If a Stage 1 match was scheduled for Day 70 (mid-March, during Stage 1's scheduled period)
- And the current game phase was still `masters1` (Masters Santiago)
- The match would still be simulated, updating Stage 1 standings

### Timeline Context

From `EventScheduler.SEASON_STRUCTURE`:
- Masters Santiago: Day 35-49 (~Feb 15 - Mar 1)
- Stage 1: Day 56-90 (~Mar 10 - Apr 14)

The phases have sequential date ranges, but the phase transitions happen based on tournament completion, not calendar dates. If Masters runs long or the player advances days quickly, the dates can overlap.

---

## Solution

### Fix 1: Add Phase Validation in CalendarService

**Location**: `src/services/CalendarService.ts` (lines 64-75)

```typescript
} else if (event.type === 'match') {
  // Check if this match belongs to the current phase
  // League matches (stage1, stage2) have a phase property that must match current phase
  const matchData = event.data as MatchEventData;
  const matchPhase = matchData.phase;

  if (matchPhase && matchPhase !== currentPhase) {
    // Skip matches that belong to a different phase
    // Don't mark as processed - they'll be simulated when their phase is active
    skippedEvents.push(event);
    continue;
  }

  // Simulate today's matches before advancing
  const result = this.simulateMatchEvent(event);
  // ...
}
```

### Fix 2: Update MatchEventData Type

**Location**: `src/types/calendar.ts` (line 55)

```typescript
export interface MatchEventData {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName?: string;
  awayTeamName?: string;
  tournamentId?: string;
  isPlayerMatch?: boolean;
  phase?: SeasonPhase;  // For league matches, indicates which phase this match belongs to
}
```

---

## Behavior After Fix

| Match Type | Has `phase` Property | Simulation Behavior |
|------------|---------------------|---------------------|
| Tournament matches (Kickoff, Masters, etc.) | No | Always simulated when date arrives |
| League matches (Stage 1, Stage 2) | Yes | Only simulated when `currentPhase` matches `matchData.phase` |

**Key behaviors:**
- Skipped matches are NOT marked as processed
- When the correct phase becomes active, the matches will be simulated
- Tournament matches continue to work as before (no regression)

---

## Files Changed

1. **`src/services/CalendarService.ts`**
   - Added phase validation before match simulation in `advanceDay()`
   - Skipped matches added to `skippedEvents` array without marking as processed

2. **`src/types/calendar.ts`**
   - Added `phase?: SeasonPhase` property to `MatchEventData` interface

3. **`docs/architecture/development-status.md`**
   - Added Phase 16 documentation for this bugfix
   - Updated completed phases list

---

## Verification

- TypeScript compilation passes with no errors
- Phase property already existed in event data (set by EventScheduler)
- Fix is backward compatible - tournament matches without phase property continue to work

---

## Related Issues

- Phase 15 (`2026-01-24-stage1-ui-and-playoffs-transition.md`) added Stage 1/2 league tournaments but didn't add phase filtering
- The `phase` property was already being set by EventScheduler but never checked
