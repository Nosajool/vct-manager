# Session Log: ChemistryCalculator Refactor

**Date:** January 11, 2026
**Author:** minimax-m2.1
**Task:** Extract ChemistryCalculator as standalone engine class

## Summary

Extracted chemistry logic from scattered locations into a dedicated `ChemistryCalculator` engine class. Also created shared constants file to avoid code duplication between engine classes.

## Changes Made

### 1. Created Shared Constants (`src/engine/match/constants.ts`)
- Extracted `STAT_WEIGHTS` (stat weights for team strength calculation)
- Extracted `MAX_CHEMISTRY_BONUS` (20% maximum chemistry bonus)
- Both constants now imported by `MatchSimulator` and `ChemistryCalculator`

### 2. Created ChemistryCalculator Engine (`src/engine/team/ChemistryCalculator.ts`)
Pure engine class with no React/store dependencies:

**Public Methods:**
- `generateInitialChemistry()` - Generate random chemistry (50-80) for new teams
- `calculateBonusMultiplier(chemistryScore)` - Returns 1.0-1.2 multiplier
- `calculateTeamStrength(players, chemistry)` - Full team strength with chemistry
- `calculateMatchChemistryChanges(players, result, won)` - Post-match chemistry updates
- `calculateScrimChemistryChanges(players, maps, intensity)` - Post-scrim updates
- `calculatePairChemistry(p1, p2)` - Pairwise chemistry based on stats
- `calculateOverallChemistry(pairs)` - Aggregate pairwise to overall
- `applyChemistryUpdate(current, update)` - Apply chemistry changes

**Private Methods:**
- `calculatePairChangesFromMatch()` - Calculate pair changes from match performance
- `calculatePairChangesFromScrim()` - Calculate pair changes from scrim performance

### 3. Updated MatchSimulator (`src/engine/match/MatchSimulator.ts`)
- Now imports `STAT_WEIGHTS` and `MAX_CHEMISTRY_BONUS` from shared constants

### 4. Updated Team Engine Index (`src/engine/team/index.ts`)
- Added exports for `ChemistryCalculator`, `chemistryCalculator`, and `ChemistryUpdate`

### 5. Updated Technical Spec (`docs/vct_manager_game_technical_specification.md`)
- Added `ChemistryCalculator.ts` to directory structure
- Removed ChemistryCalculator from Known Technical Debt table

## Benefits
- Single source of truth for chemistry calculations
- Easier to test and maintain chemistry logic
- Reduced code duplication (shared constants)
- Enables future improvements (coach bonuses, personality-based chemistry)
- Follows architectural principles: pure functions, no side effects

## Files Modified/Created
```
src/engine/match/constants.ts         (NEW)
src/engine/team/ChemistryCalculator.ts (NEW)
src/engine/match/MatchSimulator.ts    (MODIFIED - import shared constants)
src/engine/team/index.ts              (MODIFIED - added exports)
docs/vct_manager_game_technical_specification.md (MODIFIED)
```

## Notes
- Chemistry calculations still need to be integrated into `TeamManager` and `ScrimEngine` (future task)
- Pair chemistry feature is implemented but not yet utilized (requires match history tracking)
