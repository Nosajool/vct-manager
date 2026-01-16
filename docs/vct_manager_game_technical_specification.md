# VCT Manager Game - Technical Specification

## Project Overview
Browser-based Valorant Champions Tour (VCT) management simulation game. Single-page React application with no backend - all state managed client-side with persistent storage.

---

## Core Architecture

### Technology Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Persistence**: IndexedDB via Dexie.js
- **Styling**: Tailwind CSS + CSS Modules
- **Testing**: Vitest + React Testing Library

### Architectural Principles
1. **Separation of Concerns**: Engine (logic) → Services (orchestration) → Store (state) → UI (presentation)
2. **Immutable State**: All state updates return new objects
3. **Normalized Data**: Entities stored by ID, relationships via ID references
4. **Pure Functions**: Engine classes have no side effects
5. **Single Source of Truth**: Zustand store is the only state container

### Directory Structure
```
src/
├── engine/              # Pure game logic (no React dependencies)
│   ├── match/
│   │   ├── MatchSimulator.ts    # Probabilistic match simulation
│   │   ├── constants.ts         # Shared constants (STAT_WEIGHTS, MAX_CHEMISTRY_BONUS)
│   │   └── index.ts
│   ├── competition/
│   │   ├── BracketManager.ts    # Bracket generation and advancement
│   │   ├── TournamentEngine.ts  # Tournament creation and configuration
│   │   ├── ScheduleGenerator.ts # VCT season schedule generation
│   │   ├── SeasonManager.ts     # Season progression logic
│   │   └── index.ts
│   ├── player/
│   │   ├── PlayerGenerator.ts   # Procedural player generation
│   │   ├── PlayerDevelopment.ts # Training and stat improvement
│   │   ├── ContractNegotiator.ts # Contract negotiation logic
│   │   ├── vlr/                 # VLR.gg integration module
│   │   │   ├── orgMapping.ts        # VLR org codes → game team names
│   │   │   ├── statConverter.ts     # VLR stats → game PlayerStats
│   │   │   ├── vlrTeamIds.ts        # VLR team page IDs for scraping
│   │   │   ├── VlrDataProcessor.ts  # Raw VLR → Player entities
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── team/
│   │   ├── TeamManager.ts       # Team generation
│   │   ├── EconomyEngine.ts     # Financial calculations
│   │   ├── ChemistryCalculator.ts # Chemistry calculations
│   │   └── index.ts
│   ├── calendar/
│   │   ├── TimeProgression.ts   # Date helpers and event processing
│   │   ├── EventScheduler.ts    # Season and event scheduling
│   │   └── index.ts
│   └── scrim/                   # Scrim system (Phase 6)
│       ├── ScrimEngine.ts       # Scrim simulation and improvements
│       ├── TierTeamGenerator.ts # T2/T3 team generation
│       └── index.ts
│
├── store/               # Zustand state management
│   ├── index.ts         # Root store with save/load API
│   ├── slices/
│   │   ├── gameSlice.ts        # Calendar, season, phase
│   │   ├── teamSlice.ts        # Teams (normalized by ID)
│   │   ├── playerSlice.ts      # Players (normalized by ID)
│   │   ├── competitionSlice.ts # Tournaments and standings
│   │   ├── matchSlice.ts       # Matches and results
│   │   ├── scrimSlice.ts       # Tier teams and scrim history
│   │   ├── uiSlice.ts          # UI state
│   │   └── index.ts
│   └── middleware/
│       ├── persistence.ts      # Auto-save and SaveManager
│       └── index.ts
│
├── services/            # Orchestration layer (store + engine)
│   ├── GameInitService.ts      # Game initialization (with VLR integration)
│   ├── MatchService.ts         # Match simulation orchestration
│   ├── TournamentService.ts    # Tournament lifecycle
│   ├── ContractService.ts      # Player signing/release
│   ├── TrainingService.ts      # Training orchestration
│   ├── CalendarService.ts      # Time progression orchestration
│   ├── EconomyService.ts       # Financial operations
│   ├── ScrimService.ts         # Scrim orchestration
│   └── index.ts
│
├── db/                  # IndexedDB configuration
│   ├── schema.ts        # Save slot types
│   ├── database.ts      # Dexie database class
│   └── index.ts
│
├── data/                # Static data snapshots
│   └── vlrSnapshot.ts   # VLR player stats & team rosters (cached)
│
├── types/               # TypeScript type definitions
│   ├── player.ts        # Player, PlayerStats, Coach
│   ├── team.ts          # Team, TeamFinances, Transaction, Loan
│   ├── match.ts         # Match, MatchResult, MapResult
│   ├── competition.ts   # Tournament, BracketStructure, BracketMatch
│   ├── calendar.ts      # GameCalendar, CalendarEvent, SeasonPhase
│   ├── economy.ts       # TrainingSession, TrainingResult, Difficulty
│   ├── scrim.ts         # MapPoolStrength, ScrimRelationship, TierTeam
│   ├── vlr.ts           # VLR API response types
│   └── index.ts
│
├── components/          # React UI components
│   ├── layout/          # Header, Navigation, Layout
│   ├── roster/          # PlayerCard, RosterList, FreeAgentList, ContractNegotiationModal, AllTeamsView
│   ├── calendar/        # CalendarView, MonthCalendar, DayDetailPanel, TimeControls, TrainingModal, SimulationResultsModal
│   ├── match/           # MatchCard, MatchResult, Scoreboard, PlayerStatsTable
│   ├── tournament/      # BracketView, BracketMatch, TournamentCard, StandingsTable
│   ├── scrim/           # ScrimModal, MapPoolView, RelationshipView
│   └── shared/          # SaveLoadModal
│
├── pages/               # Top-level route components
│   ├── Dashboard.tsx    # Main hub with calendar and activities
│   ├── Roster.tsx       # Roster and free agent management (My Team, Free Agents, All Teams tabs)
│   ├── Schedule.tsx     # Match schedule and results
│   ├── Tournament.tsx   # Tournament brackets and simulation
│   ├── Finances.tsx     # Financial management
│   └── index.ts
│
├── utils/
│   └── constants.ts     # Names, nationalities, team templates
│
└── App.tsx              # Main app with view routing

scripts/
└── fetch-vlr-data.ts    # CLI script to fetch/scrape VLR data
```

