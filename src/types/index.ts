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
  EnhancedPlayerMapPerformance,
  RoundInfo,
  EnhancedRoundInfo,
  WinCondition,
  TeamEconomy,
  PlayerUltState,
  FirstBlood,
  ClutchAttempt,
  UltUsage,
  DamageEvent,
  RoundDamageEvents,
  PlayerArmorState,
  HitLocation,
  DamageSource,
  WeaponProfile,
  ArmorDamageBreakdown,
  // Round event types
  RoundEventType,
  RoundEvent,
  KillEvent,
  PlantEvent,
  DefuseEvent,
} from './match';

// Weapon types
export type {
  Weapon,
  WeaponCategory,
  HitZone,
  HeadshotTier,
  WeaponProficiency,
  HeadshotContext,
  HeadshotResult,
  WeaponStats,
  RadiantWeaponData,
  DamageResult,
} from './weapons';

// Strategy types
export type {
  TeamStrategy,
  PlayerAgentPreferences,
  CompositionBonus,
  AgentSelection,
  CompositionRequirements,
  BuyType,
  AgentRole,
  PlaystyleType,
  EconomyDiscipline,
  UltUsageStyle,
} from './strategy';

// Competition types
export type {
  CompetitionType,
  TournamentFormat,
  TournamentStatus,
  TournamentRegion,
  Tournament,
  MultiStageTournament,
  TournamentStandingsEntry,
  BracketMatch,
  BracketRound,
  BracketStructure,
  SwissTeamRecord,
  SwissStage,
  LeagueStage,
  TournamentTransitionConfig,
  GameCalendar,
  CalendarEvent,
  CalendarEventType,
  SeasonPhase,
  MatchEventData,
  TournamentEventData,
  SalaryPaymentEventData,
  RestDayEventData,
} from './competition';

// Economy types
export type {
  EconomyEngine,
  TeamEconomyState,
} from './economy';

// VLR types
export type {
  VlrPlayer,
  VlrTeam,
  VlrMatchStats,
  VlrAgentStats,
  VlrGameStats,
} from './vlr';

// Competition type guards (value re-exports, not type-only)
export {
  isMultiStageTournament,
  isLeagueToPlayoffTournament,
  isSwissToPlayoffTournament,
} from './competition';
