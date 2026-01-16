# Session Log: VLR Team Roster Scraping

**Date:** 2026-01-16
**Issue:** Team rosters don't match actual VLR.gg rosters

---

## Problem

Team rosters in the game didn't match actual VLR.gg rosters. For example:

| Team | Game Showed | Actual Roster |
|------|-------------|---------------|
| Cloud9 | v1c, penny, runi, OXY, wippie | Xeppaa, v1c, Zellsis, penny, OXY |

This happened because the VLR stats API (`vlrggapi.vercel.app`) returns all players with historical stats for an org, sorted by rating - not the current roster.

## Root Cause

The `vlrggapi` only provides player statistics from the `/stats` endpoint, not roster information. The game was taking the top 5 players by rating from the stats, which:
- Included former players (e.g., wippie, runi)
- Missed new players without stats (e.g., Xeppaa)
- Used rating order instead of actual roster order

The API has no `/team/{id}` endpoint for roster data (returns 404).

## Solution

Added web scraping of VLR.gg team pages to get actual roster data.

### Approach

1. Created a mapping of 48 game team names to VLR.gg team page IDs
2. Updated fetch script to scrape team pages (e.g., `vlr.gg/team/188/cloud9`)
3. Extract player IGNs from `/player/{id}/{ign}` links in HTML
4. Use scraped roster data to build teams instead of sorting by rating

---

## Files Created

### `src/engine/player/vlr/vlrTeamIds.ts`

Maps game team names to VLR.gg team page IDs for all 48 franchised teams:

```typescript
export const VLR_TEAM_IDS: Record<Region, Record<string, number>> = {
  Americas: {
    'Sentinels': 2,
    'Cloud9': 188,
    '100 Thieves': 120,
    // ... 9 more
  },
  EMEA: { /* 12 teams */ },
  Pacific: { /* 12 teams */ },
  China: { /* 12 teams */ },
};
```

---

## Files Modified

### `src/types/vlr.ts`

Added roster types:

```typescript
export interface VlrTeamRoster {
  teamName: string;
  vlrTeamId: number;
  players: string[]; // IGNs of the starting 5
  scrapedAt: string;
}

export type VlrRosterData = Record<string, VlrTeamRoster>;
```

### `scripts/fetch-vlr-data.ts`

Added Phase 2 to fetch script that scrapes team rosters:

```typescript
async function scrapeTeamRoster(teamName: string, teamId: number): Promise<VlrTeamRoster | null> {
  const url = `https://www.vlr.gg/team/${teamId}/${slug}`;
  const html = await fetch(url).then(r => r.text());

  // Extract player IGNs from /player/{id}/{ign} URLs
  const playerLinkRegex = /href="\/player\/\d+\/([a-z0-9_-]+)"/gi;
  // ... returns first 5 unique players
}
```

Key details:
- Rate-limited to 1.5s between requests
- Extracts player names from URL slugs (most reliable)
- Fallback to parsing `team-roster-item-name-alias` divs
- Filters out coaches/managers/inactive players

### `src/data/vlrSnapshot.ts`

Added roster exports:

```typescript
export const VLR_TEAM_ROSTERS: VlrRosterData = { /* scraped data */ };

export function getTeamRoster(teamName: string): VlrTeamRoster | undefined;
export function isPlayerOnRoster(playerName: string, teamName: string): boolean;
```

### `src/services/GameInitService.ts`

Updated `generateWithVlrData()` to use roster data:

```typescript
// Before: Sort players by rating, take top 5
for (const [teamName, teamPlayers] of playersByTeam) {
  teamPlayers.sort((a, b) => b.vlrRating - a.vlrRating);
}

// After: Use scraped roster to determine team composition
const teamRoster = VLR_TEAM_ROSTERS[team.name];
if (teamRoster) {
  for (const playerName of teamRoster.players) {
    const vlrPlayer = vlrPlayersByName.get(playerName.toLowerCase());
    if (vlrPlayer) {
      // Use VLR stats for this player
    } else {
      // Generate player with their actual name
      playerGenerator.generatePlayer({ forceName: playerName });
    }
  }
}
```

### `src/engine/player/PlayerGenerator.ts`

Added `forceName` option:

```typescript
export interface PlayerGeneratorOptions {
  // ... existing options
  forceName?: string; // Force a specific IGN
}

