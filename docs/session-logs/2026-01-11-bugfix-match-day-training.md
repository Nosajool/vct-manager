# Bugfix: Match Day Training/Scrim Availability

## Date
2026-01-11

## Issue
Training and Scrim sessions were available on the Schedule page every day, but they should only be available on non-match days for the player's team (including tournament match days).

## Root Cause
In `src/components/calendar/DayDetailPanel.tsx`, the `hasMatch` check was:
```typescript
const hasMatch = dayEvents.some((e) => e.type === 'match' && !e.processed);
```

This only checked if any match event existed on the day, not whether the player's team was actually playing in that match. Additionally, tournament matches use the same `match` event type but weren't being considered for training availability.

## Fix Applied

### 1. Added structured event data types (`src/types/calendar.ts`)
- `MatchEventData` - matchId, homeTeamId, awayTeamId, tournamentId, etc.
- `TournamentEventData` - tournamentName, phase
- `SalaryPaymentEventData` - month, year
- `RestDayEventData` - week, description

### 2. Updated type exports (`src/types/index.ts`)
- Re-exported the new event data types

### 3. Updated EventScheduler import (`src/engine/calendar/EventScheduler.ts`)
- Imported `MatchEventData` type

### 4. Fixed hasMatch check (`src/components/calendar/DayDetailPanel.tsx`)
```typescript
// Before
const hasMatch = dayEvents.some((e) => e.type === 'match' && !e.processed);

// After
const hasMatch = dayEvents.some((e) => {
  if (e.type !== 'match' || e.processed) return false;
  const data = e.data as MatchEventData;
  // Only count it as "our" match if player's team is playing
  return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId;
});
```

### 5. Added tech debt note to architecture doc
Documented the need to refactor `CalendarEvent.data` to use structured types.

## Files Modified
- `src/types/calendar.ts` - Added event data type definitions
- `src/types/index.ts` - Re-exported new types
- `src/engine/calendar/EventScheduler.ts` - Imported MatchEventData
- `src/components/calendar/DayDetailPanel.tsx` - Fixed hasMatch check with proper typing
- `docs/vct_manager_game_technical_specification.md` - Added tech debt note

## What's Working
- Training and scrim buttons are now disabled only on days when the player's team has a match
- Training and scrim remain available if other teams have matches but your team doesn't
- Proper TypeScript typing for match event data

## Technical Debt Note
The `CalendarEvent.data` field still uses `unknown` type. Future refactoring should:
1. Update `CalendarEvent` to use a discriminated union for `data` based on `type`
2. Update `EventScheduler` to use typed data structures
3. Update all components to use proper type narrowing
