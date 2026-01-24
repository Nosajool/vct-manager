# VCT Manager Game - Core Architecture

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
│   ├── GameInitService.ts              # Game initialization (with VLR integration)
│   ├── MatchService.ts                 # Match simulation orchestration
│   ├── TournamentService.ts            # Tournament lifecycle
│   ├── TournamentTransitionService.ts  # Generic phase transition logic
│   ├── RegionalSimulationService.ts    # Regional tournament simulation
│   ├── ContractService.ts              # Player signing/release
│   ├── TrainingService.ts              # Training orchestration
│   ├── CalendarService.ts              # Time progression orchestration
│   ├── EconomyService.ts               # Financial operations
│   ├── ScrimService.ts                 # Scrim orchestration
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
│   ├── tournament-transition.ts # Tournament transition configuration types
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
│   ├── constants.ts              # Names, nationalities, team templates
│   └── tournament-transitions.ts # Tournament transition configurations
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
export type TournamentFormat = 'single_elim' | 'double_elim' | 'triple_elim' | 'round_robin' | 'swiss_to_playoff';

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

// Swiss-to-Playoff tournament (for Masters events)
export interface MultiStageTournament extends Tournament {
  format: 'swiss_to_playoff';
  swissStage: SwissStage;
  playoffBracket?: BracketStructure;
  currentStage: 'swiss' | 'playoff';
  swissTeamIds: string[];       // 8 teams in Swiss (2nd+3rd from each region)
  playoffOnlyTeamIds: string[]; // 4 Kickoff winners (join at playoffs)
}

export interface SwissStage {
  rounds: SwissRound[];
  standings: SwissTeamRecord[];
  qualifiedTeamIds: string[];
  eliminatedTeamIds: string[];
  currentRound: number;
  totalRounds: number;          // 3 for Masters
  winsToQualify: number;        // 2 for Masters
  lossesToEliminate: number;    // 2 for Masters
}

export interface SwissTeamRecord {
  teamId: string;
  wins: number;
  losses: number;
  roundDiff: number;        // Maps won - maps lost (tiebreaker)
  opponentIds: string[];    // Track for no-repeat matchups
  status: 'active' | 'qualified' | 'eliminated';
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

export type SeasonPhase = 'offseason' | 'kickoff' | 'stage1' | 'stage1_playoffs' |
                          'stage2' | 'stage2_playoffs' | 'masters1' | 'masters2' | 'champions';

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

### Tournament Transition System
```typescript
/**
 * Type of transition between phases
 */
export type TransitionType = 'regional_to_playoff' | 'playoff_to_international';

/**
 * Source of qualification data
 */
export type QualificationSource =
  | 'kickoff'
  | 'stage1'
  | 'stage1_playoffs'
  | 'stage2'
  | 'stage2_playoffs';

/**
 * Configuration for a tournament transition
 * Defines how to create the next tournament when a phase completes
 */
export interface TournamentTransitionConfig {
  // Phase identification
  id: string; // Unique ID (e.g., 'kickoff_to_masters1')
  fromPhase: SeasonPhase; // Phase that just completed
  toPhase: SeasonPhase; // Phase to transition to

  // Transition metadata
  type: TransitionType;
  qualificationSource: QualificationSource;

  // Tournament creation
  tournamentName: string;
  format: TournamentFormat;
  region: TournamentRegion;
  prizePool: number;

  // Qualification rules
  qualificationRules: QualificationRules;

  // Timing
  daysUntilStart: number;
  durationDays: number;
}

/**
 * Rules for determining which teams qualify
 */
export interface QualificationRules {
  // For regional_to_playoff
  teamsPerRegion?: number; // Top N teams from standings

  // For playoff_to_international
  teamsFromKickoff?: {
    alpha: number; // Kickoff winners (1st place)
    beta: number;  // 2nd place
    omega: number; // 3rd place
  };
  teamsFromPlayoffs?: {
    winners: number;    // Playoff champions
    runnersUp: number;  // 2nd place
    thirdPlace: number; // 3rd place
  };

  // Swiss-to-Playoff configuration
  swissStageTeams?: number;    // Teams in Swiss stage
  directPlayoffTeams?: number; // Teams that skip Swiss
}

/**
 * Result of executing a tournament transition
 */
export interface TransitionResult {
  success: boolean;
  tournamentId?: string;
  tournamentName?: string;
  newPhase?: SeasonPhase;
  error?: string;
  qualifiedTeams?: Array<{
    teamId: string;
    teamName: string;
    region: string;
    seed: number;
  }>;
}
