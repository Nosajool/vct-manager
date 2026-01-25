# VCT Manager Game - Implementation Details

## State Management

### Zustand Store Structure

The store uses a flat structure with slices combined at the root level (simpler than nested `entities` object):

```typescript
// GameState = PlayerSlice & TeamSlice & GameSlice & UISlice & MatchSlice & CompetitionSlice & ScrimSlice

interface GameState {
  // PlayerSlice - Normalized players
  players: Record<string, Player>;

  // TeamSlice - Normalized teams
  teams: Record<string, Team>;
  playerTeamId: string | null;

  // MatchSlice - Matches and results
  matches: Record<string, Match>;
  results: Record<string, MatchResult>;

  // CompetitionSlice - Tournaments and standings
  tournaments: Record<string, Tournament>;
  standings: Record<string, StandingsEntry[]>;

  // ScrimSlice - Tier teams and scrim history
  tierTeams: Record<string, TierTeam>;
  scrimHistory: ScrimResult[];

  // GameSlice - Calendar and game state
  initialized: boolean;
  gameStarted: boolean;
  calendar: GameCalendar;

  // UISlice - UI-specific state
  activeView: ActiveView;
  selectedPlayerId: string | null;
  selectedMatchId: string | null;
  error: string | null;
  isSimulating: boolean;
  bulkSimulation: BulkSimulationProgress | null;
}

type ActiveView = 'dashboard' | 'roster' | 'schedule' | 'tournament' | 'finances';
```

### Store Slices Pattern
Each domain gets its own slice with actions and selectors:

```typescript
// Example: Player Slice
interface PlayerSlice {
  // Actions
  addPlayer: (player: Player) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  removePlayer: (playerId: string) => void;

  // Selectors
  getPlayer: (playerId: string) => Player | undefined;
  getFreeAgents: () => Player[];
  getPlayersByTeam: (teamId: string) => Player[];
}

// Combined in root store
const useGameStore = create<GameState & PlayerSlice & TeamSlice & ...>()(
  persist(
    (set, get) => ({
      // State
      entities: { players: {}, teams: {}, ... },

      // Player slice implementation
      ...createPlayerSlice(set, get),

      // Other slices
      ...createTeamSlice(set, get),
      ...createMatchSlice(set, get),
      // ...
    }),
    {
      name: 'vct-manager-storage',
      storage: createDexieStorage()
    }
  )
);
```

---

## Key Engine Classes

### MatchSimulator (Phase 1)
```typescript
class MatchSimulator {
  /**
   * Simulate a best-of-3 match between two teams
   * Phase 1: Probabilistic simulation based on player stats
   */
  simulate(teamA: Team, teamB: Team, players: Record<string, Player>): MatchResult {
    const teamAStrength = this.calculateTeamStrength(teamA, players);
    const teamBStrength = this.calculateTeamStrength(teamB, players);

    const maps: MapResult[] = [];
    let scoreA = 0;
    let scoreB = 0;

    // Simulate up to 3 maps (best of 3)
    for (let i = 0; i < 3 && scoreA < 2 && scoreB < 2; i++) {
      const mapResult = this.simulateMap(teamA, teamB, players, teamAStrength, teamBStrength);
      maps.push(mapResult);

      if (mapResult.winner === 'teamA') scoreA++;
      else scoreB++;
    }

    return {
      matchId: generateId(),
      winnerId: scoreA > scoreB ? teamA.id : teamB.id,
      loserId: scoreA > scoreB ? teamB.id : teamA.id,
      maps,
      scoreTeamA: scoreA,
      scoreTeamB: scoreB,
      duration: maps.reduce((sum, m) => sum + this.estimateMapDuration(m), 0)
    };
  }

  private calculateTeamStrength(team: Team, players: Record<string, Player>): number {
    const teamPlayers = team.playerIds.map(id => players[id]);

    // Weighted average of player stats
    const avgMechanics = average(teamPlayers.map(p => p.stats.mechanics));
    const avgIGL = average(teamPlayers.map(p => p.stats.igl));
    const avgMental = average(teamPlayers.map(p => p.stats.mental));
    // ... other stats

    // Chemistry bonus
    const chemistryBonus = team.chemistry.overall / 100;

    const baseStrength = (
      avgMechanics * 0.3 +
      avgIGL * 0.15 +
      avgMental * 0.15 +
      // ... weights for other stats
    );

    return baseStrength * (1 + chemistryBonus * 0.2);
  }

  private simulateMap(/* ... */): MapResult {
    // Simulate round-by-round with probability-based outcomes
    // Generate realistic K/D/A stats for each player
  }
}
```

### BracketManager

Handles all bracket generation and progression logic. All methods are pure functions that return new bracket structures (immutable).

```typescript
class BracketManager {
  /**
   * Generate a single elimination bracket
   */
  generateSingleElimination(teamIds: string[], seeding?: number[]): BracketStructure {
    // Create upper bracket with proper seeding
    // Calculate number of rounds: ceil(log2(numTeams))
  }

  /**
   * Generate a double elimination bracket
   * Critical structure for 8-team bracket:
   * - Upper: 3 rounds (4+2+1 matches)
   * - Lower: 4 rounds (2+2+1+1 matches)
   *
   * Lower bracket structure:
   * - LR1: Dropout round - UR1 losers paired up (2 matches)
   * - LR2: Combined round - UR2 losers vs LR1 winners (2 matches)
   * - LR3: Internal round - LR2 winners face each other (1 match)
   * - LR4: Combined round - Upper Final loser vs LR3 winner (1 match)
   */
  generateDoubleElimination(teamIds: string[], seeding?: number[]): BracketStructure {
    // Upper bracket: standard single elimination
    // Lower bracket: specific structure per round
    // Loser destinations:
    //   - Upper R1 (4 matches) → Lower R1 (2 matches) via floor(matchIdx/2)
    //   - Upper R2 (2 matches) → Lower R2 (combined with LR1 winners)
    //   - Upper Final → Lower R4 (final lower round)
  }

  /**
   * Generate a triple elimination bracket (Kickoff format)
   */
  generateTripleElimination(teamIds: string[], seeding?: number[]): BracketStructure {
    // Create upper (Alpha), middle (Beta), lower (Omega) brackets
    // Alpha winner qualifies, Beta/Omega winners qualify
  }

  /**
   * Initialize Swiss stage with Round 1 pairings
   * Used for Masters tournaments
   */
  initializeSwissStage(
    teamIds: string[],
    teamRegions: Map<string, string>,
    config: {
      totalRounds: number;      // 3 for Masters
      winsToQualify: number;    // 2 for Masters
      lossesToEliminate: number; // 2 for Masters
      tournamentId: string;
    }
  ): SwissStage {
    // Create standings for all teams
    // Generate Round 1 cross-regional pairings
    // Return initial Swiss stage structure
  }

  /**
   * Generate next Swiss round based on current standings
   * Pairs teams by record, avoiding rematches
   */
  generateNextSwissRound(stage: SwissStage, tournamentId: string): SwissStage {
    // Group active teams by W-L record
    // Pair within groups (best seed vs worst seed)
    // Handle unpaired teams via cross-group pairing
  }

  /**
   * Complete a Swiss match and update standings
   * Checks for qualification/elimination thresholds
   */
  completeSwissMatch(
    stage: SwissStage,
    matchId: string,
    result: MatchResult
  ): SwissStage {
    // Update match result and standings
    // Check if winner reached winsToQualify (qualify them)
    // Check if loser reached lossesToEliminate (eliminate them)
    // Mark round as complete if all matches done
  }

  /**
   * Update bracket after match completion (immutable)
   */
  completeMatch(
    bracket: BracketStructure,
    matchId: string,
    winnerId: string,
    loserId: string,
    result: MatchResult
  ): BracketStructure {
    // 1. Update match result
    // 2. Propagate winner to winnerDestination
    // 3. Propagate loser to loserDestination (for double/triple elim)
    // 4. Update all match statuses (pending → ready when both teams known)
    // Return new bracket structure
  }

  /**
   * Get all matches that are ready to play
   */
  getReadyMatches(bracket: BracketStructure): BracketMatch[] {
    // Return matches where both teams are known (status: 'ready')
  }

  /**
   * Check if Swiss stage is complete
   * Complete when all teams are qualified or eliminated
   */
  isSwissStageComplete(stage: SwissStage): boolean {
    const activeTeams = stage.standings.filter(t => t.status === 'active');
    return activeTeams.length === 0;
  }

  /**
   * Get Swiss qualified teams (for playoff seeding)
   */
  getSwissQualifiedTeams(stage: SwissStage): string[] {
    return stage.qualifiedTeamIds;
  }
}
```

**Key Implementation Details**:

1. **Double Elimination Lower Bracket Structure** (for 8 teams):
   - LR1 (dropout): 2 matches - UR1 losers paired (loser mapping: `floor(matchIdx/2)`)
   - LR2 (combined): 2 matches - UR2 losers vs LR1 winners
   - LR3 (internal): 1 match - LR2 winners face each other
   - LR4 (combined): 1 match - Upper Final loser vs LR3 winner
   - Upper bracket losers drop to: UR1→LR1, UR2→LR2, Upper Final→LR4

