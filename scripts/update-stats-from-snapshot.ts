#!/usr/bin/env npx tsx
/**
 * VLR Stats Snapshot Updater
 * 
 * Parses local HTML files to update player statistics in vlrSnapshot.ts.
 * Processes multiple snapshot files in priority order, deduplicating by player name.
 * Preserves existing team rosters and helper functions.
 * 
 * Source URLs:
 *   VCT 2026: https://www.vlr.gg/stats/?event_group_id=86&region=all&min_rounds=0&min_rating=0&agent=all&map_id=all&timespan=all
 *   VCT 2025: https://www.vlr.gg/stats/?event_group_id=74&region=all&min_rounds=500&min_rating=1600&agent=all&map_id=all&timespan=all
 *   VCL 2026: https://www.vlr.gg/stats/?event_group_id=85&region=all&min_rounds=0&min_rating=0&agent=all&map_id=all&timespan=all
 * 
 * Usage:
 *   npx tsx scripts/update-stats-from-snapshot.ts
 * 
 * Or add to package.json scripts:
 *   "update-stats": "tsx scripts/update-stats-from-snapshot.ts"
 */

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { getCountryFromVlrCode, extractCountryCodeFromClass } from '../src/utils/vlrCountryMapping';

interface VlrPlayerStats {
  player: string;
  org: string;
  country?: string;
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

const SNAPSHOTS_DIR = path.join(process.cwd(), 'src/data/statsSnapshots');
const OUTPUT_PATH = path.join(process.cwd(), 'src/data/vlrSnapshot.ts');

const PRIORITY_FILES = [
  'vct_2026.html',
  'vct_2025.html',
  'vcl_2026.html',
];

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

function parseAgentCell($cell: cheerio.Cheerio, $: ReturnType<typeof cheerio.load>): string[] {
  const agents: string[] = [];
  $cell.find('img').each((_, img) => {
    const src = $(img).attr('src') || '';
    const match = src.match(/\/agents\/([a-z]+)\.png/);
    if (match && match[1] && !agents.includes(match[1])) {
      agents.push(match[1]);
    }
  });
  return agents.length > 0 ? agents : ['Unknown'];
}

function extractCountryFromPlayerCell($cell: cheerio.Cheerio): string | null {
  const flagElement = $cell.find('i.flag[class*="mod-"]');
  if (flagElement.length === 0) return null;
  
  const flagClass = flagElement.attr('class');
  if (!flagClass) return null;
  
  const countryCode = extractCountryCodeFromClass(flagClass);
  if (!countryCode) return null;
  
  return getCountryFromVlrCode(countryCode);
}

function parseHtmlStats(html: string): VlrPlayerStats[] {
  const $ = cheerio.load(html);
  const players: VlrPlayerStats[] = [];
  
  const table = $('table.wf-table.mod-stats');
  if (table.length === 0) {
    return [];
  }
  
  const rows = table.find('tbody tr');
  
  rows.each((_, row) => {
    const $row = $(row);
    const cells = $row.find('td');
    
    if (cells.length < 14) return;
    
    const playerCell = $(cells[0]);
    const playerLink = playerCell.find('a');
    const playerName = playerLink.find('.text-of').text().trim();
    const teamName = playerLink.find('.stats-player-country').text().trim();
    
    if (!playerName) return;
    
    const country = extractCountryFromPlayerCell(playerCell);
    
    const agentCell = $(cells[1]);
    const agents = parseAgentCell(agentCell, $);
    
    const cleanStat = (text: string): string => {
      return text.replace(/[^\d.%]/g, '').trim();
    };
    
    const player: VlrPlayerStats = {
      player: playerName,
      org: teamName || 'Unknown',
      ...(country && { country }),
      agents,
      rounds_played: cleanStat($(cells[2]).text()),
      rating: cleanStat($(cells[3]).text()),
      average_combat_score: cleanStat($(cells[4]).text()),
      kill_deaths: cleanStat($(cells[5]).text()),
      kill_assists_survived_traded: cleanStat($(cells[6]).text()),
      average_damage_per_round: cleanStat($(cells[7]).text()),
      kills_per_round: cleanStat($(cells[8]).text()),
      assists_per_round: cleanStat($(cells[9]).text()),
      first_kills_per_round: cleanStat($(cells[10]).text()),
      first_deaths_per_round: cleanStat($(cells[11]).text()),
      headshot_percentage: cleanStat($(cells[12]).text()),
      clutch_success_percentage: cleanStat($(cells[13]).text()),
    };
    
    players.push(player);
  });
  
  return players;
}

function discoverSnapshotFiles(): string[] {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    return [];
  }
  
  const allFiles = fs.readdirSync(SNAPSHOTS_DIR)
    .filter(f => f.endsWith('.html'))
    .filter(f => {
      const filePath = path.join(SNAPSHOTS_DIR, f);
      const stats = fs.statSync(filePath);
      return stats.size > 0;
    });
  
  const priorityFiles: string[] = [];
  const otherFiles: string[] = [];
  