---

## Core Type Definitions

### Player System
```typescript
export interface PlayerStats {
  mechanics: number;      // 0-100: Aim and gunplay ability
  igl: number;           // 0-100: In-game leadership and strategy
  mental: number;        // 0-100: Composure when playing from behind
  clutch: number;        // 0-100: Performance in 1vX situations
  vibes: number;         // 0-100: Team morale contribution
  lurking: number;       // 0-100: Solo play and flanking
  entry: number;         // 0-100: First contact aggression
  support: number;       // 0-100: Utility usage and teamplay
  stamina: number;       // 0-100: Consistency across long matches
}

export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  region: 'Americas' | 'EMEA' | 'Pacific' | 'China';
  
  // Current team
  teamId: string | null;
  
  // Stats and performance
  stats: PlayerStats;
  form: number;           // 0-100: Recent performance
  morale: number;         // 0-100: Current morale
  potential: number;      // 0-100: Growth ceiling
  
  // Contract details
  contract: {
    salary: number;
    bonusPerWin: number;
    yearsRemaining: number;
    endDate: Date;
  } | null;
  
  // Career stats
  careerStats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    tournamentsWon: number;
  };
  
  // Preferences (for AI negotiations)
  preferences: {
    salaryImportance: number;      // 0-100
    teamQualityImportance: number; // 0-100
    regionLoyalty: number;         // 0-100
    preferredTeammates: string[];  // Player IDs
  };
}

export interface Coach {
  id: string;
  name: string;
  type: 'Head Coach' | 'Assistant Coach' | 'Performance Coach';
  statBoosts: Partial<PlayerStats>;
  salary: number;
  contract: {
    yearsRemaining: number;
    endDate: Date;
  };
}
```

