#!/usr/bin/env npx tsx
/**
 * VLR Meta Pick Rate Updater
 *
 * Parses local VLR agent pick-rate HTML files and updates MAP_AGENT_PREFERENCES
 * and getAgentMetaTier in CompositionEngine.ts with real tournament rankings.
 *
 * Source: Save the full page HTML from https://www.vlr.gg/event/agents/<event_id>
 * into src/data/agentStatsSnapshots/ as e.g. masters_santiago_2026.html
 *
 * Usage:
 *   npx tsx scripts/update-meta-from-pickrates.ts
 *
 * Or:
 *   npm run update-meta
 */

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

const SNAPSHOTS_DIR = path.join(process.cwd(), 'src/data/agentStatsSnapshots');
const OUTPUT_PATH = path.join(process.cwd(), 'src/engine/match/CompositionEngine.ts');
const CURRENT_YEAR = 2026;

// All known game agents — must stay in sync with src/utils/constants.ts ALL_AGENTS
const AGENT_ROLES: Record<string, string> = {
  // Duelists
  Jett: 'Duelist',
  Reyna: 'Duelist',
  Phoenix: 'Duelist',
  Raze: 'Duelist',
  Yoru: 'Duelist',
  Neon: 'Duelist',
  Iso: 'Duelist',
  Waylay: 'Duelist',
  // Initiators
  Sova: 'Initiator',
  Breach: 'Initiator',
  Skye: 'Initiator',
  'KAY/O': 'Initiator',
  Fade: 'Initiator',
  Gekko: 'Initiator',
  Tejo: 'Initiator',
  // Controllers
  Brimstone: 'Controller',
  Omen: 'Controller',
  Viper: 'Controller',
  Astra: 'Controller',
  Harbor: 'Controller',
  Clove: 'Controller',
  // Sentinels
  Sage: 'Sentinel',
  Cypher: 'Sentinel',
  Killjoy: 'Sentinel',
  Chamber: 'Sentinel',
  Deadlock: 'Sentinel',
  Vyse: 'Sentinel',
  Veto: 'Sentinel',
};

const ALL_AGENTS = Object.keys(AGENT_ROLES);

// Role order used when appending agents with no tournament data
const ROLE_ORDER = ['Duelist', 'Initiator', 'Controller', 'Sentinel'];

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

/**
 * Normalize a raw agent name from VLR HTML to the canonical game name.
 * Handles kayo → KAY/O; everything else is title-cased and validated.
 */
function normalizeAgentName(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  const special: Record<string, string> = {
    kayo: 'KAY/O',
    'kay/o': 'KAY/O',
  };
  if (special[lower]) return special[lower];
  // Try exact case-insensitive match against known agents
  const found = ALL_AGENTS.find(a => a.toLowerCase() === lower);
  return found ?? null;
}