generatePlayer(options) {
  let ign: string;
  if (forceName) {
    ign = forceName;
  } else {
    ign = this.generateIGN();
  }
}
```

---

## How It Works Now

```
┌─────────────────────────────────────────────────────────────────┐
│                    fetch-vlr-data.ts                            │
├─────────────────────────────────────────────────────────────────┤
│ Phase 1: Fetch player stats from vlrggapi                       │
│   GET /stats?region=na,eu,br,ap,kr,cn                          │
│   → VLR_PLAYER_STATS (6000+ players with ratings)              │
├─────────────────────────────────────────────────────────────────┤
│ Phase 2: Scrape team rosters from vlr.gg                        │
│   GET /team/{id}/{slug} for each of 48 teams                   │
│   Extract player names from /player/{id}/{ign} links           │
│   → VLR_TEAM_ROSTERS (48 teams × 5 players)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    GameInitService                              │
├─────────────────────────────────────────────────────────────────┤
│ For each team:                                                  │
│   1. Look up roster from VLR_TEAM_ROSTERS[teamName]            │
│   2. For each player in roster:                                │
│      - Find VLR stats by name match (case-insensitive)         │
│      - If found: create player from VLR stats                  │
│      - If not found: generate player with forceName            │
│   3. Fill remaining slots with generated players               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Usage

To update roster data (takes ~2 minutes for 48 teams):

```bash
npx tsx scripts/fetch-vlr-data.ts
```

Output:
```
🎮 VLR Data Fetcher
==================

Phase 1: Fetching player statistics...
Fetching NA...
  ✓ Got 1200 players
...

Phase 2: Scraping team rosters...
  [1/48] Sentinels (Americas)...
    ✓ johnqt, n4rrate, reduxx, kyu, cortezia
  [2/48] Cloud9 (Americas)...
    ✓ xeppaa, v1c, zellsis, penny, oxy
...

✓ Scraped 48 team rosters
✓ Written to src/data/vlrSnapshot.ts

✅ Done!
```

---

## VLR Team ID Reference

### Americas
| Team | VLR ID |
|------|--------|
| Sentinels | 2 |
| Cloud9 | 188 |
| 100 Thieves | 120 |
| NRG | 1034 |
| Evil Geniuses | 5248 |
| LOUD | 6961 |
| FURIA | 2406 |
| MIBR | 7386 |
| Leviatán | 2359 |
| KRÜ Esports | 2355 |
| G2 Esports | 11058 |
| 2GAME Esports | 15072 |

### EMEA
| Team | VLR ID |
|------|--------|
| Fnatic | 2593 |
| Team Liquid | 474 |
| Team Vitality | 2059 |
| Karmine Corp | 8877 |
| Team Heretics | 1001 |
| NAVI | 4915 |
| FUT Esports | 1184 |
| BBL Esports | 397 |
| Giants Gaming | 14419 |
| KOI | 7035 |
| Gentle Mates | 12694 |
| Apeks | 11479 |

### Pacific
| Team | VLR ID |
|------|--------|
| Paper Rex | 624 |
| DRX | 8185 |
| T1 | 14 |
| Gen.G | 17 |
| ZETA DIVISION | 5448 |
| DetonatioN Gaming | 278 |
| Global Esports | 918 |
| Team Secret | 6199 |
| Talon Esports | 8304 |
| Rex Regum Qeon | 878 |
| BLEED Esports | 6387 |
| Nongshim RedForce | 11060 |

### China
| Team | VLR ID |
|------|--------|
| EDward Gaming | 1120 |
| Bilibili Gaming | 12010 |
| FunPlus Phoenix | 11328 |
| JD Gaming | 13576 |
| Nova Esports | 12064 |
| All Gamers | 1119 |
| Dragon Ranger Gaming | 11981 |
| Wolves Esports | 13790 |
| Titan Esports Club | 14137 |
| TYLOO | 731 |
| Trace Esports | 12685 |
| Attacking Soul Esports | 1837 |

---

## Debugging Notes

### Initial Scraping Bug

First attempt captured tournament names instead of player names:
```
"Cloud9": { "players": ["Red Bull Home Ground 2025"] }
```

**Cause:** Regex was too broad and matched text from match history divs.

**Fix:** Changed to extract from `/player/{id}/{ign}` URL slugs which are reliable:
```typescript
const playerLinkRegex = /href="\/player\/\d+\/([a-z0-9_-]+)"/gi;
```

### Testing the Regex

```bash
curl -s "https://www.vlr.gg/team/188/cloud9" | grep -oE 'href="/player/[0-9]+/[a-z0-9_-]+"' | head -5
# Output:
# href="/player/7871/xeppaa"
# href="/player/17433/v1c"
# href="/player/729/zellsis"
# href="/player/7716/penny"
# href="/player/18796/oxy"
```
