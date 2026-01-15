# Region Selection System - Feature Specification

## Overview

Add a region and team selection flow at game start, allowing players to choose their VCT region and team. Currently, the game hardcodes `playerRegion: 'Americas'` with no UI for selection.

## Current State Analysis

**What exists:**
- `GameInitService.initializeNewGame(options)` already accepts `playerRegion`, `playerTeamId`, and `difficulty` parameters
- All teams and players have a `region` field (`'Americas' | 'EMEA' | 'Pacific' | 'China'`)
- Store selectors `getTeamsByRegion()` and `getPlayersByRegion()` exist
- 12 VCT teams defined per region in `VCT_TEAMS` constant
- Scrim system already handles same-region vs cross-region relationships

**What's missing:**
- UI for region/team/difficulty selection at game start
- The `Roster.tsx` page hardcodes options when calling `gameInitService.initializeNewGame()`

## Solution

Create a three-step setup wizard that appears when starting a new game:

```
Step 1: Region Selection → Step 2: Team Selection → Step 3: Difficulty Selection → Game Starts
```

---

## Implementation Details

### New Components

```
src/components/setup/
├── SetupWizard.tsx           # Main wizard container with step navigation
├── RegionSelectStep.tsx      # Step 1: Region cards
├── TeamSelectStep.tsx        # Step 2: Team list for chosen region
├── DifficultySelectStep.tsx  # Step 3: Difficulty options
└── index.ts
```

### SetupWizard.tsx

Container component managing the setup flow:

```typescript
interface SetupWizardProps {
  onComplete: (options: NewGameOptions) => void;
  onCancel: () => void;
}

interface SetupState {
  step: 1 | 2 | 3;
  region: Region | null;
  teamId: string | null;
  difficulty: 'easy' | 'normal' | 'hard';
}
```

Flow:
1. User selects region → advances to step 2
2. User selects team from that region → advances to step 3
3. User selects difficulty → calls `onComplete(options)`

### RegionSelectStep.tsx

Display 4 region cards with:
- Region name and flag emoji
- Number of teams (12 per region)
- Brief description/flavor text

```typescript
const REGION_INFO: Record<Region, { flag: string; description: string }> = {
  Americas: { flag: '🌎', description: 'NA, Brazil, and LATAM teams compete' },
  EMEA: { flag: '🌍', description: 'Europe, Middle East, and Africa unite' },
  Pacific: { flag: '🌏', description: 'Korea, Japan, SEA, and Oceania battle' },
  China: { flag: '🇨🇳', description: 'The awakening dragon of Valorant' },
};
```

### TeamSelectStep.tsx

Display teams from the selected region:
- Team name and organization value (displayed as prestige tier)
- Fanbase rating (affects sponsorship revenue)
- Starting roster overall rating

Uses existing `VCT_TEAMS` constant data filtered by region.

### DifficultySelectStep.tsx

Three difficulty options affecting starting finances:

| Difficulty | Finance Multiplier | Description |
|------------|-------------------|-------------|
| Easy | 1.5x | Extra budget for beginners |
| Normal | 1.0x | Standard VCT experience |
| Hard | 0.7x | Tight finances, every decision matters |

---

## Modified Files

### src/pages/Roster.tsx

Replace the hardcoded "Start New Game" button with the SetupWizard:

**Current (lines ~50-60):**
```typescript
<button onClick={() => gameInitService.initializeNewGame({
  playerRegion: 'Americas',
  difficulty: 'normal'
})}>
  Start New Game
</button>
```

**New:**
```typescript
const [showSetup, setShowSetup] = useState(false);

// When game not started, show either "Start" button or wizard
{!gameStarted && !showSetup && (
  <button onClick={() => setShowSetup(true)}>Start New Game</button>
)}

{showSetup && (
  <SetupWizard
    onComplete={(options) => {
      gameInitService.initializeNewGame(options);
      setShowSetup(false);
    }}
    onCancel={() => setShowSetup(false)}
  />
)}
```

### src/services/GameInitService.ts

No changes required - already supports `playerRegion`, `playerTeamId`, and `difficulty` options.

---

## UI/UX Design

### Region Selection (Step 1)

```
┌─────────────────────────────────────────────────────────────┐
│                    Choose Your Region                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     🌎       │  │     🌍       │  │     🌏       │  │     🇨🇳       │  │
│  │   Americas   │  │     EMEA     │  │   Pacific    │  │    China     │  │
│  │  12 Teams    │  │  12 Teams    │  │  12 Teams    │  │  12 Teams    │  │
│  │              │  │              │  │              │  │              │  │
│  │ NA, Brazil,  │  │  Europe, ME, │  │ Korea, Japan,│  │ The awakening│  │
│  │ LATAM teams  │  │  Africa unite│  │ SEA, Oceania │  │ dragon       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                             │
│                        [Cancel]                             │
└─────────────────────────────────────────────────────────────┘
```

