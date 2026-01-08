// Match System Types
// Based on VCT Manager Technical Specification

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed';

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

export interface RoundInfo {
  roundNumber: number;
  winner: 'teamA' | 'teamB';
  winCondition: 'elimination' | 'spike_defused' | 'spike_detonated' | 'time_expired';
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

  // Future: Round-by-round details
  rounds?: RoundInfo[];
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
