# Bugfix: Tournament Bracket Sync from Schedule

**Date:** 2026-01-11

## Problem

When simulating a tournament match from the Schedule page by clicking "Simulate Match," the tournament bracket was not being updated. The match would complete, but teams wouldn't advance to their next bracket positions.

## Root Cause

The `MatchService.simulateMatch()` method updated match status, team standings, and player stats, but it had no awareness of tournament brackets. When a match was simulated:

1. **Schedule page** called `matchService.simulateMatch(matchId)` directly
2. **MatchService** updated the Match entity and stored the result
3. **BUT** it never called `tournamentService.advanceTournament()` to update the bracket!

The `TournamentService.simulateNextMatch()` method correctly called both, but using the Schedule page as an entry point bypassed this.

## Solution

Modified `src/services/MatchService.ts` to:
1. Import `tournamentService` from `./TournamentService`
2. After simulating a match, check if `match.tournamentId` exists
3. If it's a tournament match, call `tournamentService.advanceTournament()` to update the bracket

### Code Change

```typescript
// In simulateMatch(), after applyMatchResult():
// Advance tournament bracket if this is a tournament match
if (match.tournamentId) {
  tournamentService.advanceTournament(match.tournamentId, matchId, result);
}
```

This ensures that regardless of which entry point triggers match simulation (Schedule page, Tournament page, or auto-simulation), the tournament bracket is always updated.

## Architecture Compliance

Added to the technical specification's "Architecture Compliance Checklist":
- **Cross-service integration** - When simulating a match that belongs to a tournament, the service must also advance the tournament bracket

Added new section "Cross-Service Integration Rules":
- Regular season matches: Update match status, team standings, player stats
- Tournament matches: Additionally advance the tournament bracket

## Files Modified

1. `src/services/MatchService.ts` - Added tournament bracket advancement
2. `docs/vct_manager_game_technical_specification.md` - Added cross-service integration rules

## Verification

The fix follows the architecture pattern:
- Engine classes remain pure (no React/store dependencies)
- Services orchestrate store updates
- MatchService now ensures all related state is updated for tournament matches
- The circular import between MatchService and TournamentService resolves at runtime