function extractYearFromFilename(filename: string): number | null {
  const match = filename.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Newer files get higher weight. Files from CURRENT_YEAR = 1.0,
 * one year old = 0.7, two years old = 0.4, etc.
 */
function getFileWeight(filename: string): number {
  const year = extractYearFromFilename(filename);
  if (year === null) return 1.0;
  return Math.max(0.1, 1 - (CURRENT_YEAR - year) * 0.3);
}

interface MapPickRates {
  [agentName: string]: number; // pick rate 0-100
}

interface TournamentData {
  [mapName: string]: MapPickRates;
}

/**
 * Parse a VLR agent pick-rate HTML page.
 * Table selector: table.wf-table.mod-pr-global
 * Agent columns identified by <th> containing <img title="AgentName">
 * Map rows: <tr class="pr-global-row"> (skip mod-all = overall row)
 * Pick rate cells: <td class="mod-color-sq mod-center"> with text "62%"
 */
function parseTournamentHtml(html: string): TournamentData {
  const $ = cheerio.load(html);
  const result: TournamentData = {};

  const table = $('table.wf-table.mod-pr-global');
  if (table.length === 0) return result;

  // Build agent column index map from header row (no <thead> wrapper in VLR HTML)
  // Agent name is extracted from the img src: /img/vlr/game/agents/yoru.png → "yoru"
  const agentColumns: { colIndex: number; agentName: string }[] = [];
  table.find('tr').first().find('th').each((colIndex, th) => {
    const img = $(th).find('img');
    if (img.length === 0) return;
    const src = img.attr('src') ?? '';
    const match = src.match(/\/agents\/([a-z]+)\.png/i);
    if (!match) return;
    const normalized = normalizeAgentName(match[1]);
    if (normalized) {
      agentColumns.push({ colIndex, agentName: normalized });
    }
  });

  if (agentColumns.length === 0) return result;

  // Parse each per-map row
  table.find('tbody tr.pr-global-row').each((_, row) => {
    const $row = $(row);
    if ($row.hasClass('mod-all')) return; // skip the overall row

    const cells = $row.find('td');

    // Map name: first cell, text after the <span class="map-pseudo-icon">
    const firstCell = $(cells[0]).clone();
    firstCell.find('span').remove();
    const mapNameRaw = firstCell.text().trim();
    if (!mapNameRaw) return;

    // Title-case the map name (VLR sometimes uses all-caps or mixed)
    const mapName = mapNameRaw.charAt(0).toUpperCase() + mapNameRaw.slice(1).toLowerCase();
    // Handle multi-word map names (e.g. "PEARL" → "Pearl" is fine, but just in case)
    const finalMapName = mapNameRaw.length > 1
      ? mapNameRaw.charAt(0).toUpperCase() + mapNameRaw.slice(1)
      : mapName;

    const pickRates: MapPickRates = {};
    agentColumns.forEach(({ colIndex, agentName }) => {
      const cell = $(cells[colIndex]);
      const text = cell.text().trim().replace('%', '').trim();
      const rate = parseFloat(text);
      if (!isNaN(rate)) {
        pickRates[agentName] = rate;
      }
    });

    if (Object.keys(pickRates).length > 0) {
      // Merge if map already seen (multiple rows for same map from different sections)
      if (result[finalMapName]) {
        for (const [agent, rate] of Object.entries(pickRates)) {
          if (result[finalMapName][agent] === undefined || rate > result[finalMapName][agent]) {
            result[finalMapName][agent] = rate;
          }
        }
      } else {
        result[finalMapName] = pickRates;
      }
    }
  });

  return result;
}

/**
 * Aggregate pick rates across multiple tournament files using recency weighting.
 */
function aggregatePickRates(files: string[]): TournamentData {
  const raw: Record<string, Record<string, { weightedSum: number; totalWeight: number }>> = {};

  for (const file of files) {
    const filePath = path.join(SNAPSHOTS_DIR, file);
    const html = fs.readFileSync(filePath, 'utf-8');
    const data = parseTournamentHtml(html);
    const weight = getFileWeight(file);

    log(`  Parsing ${file} (weight: ${weight.toFixed(2)}) — ${Object.keys(data).length} maps found`, 'dim');

    for (const [mapName, pickRates] of Object.entries(data)) {
      if (!raw[mapName]) raw[mapName] = {};
      for (const [agent, rate] of Object.entries(pickRates)) {
        if (!raw[mapName][agent]) raw[mapName][agent] = { weightedSum: 0, totalWeight: 0 };
        raw[mapName][agent].weightedSum += rate * weight;
        raw[mapName][agent].totalWeight += weight;
      }
    }
  }

  const result: TournamentData = {};
  for (const [mapName, agents] of Object.entries(raw)) {
    result[mapName] = {};
    for (const [agent, { weightedSum, totalWeight }] of Object.entries(agents)) {
      result[mapName][agent] = weightedSum / totalWeight;
    }
  }
  return result;
}

/**
 * Build a ranked agent list for a map.
 * Agents with tournament pick rate data come first (sorted descending).
 * Remaining known game agents (never seen in any tournament data) are
 * appended at the end, grouped by role.
 */
function buildRankedList(mapPickRates: MapPickRates): string[] {
  const seen = new Set<string>();
  const ranked: string[] = [];

  // Sort seen agents by weighted pick rate descending
  const withRates = Object.entries(mapPickRates)
    .filter(([agent]) => AGENT_ROLES[agent]) // only known game agents
    .sort(([, a], [, b]) => b - a);

  for (const [agent] of withRates) {
    ranked.push(agent);
    seen.add(agent);
  }

  // Append remaining known agents (0% pick rate in all tournaments) by role order
  for (const role of ROLE_ORDER) {
    for (const agent of ALL_AGENTS) {
      if (AGENT_ROLES[agent] === role && !seen.has(agent)) {
        ranked.push(agent);
        seen.add(agent);
      }
    }
  }

  return ranked;
}

/**
 * Parse existing MAP_AGENT_PREFERENCES from CompositionEngine.ts source.
 * Returns a map of mapName → agent array so we can preserve non-tournament maps.
 */
function parseExistingPreferences(content: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const start = content.indexOf('export const MAP_AGENT_PREFERENCES:');
  if (start === -1) return result;
  const end = content.indexOf('\n};', start) + 3;
  const block = content.slice(start, end);

  const lineRegex = /^\s+(\w+):\s*\[([^\]]*)\],/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(block)) !== null) {
    const mapName = match[1];
    const agents = match[2]
      .split(',')
      .map(s => s.trim().replace(/^'|'$/g, ''))
      .filter(Boolean);
    if (agents.length > 0) result[mapName] = agents;
  }
  return result;
}

