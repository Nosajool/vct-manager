# Bugfix: Training Modal Not Appearing - Session Log

**Date:** 2026-01-10
**Type:** Bug Fix
**Status:** Complete

## Issue

The Training modal button never appeared in the TodayActivities component during manual testing. Users could not access the training functionality.

## Root Cause

The `scheduleTrainingDays()` method in `EventScheduler.ts` was defined but **never called**. The `generateSeasonSchedule()` method scheduled:
- Salary payments
- Match events
- Tournament phase markers

But it never scheduled `training_available` events, so the TodayActivities component had no training activities to display.

## File Modified

- `src/engine/calendar/EventScheduler.ts:306-310`

## Fix

Added call to `scheduleTrainingDays()` in `generateSeasonSchedule()`:

```typescript
// Generate training days (available on non-match days)
const matchDates = matchEvents.map((e) => e.date);
const seasonEndDate = this.addDays(startDate, 365); // Full year
const trainingEvents = this.scheduleTrainingDays(startDate, seasonEndDate, matchDates);
allEvents.push(...trainingEvents);
```

## How It Works

1. `scheduleTrainingDays()` generates `training_available` events for every day that doesn't have a match
2. TodayActivities component checks for `training_available` events on the current date
3. If found (and no match today), the "Team Training" button appears
4. Clicking the button triggers `onTrainingClick` callback which opens the TrainingModal

## Testing Notes

- Requires starting a new game (existing saves don't have training events scheduled)
- Training button appears on non-match days
- Training is unavailable (grayed out) on match days
