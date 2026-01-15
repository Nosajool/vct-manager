# Bug Report: 004 - Middle Bracket Scheduling Issue

## Summary
Tournament middle bracket matches are being scheduled with fixed dates at tournament start time, regardless of when their prerequisite matches are completed.

## Description
When a tournament is created, the ScheduleGenerator immediately schedules all bracket matches including middle bracket matches (mr1-m4 in the JSON data). These are scheduled for January 1st, 2026, but middle bracket matches should only be scheduled after their prerequisite upper/lower bracket matches are completed.

The issue occurs because:
1. Tournament scheduling creates events for all bracket matches upfront
2. Middle bracket matches depend on winners/losers from earlier rounds
3. But they're scheduled with fixed dates at tournament start, not dynamically when prerequisites are met

## Steps to Reproduce
1. Start a new game with tournament bracket scheduling
2. Examine the calendar events or matches data
3. Observe that middle bracket matches (mr1-m4) are scheduled for January 1st alongside upper bracket matches
4. This doesn't make logical sense as middle bracket matches can't occur until upper/lower bracket winners are determined

## Expected Behavior
Middle bracket matches should be scheduled dynamically after their prerequisite matches are completed, not with fixed dates at tournament initialization.

## Actual Behavior
Middle bracket matches are scheduled immediately when the tournament starts, creating unrealistic scheduling where matches that depend on other results occur simultaneously.

## Root Cause
The ScheduleGenerator creates all tournament events upfront without considering the logical dependencies between bracket rounds. Middle bracket matches should be scheduled only after the rounds they depend on are complete.

## Proposed Solutions
1. **Option A**: Modify ScheduleGenerator to only schedule middle bracket matches when their prerequisites are ready
2. **Option B**: Create middle bracket events but mark them as "pending" until prerequisites are met, then update their dates
3. **Option C**: Implement a tournament progression system that schedules subsequent rounds dynamically

## Files Affected
- `src/engine/competition/ScheduleGenerator.ts`
- `src/engine/competition/TournamentEngine.ts`
- `src/services/TournamentService.ts`

## Priority
Medium - Creates unrealistic tournament scheduling but doesn't break core functionality.

## Status
**Resolved** - 2026-01-15

## Resolution
Fixed as part of the tournament scheduling overhaul. Middle bracket matches are now scheduled dynamically when their prerequisite matches complete, rather than upfront at tournament creation. See [session log](../session-logs/2026-01-15-bugfix-tournament-scheduling-tbd-matches.md) for details.

## Notes
This issue was identified when reviewing the tournament JSON data showing middle bracket matches scheduled for the same day as upper bracket matches, which is logically impossible in a proper bracket tournament format.

## Example Data
From the provided JSON, middle bracket matches (mr1-m4) are all scheduled for "2026-01-01T00:00:00.000Z" alongside upper bracket matches, which doesn't reflect proper tournament progression.