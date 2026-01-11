# Phase 7: Schedule System Fixes - Session Log

**Date:** 2026-01-11
**Phase:** 7 - Schedule System Improvements
**Status:** Complete

## Summary

Fixed critical issues with the Schedule page and match/calendar architecture. The Schedule page now properly displays all matches (both season and tournament), matches are correctly linked between the calendar events and match store, and time advancement auto-simulates matches. This aligns the implementation with the architecture specification.

## Problems Identified

### 1. "View Full Schedule" Button Non-Functional
- Button in `CalendarView` had no `onClick` handler
- Users couldn't navigate to the full Schedule page

### 2. Schedule Page Empty
- Schedule page read from `matches` store which was empty
- Actual match data was in `calendar.scheduledEvents`
- Two disconnected data sources for matches

### 3. Match Entity Disconnection
- **Season matches**: Created by `EventScheduler.generatePlayerMatchSchedule()` as calendar events with `match-instance-xxx` IDs, but NO corresponding `Match` entities in store
- **Tournament matches**: Stored in `BracketMatch` within tournament structure, only created as `Match` entities at simulation time
- Calendar events referenced match IDs that didn't exist

### 4. Simulate Button Always Visible
- Could click "Simulate Match" for future matches
- No date validation

### 5. Manual Match Simulation Required
- Advancing time didn't auto-simulate matches
- Had to manually simulate each match

## Architecture Alignment

Per the technical specification:
- `Match.tournamentId?: string` - Tournament matches should be stored as `Match` entities
- `BracketMatch.matchId` - Should reference a `Match` entity
- `CalendarEventType = 'match'` - All matches should have calendar events
- Single source of truth for all matches

## Files Modified

### CalendarView Component
**`src/components/calendar/CalendarView.tsx`**
- Added `setActiveView` from store
- Added `onClick` handler to "View Full Schedule" button to navigate to Schedule page

### Schedule Page
**`src/pages/Schedule.tsx`** (~500 lines modified)
- Added `TimeControls`, `TodayActivities`, `TrainingModal` components
- Added `ScrimModal` component
- Added time advancement notification banner
- Changed data source from `matches` store to `calendar.scheduledEvents`
- Added `matchEvents`, `filteredMatchEvents`, `upcomingMatchEvents`, `completedMatchEvents` derived from calendar
- Added "Today" badge for matches on current date
- Simulate button only visible for today's matches
- Future matches show "Advance time to match day to simulate"
- Added "All Upcoming Events" section showing full calendar
- Added helper functions `getEventStyle()` and `getEventDescription()`

### TournamentService
**`src/services/TournamentService.ts`** (~100 lines added)

New method `createMatchEntitiesForReadyBracketMatches()`:
- Creates `Match` entities for bracket matches with known teams (status: 'ready')
- Uses bracket match's `matchId` as `Match.id` for proper linking
- Called when tournament is created (first-round matches)
- Called in `advanceTournament()` for newly-ready matches

Updated `addTournamentCalendarEvents()`:
- Now creates calendar events for ALL bracket matches (not just tournament start/end)
- Includes team names (or 'TBD' for pending matches)
- Links `matchId` to the `Match` entity

Updated `simulateNextMatch()`:
- Uses existing `Match` entity if found via bracket match's `matchId`
- Falls back to creating new Match only if not found (with warning)

### GameInitService
**`src/services/GameInitService.ts`** (~15 lines added)
- After generating calendar events, creates `Match` entities for all match events
- Ensures season matches have corresponding `Match` entities in store

### CalendarService
**`src/services/CalendarService.ts`** (~80 lines added)

Updated `TimeAdvanceResult` interface:
- Added `simulatedMatches: MatchResult[]` field

New method `simulateMatchEvent()`:
- Simulates a match from a calendar event
- Marks event as processed
- Returns match result

Updated `advanceDay()`:
- Auto-simulates any matches on the new date
- Adds results to `simulatedMatches` array

Updated `advanceWeek()`:
- Auto-simulates all matches in the week
- Previously blocked advancement if matches existed

Updated `advanceToNextMatch()`:
- Auto-simulates all matches up to and including target match
- No longer stops at match day requiring manual simulation

## Data Flow (After Fix)

### Season Matches
```
Game Init
    ↓
eventScheduler.generateInitialSchedule()
    ↓
Creates calendar events with match-instance-xxx IDs
    ↓
GameInitService creates Match entities with same IDs
    ↓
Schedule page shows matches from calendar events
    ↓
Simulate button works (Match entity exists)
```

### Tournament Matches
```
Tournament Created
    ↓
scheduleTournamentMatches() - assigns dates to bracket matches
    ↓
createMatchEntitiesForReadyBracketMatches() - creates Match entities for ready matches
    ↓
addTournamentCalendarEvents() - creates calendar events for ALL bracket matches
    ↓
Schedule page shows tournament matches
    ↓
When match completes, advanceTournament() creates Match entities for newly-ready matches
```

### Time Advancement
```
User clicks time control (Advance Day/Week/Jump to Match)
    ↓
CalendarService processes events in date range
    ↓
Match events → simulateMatchEvent() → auto-simulates
    ↓
Returns TimeAdvanceResult with simulatedMatches[]
    ↓
UI shows notification with simulated match count
```

## Behavior Changes

| Feature | Before | After |
|---------|--------|-------|
| View Full Schedule button | Did nothing | Navigates to Schedule page |
| Schedule page content | Empty "No matches" | Shows all calendar matches |
| Season match simulation | "Match not found" error | Works correctly |
| Tournament match display | Not shown in Schedule | Shows with Tournament badge |
| Simulate button | Always visible | Only on match day |
| Advance 1 Day | Matches need attention | Auto-simulates matches |
| Advance 1 Week | Blocked by matches | Auto-simulates all matches |
| Jump to Next Match | Stops at match day | Auto-simulates on arrival |

## Testing Notes

- Start a new game to see all fixes (existing games have old data structure)
- Tournament matches should appear in Schedule page with "Tournament" badge
- Season matches should appear with dates
- "Today" badge shows for matches on current date
- Time controls auto-simulate matches and show notification
- Match results appear in Results tab after simulation

## Related Documentation

- Architecture: `docs/vct_manager_game_technical_specification.md` (Match System, Calendar System, Competition System sections)
