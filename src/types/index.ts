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
  MatchEventData,
  TournamentEventData,
  SalaryPaymentEventData,
  RestDayEventData,
} from './calendar';

// Competition types
export type {
  Tournament,
  TournamentFormat,
  TournamentStatus,
  TournamentRegion,
  CompetitionType,
  BracketFormat,
  BracketStructure,
  BracketRound,
  BracketMatch,
  BracketMatchStatus,
  BracketType,
  TeamSource,
  Destination,
  PrizePool,
  // Swiss stage types
  SwissTeamStatus,
  SwissTeamRecord,
  SwissRound,
  SwissStage,
  MultiStageTournament,
  // Team slot types (for TBD bracket positions)
  TeamSlot,
  QualificationSource as CompetitionQualificationSource,
  TournamentStandingsEntry,
} from './competition';

export { isMultiStageTournament } from './competition';

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

// Scrim types
export type {
  TeamTier,
  TierTeam,
  ScrimRelationship,
  RelationshipEventType,
  RelationshipEvent,
  MapStrengthAttributes,
  MapStrength,
  MapPoolStrength,
  ScrimFormat,
  ScrimIntensity,
  ScrimOptions,
  ScrimResult,
  WeeklyScrimTracker,
} from './scrim';

export { SCRIM_CONSTANTS } from './scrim';

// VLR types
export type {
  VlrRegion,
  VlrPlayerStats,
  VlrTeamRanking,
  VlrStatsApiResponse,
  VlrRankingsApiResponse,
  VlrCacheData,
  VlrCacheEntry,
} from './vlr';

export { VLR_TO_GAME_REGION } from './vlr';

// Tournament transition types
export type {
  TransitionType,
  QualificationSource,
  TournamentTransitionConfig,
  QualificationRules,
  TransitionResult,
} from './tournament-transition';