2. **Swiss Stage Edge Cases**:
   - Odd number of active teams → one team unpaired
   - Rematch constraints → may prevent valid pairings
   - Final round complete with active teams → force-complete by standings

3. **Bracket Immutability**:
   - All methods return new bracket structures via `JSON.parse(JSON.stringify())`
   - Store updates via `updateBracket()` action

### ChemistryCalculator
```typescript
class ChemistryCalculator {
  /**
   * Calculate team chemistry from roster
   */
  calculateTeamChemistry(roster: Player[]): TeamChemistry {
    // Calculate pairwise chemistry
    // Aggregate to team level
    // Determine stat bonuses
  }

  /**
   * Calculate chemistry between two players
   */
  calculatePairChemistry(p1: Player, p2: Player): number {
    // Based on:
    // - Playstyle compatibility
    // - Time played together (from match history)
    // - Personality (from preferences)
  }

  /**
   * Update chemistry after match
   */
  updateChemistryAfterMatch(
    roster: Player[],
    result: MatchResult,
    won: boolean
  ): ChemistryUpdate {
    // Winning together improves chemistry
    // Losing hurts it slightly
    // Close games minimize negative impact
  }
}
```

---

## Services Layer

Services orchestrate engine logic and store updates. Each service follows a consistent pattern:

```typescript
// Service Pattern
export class ServiceName {
  methodName(params): ResultType {
    const state = useGameStore.getState();

    // 1. Read from store
    const entity = state.entities[id];

    // 2. Call engine(s)
    const result = engine.operation(entity, params);

    // 3. Update store
    state.updateEntity(id, result);

    // 4. Return result
    return result;
  }
}
export const serviceName = new ServiceName();
```

### Service Result Types

```typescript
// Time advancement result (used by CalendarService)
interface TimeAdvanceResult {
  success: boolean;
  daysAdvanced: number;
  newDate: string;
  processedEvents: CalendarEvent[];
  skippedEvents: CalendarEvent[];
  needsAttention: CalendarEvent[];
  simulatedMatches: MatchResult[];
  autoSaveTriggered: boolean;
}

// Contract signing result
interface SigningResult {
  success: boolean;
  playerId?: string;
  message: string;
  newBalance?: number;
}
```

### MatchService Example
```typescript
class MatchService {
  simulateMatch(matchId: string): MatchResult | null {
    const state = useGameStore.getState();
    const match = state.matches[matchId];

    // Get teams and players
    const teamA = state.teams[match.teamAId];
    const teamB = state.teams[match.teamBId];

    // Simulate via engine
    const result = matchSimulator.simulate(teamA, teamB, state.players);

    // Update store
    state.updateMatch(matchId, { status: 'completed', result });
    state.addMatchResult(result);

    // Side effects
    this.updateStandings(result);
    this.updatePlayerStats(result);
    this.awardPrizeMoney(result);

    // Cross-service integration: advance tournament bracket if applicable
    if (match.tournamentId) {
      tournamentService.advanceTournament(match.tournamentId, matchId, result);
    }

    return result;
  }

  private updateStandings(result: MatchResult): void {
    // Update win/loss records
  }

  private updatePlayerStats(result: MatchResult): void {
    // Update career stats, form, etc.
  }
}
```

### TournamentTransitionService Example
```typescript
class TournamentTransitionService {
  /**
   * Execute a tournament transition based on configuration
   * Main entry point for all phase transitions
   */
  executeTransition(configId: string, playerRegion?: Region): TransitionResult {
    const config = TOURNAMENT_TRANSITIONS[configId];
    if (!config) {
      return { success: false, error: `No config found for: ${configId}` };
    }

    // Check if tournament already exists (idempotency)
    const tournamentName = this.resolveTournamentName(config, playerRegion);
    const existing = this.findExistingTournament(tournamentName);

    if (existing) {
      return { success: true, tournamentId: existing.id, ... };
    }

    // Execute transition based on type
    if (config.type === 'regional_to_playoff') {
      return this.executeRegionalPlayoffTransition(config, playerRegion!);
    } else {
      return this.executeInternationalTransition(config, playerRegion);
    }
  }

  /**
   * Regional transition: League → Regional Playoffs
   * Example: Stage 1 → Stage 1 Playoffs (per region)
   */
  private executeRegionalPlayoffTransition(
    config: TournamentTransitionConfig,
    region: Region
  ): TransitionResult {
    // 1. Get top N teams from league standings
    const qualifiedTeams = this.getTopTeamsFromStandings(region, config);

    // 2. Create regional playoff tournament
    const tournament = tournamentEngine.createTournament(...);

    // 3. Add to store and schedule matches
    state.addTournament(tournament);
    tournamentService.scheduleTournamentMatches(tournament.id);

    // 4. Transition phase
    state.setCurrentPhase(config.toPhase);

    return { success: true, tournamentId: tournament.id, ... };
  }

  /**
   * International transition: Regional Playoffs → International Tournament
   * Example: Kickoff → Masters, Stage 1 Playoffs → Masters
   */
  private executeInternationalTransition(
    config: TournamentTransitionConfig,
    playerRegion?: Region
  ): TransitionResult {
    // 1. Get qualifications from all 4 regions
    const qualifications = this.getQualifications(config.qualificationSource);

    // 2. Extract qualified teams based on rules
    const { swissParticipants, directPlayoffTeams, teamRegions } =
      this.extractQualifiedTeams(config, qualifications);

    // 3. Create international tournament with Swiss-to-Playoff format
    const tournament = tournamentEngine.createMastersSantiago(
      swissParticipants,
      directPlayoffTeams,
      teamRegions,
      startDate,
      config.prizePool,
      config.tournamentName
    );

    // 4. Add to store, create matches, add events
    state.addTournament(tournament);
    this.createSwissRound1MatchEntities(tournament);
    this.addInternationalTournamentCalendarEvents(tournament);

    // 5. Transition phase
    state.setCurrentPhase(config.toPhase);

    return { success: true, tournamentId: tournament.id, ... };
  }
}
```

### TournamentService Example

Orchestrates tournament lifecycle including Swiss stage progression and playoff transitions.

