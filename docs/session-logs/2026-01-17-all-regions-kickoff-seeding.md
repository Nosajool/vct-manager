# Session Log: All Regions Kickoff 2026 Seeding

**Date:** 2026-01-17
**Feature:** Implement real VCT Kickoff 2026 seeding for EMEA, Pacific, and China

---

## Summary

Extended the Americas Kickoff seeding implementation to all VCT regions. Each region now uses the official VCT 2026 seeding based on Champions 2025 qualifiers receiving byes to Upper Bracket Round 2.

---

## Research: VCT Kickoff 2026 Format (All Regions)

Sourced from [Liquipedia](https://liquipedia.net/valorant/VCT/2026) and [VLR.gg](https://www.vlr.gg/):

### EMEA Kickoff 2026

**Pool 1 (Bye to Upper Bracket R2) - Champions 2025 Qualifiers:**
1. Fnatic
2. Team Liquid
3. GIANTX
4. Team Heretics

**Pool 2 (Play in Upper Bracket R1):**
5. NAVI
6. Karmine Corp
7. FUT Esports
8. Gentle Mates
9. PCIFIC Esports (Ascension 2025)
10. BBL Esports
11. ULF Esports (Ascension 2025)
12. Team Vitality

**Upper Bracket R1 Matchups:**
- NAVI vs Karmine Corp (5v6)
- FUT Esports vs Gentle Mates (7v8)
- PCIFIC Esports vs BBL Esports (9v10)
- ULF Esports vs Team Vitality (11v12)

### Pacific Kickoff 2026

**Pool 1 (Bye to Upper Bracket R2) - Champions 2025 Qualifiers:**
1. T1
2. DRX
3. Paper Rex
4. Rex Regum Qeon

**Pool 2 (Play in Upper Bracket R1):**
5. Nongshim RedForce (Ascension 2025)
6. Team Secret
7. ZETA DIVISION
8. FULL SENSE (replaced Talon Esports for 2026)
9. VARREL (Ascension 2025)
10. Global Esports
11. DetonatioN FocusMe
12. Gen.G

**Upper Bracket R1 Matchups:**
- NS RedForce vs Team Secret (5v6)
- ZETA DIVISION vs FULL SENSE (7v8)
- VARREL vs Global Esports (9v10)
- DetonatioN FocusMe vs Gen.G (11v12)

### China Kickoff 2026

**Pool 1 (Bye to Upper Bracket R2) - Champions 2025 Qualifiers:**
1. EDward Gaming
2. Bilibili Gaming
3. Xi Lai Gaming (XLG)
4. Dragon Ranger Gaming (Ascension 2025)

**Pool 2 (Play in Upper Bracket R1):**
5. Trace Esports
6. Wolves Esports
7. FunPlus Phoenix
8. TYLOO
9. All Gamers
10. Nova Esports
11. JD Gaming
12. Titan Esports Club

**Upper Bracket R1 Matchups:**
- Trace Esports vs Wolves Esports (5v6)
- FunPlus Phoenix vs TYLOO (7v8)
- All Gamers vs Nova Esports (9v10)
- JD Gaming vs Titan Esports Club (11v12)

---

## Changes Made

### 1. Updated Team Lists

**File:** `src/utils/constants.ts`

**EMEA Team Changes:**
- Giants Gaming → GIANTX (rebranded)
- KOI → PCIFIC Esports (Ascension 2025 winner)
- Apeks → ULF Esports (Ascension 2025 winner)

**Pacific Team Changes:**
- Talon Esports → FULL SENSE (franchise replacement for 2026)
- BLEED Esports → VARREL (Ascension 2025 winner)
- DetonatioN Gaming → DetonatioN FocusMe (name consistency)
- Added Nongshim RedForce (Ascension 2025)

**China Team Changes:**
- Attacking Soul Esports → Xi Lai Gaming (XLG)

### 2. Added Official Seeding Constants

**File:** `src/utils/constants.ts`

Added three new seeding arrays:
```typescript
export const EMEA_KICKOFF_SEEDING: string[] = [
  'Fnatic', 'Team Liquid', 'GIANTX', 'Team Heretics',
  'NAVI', 'Karmine Corp', 'FUT Esports', 'Gentle Mates',
  'PCIFIC Esports', 'BBL Esports', 'ULF Esports', 'Team Vitality',
];

export const PACIFIC_KICKOFF_SEEDING: string[] = [
  'T1', 'DRX', 'Paper Rex', 'Rex Regum Qeon',
  'Nongshim RedForce', 'Team Secret', 'ZETA DIVISION', 'FULL SENSE',
  'VARREL', 'Global Esports', 'DetonatioN FocusMe', 'Gen.G',
];

export const CHINA_KICKOFF_SEEDING: string[] = [
  'EDward Gaming', 'Bilibili Gaming', 'Xi Lai Gaming', 'Dragon Ranger Gaming',
  'Trace Esports', 'Wolves Esports', 'FunPlus Phoenix', 'TYLOO',
  'All Gamers', 'Nova Esports', 'JD Gaming', 'Titan Esports Club',
];
```

### 3. Updated GameInitService

**File:** `src/services/GameInitService.ts`

- Added imports for all seeding constants
- Replaced `sortTeamsByAmericasKickoffSeeding()` with generic `sortTeamsByKickoffSeeding(teams, region)`
- Added `getKickoffSeeding(region)` helper to return appropriate seeding array

### 4. Updated RegionalSimulationService

**File:** `src/services/RegionalSimulationService.ts`

- Added imports for all seeding constants
- Replaced `sortTeamsByAmericasKickoffSeeding()` with generic `sortTeamsByKickoffSeeding(teams, region)`
- Added `getKickoffSeeding(region)` helper to return appropriate seeding array
- All regions now use official seeding when simulating Kickoff tournaments

---

## Files Modified

| File | Changes |
|------|---------|
| `src/utils/constants.ts` | Updated EMEA/Pacific/China team lists, added 3 new seeding constants |
| `src/services/GameInitService.ts` | Generalized seeding to support all regions |
| `src/services/RegionalSimulationService.ts` | Generalized seeding to support all regions |

---

## Architecture Notes

The seeding system follows the same pattern established for Americas:

1. **Constants Layer**: Define seeding order in `constants.ts`
2. **Service Layer**: `getKickoffSeeding(region)` returns the appropriate array
3. **Engine Layer**: Receives pre-sorted team IDs and generates bracket

```
Service Layer: sortTeamsByKickoffSeeding(teams, region)
    ↓
Engine Layer: Generate bracket with sequential seeds [1,2,3,4,5,6,7,8,9,10,11,12]
    ↓
BracketManager: Create matchups based on seed positions
```

---

## Verification

- TypeScript compilation: PASSED
- All seeding constants properly exported
- Both services updated to use region-specific seeding

---

## Sources

- [VCT 2026 EMEA Kickoff - Liquipedia](https://liquipedia.net/valorant/VCT/2026/EMEA_League/Kickoff)
- [VCT 2026 Pacific Kickoff - Liquipedia](https://liquipedia.net/valorant/VCT/2026/Pacific_League/Kickoff)
- [VCT 2026 China Kickoff - Liquipedia](https://liquipedia.net/valorant/VCT/2026/China_League/Kickoff)
- [VCT 2026 EMEA Kickoff - VLR.gg](https://www.vlr.gg/event/2684/vct-2026-emea-kickoff)
- [VCT 2026 Pacific Kickoff - VLR.gg](https://www.vlr.gg/event/2683/vct-2026-pacific-kickoff)
- [VCT 2026 China Kickoff - VLR.gg](https://www.vlr.gg/event/2685/vct-2026-china-kickoff)
