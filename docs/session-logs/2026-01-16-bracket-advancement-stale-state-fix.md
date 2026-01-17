# Session Log: Tournament Bracket Advancement and Stale State Fix

**Date:** 2026-01-16
**Feature:** Fix Tournament Bracket Progression Getting Stuck

---

## Summary

Fixed a critical bug where tournament brackets would get "stuck" after matches were simulated. Teams wouldn't advance through the bracket despite match results being shown correctly.

---

## Bug: Stale State Reference in `advanceTournament()`

### Root Cause Analysis

**Location:** `src/services/TournamentService.ts:117`

The bug was a **stale state snapshot** being used after a store update:

```typescript
// Line 95: Captures state snapshot
const state = useGameStore.getState();

// Line 104-110: Creates NEW bracket with winner/loser propagated
const newBracket = bracketManager.completeMatch(...);

// Line 113: Saves to store
state.updateBracket(tournamentId, newBracket);

// Line 117: BUG! Gets OLD tournament from stale `state` snapshot!
const updatedTournament = state.tournaments[tournamentId];

// Lines 120-121: Pass OLD tournament (with OLD bracket) to these functions
this.scheduleNewlyReadyMatches(updatedTournament);  // Doesn't find newly-ready matches
this.createMatchEntitiesForReadyBracketMatches(updatedTournament);  // Doesn't create Match entities
```

**What Happened:**
1. Match A completes, bracket is updated with winner/loser propagated to Match B
2. Match B becomes 'ready' in the NEW bracket
3. But `updatedTournament` has the OLD bracket (before `completeMatch()`)
4. In the OLD bracket, Match B is still 'pending' - teams not assigned
5. `scheduleNewlyReadyMatches()` doesn't find Match B (status != 'ready')
6. Match B has no calendar event and no Match entity
7. **Bracket is stuck!**

### Fix Applied

```typescript
// BEFORE (buggy):
const updatedTournament = state.tournaments[tournamentId];

// AFTER (fixed):
const freshState = useGameStore.getState();
const updatedTournament = freshState.tournaments[tournamentId];
```

---

## Bug: Direct Mutation in `scheduleNewlyReadyMatches()`

### Root Cause

**Location:** `src/services/TournamentService.ts:725`

```typescript
// BEFORE: Direct mutation of store state
bracketMatch.scheduledDate = nextDay.toISOString();
```

This mutated bracket objects already in the Zustand store, breaking immutability and causing inconsistent React re-renders.

### Fix Applied

Deep clone the bracket before mutating:

```typescript
// Clone bracket at start of function
const bracket: BracketStructure = JSON.parse(JSON.stringify(tournament.bracket));

// Now safe to mutate cloned bracket
bracketMatch.scheduledDate = nextDay.toISOString();

// Save cloned+mutated bracket
state.updateBracket(tournament.id, bracket);
```

---

## Files Modified

### Core Fix
- `src/services/TournamentService.ts`:
  - Line 117-118: Get fresh state after `updateBracket()` call
  - Line 14: Added `BracketStructure` import
  - Lines 716-718: Deep clone bracket before mutating
  - Lines 757-803: Updated to use cloned `bracket` variable

### Documentation
- `docs/vct_manager_game_technical_specification.md`:
  - Added Section 20: "Zustand State Freshness After Store Updates"
  - Documents the anti-pattern and correct pattern
  - Includes bracket mutation warning with code examples

---

## Key Lessons Learned

### 1. Zustand State Snapshots are Point-in-Time

When you call `useGameStore.getState()`, you get a snapshot of the current state. If you then call a store action that modifies state, your snapshot variable still points to the OLD data. You must call `getState()` again to see the updated values.

### 2. Never Mutate Store Objects Directly

Objects retrieved from the store should be treated as immutable. If you need to modify them, deep clone first, modify the clone, then save the clone back via a store action.

---

## Verification

- TypeScript compilation: PASSED
- No runtime errors introduced
- Bracket progression should now work correctly through all tournament rounds

---

## Related Session Logs

- `2026-01-16-tournament-system-fixes.md` - Fixed order of operations in same function
- `2026-01-16-unified-simulation-system.md` - Unified time/simulation controls
