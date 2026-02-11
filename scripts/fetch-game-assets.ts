#!/usr/bin/env npx tsx
/**
 * Game Assets Fetcher
 *
 * Fetches agent portraits, weapon images, and event logos from external sources.
 * Uses valorant-api.com for high-quality agent and weapon images, and VLR for event logos.
 *
 * Usage:
 *   npx tsx scripts/fetch-game-assets.ts
 *
 * Or add to package.json scripts:
 *   "fetch-assets": "tsx scripts/fetch-game-assets.ts"
 */

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

// Import slugify from imageAssets.ts
// Note: We need to duplicate it here to avoid ESM import issues in scripts
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

// Valorant API types
interface ValorantAgent {
  uuid: string;
  displayName: string;
  displayIcon: string;
  isPlayableCharacter: boolean;
}

interface ValorantWeapon {
  uuid: string;
  displayName: string;
  displayIcon: string;
}

interface ValorantApiResponse<T> {
  status: number;
  data: T[];
}

// Directory paths
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');
const AGENTS_DIR = path.join(IMAGES_DIR, 'agents');
const WEAPONS_DIR = path.join(IMAGES_DIR, 'weapons');
const EVENTS_DIR = path.join(IMAGES_DIR, 'events');

// VCT 2026 event mappings (event slug -> VLR event ID)
// These IDs will need to be updated once VLR publishes the 2026 events
const VCT_2026_EVENTS: Record<string, number | null> = {
  'vct-2026-americas-kickoff': null,  // TBD
  'vct-2026-emea-kickoff': null,      // TBD
  'vct-2026-pacific-kickoff': null,   // TBD
  'vct-2026-china-kickoff': null,     // TBD
  'vct-2026-americas-stage-1': null,  // TBD
  'vct-2026-emea-stage-1': null,      // TBD
  'vct-2026-pacific-stage-1': null,   // TBD
  'vct-2026-china-stage-1': null,     // TBD
  'vct-2026-masters-santiago': null,  // TBD
  'vct-2026-americas-stage-2': null,  // TBD
  'vct-2026-emea-stage-2': null,      // TBD
  'vct-2026-pacific-stage-2': null,   // TBD
  'vct-2026-china-stage-2': null,     // TBD
  'vct-2026-masters-london': null,    // TBD
  'vct-2026-champions': null,         // TBD
};

/**
 * Ensure a directory exists, creating it if necessary
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${path.relative(process.cwd(), dir)}`);
  }
}

/**
 * Download an image from a URL and save it to disk
 * @param url - Image URL to download
 * @param outputPath - Local file path to save the image
 * @param skipExisting - Skip download if file already exists
 * @returns true if downloaded, false if skipped
 */
async function downloadImage(url: string, outputPath: string, skipExisting = true): Promise<boolean> {
  if (skipExisting && fs.existsSync(outputPath)) {
    return false;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.error(`✗ Failed to download ${url}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Fetch and download agent portraits from valorant-api.com
 */
async function fetchAgents(): Promise<void> {
  console.log('\n📦 Fetching agents from valorant-api.com...');
  ensureDir(AGENTS_DIR);

  try {
    const response = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as ValorantApiResponse<ValorantAgent>;

    let downloaded = 0;
    let skipped = 0;

    for (const agent of data.data) {
      const slug = slugify(agent.displayName);
      const outputPath = path.join(AGENTS_DIR, `${slug}.png`);

      const wasDownloaded = await downloadImage(agent.displayIcon, outputPath);
      if (wasDownloaded) {
        console.log(`  ✓ Downloaded: ${agent.displayName} (${slug}.png)`);
        downloaded++;
      } else {
        skipped++;
      }
    }

    console.log(`✓ Agents complete: ${downloaded} downloaded, ${skipped} skipped`);
  } catch (error) {
    console.error('✗ Failed to fetch agents:', error instanceof Error ? error.message : error);
  }
}

/**
 * Fetch and download weapon images from valorant-api.com
 */
async function fetchWeapons(): Promise<void> {
  console.log('\n📦 Fetching weapons from valorant-api.com...');
  ensureDir(WEAPONS_DIR);

  try {
    const response = await fetch('https://valorant-api.com/v1/weapons');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as ValorantApiResponse<ValorantWeapon>;

    let downloaded = 0;
    let skipped = 0;

    for (const weapon of data.data) {
      // Skip weapons without a displayIcon
      if (!weapon.displayIcon) {
        continue;
      }

      const slug = slugify(weapon.displayName);
      const outputPath = path.join(WEAPONS_DIR, `${slug}.png`);

      const wasDownloaded = await downloadImage(weapon.displayIcon, outputPath);
      if (wasDownloaded) {
        console.log(`  ✓ Downloaded: ${weapon.displayName} (${slug}.png)`);
        downloaded++;
      } else {
        skipped++;
      }
    }

    console.log(`✓ Weapons complete: ${downloaded} downloaded, ${skipped} skipped`);
  } catch (error) {
    console.error('✗ Failed to fetch weapons:', error instanceof Error ? error.message : error);
  }
}

/**
 * Scrape event logo from a VLR event page
 */
async function scrapeEventLogo(eventId: number, eventSlug: string): Promise<boolean> {
  const url = `https://www.vlr.gg/event/${eventId}`;
  const outputPath = path.join(EVENTS_DIR, `${eventSlug}.png`);

  if (fs.existsSync(outputPath)) {
    return false; // Already exists
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Find event logo (typically in .event-header or similar)
    const logoImg = $('.event-header img, .event-desc img').first();
    const logoUrl = logoImg.attr('src');

    if (!logoUrl) {
      console.log(`  ⚠ No logo found for ${eventSlug}`);
      return false;
    }

    // Ensure absolute URL
    const absoluteUrl = logoUrl.startsWith('http') ? logoUrl : `https:${logoUrl}`;

    const wasDownloaded = await downloadImage(absoluteUrl, outputPath, false);
    if (wasDownloaded) {
      console.log(`  ✓ Downloaded: ${eventSlug}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`  ✗ Failed to scrape ${eventSlug}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Fetch and download event logos from VLR
 */
async function fetchEvents(): Promise<void> {
  console.log('\n📦 Fetching event logos from VLR...');
  ensureDir(EVENTS_DIR);

  let downloaded = 0;
  let skipped = 0;

  for (const [eventSlug, eventId] of Object.entries(VCT_2026_EVENTS)) {
    const outputPath = path.join(EVENTS_DIR, `${eventSlug}.png`);

    if (fs.existsSync(outputPath)) {
      skipped++;
      continue;
    }

    if (eventId === null) {
      console.log(`  ⚠ Skipping ${eventSlug} (VLR event ID not yet available)`);
      skipped++;
      continue;
    }

    const wasDownloaded = await scrapeEventLogo(eventId, eventSlug);
    if (wasDownloaded) {
      downloaded++;
    } else {
      skipped++;
    }

    // Be polite to VLR servers
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log(`✓ Events complete: ${downloaded} downloaded, ${skipped} skipped`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🎮 VCT Manager - Game Assets Fetcher');
  console.log('=====================================\n');

  ensureDir(IMAGES_DIR);

  await fetchAgents();
  await fetchWeapons();
  await fetchEvents();

  console.log('\n✅ All done! Image assets ready.');
  console.log(`\nImages saved to: ${path.relative(process.cwd(), IMAGES_DIR)}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
