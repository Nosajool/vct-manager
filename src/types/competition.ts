// Competition System Types
// Based on VCT Manager Technical Specification

import type { Region } from './player';
import type { MatchResult } from './match';

export type CompetitionType = 'kickoff' | 'stage1' | 'stage2' | 'masters' | 'champions';
export type TournamentFormat = 'single_elim' | 'double_elim' | 'triple_elim' | 'round_robin';
export type TournamentStatus = 'upcoming' | 'in_progress' | 'completed';
export type TournamentRegion = Region | 'International';

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

  // Schedule
  startDate: string;  // ISO date string
  endDate: string;    // ISO date string

  // Prize pool
  prizePool: PrizePool;

  // Bracket structure
  bracket: BracketStructure;

  // Status
  status: TournamentStatus;
  championId?: string;
}
