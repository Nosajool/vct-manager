// Tournament Transition Types
// Defines configuration for automatic phase transitions and tournament creation

import type { SeasonPhase, TournamentFormat, TournamentRegion } from './index';

/**
 * Type of transition between phases
 * - regional_to_playoff: Regional league/kickoff → Regional playoffs
 * - playoff_to_international: Regional playoffs → International tournament
 * - international_to_league: International tournament → Regional league (phase change only)
 */
export type TransitionType = 'regional_to_playoff' | 'playoff_to_international' | 'international_to_league';

/**
 * Source of qualification data
 * - kickoff: Top 3 from each regional Kickoff (triple elim brackets)
 * - stage1: Top N from Stage 1 league standings
 * - stage1_playoffs: Top 3 from each regional Stage 1 Playoff
 * - stage2: Top N from Stage 2 league standings
 * - stage2_playoffs: Top 3 from each regional Stage 2 Playoff
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
  id: string; // Unique ID for this transition (e.g., 'kickoff_to_masters1')
  fromPhase: SeasonPhase; // Phase that just completed
  toPhase: SeasonPhase; // Phase to transition to

  // Transition metadata
  type: TransitionType;
  qualificationSource: QualificationSource;

  // Tournament creation
  tournamentName: string;
  format: TournamentFormat;
  region: TournamentRegion; // 'International' or specific region
  prizePool: number;

  // Qualification rules
  qualificationRules: QualificationRules;

  // Timing
  daysUntilStart: number; // Days from current date to tournament start
  durationDays: number; // Estimated tournament duration
}

/**
 * Rules for determining which teams qualify
 */
export interface QualificationRules {
  // For regional_to_playoff
  teamsPerRegion?: number; // Top N teams from standings (e.g., 8 for Stage 1 Playoffs)

  // For playoff_to_international
  teamsFromKickoff?: {
    alpha: number; // Kickoff winners (1st place)
    beta: number; // 2nd place
    omega: number; // 3rd place
  };
  teamsFromPlayoffs?: {
    winners: number; // Playoff champions
    runnersUp: number; // 2nd place
    thirdPlace: number; // 3rd place
  };

  // Swiss-to-Playoff configuration
  swissStageTeams?: number; // Teams in Swiss stage (e.g., 8)
  directPlayoffTeams?: number; // Teams that skip Swiss (e.g., 4 Kickoff winners)
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