/**
 * Pad an existing (short) agent list to 28 agents by appending any missing
 * known agents in role order.
 */
function padToFull(existing: string[]): string[] {
  const seen = new Set(existing);
  const result = [...existing];
  for (const role of ROLE_ORDER) {
    for (const agent of ALL_AGENTS) {
      if (AGENT_ROLES[agent] === role && !seen.has(agent)) {
        result.push(agent);
        seen.add(agent);
      }
    }
  }
  return result;
}

function generateMapPreferencesBlock(maps: Record<string, string[]>): string {
  const lines = Object.entries(maps).map(([mapName, agents]) => {
    const agentList = agents.map(a => `'${a}'`).join(', ');
    return `  ${mapName}: [${agentList}],`;
  });
  return `export const MAP_AGENT_PREFERENCES: Record<string, string[]> = {\n${lines.join('\n')}\n};`;
}

const NEW_TIER_FUNCTION = `export function getAgentMetaTier(agent: string, rankings: string[]): 'S' | 'A' | 'B' | 'C' | 'D' {
  const pos = rankings.indexOf(agent);
  if (pos === 0) return 'S';
  if (pos <= 2) return 'A';
  if (pos <= 7) return 'B';
  if (pos <= 15) return 'C';
  return 'D';
}`;

const NEW_TIER_JSDOC = `/**
 * Converts a position in the meta rankings to a tier label.
 * Rankings cover all agents per map (28 total).
 * Position 0 = S, 1–2 = A, 3–7 = B, 8–15 = C, 16+ = D.
 */`;

function discoverFiles(): string[] {
  if (!fs.existsSync(SNAPSHOTS_DIR)) return [];
  return fs.readdirSync(SNAPSHOTS_DIR)
    .filter(f => f.endsWith('.html'))
    .filter(f => fs.statSync(path.join(SNAPSHOTS_DIR, f)).size > 0)
    .sort((a, b) => {
      const yearA = extractYearFromFilename(a) ?? 0;
      const yearB = extractYearFromFilename(b) ?? 0;
      return yearB - yearA; // newer first
    });
}

