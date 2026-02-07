// VLR Data Processor
// Transforms VLR snapshot data into game Player entities

import type { Player, PlayerStats, Region } from '@/types/player';
import type { VlrPlayerStats } from '@/types/vlr';
import { convertVlrToGameStats, calculateVlrOverall } from './statConverter';
import { resolveOrgToTeamName, VLR_TO_GAME_REGION } from './orgMapping';
import type { VlrRegion } from '@/types/vlr';

/** Result of processing VLR data */
export interface ProcessedVlrData {
  players: VlrProcessedPlayer[];
  unmatchedOrgs: string[];
  stats: {
    totalPlayers: number;
    matchedPlayers: number;
    regionsProcessed: string[];
  };
}

/** A player processed from VLR data (not yet assigned team IDs) */
export interface VlrProcessedPlayer {
  name: string;
  vlrOrg: string;
  teamName: string | null; // Game team name, null if unmatched
  region: Region;
  stats: PlayerStats;
  overall: number;
  vlrRating: number;
  vlrStats: VlrPlayerStats; // Keep original for reference
}

/**
 * Infer nationality based on region (fallback when country not available from VLR).
 * Used only when VLR data doesn't include country information.
 */
function inferNationality(region: Region): string {
  const nationalities: Record<Region, string[]> = {
    Americas: ['United States', 'Canada', 'Brazil', 'Chile', 'Argentina', 'Mexico'],
    EMEA: ['Sweden', 'France', 'United Kingdom', 'Turkey', 'Russia', 'Germany', 'Spain'],
    Pacific: ['South Korea', 'Japan', 'Philippines', 'Indonesia', 'Thailand', 'Singapore'],
    China: ['China'],
  };
  const options = nationalities[region];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Estimate player age based on rating.
 * Higher rated players are assumed to be in their prime (21-25).
 */
function estimateAge(vlrRating: number): number {
  // Prime players (rating >= 1.1) are typically 21-25
  // Lower rated might be younger (developing) or older (declining)
  const baseAge = 22;
  const ratingOffset = (1.1 - vlrRating) * 5;
  const randomVariance = (Math.random() - 0.5) * 4;
  const age = Math.round(baseAge + ratingOffset + randomVariance);
  return Math.max(18, Math.min(30, age));
}

/**
 * Generate a contract based on overall rating.
 */
function generateContract(overall: number): Player['contract'] {
  const baseSalary = 50000 + overall * 1000;
  const variance = baseSalary * 0.2;
  return {
    salary: Math.round(baseSalary + (Math.random() - 0.5) * variance),
    bonusPerWin: Math.round(500 + overall * 20),
    yearsRemaining: 1 + Math.floor(Math.random() * 2),
    endDate: new Date(2027, 11, 31).toISOString(),
  };
}

/**
 * Generate career stats based on VLR data and estimated age.
 */
function generateCareerStats(vlr: VlrPlayerStats, age: number): Player['careerStats'] {
  const yearsPlaying = Math.max(1, age - 17);
  const matchesPerYear = 80 + Math.floor(Math.random() * 40);
  const totalMatches = yearsPlaying * matchesPerYear;

  const kd = parseFloat(vlr.kill_deaths) || 1.0;
  const kpr = parseFloat(vlr.kills_per_round) || 0.7;
  const apr = parseFloat(vlr.assists_per_round) || 0.3;
  const winRate = Math.max(0.3, Math.min(0.7, 0.45 + (kd - 0.9) * 0.15));

  return {
    matchesPlayed: totalMatches,
    wins: Math.round(totalMatches * winRate),
    losses: Math.round(totalMatches * (1 - winRate)),
    avgKills: Math.round(kpr * 24 * 10) / 10, // Assume 24 rounds avg
    avgDeaths: Math.round((kpr / kd) * 24 * 10) / 10,
    avgAssists: Math.round(apr * 24 * 10) / 10,
    tournamentsWon: Math.floor(yearsPlaying * winRate * 0.5),
  };
}

/**
 * Generate player preferences.
 */
function generatePreferences(): Player['preferences'] {
  return {
    salaryImportance: 40 + Math.floor(Math.random() * 40),
    teamQualityImportance: 50 + Math.floor(Math.random() * 40),
    regionLoyalty: 30 + Math.floor(Math.random() * 50),
    preferredTeammates: [],
  };
}

/**
 * Process raw VLR player stats from all regions.
 * Returns processed players with matched team names.
 */
export function processVlrSnapshot(
  data: Record<string, VlrPlayerStats[]>
): ProcessedVlrData {
  const players: VlrProcessedPlayer[] = [];
  const unmatchedOrgs = new Set<string>();
  const regionsProcessed: string[] = [];

  for (const [vlrRegion, regionPlayers] of Object.entries(data)) {
    if (!regionPlayers || regionPlayers.length === 0) continue;

    regionsProcessed.push(vlrRegion);
    const gameRegion = VLR_TO_GAME_REGION[vlrRegion as VlrRegion] || 'Americas';

    for (const vlrPlayer of regionPlayers) {
      const teamName = resolveOrgToTeamName(vlrPlayer.org);

      if (!teamName) {
        unmatchedOrgs.add(vlrPlayer.org);
      }

      const stats = convertVlrToGameStats(vlrPlayer);
      const vlrRating = parseFloat(vlrPlayer.rating) || 1.0;
      const overall = calculateVlrOverall(vlrPlayer);

      players.push({
        name: vlrPlayer.player,
        vlrOrg: vlrPlayer.org,
        teamName: teamName || null,
        region: gameRegion,
        stats,
        overall,
        vlrRating,
        vlrStats: vlrPlayer,
      });
    }
  }

  return {
    players,
    unmatchedOrgs: [...unmatchedOrgs],
    stats: {
      totalPlayers: players.length,
      matchedPlayers: players.filter((p) => p.teamName !== null).length,
      regionsProcessed,
    },
  };
}

/**
 * Convert a VlrProcessedPlayer to a full game Player entity.
 * Requires a teamId to be resolved externally (via team name lookup).
 */
export function createPlayerFromVlr(
  processed: VlrProcessedPlayer,
  teamId: string | null
): Player {
  const age = estimateAge(processed.vlrRating);

  // Use actual country from VLR if available, otherwise infer from region
  const nationality = processed.vlrStats.country || inferNationality(processed.region);

  return {
    id: `vlr-${processed.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    name: processed.name,
    age,
    nationality,
    region: processed.region,
    teamId,
    stats: processed.stats,
    form: Math.round(50 + (processed.vlrRating - 1) * 30),
    morale: 70 + Math.floor(Math.random() * 20),
    potential: Math.min(99, processed.overall + Math.floor(Math.random() * 15)),
    contract: teamId ? generateContract(processed.overall) : null,
    careerStats: generateCareerStats(processed.vlrStats, age),
    seasonStats: {
      season: 1,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      avgKills: 0,
      avgDeaths: 0,
      avgAssists: 0,
      tournamentsWon: 0,
    },
    preferences: generatePreferences(),
  };
}
