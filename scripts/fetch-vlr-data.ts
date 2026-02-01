#!/usr/bin/env npx tsx
/**
 * VLR Data Fetcher
 *
 * Fetches player statistics from the vlrggapi and scrapes team rosters
 * from vlr.gg team pages. Generates a static snapshot file for the game.
 *
 * Usage:
 *   npx tsx scripts/fetch-vlr-data.ts
 *
 * Or add to package.json scripts:
 *   "fetch-vlr": "tsx scripts/fetch-vlr-data.ts"
 */

import * as fs from 'fs';
import * as path from 'path';

// VLR API types (duplicated here to avoid import issues with path aliases)
interface VlrPlayerStats {
  player: string;
  org: string;
  agents: string[];
  rounds_played: string;
  rating: string;
  average_combat_score: string;
  kill_deaths: string;
  kill_assists_survived_traded: string;
  average_damage_per_round: string;
  kills_per_round: string;
  assists_per_round: string;
  first_kills_per_round: string;
  first_deaths_per_round: string;
  headshot_percentage: string;
  clutch_success_percentage: string;
}

interface VlrApiResponse {
  data: {
    status: number;
    segments: VlrPlayerStats[];
  };
}

interface VlrTeamRoster {
  teamName: string;
  vlrTeamId: number;
  players: string[];
  scrapedAt: string;
}

type Region = 'Americas' | 'EMEA' | 'Pacific' | 'China';

// VLR Team ID mapping (duplicated from vlrTeamIds.ts to avoid path alias issues)
const VLR_TEAM_IDS: Record<Region, Record<string, number>> = {
  Americas: {
    'Sentinels': 2,
    'Cloud9': 188,
    '100 Thieves': 120,
    'NRG': 1034,
    'Evil Geniuses': 5248,
    'LOUD': 6961,
    'FURIA': 2406,
    'MIBR': 7386,
    'Leviatán': 2359,
    'KRÜ Esports': 2355,
    'G2 Esports': 11058,
    'ENVY': 427,
  },
  EMEA: {
    'Fnatic': 2593,
    'Team Liquid': 474,
    'Team Vitality': 2059,
    'Karmine Corp': 8877,
    'Team Heretics': 1001,
    'NAVI': 4915,
    'FUT Esports': 1184,
    'BBL Esports': 397,
    'Giants Gaming': 14419,
    'PCIFIC Esports': 3478,
    'Gentle Mates': 12694,
    'ULF Esports': 18019,
  },
  Pacific: {
    'Paper Rex': 624,
    'DRX': 8185,
    'T1': 14,
    'Gen.G': 17,
    'ZETA DIVISION': 5448,
    'DetonatioN Gaming': 278,
    'Global Esports': 918,
    'Team Secret': 6199,
    'FULL SENSE': 4050,
    'Rex Regum Qeon': 878,
    'VARREL': 11229,
    'Nongshim RedForce': 11060,
  },
  China: {
    'EDward Gaming': 1120,
    'Bilibili Gaming': 12010,
    'FunPlus Phoenix': 11328,
    'JD Gaming': 13576,
    'Nova Esports': 12064,
    'All Gamers': 1119,
    'Dragon Ranger Gaming': 11981,
    'Wolves Esports': 13790,
    'Titan Esports Club': 14137,
    'TYLOO': 731,
    'Trace Esports': 12685,
    'Xi Lai Gaming': 13581,
  },
};

// Configuration
const API_BASE = 'https://vlrggapi.vercel.app';
const VLR_BASE = 'https://www.vlr.gg';
const REGIONS = ['na', 'eu', 'br', 'ap', 'kr', 'cn'] as const;
const OUTPUT_PATH = path.join(process.cwd(), 'src/data/vlrSnapshot.ts');
const REQUEST_DELAY = 1000; // 1 second between requests to be polite
const ROSTER_REQUEST_DELAY = 1500; // Slightly longer for web scraping

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  magenta: '\x1b[35m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRegionStats(region: string): Promise<VlrPlayerStats[]> {
  const url = `${API_BASE}/stats?region=${region}&timespan=all`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json: VlrApiResponse = await response.json();
    return json.data?.segments || [];
  } catch (error) {
    log(`  Failed to fetch ${region}: ${error}`, 'red');
    return [];
  }
}

