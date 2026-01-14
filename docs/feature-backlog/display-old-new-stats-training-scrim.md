# Feature: Display Old and New Stats in Training/Scrim Results

## Overview
Currently, training and scrim completion results only show relative changes (e.g., "+1 mental", "+2.0 Chemistry"). This feature will enhance the display to show both old and new values in an "old → new" format for better player understanding of progress.

## Current State Analysis
- **Training Results**: Shows only stat improvements like "mental +1", "clutch +1"
- **Scrim Results**: Shows chemistry/relationship changes like "Chemistry +2.0", "Relationship +1.8", and map improvements like "executes: +2.0"
- **Data Available**: Results contain change amounts but not original values

## Requirements

### Training Results Display
- **Scope**: Show old → new values for ALL player stats (mechanics, igl, mental, clutch, vibes, lurking, entry, support, stamina)
- **Format**: Change from "mental +1" to "mental: 75 → 78"
- **Morale**: Also show old → new morale value
- **Example Output**:
  ```
  Training Complete!
  RazeEffectiveness: 80%
  mechanics: 82 → 84
  igl: 78 → 78
  mental: 75 → 78
  clutch: 72 → 75
  vibes: 80 → 80
  lurking: 76 → 76
  entry: 79 → 81
  support: 74 → 74
  stamina: 77 → 80
  Morale: 85 → 84
  ```

### Scrim Results Display
- **Chemistry**: Show old → new chemistry score (e.g., "Chemistry: 82.3 → 84.5")
- **Relationship**: Show old → new relationship score (e.g., "Relationship: 45 → 48")
- **Map Improvements**: Show old → new values for each improved attribute (e.g., "Bind executes: 65.2 → 67.4")
- **Example Output**:
  ```
  Scrim Complete!
  vs Cloud90 - 1
  Efficiency: 115%
  Map Results
  Bind 6 - 13
  Chemistry: 82.3 → 84.5
  Relationship: 45 → 48
  Map Improvements
  Bind
  executes: 65.2 → 67.4
  retakes: 68.1 → 69.3
  utility: 62.8 → 65.1
  communication: 71.5 → 71.5
  mapControl: 69.2 → 70.6
  antiStrat: 64.9 → 64.9
  ```

## Technical Implementation Plan

### 1. Update Result Types
**TrainingResult** (`src/types/economy.ts`):
- Add `oldStats: PlayerStats` field
- Add `newStats: PlayerStats` field
- Add `oldMorale: number` field
- Add `newMorale: number` field

**ScrimResult** (`src/types/scrim.ts`):
- Add `oldChemistry: number` field
- Add `newChemistry: number` field
- Add `oldRelationship: number` field
- Add `newRelationship: number` field
- Update `mapImprovements` to include old values: `Record<string, Record<keyof MapStrengthAttributes, {old: number, new: number}>>`

### 2. Update Service Logic
**TrainingService** (`src/services/TrainingService.ts`):
- Capture old stats before training: `const oldStats = { ...player.stats }`
- Capture old morale: `const oldMorale = player.morale`
- Include old/new values in TrainingResult

**ScrimService** (`src/services/ScrimService.ts`):
- Capture old chemistry from team data
- Capture old relationship from scrimRelationships
- Capture old map attributes from mapPool
- Include old/new values in ScrimResult

### 3. Update UI Components
**TrainingModal** (`src/components/calendar/TrainingModal.tsx`):
- Change display logic from `+${improvement}` to `${old} → ${new}`
- Show all stats, not just improved ones
- Include morale with old → new format

**ScrimModal** (`src/components/scrim/ScrimModal.tsx`):
- Update chemistry display to show old → new
- Update relationship display to show old → new
- Update map improvements to show old → new for each attribute

## Architecture Compliance
Following existing VCT Manager architecture patterns:

- **Engine layer**: Pure functions, no side effects - modify `PlayerDevelopment.trainPlayer()` and `ScrimEngine.simulateScrimMap()` to return old/new values
- **Services layer**: Orchestration - `TrainingService` and `ScrimService` capture old values before calling engines, then include them in results
- **Store layer**: State updates - no changes needed, results already stored
- **UI layer**: Display logic - `TrainingModal` and `ScrimModal` render old → new format

## Edge Cases
- **No Change**: Still show "stat: 75 → 75" for unchanged stats
- **Precision**: Chemistry/relationship show 1 decimal place, stats show whole numbers
- **Map Attributes**: Only show maps that were practiced (have improvements)

## Testing Checklist
- [ ] Training results show all 9 stats with old → new format
- [ ] Morale shows old → new in training results
- [ ] Chemistry shows old → new in scrim results
- [ ] Relationship shows old → new in scrim results
- [ ] Map improvements show old → new for each attribute
- [ ] Unchanged values still display (e.g., "stat: 75 → 75")
- [ ] UI layout accommodates longer text strings
