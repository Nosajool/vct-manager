// Competition System Types
// Based on VCT Manager Technical Specification

import type { Region } from './player';
import type { MatchResult } from './match';

export type CompetitionType = 'kickoff' | 'stage1' | 'stage2' | 'masters' | 'champions';
export type TournamentFormat = 'single_elim' | 'double_elim' | 'triple_elim' | 'round_robin' | 'swiss_to_playoff';
export type TournamentStatus = 'upcoming' | 'in_progress' | 'completed';
export type BracketFormat = 'single_elim' | 'double_elim' | 'triple_elim' | 'round_robin';
export type TournamentRegion = Region | 'International';

// ============================================
// Team Slot Types (for TBD bracket positions)
// ============================================

export type TeamSlot =
  | { type: 'resolved'; teamId: string }
  | { type: 'tbd' }
  | { type: 'qualified_from'; source: QualificationSource; description: string };

export interface QualificationSource {
  tournamentType: CompetitionType;
  region?: Region;
  placement: 'alpha' | 'beta' | 'omega' | 'first' | 'second' | 'third' | number;
}

// ============================================
// Per-Tournament Standings
// ============================================

export interface TournamentStandingsEntry {
  teamId: string;
  wins: number;
  losses: number;
  roundDiff: number;
  mapDiff: number;
  placement?: number;
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

export type BracketMatchStatus = 'pending' | 'ready' | 'in_progress' | 'completed';

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
  status: BracketMatchStatus;

  // Result
  winnerId?: string;
  loserId?: string;
  result?: MatchResult;

  // Destinations
  winnerDestination: Destination;
  loserDestination: Destination;

  // Scheduling
  scheduledDate?: string;  // ISO date string
}

export type BracketType = 'upper' | 'middle' | 'lower';

export interface BracketRound {
  roundId: string;
  roundNumber: number;
  bracketType: BracketType;
  matches: BracketMatch[];
}

export interface BracketStructure {
  format: BracketFormat;
  upper: BracketRound[];
  middle?: BracketRound[];  // Triple elimination
  lower?: BracketRound[];   // Double/Triple elimination
  grandfinal?: BracketMatch;
}

export interface PrizePool {
  first: number;
  second: number;
  third: number;
  fourth?: number;
  fifthSixth?: number;
  seventhEighth?: number;
}

export interface Tournament {
  id: string;
  name: string;
  type: CompetitionType;
  format: TournamentFormat;
  region: TournamentRegion;

  // Participating teams
  teamIds: string[];

  // Team slots (for TBD bracket positions)
  teamSlots?: TeamSlot[];

  // Schedule
  startDate: string;  // ISO date string
  endDate: string;    // ISO date string

  // Prize pool
  prizePool: PrizePool;

  // Bracket structure
  bracket: BracketStructure;

  // Per-tournament standings (for league formats)
  standings?: TournamentStandingsEntry[];

  // Status
  status: TournamentStatus;
  championId?: string;
}

// ============================================
// Swiss Stage Types (for Masters tournaments)
// ============================================

export type SwissTeamStatus = 'active' | 'qualified' | 'eliminated';

// Swiss team record for standings
export interface SwissTeamRecord {
  teamId: string;
  wins: number;
  losses: number;
  roundDiff: number;        // Maps won - maps lost (tiebreaker)
  opponentIds: string[];    // Track for no-repeat matchups
  status: SwissTeamStatus;
  seed?: number;            // Initial seeding for pairing
}

// Swiss round structure
export interface SwissRound {
  roundNumber: number;
  matches: BracketMatch[];
  completed: boolean;
}

// Swiss stage structure
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

// Multi-stage tournament (Swiss → Playoffs)
export interface MultiStageTournament extends Tournament {
  format: 'swiss_to_playoff';
  swissStage: SwissStage;
  playoffBracket?: BracketStructure;
  currentStage: 'swiss' | 'playoff';
  swissTeamIds: string[];       // 8 teams in Swiss (2nd+3rd from each region)
  playoffOnlyTeamIds: string[]; // 4 Kickoff winners (join at playoffs)
}

// Type guard for MultiStageTournament
export function isMultiStageTournament(tournament: Tournament): tournament is MultiStageTournament {
  return tournament.format === 'swiss_to_playoff';
}
