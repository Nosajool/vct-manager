# Session Log: VLR Player Integration

**Date:** 2026-01-15
**Feature:** Real Player Data Integration from VLR.gg

---

## Summary

Implemented integration with the vlrggapi to populate the game with real VCT player data instead of procedurally generated players. Used a static snapshot approach where data is fetched via CLI script and committed to the repo, avoiding runtime API dependencies.

---

## What We Built

### 1. VLR Type Definitions
- `src/types/vlr.ts` - TypeScript interfaces for VLR API responses
- Exported from `src/types/index.ts`

### 2. VLR Engine Module
New module at `src/engine/player/vlr/`:

| File | Purpose |
|------|---------|
| `orgMapping.ts` | Maps VLR org codes (SEN, FNC, PRX) to game team names (Sentinels, Fnatic, Paper Rex) |
| `statConverter.ts` | Converts VLR performance stats to game `PlayerStats` using percentile normalization |
| `VlrDataProcessor.ts` | Transforms raw VLR data into game `Player` entities |
| `index.ts` | Barrel export |

### 3. CLI Fetch Script
- `scripts/fetch-vlr-data.ts` - Fetches player stats from all VLR regions
- Generates `src/data/vlrSnapshot.ts` with static player data
- Added `npm run fetch-vlr` command

### 4. GameInitService Integration
Modified `src/services/GameInitService.ts`:
- Added `useVlrData` option (default: `true`)
- VLR players populate team rosters (top 5 by rating per team)
- Gaps filled with procedural generation (reserves, unmatched teams)

---

## Files Created

```
scripts/
└── fetch-vlr-data.ts              # CLI to fetch VLR data

src/
├── types/
│   └── vlr.ts                      # VLR API types
├── data/
│   └── vlrSnapshot.ts              # Static snapshot (6,781 players)
└── engine/player/vlr/
    ├── orgMapping.ts               # Org name mapping
    ├── statConverter.ts            # Stat conversion algorithm
    ├── VlrDataProcessor.ts         # Data processing
    └── index.ts                    # Barrel export
```

## Files Modified

```
src/types/index.ts                  # Export VLR types
src/services/GameInitService.ts     # VLR integration
package.json                        # Added fetch-vlr script, tsx dep
docs/feature-backlog/vlr-player-integration.md  # Updated spec
```

---

## Technical Decisions

### Static Snapshot vs Runtime Fetch

**Chose static snapshot because:**
- No runtime API dependency (faster startup, works offline)
- Can curate/validate data before committing
- Simple cache invalidation (just re-run script)
- Bundle includes data - no network latency at game start

### Stat Conversion Algorithm

VLR stats are normalized using observed percentile ranges, then weighted to produce game stats:

| Game Stat | VLR Sources | Rationale |
|-----------|-------------|-----------|
| `mechanics` | ACS, HS%, K/D | Raw fragging ability |
| `igl` | KAST, Rating | Team-oriented play |
| `clutch` | Clutch%, K/D | 1vX performance |
| `entry` | FKPR, ACS | First contact aggression |
| `lurking` | Inverse FKPR | Players who don't entry tend to lurk |
| `support` | APR, KAST | Utility and assists |

### Org Name Mapping

Created explicit mapping for all 48 VCT teams across 4 regions. Handles common variations:
- `SEN` → Sentinels
- `GENG` / `GEN` → Gen.G
- `KRÜ` / `KRU` → KRÜ Esports

---

## Data Statistics

From latest fetch:
- **Total players:** 6,781
- **Regions:** NA (2,188), EU (2,370), BR (466), AP (1,279), KR (266), CN (212)
- **Matched to VCT teams:** ~240 players (5 per team × 48 teams)
- **Unmatched orgs:** Many T2/T3 teams not in VCT_TEAMS

---

## Usage

```bash
# Refresh VLR data when rosters change
npm run fetch-vlr

# Game automatically uses VLR data
# To disable:
gameInitService.initializeNewGame({ useVlrData: false });
```

---

## Known Limitations

1. **Unmatched orgs** - VLR has many T2/T3 teams not in the game's VCT_TEAMS
2. **Missing nationalities** - Inferred from region, not actual player data
3. **Age estimation** - Guessed from rating, not actual birthdates
4. **Bundle size** - Snapshot adds ~2.5MB to bundle (consider lazy loading in future)

---

## Future Improvements

- [ ] Add nationality data from VLR player profiles
- [ ] Lazy load snapshot data to reduce initial bundle
- [ ] Add agent preference data (VLR provides most-played agents)
- [ ] Periodic auto-refresh during off-season phases
- [ ] Show "Real Player" badge in UI for VLR-sourced players

---

## Testing

- Build passes: `npm run build` ✓
- VLR fetch works: `npm run fetch-vlr` ✓
- Type safety: All VLR types properly exported and used

---

## Related Files

- Spec: `docs/feature-backlog/vlr-player-integration.md`
- Tech spec: `docs/vct_manager_game_technical_specification.md`