### Team System
```typescript
export interface Team {
  id: string;
  name: string;
  region: 'Americas' | 'EMEA' | 'Pacific' | 'China';
  
  // Roster
  playerIds: string[];        // Active roster (5 players)
  reservePlayerIds: string[]; // Reserve roster
  coachIds: string[];
  
  // Organization strength
  organizationValue: number;  // Starting wealth
  fanbase: number;           // Affects sponsorships
  
  // Chemistry
  chemistry: {
    overall: number;
    pairs: Record<string, Record<string, number>>; // playerId -> playerId -> score
  };
  
  // Finances
  finances: TeamFinances;
  
  // Performance
  standings: {
    wins: number;
    losses: number;
    roundDiff: number;
    currentStreak: number;
  };
}

export interface TeamFinances {
  balance: number;
  
  // Recurring monthly income
  monthlyRevenue: {
    sponsorships: number;
    merchandise: number;
    prizeWinnings: number;
    fanDonations: number;
  };
  
  // Recurring monthly expenses
  monthlyExpenses: {
    playerSalaries: number;
    coachSalaries: number;
    facilities: number;
    travel: number;
  };
  
  // One-time transactions
  pendingTransactions: Transaction[];
  
  // Debt management
  loans: Loan[];
}

export interface Transaction {
  id: string;
  type: 'signing_bonus' | 'transfer_fee' | 'prize' | 'sponsorship_deal' | 'loan_payment';
  amount: number;
  date: Date;
  description: string;
}

export interface Loan {
  id: string;
  principal: number;
  interestRate: number;
  monthlyPayment: number;
  remainingMonths: number;
}
```

### Training System
```typescript
export type TrainingFocus = 'mechanics' | 'igl' | 'mental' | 'clutch' | 
                            'lurking' | 'entry' | 'support' | 'agents' | 'balanced';

export interface TrainingSession {
  playerId: string;
  focus: TrainingFocus;
  coachId?: string;       // Optional coach boost
  intensity: 'light' | 'moderate' | 'intense';
  date: Date;
}

export interface TrainingResult {
  playerId: string;
  focus: TrainingFocus;
  statImprovements: Partial<PlayerStats>;
  effectiveness: number;    // 0-100: How effective was training
  moraleChange: number;
  fatigueIncrease: number;
  
  // Factors that affected effectiveness
  factors: {
    coachBonus: number;
    playerMorale: number;
    playerAge: number;
    playerPotential: number;
  };
}

// Players can only train a limited amount before fatigue impacts performance
export interface PlayerFatigue {
  playerId: string;
  currentFatigue: number;  // 0-100 (100 = exhausted)
  weeklyTrainingSessions: number;
  maxWeeklyTraining: number; // Based on stamina stat
}
```

### Competition System
```typescript
export type CompetitionType = 'kickoff' | 'stage1' | 'stage2' | 'masters' | 'champions';
export type TournamentFormat = 'single_elim' | 'double_elim' | 'triple_elim' | 'round_robin';

export interface Tournament {
  id: string;
  name: string;
  type: CompetitionType;
  format: TournamentFormat;
  region: 'Americas' | 'EMEA' | 'Pacific' | 'China' | 'International';
  
  // Participating teams
  teamIds: string[];
  
  // Schedule
  startDate: Date;
  endDate: Date;
  
  // Prize pool
  prizePool: {
    first: number;
    second: number;
    third: number;
    // ... other placements
  };
  
  // Bracket structure
  bracket: BracketStructure;
  
  // Status
  status: 'upcoming' | 'in_progress' | 'completed';
  championId?: string;
}

export interface BracketStructure {
  upper: BracketRound[];
  middle?: BracketRound[];  // Triple elimination
  lower?: BracketRound[];   // Double/Triple elimination
  grandfinal?: BracketMatch;
}

export interface BracketRound {
  roundId: string;
  roundNumber: number;
  bracketType: 'upper' | 'middle' | 'lower';
  matches: BracketMatch[];
}

export interface BracketMatch {
  matchId: string;
  roundId: string;
  
  // Team sources
  teamASource: TeamSource;
  teamBSource: TeamSource;
  
  // Resolved teams
  teamAId?: string;
  teamBId?: string;
  
  // Status
  status: 'pending' | 'ready' | 'in_progress' | 'completed';
  
  // Result
  winnerId?: string;
  loserId?: string;
  result?: MatchResult;
  
  // Destinations
  winnerDestination: Destination;
  loserDestination: Destination;
  
  // Scheduling
  scheduledDate?: Date;
}

export type TeamSource = 
  | { type: 'seed'; seed: number }
  | { type: 'winner'; matchId: string }
  | { type: 'loser'; matchId: string }
  | { type: 'bye' };

export type Destination = 
  | { type: 'match'; matchId: string }
  | { type: 'eliminated' }
  | { type: 'champion' }
  | { type: 'placement'; place: number };
```

