#!/usr/bin/env npx tsx
/**
 * VLR Data Fetcher
 *
 * Fetches player statistics from the vlrggapi and scrapes team rosters
 * from vlr.gg team pages. Generates a static snapshot file for the game.
 *
 * Usage:
 *   npx tsx scripts/fetch-vlr-data.ts              # Data only
 *   npx tsx scripts/fetch-vlr-data.ts --with-images # Data + images
 *
 * Or add to package.json scripts:
 *   "fetch-vlr": "tsx scripts/fetch-vlr-data.ts"
 *
 * Flags:
 *   --with-images: Download team logos and player photos to public/images/
 */

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { getCountryFromVlrCode, extractCountryCodeFromClass } from '../src/utils/vlrCountryMapping';

// VLR API types (duplicated here to avoid import issues with path aliases)
interface VlrPlayerStats {
  player: string;
  org: string;
  country?: string; // Country name extracted from flag
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


interface VlrTeamRoster {
  teamName: string;
  vlrTeamId: number;
  players: string[];
  scrapedAt: string;
}

type Region = 'Americas' | 'EMEA' | 'Pacific' | 'China';

// Image download configuration
const DOWNLOAD_IMAGES = process.argv.includes('--with-images');
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');
const TEAMS_DIR = path.join(IMAGES_DIR, 'teams');
const PLAYERS_DIR = path.join(IMAGES_DIR, 'players');

/**
 * Normalize entity name to filename-safe slug
 * (duplicated from imageAssets.ts to avoid import issues)
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[/.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ensure a directory exists
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Download an image from a URL and save it to disk
 * @returns true if downloaded, false if skipped
 */
async function downloadImage(url: string, outputPath: string): Promise<boolean> {
  if (fs.existsSync(outputPath)) {
    return false; // Already exists
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return false;
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    return true;
  } catch (error) {
    return false;
  }
}

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
const VLR_BASE = 'https://www.vlr.gg';
const REGIONS = ['na', 'eu', 'br', 'ap', 'kr', 'cn'] as const;
const OUTPUT_PATH = path.join(process.cwd(), 'src/data/vlrSnapshot.ts');
// const REQUEST_DELAY = 1000; // 1 second between requests to be polite
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

/**
 * Clean text by removing extra whitespace, newlines, and tabs
 */
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Extract player name and team from player cell text
 * VLR format: "PlayerName\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tTeam"
 */
function parsePlayerCell(playerText: string): { playerName: string; teamName: string } {
  // Split by newlines and filter out empty strings
  const parts = playerText.split('\n').map(cleanText).filter(part => part.length > 0);
  
  if (parts.length >= 2) {
    // First part is player name, last part is team name
    return {
      playerName: parts[0],
      teamName: parts[parts.length - 1]
    };
  } else if (parts.length === 1) {
    // Only player name found
    return {
      playerName: parts[0],
      teamName: 'Unknown'
    };
  }
  
  return {
    playerName: 'Unknown',
    teamName: 'Unknown'
  };
}

/**
 * Extract agent names from agent cell HTML
 * VLR uses <img> tags with src like "/img/vlr/game/agents/agentname.png"
 */
function parseAgentCell(agentHtml: string): string[] {
  const agents: string[] = [];

  // Look for agent image sources
  const agentImageRegex = /\/img\/vlr\/game\/agents\/([a-z]+)\.png/g;
  let match;

  while ((match = agentImageRegex.exec(agentHtml)) !== null) {
    const agentName = match[1];
    if (agentName && !agents.includes(agentName)) {
      agents.push(agentName);
    }
  }

  return agents.length > 0 ? agents : ['Unknown'];
}

/**
 * Extract country from player cell by finding flag element
 * VLR uses <i class="flag mod-{countrycode}"></i> for country flags
 * @param $playerCell - Cheerio element for the player cell
 * @returns Full country name, or null if not found
 */
function extractCountryFromPlayerCell($playerCell: cheerio.Cheerio): string | null {
  // Find flag element with class like "flag mod-us"
  const flagElement = $playerCell.find('i.flag[class*="mod-"]');

  if (flagElement.length === 0) {
    return null;
  }

  const flagClass = flagElement.attr('class');
  if (!flagClass) {
    return null;
  }

  const countryCode = extractCountryCodeFromClass(flagClass);
  if (!countryCode) {
    return null;
  }

  return getCountryFromVlrCode(countryCode);
}

/**
 * Fetch player statistics from VLR HTML for a specific event.
 * @param eventGroupId The VLR event group ID (86 for VCT Champions Tour 2026, 85 for VCL)
 * @param region The region to filter by (e.g., 'na', 'eu', 'all')
 * @param minRating The minimum rating to filter by
 * @param description A description for logging purposes
 */
async function fetchVlrStats(eventGroupId: number, region: string, minRating: number, description: string): Promise<VlrPlayerStats[]> {
  const url = `https://www.vlr.gg/stats/?event_group_id=${eventGroupId}&region=${region}&min_rounds=0&min_rating=${minRating}&agent=all&map_id=all&timespan=all`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const players: VlrPlayerStats[] = [];

    // Find the main stats table
    // VLR typically uses a table with class like 'wf-card' or 'stats-table'
    const statsTable = $('.wf-card').find('table') || $('.stats-table');
    
    if (!statsTable.length) {
      throw new Error('Could not find stats table in HTML');
    }

    // Find all player rows (typically tr elements within tbody)
    const playerRows = statsTable.find('tbody tr');
    
    if (playerRows.length === 0) {
      throw new Error('No player data found in stats table');
    }

    playerRows.each((index: number, row: cheerio.Element) => {
      const $row = $(row);

      try {
        // Extract player name and team from the first column
        const playerCell = $row.find('td').first();
        const playerLink = playerCell.find('a[href^="/player/"]');
        const playerText = playerLink.text();

        const { playerName, teamName } = parsePlayerCell(playerText);

        if (!playerName || playerName === 'Unknown') {
          return; // Skip rows without valid player names
        }

        // Extract country from flag element in player cell
        const country = extractCountryFromPlayerCell(playerCell);

        // Extract agent icons from the second cell
        const agentCell = $row.find('td').eq(1);
        const agentHtml = agentCell.html() || '';
        const agents = parseAgentCell(agentHtml);

        // Extract stats from other columns
        // VLR stats table has columns in this order:
        // Player, Agent, Rounds, Rating, ACS, K/D, KAST, ADR, KPR, APR, FKPR, FDPR, HS%, Clutch%
        const cells = $row.find('td');
        
        if (cells.length < 10) {
          return; // Skip rows with insufficient data
        }

        // Helper function to clean stat values
        const cleanStat = (text: string): string => {
          return text.replace(/[^\d.%]/g, '').trim();
        };

        // Extract stats based on column positions
        // Column 2: Rounds, 3: Rating, 4: ACS, 5: K/D, 6: KAST, 7: ADR, 8: KPR, 9: APR, 10: FKPR, 11: FDPR, 12: HS%, 13: Clutch%
        const rounds = cleanStat($(cells[2]).text().trim()) || '0';
        const rating = cleanStat($(cells[3]).text().trim()) || '0';
        const acs = cleanStat($(cells[4]).text().trim()) || '0';
        const kd = cleanStat($(cells[5]).text().trim()) || '0';
        const kast = cleanStat($(cells[6]).text().trim()) || '0';
        const adr = cleanStat($(cells[7]).text().trim()) || '0';
        const kpr = cleanStat($(cells[8]).text().trim()) || '0';
        const apr = cleanStat($(cells[9]).text().trim()) || '0';
        const fkpr = cleanStat($(cells[10]).text().trim()) || '0';
        const fdpr = cleanStat($(cells[11]).text().trim()) || '0';
        const hs = cleanStat($(cells[12]).text().trim()) || '0';
        const clutch = cleanStat($(cells[13]).text().trim()) || '0';

        // Create VlrPlayerStats object
        const playerStats: VlrPlayerStats = {
          player: playerName,
          org: teamName,
          ...(country && { country }), // Only add country if extracted
          agents: agents,
          rounds_played: rounds,
          rating: rating,
          average_combat_score: acs,
          kill_deaths: kd,
          kill_assists_survived_traded: kast,
          average_damage_per_round: adr,
          kills_per_round: kpr,
          assists_per_round: apr,
          first_kills_per_round: fkpr,
          first_deaths_per_round: fdpr,
          headshot_percentage: hs,
          clutch_success_percentage: clutch,
        };

        players.push(playerStats);
      } catch (rowError) {
        log(`  Warning: Error parsing row ${index}: ${rowError}`, 'yellow');
      }
    });

    log(`  ✓ Parsed ${players.length} players from ${description}`, 'green');
    return players;
  } catch (error) {
    log(`  Failed to fetch ${description} stats: ${error}`, 'red');
    return [];
  }
}

