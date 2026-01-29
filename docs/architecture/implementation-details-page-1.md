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

### GlobalTournamentScheduler

Creates ALL VCT tournaments at game initialization using the **upfront creation, lazy resolution** pattern.

```typescript
class GlobalTournamentScheduler {
  private regions: Region[] = ['Americas', 'EMEA', 'Pacific', 'China'];

  /**
   * Create ALL VCT tournaments for the season
   * Called once during GameInitService.initializeGame()
   */
  createAllTournaments(
    teams: Team[],
    seasonStartDate: string
  ): TournamentScheduleResult {
    // 1. Create 4 regional Kickoffs (teams known from region)
    const kickoffs = this.regions.map(region =>
      this.createKickoff(region, teams, startDate)
    );

    // 2. Create Masters 1 (Santiago) with TBD slots
    const masters1 = this.createMasters('masters1', 'VCT Masters Santiago 2026', ...);

    // 3. Create 4 regional Stage 1 leagues (teams known)
    const stage1s = this.regions.map(region =>
      this.createStageLeague(region, 'stage1', teams, ...)
    );

    // 4. Create 4 regional Stage 1 Playoffs with TBD slots
    const stage1Playoffs = this.regions.map(region =>
      this.createStagePlayoffs(region, 'stage1', ...)
    );

    // 5-8. Repeat for Masters 2, Stage 2, Stage 2 Playoffs, Champions
    // ...

    return { kickoffs, masters1, stage1s, stage1Playoffs, ... };
  }

  /**
   * Create Masters tournament with TBD slots for qualifiers
   */
  private createMasters(type: string, name: string, ...): MultiStageTournament {
    // Swiss participants have TBD slots
    const swissTeamSlots: TeamSlot[] = [
      { type: 'qualified_from', source: { tournamentType: 'kickoff', region: 'Americas', placement: 'beta' }, description: 'Americas Kickoff 2nd' },
      { type: 'qualified_from', source: { tournamentType: 'kickoff', region: 'Americas', placement: 'omega' }, description: 'Americas Kickoff 3rd' },
      // ... 6 more from other regions
    ];

    // Direct playoff qualifiers (Kickoff winners)
    const playoffTeamSlots: TeamSlot[] = [
      { type: 'qualified_from', source: { tournamentType: 'kickoff', region: 'Americas', placement: 'alpha' }, description: 'Americas Kickoff Winner' },
      // ... 3 more
    ];

    return tournamentEngine.createMastersWithSlots(name, swissTeamSlots, playoffTeamSlots, ...);
  }
}
export const globalTournamentScheduler = new GlobalTournamentScheduler();
```

**Key Design Points**:
- All tournament structures created at game init with fixed dates
- Kickoffs and Stage leagues have resolved teams (known from region)
- Masters, Stage Playoffs, and Champions use `TeamSlot` with `qualified_from` type
- Teams are resolved when they qualify via `TeamSlotResolver`

### TeamSlotResolver

Resolves TBD slots when teams qualify from previous tournaments.

```typescript
class TeamSlotResolver {
  /**
   * Called when a tournament completes
   * Resolves qualifiers into downstream tournament slots
   */
  resolveQualifications(completedTournamentId: string): void {
    const completed = state.tournaments[completedTournamentId];

    // 1. Extract qualifiers based on tournament type
    const qualifiers = this.extractQualifiers(completed);
    // → e.g., [{ teamId: 'sen', placement: 'alpha', source: { ... } }, ...]

    // 2. Find downstream tournaments with TBD slots
    const downstreamIds = this.findDownstreamTournaments(completed);
    // → e.g., ['masters-santiago-2026'] for Kickoff completion

    // 3. Fill team slots in downstream tournaments
    for (const tournamentId of downstreamIds) {
      this.fillTeamSlots(tournamentId, qualifiers, completed);
    }
  }

  /**
   * Extract qualifiers from completed tournament
   */
  private extractQualifiers(tournament: Tournament): QualifiedTeam[] {
    switch (tournament.type) {
      case 'kickoff':
        // Extract alpha (1st), beta (2nd), omega (3rd) from triple-elim bracket
        return bracketManager.getQualifiers(tournament.bracket);

      case 'stage1':
      case 'stage2':
        // Top 8 teams from league standings
        return tournament.standings
          .sort((a, b) => b.wins - a.wins || a.losses - b.losses || b.roundDiff - a.roundDiff)
          .slice(0, 8)
          .map((entry, i) => ({ teamId: entry.teamId, placement: i + 1, ... }));

      case 'masters':
        // 1st, 2nd, 3rd from playoff bracket
        return bracketManager.getFinalPlacements(tournament.bracket);
    }
  }

  /**
   * Fill TBD slots in a downstream tournament
   */
  private fillTeamSlots(
    tournamentId: string,
    qualifiers: QualifiedTeam[],
    sourceTournament: Tournament
  ): void {
    const tournament = state.tournaments[tournamentId];

    // Match qualifiers to TeamSlots by source
    for (const qualifier of qualifiers) {
      const slot = tournament.teamSlots?.find(s =>
        s.type === 'qualified_from' &&
        s.source.tournamentType === sourceTournament.type &&
        s.source.region === sourceTournament.region &&
        s.source.placement === qualifier.placement
      );

      if (slot) {
        // Resolve slot
        slot.type = 'resolved';
        slot.teamId = qualifier.teamId;

        // Add team to tournament
        tournament.teamIds.push(qualifier.teamId);
      }
    }

    // Update bracket with resolved teams
    this.updateBracketWithResolvedTeams(tournament);

    // Schedule newly-ready matches
    tournamentService.scheduleNewlyReadyMatches(tournament);
    tournamentService.createMatchEntitiesForReadyBracketMatches(tournament);
  }
}
export const teamSlotResolver = new TeamSlotResolver();
```

**Integration Points**:
- `TournamentService.handleTournamentCompletion()` → calls `teamSlotResolver.resolveQualifications()`
- `CalendarService.checkAllTournamentCompletion()` → handles all regions' tournament completions
- `MatchService.updateTournamentStandings()` → updates per-tournament standings for league formats

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

