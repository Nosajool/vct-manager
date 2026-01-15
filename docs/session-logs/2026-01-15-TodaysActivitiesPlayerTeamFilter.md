# Session Log: Today's Activities Player Team Filter

**Date:** 2026-01-15
**Feature:** Filter Today's Activities to show only player's team matches
**Status:** Completed

---

## What We Built Today

Fixed the Today's Activities component and related UI to only show matches involving the player's team, rather than all matches scheduled for that day.

### Problem

The Today's Activities panel was showing matches for ANY team scheduled on the current day. This was confusing because:
- Users saw "MATCH DAY" even when their team wasn't playing
- The "Play Match" button appeared even for other teams' matches
- "Jump to Match Day" could jump to a day where only other teams were playing

### Solution

Filtered all match-related displays to only show matches where the player's team is either the home or away team.

---

## Files Modified

### `src/components/calendar/TodayActivities.tsx`
- Changed `matchActivity` finder to check if `homeTeamId` or `awayTeamId` matches `playerTeamId`
- Only shows "MATCH DAY" card when player's team is actually playing

```typescript
// Before
const matchActivity = activities.find((a) => a.type === 'match');

// After
const matchActivity = activities.find((a) => {
  if (a.type !== 'match') return false;
  const data = a.data as MatchEventData;
  return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId;
});
```

### `src/components/calendar/TimeControls.tsx`
- Added `playerTeamId` from store
- Added `MatchEventData` import
- Changed `hasMatchToday` to filter for player's team only
- "Play Match & Advance" button only shows when player's team has a match

```typescript
// Before
const hasMatchToday = todaysActivities.some((e) => e.type === 'match' && !e.processed);

// After
const hasMatchToday = todaysActivities.some((e) => {
  if (e.type !== 'match' || e.processed) return false;
  const data = e.data as MatchEventData;
  return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId;
});
```

### `src/store/slices/gameSlice.ts`
- Added `MatchEventData` import
- Modified `getNextMatchEvent()` selector to filter by player's team
- Affects "Jump to Match Day" functionality across the app

```typescript
// Before: Returns first upcoming match for ANY team
// After: Returns first upcoming match for PLAYER'S team only
```

---

## What's Working

| Feature | Behavior |
|---------|----------|
| **Today's Activities** | Only shows "MATCH DAY" when player's team is playing |
| **TimeControls button** | Shows "Play Match & Advance" only for player's matches |
| **Jump to Match Day** | Jumps to player's next match, not any team's match |
| **Training/Scrim availability** | Still correctly disabled on player's match days |

---

## Technical Notes

### Cross-Slice State Access

The `getNextMatchEvent()` selector in `gameSlice.ts` needed to access `playerTeamId` from `teamSlice`. Since Zustand combines all slices into one store, `get()` returns the full state at runtime. Used type assertion to access cross-slice data:

```typescript
const playerTeamId = (state as unknown as { playerTeamId: string | null }).playerTeamId;
```

### Consistent Filtering Pattern

All three locations now use the same pattern to check for player's team:
```typescript
data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId
```

---

## Known Issues

None identified with this fix.

---

## Next Steps

- Could add a "League Activity" section showing other teams' match results
- Consider showing upcoming opponent scouting information on match day

---

## Related Files

- Previous session: `docs/session-logs/2026-01-15-TimeControlsMatchSimulationFix.md`
