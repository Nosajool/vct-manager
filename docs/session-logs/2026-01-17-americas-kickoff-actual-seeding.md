# Session Log: Americas Kickoff 2026 Actual Seeding

**Date:** 2026-01-17
**Feature:** Implement real VCT Americas Kickoff 2026 seeding and bracket structure

---

## Summary

Updated the Americas Kickoff tournament to use the actual VCT 2026 seeding order instead of randomly assigning seeds to non-bye teams. The bracket structure already matched the triple elimination format, but teams were not seeded according to official VCT rules.

---

## Research: VCT Americas Kickoff 2026 Format

Sourced from [Liquipedia](https://liquipedia.net/valorant/VCT/2026/Americas_League/Kickoff) and [VLR.gg](https://www.vlr.gg/event/2682/vct-2026-americas-kickoff):

### Official Seeding

**Pool 1 (Bye to Upper Bracket R2) - Champions 2025 Qualifiers:**
1. NRG
2. MIBR
3. Sentinels
4. G2 Esports

**Pool 2 (Play in Upper Bracket R1):**
5. LOUD
6. Cloud9
7. ENVY (2025 Ascension Americas winners)
8. Evil Geniuses
9. KRÜ Esports
10. FURIA
11. 100 Thieves
12. Leviatán

### Upper Bracket R1 Matchups
- LOUD vs Cloud9 (seeds 5v6)
- ENVY vs Evil Geniuses (seeds 7v8)
- KRÜ Esports vs FURIA (seeds 9v10)
- 100 Thieves vs Leviatán (seeds 11v12)

### Upper Bracket R2 Matchups
- NRG vs winner(LOUD/Cloud9)
- MIBR vs winner(ENVY/EG)
- Sentinels vs winner(KRÜ/FURIA)
- G2 Esports vs winner(100T/Leviatán)

---

## Changes Made

### 1. Updated Americas Team List

**File:** `src/utils/constants.ts`

Replaced "2GAME Esports" with "ENVY" to match the 2026 roster:

```typescript
{ name: 'ENVY', orgValue: 2800000, fanbase: 65 },
```

### 2. Added Official Seeding Configuration

**File:** `src/utils/constants.ts`

New constant defining the exact seeding order:

```typescript
export const AMERICAS_KICKOFF_SEEDING: string[] = [
  'NRG',           // Seed 1 - Champions 2025 qualifier (bye)
  'MIBR',          // Seed 2 - Champions 2025 qualifier (bye)
  'Sentinels',     // Seed 3 - Champions 2025 qualifier (bye)
  'G2 Esports',    // Seed 4 - Champions 2025 qualifier (bye)
  'LOUD',          // Seed 5 - Pool 2 (plays seed 6)
  'Cloud9',        // Seed 6 - Pool 2 (plays seed 5)
  'ENVY',          // Seed 7 - Pool 2 (plays seed 8)
  'Evil Geniuses', // Seed 8 - Pool 2 (plays seed 7)
  'KRÜ Esports',   // Seed 9 - Pool 2 (plays seed 10)
  'FURIA',         // Seed 10 - Pool 2 (plays seed 9)
  '100 Thieves',   // Seed 11 - Pool 2 (plays seed 12)
  'Leviatán',      // Seed 12 - Pool 2 (plays seed 11)
];
```

### 3. Updated GameInitService

**File:** `src/services/GameInitService.ts`

- Added import for `AMERICAS_KICKOFF_SEEDING`
- Modified Kickoff team selection to use official seeding for Americas
- Added `sortTeamsByAmericasKickoffSeeding()` helper method

```typescript
if (playerRegion === 'Americas') {
  sortedRegionTeams = this.sortTeamsByAmericasKickoffSeeding(regionTeams);
} else {
  // Other regions: sort by strength
  sortedRegionTeams = [...regionTeams].sort((a, b) => {
    const strengthA = a.organizationValue + a.fanbase * 10000;
    const strengthB = b.organizationValue + b.fanbase * 10000;
    return strengthB - strengthA;
  });
}
```

### 4. Updated RegionalSimulationService

**File:** `src/services/RegionalSimulationService.ts`

- Added import for `AMERICAS_KICKOFF_SEEDING`
- Modified to use official seeding when simulating Americas Kickoff (for non-Americas players)
- Added `sortTeamsByAmericasKickoffSeeding()` helper method

### 5. Updated TournamentEngine

**File:** `src/engine/competition/TournamentEngine.ts`

- Added region parameter to `generateBracket()` method
- Simplified `generateAmericasKickoffSeeding()` since teams are now pre-sorted by service layer

---

## Files Modified

| File | Changes |
|------|---------|
| `src/utils/constants.ts` | Updated Americas team list (ENVY), added `AMERICAS_KICKOFF_SEEDING` constant |
| `src/services/GameInitService.ts` | Use official seeding for Americas Kickoff |
| `src/services/RegionalSimulationService.ts` | Use official seeding when simulating Americas |
| `src/engine/competition/TournamentEngine.ts` | Added region parameter, simplified Americas seeding |

---

## Architecture Notes

The seeding is applied at the **service layer** rather than the engine layer because:

1. **Engine Layer** is pure and has no access to team names (only IDs)
2. **Service Layer** has access to team data via the store
3. Pre-sorting teams in the service layer keeps the engine simple

Flow:
```
Service Layer: Sort teams by AMERICAS_KICKOFF_SEEDING
    ↓
Engine Layer: Generate bracket with sequential seeds [1,2,3,4,5,6,7,8,9,10,11,12]
    ↓
BracketManager: Create matchups based on seed positions
```

---

## Bracket Structure Verification

The existing `BracketManager.generateTripleElimination()` already creates correct matchups:

**Upper R1 (4 matches):**
```typescript
const seedA = numByes + i * 2 + 1; // Seeds 5, 7, 9, 11
const seedB = numByes + i * 2 + 2; // Seeds 6, 8, 10, 12
```
- Match 1: Seed 5 vs 6 → LOUD vs Cloud9 ✓
- Match 2: Seed 7 vs 8 → ENVY vs Evil Geniuses ✓
- Match 3: Seed 9 vs 10 → KRÜ Esports vs FURIA ✓
- Match 4: Seed 11 vs 12 → 100 Thieves vs Leviatán ✓

**Upper R2 (4 matches):**
```typescript
const byeSeed = i + 1; // Seeds 1, 2, 3, 4
teamBSource: { type: 'winner', matchId: `ur1-m${i + 1}` }
```
- Match 1: NRG vs winner(UR1-M1) ✓
- Match 2: MIBR vs winner(UR1-M2) ✓
- Match 3: Sentinels vs winner(UR1-M3) ✓
- Match 4: G2 vs winner(UR1-M4) ✓

---

## Verification

- TypeScript compilation: PASSED
- Bracket matchups match official VCT 2026 format
- Seeding order matches Liquipedia/VLR.gg data

---

## Future Work

1. **Other Region Seedings**: Add actual seeding for EMEA, Pacific, China Kickoffs when data available
2. **Dynamic Seeding**: In future seasons, base seeding on previous season performance (Champions qualifiers get byes)
3. **Seeding Configuration UI**: Allow viewing/understanding seeding in tournament info modal
