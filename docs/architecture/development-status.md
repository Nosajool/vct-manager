# VCT Manager Game - Development Status

## Development Status

### ✅ **Completed Phases**
- **Phase 0-1**: Foundation, roster management, match simulation
- **Phase 2-3**: Calendar system, player development, training
- **Phase 4-5**: Competition structure, economy system
- **Phase 6-7**: Scrim system, schedule improvements
- **Phase 8-9**: VLR integration, UI enhancements
- **Phase 10-12**: Tournament scheduling, roster management, generic transitions
- **Phase 13**: Masters/Champions completion modal
- **Phase 14**: Masters → Stage league transition (post-Masters progression)
- **Phase 15**: Stage 1 UI and Stage 1 Playoffs transition
- **Phase 16**: Phase-based match filtering bugfix (Stage 1/2 during Masters)
- **Phase 17**: Match type labels in simulation results (Upper Round 1 Match 2)
- **Phase 18**: Clickable bracket matches to view match details

### 🚧 **Future Phases**
- Coach system implementation
- AI team improvements
- Transfer market
- Performance optimizations

---

## Development Phases Checklist

### Phase 0: Foundation ✓ (Complete)
- [x] Project setup (Vite + React + TypeScript)
- [x] Git initialization and GitHub repo creation
- [x] Install dependencies (Zustand, Dexie, Tailwind)
- [x] Directory structure
- [x] Core type definitions
- [x] Zustand store with 7 slices
- [x] Dexie database setup
- [x] Save/load functionality with 3 manual + auto-save slots
- [x] UI shell with navigation

### Phase 1: Roster Management ✓ (Complete)
- [x] PlayerGenerator engine (procedural generation, 400+ players)
- [x] Player slice (CRUD + selectors)
- [x] Team slice (40 teams across 4 regions)
- [x] TeamManager engine
- [x] Roster screen UI (active/reserve, player cards)
- [x] Free agent list with filtering/sorting
- [x] ContractNegotiator engine (preference-based evaluation)
- [x] ContractService (sign/release flows)
- [x] Contract negotiation modal with acceptance probability

### Phase 2: Match Simulation ✓ (Complete)
- [x] MatchSimulator class (probabilistic, team strength calculation)
- [x] Match slice (matches + results)
- [x] MatchService (simulation + side effects)
- [x] Match result display (Scoreboard, PlayerStatsTable)
- [x] Player performance stats (K/D/A, ACS)
- [x] Match history view
- [x] Form/career stats updates post-match

### Phase 3: Calendar System ✓ (Complete)
- [x] GameSlice (calendar, phase, events)
- [x] TimeProgression engine
- [x] EventScheduler (VCT season structure)
- [x] Time controls (Advance Day only; Advance Week and Jump to Match removed due to bugs)
- [x] Auto-simulation of matches on time advancement
- [x] PlayerDevelopment engine (training system)
- [x] TrainingService and TrainingModal
- [x] MonthCalendar and DayDetailPanel UI components

### Phase 4: Competition Structure ✓ (Complete)
- [x] BracketManager class (all bracket operations)
- [x] TournamentEngine (tournament creation)
- [x] ScheduleGenerator (VCT season generation)
- [x] SeasonManager (phase transitions)
- [x] Single elimination brackets
- [x] Double elimination brackets
- [x] Triple elimination brackets (VCT Kickoff format)
- [x] Tournament bracket UI (BracketView, BracketMatch)
- [x] Standings/leaderboards (StandingsTable)
- [x] TournamentService (full tournament lifecycle)

### Phase 5: Economy ✓ (Complete)
- [x] EconomyEngine (monthly processing, sponsorships, loans)
- [x] EconomyService (orchestration)
- [x] Finance tracking (balance, revenue, expenses)
- [x] Salary payments (automatic on calendar events)
- [x] Prize money distribution
- [x] Sponsorship system (templates, requirements, contracts)
- [x] Loan system (interest rates, terms, early payoff)
- [x] Finances page with tabs (Overview, Transactions, Sponsorships, Loans)

