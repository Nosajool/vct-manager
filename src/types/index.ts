// Core type definitions for VCT Manager
// Re-export all types from individual modules

// Player types
export type {
  PlayerStats,
  PlayerContract,
  PlayerCareerStats,
  PlayerSeasonStats,
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
  TeamSource,
  Destination,
  SwissRound,
  PrizePool,
  TeamSlot,
  QualificationSource,
  BracketFormat,
  BracketMatchStatus,
  BracketType,
} from './competition';

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
  CalendarEventData,
} from './calendar';

// Activity plan types
export type {
  ActivityConfigStatus,
  TrainingPlayerAssignment,
  TrainingActivityConfig,
  ScrimActivityConfig,
  ActivityConfig,
  ActivityResolutionResult,
} from './activityPlan';

// Tournament transition types
export type {
  TournamentTransitionConfig,
  TransitionResult,
  TransitionType,
} from './tournament-transition';

// Economy types
export type {
  TeamEconomyState,
  EconomyUpdate,
  TrainingFocus,
  TrainingGoal,
  TrainingIntensity,
  TrainingSession,
  TrainingFactors,
  TrainingResult,
  GoalMapping,
  PlayerFatigue,
  Difficulty,
  DifficultySettings,
  PlayerTrainingAssignment,
  TrainingPlan,
} from './economy';

export {
  TRAINING_GOAL_MAPPINGS,
  DIFFICULTY_SETTINGS,
  EconomyEngine,
  economyEngine,
} from './economy';

// Round simulation types (revamped simulation system)
export type {
  // Basic types
  WeaponId,
  AgentId,
  AbilityId,
  ShieldType,
  Position,
  // Player state
  PlayerState,
  TeamSide,
  AbilityCharges,
  PlayerRoundState,
  // Spike state
  SpikeState,
  SpikeRoundState,
  // Damage calculation
  HitBreakdown,
  DamageSourceType,
  // Timeline events
  TimelineEvent,
  TimelineEventType,
  SimDamageEvent,
  SimKillEvent,
  TradeKillEvent,
  PlantStartEvent,
  PlantInterruptEvent,
  PlantCompleteEvent,
  DefuseStartEvent,
  DefuseInterruptEvent,
  DefuseCompleteEvent,
  SpikeDropEvent,
  SpikePickupEvent,
  SpikeDetonationEvent,
  AbilityUseEvent,
  HealEvent,
  RoundEndEvent,
  // Buy phase
  AbilityPurchase,
  BuyPhaseEntry,
  BuyPhaseResult,
  // Summary
  SimWinCondition,
  ClutchAttemptInfo,
  DerivedRoundSummary,
  // State
  RoundState,
  // Validation
  ValidationError,
  ValidationResult,
  // Config
  RoundSimulationConfig,
} from './round-simulation';

export { DEFAULT_ROUND_CONFIG } from './round-simulation';

// VLR types
export type {
  VlrPlayerStats,
  VlrTeamRanking,
  VlrTeamRoster,
  VlrRosterData,
  VlrRegion,
  VlrStatsApiResponse,
  VlrRankingsApiResponse,
  VlrCacheData,
  VlrCacheEntry,
} from './vlr';

export { VLR_TO_GAME_REGION } from './vlr';

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
  ScrimEligibilityCheck,
} from './scrim';

export { SCRIM_CONSTANTS } from './scrim';

// Competition type guards (value re-exports, not type-only)
export {
  isMultiStageTournament,
  isLeagueToPlayoffTournament,
  isSwissToPlayoffTournament,
} from './competition';

// Drama types
export type {
  DramaCategory,
  DramaSeverity,
  DramaEventStatus,
  DramaConditionType,
  PlayerSelector,
  DramaCondition,
  DramaEffectTarget,
  DramaEffect,
  DramaChoice,
  DramaEventTemplate,
  DramaEventInstance,
  DramaState,
  DramaGameStateSnapshot,
  DramaEvaluationResult,
} from './drama';

export { DRAMA_CONSTANTS } from './drama';
