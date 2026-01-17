# Session Log: Tournament System Bug Fixes

**Date:** 2026-01-16
**Feature:** Fix Tournament Bracket Progression, Cross-Region Matches, and VCT 2026 Schedule

---

## Summary

Fixed three major issues in the tournament system:
1. Tournament bracket not progressing past first round (critical bug)
2. Cross-region teams appearing in league matches
3. VCT 2026 schedule structure didn't match actual format

---

## Bug 1: Tournament Bracket Not Progressing (CRITICAL)

### Root Cause Analysis

**Location:** `src/services/TournamentService.ts:116-121`

The issue was an **order of operations bug** in `advanceTournament()`:

```typescript
// BEFORE (buggy order):
this.createMatchEntitiesForReadyBracketMatches(updatedTournament);  // Line 118 - RUNS FIRST
this.scheduleNewlyReadyMatches(updatedTournament);  // Line 120 - RUNS SECOND
```

**The Problem:**

1. `createMatchEntitiesForReadyBracketMatches()` creates Match entities using:
   ```typescript
   scheduledDate: bracketMatch.scheduledDate || tournament.startDate
   ```
2. At this point, `bracketMatch.scheduledDate` is **UNDEFINED** (not set yet)
3. So Match entity gets `scheduledDate = tournament.startDate` (e.g., Jan 1, 2026)
4. THEN `scheduleNewlyReadyMatches()` runs and sets `bracketMatch.scheduledDate = currentDate + 1`
5. Calendar event created with correct date (e.g., Jan 11)

**Result: DATE MISMATCH**
- Match entity: `scheduledDate = Jan 1, 2026` (tournament start)
- Calendar event: `date = Jan 11, 2026` (next day after current)

When time advances, the system can't properly correlate matches because dates don't match.

### Fix Applied

```typescript
// AFTER (correct order):
this.scheduleNewlyReadyMatches(updatedTournament);  // Schedule first (sets dates)
this.createMatchEntitiesForReadyBracketMatches(updatedTournament);  // Create Match entities second (uses dates)
```

---

## Bug 2: Cross-Region Teams in Matches

### Root Cause

**Location:** `src/engine/calendar/EventScheduler.ts:459`

```typescript
// BEFORE:
const opponents = allTeams.filter((team) => team.id !== playerTeamId);
// BUG: No region filter - opponents include ALL 48 teams from ALL regions
```

### Fix Applied

```typescript
// AFTER:
const playerTeam = allTeams.find((team) => team.id === playerTeamId);
const opponents = allTeams.filter(
  (team) => team.id !== playerTeamId && team.region === playerTeam?.region
);
```

---

## Bug 3: VCT 2026 Schedule Structure Incorrect

### Problem

The existing schedule structure didn't match the actual VCT 2026 format:

**Old Structure (wrong order):**
1. Kickoff → Stage 1 → Masters 1 → Stage 2 → Masters 2 → Champions

**Actual VCT 2026 Structure:**
1. Kickoff → Masters Santiago → Stage 1 → Stage 1 Playoffs → Masters London → Stage 2 → Stage 2 Playoffs → Champions

### Key Differences Fixed

1. **Order corrected**: Masters comes AFTER Kickoff, BEFORE Stage 1
2. **Added missing events**: Stage 1 Playoffs and Stage 2 Playoffs
3. **Format updated**: Stage 1/2 now use round-robin in groups (5 matches per stage)
4. **International events**: Masters/Champions labeled with actual locations (Santiago, London, Shanghai)

---

## Files Modified

### Type Updates
- `src/types/calendar.ts` - Added `stage1_playoffs` and `stage2_playoffs` to `SeasonPhase` type

### Core Fixes
- `src/services/TournamentService.ts` - Fixed order of operations in `advanceTournament()`
- `src/engine/calendar/EventScheduler.ts`:
  - Fixed region filter in `generateInitialSchedule()`
  - Updated `SEASON_STRUCTURE` with correct VCT 2026 timeline
  - Rewrote `generateLeagueMatchSchedule()` for round-robin groups

### Supporting Updates
- `src/engine/competition/SeasonManager.ts`:
  - Updated `PHASE_ORDER` array
  - Updated `getPhaseName()` and `getPhaseDescription()` for new phases

- `src/engine/competition/ScheduleGenerator.ts`:
  - Updated `PHASE_DURATIONS`
  - Updated `PHASE_START_MONTHS`
  - Updated `phaseOrder` in `generateVCTSeason()`
  - Updated `phaseToCompetitionType()`, `getTournamentName()`, `getPhaseName()`

### UI Updates
- `src/components/layout/TimeBar.tsx` - Updated phase display mapping for new phases

---

## New VCT 2026 Season Structure

| Phase | Start Offset | Duration | Description |
|-------|--------------|----------|-------------|
| Kickoff | Day 0 | 28 days | Triple Elim, 12 teams |
| Masters Santiago | Day 35 | 14 days | International event |
| Stage 1 | Day 56 | 35 days | Round-robin groups |
| Stage 1 Playoffs | Day 98 | 14 days | Top 8 teams |
| Masters London | Day 119 | 14 days | International event |
| Stage 2 | Day 140 | 35 days | Round-robin groups |
| Stage 2 Playoffs | Day 182 | 14 days | Playoff tournament |
| Champions Shanghai | Day 217 | 21 days | World Championship |
| Offseason | Day 245 | 120 days | Rest period |

---

## Round-Robin Group Format

League matches (Stage 1 & 2) now use proper round-robin format:
- 12 regional teams split into 2 groups of 6 (snake draft by org value)
- Each team plays every other team in their group once (5 matches)
- 1 match per week over 5 weeks
- Player's team placed in Group A with top-seeded opponents

---

## Verification

- TypeScript compilation: PASSED
- Production build: PASSED
- No runtime errors introduced

---

## Future Work

1. **Playoff tournament creation**: Currently the schedule includes playoff phases, but tournament entities for Stage 1/2 Playoffs should be dynamically created when league stages complete
2. **International events**: Masters and Champions are currently regional - future work to make them truly international with teams from all regions
3. **Seeding**: Group placement could be based on actual team performance rather than org value
