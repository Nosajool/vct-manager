# Phase 4: Competition Structure - Session Log

**Date:** 2026-01-10
**Phase:** 4 - Competition Structure
**Status:** Complete

## Summary

Implemented a complete tournament system with bracket generation, advancement logic, and VCT season structure. Players can now view and simulate tournament matches through the new Tournament page.

## Files Created

### Store Layer

- `src/store/slices/competitionSlice.ts` - Zustand slice for competition state
  - `tournaments: Record<string, Tournament>` - Normalized tournament storage
  - `standings: Record<string, StandingsEntry[]>` - League standings by tournament
  - Actions: addTournament, updateTournament, updateBracket, updateStandings, setTournamentChampion
  - Selectors: getTournament, getTournamentsByRegion, getActiveTournaments, getCurrentTournament, getTeamTournaments

### Engine Layer - Competition

- `src/engine/competition/BracketManager.ts` (~700 lines) - Core bracket logic
  - **Bracket Generation:**
    - `generateSingleElimination(teamIds, seeding?)` - Tree bracket with byes
    - `generateDoubleElimination(teamIds, seeding?)` - Upper + lower bracket + grand final
    - `generateTripleElimination(teamIds, seeding?)` - Extended double elim (VCT Kickoff)
    - `generateRoundRobin(teamIds, groups?)` - Group stage format
  - **Bracket Advancement:**
    - `completeMatch(bracket, matchId, winnerId, loserId, result)` - Immutable update
    - `propagateWinner()` / `propagateLoser()` - Route teams to next matches
    - `processByes()` - Auto-advance teams with bye opponents
  - **Bracket Queries:**
    - `getReadyMatches(bracket)` - All matches ready to play
    - `getNextMatch(bracket)` - First ready match
    - `getBracketStatus(bracket)` - 'not_started' | 'in_progress' | 'completed'
    - `getChampion(bracket)` - Winner team ID
    - `getFinalPlacements(bracket)` - Placement -> teamId mapping

- `src/engine/competition/TournamentEngine.ts` - Tournament creation and configuration
  - `createTournament(name, type, format, region, teamIds, startDate, prizePool?)` - Full tournament creation
  - `calculatePrizePool(type, totalPool)` - Prize distribution by competition type
  - `seedTeams(teams, standings?)` - Seeding based on standings
  - Prize pool defaults: Kickoff $500K, Stage $200K, Masters $1M, Champions $2.5M

- `src/engine/competition/ScheduleGenerator.ts` - VCT season schedule generation
  - `generateVCTSeason(year, region, teams)` - Complete season with all tournaments
  - `generateKickoffSchedule()` - January Kickoff (triple elim)
  - `generateStageSchedule()` - Stage 1/2 (round robin)
  - `generateMastersSchedule()` - Masters 1/2 (double elim)
  - `generateChampionsSchedule()` - Champions (double elim)
  - VCT Timeline: Kickoff (Jan) -> Stage 1 (Feb-Mar) -> Masters 1 (Apr) -> Stage 2 (May-Jun) -> Masters 2 (Jul) -> Champions (Aug)

- `src/engine/competition/SeasonManager.ts` - Season progression logic
  - `getNextPhase(currentPhase)` - Phase transitions
  - `getQualifiedTeams(standings, count)` - Teams that qualify for international events
  - `calculateSeasonStandings(teamIds, matchResults)` - Build standings from results
  - `shouldStartNextPhase(currentDate, phaseSchedule)` - Phase transition checks
  - `getSeasonProgress(currentPhase)` - Progress percentage

- `src/engine/competition/index.ts` - Engine exports

### Service Layer

- `src/services/TournamentService.ts` - Orchestrates tournament operations
  - `createTournament()` - Creates tournament, generates bracket, schedules matches
  - `startTournament(tournamentId)` - Changes status to in_progress
  - `advanceTournament(tournamentId, matchId, result)` - Updates bracket after match
  - `simulateNextMatch(tournamentId)` - Simulates one ready match
  - `simulateTournamentRound(tournamentId)` - Simulates all ready matches
  - `simulateTournament(tournamentId)` - Full tournament simulation to completion
  - `distributePrizes(tournamentId)` - Awards prize money based on placements
  - `calculateStandings(tournamentId)` - Builds standings from match results

