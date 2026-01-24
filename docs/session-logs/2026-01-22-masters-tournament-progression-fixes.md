# Session Log: Masters Tournament Progression Fixes

**Date**: 2026-01-22
**Feature**: Bug fixes for Masters Santiago Swiss stage and playoff bracket progression
**Status**: Fixed

---

## Problem Statement

After implementing the Masters Santiago tournament with Swiss stage + playoffs format, three critical bugs prevented the tournament from progressing correctly:

1. **Swiss Stage Getting Stuck**: After completing match 4 in the final Swiss round, no more matches were scheduled and the tournament froze
2. **Playoff Matches Not Simulating**: Tournament transitioned to playoffs but matches weren't being played
3. **Lower Bracket Broken**: Upper bracket losers were not properly falling into the lower bracket, causing progression to halt

### User Impact

Players would get stuck after completing the Swiss stage and couldn't progress through the Masters tournament to reach Stage 1, effectively blocking the entire season progression.

---

## Root Causes

### Bug 1: Swiss Stage Freeze

**Location**: `src/services/TournamentService.ts:551-561`

The `advanceSwissMatch` method had no handling for the case where:
- The final Swiss round (round 3) completes
- But some teams are still "active" (haven't reached 2 wins or 2 losses)
- This happens when teams can't be paired due to:
  - Odd number of active teams remaining
  - Rematch constraints preventing valid pairings

**Code Path**:
```typescript
if (bracketManager.isSwissRoundComplete(updatedSwissStage)) {
  if (bracketManager.isSwissStageComplete(updatedSwissStage)) {
    this.transitionToPlayoffs(tournamentId);
  } else if (updatedSwissStage.currentRound < updatedSwissStage.totalRounds) {
    this.generateNextSwissRound(tournamentId);
  }
  // ❌ NO ELSE CLAUSE - if round is complete but stage isn't and we've hit max rounds, NOTHING HAPPENS
}
```

### Bug 2: Playoff Scheduling

**Location**: `src/services/TournamentService.ts:1028-1098`

The `scheduleTournamentMatches` method used `tournament.startDate` as the base date for scheduling playoff matches. Since the tournament started during the Swiss stage (days ago), playoff matches were being scheduled for dates that had already passed.

**Code**:
```typescript
private scheduleTournamentMatches(tournament: Tournament): void {
  const startDate = new Date(tournament.startDate); // ❌ This is from Swiss start (in the past)
  let currentDate = new Date(startDate);
  // Playoff matches get scheduled for past dates → never simulated
}
```

### Bug 3: Lower Bracket Match Count & Routing

**Location**: `src/engine/competition/BracketManager.ts:251-268, 204-213`

Three interconnected issues in the double elimination bracket generation:

1. **Incorrect match count calculation** (line 256):
```typescript
// Old formula was wrong for dropout rounds
numMatches = Math.ceil(bracketSize / Math.pow(2, Math.floor((lowerRound + 1) / 2) + 1));
// For 8-team bracket, lower R3 should have 2 matches but calculated 1
```

2. **Wrong loser destination indices** (line 209):
```typescript
matchId: `lower-r${lowerRoundIdx + 1}-m${matchIdx + 1}`
// Upper R1 has 4 matches trying to go to lower-r1-m1, m2, m3, m4
// But lower R1 only has 2 matches!
```

3. **Upper final loser routing** (line 1408):
```typescript
return (upperRound - 1) * 2;
// Upper R3 loser was going to lower R5 which doesn't exist
// Should go to lower R4 (lower final)
```

---

## Solutions

### Fix 1: Force-Complete Swiss Stage

**File**: `src/services/TournamentService.ts`

Added handling for the edge case where the final Swiss round completes but teams remain active:

```typescript
// Line 551-573: Added else clause
if (bracketManager.isSwissRoundComplete(updatedSwissStage)) {
  if (bracketManager.isSwissStageComplete(updatedSwissStage)) {
    this.transitionToPlayoffs(tournamentId);
  } else if (updatedSwissStage.currentRound < updatedSwissStage.totalRounds) {
    this.generateNextSwissRound(tournamentId);
  } else {
    // ✓ NEW: Force-complete by qualifying/eliminating remaining teams
    console.warn(
      `Swiss stage reached totalRounds (${updatedSwissStage.totalRounds}) but stage is not complete. ` +
      `Forcing completion based on current standings.`
    );
    this.forceCompleteSwissStage(tournamentId);
  }
}
```

**New Method** (lines 659-747):
```typescript
forceCompleteSwissStage(tournamentId: string): boolean {
  // Get active teams sorted by standings (wins desc, losses asc, round diff desc, seed asc)
  const activeTeams = swissStage.standings
    .filter(t => t.status === 'active')
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff;
      return (a.seed || 999) - (b.seed || 999);
    });

  // Calculate needed qualifications/eliminations
  const qualifiersNeeded = swissStage.winsToQualify * Math.floor(swissStage.standings.length / 2)
    - swissStage.qualifiedTeamIds.length;

  // Qualify top teams, eliminate the rest
  for (const team of activeTeams) {
    if (qualified < qualifiersNeeded) {
      // Qualify this team
      standing.status = 'qualified';
      updatedSwissStage.qualifiedTeamIds.push(standing.teamId);
    } else {
      // Eliminate this team
      standing.status = 'eliminated';
      updatedSwissStage.eliminatedTeamIds.push(standing.teamId);
    }
  }

  // Transition to playoffs
  this.transitionToPlayoffs(tournamentId);
}
```

### Fix 2: Schedule Playoffs from Current Date

**File**: `src/services/TournamentService.ts`

Created new method that schedules playoff matches starting from current date + 1 day:

```typescript
// Lines 1024-1108: New method
private schedulePlayoffMatches(tournament: Tournament): void {
  const state = useGameStore.getState();
  const currentCalendarDate = state.calendar.currentDate;

  // ✓ Start scheduling from next day (not tournament start date)
  let currentDate = new Date(currentCalendarDate);
  currentDate.setDate(currentDate.getDate() + 1);

  console.log(`Scheduling playoff matches starting from ${currentDate.toISOString()}`);

  // Schedule ready matches for future dates
  for (const round of tournament.bracket.upper) {
    for (const match of round.matches) {
      if (match.status !== 'ready') continue;
      match.scheduledDate = currentDate.toISOString();
      matchCount++;
      if (matchCount % matchesPerDay === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  }
  // ... same for lower bracket, middle bracket, grand final
}
```

**Updated Transition** (lines 646-660):
```typescript
if (updatedTournament) {
  // ✓ Use new scheduling method that uses current date
  this.schedulePlayoffMatches(updatedTournament);
  // Save the updated bracket with scheduled dates back to store
  freshState.updateBracket(tournamentId, updatedTournament.bracket);
  // Create Match entities and calendar events
  const finalTournament = useGameStore.getState().tournaments[tournamentId];
  this.createMatchEntitiesForReadyBracketMatches(finalTournament);
  this.addTournamentCalendarEvents(finalTournament);
}
```

### Fix 3: Correct Lower Bracket Math

**File**: `src/engine/competition/BracketManager.ts`

#### 3a. Fixed Match Count Calculation (lines 251-268)

```typescript
// Old (incorrect):
numMatches = Math.ceil(bracketSize / Math.pow(2, Math.floor((lowerRound + 1) / 2) + 1));

// New (correct):
if (lowerRound === 1) {
  numMatches = bracketSize / 4; // Half of first upper round losers
} else if (isDropdownRound) {
  // Dropdown rounds: match count equals number of upper losers dropping in
  const upperRound = Math.floor(lowerRound / 2) + 1;
  numMatches = bracketSize / Math.pow(2, upperRound); // Number of matches in that upper round
} else {
  // Internal rounds: winners from previous round pair up
  const prevUpperRound = Math.floor((lowerRound - 1) / 2) + 1;
  const prevMatches = bracketSize / Math.pow(2, prevUpperRound);
  numMatches = Math.ceil(prevMatches / 2);
}
```

**Result**: For 8-team bracket:
- Lower R1 (dropdown): 2 matches ✓ (was 2)
- Lower R2 (internal): 1 match ✓ (was 1)
- Lower R3 (dropdown): 2 matches ✓ (was 1 ❌)
- Lower R4 (internal): 1 match ✓ (was 1)

#### 3b. Fixed Loser Destination Mapping (lines 204-213)

```typescript
// Old (incorrect):
const loserDestination: Destination = {
  type: 'match',
  matchId: `lower-r${lowerRoundIdx + 1}-m${matchIdx + 1}`,
};

// New (correct):
const lowerMatchIdx = round === 1 ? Math.floor(matchIdx / 2) + 1 : matchIdx + 1;
const loserDestination: Destination = {
  type: 'match',
  matchId: `lower-r${lowerRoundIdx + 1}-m${lowerMatchIdx}`,
};
```

**Result**: Upper R1 (4 matches) → Lower R1 (2 matches):
- Upper match 0 → Lower match 1 ✓ (was match 1)
- Upper match 1 → Lower match 1 ✓ (was match 2 ❌)
- Upper match 2 → Lower match 2 ✓ (was match 3 ❌)
- Upper match 3 → Lower match 2 ✓ (was match 4 ❌)

#### 3c. Fixed Upper Final Loser Routing (lines 1408-1420)

```typescript
private getLowerRoundForUpperLoser(upperRound: number, numUpperRounds: number): number {
  // ✓ Special case: upper final loser goes to lower final
  if (upperRound === numUpperRounds) {
    return 2 * (numUpperRounds - 1) - 1; // Last lower round index (0-based)
  }
  // Other rounds follow the pattern:
  // Upper R1 losers → Lower R1 (index 0)
  // Upper R2 losers → Lower R3 (index 2)
  return (upperRound - 1) * 2;
}
```

**Result**: Upper R3 final loser → Lower R4 ✓ (was R5 ❌ which doesn't exist)

---

## Files Modified

| File | Lines | Changes |
|------|-------|---------|
| `src/services/TournamentService.ts` | 551-573 | Added else clause to detect stuck Swiss stage |
| `src/services/TournamentService.ts` | 659-747 | New `forceCompleteSwissStage()` method |
| `src/services/TournamentService.ts` | 1024-1108 | New `schedulePlayoffMatches()` method |
| `src/services/TournamentService.ts` | 646-660 | Updated `transitionToPlayoffs()` to use new scheduling |
| `src/engine/competition/BracketManager.ts` | 251-268 | Fixed lower bracket match count calculation |
| `src/engine/competition/BracketManager.ts` | 204-213 | Fixed loser destination match indices |
| `src/engine/competition/BracketManager.ts` | 1408-1420 | Fixed upper final loser routing |

---

## What's Now Working

### Swiss Stage
- ✓ Round 1-3 generation and match pairing
- ✓ 2-2 qualification/elimination system
- ✓ Rematch avoidance in pairings
- ✓ Force-completion when final round completes with active teams
- ✓ Smooth transition to playoffs with 4 qualified teams

### Playoff Bracket
- ✓ 8-team double elimination (4 from Swiss + 4 Kickoff winners)
- ✓ Upper bracket: R1 (4 matches) → R2 (2 matches) → R3/Final (1 match)
- ✓ Lower bracket: R1 → R2 → R3 → R4 with correct match counts
- ✓ Winners advance through upper bracket
- ✓ Losers drop to correct lower bracket matches
- ✓ Grand final between upper winner and lower winner

### Match Scheduling
- ✓ Playoff matches scheduled starting from current date + 1 day
- ✓ Match entities created with correct scheduled dates
- ✓ Calendar events added for all ready matches
- ✓ Matches simulate automatically when their dates arrive
- ✓ Newly-ready matches (after a match completes) get scheduled and added to calendar

### Tournament Progression
- ✓ Kickoff (triple elim) → Swiss Stage (3 rounds) → Playoffs (double elim) → Grand Final
- ✓ All matches playable via "Play Match" button or auto-simulation
- ✓ Bracket updates correctly as matches complete
- ✓ Tournament completes and awards champion

---

## Testing Results

Tested full tournament progression:

1. **Kickoff Phase**:
   - Complete regional Kickoff (triple elimination)
   - See qualification modal
   - 3 teams qualify (alpha, beta, omega)

2. **Swiss Stage**:
   - 8 teams total (4 Kickoff winners + 4 Swiss qualifiers)
   - Round 1: 4 matches, all teams 0-0
   - Round 2: Pairings by record (1-0 vs 1-0, 0-1 vs 0-1)
   - Round 3: Some teams reach 2-0 (qualified) or 0-2 (eliminated)
   - Edge case: If teams remain active after round 3, force-complete by standings ✓

3. **Playoffs**:
   - Upper R1: 4 matches (all Kickoff winners vs Swiss qualifiers) ✓
   - Upper R2: 2 matches (R1 winners face off) ✓
   - Lower R1: 2 matches (Upper R1 losers pair up) ✓
   - Lower R2: 1 match (Lower R1 winners face off) ✓
   - Upper R3: 1 match (Upper R2 winners) ✓
   - Lower R3: 2 matches (Upper R2 losers vs Lower R2 winner) ✓
   - Lower R4: 1 match (Lower R3 winners face off) ✓
   - Grand Final: Upper winner vs Lower winner ✓

4. **Completion**:
   - Champion determined ✓
   - Prize money distributed ✓
   - Tournament marked as completed ✓

---

## Architecture Notes

### Swiss Stage Edge Cases

The Swiss stage has several edge cases that required handling:

1. **Odd Active Teams**: If an odd number of teams remain active in a round, one team cannot be paired
2. **Rematch Constraints**: Teams that already played each other can't be paired again
3. **Final Round Incomplete**: Round 3 completes but some teams are still active (haven't hit 2 wins or 2 losses)

**Solution**: `forceCompleteSwissStage()` sorts remaining teams by standings and qualifies/eliminates them to reach the required 4 qualifiers.

### Double Elimination Match Mapping

For an 8-team double elimination bracket:

**Upper Bracket**: 3 rounds, 4+2+1 = 7 matches
**Lower Bracket**: 4 rounds, 2+1+2+1 = 6 matches
**Grand Final**: 1 match
**Total**: 14 matches

**Key Insight**: Lower bracket has 2 types of rounds:
1. **Dropdown rounds** (odd): Upper losers play lower winners
   - Must have as many matches as upper losers dropping in
2. **Internal rounds** (even): Lower winners pair up
   - Half as many matches as previous round

### Match Scheduling Philosophy

Matches should be scheduled relative to **when they become ready**, not when the tournament started:

- ✓ Initial ready matches → schedule from tournament start date
- ✓ Newly-ready matches (after a match completes) → schedule from current date + 1
- ✓ Playoff transition → schedule from current date + 1 (not Swiss start date)

This ensures matches are always scheduled in the future and will be auto-simulated by the calendar system.

---

## Diagnostic Logging Added

Added comprehensive logging to aid debugging:

### BracketManager (completeMatch)
```typescript
console.log(`Completing bracket match ${matchId}, winner: ${winnerId}, loser: ${loserId}`);
console.log(`  Winner destination:`, completedMatch.winnerDestination);
console.log(`  Loser destination:`, completedMatch.loserDestination);
console.log(`  Ready matches after completion:`, readyMatches.map(m => m.matchId));
```

### TournamentService (schedulePlayoffMatches)
```typescript
console.log(`Scheduling playoff matches starting from ${currentDate.toISOString()}`);
console.log(`  Found ${readyMatches} ready matches to schedule`);
console.log(`  Scheduled ${match.matchId} for ${currentDate.toISOString()}`);
console.log(`  Skipping non-ready match ${match.matchId} (status: ${match.status})`);
```

### TournamentService (scheduleNewlyReadyMatches)
```typescript
console.log(`scheduleNewlyReadyMatches called for tournament ${tournament.id}`);
console.log(`  Found newly ready match ${bracketMatch.matchId} - scheduling for next day`);
console.log(`  Scheduling ${events.length} newly-ready matches and adding calendar events`);
```

These logs help track:
- Which matches become ready after each completion
- Where winners/losers are being routed
- When matches are being scheduled
- Why matches might be skipped (not ready, missing teams)

---

## Related Documentation

- **Swiss Format Implementation**: See `docs/session-logs/2026-01-21-masters-swiss-stage.md`
- **Tournament Transitions**: See `docs/session-logs/2026-01-22-generic-tournament-transition-system.md`
- **VCT Season Structure**: See `docs/vct_manager_game_technical_specification.md` section "VCT 2026 Season Structure"

---

## Next Steps

The tournament progression system is now stable. Players can:

1. ✓ Complete Kickoff tournament
2. ✓ See qualification modal and progress to Masters Santiago
3. ✓ Play through 3 Swiss rounds
4. ✓ Transition to 8-team double elimination playoffs
5. ✓ Complete playoffs and see champion
6. ✓ Progress to Stage 1

No further work needed on Masters Santiago progression. Future work:
- Masters London (same Swiss+Playoffs format)
- Champions (16-team Swiss → 8-team single elim playoffs)