```typescript
class TournamentService {
  /**
   * Advance tournament bracket after match completion
   * Handles both standard brackets and Swiss stage matches
   */
  advanceTournament(
    tournamentId: string,
    bracketMatchId: string,
    result: MatchResult
  ): boolean {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    // Check if this is a Swiss stage match
    if (isMultiStageTournament(tournament) && tournament.currentStage === 'swiss') {
      return this.advanceSwissMatch(tournamentId, bracketMatchId, result);
    }

    // Standard bracket handling
    const newBracket = bracketManager.completeMatch(
      tournament.bracket,
      bracketMatchId,
      result.winnerId,
      result.loserId,
      result
    );

    // Update store
    state.updateBracket(tournamentId, newBracket);

    // Schedule newly-ready matches and create Match entities
    const freshTournament = useGameStore.getState().tournaments[tournamentId];
    this.scheduleNewlyReadyMatches(freshTournament);
    this.createMatchEntitiesForReadyBracketMatches(freshTournament);

    // Check for completion
    if (bracketManager.getBracketStatus(newBracket) === 'completed') {
      this.handleTournamentCompletion(tournamentId);
    }

    return true;
  }

  /**
   * Advance a Swiss match and check for stage completion
   * Handles qualification/elimination and round progression
   */
  advanceSwissMatch(
    tournamentId: string,
    matchId: string,
    result: MatchResult
  ): boolean {
    const tournament = state.tournaments[tournamentId];

    // Complete match and update standings
    const updatedSwissStage = bracketManager.completeSwissMatch(
      tournament.swissStage,
      matchId,
      result
    );

    state.updateSwissStage(tournamentId, updatedSwissStage);

    // Check progression
    if (bracketManager.isSwissRoundComplete(updatedSwissStage)) {
      if (bracketManager.isSwissStageComplete(updatedSwissStage)) {
        // All teams qualified or eliminated → transition to playoffs
        this.transitionToPlayoffs(tournamentId);
      } else if (updatedSwissStage.currentRound < updatedSwissStage.totalRounds) {
        // Generate next round
        this.generateNextSwissRound(tournamentId);
      } else {
        // Edge case: final round complete but teams still active
        // Force-complete by standings
        this.forceCompleteSwissStage(tournamentId);
      }
    }

    return true;
  }

  /**
   * Force-complete Swiss stage when final round is done but teams remain active
   * Occurs when odd number of teams or rematch constraints prevent pairing
   */
  forceCompleteSwissStage(tournamentId: string): boolean {
    const tournament = state.tournaments[tournamentId];
    const swissStage = tournament.swissStage;

    // Sort active teams by standings (wins desc, losses asc, round diff desc, seed asc)
    const activeTeams = swissStage.standings
      .filter(t => t.status === 'active')
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff;
        return (a.seed || 999) - (b.seed || 999);
      });

    // Calculate needed qualifications
    const qualifiersNeeded = swissStage.winsToQualify * Math.floor(swissStage.standings.length / 2)
      - swissStage.qualifiedTeamIds.length;

    // Qualify top teams, eliminate the rest
    let qualified = 0;
    for (const team of activeTeams) {
      if (qualified < qualifiersNeeded) {
        team.status = 'qualified';
        swissStage.qualifiedTeamIds.push(team.teamId);
        qualified++;
      } else {
        team.status = 'eliminated';
        swissStage.eliminatedTeamIds.push(team.teamId);
      }
    }

    state.updateSwissStage(tournamentId, swissStage);
    this.transitionToPlayoffs(tournamentId);
    return true;
  }

  /**
   * Transition from Swiss stage to playoffs
   * Generates playoff bracket with Swiss qualifiers + direct qualifiers
   */
  transitionToPlayoffs(tournamentId: string): boolean {
    const tournament = state.tournaments[tournamentId];
    const swissQualifiers = bracketManager.getSwissQualifiedTeams(tournament.swissStage);

    // Generate playoff bracket
    const playoffBracket = tournamentEngine.generateMastersPlayoffBracket(
      swissQualifiers,
      tournament.playoffOnlyTeamIds,
      tournamentId
    );

    // Update tournament
    state.updateTournament(tournamentId, { bracket: playoffBracket });
    state.setTournamentCurrentStage(tournamentId, 'playoff');

    // Schedule matches starting from current date + 1 (not tournament start date)
    const freshTournament = useGameStore.getState().tournaments[tournamentId];
    this.schedulePlayoffMatches(freshTournament);
    state.updateBracket(tournamentId, freshTournament.bracket);

    // Create Match entities and calendar events
    const finalTournament = useGameStore.getState().tournaments[tournamentId];
    this.createMatchEntitiesForReadyBracketMatches(finalTournament);
    this.addTournamentCalendarEvents(finalTournament);

    return true;
  }

  /**
   * Schedule playoff matches starting from current date + 1
   * Used when transitioning from Swiss to playoffs mid-tournament
   */
  private schedulePlayoffMatches(tournament: Tournament): void {
    const currentDate = new Date(useGameStore.getState().calendar.currentDate);
    currentDate.setDate(currentDate.getDate() + 1);

    // Schedule all ready matches across upper/lower brackets
    for (const round of tournament.bracket.upper) {
      for (const match of round.matches) {
        if (match.status === 'ready') {
          match.scheduledDate = currentDate.toISOString();
          // Increment date as needed
        }
      }
    }
    // ... same for lower bracket, middle bracket, grand final
  }

  /**
   * Schedule newly-ready matches after a bracket match completes
   * Creates Match entities and calendar events for them
   */
  private scheduleNewlyReadyMatches(tournament: Tournament): void {
    const currentDate = useGameStore.getState().calendar.currentDate;
    const events: CalendarEvent[] = [];

    // Find matches that just became ready (have teams but no scheduled date)
    for (const round of tournament.bracket.upper) {
      for (const match of round.matches) {
        if (match.status === 'ready' && !match.scheduledDate && match.teamAId && match.teamBId) {
          // Schedule for next day
          const nextDay = new Date(currentDate);
          nextDay.setDate(nextDay.getDate() + 1);
          match.scheduledDate = nextDay.toISOString();

          // Create calendar event
          events.push({
            id: `event-match-${match.matchId}`,
            type: 'match',
            date: match.scheduledDate,
            data: { matchId: match.matchId, ... },
            processed: false,
            required: true,
          });
        }
      }
    }

    // Update bracket and add events
    if (events.length > 0) {
      state.updateBracket(tournament.id, tournament.bracket);
      state.addCalendarEvents(events);
    }
  }
}
```

**Key Implementation Notes**:

1. **Match Scheduling Philosophy**:
   - Initial ready matches → schedule from tournament start date
   - Newly-ready matches (after completion) → schedule from current date + 1
   - Playoff transition → schedule from current date + 1 (not Swiss start date)

2. **Swiss Stage Edge Cases**:
   - Final round complete with active teams → force-complete by standings
   - Odd number of teams → one team unpaired
   - Rematch constraints → may prevent valid pairings

3. **Bracket Updates**:
   - Always get fresh state after `updateBracket()` - store snapshots are stale
   - Order matters: schedule first, then create entities, then add events
   - Save updated bracket back to store after scheduling

---

## Persistence Strategy

### IndexedDB Schema (Dexie)
```typescript
class VCTDatabase extends Dexie {
  saves!: Table<SaveSlot>;
  matchHistory!: Table<MatchHistoryEntry>;

  constructor() {
    super('VCTManagerDB');

    this.version(1).stores({
      saves: 'slot, saveDate',
      matchHistory: '++id, season, matchId, date'
    });
  }
}

interface SaveSlot {
  slot: number;  // 1-3 (manual saves)
  saveDate: Date;
  metadata: SaveMetadata;
  gameState: GameState;
}

interface SaveMetadata {
  teamName: string;
  currentDate: Date;
  season: number;
  playtime: number;
  version: string;
}
```

### Auto-Save Middleware
```typescript
const autoSaveMiddleware = (config) => (set, get, api) =>
  config(
    (args) => {
      set(args);

      // Auto-save weekly
      const state = get();
      if (shouldAutoSave(state)) {
        saveManager.autoSave(state);
      }
    },
    get,
    api
  );
```

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
- [x] Configuration constants for all 5 VCT transitions (`src/utils/tournament-transitions.ts`)
- [x] TournamentTransitionService with generic `executeTransition()` method
- [x] Support for regional (league → playoffs) transitions
- [x] Support for international (playoffs → Masters/Champions) transitions
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

### Future Phases (Not Started)
- [ ] Coach system (types defined but not implemented)
- [ ] AI team improvements (smarter decisions)
- [ ] Transfer market (team-to-team trades)
- [ ] Round-by-round detailed simulation
- [ ] Agent mastery system
- [ ] Map veto system
- [ ] Performance optimizations
- [ ] Mobile responsiveness improvements

---

## Key Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State Management** | Zustand | Lightweight, TypeScript-friendly, easy persistence |
| **Persistence** | IndexedDB (Dexie) | Handles large datasets, no circular reference issues |
| **Data Structure** | Normalized by ID | Prevents circular refs, easy serialization |
| **Store Structure** | Flat slices (not nested entities) | Simpler composition, direct access |
| **Date Storage** | ISO strings, not Date objects | Clean serialization, timezone consistency |
| **Time System** | Hybrid (events + rules) | Scheduled events for matches, rules for training/recovery |
| **Time Advancement** | Simulate-then-advance | Simulates TODAY's events before advancing; allows match-day prep |
| **Match Display** | Player team only | UI only shows player's team matches; reduces noise |
| **Training** | Instant with weekly limits (2/player) | Simple UX, prevents spam, strategic planning |
| **Match Sim** | Probabilistic team strength | Weighted stats, chemistry/form modifiers |
| **Bracket System** | Immutable updates | Generate once, update immutably, easy to render |
| **Triple Elim** | 3 winners (no grand final) | Matches VCT Kickoff format exactly |
| **AI** | Simple random (not smart yet) | Start simple, improve over time via interface |
| **Save System** | 3 manual + auto-save (slot 0) | Auto-save every 7 in-game days |
| **Chemistry** | Standalone engine class | ChemistryCalculator with shared constants |
| **Economy** | Full system + loans | Teams can go into debt, must manage carefully |
| **Scrim System** | Tier-based partners (T1/T2/T3) | Map practice, relationships, competitive depth |
| **Map Pool** | 6 attributes + decay | Meaningful scrim choices, affects match sim |
| **Player Negotiations** | Preference-based | Players evaluate salary, team quality, region |
| **League Scheduling** | Stage 1/2 only (not during tournaments) | Matches VCT competitive calendar |
| **League Format** | Round-robin in groups (5 matches/stage) | 12 teams → 2 groups of 6, play each group opponent once |
| **League Opponents** | Same region only | Filter opponents by player's team region |
| **Error Handling** | Graceful degradation | Show errors, preserve state, allow recovery |
| **Loading States** | Context-dependent | Instant for single match, progress for bulk |
| **VLR Data** | Static snapshot (not runtime fetch) | No API dependency, faster startup, works offline |
| **VLR Rosters** | Web scraping + API stats | API provides stats, scraping provides current rosters |
| **VLR Stat Conversion** | Percentile normalization | Maps VLR metrics to 9 game stats with pro-level floor |
| **Tournament Scheduling** | Dynamic (ready matches only) | Prevents "TBD vs TBD", matches real VCT flow |
| **Cross-Service Integration** | MatchService → TournamentService | Tournament brackets update regardless of entry point |
| **Before/After Stats** | Capture "before" in services | Compute "after" in UI; avoids data redundancy |
| **Simulation Results** | Modal with grouped matches | Player team first, then tournaments, then regions |
| **Browser Support** | Modern only | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| **Undo/Redo** | Not implemented | Add later if users request it |
| **Mobile** | Desktop-first | Basic responsive, needs improvement |
| **i18n** | English only | Structured for future localization |
| **Audio** | Not implemented | Future polish phase |
| **Achievements** | Not implemented | After core functionality complete |
| **Roster Movement** | Service-based with UI complete | Full active/reserve roster management |
| **Tournament Transitions** | Generic configuration system | All transitions use TournamentTransitionService |

---

## Additional Architecture Details

### Error Handling Strategy

