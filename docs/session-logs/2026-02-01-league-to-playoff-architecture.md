# League-to-Playoff Architecture Implementation

**Date**: 2026-02-01

## Overview

Implemented the `league_to_playoff` tournament format for Stage 1 and Stage 2 tournaments, unifying the round-robin league and double-elimination playoffs into a single `MultiStageTournament`. This mirrors the existing `swiss_to_playoff` pattern used by Masters and Champions.

## Problems Addressed

### 1. Playoff Matches Not Being Simulated

After Stage 1 league completed and transitioned to playoffs, advancing days past the scheduled playoff match dates (e.g., March 27) would not simulate the matches. The calendar would skip over them.

**Root Cause**: Playoff calendar events had no `phase` property, causing `CalendarService.advanceDay()` to process them during the wrong phase or skip them entirely due to phase mismatch detection.

### 2. Duplicate Stage Completion Calls

Both `MatchService` and `CalendarService` were detecting stage completion and calling `handleStageCompletion()`, causing duplicate modal triggers.

### 3. Tournament Lookup Failures

`CalendarService.findTournamentForPhaseAndRegion()` couldn't find `league_to_playoff` tournaments during the playoffs phase because it was checking `tournament.name.includes('Playoffs')`, which failed for unified tournaments.

## Solution: Unified Tournament Architecture

### Type System Updates

**File**: `src/types/competition.ts`

Added `league_to_playoff` format and `LeagueStage` interface:

```typescript
export type TournamentFormat =
  | 'single_elim' | 'double_elim' | 'round_robin'
  | 'swiss_to_playoff' | 'league_to_playoff';

export interface LeagueStage {
  format: 'round_robin';
  bracket: BracketStructure;
  standings: TournamentStandingsEntry[];
  matchesCompleted: number;
  totalMatches: number;
  teamsQualify: number;
}

export interface MultiStageTournament extends Tournament {
  format: 'swiss_to_playoff' | 'league_to_playoff';
  currentStage: 'swiss' | 'league' | 'playoff';
  swissStage?: SwissStage;
  leagueStage?: LeagueStage;
}

export function isLeagueToPlayoffTournament(t: Tournament): t is MultiStageTournament {
  return t.format === 'league_to_playoff';
}
```

### Service Layer Changes

**File**: `src/services/TournamentService.ts`

1. Added guard to prevent duplicate `handleStageCompletion` calls:

```typescript
private stageCompletionTriggered: Set<string> = new Set();

handleStageCompletion(tournamentId: string): void {
  if (this.stageCompletionTriggered.has(tournamentId)) {
    console.log(`handleStageCompletion already triggered for ${tournamentId}`);
    return;
  }
  this.stageCompletionTriggered.add(tournamentId);
  // ... rest of method
}
```

2. Added phase property to playoff calendar events in `addPlayoffCalendarEvents()`:

```typescript
const playoffPhase = tournament.type === 'stage1' ? 'stage1_playoffs'
                   : tournament.type === 'stage2' ? 'stage2_playoffs'
                   : undefined;

// Events now include phase property
data: {
  matchId: bracketMatch.matchId,
  // ... other fields
  phase: playoffPhase,
  isPlayoffMatch: true,
},
```

**File**: `src/services/CalendarService.ts`

1. Added import for `isLeagueToPlayoffTournament`

2. Fixed `findTournamentForPhaseAndRegion()` to handle `league_to_playoff` tournaments:

```typescript
if (isLeagueToPlayoffTournament(tournament)) {
  const isInPlayoffStage = tournament.currentStage === 'playoff';

  // During playoffs phase, only match tournaments in playoff stage
  if (isPlayoffPhase && !isInPlayoffStage) continue;

  // During league phase, only match tournaments in league stage
  if (!isPlayoffPhase && isInPlayoffStage) continue;

  return { id: tournament.id, name: tournament.name };
}
```

**File**: `src/components/tournament/StageCompletionModal.tsx`

Updated to always set phase to playoffs when closing modal for internal transitions:

```typescript
if (data.internalTransition) {
  const success = tournamentService.transitionLeagueToPlayoffs(data.tournamentId);

  // Always update phase to playoffs for internal transitions
  const newPhase = data.stageType === 'stage1' ? 'stage1_playoffs' : 'stage2_playoffs';
  state.setCurrentPhase(newPhase);
}
```

## Architecture Comparison

| Aspect | Masters (swiss_to_playoff) | Stage 1/2 (league_to_playoff) |
|--------|---------------------------|-------------------------------|
| Stages | Swiss → Playoff | League → Playoff |
| Phase Change | No (stays `masters1`) | Yes (`stage1` → `stage1_playoffs`) |
| Needs Phase on Events | No | Yes |
| Transition Method | `transitionToPlayoffs()` | `transitionLeagueToPlayoffs()` |

## Why Stage Tournaments Need Phase Filtering

1. League matches are created during `stage1` phase
2. Playoff matches are created when transitioning to `stage1_playoffs`
3. Without phase filtering, old league events could be re-processed or playoff events skipped
4. Masters/Champions don't need it because phase stays constant throughout

## Files Modified

- `src/types/competition.ts` - Added `LeagueStage`, updated `MultiStageTournament`
- `src/types/calendar.ts` - Added missing `MatchEventData` properties
- `src/services/TournamentService.ts` - Duplicate call guard, phase on playoff events
- `src/services/CalendarService.ts` - Import and tournament lookup fix
- `src/components/tournament/StageCompletionModal.tsx` - Internal transition handling

## Documentation Updated

- `docs/architecture/core-architecture.md`
  - Added "VCT Tournament Architecture Overview" section
  - Updated "Upfront Creation, Lazy Resolution Pattern" for unified Stage tournaments
  - Added "League-to-Playoff Tournament Flow" section
  - Expanded "Calendar Event Phase Filtering" with comparison table

## Testing

1. Start a new game with VCT Americas team
2. Advance through Stage 1 until all 30 league matches complete
3. Stage Completion modal should appear with final standings
4. Click "Continue to Stage 1 Playoffs"
5. Verify:
   - Phase changes to `stage1_playoffs`
   - Tournament view shows playoff bracket (not league standings)
   - First round matches have teams (not TBD)
   - Match dates are correct (not overlapping with league dates)
6. Advance to playoff match dates
7. Verify matches are simulated and bracket advances correctly

## Related Sessions

- `2026-02-01-stage1-playoffs-transition-fix.md` - Earlier fix for region parameter
- `2026-01-31-stage1-bug-fixes.md` - Stage 1 architecture issues
- `2026-01-30-explicit-bracket-format.md` - Bracket format refactor
