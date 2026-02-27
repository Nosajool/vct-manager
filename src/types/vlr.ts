// VLR API Type Definitions
// Types for the unofficial vlrggapi (https://github.com/axsddlr/vlrggapi)

import type { Region } from './player';
import type { PlayerAgentPreferences } from './strategy';

/** VLR API region parameter values */
export type VlrRegion =
  | 'na'
  | 'eu'
  | 'ap'
  | 'la'
  | 'la-s'
  | 'la-n'
  | 'oce'
  | 'kr'
  | 'mn'
  | 'gc'
  | 'br'
  | 'cn';

/** Maps VLR regions to game regions */
export const VLR_TO_GAME_REGION: Record<VlrRegion, Region> = {
  na: 'Americas',
  br: 'Americas',
  'la-s': 'Americas',
  'la-n': 'Americas',
  la: 'Americas',
  eu: 'EMEA',
  mn: 'EMEA',
  gc: 'EMEA',
  ap: 'Pacific',
  kr: 'Pacific',
  oce: 'Pacific',
  cn: 'China',
};

/** Raw player stats from VLR API /stats endpoint */
export interface VlrPlayerStats {
  player: string; // IGN (e.g., "TenZ")
  org: string; // Team abbreviation (e.g., "SEN")
  country?: string; // Country name (e.g., "United States"), extracted from flag
  agents: string[]; // Most played agents (array)
  rounds_played: string; // Total rounds
  rating: string; // VLR rating (e.g., "1.18")
  average_combat_score: string; // ACS (e.g., "235.2")
  kill_deaths: string; // K/D ratio (e.g., "1.19")
  kill_assists_survived_traded: string; // KAST % (e.g., "72%")
  average_damage_per_round: string; // ADR (e.g., "158.4")
  kills_per_round: string; // KPR (e.g., "0.81")
  assists_per_round: string; // APR (e.g., "0.29")
  first_kills_per_round: string; // FKPR (e.g., "0.19")
  first_deaths_per_round: string; // FDPR (e.g., "0.13")
  headshot_percentage: string; // HS% (e.g., "26%")
  clutch_success_percentage: string; // Clutch % (e.g., "28%")
  /** Agent preferences derived from VLR agent usage at snapshot time */
  computedAgentPreferences?: PlayerAgentPreferences;
}

/** Team ranking from VLR API /rankings endpoint */
export interface VlrTeamRanking {
  rank: string;
  team: string; // Full team name
  country: string; // Country code
  last_played: string;
  last_played_team: string;
  last_played_team_logo: string;
  record: string; // W-L record
  earnings: string;
  logo: string;
}

/** API response wrapper for stats endpoint */
export interface VlrStatsApiResponse {
  data: {
    status: number;
    segments: VlrPlayerStats[];
  };
}

/** API response wrapper for rankings endpoint */
export interface VlrRankingsApiResponse {
  data: {
    status: number;
    segments: VlrTeamRanking[];
  };
}

/** Serializable cache entry for VLR data */
export interface VlrCacheData {
  [region: string]: VlrPlayerStats[];
}

/** Cache entry with metadata */
export interface VlrCacheEntry {
  id: string;
  timestamp: number;
  data: VlrCacheData;
}

/** Team roster scraped from VLR team page */
export interface VlrTeamRoster {
  teamName: string;
  vlrTeamId: number;
  players: string[]; // IGNs of the starting 5 players
  scrapedAt: string; // ISO timestamp
}

/** All team rosters keyed by team name */
export type VlrRosterData = Record<string, VlrTeamRoster>;