/**
 * Scrape team roster from VLR team page.
 * Extracts player IGNs from the roster section.
 *
 * VLR HTML structure for roster:
 * <div class="team-roster-item">
 *   <a href="/player/123/playername">
 *     ...
 *     <div class="team-roster-item-name-alias">
 *       <i class="flag mod-xx"></i>
 *       PlayerName
 *     </div>
 *   </a>
 * </div>
 */
async function scrapeTeamRoster(teamName: string, teamId: number): Promise<VlrTeamRoster | null> {
  const slug = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  const url = `${VLR_BASE}/team/${teamId}/${slug}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const players: string[] = [];

    // Strategy 1: Find player links with /player/ URLs and extract names from them
    // This is the most reliable since player URLs contain the IGN
    // Pattern: href="/player/12345/playername"
    const playerLinkRegex = /href="\/player\/\d+\/([a-z0-9_-]+)"/gi;
    const seenPlayers = new Set<string>();

    let match;
    while ((match = playerLinkRegex.exec(html)) !== null) {
      // The slug in the URL is the player's IGN (lowercased)
      const playerSlug = match[1];

      // Skip duplicates (same player linked multiple times)
      if (seenPlayers.has(playerSlug)) continue;
      seenPlayers.add(playerSlug);

      // Skip common non-player patterns
      if (playerSlug.includes('inactive') ||
          playerSlug.includes('coach') ||
          playerSlug.includes('manager') ||
          playerSlug.includes('analyst')) {
        continue;
      }

      // Only take first 10 unique players found
      if (players.length >= 10) break;

      players.push(playerSlug);
    }

    // Strategy 2: If not enough players found, try parsing the alias divs directly
    if (players.length < 5) {
      // Match the alias div content after the flag icon
      // <div class="team-roster-item-name-alias">
      //   <i class="flag ..."></i>
      //   PlayerName
      // </div>
      const aliasRegex = /team-roster-item-name-alias[^>]*>[\s\S]*?<\/i>\s*([A-Za-z0-9_\-]+)\s*<\/div>/gi;

      while ((match = aliasRegex.exec(html)) !== null && players.length < 10) {
        const playerName = match[1].trim();
        const lowerName = playerName.toLowerCase();

        // Skip if already found or invalid
        if (seenPlayers.has(lowerName) ||
            !playerName ||
            playerName.length < 2 ||
            playerName.length > 20) {
          continue;
        }

        seenPlayers.add(lowerName);
        players.push(playerName);
      }
    }

    // Take only first 5 players (starting roster)
    const startingFive = players.slice(0, 5);

    if (startingFive.length === 0) {
      log(`    Warning: No players found for ${teamName}`, 'yellow');
      return null;
    }

    return {
      teamName,
      vlrTeamId: teamId,
      players: startingFive,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    log(`    Failed to scrape ${teamName}: ${error}`, 'red');
    return null;
  }
}

/**
 * Fetch all team rosters by scraping VLR team pages
 */
async function fetchAllTeamRosters(): Promise<Record<string, VlrTeamRoster>> {
  const rosters: Record<string, VlrTeamRoster> = {};
  const allTeams: Array<{ teamName: string; teamId: number; region: Region }> = [];

  // Build list of all teams
  for (const region of Object.keys(VLR_TEAM_IDS) as Region[]) {
    for (const [teamName, teamId] of Object.entries(VLR_TEAM_IDS[region])) {
      allTeams.push({ teamName, teamId, region });
    }
  }

  log(`\nScraping ${allTeams.length} team rosters from VLR.gg...`, 'magenta');

  for (let i = 0; i < allTeams.length; i++) {
    const { teamName, teamId, region } = allTeams[i];
    log(`  [${i + 1}/${allTeams.length}] ${teamName} (${region})...`, 'dim');

    const roster = await scrapeTeamRoster(teamName, teamId);
    if (roster) {
      rosters[teamName] = roster;
      log(`    ✓ ${roster.players.join(', ')}`, 'green');
    }

    // Rate limiting
    if (i < allTeams.length - 1) {
      await sleep(ROSTER_REQUEST_DELAY);
    }
  }

  log(`\n✓ Scraped ${Object.keys(rosters).length} team rosters`, 'green');
  return rosters;
}

function generateTypeScriptFile(
  statsData: Record<string, VlrPlayerStats[]>,
  rosterData: Record<string, VlrTeamRoster>,
  metadata: { fetchedAt: string; regions: string[]; totalPlayers: number; totalRosters: number }
): string {
  const statsJson = JSON.stringify(statsData, null, 2);
  const rostersJson = JSON.stringify(rosterData, null, 2);

  return `// VLR Player Data Snapshot
// Auto-generated by scripts/fetch-vlr-data.ts
// Do not edit manually - re-run the script to update

import type { VlrPlayerStats, VlrTeamRoster, VlrRosterData } from '@/types/vlr';

/**
 * Metadata about when this snapshot was taken
 */
export const VLR_SNAPSHOT_META = {
  fetchedAt: '${metadata.fetchedAt}',
  regions: ${JSON.stringify(metadata.regions)},
  totalPlayers: ${metadata.totalPlayers},
  totalRosters: ${metadata.totalRosters},
} as const;

/**
 * Static snapshot of VLR player statistics.
 * Keyed by VLR region code (na, eu, br, ap, kr, cn).
 */
export const VLR_PLAYER_STATS: Record<string, VlrPlayerStats[]> = ${statsJson};

/**
 * Team rosters scraped from VLR team pages.
 * Keyed by full team name (e.g., "Sentinels", "Cloud9").
 * Each roster contains the starting 5 player IGNs.
 */
export const VLR_TEAM_ROSTERS: VlrRosterData = ${rostersJson};

/**
 * Get all players from all regions as a flat array.
 */
export function getAllVlrPlayers(): VlrPlayerStats[] {
  return Object.values(VLR_PLAYER_STATS).flat();
}

/**
 * Get players for a specific region.
 */
export function getVlrPlayersByRegion(region: string): VlrPlayerStats[] {
  return VLR_PLAYER_STATS[region] || [];
}

/**
 * Get roster for a specific team.
 */
export function getTeamRoster(teamName: string): VlrTeamRoster | undefined {
  return VLR_TEAM_ROSTERS[teamName];
}

/**
 * Check if a player is on a team's starting roster.
 */
export function isPlayerOnRoster(playerName: string, teamName: string): boolean {
  const roster = VLR_TEAM_ROSTERS[teamName];
  if (!roster) return false;

  // Case-insensitive comparison
  const lowerPlayerName = playerName.toLowerCase();
  return roster.players.some(p => p.toLowerCase() === lowerPlayerName);
}
`;
}

async function main() {
  log('\n🎮 VLR Data Fetcher', 'cyan');
  log('==================\n', 'cyan');

  // Phase 1: Fetch player stats from API
  log('Phase 1: Fetching player statistics...', 'cyan');
  const allStatsData: Record<string, VlrPlayerStats[]> = {};
  let totalPlayers = 0;

  for (const region of REGIONS) {
    log(`Fetching ${region.toUpperCase()}...`, 'yellow');

    const players = await fetchRegionStats(region);
    allStatsData[region] = players;
    totalPlayers += players.length;

    log(`  ✓ Got ${players.length} players`, 'green');

    // Be polite to the API
    if (region !== REGIONS[REGIONS.length - 1]) {
      await sleep(REQUEST_DELAY);
    }
  }

  log(`\nTotal: ${totalPlayers} players across ${REGIONS.length} regions`, 'cyan');

  // Phase 2: Scrape team rosters
  log('\nPhase 2: Scraping team rosters...', 'cyan');
  const rosterData = await fetchAllTeamRosters();

  // Generate the TypeScript file
  const metadata = {
    fetchedAt: new Date().toISOString(),
    regions: [...REGIONS],
    totalPlayers,
    totalRosters: Object.keys(rosterData).length,
  };

  const content = generateTypeScriptFile(allStatsData, rosterData, metadata);

  // Write to file
  fs.writeFileSync(OUTPUT_PATH, content, 'utf-8');
  log(`\n✓ Written to ${OUTPUT_PATH}`, 'green');

  // Show some sample data
  log('\nSample players:', 'dim');
  const samplePlayers = Object.values(allStatsData)
    .flat()
    .slice(0, 5);

  for (const player of samplePlayers) {
    log(`  ${player.player} (${player.org}) - Rating: ${player.rating}`, 'dim');
  }

  log('\nSample rosters:', 'dim');
  const sampleRosters = Object.entries(rosterData).slice(0, 3);
  for (const [teamName, roster] of sampleRosters) {
    log(`  ${teamName}: ${roster.players.join(', ')}`, 'dim');
  }

  log('\n✅ Done!\n', 'green');
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}\n`, 'red');
  process.exit(1);
});