  for (const file of allFiles) {
    if (PRIORITY_FILES.includes(file)) {
      priorityFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  }
  
  priorityFiles.sort((a, b) => PRIORITY_FILES.indexOf(a) - PRIORITY_FILES.indexOf(b));
  otherFiles.sort();
  
  return [...priorityFiles, ...otherFiles];
}

interface MergeResult {
  players: VlrPlayerStats[];
  sources: string[];
  stats: { file: string; total: number; added: number; skipped: number }[];
}

function mergePlayerStats(files: string[]): MergeResult {
  const playerMap = new Map<string, VlrPlayerStats>();
  const sources: string[] = [];
  const stats: MergeResult['stats'] = [];
  
  for (const file of files) {
    const filePath = path.join(SNAPSHOTS_DIR, file);
    const html = fs.readFileSync(filePath, 'utf-8');
    const filePlayers = parseHtmlStats(html);
    
    let added = 0;
    let skipped = 0;
    
    for (const player of filePlayers) {
      const key = player.player.toLowerCase();
      if (!playerMap.has(key)) {
        playerMap.set(key, player);
        added++;
      } else {
        skipped++;
      }
    }
    
    if (added > 0) {
      sources.push(file);
    }
    
    stats.push({
      file,
      total: filePlayers.length,
      added,
      skipped,
    });
  }
  
  return {
    players: Array.from(playerMap.values()),
    sources,
    stats,
  };
}

function extractTeamRosters(fileContent: string): string {
  const match = fileContent.match(/export const VLR_TEAM_ROSTERS: VlrRosterData = ([\s\S]*?);\s*\n\n/);
  if (match) {
    return match[1];
  }
  
  const fallbackMatch = fileContent.match(/export const VLR_TEAM_ROSTERS: VlrRosterData = (\{[\s\S]*?\});/);
  if (fallbackMatch) {
    return fallbackMatch[1];
  }
  
  return '{}';
}

function extractTotalRosters(fileContent: string): number {
  const match = fileContent.match(/totalRosters:\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function generateTypeScriptFile(
  players: VlrPlayerStats[],
  rostersJson: string,
  totalRosters: number,
  sources: string[]
): string {
  const playersJson = JSON.stringify(players, null, 2);
  const sourcesJson = JSON.stringify(sources);
  
  return `// VLR Player Data Snapshot
// Auto-generated by scripts/update-stats-from-snapshot.ts
// Do not edit manually - re-run the script to update

import type { VlrPlayerStats, VlrTeamRoster, VlrRosterData } from '@/types/vlr';

/**
 * Metadata about when this snapshot was taken
 */
export const VLR_SNAPSHOT_META = {
  fetchedAt: '${new Date().toISOString()}',
  regions: ['all'] as const,
  totalPlayers: ${players.length},
  totalRosters: ${totalRosters},
  sources: ${sourcesJson} as const,
} as const;

/**
 * Static snapshot of VLR player statistics.
 * Keyed by VLR region code (currently only 'all').
 */
export const VLR_PLAYER_STATS: Record<string, VlrPlayerStats[]> = {
  all: ${playersJson}
};

/**
 * Team rosters scraped from VLR team pages.
 * Keyed by full team name (e.g., "Sentinels", "Cloud9").
 * Each roster contains the starting 5 player IGNs.
 */
export const VLR_TEAM_ROSTERS: VlrRosterData = ${rostersJson};

/**
 * Get all players as a flat array.
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

  const lowerPlayerName = playerName.toLowerCase();
  return roster.players.some(p => p.toLowerCase() === lowerPlayerName);
}
`;
}

async function main() {
  log('\n📊 VLR Stats Snapshot Updater', 'cyan');
  log('=============================\n', 'cyan');
  
  log('📁 Discovering snapshot files...', 'cyan');
  const files = discoverSnapshotFiles();
  
  if (files.length === 0) {
    log(`❌ No HTML files found in ${SNAPSHOTS_DIR}`, 'red');
    log('   Add .html files with VLR stats data to the snapshots directory', 'yellow');
    process.exit(1);
  }
  
  const skippedFiles: string[] = [];
  for (const f of fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.endsWith('.html'))) {
    if (!files.includes(f)) {
      skippedFiles.push(f);
    }
  }
  
  log(`  Found: ${files.join(', ')}`, 'green');
  if (skippedFiles.length > 0) {
    log(`  Skipped: ${skippedFiles.join(', ')} (empty)`, 'yellow');
  }
  
  log('\n📖 Processing snapshot files...', 'cyan');
  const { players, sources, stats } = mergePlayerStats(files);
  
  for (const stat of stats) {
    if (stat.added > 0) {
      log(`  ✓ ${stat.file}: ${stat.added} players added`, 'green');
    } else if (stat.total > 0) {
      log(`  - ${stat.file}: ${stat.skipped} duplicates skipped`, 'dim');
    }
  }
  
  log(`\n📊 Total unique players: ${players.length}`, 'magenta');
  
  log('\n📁 Reading existing vlrSnapshot.ts...', 'cyan');
  let rostersJson = '{}';
  let totalRosters = 0;
  
  if (fs.existsSync(OUTPUT_PATH)) {
    const existingContent = fs.readFileSync(OUTPUT_PATH, 'utf-8');
    rostersJson = extractTeamRosters(existingContent);
    totalRosters = extractTotalRosters(existingContent);
    log(`  ✓ Preserved ${totalRosters} team rosters`, 'green');
  } else {
    log('  ⚠ No existing file found, creating new one', 'yellow');
  }
  
  log('\n✍️  Generating vlrSnapshot.ts...', 'cyan');
  const content = generateTypeScriptFile(players, rostersJson, totalRosters, sources);
  fs.writeFileSync(OUTPUT_PATH, content, 'utf-8');
  log(`  ✓ Written to ${OUTPUT_PATH}`, 'green');
  
  log('\n📈 Sample players:', 'dim');
  const samplePlayers = players.slice(0, 5);
  for (const player of samplePlayers) {
    log(`  ${player.player} (${player.org}) - Rating: ${player.rating}`, 'dim');
  }
  
  log(`\n📋 Sources: ${sources.join(', ')}`, 'cyan');
  log('\n✅ Done!\n', 'green');
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}\n`, 'red');
  console.error(error);
});