```typescript
// Global error boundary
class GameErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Game error:', error, errorInfo);
    // Preserve game state - don't reset
    // Show user-friendly recovery options
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorRecoveryScreen
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
          onLoadLastSave={() => {/* Load auto-save */}}
        />
      );
    }
    return this.props.children;
  }
}

// Service-level error handling (graceful degradation)
class MatchService {
  simulateMatch(matchId: string): { success: boolean; data?: MatchResult; error?: string } {
    try {
      const result = matchSimulator.simulate(/* ... */);
      return { success: true, data: result };
    } catch (error) {
      console.error('Match simulation failed:', error);
      // Don't crash - show error to user
      useGameStore.getState().setError('Failed to simulate match. Please try again.');
      return { success: false, error: error.message };
    }
  }
}

// Store error state
interface UISlice {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}
```

**Error Recovery Options:**
- Retry the failed operation
- Load last auto-save
- Continue with partial functionality
- Report bug (copy error details)

### Loading States & Progress Tracking

```typescript
interface UISlice {
  // Single match - instant (no loading state needed)
  isSimulating: boolean;

  // Bulk simulation - show progress
  bulkSimulation?: {
    current: number;
    total: number;
    status: string;
    canCancel: boolean;
  };
}

// Bulk simulation with progress
class SimulationService {
  simulateTournamentRound(roundId: string): void {
    const matches = this.getMatchesInRound(roundId);

    useGameStore.setState({
      isSimulating: true,
      bulkSimulation: {
        current: 0,
        total: matches.length,
        status: 'Starting tournament round simulation...',
        canCancel: true
      }
    });

    for (let i = 0; i < matches.length; i++) {
      // Check if user cancelled
      if (this.shouldCancelSimulation()) {
        this.cleanupSimulation();
        return;
      }

      useGameStore.setState({
        bulkSimulation: {
          current: i + 1,
          total: matches.length,
          status: `Simulating match ${i + 1} of ${matches.length}...`,
          canCancel: true
        }
      });

      matchService.simulateMatch(matches[i].id);
    }

    useGameStore.setState({
      isSimulating: false,
      bulkSimulation: undefined
    });
  }

  cancelBulkSimulation(): void {
    // User can cancel mid-simulation
    // Already-simulated matches are kept
  }
}
```

**Loading UI Pattern:**
```typescript
function SimulationProgress() {
  const bulk = useGameStore(state => state.ui.bulkSimulation);

  if (!bulk) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg">
        <h2>Simulating Tournament</h2>
        <div className="w-full bg-gray-700 rounded-full h-4 mt-4">
          <div
            className="bg-red-600 h-4 rounded-full transition-all"
            style={{ width: `${(bulk.current / bulk.total) * 100}%` }}
          />
        </div>
        <p className="mt-2">{bulk.status}</p>
        <p className="text-gray-400">{bulk.current} / {bulk.total}</p>
        {bulk.canCancel && (
          <button onClick={cancelSimulation}>Cancel</button>
        )}
      </div>
    </div>
  );
}
```

### Game Initialization & Setup Flow

```typescript
interface GameSetupOptions {
  // Player selections
  playerName: string;
  region: 'Americas' | 'EMEA' | 'Pacific' | 'China';

  // Team selection
  teamSelection: {
    type: 'existing' | 'custom' | 'random';
    existingTeamId?: string;  // If picking existing VCT team
    customTeamName?: string;  // If creating custom team
  };

  // Roster selection
  rosterSelection: {
    type: 'existing' | 'draft' | 'random';
    // If 'draft', player picks 5 players from a pool
    // If 'existing', inherit the VCT team's roster
    // If 'random', generate 5 random players
  };

  // Difficulty (affects starting budget)
  difficulty: 'easy' | 'normal' | 'hard';
}

class GameInitializer {
  async initializeNewGame(options: GameSetupOptions): Promise<GameState> {
    // Step 1: Load or generate player database
    const playerDatabase = await this.loadPlayerDatabase();

    // Step 2: Generate all teams
    const allTeams = this.generateTeams(playerDatabase, options.region);

    // Step 3: Create/select player's team
    let playerTeam: Team;
    switch (options.teamSelection.type) {
      case 'existing':
        playerTeam = allTeams.find(t => t.id === options.teamSelection.existingTeamId);
        break;
      case 'custom':
        playerTeam = this.createCustomTeam(options);
        break;
      case 'random':
        playerTeam = this.generateRandomTeam(options);
        break;
    }

    // Step 4: Set up player's roster
    switch (options.rosterSelection.type) {
      case 'existing':
        // Keep existing roster
        break;
      case 'draft':
        // Show draft UI (handled by component, not here)
        playerTeam.playerIds = []; // Will be filled by draft
        break;
      case 'random':
        playerTeam.playerIds = this.selectRandomPlayers(playerDatabase, 5);
        break;
    }

    // Step 5: Set starting budget based on difficulty
    playerTeam.finances.balance = this.calculateStartingBudget(
      playerTeam.organizationValue,
      options.difficulty
    );

    // Step 6: Generate season schedule
    const schedule = this.generateSeasonSchedule(allTeams, options.region);

    // Step 7: Initialize calendar
    const calendar = this.initializeCalendar(schedule);

    return {
      entities: {
        players: this.normalizeEntities(playerDatabase),
        teams: this.normalizeEntities([...allTeams, playerTeam]),
        coaches: {},
        matches: this.normalizeEntities(schedule.matches),
        tournaments: this.normalizeEntities(schedule.tournaments),
      },
      calendar,
      playerTeamId: playerTeam.id,
      matchHistory: {
        currentSeason: [],
        archivedSeasons: []
      },
      ui: {
        error: null,
        isSimulating: false
      }
    };
  }

  private calculateStartingBudget(orgValue: number, difficulty: Difficulty): number {
    const multipliers = {
      easy: 1.5,
      normal: 1.0,
      hard: 0.7
    };
    return orgValue * multipliers[difficulty];
  }

  // VLR data integration (Phase 2)
  private async loadPlayerDatabase(): Promise<Player[]> {
    // Try to load from VLR scraper
    try {
      const vlrData = await VLRScraper.fetchPlayers();
      return this.convertVLRToPlayers(vlrData);
    } catch (error) {
      console.warn('VLR data unavailable, using procedural generation');
      return this.generateProceduralPlayers();
    }
  }

  // Procedural generation (Phase 1 fallback)
  private generateProceduralPlayers(): Player[] {
    const players: Player[] = [];
    const regions = ['Americas', 'EMEA', 'Pacific', 'China'];

    // Generate 20 teams × 5 players = 100 players per region
    regions.forEach(region => {
      for (let i = 0; i < 100; i++) {
        players.push(this.generatePlayer(region));
      }
    });

    return players;
  }
}
```

**Setup Flow UI:**
```
1. Welcome Screen
   ↓
2. Region Selection (Americas, EMEA, Pacific, China)
   ↓
3. Team Selection
   - Pick existing VCT team (dropdown)
   - Create custom team (enter name)
   - Random team
   ↓
4. Roster Selection (if custom/random team)
   - Draft 5 players (player pool UI)
   - Random 5 players
   ↓
5. Difficulty Selection (Easy, Normal, Hard)
   ↓
6. Confirm & Start Game
```

### Time Progression & Off-Day Activities

```typescript
interface CalendarEvent {
  id: string;
  date: Date;
  type: CalendarEventType;
  required: boolean;  // Must process (matches) vs optional (training)
  data: any;
}

type CalendarEventType =
  | 'match'              // Required
  | 'tournament_start'   // Required
  | 'training_available' // Optional
  | 'sponsorship_event'  // Optional
  | 'transfer_window'    // Optional
  | 'salary_payment'     // Automatic
  | 'rest_day';          // Optional (can skip)

class TimeProgression {
  /**
   * Advance to next required event (match or tournament)
   * Skip all optional events in between
   */
  advanceToNextMatch(): { date: Date; events: CalendarEvent[] } {
    const calendar = useGameStore.getState().calendar;
    const nextMatch = this.findNextEvent(calendar, ['match', 'tournament_start']);

    if (!nextMatch) {
      throw new Error('No upcoming matches');
    }

    // Process all events between now and next match
    const eventsToProcess = this.getEventsBetween(
      calendar.currentDate,
      nextMatch.date
    );

    // Auto-process mandatory events (salary payments)
    // Skip optional events (player chooses not to do them)
    const processed = eventsToProcess.filter(e => e.type === 'salary_payment');

    return {
      date: nextMatch.date,
      events: processed
    };
  }

  /**
   * Advance one day at a time
   * Shows all available activities for that day
   */
  advanceDay(): { date: Date; availableActivities: Activity[] } {
    const calendar = useGameStore.getState().calendar;
    const nextDate = addDays(calendar.currentDate, 1);

    // Get all events for this day
    const dayEvents = calendar.scheduledEvents.filter(e =>
      isSameDay(e.date, nextDate)
    );

    // Convert to activities player can do
    const activities: Activity[] = dayEvents.map(e => ({
      type: e.type,
      required: e.required,
      action: () => this.processEvent(e)
    }));

    // Always allow training on off-days
    if (!dayEvents.some(e => e.type === 'match')) {
      activities.push({
        type: 'training_available',
        required: false,
        action: () => {/* Show training UI */}
      });
    }

    // Process automatic events
    dayEvents
      .filter(e => e.type === 'salary_payment')
      .forEach(e => this.processEvent(e));

    return {
      date: nextDate,
      availableActivities: activities
    };
  }

  /**
   * Advance one week
   * Player can choose activities each day or skip
   */
  advanceWeek(): { endDate: Date; summary: WeekSummary } {
    const summary: WeekSummary = {
      matchesPlayed: 0,
      trainingSessions: 0,
      events: []
    };

    for (let i = 0; i < 7; i++) {
      const { availableActivities } = this.advanceDay();

      // For each optional activity, ask player
      // For now, auto-skip optional activities in week mode
      availableActivities
        .filter(a => a.required)
        .forEach(a => {
          a.action();
          if (a.type === 'match') summary.matchesPlayed++;
        });
    }

    return { endDate: useGameStore.getState().calendar.currentDate, summary };
  }
}

interface Activity {
  type: CalendarEventType;
  required: boolean;
  description?: string;
  action: () => void;
}
```