### Match System
```typescript
export interface Match {
  id: string;
  tournamentId?: string;  // null for regular season
  teamAId: string;
  teamBId: string;
  scheduledDate: Date;
  status: 'scheduled' | 'in_progress' | 'completed';
  
  // Result
  result?: MatchResult;
}

export interface MatchResult {
  matchId: string;
  winnerId: string;
  loserId: string;
  
  // Map results
  maps: MapResult[];
  
  // Overall score
  scoreTeamA: number;  // Maps won
  scoreTeamB: number;
  
  // Duration
  duration: number;  // minutes
}

export interface MapResult {
  map: string;
  teamAScore: number;    // Rounds won
  teamBScore: number;
  winner: 'teamA' | 'teamB';
  
  // Player performances
  teamAPerformances: PlayerMapPerformance[];
  teamBPerformances: PlayerMapPerformance[];
  
  // Map stats
  totalRounds: number;
  overtime: boolean;
  overtimeRounds?: number;
  
  // Future: Round-by-round details
  rounds?: RoundInfo[];
}

export interface PlayerMapPerformance {
  playerId: string;
  playerName: string;
  agent: string;
  
  // Core stats
  kills: number;
  deaths: number;
  assists: number;
  
  // Advanced stats (Phase 1 - simplified)
  acs: number;
  kd: number;
  
  // Future phases
  firstKills?: number;
  clutchesWon?: number;
  plants?: number;
  defuses?: number;
}
```

### Calendar System
```typescript
// Note: All dates are stored as ISO strings (YYYY-MM-DD) for serialization
export interface GameCalendar {
  currentDate: string;      // ISO date string
  currentSeason: number;
  currentPhase: SeasonPhase;
  lastSaveDate: string;     // For auto-save tracking

  // Event queue (pre-scheduled)
  scheduledEvents: CalendarEvent[];
}

export type SeasonPhase = 'offseason' | 'kickoff' | 'stage1' | 'stage2' |
                          'masters1' | 'masters2' | 'champions';

export interface CalendarEvent {
  id: string;
  date: string;           // ISO date string
  type: CalendarEventType;
  data: any;              // Event-specific data
  processed: boolean;
}

export type CalendarEventType =
  | 'match'
  | 'tournament_start'
  | 'tournament_end'
  | 'tournament_match'      // Individual tournament bracket matches
  | 'transfer_window_open'
  | 'transfer_window_close'
  | 'salary_payment'
  | 'sponsorship_renewal'
  | 'training_available'    // Days when training is possible
  | 'scrim_available'       // Days when scrims are possible
  | 'season_end';
```

### Scrim System (Phase 6)
```typescript
export type TeamTier = 'T1' | 'T2' | 'T3';

// T2/T3 teams for scrim partners
export interface TierTeam {
  id: string;
  name: string;
  tier: TeamTier;
  region: Region;
  playerIds: string[];
  avgOverall: number;
}

// Relationship with scrim partner
export interface ScrimRelationship {
  teamId: string;
  tier: TeamTier;
  relationshipScore: number;  // 0-100
  vodLeakRisk: number;        // 0-100
  totalScrims: number;
  lastScrimDate: string | null;
}

// Map strength attributes (6 dimensions)
export interface MapStrengthAttributes {
  executes: number;       // Site takes and set plays
  retakes: number;        // Defensive recovery
  utility: number;        // Smoke lineups, molly spots
  communication: number;  // Callouts, coordination
  mapControl: number;     // Mid control, lurks
  antiStrat: number;      // Counter-strategies
}

export interface MapStrength {
  mapName: string;
  attributes: MapStrengthAttributes;
  lastPracticed: string | null;
}

export interface MapPoolStrength {
  maps: Record<string, MapStrength>;  // mapName -> strength
}

export const SCRIM_CONSTANTS = {
  MAX_WEEKLY_SCRIMS: 4,
  TIER_EFFICIENCY: { T1: 1.0, T2: 0.7, T3: 0.4 },
  BASE_RELATIONSHIP: { SAME_REGION: 50, CROSS_REGION: 20 },
  MAP_DECAY_RATE: 0.02,       // 2% per week
  MAX_MAP_ATTRIBUTE: 85,
  MAX_MAP_BONUS: 0.15,        // 15% bonus in matches
};
```

