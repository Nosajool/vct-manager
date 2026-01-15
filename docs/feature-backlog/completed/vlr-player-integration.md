# VLR Player Data Integration

## Overview

**Feature Name**: Real Player Data Integration
**Priority**: High
**Target Release**: Phase 8

## Problem Statement

The VCT Manager uses procedural generation (`PlayerGenerator.ts`) to create ~400 fictional players with randomized stats. This results in:

- No connection to the actual VCT ecosystem
- Match outcomes that don't reflect real competitive standings
- Players that don't correspond to known professional players
- Limited immersion for fans familiar with the VCT scene

## Solution

Use a **static snapshot approach**: a CLI script fetches data from the [vlrggapi](https://github.com/axsddlr/vlrggapi) and generates a TypeScript data file that gets committed to the repo. The game imports this static snapshot at build time.

**API Base URL**: `https://vlrggapi.vercel.app`

### Why Static Snapshot?

| Runtime Fetch | Static Snapshot |
|---------------|-----------------|
| API dependency at game start | No runtime API calls |
| Slower startup (network latency) | Instant - data is bundled |
| API downtime breaks the game | Always works |
| Harder to curate/validate | Can review before committing |
| Cache invalidation complexity | Simple: re-run script when needed |

### Data Flow

```
VLR API → scripts/fetch-vlr-data.ts → src/data/vlrSnapshot.ts → GameInitService
                    ↓
              (run manually when you want fresh data)
```

## Goals

1. **Authenticity** - Use real VCT player names and team rosters
2. **Accuracy** - Derive game stats from actual tournament performance metrics
3. **Simplicity** - Static import, no runtime API complexity
4. **Compatibility** - Maintain full compatibility with existing `Player` and `Team` interfaces

---

## Architecture Alignment

This feature follows the established architecture from `docs/vct_manager_game_technical_specification.md`:

| Principle | How VLR Integration Follows It |
|-----------|-------------------------------|
| **Engine classes are pure** | `VlrDataProcessor`, `statConverter` have no React or store dependencies |
| **Static data** | VLR snapshot is a TypeScript module imported at build time |
| **Normalized data** | Players returned as `Player[]` for direct store insertion via `addPlayers()` |
| **Dates as ISO strings** | All date fields (e.g., `contract.endDate`) use ISO format |

### File Structure

```
scripts/
└── fetch-vlr-data.ts          # CLI script to fetch and generate snapshot

src/
├── types/
│   └── vlr.ts                  # VLR API type definitions
├── data/
│   └── vlrSnapshot.ts          # Generated static snapshot (committed to repo)
└── engine/player/vlr/
    ├── orgMapping.ts           # VLR org → team name mapping
    ├── statConverter.ts        # VLR stats → PlayerStats conversion
    ├── VlrDataProcessor.ts     # Transforms snapshot to Player[]
    └── index.ts
```

---

## Technical Design

### VLR API Types

The API provides player statistics in this format:

```typescript
// src/types/vlr.ts

/** VLR API region parameter values */
export type VlrRegion = 'na' | 'eu' | 'ap' | 'la' | 'la-s' | 'la-n' | 'oce' | 'kr' | 'mn' | 'gc' | 'br' | 'cn';

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
  player: string;                          // IGN (e.g., "TenZ")
  org: string;                             // Team abbreviation (e.g., "SEN")
  agents: string;                          // Most played agents
  rounds_played: string;                   // Total rounds
  rating: string;                          // VLR rating (e.g., "1.18")
  average_combat_score: string;            // ACS (e.g., "235.2")
  kill_deaths: string;                     // K/D ratio (e.g., "1.19")
  kill_assists_survived_traded: string;    // KAST % (e.g., "72%")
  average_damage_per_round: string;        // ADR (e.g., "158.4")
  kills_per_round: string;                 // KPR (e.g., "0.81")
  assists_per_round: string;               // APR (e.g., "0.29")
  first_kills_per_round: string;           // FKPR (e.g., "0.19")
  first_deaths_per_round: string;          // FDPR (e.g., "0.13")
  headshot_percentage: string;             // HS% (e.g., "26%")
  clutch_success_percentage: string;       // Clutch % (e.g., "28%")
}

/** Team ranking from VLR API /rankings endpoint */
export interface VlrTeamRanking {
  rank: string;
  team: string;                            // Full team name
  country: string;                         // Country code
  last_played: string;
  last_played_team: string;
  last_played_team_logo: string;
  record: string;                          // W-L record
  earnings: string;
  logo: string;
}

/** API response wrapper */
export interface VlrApiResponse<T> {
  data: T[];
  status: number;
}
```

### Org Name Mapping

The VLR API uses abbreviated org names that must be mapped to our `VCT_TEAMS` names:

```typescript
// src/engine/player/vlr/orgMapping.ts

/**
 * Maps VLR org abbreviations to game team names.
 * VLR uses short forms like "SEN", "C9" while the game uses full names.
 */
export const VLR_ORG_TO_TEAM_NAME: Record<string, string> = {
  // Americas
  SEN: 'Sentinels',
  C9: 'Cloud9',
  '100T': '100 Thieves',
  NRG: 'NRG',
  EG: 'Evil Geniuses',
  LOUD: 'LOUD',
  FUR: 'FURIA',
  MIBR: 'MIBR',
  LEV: 'Leviatán',
  KRU: 'KRÜ Esports',
  G2: 'G2 Esports',
  '2G': '2GAME Esports',

  // EMEA
  FNC: 'Fnatic',
  TL: 'Team Liquid',
  VIT: 'Team Vitality',
  KC: 'Karmine Corp',
  TH: 'Team Heretics',
  NAVI: 'NAVI',
  FUT: 'FUT Esports',
  BBL: 'BBL Esports',
  GIA: 'Giants Gaming',
  KOI: 'KOI',
  M8: 'Gentle Mates',
  APK: 'Apeks',

  // Pacific
  PRX: 'Paper Rex',
  DRX: 'DRX',
  T1: 'T1',
  GEN: 'Gen.G',
  ZETA: 'ZETA DIVISION',
  DFM: 'DetonatioN Gaming',
  GE: 'Global Esports',
  TS: 'Team Secret',
  TLN: 'Talon Esports',
  RRQ: 'Rex Regum Qeon',
  BLD: 'BLEED Esports',
  NS: 'Nongshim RedForce',

  // China
  EDG: 'EDward Gaming',
  BLG: 'Bilibili Gaming',
  FPX: 'FunPlus Phoenix',
  JDG: 'JD Gaming',
  NOVA: 'Nova Esports',
  AG: 'All Gamers',
  DRG: 'Dragon Ranger Gaming',
  WOL: 'Wolves Esports',
  TEC: 'Titan Esports Club',
  TYL: 'TYLOO',
  TE: 'Trace Esports',
  ASE: 'Attacking Soul Esports',
};

/** Reverse lookup: team name to VLR org */
export const TEAM_NAME_TO_VLR_ORG = Object.fromEntries(
  Object.entries(VLR_ORG_TO_TEAM_NAME).map(([k, v]) => [v, k])
);
```

---

### Stat Conversion Algorithm

The core challenge is converting VLR's performance metrics to the game's `PlayerStats` interface. The algorithm uses normalized percentile-based conversion.

```typescript
// src/engine/player/vlr/statConverter.ts

import type { PlayerStats } from '@/types/player';
import type { VlrPlayerStats } from '@/types/vlr';

/** Statistical ranges observed in VLR data for normalization */
const VLR_STAT_RANGES = {
  rating: { min: 0.7, max: 1.5, median: 1.0 },
  acs: { min: 150, max: 300, median: 210 },
  kd: { min: 0.6, max: 1.6, median: 1.0 },
  kast: { min: 0.55, max: 0.85, median: 0.70 },
  adr: { min: 100, max: 200, median: 145 },
  kpr: { min: 0.5, max: 1.0, median: 0.72 },
  fkpr: { min: 0.05, max: 0.25, median: 0.12 },
  fdpr: { min: 0.05, max: 0.20, median: 0.10 },
  hs: { min: 0.15, max: 0.40, median: 0.25 },
  clutch: { min: 0.10, max: 0.45, median: 0.22 },
};

/** Parse VLR stat string to number */
function parseVlrStat(value: string): number {
  return parseFloat(value.replace('%', '')) / (value.includes('%') ? 100 : 1);
}

/** Normalize a value to 0-100 scale based on observed ranges */
function normalize(value: number, range: { min: number; max: number }): number {
  const clamped = Math.max(range.min, Math.min(range.max, value));
  const normalized = ((clamped - range.min) / (range.max - range.min)) * 100;
  return Math.round(Math.max(40, Math.min(99, normalized))); // Game uses 40-99 range
}

/** Weighted combination of normalized stats */
function combine(weights: Record<string, number>, values: Record<string, number>): number {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const weighted = Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + (values[key] ?? 50) * weight,
    0
  );
  return Math.round(weighted / total);
}

/**
 * Converts VLR player statistics to game PlayerStats.
 *
 * Mapping rationale:
 * - mechanics: Based on ACS, headshot %, and K/D - raw fragging ability
 * - igl: Inferred from KAST and survival - team-oriented play patterns
 * - mental: Based on K/D consistency and clutch % - composure under pressure
 * - clutch: Directly from clutch success % with rating modifier
 * - vibes: Derived from team performance correlation (approximated)
 * - lurking: Inverse of FKPR - players who don't entry often lurk
 * - entry: Directly from FKPR with ACS modifier
 * - support: Based on APR and KAST - utility and team contribution
 * - stamina: Based on rating consistency (approximated from overall rating)
 */
export function convertVlrToGameStats(vlr: VlrPlayerStats): PlayerStats {
  // Parse all stats
  const parsed = {
    rating: parseVlrStat(vlr.rating),
    acs: parseVlrStat(vlr.average_combat_score),
    kd: parseVlrStat(vlr.kill_deaths),
    kast: parseVlrStat(vlr.kill_assists_survived_traded),
    adr: parseVlrStat(vlr.average_damage_per_round),
    kpr: parseVlrStat(vlr.kills_per_round),
    apr: parseVlrStat(vlr.assists_per_round),
    fkpr: parseVlrStat(vlr.first_kills_per_round),
    fdpr: parseVlrStat(vlr.first_deaths_per_round),
    hs: parseVlrStat(vlr.headshot_percentage),
    clutch: parseVlrStat(vlr.clutch_success_percentage),
  };

  // Normalize to 0-100 scale
  const norm = {
    rating: normalize(parsed.rating, VLR_STAT_RANGES.rating),
    acs: normalize(parsed.acs, VLR_STAT_RANGES.acs),
    kd: normalize(parsed.kd, VLR_STAT_RANGES.kd),
    kast: normalize(parsed.kast, VLR_STAT_RANGES.kast),
    adr: normalize(parsed.adr, VLR_STAT_RANGES.adr),
    kpr: normalize(parsed.kpr, VLR_STAT_RANGES.kpr),
    fkpr: normalize(parsed.fkpr, VLR_STAT_RANGES.fkpr),
    fdpr: normalize(parsed.fdpr, VLR_STAT_RANGES.fdpr),
    hs: normalize(parsed.hs, VLR_STAT_RANGES.hs),
    clutch: normalize(parsed.clutch, VLR_STAT_RANGES.clutch),
  };

  // Compute inverse stats (low FKPR = high lurking tendency)
  const invFkpr = 100 - norm.fkpr;
  const fkFdRatio = norm.fkpr / Math.max(norm.fdpr, 1); // First kill efficiency

  return {
    mechanics: combine(
      { acs: 0.4, hs: 0.3, kd: 0.3 },
      { acs: norm.acs, hs: norm.hs, kd: norm.kd }
    ),
    igl: combine(
      { kast: 0.5, rating: 0.3, adr: 0.2 },
      { kast: norm.kast, rating: norm.rating, adr: norm.adr }
    ),
    mental: combine(
      { kd: 0.4, clutch: 0.4, rating: 0.2 },
      { kd: norm.kd, clutch: norm.clutch, rating: norm.rating }
    ),
    clutch: combine(
      { clutch: 0.7, kd: 0.2, rating: 0.1 },
      { clutch: norm.clutch, kd: norm.kd, rating: norm.rating }
    ),
    vibes: combine(
      { kast: 0.4, rating: 0.4, kd: 0.2 },
      { kast: norm.kast, rating: norm.rating, kd: norm.kd }
    ),
    lurking: combine(
      { invFkpr: 0.5, kast: 0.3, kd: 0.2 },
      { invFkpr, kast: norm.kast, kd: norm.kd }
    ),
    entry: combine(
      { fkpr: 0.5, acs: 0.3, fkFdRatio: 0.2 },
      { fkpr: norm.fkpr, acs: norm.acs, fkFdRatio: Math.min(fkFdRatio * 25, 100) }
    ),
    support: combine(
      { kast: 0.4, apr: 0.4, rating: 0.2 },
      { kast: norm.kast, apr: normalize(parsed.apr, { min: 0.1, max: 0.5 }), rating: norm.rating }
    ),
    stamina: combine(
      { rating: 0.5, kast: 0.3, kd: 0.2 },
      { rating: norm.rating, kast: norm.kast, kd: norm.kd }
    ),
  };
}
```

---

### Architecture

The integration follows the existing engine pattern with pure classes and a service layer:

```
src/
├── types/
│   └── vlr.ts                    # VLR API type definitions
│
├── engine/player/vlr/
│   ├── VlrApiClient.ts           # HTTP client for VLR API
│   ├── VlrDataProcessor.ts       # Transforms VLR data to Player[]
│   ├── statConverter.ts          # VLR stats → PlayerStats conversion
│   ├── orgMapping.ts             # VLR org → team name mapping
│   └── index.ts                  # Barrel export
│
├── services/
│   └── VlrDataService.ts         # Orchestrates fetch, cache, fallback
│
└── db/
    └── vlrCache.ts               # IndexedDB cache for VLR data
```

#### VlrApiClient

```typescript
// src/engine/player/vlr/VlrApiClient.ts

import type { VlrApiResponse, VlrPlayerStats, VlrTeamRanking, VlrRegion } from '@/types/vlr';

const API_BASE = 'https://vlrggapi.vercel.app';
const REQUEST_TIMEOUT = 10000; // 10 seconds

export class VlrApiClient {
  private abortController: AbortController | null = null;

  /** Check if API is available */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /** Fetch player stats for a region */
  async getPlayerStats(region: VlrRegion): Promise<VlrPlayerStats[]> {
    const url = `${API_BASE}/stats?region=${region}&timespan=all`;
    const response = await this.fetchWithTimeout(url);
    const data: VlrApiResponse<VlrPlayerStats> = await response.json();
    return data.data ?? [];
  }

  /** Fetch team rankings for a region */
  async getTeamRankings(region: VlrRegion): Promise<VlrTeamRanking[]> {
    const url = `${API_BASE}/rankings?region=${region}`;
    const response = await this.fetchWithTimeout(url);
    const data: VlrApiResponse<VlrTeamRanking> = await response.json();
    return data.data ?? [];
  }

  /** Fetch all stats across regions in parallel */
  async getAllPlayerStats(): Promise<Map<VlrRegion, VlrPlayerStats[]>> {
    const regions: VlrRegion[] = ['na', 'eu', 'br', 'ap', 'kr', 'cn'];
    const results = await Promise.allSettled(
      regions.map(async (region) => ({
        region,
        stats: await this.getPlayerStats(region),
      }))
    );

    const statsByRegion = new Map<VlrRegion, VlrPlayerStats[]>();
    for (const result of results) {
      if (result.status === 'fulfilled') {
        statsByRegion.set(result.value.region, result.value.stats);
      }
    }
    return statsByRegion;
  }

  /** Cancel any in-flight requests */
  cancel(): void {
    this.abortController?.abort();
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    this.abortController = new AbortController();
    const response = await fetch(url, {
      signal: this.abortController.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`VLR API error: ${response.status} ${response.statusText}`);
    }
    return response;
  }
}

export const vlrApiClient = new VlrApiClient();
```

#### VlrDataProcessor

```typescript
// src/engine/player/vlr/VlrDataProcessor.ts

import { v4 as uuid } from 'uuid';
import type { Player, Region } from '@/types/player';
import type { VlrPlayerStats, VlrRegion } from '@/types/vlr';
import { convertVlrToGameStats } from './statConverter';
import { VLR_ORG_TO_TEAM_NAME, VLR_TO_GAME_REGION } from './orgMapping';
import { VCT_TEAMS } from '@/utils/constants';
import { playerGenerator } from '../PlayerGenerator';

interface ProcessedData {
  players: Player[];
  unmatchedOrgs: string[]; // VLR orgs not found in VCT_TEAMS
}

export class VlrDataProcessor {
  private teamIdsByName: Map<string, string>;

  constructor(teamIdsByName: Map<string, string>) {
    this.teamIdsByName = teamIdsByName;
  }

  /**
   * Process VLR stats into game Player entities.
   * Players are matched to existing teams via org name mapping.
   */
  processPlayerStats(
    statsByRegion: Map<VlrRegion, VlrPlayerStats[]>
  ): ProcessedData {
    const players: Player[] = [];
    const unmatchedOrgs = new Set<string>();

    for (const [vlrRegion, stats] of statsByRegion) {
      const gameRegion = VLR_TO_GAME_REGION[vlrRegion];

      for (const vlrPlayer of stats) {
        const teamName = VLR_ORG_TO_TEAM_NAME[vlrPlayer.org];

        if (!teamName) {
          unmatchedOrgs.add(vlrPlayer.org);
          continue;
        }

        const teamId = this.teamIdsByName.get(teamName);
        if (!teamId) continue; // Team not in current game

        const player = this.createPlayerFromVlr(vlrPlayer, gameRegion, teamId);
        players.push(player);
      }
    }

    return { players, unmatchedOrgs: [...unmatchedOrgs] };
  }

  private createPlayerFromVlr(
    vlr: VlrPlayerStats,
    region: Region,
    teamId: string
  ): Player {
    const stats = convertVlrToGameStats(vlr);
    const overall = playerGenerator.calculateOverall(stats);

    // Estimate age based on rating (higher rated = likely in prime years)
    const ratingNum = parseFloat(vlr.rating);
    const estimatedAge = Math.round(22 + (1.1 - ratingNum) * 5);
    const age = Math.max(18, Math.min(30, estimatedAge));

    return {
      id: uuid(),
      name: vlr.player,
      age,
      nationality: this.inferNationality(region),
      region,
      teamId,
      stats,
      form: Math.round(50 + (ratingNum - 1) * 30), // Rating influences form
      morale: 70 + Math.floor(Math.random() * 20),
      potential: Math.min(99, overall + Math.floor(Math.random() * 15)),
      contract: this.generateContract(overall),
      careerStats: this.generateCareerStats(vlr, age),
      preferences: this.generatePreferences(),
    };
  }

  private inferNationality(region: Region): string {
    // Simplified - could be enhanced with actual nationality data
    const nationalities: Record<Region, string[]> = {
      Americas: ['USA', 'Canada', 'Brazil', 'Chile', 'Argentina'],
      EMEA: ['Sweden', 'France', 'UK', 'Turkey', 'Russia'],
      Pacific: ['South Korea', 'Japan', 'Philippines', 'Indonesia', 'Thailand'],
      China: ['China'],
    };
    const options = nationalities[region];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateContract(overall: number): Player['contract'] {
    // Higher rated players get better contracts
    const baseSalary = 50000 + overall * 1000;
    const variance = baseSalary * 0.2;
    return {
      salary: Math.round(baseSalary + (Math.random() - 0.5) * variance),
      bonusPerWin: Math.round(500 + overall * 20),
      yearsRemaining: 1 + Math.floor(Math.random() * 2),
      endDate: new Date(2027, 11, 31).toISOString(),
    };
  }

  private generateCareerStats(
    vlr: VlrPlayerStats,
    age: number
  ): Player['careerStats'] {
    const yearsPlaying = Math.max(1, age - 17);
    const matchesPerYear = 80 + Math.floor(Math.random() * 40);
    const totalMatches = yearsPlaying * matchesPerYear;

    const kd = parseFloat(vlr.kill_deaths);
    const winRate = 0.45 + (kd - 0.9) * 0.15;

    return {
      matchesPlayed: totalMatches,
      wins: Math.round(totalMatches * winRate),
      losses: Math.round(totalMatches * (1 - winRate)),
      avgKills: parseFloat(vlr.kills_per_round) * 24, // Assume 24 rounds avg
      avgDeaths: (parseFloat(vlr.kills_per_round) / kd) * 24,
      avgAssists: parseFloat(vlr.assists_per_round) * 24,
      tournamentsWon: Math.floor(yearsPlaying * winRate * 0.5),
    };
  }

  private generatePreferences(): Player['preferences'] {
    return {
      salaryImportance: 40 + Math.floor(Math.random() * 40),
      teamQualityImportance: 50 + Math.floor(Math.random() * 40),
      regionLoyalty: 30 + Math.floor(Math.random() * 50),
      preferredTeammates: [],
    };
  }
}
```

---

### VlrDataService

Orchestrates the full flow with caching and fallback:

```typescript
// src/services/VlrDataService.ts

import type { Player } from '@/types/player';
import type { VlrPlayerStats, VlrRegion } from '@/types/vlr';
import { vlrApiClient } from '@/engine/player/vlr/VlrApiClient';
import { VlrDataProcessor } from '@/engine/player/vlr/VlrDataProcessor';
import { vlrCache } from '@/db/vlrCache';
import { playerGenerator } from '@/engine/player/PlayerGenerator';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface VlrLoadResult {
  players: Player[];
  source: 'api' | 'cache' | 'generated';
  stale: boolean;
  errors: string[];
}

export class VlrDataService {
  /**
   * Main entry point: load player data with fallback chain.
   *
   * Priority:
   * 1. Fresh API data
   * 2. Cached data (even if stale)
   * 3. Procedural generation
   */
  async loadPlayers(
    teamIdsByName: Map<string, string>
  ): Promise<VlrLoadResult> {
    const errors: string[] = [];

    // Try API first
    try {
      const isHealthy = await vlrApiClient.healthCheck();
      if (isHealthy) {
        const statsByRegion = await vlrApiClient.getAllPlayerStats();
        const processor = new VlrDataProcessor(teamIdsByName);
        const { players, unmatchedOrgs } = processor.processPlayerStats(statsByRegion);

        if (players.length > 0) {
          // Cache the raw data for offline use
          await vlrCache.save(statsByRegion);

          if (unmatchedOrgs.length > 0) {
            errors.push(`Unmatched orgs: ${unmatchedOrgs.join(', ')}`);
          }

          return { players, source: 'api', stale: false, errors };
        }
      }
    } catch (error) {
      errors.push(`API error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // Try cache
    try {
      const cached = await vlrCache.load();
      if (cached) {
        const processor = new VlrDataProcessor(teamIdsByName);
        const { players, unmatchedOrgs } = processor.processPlayerStats(cached.data);
        const isStale = Date.now() - cached.timestamp > CACHE_TTL_MS;

        if (players.length > 0) {
          if (unmatchedOrgs.length > 0) {
            errors.push(`Unmatched orgs: ${unmatchedOrgs.join(', ')}`);
          }
          return { players, source: 'cache', stale: isStale, errors };
        }
      }
    } catch (error) {
      errors.push(`Cache error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // Final fallback: procedural generation
    errors.push('Using procedural generation - VLR data unavailable');
    return {
      players: [], // Will be generated by GameInitService
      source: 'generated',
      stale: false,
      errors,
    };
  }

  /** Force refresh from API, ignoring cache */
  async forceRefresh(teamIdsByName: Map<string, string>): Promise<VlrLoadResult> {
    await vlrCache.clear();
    return this.loadPlayers(teamIdsByName);
  }
}

export const vlrDataService = new VlrDataService();
```

---

### Cache Layer

```typescript
// src/db/vlrCache.ts

import Dexie from 'dexie';
import type { VlrPlayerStats, VlrRegion } from '@/types/vlr';

interface VlrCacheEntry {
  id: 'vlr-data';
  timestamp: number;
  data: Map<VlrRegion, VlrPlayerStats[]>;
}

class VlrCacheDB extends Dexie {
  cache!: Dexie.Table<VlrCacheEntry, string>;

  constructor() {
    super('VlrCacheDB');
    this.version(1).stores({
      cache: 'id',
    });
  }
}

const db = new VlrCacheDB();

export const vlrCache = {
  async save(data: Map<VlrRegion, VlrPlayerStats[]>): Promise<void> {
    // Convert Map to serializable format
    const serialized = Object.fromEntries(data);
    await db.cache.put({
      id: 'vlr-data',
      timestamp: Date.now(),
      data: serialized as any,
    });
  },

  async load(): Promise<{ timestamp: number; data: Map<VlrRegion, VlrPlayerStats[]> } | null> {
    const entry = await db.cache.get('vlr-data');
    if (!entry) return null;

    // Convert back to Map
    const data = new Map(Object.entries(entry.data)) as Map<VlrRegion, VlrPlayerStats[]>;
    return { timestamp: entry.timestamp, data };
  },

  async clear(): Promise<void> {
    await db.cache.delete('vlr-data');
  },

  async isStale(ttlMs: number): Promise<boolean> {
    const entry = await db.cache.get('vlr-data');
    if (!entry) return true;
    return Date.now() - entry.timestamp > ttlMs;
  },
};
```

---

### GameInitService Integration

Modify `GameInitService.ts` to use VLR data:

```typescript
// In GameInitService.ts - modified initializeNewGame method

async initializeNewGame(options: NewGameOptions = {}): Promise<void> {
  playerGenerator.resetUsedNames();

  // Generate teams first (needed for ID mapping)
  const { teams } = teamManager.generateAllTeams({ generatePlayers: false });

  // Build team name → ID mapping for VLR processor
  const teamIdsByName = new Map(teams.map((t) => [t.name, t.id]));

  // Try to load VLR data
  let players: Player[] = [];
  const vlrResult = await vlrDataService.loadPlayers(teamIdsByName);

  if (vlrResult.source !== 'generated' && vlrResult.players.length > 0) {
    players = vlrResult.players;

    // Assign players to teams
    for (const player of players) {
      if (player.teamId) {
        const team = teams.find((t) => t.id === player.teamId);
        if (team && team.playerIds.length < 5) {
          team.playerIds.push(player.id);
        }
      }
    }

    // Fill remaining roster slots with generated players
    for (const team of teams) {
      while (team.playerIds.length < 5) {
        const generated = playerGenerator.generatePlayer({
          region: team.region,
          teamId: team.id,
        });
        players.push(generated);
        team.playerIds.push(generated.id);
      }
    }
  } else {
    // Fallback: use existing procedural generation
    const generated = teamManager.generateAllTeams({ generatePlayers: true });
    players = generated.players;
    teams.length = 0;
    teams.push(...generated.teams);
  }

  // Generate free agents (always procedural)
  const regions: Region[] = ['Americas', 'EMEA', 'Pacific', 'China'];
  const freeAgents = regions.flatMap((region) =>
    playerGenerator.generateFreeAgents(FREE_AGENTS_PER_REGION, region)
  );

  store.addPlayers([...players, ...freeAgents]);
  store.addTeams(teams);

  // ... rest of initialization
}
```

---

## Implementation Phases

### Phase 1: Foundation

- [ ] Create `src/types/vlr.ts` with API type definitions
- [ ] Create `src/engine/player/vlr/orgMapping.ts` with org name mappings
- [ ] Verify org mappings against actual VLR API responses
- [ ] Add unit tests for org name resolution

### Phase 2: API Client

- [ ] Implement `VlrApiClient.ts` with health check and fetch methods
- [ ] Add request timeout and cancellation support
- [ ] Handle rate limiting and error responses
- [ ] Add integration tests against live API

### Phase 3: Stat Conversion

- [ ] Implement `statConverter.ts` with normalization algorithm
- [ ] Tune stat ranges based on actual VLR data analysis
- [ ] Add unit tests covering edge cases (missing stats, outliers)
- [ ] Validate converted stats produce realistic match outcomes

### Phase 4: Data Processing

- [ ] Implement `VlrDataProcessor.ts` for VLR → Player transformation
- [ ] Handle missing player attributes (age, nationality)
- [ ] Add validation for complete roster requirements
- [ ] Test with full dataset from all regions

### Phase 5: Caching

- [ ] Implement `vlrCache.ts` with IndexedDB persistence
- [ ] Add cache TTL checking and refresh logic
- [ ] Handle cache corruption gracefully
- [ ] Test offline functionality

### Phase 6: Service Integration

- [ ] Implement `VlrDataService.ts` orchestration layer
- [ ] Integrate into `GameInitService.ts`
- [ ] Add loading states and progress feedback
- [ ] Test fallback chain (API → cache → procedural)

### Phase 7: Polish

- [ ] Add settings UI for manual cache refresh
- [ ] Show data source indicator in game UI
- [ ] Balance stat conversion based on match simulation testing
- [ ] Performance optimization for large datasets

---

## Success Criteria

- **Data Coverage**: 90%+ of VCT franchised team rosters populated from VLR
- **Startup Time**: < 15 seconds with cached data, < 30 seconds fresh fetch
- **Reliability**: Game starts successfully even when API is unavailable
- **Accuracy**: Top-rated VLR players have highest overall ratings in-game
- **Match Outcomes**: Team win rates correlate with real VCT standings

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| VLR API deprecation | High | Cache layer + procedural fallback |
| API rate limiting | Medium | Request batching, exponential backoff |
| Org name changes | Medium | Fuzzy matching, manual mapping updates |
| Missing player data | Low | Fill gaps with procedural generation |
| Stat conversion imbalance | Medium | Iterative tuning based on simulation testing |

---

## Future Enhancements

- **Roster transactions**: Track player transfers between teams in real-time
- **Historical stats**: Show player performance trends over seasons
- **Map-specific data**: Include map pool performance metrics
- **Agent stats**: Incorporate agent-specific performance for role assignment
- **Nationality data**: Fetch actual player nationalities from VLR profiles