**Calendar UI:**
```typescript
function CalendarView() {
  const currentDate = useGameStore(state => state.calendar.currentDate);
  const upcomingEvents = useGameStore(state =>
    state.calendar.scheduledEvents
      .filter(e => isAfter(e.date, currentDate))
      .slice(0, 10)
  );

  return (
    <div>
      <h2>Current Date: {format(currentDate, 'MMM dd, yyyy')}</h2>

      <div className="flex gap-4">
        <button onClick={advanceDay}>
          Advance 1 Day
        </button>
        <button onClick={advanceWeek}>
          Advance 1 Week
        </button>
        <button onClick={advanceToNextMatch}>
          Jump to Next Match
        </button>
      </div>

      <h3>Upcoming Events</h3>
      <ul>
        {upcomingEvents.map(event => (
          <li key={event.id}>
            {format(event.date, 'MMM dd')} - {event.type}
            {event.type === 'match' && (
              <button onClick={() => jumpToDate(event.date)}>
                Jump to Match
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Today's available activities */}
      <TodayActivities />
    </div>
  );
}

function TodayActivities() {
  const activities = useGameStore(state => getTodayActivities(state));

  if (activities.length === 0) {
    return <p>No scheduled activities today. Rest day!</p>;
  }

  return (
    <div>
      <h3>Today's Activities</h3>
      {activities.map(activity => (
        <ActivityCard
          key={activity.type}
          activity={activity}
          required={activity.required}
        />
      ))}
    </div>
  );
}
```

### Tournament Bulk Simulation

```typescript
class TournamentService {
  /**
   * Simulate entire tournament at once
   * Shows progress, allows cancellation
   */
  simulateEntireTournament(tournamentId: string): void {
    const tournament = useGameStore.getState().entities.tournaments[tournamentId];
    const allMatches = this.getAllTournamentMatches(tournament);

    // Filter to only unsimulated matches
    const pendingMatches = allMatches.filter(m => m.status !== 'completed');

    if (pendingMatches.length === 0) {
      return; // Tournament already complete
    }

    // Ask for confirmation
    const confirmed = window.confirm(
      `Simulate entire tournament? (${pendingMatches.length} matches)`
    );

    if (!confirmed) return;

    // Start bulk simulation
    useGameStore.setState({
      isSimulating: true,
      bulkSimulation: {
        current: 0,
        total: pendingMatches.length,
        status: 'Starting tournament simulation...',
        canCancel: true
      }
    });

    // Simulate in order (respects bracket dependencies)
    let currentMatch = 0;

    while (currentMatch < pendingMatches.length) {
      // Check cancellation
      if (this.checkCancellation()) {
        this.cleanupBulkSimulation();
        return;
      }

      // Find next ready match
      const nextMatch = this.getNextReadyMatch(tournament);

      if (!nextMatch) {
        console.warn('No ready matches, but tournament not complete');
        break;
      }

      // Update progress
      useGameStore.setState({
        bulkSimulation: {
          current: currentMatch + 1,
          total: pendingMatches.length,
          status: `Simulating ${nextMatch.teamAId} vs ${nextMatch.teamBId}...`,
          canCancel: true
        }
      });

      // Simulate
      matchService.simulateMatch(nextMatch.id);
      currentMatch++;

      // Small delay for UX (so progress is visible)
      await this.sleep(100);
    }

    // Complete
    useGameStore.setState({
      isSimulating: false,
      bulkSimulation: undefined
    });

    // Show results summary
    this.showTournamentSummary(tournament);
  }

  /**
   * Simulate single round of tournament
   * Useful for double/triple elim (simulate upper bracket, then lower, etc.)
   */
  simulateTournamentRound(tournamentId: string, roundId: string): void {
    // Similar to above but only for one round
  }
}
```

**Tournament Control UI:**
```typescript
function TournamentControls({ tournamentId }: Props) {
  const tournament = useGameStore(state => state.entities.tournaments[tournamentId]);

  const nextMatch = getNextReadyMatch(tournament);
  const hasMoreMatches = checkHasMoreMatches(tournament);

  return (
    <div className="flex gap-4">
      {nextMatch && (
        <button onClick={() => simulateSingleMatch(nextMatch.id)}>
          Simulate Next Match
        </button>
      )}

      {hasMoreMatches && (
        <>
          <button onClick={() => simulateRound(tournament.bracket.upper[0].roundId)}>
            Simulate Current Round
          </button>

          <button onClick={() => simulateEntireTournament(tournamentId)}>
            Simulate Entire Tournament
          </button>
        </>
      )}

      {tournament.status === 'completed' && (
        <div>
          <h3>Tournament Complete!</h3>
          <p>Champion: {getTeamName(tournament.championId)}</p>
          <button onClick={() => viewTournamentResults(tournamentId)}>
            View Full Results
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Data Seeding Strategy

### VLR Data Integration ✓ (Complete)

The game uses real VCT player data from VLR.gg via a static snapshot approach:

**Refresh Process:**
```bash
# Run when rosters change (roster moves, new season, etc.)
npm run fetch-vlr

# This runs scripts/fetch-vlr-data.ts which:
# 1. Fetches player stats from vlrggapi (6000+ players)
# 2. Scrapes current rosters from vlr.gg (48 teams × 5 players)
# 3. Writes to src/data/vlrSnapshot.ts
```

**Data Statistics:**
- Total players in snapshot: ~6,800
- Matched to VCT teams: ~240 (48 teams × 5 players)
- Unmatched → Free agent pool: Top 25 per region by rating

**Fallback Behavior:**
- If VLR data unavailable: Falls back to procedural generation
- If player not in VLR stats but on roster: Generated with `forceName`
- If roster incomplete: Filled with generated players

**Team Roster Sources:**
| Data | Source | Method |
|------|--------|--------|
| Player stats | vlrggapi.vercel.app | REST API |
| Team rosters | vlr.gg/team/{id} | Web scraping |
| Team name mapping | orgMapping.ts | Manual mapping |

---

## Implementation Notes (Lessons Learned)

This section documents key decisions and patterns that evolved during implementation.

### 1. Date Serialization

**Problem**: JavaScript `Date` objects don't serialize cleanly to JSON/IndexedDB.

**Solution**: All dates are stored as ISO strings (`"2026-01-15"`). When displaying dates, use `parseAsLocalDate()` helper to avoid timezone issues:

```typescript
// WRONG: Creates UTC date, displays wrong in local timezone
const date = new Date("2026-01-15");

