// Match System Types
// Based on VCT Manager Technical Specification

import type { BuyType } from './strategy';

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed';

/**
 * Win conditions for a round
 */
export type WinCondition = 'elimination' | 'spike_defused' | 'spike_detonated' | 'time_expired';

/**
 * Team economy state during a round
 */
export interface TeamEconomy {
  /** Current credits available */
  credits: number;
  /** Type of buy this round */
  buyType: BuyType;
  /** Consecutive rounds lost (for loss bonus calculation) */
  roundsLost: number;
}

/**
 * Player ultimate state tracking
 */
export interface PlayerUltState {
  playerId: string;
  agent: string;
  /** Current ult points */
  currentPoints: number;
  /** Points needed for ult */
  requiredPoints: number;
  /** Whether ult is ready to use */
  isReady: boolean;
}

/**
 * First blood information for a round
 */
export interface FirstBlood {
  killerId: string;
  victimId: string;
  side: 'teamA' | 'teamB';
}

/**
 * Clutch attempt information
 */
export interface ClutchAttempt {
  playerId: string;
  situation: '1v1' | '1v2' | '1v3' | '1v4' | '1v5';
  won: boolean;
}

/**
 * Ultimate usage in a round
 */
export interface UltUsage {
  playerId: string;
  agent: string;
}

/**
 * Enhanced round information with economy, ultimates, and detailed events
 */
export interface EnhancedRoundInfo {
  roundNumber: number;
  winner: 'teamA' | 'teamB';
  winCondition: WinCondition;

  /** Economy state before the round */
  teamAEconomy: TeamEconomy;
  teamBEconomy: TeamEconomy;

  /** First blood of the round (null if time expired with no kills) */
  firstBlood: FirstBlood | null;

  /** Whether spike was planted */
  spikePlanted: boolean;

  /** Clutch attempt if one occurred */
  clutchAttempt: ClutchAttempt | null;

  /** Ultimates used this round */
  ultsUsed: UltUsage[];

  /** Running scores */
  teamAScore: number;
  teamBScore: number;
}

export interface PlayerMapPerformance {
  playerId: string;
  playerName: string;
  agent: string;

  // Core stats
  kills: number;
  deaths: number;
  assists: number;

  // Advanced stats
  acs: number;
  kd: number;

  // Enhanced stats (now populated by simulation)
  firstKills?: number;
  firstDeaths?: number;
  clutchesAttempted?: number;
  clutchesWon?: number;
  plants?: number;
  defuses?: number;
  kast?: number;     // KAST percentage (kills/assists/survived/traded)
  adr?: number;      // Average damage per round
  hsPercent?: number; // Headshot percentage
  ultsUsed?: number;
}

/**
 * Enhanced player map performance with all detailed stats
 */
export interface EnhancedPlayerMapPerformance extends PlayerMapPerformance {
  firstKills: number;
  firstDeaths: number;
  clutchesAttempted: number;
  clutchesWon: number;
  plants: number;
  defuses: number;
  kast: number;
  adr: number;
  hsPercent: number;
  ultsUsed: number;
}

/**
 * Basic round info (legacy format for backward compatibility)
 */
export interface RoundInfo {
  roundNumber: number;
  winner: 'teamA' | 'teamB';
  winCondition: WinCondition;
  teamAScore: number;
  teamBScore: number;
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

  // Round-by-round details
  rounds?: RoundInfo[];

  // Enhanced round data (populated by new simulation engine)
  enhancedRounds?: EnhancedRoundInfo[];
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

export interface Match {
  id: string;
  tournamentId?: string;  // null for regular season
  teamAId: string;
  teamBId: string;
  scheduledDate: string;  // ISO date string for serialization
  status: MatchStatus;

  // Result
  result?: MatchResult;
}
