# Bugfix: Match Day Training Restriction

## Date
January 12, 2026

## Issue
The game was incorrectly preventing training on days when any match was scheduled, not just on days when the player's team was playing. This was inconsistent with the Schedule page logic and the documented behavior in the Overview page.

## Root Cause
In `TodayActivities.tsx`, the `hasMatchToday` variable was simply checking if any match activity existed:

```typescript
const hasMatchToday = !!matchActivity;
```

This meant training was blocked even when the match was between two other teams.

## Fix
Updated `TodayActivities.tsx` to check if the player's team is actually playing:

```typescript
const hasMatchToday = activities.some((a) => {
  if (a.type !== 'match' || a.processed) return false;
  const data = a.data as MatchEventData;
  return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId;
});
```

This matches the existing logic in `DayDetailPanel.tsx` which correctly checks:
```typescript
return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId;
```

## Files Modified
- `src/components/calendar/TodayActivities.tsx`

## Verification
- The Schedule page was already correctly implemented via `DayDetailPanel.tsx`
- Both components now use consistent logic for match day checks