// CORRECT: Parse as local date
function parseAsLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
```

### 2. Flat Store vs Nested Entities

**Original spec** had `entities: { players, teams, ... }` nested structure.

**Implementation** uses flat structure at store root level. Benefits:
- Simpler slice composition
- Easier direct access (`state.players` vs `state.entities.players`)
- No breaking change to existing patterns

### 3. Match-Calendar Linking

**Problem**: Match data was duplicated between calendar events and match store, causing desync.

**Solution**: Calendar events reference match IDs; Match entities are the source of truth:
- Season matches: Created in store during game init
- Tournament matches: Created when bracket matches become "ready"
- Calendar events link via `data.matchId`

**Important**: Calendar events and Match entities are only created for "ready" bracket matches (matches where both teams are known). Pending matches do not appear on the calendar until their prerequisite matches complete.

### 4. VCT 2026 Season Structure

Implemented authentic VCT 2026 calendar with distinct phases (matches actual format from valorantesports.com):

| Phase | Days | Duration | Type | Description |
|-------|------|----------|------|-------------|
| Kickoff | 0-28 | 28 days | Tournament | Triple Elim, 12 teams, top 3 qualify per region |
| Masters Santiago | 35-53 | 18 days | International | Swiss Stage (8 teams) + Playoffs (8 teams) |
| Stage 1 | 56-91 | 35 days | League | Round-robin in 2 groups of 6 |
| Stage 1 Playoffs | 98-112 | 14 days | Tournament | Top 8 teams from league |
| Masters London | 119-137 | 18 days | International | Swiss Stage + Playoffs |
| Stage 2 | 140-175 | 35 days | League | Round-robin in groups |
| Stage 2 Playoffs | 182-196 | 14 days | Tournament | Playoff tournament |
| Champions Shanghai | 217-238 | 21 days | International | World Championship |
| Offseason | 245+ | 120 days | Rest | No matches |

**Key differences from previous structure:**
- Masters comes AFTER Kickoff (not after Stage 1)
- Masters uses Swiss-to-Playoff format (see below)
- Stage 1/2 Playoffs added as separate phases
- Round-robin format: 12 regional teams split into 2 groups of 6
- Each team plays 5 matches per stage (one against each group opponent)
- League matches only scheduled during Stage 1 and Stage 2 phases

### 7. Swiss-to-Playoff (Masters Format)

Masters tournaments use a two-stage format:

**Swiss Stage (Days 1-4):**
- 8 teams participate (2nd + 3rd place from each regional Kickoff)
- 3 rounds of Swiss format
- Win 2 matches → Qualify for Playoffs
- Lose 2 matches → Eliminated
- Cross-regional pairings in Round 1
- Later rounds pair by record (e.g., 1-0 vs 1-0), avoiding rematches

**Playoffs (Days 6-18):**
- 8 teams: 4 Swiss qualifiers + 4 Kickoff winners (alpha bracket winners)
- Double elimination bracket
- Kickoff winners seeded 1-4, Swiss qualifiers seeded 5-8

**Code Locations:**
- Swiss stage: `BracketManager.initializeSwissStage()`, `generateNextSwissRound()`, `completeSwissMatch()`
- Tournament creation: `TournamentEngine.createMastersSantiago()`
- Service orchestration: `TournamentService.advanceSwissMatch()`, `transitionToPlayoffs()`
- UI: `SwissStageView` component

### 5. Round-Robin League Format

Stage 1 and Stage 2 use round-robin format within groups:

**Group Assignment (Snake Draft):**
```
12 regional teams sorted by org value → snake drafted into 2 groups

Sorted: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 (by strength)
Group A: 1, 4, 5, 8, 9, 12 (snake picks: 0,3,4,7,8,11)
Group B: 2, 3, 6, 7, 10, 11 (snake picks: 1,2,5,6,9,10)
```

**Match Scheduling:**
- Player's team placed in Group A with top-seeded opponents
- Each team plays every other group opponent once (5 matches per stage)
- 1 match per week over 5 weeks
- Alternating home/away

**Code Location:** `EventScheduler.generateLeagueMatchSchedule()`

### 6. Triple Elimination (VCT Kickoff)

The Kickoff format has **3 winners** (Alpha, Beta, Omega) instead of a single champion:
- Upper (Alpha) bracket: 0 losses
- Middle (Beta) bracket: 1 loss
- Lower (Omega) bracket: 2 losses

Each bracket has its own "final" match. No grand final - the three finals produce three qualifiers for Masters.

### 6. Architecture Compliance Checklist

When adding new features, verify:

✅ **Engine classes** - No React imports, no store access, pure functions
✅ **Services** - Use `useGameStore.getState()` for state access, call engines
✅ **Components** - Read from store via hooks, call services, no business logic
✅ **Types** - All dates as strings, IDs not nested objects (normalized)
✅ **State updates** - Immutable (spread operators), never mutate
✅ **Cross-service integration** - When simulating a match that belongs to a tournament, the service must also advance the tournament bracket (e.g., MatchService calls TournamentService.advanceTournament for tournament matches)

### 7. Cross-Service Integration Rules

When a match is simulated, the system must ensure all related state is updated correctly:

- **Regular season matches**: Update match status, team standings, player stats
- **Tournament matches**: Additionally advance the tournament bracket by calling `TournamentService.advanceTournament()`

This ensures consistency regardless of which entry point triggers the match simulation (Schedule page, Tournament page, or auto-simulation).

### 8. Tournament Scheduling (Dynamic)

Tournament matches are scheduled dynamically, not all at once:

**Tournament Creation Flow:**
1. Bracket structure created with all matches (most start as `status: 'pending'`)
2. Round 1 matches have `status: 'ready'` (teams known from seeding)
3. Only ready matches get: scheduled dates, calendar events, Match entities

**Swiss-to-Playoff Tournament Flow:**
1. Swiss stage initialized with Round 1 matches (cross-regional pairings)
2. Swiss matches processed via `advanceSwissMatch()` which handles qualification/elimination
3. After each round completes, next round generated via `generateNextSwissRound()`
4. When Swiss complete (4 qualified, 4 eliminated), `transitionToPlayoffs()` creates bracket
5. Playoff bracket populated with Swiss qualifiers (seeds 5-8) + Kickoff winners (seeds 1-4)

**Match Completion Flow:**
1. Match simulated → result recorded
2. `advanceTournament()` detects Swiss vs bracket match:
   - Swiss match: calls `advanceSwissMatch()` to update standings/status
   - Bracket match: calls `bracketManager.completeMatch()` to propagate winner/loser
3. `scheduleNewlyReadyMatches()` assigns dates to newly-ready bracket matches (**MUST run first**)
4. `createMatchEntitiesForReadyBracketMatches()` creates Match entities using those dates (**MUST run second**)

**Critical: Order of Operations**

The order of steps 3 and 4 is critical. `createMatchEntitiesForReadyBracketMatches()` uses `bracketMatch.scheduledDate` when creating Match entities:
```typescript
scheduledDate: bracketMatch.scheduledDate || tournament.startDate
```

If `scheduleNewlyReadyMatches()` hasn't run yet, `bracketMatch.scheduledDate` is undefined, and Match entities get the wrong date (tournament start date instead of the actual scheduled date). This causes a date mismatch between Match entities and calendar events, breaking bracket progression.

**Key Methods in TournamentService:**
- `scheduleTournamentMatches()` - Only schedules `status === 'ready'` matches
- `addTournamentCalendarEvents()` - Only creates events for ready matches with known teams
- `scheduleNewlyReadyMatches()` - Dynamically schedules newly-ready matches after bracket advances
- `countReadyMatches()` - Helper to count ready matches for scheduling calculations

This approach:
- Prevents "TBD vs TBD" matches from appearing on the calendar
- Ensures calendar events always have corresponding Match entities
- Matches real VCT tournament flow (next day's matches announced after current round)

### 9. Known Technical Debt

| Area | Issue | Priority |
|------|-------|----------|
| AI Teams | No smart decision-making yet (uses random/simple logic) | Medium |
| Round Simulation | Currently simplified (no detailed round-by-round) | Low |
| Coach System | Types defined but not implemented | Medium |
| Mobile | Desktop-first, needs responsive improvements | Low |
| VLR Bundle Size | Snapshot adds ~2.5MB to bundle (consider lazy loading) | Low |
| Automated Tests | No test files exist in project yet | Medium |

### 10. Testing Strategy

- **Engine tests**: Pure function tests with Vitest
- **Manual testing**: Start new game to test full flow (existing saves may have stale data)
- **Timezone testing**: Test in different timezones for date display bugs

### 11. Performance Considerations

- Store selectors should be stable (avoid creating new functions each render)
- Bulk operations should use `addPlayers()` / `addTeams()` instead of individual adds
- Calendar events should be cleaned up after processing (`clearProcessedEvents()`)
- Scrim history capped at 50 entries to prevent unbounded growth

### 12. Game Loop & Time Advancement

The game follows a **"Review → Prepare → Commit"** daily loop:

```
┌─────────────────────────────────────────────────────────┐
│  START OF DAY X                                         │
│  ├── View today's activities (match? training? scrim?)  │
│  ├── Make roster changes                                │
│  ├── Train players (if no match)                        │
│  ├── Schedule scrims (if no match)                      │
│  └── Click "Advance Day"                                │
│        ├── Simulates TODAY's events (Day X)             │
│        └── Moves to START OF DAY X+1                    │
└─────────────────────────────────────────────────────────┘
```

**Key principle**: Matches are simulated BEFORE advancing, not after landing on a new day. This allows match-day preparation.

**Time Control Behavior:**

| Action | What Happens |
|--------|--------------|
| `advanceDay()` | Simulate TODAY's events → Advance to tomorrow |

Note: `advanceWeek()` and `advanceToNextMatch()` features were removed due to bugs. Only `advanceDay()` is currently available.

**Player Team Filtering:**

All match-related UI only shows the player's team matches:
- `getNextMatchEvent()` returns player's team's next match only
- `TodayActivities` shows "MATCH DAY" only when player's team plays
- `TimeControls` shows "Play Match" button only for player's matches

This is implemented by checking `MatchEventData.homeTeamId` or `awayTeamId` against `playerTeamId`.

### 13. Cross-Slice State Access Pattern

When a store slice needs data from another slice (e.g., `gameSlice` needs `playerTeamId` from `teamSlice`), use type assertion since `get()` returns the full combined state at runtime:

```typescript
// In gameSlice.ts
getNextMatchEvent: () => {
  const state = get();
  // Access playerTeamId from TeamSlice via type assertion
  const playerTeamId = (state as unknown as { playerTeamId: string | null }).playerTeamId;
  // ... filter logic
}
```

This pattern is safe because Zustand combines all slices into one store.

### 14. VLR Integration Pattern

VLR data is integrated via a **static snapshot** approach:

**Data Flow:**
```
scripts/fetch-vlr-data.ts (CLI)
  ├── Phase 1: Fetch player stats from vlrggapi
  │     GET /stats?region=na,eu,br,ap,kr,cn
  │     → 6000+ players with ratings/stats
  │
  └── Phase 2: Scrape team rosters from vlr.gg
        GET /team/{id}/{slug} for each of 48 teams
        Extract player names from /player/{id}/{ign} links
        → 48 teams × 5 players

                    ↓

