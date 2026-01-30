# Session Log: Phase-Appropriate Team Status Display

**Date**: 2026-01-29
**Feature**: Phase-appropriate team status display for Dashboard and Schedule

## Summary

Implemented a system to display tournament-specific team status based on the current game phase, fixing a bug where teams showed accumulated career records instead of phase-specific records.

## Problem Statement

1. **Dashboard and Schedule** always displayed cumulative career stats (`team.standings.wins/losses`) regardless of tournament phase
2. **Bug**: When entering Stage 1 after Masters Santiago completed, teams showed carried-over records (e.g., "5W - 3L") instead of starting fresh at "0W - 0L"
3. **Root cause**: `TournamentService.calculateLeagueStandings()` used `team.standings` (career stats) instead of `tournament.standings` (per-tournament stats)

## Solution

### 1. Created Phase Status Utility (`src/utils/phaseStatus.ts`)

A new utility that determines what to display based on the current tournament phase:

| Phase Type | Examples | Display Format |
|------------|----------|----------------|
| Bracket | kickoff, playoffs, champions | "Upper R2", "Lower Final", "Eliminated", "Champion" |
| Swiss | masters1/2 (swiss stage) | "1-0", "2-1", "Qualified", "Eliminated" |
| League | stage1, stage2 | "2W - 1L", "#3 VCT Stage 1" |
| Offseason | offseason | Career record fallback |

Key functions:
- `findActiveTournament()` - Finds the relevant tournament for current phase and team region
- `getTeamBracketPosition()` - Determines team's position in bracket structure
- `getPhaseStatusDisplay()` - Main entry point returning display data

### 2. Updated Dashboard (`src/pages/Dashboard.tsx`)

- Imported and integrated `getPhaseStatusDisplay` utility
- Team header now shows phase-appropriate label and sublabel
- Falls back to career stats if no tournament is active

### 3. Updated Schedule (`src/pages/Schedule.tsx`)

- Imported and integrated `getPhaseStatusDisplay` utility
- Conditional rendering based on phase type:
  - Bracket: Shows position with color coding (red for eliminated, yellow for champion)
  - Swiss: Shows compact Swiss record
  - League: Shows full record with W/L/RD and tournament context

### 4. Fixed StandingsTable Bug (`src/services/TournamentService.ts`)

Changed `calculateLeagueStandings()` to use tournament-specific standings:

**Before (buggy):**
```typescript
const standings: StandingsEntry[] = tournament.teamIds.map((teamId) => {
  const team = state.teams[teamId];
  return {
    teamId,
    teamName: team?.name || 'Unknown',
    wins: team?.standings.wins || 0,       // Career wins!
    losses: team?.standings.losses || 0,   // Career losses!
    roundDiff: team?.standings.roundDiff || 0,
  };
});
```

**After (fixed):**
```typescript
const standings: StandingsEntry[] = tournament.teamIds.map((teamId) => {
  const team = state.teams[teamId];
  const tournamentStanding = tournament.standings?.find(s => s.teamId === teamId);
  return {
    teamId,
    teamName: team?.name || 'Unknown',
    wins: tournamentStanding?.wins || 0,       // Tournament-specific!
    losses: tournamentStanding?.losses || 0,   // Tournament-specific!
    roundDiff: tournamentStanding?.roundDiff || 0,
  };
});
```

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `src/utils/phaseStatus.ts` | Created | New utility for phase-appropriate status display |
| `src/pages/Dashboard.tsx` | Modified | Uses phaseStatus utility for team header |
| `src/pages/Schedule.tsx` | Modified | Uses phaseStatus utility with conditional rendering |
| `src/services/TournamentService.ts` | Modified | Fixed `calculateLeagueStandings()` to use tournament.standings |
| `docs/architecture/implementation-details-page-2.md` | Modified | Added documentation for phase status system |

## Architecture Notes

### Two Standings Systems

The codebase has two different standings systems that serve different purposes:

| System | Location | Purpose | Resets? |
|--------|----------|---------|---------|
| Career Stats | `team.standings` | Historical tracking, overall team performance | Never |
| Tournament Stats | `tournament.standings` | Per-tournament qualification, StandingsTable display | Yes - initialized fresh per tournament |

### Data Flow

```
Tournament Created (GlobalTournamentScheduler)
    │
    ├── tournament.standings initialized to 0-0 for all teams
    │
Match Played (MatchService)
    │
    ├── tournament.standings updated via updateTournamentStandings()
    ├── team.standings updated via recordWin/recordLoss (career)
    │
Display (Dashboard/Schedule)
    │
    └── getPhaseStatusDisplay() looks up tournament.standings
```

## Testing

- Build passes: `npm run build` ✓
- TypeScript check: `npx tsc --noEmit` ✓
- No new lint errors introduced

## What's Working

1. Dashboard shows phase-appropriate status (bracket position, Swiss record, or league standings)
2. Schedule shows phase-appropriate status with proper formatting
3. StandingsTable shows tournament-specific records (0-0 at start of Stage 1)
4. Bracket position detection works for upper/middle/lower brackets
5. Swiss record display shows wins-losses and qualification status

## Known Issues

None introduced by this change. Pre-existing lint warnings remain.

## Next Steps

- Consider adding phase status to other UI areas (e.g., team cards, match previews)
- Could enhance bracket position detection to show "advancing to Round X" after a win
