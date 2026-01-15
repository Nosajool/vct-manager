# BUG-001: Time Controls simulates matches instead of advancing to day start

**Priority:** Medium
**Status:** Resolved (2026-01-15)
**Component:** TimeProgression / CalendarService

---

## Description

When using Time Controls (Advance Day, Advance Week, or Jump to Match) to navigate the calendar, the system automatically simulates all matches scheduled for the target day(s) during the advancement process. This prevents the user from making roster changes or other preparations on match day before the matches are played.

### Current Behavior

1. User clicks "Advance Day"
2. Calendar advances to next day
3. **Any matches scheduled for that day are automatically simulated immediately**
4. User cannot make changes before the match

### Expected Behavior

1. User clicks "Advance Day"
2. Calendar advances to next day
3. Matches remain in "scheduled" status
4. User can view roster, make changes, train players
5. User manually triggers match simulation when ready

---

## Impact

- Users cannot make roster adjustments on match day
- Users cannot adjust starting lineup before matches
- Reduces strategic depth of match day preparation

---

## Steps to Reproduce

1. Start a new game or load an existing save
2. Navigate to a day with a scheduled match (check the Schedule page)
3. Use the "Advance Day" control from the Time Controls component
4. Observe that the match is immediately completed with results
5. Check the Schedule page - match shows as "completed"

---

## Proposed Fix

Modify the time advancement logic in `CalendarService` and `TimeProgression`:

### Option 1: Change default behavior
- `advanceDay()` should only update the calendar date
- Auto-simulate matches only when explicitly requested
- Add new method `simulateScheduledMatches()` for manual triggering

### Option 2: Add a preference setting
- Add "Auto-simulate matches on time advance" toggle in Settings
- Default to `false` (don't auto-simulate)
- Existing behavior preserved for users who prefer it

**Recommended:** Option 1 (simpler, clearer UX)

### Code Changes Required

1. **`src/services/CalendarService.ts`**:
   - Modify `advanceDay()` to not call match simulation
   - Add `simulateScheduledMatches()` method

2. **`src/engine/calendar/TimeProgression.ts`**:
   - Update `advanceToNextMatch()` to advance date but not simulate
   - Keep match simulation as explicit user action

3. **`src/components/calendar/TimeControls.tsx`**:
   - Add "Simulate Matches" button when there are scheduled matches

---

## Related Files

- `src/services/CalendarService.ts`
- `src/engine/calendar/TimeProgression.ts`
- `src/components/calendar/TimeControls.tsx`
- `src/services/MatchService.ts`

---

## Notes

This is related to the design decision documented in `Implementation Notes > Time Progression & Off-Day Activities`. The current implementation auto-processes all events including matches, which works well for fast-forwarding through off-days but prevents day-of-match preparation.

---

## Resolution (2026-01-15)

**Solution Implemented:** Modified game loop to simulate TODAY's events before advancing (not next day's events after advancing).

### Actual Fix Applied

Neither Option 1 nor Option 2 from the proposed fix was implemented exactly. Instead, we corrected the fundamental timing of the game loop:

**Old (Incorrect) Flow:**
1. Get events for NEXT day
2. Simulate them
3. Advance to that day

**New (Correct) Flow:**
1. Get events for CURRENT day (today)
2. Simulate them
3. Advance to next day

This means:
- User starts at beginning of match day
- User can prepare (roster changes, training, etc.)
- User clicks "Advance Day" which simulates today's match AND moves to tomorrow
- "Jump to Match Day" now lands at START of match day without simulating

### Files Changed

1. `src/services/CalendarService.ts` - Fixed all three advancement methods
2. `src/components/calendar/TimeControls.tsx` - Updated UI to show match day state
3. `src/pages/Dashboard.tsx` - Updated callback usage
4. `src/pages/Schedule.tsx` - Updated callback usage

### Session Log

See: `docs/session-logs/2026-01-15-TimeControlsMatchSimulationFix.md`
