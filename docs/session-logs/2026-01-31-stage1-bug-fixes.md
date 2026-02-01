# Stage 1 Bug Fixes - Architecturally Aligned Implementation

**Date**: 2026-01-31

## Summary

Implemented 5 bug fixes for Stage 1 tournament issues, following architectural principles from `docs/architecture/core-architecture.md`. The fixes address standings synchronization, phase filtering, bracket mutation, and stage completion detection.

## Issues Fixed

### Issue 1 & 2: Standings & Bracket Not Updating

**Problem**:
- `tournament.standings` was updated by MatchService
- `standings[tournamentId]` was updated by `calculateLeagueStandings()` called from UI useEffect
- This violated separation of concerns - UI was triggering service calls for state sync

**Solution**: Moved standings sync from UI to service layer. MatchService now calls `calculateLeagueStandings()` after updating tournament standings for round-robin formats.

### Issue 3: Teams Not Advancing in Playoffs

**Problem**: Direct mutation of bracket matches in `scheduleTournamentMatches()`:
```typescript
match.scheduledDate = currentDate.toISOString();  // Direct mutation!
```

**Solution**: Replaced with immutable updates using spread operators to create new bracket objects.

### Issue 4: Stage Completion Modal Not Showing

**Problem**: Stage completion was only checked when matches were simulated that day. If the last match was yesterday and today has no matches, the check never ran.

**Solution**: Always check stage completion during stage1/stage2 phases, regardless of whether matches were simulated.

### Issue 5: Masters London Simulable During Stage 1

**Problem**: Calendar events for tournament matches were created without a `phase` property, so phase filtering in CalendarService didn't work.

**Solution**: Added `getPhaseForTournament()` helper and included `phase` property in all match calendar events.

## Files Modified

### 1. `src/services/CalendarService.ts`

Changed stage completion check to always run during stage phases:

```typescript
// Before
if (simulatedMatches.length > 0) {
  this.checkStageCompletion(state.calendar.currentPhase);
}

// After
if (currentPhase === 'stage1' || currentPhase === 'stage2') {
  this.checkStageCompletion(currentPhase);
}
```

### 2. `src/services/TournamentTransitionService.ts`

**Added helper method** for phase mapping:
```typescript
private getPhaseForTournament(tournament: Tournament): SeasonPhase | undefined {
  switch (tournament.type) {
    case 'masters':
      return tournament.name.includes('Santiago') ? 'masters1' : 'masters2';
    case 'champions':
      return 'champions';
    case 'stage1':
      return tournament.name.includes('Playoffs') ? 'stage1_playoffs' : 'stage1';
    case 'stage2':
      return tournament.name.includes('Playoffs') ? 'stage2_playoffs' : 'stage2';
    case 'kickoff':
      return 'kickoff';
    default:
      return undefined;
  }
}
```

**Added phase property** to match events in `addTournamentCalendarEvents()` and `addInternationalTournamentCalendarEvents()`.

**Replaced scheduleTournamentMatches()** with immutable version using spread operators.

### 3. `src/services/MatchService.ts`

Added standings sync after tournament standings update:
```typescript
state.updateTournament(tournamentId, { standings });

// Sync to standings slice for round-robin tournaments
if (tournament.format === 'round_robin') {
  tournamentService.calculateLeagueStandings(tournamentId);
}
```

### 4. `src/pages/Tournament.tsx`

**Removed** the useEffect that called `calculateLeagueStandings()` (now handled by MatchService).

**Added** phase change effect to reset tournament selection:
```typescript
const currentPhase = useGameStore((state) => state.calendar.currentPhase);

useEffect(() => {
  setSelectedTournamentId(null);
}, [currentPhase]);
```

**Removed** unused `tournamentService` import.

## Architecture Documentation Updated

Added new sections to `docs/architecture/core-architecture.md`:

1. **Service Layer Orchestration Patterns** - Guidelines for cross-slice synchronization
2. **Calendar Event Phase Filtering** - How phase property enables correct filtering
3. **Stage Completion Detection** - Why checking must happen every day during stage phases
4. **Immutable State Updates** - Bracket mutation warning with correct patterns

## Verification

- TypeScript compilation: Pass
- ESLint: Pre-existing warnings only (no new issues)
- Vite build: Pass

## Architectural Principles Applied

1. **Separation of Concerns**: Moved standings sync from UI to service layer
2. **Immutable State**: Replaced bracket mutation with spread operator pattern
3. **Single Source of Truth**: Service layer now orchestrates all state updates
4. **Complete Event Metadata**: Phase property enables proper filtering
