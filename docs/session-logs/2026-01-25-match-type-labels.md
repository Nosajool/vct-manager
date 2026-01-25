# Session Log: Match Type Labels in Simulation Results

**Date**: 2026-01-25
**Feature**: Display match type labels (e.g., "Upper Round 1 Match 2") in SimulationResultsModal
**Status**: Complete

---

## Problem Statement

When viewing simulation results after advancing time, matches displayed only the team names and scores. Users had no way to identify which round or bracket position a match represented (e.g., "Is this the grand final or an early round match?").

### User Request

> "In the Simulation Results, I want to be able to see what the match type is. For example, Upper Round 1 Match 2."

---

## Solution

Added match type labels to the `SimulationResultsModal` component that display the bracket position and round for each tournament match.

### Implementation Details

#### 1. New Helper Functions

**`findBracketMatchInfo()`** - Searches a bracket structure to find a match by its ID:
- Returns bracket type (upper/middle/lower/grandfinal)
- Returns round number
- Returns match index within the round

**`getMatchLabel()`** - Generates human-readable labels:
- Handles Swiss tournaments (searches swiss stage first, then playoff bracket)
- Handles regular bracket tournaments (single/double/triple elimination)

**`formatMatchLabel()`** - Formats the label based on tournament type:
- Triple elimination: "Alpha Round 1 Match 2", "Beta Round 2 Match 1", "Omega Round 1 Match 1"
- Double elimination: "Upper Round 1 Match 2", "Lower Round 2 Match 1"
- Swiss stage: "Swiss Round 1 Match 3"
- Grand Final: "Grand Final"

#### 2. Updated Types

Added `matchLabel?: string` to the `MatchWithDetails` interface.

#### 3. UI Display

Match label is displayed centered above the team names in the `MatchCard` component:
```tsx
{matchLabel && (
  <div className="text-xs text-vct-gray/70 mb-2 text-center">
    {matchLabel}
  </div>
)}
```

---

## Match Label Examples

| Tournament Type | Bracket Position | Label |
|----------------|------------------|-------|
| VCT Kickoff (Triple Elim) | Upper bracket, round 1, match 2 | "Alpha Round 1 Match 2" |
| VCT Kickoff (Triple Elim) | Middle bracket, round 2, match 1 | "Beta Round 2 Match 1" |
| VCT Kickoff (Triple Elim) | Lower bracket, round 1, match 1 | "Omega Round 1 Match 1" |
| Stage Playoffs (Double Elim) | Upper bracket, round 1, match 3 | "Upper Round 1 Match 3" |
| Stage Playoffs (Double Elim) | Lower bracket, round 2, match 1 | "Lower Round 2 Match 1" |
| Masters (Swiss) | Swiss stage, round 2, match 4 | "Swiss Round 2 Match 4" |
| Any tournament | Grand final | "Grand Final" |
| League match | No bracket | (no label displayed) |

---

## Files Changed

1. **`src/components/calendar/SimulationResultsModal.tsx`**
   - Added `matchLabel` to `MatchWithDetails` interface
   - Added `findBracketMatchInfo()` helper function
   - Added `getMatchLabel()` function for label generation
   - Added `formatMatchLabel()` for bracket type formatting
   - Updated `MatchCard` component to display the label
   - Updated `useMemo` hook to populate `matchLabel` for each match

2. **`docs/architecture/development-status.md`**
   - Added Phase 17 documentation
   - Updated completed phases list

---

## Technical Notes

### Match ID to Bracket Match Mapping

The `Match.id` corresponds to `BracketMatch.matchId`. This relationship was established in the tournament service where match entities are created with the bracket match's ID:

```typescript
// From TournamentService
const match: Match = {
  id: bracketMatch.matchId,  // Same as bracket match ID
  tournamentId: tournament.id,
  // ...
};
```

### Swiss Tournament Structure

Swiss tournaments (`swiss_to_playoff` format) have a nested structure:
- `swissStage.rounds[]` - Contains swiss stage matches
- `playoffBracket` - Contains playoff bracket matches

Both structures use `BracketMatch` type for their matches.

---

## Verification

- TypeScript compilation passes with no errors
- Feature is backward compatible - league matches without bracket data show no label
- Labels display correctly for all bracket types (upper, middle, lower, grandfinal)
