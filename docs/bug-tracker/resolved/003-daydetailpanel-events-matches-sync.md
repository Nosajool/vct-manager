# Bug Report: 003 - DayDetailPanel Events-Matches Sync Issue

## Summary
The DayDetailPanel component displays calendar events but cannot properly render match details because of a synchronization issue between calendar events and match entities.

## Description
When tournament bracket matches are scheduled, calendar events are created immediately with placeholder team data ("TBD"). However, the corresponding match entities in the store are only created when bracket matches become "ready" (when teams are determined). This creates a gap where:

1. Calendar events exist for matches
2. But the actual match objects don't exist yet in the matches store
3. DayDetailPanel tries to display match details but fails because match lookup returns undefined

## Steps to Reproduce
1. Start a new game with tournament bracket scheduling
2. Navigate to the Schedule page
3. Click on a day that has tournament bracket matches scheduled
4. Observe that match events are shown but cannot be properly displayed

## Expected Behavior
DayDetailPanel should either:
- Not show match events until the corresponding match entities exist, OR
- Show placeholder information for bracket matches that aren't ready yet

## Actual Behavior
Match events appear in the calendar but DayDetailPanel cannot render them properly, likely showing errors or blank entries.

## Root Cause
The issue stems from the architectural decision to create calendar events immediately when scheduling tournaments, but defer match entity creation until bracket matches are "ready". This creates a timing mismatch between the calendar system and the match system.

## Proposed Solutions
1. **Option A**: Modify tournament scheduling to only create calendar events when match entities are ready
2. **Option B**: Update DayDetailPanel to handle cases where match entities don't exist yet
3. **Option C**: Create match entities immediately with placeholder data and update them when bracket matches are resolved

## Files Affected
- `src/components/calendar/DayDetailPanel.tsx`
- `src/engine/competition/ScheduleGenerator.ts`
- `src/engine/competition/BracketManager.ts`
- `src/services/TournamentService.ts`

## Priority
Medium - Affects user experience when viewing tournament schedules but doesn't break core functionality.

## Status
**Resolved** - 2026-01-15

## Resolution
Fixed as part of the tournament scheduling overhaul. Calendar events are now only created for "ready" matches that have corresponding Match entities. See [session log](../session-logs/2026-01-15-bugfix-tournament-scheduling-tbd-matches.md) for details.

## Notes
This issue was identified during architecture review when examining the tournament bracket system integration with the calendar system.