### Phase 6: Scrim System ✓ (Complete)
- [x] ScrimEngine (scrim simulation, map improvements)
- [x] TierTeamGenerator (T2/T3 teams)
- [x] ScrimSlice (tier teams, scrim history)
- [x] ScrimService (scheduling, weekly limits)
- [x] Map pool strength system (6 attributes per map)
- [x] Relationship system (events, VOD leak risk)
- [x] Weekly scrim limits (4 per week)
- [x] Map decay mechanics (2% weekly)
- [x] Match simulation map bonus (up to 15%)
- [x] ScrimModal, MapPoolView, RelationshipView components

### Phase 7: Schedule Improvements ✓ (Complete)
- [x] Unified match-calendar architecture
- [x] Match entities linked to calendar events
- [x] Tournament matches shown in Schedule page
- [x] Auto-simulation on time advancement
- [x] "Today" badge and simulate button visibility fixes
- [x] Timezone bug fixes (local date parsing)

### Phase 8: VLR Integration ✓ (Complete)
- [x] VLR type definitions (`src/types/vlr.ts`)
- [x] VLR engine module (`src/engine/player/vlr/`)
- [x] Org name mapping (VLR codes → game team names)
- [x] Stat conversion algorithm (VLR metrics → 9 game stats)
- [x] VlrDataProcessor for raw data transformation
- [x] CLI fetch script (`scripts/fetch-vlr-data.ts`)
- [x] Team roster scraping from VLR.gg
- [x] Static snapshot approach (`src/data/vlrSnapshot.ts`)
- [x] GameInitService VLR integration (`useVlrData` option)
- [x] VLR-based free agents from unmatched orgs
- [x] `forceName` option in PlayerGenerator

### Phase 9: UI Enhancements ✓ (Complete)
- [x] SimulationResultsModal for time advancement
- [x] Match results grouped by player team, tournaments, regions
- [x] AllTeamsView component (browse all 48 teams)
- [x] Region filtering in All Teams view
- [x] Training capacity indicator ("X/Y players can train")
- [x] Before/after stats display ("old → new" format)
- [x] Player team filtering (only show player's matches in Today's Activities)
- [x] ChemistryCalculator as standalone engine class

### Phase 10: Tournament Scheduling Improvements ✓ (Complete)
- [x] Dynamic tournament scheduling (only schedule "ready" matches)
- [x] `scheduleNewlyReadyMatches()` after bracket advancement
- [x] Calendar events only for matches with known teams
- [x] Fixed "TBD vs TBD" matches appearing on schedule
- [x] Proper Match entity creation for ready bracket matches

### Phase 11: Roster Management UI ✓ (Complete)
- [x] PlayerCard quick action buttons (promote/demote)
- [x] PlayerDetailModal roster movement actions
- [x] RosterList feedback messages and handlers
- [x] Real-time roster count updates

See `docs/feature-backlog/completed/roster-management-improvements.md` for full specification.

### Phase 12: Generic Tournament Transition System ✓ (Complete)
- [x] Tournament transition type definitions (`src/types/tournament-transition.ts`)
- [x] Configuration constants for all 7 VCT transitions (`src/utils/tournament-transitions.ts`)
- [x] TournamentTransitionService with generic `executeTransition()` method
- [x] Support for regional (league → playoffs) transitions
- [x] Support for international (playoffs → Masters/Champions) transitions
- [x] Support for league (Masters → Stage) transitions (Phase 14)
- [x] Idempotent transition execution (safe to call multiple times)
- [x] QualificationModal refactored to work for all transitions via `transitionConfigId`
- [x] RegionalSimulationService delegates to TournamentTransitionService
- [x] TournamentEngine `createMastersSantiago()` accepts optional name parameter

**Architecture Benefits:**
- Single source of truth for all transition rules
- No code duplication for different phase transitions
- Easy to add new tournaments (just add configuration, no new service code)
- Type-safe configuration with full TypeScript support
- Fully scalable for future VCT seasons

### Phase 13: Masters/Champions Completion Modal ✓ (Complete)
- [x] MastersCompletionModal component with tabbed interface
- [x] Summary view showing top placements and prize money
- [x] Swiss Stage final standings view
- [x] Playoff bracket results view
- [x] Player team highlighting and performance display
- [x] TournamentService `handleMastersCompletion()` method
- [x] Modal triggered automatically when Masters/Champions tournaments complete
- [x] TimeBar integration for rendering modal via UISlice pattern

