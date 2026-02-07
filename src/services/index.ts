// Services

export { GameInitService, gameInitService } from './GameInitService';
export {
  ContractService,
  contractService,
  type SigningResult,
  type ReleaseResult,
} from './ContractService';
export { MatchService, matchService } from './MatchService';
export {
  CalendarService,
  calendarService,
  type TimeAdvanceResult,
} from './CalendarService';
export { TrainingService, trainingService } from './TrainingService';
export { TournamentService, tournamentService } from './TournamentService';
export {
  EconomyService,
  economyService,
  type SponsorshipResult,
  type LoanResult,
  type FinancialSummary,
} from './EconomyService';
export { ScrimService, scrimService } from './ScrimService';
export {
  RegionalSimulationService,
  regionalSimulationService,
} from './RegionalSimulationService';
export { StrategyService, strategyService } from './StrategyService';
export {
  getDailyObjectives,
  type DailyObjective,
  type ObjectiveAction,
} from './ObjectivesService';
