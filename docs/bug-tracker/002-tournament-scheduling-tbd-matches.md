# BUG-002: Tournament scheduling shows TBD vs. TBD matches on first day

**Priority:** High
**Status:** Open
**Component:** TournamentService / ScheduleGenerator

---

## Description

When a tournament is created, all matches are scheduled on the first day of the tournament, including future bracket matches that don't have teams determined yet. This results in "TBD vs. TBD" matches appearing on the Schedule page immediately after tournament creation.

### Current Behavior

1. Create a tournament (e.g., Kickoff)
2. All tournament matches are scheduled with dates immediately
3. Schedule page shows matches like "TBD vs. TBD" on Day 1
4. Even Round 2+ matches (which depend on Round 1 winners) appear on the same day

### Expected Behavior

1. Create a tournament
2. Only Round 1 matches (with known teams) are scheduled immediately
3. Round 2+ matches should be scheduled but not visible until teams are determined
4. OR: All matches scheduled upfront but only "ready" matches show calendar events

---

## Impact

- **User Experience:** Confusing to see "TBD vs. TBD" matches on the schedule
- **Tournament Flow:** Doesn't match real VCT tournament progression
- **Calendar Clutter:** Future uncertain matches clutter the early tournament schedule

---

## Steps to Reproduce

1. Start a new game
2. Navigate to Schedule page
3. Check the first day of the tournament
4. Observe multiple "TBD vs. TBD" matches scheduled

---

## Root Cause Analysis

### Code Issue

**File:** `src/services/TournamentService.ts`

**Method:** `scheduleTournamentMatches()` (lines 297-333)

Current logic assigns dates to ALL bracket matches sequentially:
```typescript
for (const round of tournament.bracket.upper) {
  for (const match of round.matches) {
    if (match.status === 'completed') continue;
    match.scheduledDate = currentDate.toISOString();  // ❌ Assigns to ALL
  }
}
```

**Method:** `addTournamentCalendarEvents()` (lines 336-395)

Creates calendar events for ALL matches regardless of status:
```typescript
const addMatchEvents = (matches: BracketMatch[]) => {
  for (const bracketMatch of matches) {
    // ❌ Creates events even when bracketMatch.status === 'pending'
  }
};
```

### Bracket Status Logic

The `BracketManager.generateTripleElimination()` correctly sets:
- Round 1 matches: `status: 'ready'` (teams known from seeding)
- Round 2+ matches: `status: 'pending'` (teams depend on winners)

But `TournamentService` ignores this status and schedules everything.

---

## Proposed Fix

### Option 1: Only Schedule Ready Matches (Recommended)

Modify `scheduleTournamentMatches()` to only assign dates to matches with known teams:

```typescript
for (const round of tournament.bracket.upper) {
  for (const match of round.matches) {
    if (match.status === 'completed' || match.status === 'pending') continue;
    if (match.status === 'ready') {  // ✅ Only schedule ready matches
      match.scheduledDate = currentDate.toISOString();
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
}
```

And modify `addTournamentCalendarEvents()` to only create events for ready matches:
```typescript
if (bracketMatch.status !== 'ready') continue;  // ✅ Skip pending matches
```

### Option 2: Schedule All But Hide Pending

Assign dates to all matches upfront, but only create calendar events for `ready` matches. This preserves the tournament timeline while hiding TBD matches.

---

## Files to Modify

1. `src/services/TournamentService.ts`
   - `scheduleTournamentMatches()` method
   - `addTournamentCalendarEvents()` method

---

## Related Files

- `src/engine/competition/BracketManager.ts` (correctly sets match statuses)
- `src/engine/competition/TournamentEngine.ts` (tournament creation)
- `src/pages/Schedule.tsx` (displays the matches)

---

## Notes

This is different from BUG-001 (auto-simulation) - this is about match visibility and scheduling logic. The tournament should show a proper progression where only matches with known teams appear on the calendar initially.

The ideal user experience:
- Day 1: Round 1 matches with real team names
- Day 2+: Round 2 matches become visible after Round 1 completes
- Tournament feels like it progresses naturally over time