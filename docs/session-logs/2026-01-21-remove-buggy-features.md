# Session Log: 2026-01-21 - Remove Buggy Features

## Summary

Removed buggy TimeBar features (Advance Week, Jump to Match) and the BracketListView from the Tournament page to simplify the UI and eliminate broken functionality.

## What We Built/Changed

### 1. Removed TimeBar Buttons
- Removed "Advance Week" button - was not working properly
- Removed "Jump to Match" button - was not working properly
- TimeBar now only has "Advance Day" (shows as "Play Match" on match days)

### 2. Removed BracketListView
- Removed the "List" view mode from Tournament page
- Tournament page now only has "Bracket" and "Standings" view modes

## Files Modified

### TimeBar Changes
- `src/components/layout/TimeBar.tsx`
  - Removed `handleAdvanceWeek` and `handleAdvanceToMatch` handlers
  - Removed "Advance Week" and "Jump to Match" buttons
  - Removed unused `getNextMatchEvent` selector

- `src/services/CalendarService.ts`
  - Removed `advanceWeek()` method
  - Removed `advanceToNextMatch()` method
  - Removed unused `scrimService` import

- `src/store/slices/gameSlice.ts`
  - Removed `advanceWeek` from `GameSlice` interface
  - Removed `advanceWeek` action implementation

- `docs/vct_manager_game_technical_specification.md`
  - Updated TimeBar diagram
  - Updated Time Control Behavior table
  - Updated Phase 3 checklist with note about removed features

### BracketListView Changes
- `src/pages/Tournament.tsx`
  - Removed `BracketListView` import
  - Changed `ViewMode` type to `'bracket' | 'standings'`
  - Removed 'list' from view mode toggle
  - Removed `viewMode === 'list'` render block

- `src/components/tournament/index.ts`
  - Removed `BracketListView` export

- `src/components/tournament/BracketView.tsx`
  - Removed `BracketListView` component (~70 lines)

## What's Working

- TimeBar displays correctly with single "Advance Day" / "Play Match" button
- Tournament page shows Bracket and Standings views
- Build compiles successfully with no TypeScript errors

## Known Issues

None introduced by this session.

## Next Steps

- Consider re-implementing Advance Week with proper event handling
- Consider re-implementing Jump to Match with correct date calculation
- Consider re-implementing BracketListView if list view is needed

## Technical Notes

The removed features were causing issues likely related to:
- `advanceWeek`: May have had issues with weekly map decay timing or event processing order
- `advanceToNextMatch`: May have had issues with date calculation or match event detection
- `BracketListView`: Functionality unclear, removed for UI simplification

These features can be re-added in the future once the root causes are identified and fixed.