src/data/vlrSnapshot.ts
  ├── VLR_PLAYER_STATS: VlrPlayer[]
  └── VLR_TEAM_ROSTERS: VlrRosterData

                    ↓

GameInitService.generateWithVlrData()
  ├── Look up roster from VLR_TEAM_ROSTERS[teamName]
  ├── For each player in roster:
  │     - Find VLR stats by name match (case-insensitive)
  │     - If found: create player from VLR stats via VlrDataProcessor
  │     - If not found: generate player with forceName
  └── Fill remaining slots with generated players
```

**Why static snapshot:**
- No runtime API dependency (faster startup, works offline)
- Bundle includes data - no network latency
- Simple cache invalidation (just re-run `npm run fetch-vlr`)
- Can curate/validate data before committing

**VLR Stat Conversion Algorithm:**

| Game Stat | VLR Sources | Rationale |
|-----------|-------------|-----------|
| `mechanics` | ACS, HS%, K/D | Raw fragging ability |
| `igl` | KAST, rating | Team-oriented leadership |
| `mental` | K/D, clutch%, rating | Composure |
| `clutch` | Clutch% (weighted heavily) | 1vX performance |
| `vibes` | KAST, rating, K/D | Team morale |
| `lurking` | Inverse FKPR | Solo play (low entry rate) |
| `entry` | FKPR, ACS | First contact aggression |
| `support` | APR, KAST | Utility and assists |
| `stamina` | Rating consistency | Long-term performance |

Stats are normalized to 55-95 range (all VLR players are professionals).

### 15. Before/After Stats Pattern

For training and scrim results, we display "old → new" stat changes:

**Pattern:** Capture "before" snapshot in services, compute "after" in UI.

```typescript
// In TrainingService.ts
trainPlayer(playerId: string, focus: TrainingFocus): TrainingResult {
  const player = state.players[playerId];

  // 1. Capture "before" snapshot
  const statsBefore = { ...player.stats };
  const moraleBefore = player.morale;

  // 2. Call engine (which returns changes, not new values)
  const result = playerDevelopment.train(player, focus);

  // 3. Apply changes to store
  state.updatePlayer(playerId, {
    stats: applyChanges(player.stats, result.statImprovements),
    morale: player.morale + result.moraleChange
  });

  // 4. Return result with "before" values attached
  return {
    ...result,
    statsBefore,
    moraleBefore
  };
}

// In TrainingModal.tsx (UI)
{Object.entries(result.statImprovements).map(([stat, change]) => {
  const before = result.statsBefore?.[stat] ?? 0;
  const after = before + change;
  return (
    <div className={change > 0 ? 'text-green-400' : 'text-gray-400'}>
      {stat}: {before} → {after}
    </div>
  );
})}
```

**Why this approach:**
- Avoids storing redundant data (newStats = oldStats + changes)
- Engine stays pure (returns change amounts only)
- Service layer adds context for UI
- Backward compatible (before fields are optional)

### 16. Simulation Results Modal Pattern

When time advances and matches are simulated, results are displayed in a grouped modal:

```typescript
// Data structure for grouping
interface GroupedMatches {
  playerTeamMatches: MatchWithDetails[];     // Top section (highlighted)
  tournamentGroups: Map<string, {
    name: string;
    matches: MatchWithDetails[];
  }>;
  regionGroups: Map<string, MatchWithDetails[]>;
}

// Grouping logic
function groupMatches(results: MatchResult[], playerTeamId: string): GroupedMatches {
  for (const match of results) {
    if (match.teamAId === playerTeamId || match.teamBId === playerTeamId) {
      grouped.playerTeamMatches.push(match);
    } else if (match.tournamentId) {
      // Add to tournament group
    } else {
      // Add to region group (by teamA's region)
    }
  }
}
```

**UI Hierarchy:**
1. **Your Matches** (green/red highlighting based on win/loss)
2. **Tournament Matches** (grouped by tournament name, purple theme)
3. **League Matches** (grouped by region, blue theme)

**Integration points:**
- `CalendarService.advanceDay/Week()` returns `TimeAdvanceResult.simulatedMatches`
- `Dashboard.tsx` shows modal when `simulatedMatches.length > 0`
- Clicking match card opens detailed result view

### 16.5. Tournament Completion Modal Pattern

When a Masters or Champions tournament completes, a completion modal displays full results:

**Trigger Flow**:
```
TournamentService.advanceTournament()
    ↓ (bracket status === 'completed')
setTournamentChampion() + distributePrizes()
    ↓ (tournament.type === 'masters' || 'champions')
handleMastersCompletion(tournamentId)
    ↓
openModal('masters_completion', data)
    ↓
TimeBar renders MastersCompletionModal
```

**Modal Data Structure**:
```typescript
interface MastersCompletionModalData {
  tournamentId: string;
  tournamentName: string;
  championId: string;
  championName: string;
  finalPlacements: Array<{
    teamId: string;
    teamName: string;
    placement: number;
    prize: number;
  }>;
  swissStandings: SwissTeamRecord[];  // Empty for non-Swiss tournaments
  playerTeamPlacement?: {
    placement: number;
    prize: number;
    qualifiedFromSwiss: boolean;
  };
}
```

**Modal Features**:
- Three tabs: Summary, Swiss Stage, Playoff Results
- Player team highlighting throughout
- Prize money display for all placements
- Champion trophy display
- "View Full Bracket" button to navigate to Tournament page

**Files**:
- `src/components/tournament/MastersCompletionModal.tsx` - Modal component
- `src/services/TournamentService.ts` - `handleMastersCompletion()` method
- `src/components/layout/TimeBar.tsx` - Modal rendering

This pattern mirrors the QualificationModal for Kickoff completion, using the same UISlice modal system.

### 17. Training Capacity Pattern

Training remains available until all players reach weekly limits:

```typescript
// In TrainingService.ts
getTrainingSummary(): { playersCanTrain: number; totalPlayers: number } {
  const players = getPlayerTeamRoster();
  const playersCanTrain = players.filter(p =>
    getWeeklyTrainingCount(p.id) < MAX_WEEKLY_TRAINING
  ).length;
  return { playersCanTrain, totalPlayers: players.length };
}

// Do NOT mark training event as processed after single session
// (Unlike matches which are one-time events)
```

**UI Pattern:**
```tsx
<button disabled={trainingSummary.playersCanTrain === 0}>
  Train ({trainingSummary.playersCanTrain}/{trainingSummary.totalPlayers} can train)
</button>
```

### 18. Shared Constants Pattern

Constants used by multiple engine classes are extracted to shared files:

```typescript
// src/engine/match/constants.ts
export const STAT_WEIGHTS = {
  mechanics: 0.25,
  igl: 0.15,
  mental: 0.15,
  clutch: 0.10,
  vibes: 0.05,
  lurking: 0.05,
  entry: 0.10,
  support: 0.10,
  stamina: 0.05
};

export const MAX_CHEMISTRY_BONUS = 0.20; // 20%

// Used by MatchSimulator and ChemistryCalculator
import { STAT_WEIGHTS, MAX_CHEMISTRY_BONUS } from './constants';
```

This prevents value drift and ensures consistent calculations across the codebase.

### 19. Unified Simulation System (IMPLEMENTED)

**Status**: Implemented - unified time/simulation system via global TimeBar.

**Problem Identified**: The codebase has 5 distinct simulation entry points with inconsistent behavior:

| System | Location | Time Advances? | Modal Shown | Event Marked? |
|--------|----------|----------------|-------------|---------------|
| Dashboard TimeControls | `TimeControls.tsx` | Yes | SimulationResultsModal | Auto |
| Schedule TimeControls | `Schedule.tsx` (compact) | Yes | None (silent) | Auto |
| Dashboard Match Click | `Dashboard.tsx` | No | SimulationResultsModal | Manual |
| Tournament Simulation | `Tournament.tsx` | No | Banner notification | No |
| Schedule DayDetailPanel | `DayDetailPanel.tsx` | No | MatchResult detail | No |

**Core Issues**:
1. No clear "turn" structure - users can simulate from multiple places
2. "Simulate without time" creates paradoxes (match done but still on match day)
3. Tournament matches exist outside calendar time system
4. Different modals/feedback per context breaks user expectations

**Planned Solution: Global TimeBar**

Single persistent time control bar visible on ALL pages:
```
┌────────────────────────────────────────────────────────────────────┐
│  📅 January 15, 2026  |  Stage 1  |  MATCH TODAY: vs Sentinels     │
│  [Advance Day / Play Match]                                        │
└────────────────────────────────────────────────────────────────────┘
```

Note: "Advance Week" and "Jump to Match" features were removed due to bugs. May be re-added in a future update.

**Design Principle**: "Time is King" - every match simulation advances time. No "simulate without advancing" option.

**Game Loop**:
```
START OF DAY → View calendar, do activities → Click TimeBar button →
Process events + simulate matches → Show SimulationResultsModal → NEXT DAY
```

**What Gets Removed**:
- `TimeControls` component from Dashboard/Schedule (replaced by global bar)
- "MATCH DAY" click handler from TodayActivities
- "Simulate Match" button from DayDetailPanel
- "Simulate Match/Round/All" from Tournament page (becomes view-only)
- Tournament-specific simulation methods

**Files to Create**:
- `src/components/layout/TimeBar.tsx` - Global time control bar

**Files to Modify**:
- `src/App.tsx` - Add TimeBar to layout
- `src/services/CalendarService.ts` - Consolidate all simulation logic
- `src/pages/Dashboard.tsx` - Remove TimeControls, simplify
- `src/pages/Schedule.tsx` - Remove TimeControls
- `src/pages/Tournament.tsx` - Remove simulation buttons
- `src/components/calendar/TodayActivities.tsx` - Remove match click handler
- `src/components/calendar/DayDetailPanel.tsx` - Remove simulate button

**Tournament Integration**:
Tournament matches will work identically to league matches:
1. Scheduled on calendar for specific date
2. When date arrives, appears in "Today's Activities"
3. User advances day via TimeBar → match simulates
4. Bracket auto-updates via existing `advanceTournament()` flow

### 20. Zustand State Freshness After Store Updates

**Problem**: When calling `useGameStore.getState()` and then performing store updates, the captured state snapshot becomes stale. Subsequent reads from that snapshot return OLD data.

**Anti-Pattern (WRONG)**:
```typescript
const state = useGameStore.getState();

