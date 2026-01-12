# Bugfix: Match Result Display in Schedule View

**Date:** 2026-01-11  
**Status:** Fixed

## Issue

After clicking "Simulate Match" in the Schedule view and closing the match results modal, the DayDetailPanel was still showing "Simulate Match" button instead of displaying the match score and allowing users to view the result.

**Root Cause:** The `DayDetailPanel` component was checking `event.processed` from the calendar event, but this flag was not being updated properly when matches were simulated. The component wasn't looking up the actual match status from the store.

## Solution

Modified `DayDetailPanel.tsx` to:

1. Accept `matches` prop from the store to access current match state
2. Accept `onViewMatch` callback to handle viewing completed match results
3. Look up the match from the store using `matchId` to check its actual status
4. Display match scores (e.g., "2-1") instead of "vs" when match has a result
5. Show individual team scores in larger font
6. Replace "Simulate Match" button with "View Result" button for completed matches
7. Only show "Simulate Match" button when the match is actually pending (no result in store)

## Files Changed

### `src/components/calendar/DayDetailPanel.tsx`
- Added `matches` and `onViewMatch` to props interface
- Added logic to look up match from store and check if it has a result
- Updated match card UI to show scores when match is completed
- Replaced simulate button with view result button for completed matches

### `src/pages/Schedule.tsx`
- Added `matches` to props passed to `DayDetailPanel`
- Added `onViewMatch` handler (wrapped in useCallback)
- Passed `handleViewMatch` to `DayDetailPanel`

## New Behavior

**Before Fix:**
- Match always showed "Simulate Match" button after simulation
- No score displayed, just "vs"

**After Fix:**
- Completed matches show scores (e.g., "2-1" between team names)
- Individual team scores shown in larger font
- "View Result" button opens the match result modal
- "Simulate Match" button only appears for matches without results