**Modal Features:**
- Three tabs: Summary, Swiss Stage, Playoff Results
- Shows tournament champion with trophy
- Player team status banner (placement + prize won)
- Final standings with prize distribution
- Swiss stage standings showing qualified/eliminated teams
- Consistent styling with QualificationModal

### Phase 14: Masters → Stage League Transition ✓ (Complete)
- [x] New `international_to_league` transition type in `TransitionType` union
- [x] `masters1_to_stage1` transition configuration (Masters Santiago → Stage 1)
- [x] `masters2_to_stage2` transition configuration (Masters London → Stage 2)
- [x] `executeLeagueTransition()` method in TournamentTransitionService
- [x] `nextTransitionId` prop added to MastersCompletionModalData
- [x] MastersCompletionModal executes transition on close (any exit method)
- [x] TournamentService.handleMastersCompletion() passes correct transition ID

**Key Design Decisions:**
- League matches are pre-generated at game init (no tournament creation needed)
- Transition only updates the phase from `masters1` → `stage1` (or `masters2` → `stage2`)
- Modal executes transition idempotently via `useRef` to prevent double-execution
- All close paths (Continue button, View Bracket, backdrop click) trigger transition

### Phase 15: Stage 1 UI and Stage 1 Playoffs Transition ✓ (Complete)
- [x] Stage 1/Stage 2 league tournament entities created at game init
- [x] League matches linked to tournament entities via `tournamentId`
- [x] Tournament page displays league standings (StandingsTable with top 8 highlighted)
- [x] `calculateLeagueStandings()` method using team standings (wins/losses/roundDiff)
- [x] View mode filtering for league tournaments (standings only, no bracket view)
- [x] `handleStageCompletion()` method in TournamentService
- [x] `isStageComplete()` check for detecting all league matches complete
- [x] StageCompletionModal component showing final standings and qualification
- [x] CalendarService `checkStageCompletion()` after match simulation
- [x] Stage 1 → Stage 1 Playoffs transition via existing `stage1_to_stage1_playoffs` config
- [x] Stage 2 → Stage 2 Playoffs transition via existing `stage2_to_stage2_playoffs` config

**Key Implementation Details:**
- League tournaments use `round_robin` format but don't generate bracket matches
- Team standings (`team.standings`) are source of truth for league standings
- `calculateLeagueStandings()` builds standings from team standings (updated by `recordWin`/`recordLoss`)
- Stage completion detection happens in CalendarService after processing day's matches
- StageCompletionModal shows all teams with top 8 highlighted (playoff qualifiers)
- Transition creates playoff tournament with double elimination format using top 8 teams

**Flow:**
1. Masters Santiago completes → Phase transitions to `stage1`
2. User plays league matches (5 matches scheduled at game init)
3. After last Stage 1 match, `checkStageCompletion()` triggers
4. `handleStageCompletion()` calculates standings and opens StageCompletionModal
5. On modal close, `executeTransition('stage1_to_stage1_playoffs')` creates playoffs
6. Phase transitions to `stage1_playoffs`

### Phase 16: Upfront Tournament Creation & Phase Filtering ✓ (Complete)

**Architecture: Upfront Creation, Lazy Resolution**
- [x] `GlobalTournamentScheduler.ts` - Creates ALL VCT tournaments at game initialization
  - 4 regional Kickoffs (teams known)
  - Masters 1 & 2 with TBD slots for qualifiers
  - 4 regional Stage 1/2 leagues (teams known)
  - 4 regional Stage 1/2 Playoffs with TBD slots
  - Champions with TBD slots
- [x] `TeamSlotResolver.ts` - Resolves TBD slots when teams qualify from previous tournaments
- [x] New types: `TeamSlot`, `QualificationSource`, `TournamentStandingsEntry`
- [x] Added `teamSlots` and `standings` fields to `Tournament` type
- [x] Added `region` field to `MatchEventData` for multi-region visibility
- [x] Per-tournament standings (separate from team career stats)
- [x] Multi-region visibility - Tournament page can view any region's brackets

