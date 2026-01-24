# Session Log: Masters Double Elimination Bracket Fix

**Date**: 2026-01-24
**Feature**: Fix double elimination bracket structure for Masters Santiago playoffs
**Status**: Fixed

---

## Problem Statement

The Masters Santiago playoff bracket (8-team double elimination) had two critical bugs:

1. **Upper Round 2 losers not falling to Lower Round 2**: UR2 losers were incorrectly mapped to LR3 instead of LR2
2. **Wrong number of matches in lower bracket rounds**: LR3 and LR4 had incorrect match counts

### Expected vs Actual Structure

**Expected (per Liquipedia VCT/2026/Stage_1/Masters#Playoffs):**
- LR1: 2 matches (UR1 losers paired up)
- LR2: 2 matches (UR2 losers vs LR1 winners)
- LR3: 1 match (LR2 winners face each other)
- LR4: 1 match (Upper Final loser vs LR3 winner)

**Actual (bugged):**
- LR1: 2 matches
- LR2: 2 matches (internal round - no dropouts!)
- LR3: 2 matches (UR2 losers dropping in here incorrectly)
- LR4: 1 match

---

## Root Causes

### Bug 1: Incorrect `getLowerRoundForUpperLoser` Formula

**Location**: `src/engine/competition/BracketManager.ts:1509-1521` (now removed)

The formula `(upperRound - 1) * 2` produced incorrect round indices:
- UR1 (round=1): `(1-1)*2 = 0` → LR1 (correct)
- UR2 (round=2): `(2-1)*2 = 2` → LR3 (WRONG - should be LR2)
- Upper Final: special case handled separately

### Bug 2: Alternating Dropout/Internal Design Flaw

The original code assumed a strict alternation pattern:
- Odd rounds = "dropout" (only upper losers)
- Even rounds = "internal" (only lower winners)

This doesn't match actual double elimination structure where:
- LR2 is a **combined** round (UR2 losers + LR1 winners)
- LR4 is also **combined** (Upper Final loser + LR3 winner)

---

## Solution

Rewrote `generateDoubleElimination` with explicit round-by-round logic:

```typescript
// Lower bracket structure for 8 teams:
// LR1: 2 matches (UR1 losers paired up)
// LR2: 2 matches (UR2 losers vs LR1 winners) - combined
// LR3: 1 match (LR2 winners face each other) - internal
// LR4: 1 match (Upper Final loser vs LR3 winner) - combined

for (let lowerRound = 1; lowerRound <= numLowerRounds; lowerRound++) {
  if (lowerRound === 1) {
    // LR1: Pure dropout - UR1 losers paired up
  } else if (lowerRound % 2 === 0 && lowerRound < numLowerRounds) {
    // Even rounds (LR2): Combined - upper losers vs previous lower winners
  } else if (lowerRound % 2 === 1 && lowerRound > 1 && lowerRound < numLowerRounds) {
    // Odd rounds after LR1 (LR3): Internal - previous lower winners face each other
  } else if (lowerRound === numLowerRounds) {
    // Final lower round (LR4): Upper Final loser vs previous lower winner
  }
}
```

**Key fixes:**
1. UR1 losers → LR1 (2:1 mapping via `floor(matchIdx/2)`)
2. UR2 losers → LR2 (direct 1:1 mapping)
3. Upper Final loser → LR4 (final lower round)
4. Removed `getLowerRoundForUpperLoser` method entirely

---

## Files Changed

1. `src/engine/competition/BracketManager.ts`
   - Rewrote `generateDoubleElimination` method with correct round structure
   - Removed unused `getLowerRoundForUpperLoser` private method
   - Fixed loser destinations in upper bracket

2. `src/services/TournamentService.ts`
   - Added missing `SwissStage` and `SwissTeamRecord` type imports
   - Fixed unused variable and untyped parameter issues

3. `src/services/TournamentTransitionService.ts`
   - Fixed incorrect calls to private TournamentService methods
   - Added local helper methods for scheduling and event creation
   - Fixed unused parameter warnings

4. `src/services/RegionalSimulationService.ts`
   - Removed unused type imports

5. `docs/architecture/implementation-details.md`
   - Updated double elimination bracket documentation

---

## Verification

Ran test script to verify bracket structure:

```
=== SUMMARY ===
Upper bracket rounds: 3
Lower bracket rounds: 4
Lower bracket match counts: LR1: 2, LR2: 2, LR3: 1, LR4: 1
Expected: LR1: 2, LR2: 2, LR3: 1, LR4: 1
```

Loser destinations verified:
- UR1 match-1/2 losers → LR1-m1
- UR1 match-3/4 losers → LR1-m2
- UR2 match-5 loser → LR2-m1
- UR2 match-6 loser → LR2-m2
- Upper Final loser → LR4-m1

---

## Related Issues

- Previous fix in `2026-01-22-masters-tournament-progression-fixes.md` addressed Swiss stage freezing and playoff scheduling issues
- This fix completes the Masters Santiago bracket implementation