/**
 * Fetch VCT Champions Tour 2026 player statistics from VLR HTML.
 */
async function fetchVctChampionsTour2026Stats(): Promise<VlrPlayerStats[]> {
  return fetchVlrStats(86, 'all', 0, 'VCT Champions Tour 2026');
}

/**
 * Fetch VCL player statistics from VLR HTML.
 */
async function fetchVclStats(): Promise<VlrPlayerStats[]> {
  return fetchVlrStats(85, 'all', 1599, 'Valorant Challengers League 2026 ');
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
    const slug = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/-+$/, '');
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
    const $ = cheerio.load(html);
    const players: string[] = [];

    // Download team logo if --with-images is enabled
    if (DOWNLOAD_IMAGES) {
      ensureDir(TEAMS_DIR);

      // Find team logo (typically in .wf-avatar or team header)
      const teamLogo = $('.wf-avatar img, .team-header-logo img').first();
      const logoUrl = teamLogo.attr('src');

      if (logoUrl) {
        const absoluteUrl = logoUrl.startsWith('http') ? logoUrl : `https:${logoUrl}`;
        const teamSlug = slugify(teamName);
        const logoPath = path.join(TEAMS_DIR, `${teamSlug}.png`);

        const downloaded = await downloadImage(absoluteUrl, logoPath);
        if (downloaded) {
          log(`    ✓ Downloaded logo: ${teamName}`, 'green');
        }
      }
    }

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
      const aliasRegex = /team-roster-item-name-alias[^>]*>[\s\S]*?<\/i>\s*([A-Za-z0-9_-]+)\s*<\/div>/gi;

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

    // Download player photos if --with-images is enabled
    if (DOWNLOAD_IMAGES) {
      ensureDir(PLAYERS_DIR);

      // Find player photo URLs from the roster
      const rosterItems = $('.team-roster-item, .wf-module-item');

      for (const playerSlug of startingFive) {
        // Find the roster item that contains this player's link
        const playerItem = rosterItems.filter((_, el) => {
          const links = $(el).find('a[href*="/player/"]');
          return links.toArray().some(link => {
            const href = $(link).attr('href') || '';
            return href.includes(`/${playerSlug}`);
          });
        }).first();

        if (playerItem.length > 0) {
          // Find the player photo within this roster item
          const playerImg = $(playerItem).find('img').first();
          const imgUrl = playerImg.attr('src');

          if (imgUrl && !imgUrl.includes('/img/base/ph/sil.png')) {
            // Skip VLR's placeholder silhouette image
            const absoluteUrl = imgUrl.startsWith('http') ? imgUrl : `https:${imgUrl}`;
            const photoPath = path.join(PLAYERS_DIR, `${playerSlug}.png`);

            await downloadImage(absoluteUrl, photoPath);
            // Add small delay between player photo downloads
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
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

  if (DOWNLOAD_IMAGES) {
    log('📷 Image downloading: ENABLED', 'cyan');
    log('   Team logos → public/images/teams/', 'cyan');
    log('   Player photos → public/images/players/\n', 'cyan');
  } else {
    log('📷 Image downloading: DISABLED (use --with-images to enable)\n', 'cyan');
  }

  // Phase 1: Fetch player statistics from VLR for each region
  log('Phase 1: Fetching player statistics for all regions...', 'cyan');
  
  // Initialize data structure with region keys
  const allStatsData: Record<string, VlrPlayerStats[]> = {};
  let totalPlayers = 0;

  // For each region, fetch both VCT and VCL data
  for (const region of REGIONS) {
    log(`  Fetching data for ${region.toUpperCase()} region...`, 'cyan');
    
    // Fetch VCT data for this specific region
    const vctPlayers = await fetchVlrStats(86, region, 0, `VCT Champions Tour 2026 (${region.toUpperCase()})`);
    
    // Fetch VCL data for this specific region
    const vclPlayers = await fetchVlrStats(85, region, 1599, `VCL (${region.toUpperCase()})`);
    
    // Combine both datasets for this region
    const regionPlayers = [...vctPlayers, ...vclPlayers];
    allStatsData[region] = regionPlayers;
    totalPlayers += regionPlayers.length;
    
    log(`    ✓ ${region.toUpperCase()}: ${vctPlayers.length} VCT + ${vclPlayers.length} VCL = ${regionPlayers.length} total players`, 'green');
  }

  log(`\nTotal: ${totalPlayers} players across all regions`, 'cyan');

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
  log('\nSample players by region:', 'dim');
  for (const region of REGIONS) {
    const regionPlayers = allStatsData[region];
    if (regionPlayers && regionPlayers.length > 0) {
      log(`  ${region.toUpperCase()} (${regionPlayers.length} players):`, 'dim');
      const samplePlayers = regionPlayers.slice(0, 3);
      for (const player of samplePlayers) {
        log(`    ${player.player} (${player.org}) - Rating: ${player.rating}`, 'dim');
      }
    }
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
  console.error(error);
  // Exit gracefully without process.exit for better compatibility
});