**Phase-Based Match Filtering Bugfix**
- [x] Fixed bug where Stage 1/Stage 2 matches were simulated during Masters phase
- [x] Added `phase` property to `MatchEventData` type for league matches
- [x] CalendarService `advanceDay()` now checks match phase before simulation
- [x] League matches are skipped (not processed) if their phase doesn't match current phase
- [x] Matches remain unprocessed until their correct phase is active

**Root Cause:**
- League matches (Stage 1, Stage 2) were pre-generated at game init with specific scheduled dates
- CalendarService simulated ALL matches for a given day regardless of current game phase
- EventScheduler already tagged matches with `phase` property, but it was never checked

**Fix Location:**
- `CalendarService.advanceDay()` (lines 64-75) - Added phase validation before match simulation
- `src/types/calendar.ts` - Added `phase?: SeasonPhase` to `MatchEventData` interface

**Behavior:**
- Tournament matches (no phase property): Always simulated when their date arrives
- League matches (with phase property): Only simulated when `currentPhase` matches `matchData.phase`
- Skipped matches are not marked as processed, allowing them to run when phase becomes active

**Key Architecture Benefits:**
- Full VCT season visible from day 1 (predictable structure)
- No runtime tournament creation - all structures exist, just need team resolution
- Multi-region visibility - players can view any region's tournament brackets
- Clean separation - scheduling, qualification, and match simulation are independent

### Phase 17: Match Type Labels in Simulation Results ✓ (Complete)
- [x] `matchLabel` field added to `MatchWithDetails` interface
- [x] `findBracketMatchInfo()` helper to locate bracket match by ID
- [x] `getMatchLabel()` function to generate human-readable labels
- [x] `formatMatchLabel()` for bracket type and round formatting
- [x] Support for triple elimination (Alpha/Beta/Omega) and double elimination (Upper/Lower) naming
- [x] Support for Swiss stage matches (Swiss Round X Match Y)
- [x] Match label displayed in `MatchCard` component

**Feature Details:**
- Labels like "Upper Round 1 Match 2", "Alpha Round 2 Match 1", "Grand Final"
- Swiss tournaments show "Swiss Round 1 Match 3" for swiss stage matches
- Triple elimination uses Alpha/Beta/Omega naming (VCT Kickoff style)
- Double elimination uses Upper/Lower naming (Stage playoffs style)
- Labels appear centered above the team names in the simulation results modal

**Files Changed:**
- `src/components/calendar/SimulationResultsModal.tsx` - Added match label generation and display

### Phase 18: Clickable Bracket Matches ✓ (Complete)
- [x] `onMatchClick` prop added to `BracketMatch` component
- [x] `onMatchClick` prop added to `BracketView` component
- [x] `onMatchClick` prop added to `SwissStageView` component
- [x] Click handling in `SwissMatchCard` internal component
- [x] Tournament page state management for selected match
- [x] `MatchResult` modal rendered when completed match clicked
- [x] Visual feedback (cursor pointer, hover state) on clickable matches

**Feature Details:**
- Completed matches in tournament brackets are now clickable
- Clicking opens the `MatchResult` modal showing full match details (scoreboard, player stats)
- Works for both bracket view (BracketMatch) and Swiss stage view (SwissMatchCard)
- Non-completed matches (pending, ready, in_progress) are not clickable
- Hover state provides visual feedback with border color change

**Files Changed:**
- `src/components/tournament/BracketMatch.tsx` - Added `onMatchClick` prop and click handling
- `src/components/tournament/BracketView.tsx` - Added `onMatchClick` prop passthrough
- `src/components/tournament/SwissStageView.tsx` - Added `onMatchClick` prop and SwissMatchCard click handling
- `src/pages/Tournament.tsx` - Added match selection state and MatchResult modal

### Future Phases (Not Started)
- [ ] Coach system implementation
- [ ] AI team improvements
- [ ] Transfer market
- [ ] Round-by-round detailed simulation
- [ ] Agent mastery system
- [ ] Map veto system
- [ ] Performance optimizations
- [ ] Mobile responsiveness improvements