async function main() {
  log('\n🗺️  VLR Meta Pick Rate Updater', 'cyan');
  log('==============================\n', 'cyan');

  const files = discoverFiles();
  if (files.length === 0) {
    log(`❌ No HTML files found in ${SNAPSHOTS_DIR}`, 'red');
    log('   Drop VLR pick-rate HTML files into src/data/agentStatsSnapshots/', 'yellow');
    log('   Source: https://www.vlr.gg/event/agents/<event_id>', 'yellow');
    process.exit(1);
  }

  log(`📁 Found files: ${files.join(', ')}`, 'green');
  log('', 'reset');

  log('📖 Parsing pick rate data...', 'cyan');
  const aggregated = aggregatePickRates(files);
  const mapCount = Object.keys(aggregated).length;
  log(`\n  ✓ Aggregated data for ${mapCount} maps`, 'green');

  for (const [mapName, rates] of Object.entries(aggregated)) {
    const topAgents = Object.entries(rates)
      .filter(([a]) => AGENT_ROLES[a])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([a, r]) => `${a} (${r.toFixed(0)}%)`)
      .join(', ');
    log(`    ${mapName}: ${topAgents}`, 'dim');
  }

  log('\n🏆 Building ranked agent lists per map...', 'cyan');
  const mapPreferences: Record<string, string[]> = {};
  for (const [mapName, rates] of Object.entries(aggregated)) {
    const ranked = buildRankedList(rates);
    mapPreferences[mapName] = ranked;
    log(`  ${mapName}: ${ranked.length} agents (S=${ranked[0]}, A=${ranked[1]}/${ranked[2]})`, 'dim');
  }

  log('\n✍️  Updating CompositionEngine.ts...', 'cyan');
  let content = fs.readFileSync(OUTPUT_PATH, 'utf-8');

  // Read existing preferences so we can preserve non-tournament maps
  const existingPrefs = parseExistingPreferences(content);

  // Merge: start with existing (padded to 28), then override with tournament data
  const finalPreferences: Record<string, string[]> = {};

  // Preserve existing non-tournament maps (padded to 28 agents)
  for (const [mapName, agents] of Object.entries(existingPrefs)) {
    finalPreferences[mapName] = padToFull(agents);
  }

  // Override / add tournament maps
  for (const [mapName, agents] of Object.entries(mapPreferences)) {
    finalPreferences[mapName] = agents;
  }

  const newMaps = Object.keys(mapPreferences).filter(m => !existingPrefs[m]);
  const updatedMaps = Object.keys(mapPreferences).filter(m => existingPrefs[m]);
  const preservedMaps = Object.keys(existingPrefs).filter(m => !mapPreferences[m]);

  if (newMaps.length > 0) log(`  + New maps added: ${newMaps.join(', ')}`, 'green');
  if (updatedMaps.length > 0) log(`  ↺ Updated from tournament: ${updatedMaps.join(', ')}`, 'green');
  if (preservedMaps.length > 0) log(`  ✓ Preserved (no tournament data): ${preservedMaps.join(', ')}`, 'dim');

  // --- Replace MAP_AGENT_PREFERENCES block ---
  const prefsStart = content.indexOf('export const MAP_AGENT_PREFERENCES:');
  if (prefsStart === -1) {
    log('  ❌ Could not find MAP_AGENT_PREFERENCES in CompositionEngine.ts', 'red');
    process.exit(1);
  }
  const prefsEnd = content.indexOf('\n};', prefsStart) + 3; // +3 to include \n};
  const newPrefsBlock = generateMapPreferencesBlock(finalPreferences);
  content = content.slice(0, prefsStart) + newPrefsBlock + content.slice(prefsEnd);
  log('  ✓ Updated MAP_AGENT_PREFERENCES', 'green');

  // Update the JSDoc comment above MAP_AGENT_PREFERENCES
  content = content.replace(
    ' * Map-specific agent preferences (some agents are better on certain maps)',
    ' * Map-specific agent preferences — rankings derived from VLR tournament pick rate data.\n * Index 0 = best meta pick (S-tier), index 27 = worst (D-tier).',
  );

  // --- Replace getAgentMetaTier function ---
  const tierFuncStart = content.indexOf('export function getAgentMetaTier(');
  if (tierFuncStart === -1) {
    log('  ⚠ Could not find getAgentMetaTier — skipping tier threshold update', 'yellow');
  } else {
    const tierFuncEnd = content.indexOf('\n}', tierFuncStart) + 2;
    content = content.slice(0, tierFuncStart) + NEW_TIER_FUNCTION + content.slice(tierFuncEnd);
    log('  ✓ Updated getAgentMetaTier thresholds (S/A/B/C/D → 1/2/5/8/12 per map)', 'green');

    // Replace the JSDoc comment above getAgentMetaTier
    const oldJsdocMarker = '* Converts a position in the meta rankings to a tier label.\n * Position 0 = S, 1 = A, 2 = B, 3–4 = C, not in top 5 = D.';
    if (content.includes(oldJsdocMarker)) {
      content = content.replace(
        oldJsdocMarker,
        '* Converts a position in the meta rankings to a tier label.\n * Rankings cover all agents per map (28 total).\n * Position 0 = S, 1–2 = A, 3–7 = B, 8–15 = C, 16+ = D.',
      );
      log('  ✓ Updated getAgentMetaTier JSDoc', 'green');
    }
  }

  // Update getMetaAgentRankings JSDoc to reflect new range
  content = content.replace(
    'Index 0 = highest priority (S-tier), index 4 = lowest (C-tier).',
    'Index 0 = highest priority (S-tier), index 27 = lowest (D-tier).',
  );

  fs.writeFileSync(OUTPUT_PATH, content, 'utf-8');
  log(`\n  ✓ Written to ${OUTPUT_PATH}`, 'green');

  log(`\n📊 Total maps in preferences: ${Object.keys(finalPreferences).length}`, 'magenta');
  log('\n✅ Done! Run the dev server to see updated agent tier badges.\n', 'green');
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}\n`, 'red');
  console.error(error);
});