// Update store
state.updateSomething(id, newValue);

// BUG: This reads from stale snapshot, not the updated store!
const updated = state.entities[id];  // Returns OLD value
```

**Correct Pattern**:
```typescript
const state = useGameStore.getState();

// Update store
state.updateSomething(id, newValue);

// Get fresh state after update
const freshState = useGameStore.getState();
const updated = freshState.entities[id];  // Returns NEW value
```

**Rule**: After any store update action, if you need to read the updated data:
1. Call `useGameStore.getState()` again to get fresh state
2. Never rely on the captured `state` variable after modifications
3. Alternatively, have the update action return the new value directly

**Bracket Mutation Warning**: When modifying bracket match properties (like `scheduledDate`), never mutate objects that are stored in the Zustand store. Always deep clone first:

```typescript
// WRONG - mutates store state directly
tournamentFromStore.bracket.upper[0].matches[0].scheduledDate = newDate;

// CORRECT - clone first, then mutate clone
const clonedBracket = JSON.parse(JSON.stringify(tournament.bracket));
clonedBracket.upper[0].matches[0].scheduledDate = newDate;
state.updateBracket(tournamentId, clonedBracket);
```

This ensures React detects changes properly and prevents inconsistent state.

### 21. Regional Tournament Simulation on Kickoff Completion

When the player's regional Kickoff tournament completes, the `QualificationModal` appears showing the 3 qualified teams. The other 3 regional Kickoffs must also be simulated to populate Masters tournament with all 12 qualified teams.

**Critical Requirement**: Other regions MUST be simulated regardless of how the user interacts with the modal.

**Implementation (`QualificationModal.tsx`)**:
- Uses `simulationTriggeredRef` to track if simulation has been triggered (prevents double-calling)
- `ensureOtherRegionsSimulatedSync()` - Synchronous function that calls `regionalSimulationService.simulateOtherKickoffs()`
- All close paths trigger simulation:
  - "Continue" button → `handleContinue()` → simulates then closes
  - "See All Qualifiers" button → simulates and shows all regions
  - Escape key → `handleClose()` → simulates then closes
  - Backdrop click → `handleClose()` → simulates then closes

**Flow**:
```
Player's Kickoff completes
    ↓
QualificationModal opens (shows player region only)
    ↓
User closes modal (any method)
    ↓
ensureOtherRegionsSimulatedSync() called
    ↓
RegionalSimulationService.simulateOtherKickoffs() runs
    ↓
3 other regional Kickoffs simulated and qualifications saved
    ↓
Modal closes, game state has all 12 qualifications
```

**Why This Matters**: The Masters tournament creation (`createMastersTournament()`) requires all 4 regional qualifications to exist. If the user closed the modal without triggering simulation, Masters would fail to create properly.

**Critical Update (2026-01-22)**: All modal exit paths (Continue button, Escape key, backdrop click) now call `createMastersTournament()` after simulating other regions. This ensures the phase transitions to 'masters1' and the Masters tournament appears in the calendar regardless of how the user closes the modal. The `createMastersTournament()` function is now idempotent to prevent duplicate tournament creation.

### 22. Generic Tournament Transition System (IMPLEMENTED)

**Status**: Implemented - All tournament phase transitions use a generic configuration-based system.

**Architecture Pattern**:
```
Tournament Transition Configuration (tournament-transitions.ts)
    ↓
TournamentTransitionService.executeTransition(configId)
    ↓
Regional Transition OR International Transition
    ↓
Tournament Created + Phase Updated + Calendar Events Added
```

**Configuration-Driven Design**:

All 7 VCT 2026 phase transitions are defined in `TOURNAMENT_TRANSITIONS`:

1. **Kickoff → Masters Santiago** (`kickoff_to_masters1`)
   - Type: `playoff_to_international`
   - Qualification: Alpha (winners), Beta (2nd), Omega (3rd) from each region
   - Format: Swiss-to-Playoff (8 Swiss + 4 direct)

2. **Masters Santiago → Stage 1** (`masters1_to_stage1`)
   - Type: `international_to_league`
   - No tournament creation (league matches pre-generated at game init)
   - Just phase transition from `masters1` → `stage1`

3. **Stage 1 → Stage 1 Playoffs** (`stage1_to_stage1_playoffs`)
   - Type: `regional_to_playoff`
   - Qualification: Top 8 teams from Stage 1 league standings
   - Format: Double elimination

4. **Stage 1 Playoffs → Masters London** (`stage1_playoffs_to_masters2`)
   - Type: `playoff_to_international`
   - Qualification: Winners, runners-up, third place from each regional playoff
   - Format: Swiss-to-Playoff (8 Swiss + 4 direct)

5. **Masters London → Stage 2** (`masters2_to_stage2`)
   - Type: `international_to_league`
   - No tournament creation (league matches pre-generated at game init)
   - Just phase transition from `masters2` → `stage2`

6. **Stage 2 → Stage 2 Playoffs** (`stage2_to_stage2_playoffs`)
   - Type: `regional_to_playoff`
   - Qualification: Top 8 teams from Stage 2 league standings
   - Format: Double elimination

7. **Stage 2 Playoffs → Champions Shanghai** (`stage2_playoffs_to_champions`)
   - Type: `playoff_to_international`
   - Qualification: Winners, runners-up, top 2 third-place teams
   - Format: Swiss-to-Playoff (12 Swiss + 4 direct)

**Key Service Methods**:

```typescript
// Main entry point - handles all transitions
tournamentTransitionService.executeTransition(configId, playerRegion?)

// Regional transitions (League → Playoffs)
executeRegionalPlayoffTransition(config, region)
  → Get top N teams from standings
  → Create regional playoff tournament
  → Schedule matches and add events

// International transitions (Playoffs → Masters/Champions)
executeInternationalTransition(config, playerRegion?)
  → Get qualifications from all 4 regions
  → Extract qualified teams (Swiss vs direct playoff)
  → Create international tournament
  → Schedule Swiss Round 1

// League transitions (Masters → Stage)
executeLeagueTransition(config)
  → Just update phase (no tournament creation)
  → League matches already pre-generated at game init
```

**Idempotency**:
- Checks if tournament already exists before creating
- Safe to call multiple times without duplicates
- Updates phase if tournament exists but phase is wrong

**Integration Points**:
- `QualificationModal` calls `executeTransition()` with `transitionConfigId` prop
- `RegionalSimulationService.createMastersTournament()` delegates to transition service
- All tournament creation flows use the same generic service

**Benefits**:
1. **Single Source of Truth**: All transition rules in one configuration file
2. **No Code Duplication**: Same service handles all 5 transitions
3. **Easy to Extend**: New tournaments only need configuration, not new code
4. **Type Safety**: TypeScript enforces correct configuration structure
5. **Maintainability**: Changes to transition logic apply to all tournaments

**Example - Adding a New Tournament**:
```typescript
// Just add to tournament-transitions.ts:
masters_bangkok_2027: {
  id: 'stage2_playoffs_to_masters_bangkok',
  fromPhase: 'stage2_playoffs',
  toPhase: 'masters_bangkok',
  type: 'playoff_to_international',
  tournamentName: 'VCT Masters Bangkok 2027',
  // ... qualification rules
}

// Then call:
tournamentTransitionService.executeTransition('stage2_playoffs_to_masters_bangkok');
// No new service code needed!
```

## Session End Checklist

Before ending each AI coding session:

```
Please create a session summary:

1. What we built today
2. Files created/modified
3. What's working
4. Known issues
5. Next steps

Save to: docs/session-logs/[DATE]-[Feature].md