### UI Components

- `src/components/tournament/BracketMatch.tsx` - Individual match display in bracket
  - Team names with winner highlighting
  - Score display for completed matches
  - Simulate button for ready matches
  - Player team indicator

- `src/components/tournament/BracketView.tsx` - Visual bracket display
  - `BracketView` - Full bracket with upper/lower/grand final sections
  - `BracketListView` - Compact list view grouped by status
  - Round labels (Quarter-Final, Semi-Final, Final)

- `src/components/tournament/TournamentCard.tsx` - Tournament summary card
  - `TournamentCard` - Full card with dates, prize pool, teams
  - `TournamentCardMini` - Compact version for lists
  - Status badges (Live, Upcoming, Completed)
  - Champion display

- `src/components/tournament/StandingsTable.tsx` - League standings display
  - Win/loss record with round differential
  - Qualification highlighting for top teams
  - Player team highlighting
  - Compact mode option

- `src/components/tournament/TournamentControls.tsx` - Simulation controls
  - Simulate Match / Round / All buttons
  - Ready match counter
  - Confirmation for simulate all
  - Completion status display

- `src/components/tournament/index.ts` - Component exports

### Pages

- `src/pages/Tournament.tsx` - Tournament page
  - Tournament list sidebar (Live, Upcoming, Completed)
  - View mode toggle (Bracket, List, Standings)
  - Tournament info card with details
  - Simulation controls
  - Bracket visualization

## Files Modified

- `src/store/slices/index.ts` - Added competitionSlice export
- `src/store/index.ts` - Added CompetitionSlice to GameState, added selector hooks
- `src/services/index.ts` - Added TournamentService export
- `src/App.tsx` - Added TournamentPage route
- `src/services/GameInitService.ts` - Generates Kickoff tournament at game start
- `src/pages/Schedule.tsx` - Added tournament filter and active tournament banner

## Architecture

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│  TournamentPage │────▶│ TournamentService │────▶│  BracketManager │
│     (Page)      │     │    (Service)      │     │    (Engine)     │
└─────────────────┘     └───────────────────┘     └─────────────────┘
        │                       │                         │
        │                       ▼                         ▼
        │                ┌───────────────────┐     ┌─────────────────┐
        │                │   MatchService    │     │TournamentEngine │
        │                │    (Service)      │     │    (Engine)     │
        │                └───────────────────┘     └─────────────────┘
        │                       │                         │
        │                       ▼                         ▼
        │                ┌───────────────────┐     ┌─────────────────┐
        └───────────────▶│   useGameStore    │◀────│ScheduleGenerator│
                         │    (Zustand)      │     │  SeasonManager  │
                         └───────────────────┘     └─────────────────┘
