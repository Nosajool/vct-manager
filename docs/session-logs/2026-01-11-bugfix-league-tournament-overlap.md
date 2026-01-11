# Bugfix: League Matches Scheduled During Tournament Phases - Session Log

**Date:** 2026-01-11
**Type:** Bug Fix
**Status:** Complete

## Issue

League matches were being scheduled during tournament phases (Kickoff, Masters 1, Masters 2, Champions). The VCT season has distinct phases where league matches (Stage 1, Stage 2) should not overlap with tournament events.

## Root Cause

The `generateSeasonSchedule` method in `EventScheduler.ts` was using `generatePlayerMatchSchedule` starting from day 0 of the season. This caused league-style matches to be scheduled during the Kickoff tournament period and potentially overlap with other tournament phases.

The season structure is:
- **Kickoff** (days 0-28): Tournament phase
- **Stage 1** (days 35-91): League phase
- **Masters 1** (days 98-112): Tournament phase
- **Stage 2** (days 119-175): League phase
- **Masters 2** (days 182-196): Tournament phase
- **Champions** (days 245-266): Tournament phase
- **Offseason** (days 273+): No matches

## Files Modified

- `src/engine/calendar/EventScheduler.ts`

## Fix

### 1. Added `generateLeagueMatchSchedule` method

Created a new method that schedules matches only within specified league phases:

```typescript
generateLeagueMatchSchedule(options: {
  seasonStartDate: string;
  leaguePhases: SeasonStructure[];
  matchesPerWeek: number;
  playerTeamId: string;
  opponents: Team[];
}): CalendarEvent[] {
  // Schedule matches within each league phase only
  for (const phase of leaguePhases) {
    const phaseStartDate = this.addDays(seasonStartDate, phase.startOffset);
    const phaseEndDate = this.addDays(seasonStartDate, phase.startOffset + phase.duration);
    // ... schedule matches only within phase boundaries
  }
}
```

### 2. Updated `generateSeasonSchedule` to filter for league phases

```typescript
// Before: Started matches from day 0
const matchEvents = this.generatePlayerMatchSchedule({
  startDate,
  matchesPerWeek: 2,
  totalMatches: 24,
  playerTeamId,
  opponents,
});

// After: Only schedule during Stage 1 and Stage 2
const leaguePhases = EventScheduler.SEASON_STRUCTURE.filter(
  (s) => s.phase === 'stage1' || s.phase === 'stage2'
);

const matchEvents = this.generateLeagueMatchSchedule({
  seasonStartDate: startDate,
  leaguePhases,
  matchesPerWeek: 2,
  playerTeamId,
  opponents,
});
```

## Key Insight

The VCT competitive calendar has a specific structure where tournament phases and league phases are mutually exclusive. The scheduling system must respect these phase boundaries to maintain realistic competitive scheduling.

## Testing Notes

- League matches should only appear during Stage 1 (days 35-91) and Stage 2 (days 119-175)
- No league matches should appear during Kickoff, Masters, or Champions periods
- Match events now include a `phase` field indicating which stage they belong to
