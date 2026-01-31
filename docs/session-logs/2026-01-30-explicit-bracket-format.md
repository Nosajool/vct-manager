# Session Log: Explicit Bracket Format Field

**Date**: 2026-01-30
**Feature**: Add explicit `format` field to `BracketStructure`

## Problem

The bracket completion detection was using destination types to infer bracket format:

```typescript
// FLAWED: Detected "placement" destination as round-robin
if (match.winnerDestination?.type === 'placement') {
  isRoundRobin = true;
}
```

This failed because:
- **Round-robin**: ALL matches have placement destinations (correct)
- **Triple elimination (Kickoff)**: Final match winners ALSO have placement destinations (for Masters qualification)

Symptoms:
- Stage 1 round-robin incorrectly triggering completion after few matches
- Kickoff tournaments being detected as round-robin and never completing properly

## Solution

Added an explicit `format` field to `BracketStructure` instead of inferring format from match destinations.

### New Type

```typescript
export type BracketFormat = 'single_elim' | 'double_elim' | 'triple_elim' | 'round_robin';

export interface BracketStructure {
  format: BracketFormat;     // Explicit format for clean completion detection
  upper: BracketRound[];
  middle?: BracketRound[];   // Triple elimination
  lower?: BracketRound[];    // Double/Triple elimination
  grandfinal?: BracketMatch;
}
```

### Key Insight

Only round-robin has placement for BOTH winner AND loser on ALL matches:

| Format | Winner Destination | Loser Destination |
|--------|-------------------|-------------------|
| Single Elim | match/champion | eliminated |
| Double Elim | match/champion | match/eliminated |
| Triple Elim | match/**placement** | match/eliminated |
| Round Robin | **placement** | **placement** |

Triple-elim only uses placement for final winners (Alpha/Beta/Omega → placement 1/2/3).

## Files Modified

### 1. `src/types/competition.ts`
- Added `BracketFormat` type
- Added required `format: BracketFormat` field to `BracketStructure`

### 2. `src/types/index.ts`
- Export the new `BracketFormat` type

### 3. `src/engine/competition/BracketManager.ts`
- `generateSingleElimination()`: Set `format: 'single_elim'`
- `generateDoubleElimination()`: Set `format: 'double_elim'`
- `generateTripleElimination()`: Set `format: 'triple_elim'`
- `generateRoundRobin()`: Set `format: 'round_robin'`
- `getBracketStatus()`: Use `bracket.format` instead of destination-based detection
- `getChampion()`: Use `bracket.format === 'round_robin'` instead of destination check

### 4. `src/services/GlobalTournamentScheduler.ts`
- Updated all empty placeholder brackets: `{ format: 'double_elim', upper: [] }`
- Updated `prefixBracketMatchIds()` to preserve format field

### 5. `src/engine/competition/TournamentEngine.ts`
- Updated empty bracket placeholder: `{ format: 'double_elim', upper: [] }`
- Updated `prefixBracketMatchIds()` to preserve format field

### 6. Documentation
- `docs/architecture/core-architecture.md`: Updated `BracketStructure` interface definition
- `docs/architecture/implementation-details-page-2.md`: Added Section 23 documenting the change

## Tournament Coverage

All bracket-based tournaments are now covered:

| Tournament | Format | Bracket Generation |
|------------|--------|-------------------|
| Kickoff | `triple_elim` | `generateTripleElimination()` |
| Masters Playoffs | `double_elim` | `generateDoubleElimination()` |
| Stage 1/2 League | `round_robin` | `generateRoundRobin()` |
| Stage 1/2 Playoffs | `double_elim` | `generateDoubleElimination()` |
| Champions Playoffs | `double_elim` | `generateDoubleElimination()` |

Swiss stages use `SwissStage` type, not `BracketStructure`, so they're unaffected.

## What's Working

- TypeScript compiles without errors
- All bracket generators set explicit format
- All placeholder brackets include format field
- `getBracketStatus()` uses explicit format for completion detection
- `getChampion()` uses explicit format for round-robin check

## Verification Points

Test each tournament type completes correctly:

1. **Kickoff**: All 4 regional Kickoffs complete, qualifiers go to Masters
2. **Masters Santiago**: Swiss stage completes, playoffs complete, champion crowned
3. **Stage 1 League**: All 30 matches (5 weeks) complete, top 8 qualify for playoffs
4. **Stage 1 Playoffs**: Double-elim completes, champion crowned
5. **Masters London**: Same as Santiago
6. **Stage 2 League**: Same as Stage 1
7. **Stage 2 Playoffs**: Same as Stage 1 Playoffs
8. **Champions**: Swiss + playoffs complete

## Next Steps

- Manual testing to verify all tournament types complete correctly
- Monitor for any edge cases in bracket completion detection