```

## Key Features

### 1. Bracket Formats

- **Single Elimination**: Simple tree bracket, losers eliminated
- **Double Elimination**: Upper + lower bracket, grand final
- **Triple Elimination**: VCT Kickoff format
- **Round Robin**: League play format for stages

### 2. Tournament Simulation

- Simulate individual matches
- Simulate entire rounds at once
- Simulate full tournament to completion
- Automatic prize distribution

### 3. VCT Season Structure

- Kickoff: January, 16 teams, triple elimination
- Stage 1/2: League play, round robin format
- Masters: Top 3 per region, double elimination
- Champions: Top 2 per region, double elimination

### 4. UI Features

- Visual bracket display with team routing
- Tournament list with status filtering
- Standings table with qualification highlights
- Match filter on Schedule page (All/League/Tournament)

## VCT Kickoff Triple Elimination - Complete Rewrite

The triple elimination bracket was completely rewritten to match the exact VCT Kickoff format from VLR.

### Match Structure (30 total matches)

**UPPER (Alpha - 0 losses): 11 matches**
- R1: 4 matches (seeds 5-12 play)
- R2: 4 matches (seeds 1-4 byes enter + R1 winners)
- R3: 2 matches
- Final: 1 match → **Alpha Qualifier**

**MIDDLE (Beta - 1 loss): 10 matches**
- R1: 4 matches (UR1 + UR2 losers combined)
- R2: 2 matches (MR1 winners)
- R3: 2 matches (UR3 losers + MR2 winners)
- R4: 1 match (MR3 winners)
- Final: 1 match (MR4 winner + Upper Final loser) → **Beta Qualifier**

**LOWER (Omega - 2 losses): 9 matches**
- R1: 2 matches (MR1 losers)
- R2: 2 matches (MR2 losers + LR1 winners)
- R3: 2 matches (MR3 losers + LR2 winners)
- R4: 1 match (LR3 winners)
- R5: 1 match (MR4 loser + LR4 winner)
- Final: 1 match (Middle Final loser + LR5 winner) → **Omega Qualifier**

### No Grand Final

The Kickoff tournament has **3 winners** instead of a single champion:
- Alpha (Upper) Final winner → Masters qualifier
- Beta (Middle) Final winner → Masters qualifier
- Omega (Lower) Final winner → Masters qualifier

### Loser Flow
- Upper Final loser → Middle Final
- Middle Final loser → Lower Final
- Lower Final loser → 4th place (eliminated)

### Implementation Details

**Bracket Generation** (`BracketManager.generateTripleElimination()`):
- Creates exact match structure with proper team sources and destinations
- UR1 losers + UR2 losers both route to MR1 (8 teams → 4 matches)
- No grandfinal - bracket ends at 3 separate finals

**Loser Propagation Fix** (`propagateTeamToDestination()`):
- Now matches source matchId and source type ('winner'/'loser')
- Correctly places teams in teamA or teamB slot based on match definition
- Fixed UR2 losers going to wrong match IDs

**New Methods**:
- `getQualifiers(bracket)` - Returns `{ alpha?, beta?, omega? }` with team IDs
- `getBracketStatus()` - Updated to check all 3 finals for completion

### UI Updates
- `BracketView` displays Alpha/Beta/Omega with colored headers
- Grand Final section removed for triple elim brackets
- Round labels: "Upper R1", "Middle R2", "Lower Final", etc.

## VCT Kickoff Seeding

Implemented authentic VCT Kickoff seeding for 12-team triple elimination:

### Seeding Rules
- **Top 4 teams** (Champions qualifiers from previous year) receive automatic byes to Round 2
- **Bottom 8 teams** are entered into Round 1 via random draw (Fisher-Yates shuffle)

### Implementation
- `TournamentEngine.generateKickoffSeeding(numTeams)` creates seeding array:
  - Seeds 1-4: Bye positions for Champions qualifiers
  - Seeds 5-12: Randomly shuffled for Round 1 matchups
- `TournamentEngine.generateBracket()` passes tournament type for Kickoff-specific seeding
- `GameInitService` sorts teams by strength (orgValue + fanbase) before tournament creation
  - In Season 1, strongest teams are treated as previous Champions qualifiers
  - In subsequent seasons, actual previous season standings would be used

## Files Modified

- `src/engine/competition/BracketManager.ts` - Complete rewrite of `generateTripleElimination()`, fixed `propagateTeamToDestination()`, added `getQualifiers()`
- `src/engine/competition/TournamentEngine.ts` - Added `generateKickoffSeeding()` method
- `src/services/GameInitService.ts` - Teams sorted by strength before Kickoff creation
- `src/components/tournament/BracketView.tsx` - Updated round labels, removed Grand Final for triple elim

## Testing

- TypeScript compiles without errors
- All engine classes are pure (no React/store dependencies)
- Follows existing codebase patterns
- Kickoff tournament auto-generated at game start
- Losers properly propagate through Alpha → Beta → Omega brackets

## Next Steps (Phase 5+)

- Financial management system
- Sponsorship deals
- Transfer window mechanics
- Player contract negotiations
- Team budget management