### Team Selection (Step 2)

```
┌─────────────────────────────────────────────────────────────┐
│              Select Your Team - Americas                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Sentinels              ⭐⭐⭐⭐⭐  Fanbase: 95      │   │
│  │ Premier organization with top facilities            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Cloud9                 ⭐⭐⭐⭐⭐  Fanbase: 90      │   │
│  │ Established esports powerhouse                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 100 Thieves            ⭐⭐⭐⭐   Fanbase: 85      │   │
│  │ Content-focused org with strong brand               │   │
│  └─────────────────────────────────────────────────────┘   │
│  ... (scrollable list of 12 teams)                         │
│                                                             │
│               [← Back]              [Cancel]                │
└─────────────────────────────────────────────────────────────┘
```

### Difficulty Selection (Step 3)

```
┌─────────────────────────────────────────────────────────────┐
│                   Select Difficulty                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  EASY                                               │   │
│  │  1.5x starting budget. Recommended for first run.   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  NORMAL                                             │   │
│  │  Standard VCT experience. Balanced challenge.       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HARD                                               │   │
│  │  0.7x budget. Every decision matters.               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│               [← Back]              [Cancel]                │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Phase 1: Core Setup Flow

- [ ] Create `SetupWizard.tsx` with step state management
- [ ] Create `RegionSelectStep.tsx` with 4 region cards
- [ ] Create `TeamSelectStep.tsx` with filtered team list
- [ ] Create `DifficultySelectStep.tsx` with 3 options
- [ ] Update `Roster.tsx` to use SetupWizard instead of hardcoded init
- [ ] Add Tailwind styling matching existing game aesthetic

### Phase 2: Polish

- [ ] Add keyboard navigation (arrow keys, enter to select)
- [ ] Add hover states and selection animations
- [ ] Show team roster preview on hover in TeamSelectStep
- [ ] Add confirmation summary before starting game

---

## Compatibility with VLR Player Integration

This feature is designed to work seamlessly with the planned VLR Player Integration feature (see `vlr-player-integration.md`).

**How they work together:**

1. **GameInitService.ts**: Both features modify this file, but in complementary ways:
   - Region selection: Provides `playerRegion` and `playerTeamId` parameters
   - VLR integration: Changes where player/team data comes from (API vs procedural)
   - The flow remains: select region → filter teams → initialize game

2. **Team data source**: The SetupWizard currently uses `VCT_TEAMS` constant data. When VLR integration is added:
   - `TeamSelectStep.tsx` can source teams from VLR API rankings instead
   - Team cards can show real roster strength based on VLR player stats
   - The selection flow remains identical

3. **Fallback behavior**: VLR integration includes fallback to procedural generation when API is unavailable. This means:
   - Region selection works regardless of VLR API availability
   - If VLR fails, game still uses `VCT_TEAMS` constant data

**Implementation order recommendation:**
- Build region selection first (uses existing constants)
- VLR integration enhances the data source later
- No refactoring needed when VLR is added

---

## Future Enhancements (Not in Scope)

These features are noted for future consideration but are **not part of this implementation**:

### Import Slot System

Limit cross-region player signings (max 2 imported players per team):

```typescript
// Future addition to Team interface
interface Team {
  // ... existing fields
  importSlotsUsed: number;  // 0-2
  maxImportSlots: 2;
}

// Validation in ContractService.signPlayer()
const isImport = player.region !== team.region;
if (isImport && team.importSlotsUsed >= team.maxImportSlots) {
  throw new Error('Import slots exhausted');
}
```

This adds strategic depth but is not required for the core region selection feature.

### Regional Tournament Filtering

Currently, the game generates a Kickoff tournament for the player's region at game start. Future work could:
- Filter all regional tournaments to the player's region
- Keep international tournaments (Masters, Champions) cross-region
- Add qualification paths from regional to international events

### Scrim Region Restrictions

The scrim system already prefers same-region partners (higher base relationship score). Future work could:
- Completely restrict scrims to same-region T2/T3 teams
- Add travel costs for cross-region scrims

---

## Testing Checklist

- [ ] Can select each of the 4 regions
- [ ] Team list correctly filters to selected region (12 teams each)
- [ ] All 12 teams per region are selectable
- [ ] Difficulty selection affects starting finances correctly
- [ ] Back navigation works at each step
- [ ] Cancel returns to pre-game state
- [ ] Game initializes with correct region/team/difficulty
- [ ] Existing saves are not affected (backward compatible)

---

## Success Criteria

1. **Region Choice**: All 4 regions selectable at game start
2. **Team Choice**: All 48 VCT teams (12 per region) available for selection
3. **Difficulty Choice**: Three difficulty levels with correct finance multipliers
4. **Seamless Flow**: Wizard integrates cleanly with existing game start
5. **No Regressions**: Existing game functionality unaffected