### VLR Integration System
```typescript
// VLR API response types
export interface VlrPlayer {
  player: string;      // IGN
  org: string;         // Team abbreviation
  agents: string;      // Most-played agents
  rounds_played: number;
  rating: string;      // e.g., "1.15"
  acs: string;         // Average Combat Score
  kd: string;          // K/D ratio
  kast: string;        // Kill/Assist/Survive/Trade %
  adr: string;         // Average Damage per Round
  kpr: string;         // Kills per Round
  apr: string;         // Assists per Round
  fkpr: string;        // First Kills per Round
  fdpr: string;        // First Deaths per Round
  hs: string;          // Headshot %
  cl: string;          // Clutch %
}

export interface VlrTeamRoster {
  teamName: string;
  vlrTeamId: number;
  players: string[];   // IGNs of starting 5
  scrapedAt: string;   // ISO date
}

export type VlrRosterData = Record<string, VlrTeamRoster>;

// Processed VLR data types (intermediate format)
export interface ProcessedVlrPlayer {
  name: string;
  teamName: string | null;  // Resolved game team name
  region: Region;
  vlrRating: number;
  vlrStats: VlrPlayer;
}

export interface ProcessedVlrData {
  matchedPlayers: Map<string, ProcessedVlrPlayer[]>;  // teamName → players
  unmatchedPlayers: ProcessedVlrPlayer[];             // Free agents
  totalProcessed: number;
}
```

---

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
```typescript
class BracketManager {
  /**
   * Generate a triple elimination bracket
   */
  generateTripleElimination(teamIds: string[]): BracketStructure {
    // Create upper, middle, lower brackets with proper routing
  }
  
  /**
   * Update bracket after match completion (immutable)
   */
  completeMatch(
    bracket: BracketStructure,
    matchId: string,
    winnerId: string,
    result: MatchResult
  ): BracketStructure {
    // Find match, update it, propagate winner/loser to next matches
    // Return new bracket structure
  }
  
  /**
   * Get all matches that are ready to play
   */
  getReadyMatches(bracket: BracketStructure): BracketMatch[] {
    // Return matches where both teams are known
  }
}
```

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

## Git & Deployment Strategy

### Version Control Setup
```bash
# Initialize Git
git init
git add .
git commit -m "Initial commit: Project setup"

# Create branches
git branch develop
git checkout develop
```

### Branch Strategy
- **main**: Production-ready code (auto-deploys to GitHub Pages)
- **develop**: Integration branch for features
- **feature/**: Feature branches (e.g., feature/roster-management)

### Commit Convention
Use Conventional Commits format:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructure
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance

### GitHub Pages Deployment

**Vite Configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: '/vct-manager/', // Replace with your repo name
})
```

**Auto-Deploy with GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm test
    - run: npm run build
    - uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

**Deployment URL:** `https://yourusername.github.io/vct-manager/`

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
- [x] Time controls (Advance Day/Week/Jump to Match)
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
  const tournament = useGameStore(state => 
    state.entities.tournaments[tournamentId]
  );
  
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

### 4. VCT Season Structure

Implemented authentic VCT calendar with distinct phases:

| Phase | Days | Type |
|-------|------|------|
| Kickoff | 0-28 | Tournament (Triple Elim) |
| Stage 1 | 35-91 | League |
| Masters 1 | 98-112 | Tournament |
| Stage 2 | 119-175 | League |
| Masters 2 | 182-196 | Tournament |
| Champions | 245-266 | Tournament |
| Offseason | 273+ | No matches |

League matches are only scheduled during Stage 1 and Stage 2 phases.

### 5. Triple Elimination (VCT Kickoff)

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

**Match Completion Flow:**
1. Match simulated → result recorded
2. `advanceTournament()` updates bracket (propagates winner/loser to next matches)
3. `createMatchEntitiesForReadyBracketMatches()` creates Match entities for newly-ready matches
4. `scheduleNewlyReadyMatches()` assigns dates and creates calendar events for newly-ready matches

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
| `advanceWeek()` | Simulate 7 days (today + 6) → Advance to day 8 |
| `advanceToNextMatch()` | Simulate days BEFORE match → Land at START of match day (no sim) |

**Player Team Filtering:**

All match-related UI only shows the player's team's matches:
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
- Can curate/validate data before committing
- Simple cache invalidation (just re-run `npm run fetch-vlr`)

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
│  [Advance Day]  [Advance Week]  [Jump to Match]                    │
└────────────────────────────────────────────────────────────────────┘
```

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
```Save to: docs/session-logs/[DATE]-[Feature].md
Please create a session summary:
