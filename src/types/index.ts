// Core type definitions for VCT Manager
// Re-export all types from individual modules

// Player types
export type {
  PlayerStats,
  PlayerContract,
  PlayerCareerStats,
  PlayerPreferences,
  Player,
  Coach,
  CoachType,
  Region,
} from './player';

// Team types
export type {
  Team,
  TeamFinances,
  TeamChemistry,
  TeamStandings,
  Transaction,
  TransactionType,
  Loan,
  MonthlyRevenue,
  MonthlyExpenses,
} from './team';

// Match types
export type {
  Match,
  MatchResult,
  MatchStatus,
  MapResult,
  PlayerMapPerformance,
  RoundInfo,
} from './match';

// Calendar types
export type {
  GameCalendar,
  CalendarEvent,
  CalendarEventType,
  SeasonPhase,
} from './calendar';

// Competition types
export type {
  Tournament,
  TournamentFormat,
  TournamentStatus,
  TournamentRegion,
  CompetitionType,
  BracketStructure,
  BracketRound,
  BracketMatch,
  BracketMatchStatus,
  BracketType,
  TeamSource,
  Destination,
  PrizePool,
} from './competition';

// Economy types
export type {
  TrainingFocus,
  TrainingIntensity,
  TrainingSession,
  TrainingResult,
  TrainingFactors,
  PlayerFatigue,
  Difficulty,
  DifficultySettings,
} from './economy';

export { DIFFICULTY_SETTINGS } from './economy';
