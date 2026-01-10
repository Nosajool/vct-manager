# Phase 6: Advanced Training (Scrim) System - Session Log

**Date:** 2026-01-10
**Phase:** 6 - Polish (Scrim System)
**Status:** Complete

## Summary

Implemented a comprehensive scrim system for team-level practice matches. Teams can now schedule scrims against T1/T2/T3 opponents to improve map pool strengths, build chemistry, and develop relationships with scrim partners. The system includes relationship events, map decay mechanics, and match simulation bonuses based on map proficiency.

## Files Created

### Type Definitions

- `src/types/scrim.ts` (~210 lines) - Core scrim types
  - `TeamTier` - T1/T2/T3 classification
  - `TierTeam` - Full entity for T2/T3 scrim partners
  - `ScrimRelationship` - Relationship tracking with partners
  - `RelationshipEventType` - Event types (vod_leak, strat_leak, positive_feedback, etc.)
  - `RelationshipEvent` - Event instance with impact
  - `MapStrengthAttributes` - 6 dimensions (executes, retakes, utility, communication, mapControl, antiStrat)
  - `MapStrength` - Individual map proficiency
  - `MapPoolStrength` - Team's overall map pool
  - `ScrimFormat` - single_map, best_of_3, map_rotation
  - `ScrimIntensity` - light, moderate, competitive
  - `ScrimOptions` - Scrim configuration
  - `ScrimResult` - Completed scrim data
  - `WeeklyScrimTracker` - Weekly limit tracking
  - `SCRIM_CONSTANTS` - System constants

### Engine Layer

- `src/engine/scrim/ScrimEngine.ts` (~450 lines) - Pure scrim logic
  - **Scrim Simulation:**
    - `simulateScrim(options, playerTeam, players, partnerTeam, partnerPlayers)` - Full simulation
    - `simulateScrimMap(map, teamAPlayers, teamBPlayers, mapPool)` - Single map simulation
    - `selectScrimMaps(options, mapPool)` - Map selection logic
  - **Map Improvements:**
    - `calculateMapImprovements(maps, intensity, efficiency)` - Attribute gains
    - `applyMapDecay(mapPool, currentDate, practicedMaps)` - Weekly decay
    - `createDefaultMapPool()` - Initialize new map pools
  - **Chemistry:**
    - `calculateChemistryChanges(players, intensity, efficiency)` - Team chemistry gains
    - `calculatePairChemistryChanges(players)` - Player pair bonuses
  - **Relationships:**
    - `rollRelationshipEvent(relationship, tier)` - Random event generation
    - `calculateRelationshipChange(mapsWon, mapsLost, tier)` - Relationship updates
  - **Match Integration:**
    - `calculateMapBonus(mapStrength)` - Up to 15% bonus in matches

- `src/engine/scrim/TierTeamGenerator.ts` (~200 lines) - T2/T3 team generation
  - `generateTierTeams(freeAgents, tier, region, count)` - Create tier teams
  - `generateAllTierTeams(freeAgents)` - Generate all T2/T3 teams (8 per tier per region)
  - `filterPlayersForTier(freeAgents, tier, region)` - Select appropriate players

- `src/engine/scrim/index.ts` - Exports

### Store Layer

- `src/store/slices/scrimSlice.ts` (~120 lines) - Scrim state management
  - **State:**
    - `tierTeams: Record<string, TierTeam>` - T2/T3 teams
    - `scrimHistory: ScrimResult[]` - Last 50 scrims
  - **Actions:**
    - `addTierTeam`, `addTierTeams`, `updateTierTeam`, `removeTierTeam`
    - `addScrimResult`, `clearScrimHistory`
  - **Selectors:**
    - `getTierTeam`, `getTierTeamsByRegion`, `getTierTeamsByTier`
    - `getScrimHistory`, `getScrimHistoryWithPartner`, `getRecentScrimMaps`

### Service Layer

- `src/services/ScrimService.ts` (~500 lines) - Scrim orchestration
  - **Scrim Scheduling:**
    - `scheduleScrim(options)` - Main entry point
    - `checkWeeklyLimit()` - 4 scrims per week max
    - `getScrimsRemaining()` - Remaining slots
  - **Partner Management:**
    - `getAvailablePartners()` - Get T1/T2/T3 partners
    - `getAllRelationships()` - Current relationships
  - **Map Pool:**
    - `applyWeeklyMapDecay()` - Weekly decay processing
    - `getMapPoolSummary(teamId)` - Map pool analysis
  - **Results:**
    - `applyScrimResults(result)` - Apply improvements to store

### UI Components

- `src/components/scrim/ScrimModal.tsx` (~435 lines) - Main scrim interface
  - **Partner Selection:**
    - Tier tabs (T1/T2/T3) with efficiency indicators
    - Relationship score display
    - Partner list with region info
  - **Map Selection:**
    - Select 1-3 maps to practice
    - Current strength display for each map
    - Color-coded strength indicators
  - **Intensity Selection:**
    - Light/Moderate/Competitive options
    - Description of each intensity
  - **Results Display:**
    - Map-by-map scores
    - Chemistry and relationship changes
    - Map improvements breakdown
    - Relationship events

- `src/components/scrim/MapPoolView.tsx` (~135 lines) - Map pool visualization
  - Full view with 6 attribute bars per map
  - Compact view for dashboards
  - Sorted by overall strength
  - Last practiced date display

- `src/components/scrim/RelationshipView.tsx` (~145 lines) - Relationship display
  - Sorted by relationship score
  - Tier badges (T1/T2/T3)
  - Relationship status text
  - VOD leak risk warnings
  - Total scrims and last scrim date

- `src/components/scrim/index.ts` - Exports

## Files Modified

### Type Extensions

- `src/types/calendar.ts` - Added `'scrim_available'` to CalendarEventType
- `src/types/team.ts` - Added `mapPool?: MapPoolStrength` and `scrimRelationships?: Record<string, ScrimRelationship>` to Team interface
- `src/types/index.ts` - Export scrim types

### Engine Modifications

- `src/engine/match/MatchSimulator.ts` (~30 lines)
  - Modified `simulate()` to accept optional `mapPoolA` and `mapPoolB`
  - Added `calculateMapBonus()` method for up to 15% map strength bonus
  - Bonus applied to player combat ratings during map simulation

- `src/engine/calendar/EventScheduler.ts` (~40 lines)
  - Added `scheduleScrimDays()` method (similar to scheduleTrainingDays)
  - Updated `generateSeasonSchedule()` to include scrim events

- `src/engine/calendar/TimeProgression.ts` (~5 lines)
  - Added `scrim_available` to event categorization

### Store Modifications

- `src/store/slices/teamSlice.ts` (~150 lines)
  - Added `updateTeamMapPool()` - Set team's map pool
  - Added `updateMapStrength()` - Update single map
  - Added `applyMapPoolImprovements()` - Apply scrim improvements
  - Added `initializeScrimRelationship()` - Create new relationship
  - Added `updateScrimRelationship()` - Update existing relationship
  - Added `incrementVodLeakRisk()` - Increase VOD leak risk
  - Added `getMapPool()`, `getScrimRelationship()` selectors

- `src/store/index.ts` (~20 lines)
  - Added ScrimSlice to GameState type
  - Integrated createScrimSlice into store
  - Added selector hooks: `useTierTeams`, `useTierTeamsByRegion`, `useScrimHistory`, `useMapPool`, `usePlayerTeamMapPool`

### Service Modifications

- `src/services/CalendarService.ts` (~10 lines)
  - Handle `scrim_available` events in advanceDay
  - Apply weekly map decay in advanceWeek

- `src/services/GameInitService.ts` (~20 lines)
  - Initialize map pools for all T1 teams on game start
  - Generate T2/T3 teams from free agent pool

- `src/services/index.ts` - Export ScrimService

### UI Modifications

- `src/components/calendar/TodayActivities.tsx` (~50 lines)
  - Added `onScrimClick` prop
  - Added scrim activity button with weekly limit display
  - Show unavailable state on match days

- `src/pages/Dashboard.tsx` (~15 lines)
  - Import and render ScrimModal
  - Added scrimModalOpen state and handler
  - Pass onScrimClick to TodayActivities

### Constants

- `src/utils/constants.ts` (~100 lines)
  - Added T2_TEAM_TEMPLATES (8 teams per region)
  - Added T3_TEAM_TEMPLATES (8 teams per region)
  - Added T2_STAT_RANGES (60-75 overall)
  - Added T3_STAT_RANGES (45-60 overall)

## Architecture

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│   ScrimModal    │────▶│   ScrimService    │────▶│   ScrimEngine   │
│     (UI)        │     │    (Service)      │     │    (Engine)     │
└─────────────────┘     └───────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│ TodayActivities │     │   useGameStore    │     │ TierTeamGenerator│
│ MapPoolView     │────▶│   (scrimSlice)    │◀────│    (Engine)     │
│ RelationshipView│     │   (teamSlice)     │     └─────────────────┘
└─────────────────┘     └───────────────────┘
                               │
                               ▼
                        ┌───────────────────┐
                        │  MatchSimulator   │
                        │  (Map Bonus 15%)  │
                        └───────────────────┘
```

## Key Features

### 1. Scrim Partner Tiers

| Tier | Description | Efficiency | Teams |
|------|-------------|------------|-------|
| T1 | VCT Teams | 100% | All league teams |
| T2 | Academy Teams | 70% | 8 per region |
| T3 | Amateur Teams | 40% | 8 per region |

### 2. Relationship System

- **Base Scores:**
  - Same region: 50
  - Cross-region: 20 (latency penalty)
- **Events:**
  - `vod_leak`: -30 (VOD shared with opponent)
  - `strat_leak`: -20 (strategy leaked)
  - `positive_feedback`: +10 (good partnership)
  - `unprofessional`: -15 (poor conduct)
  - `scheduling_issue`: -5 (last minute cancel)
  - `rivalry_game`: -5 trust, +5 excitement

### 3. Map Pool Strength

**6 Attributes (0-100):**
- Executes - Site takes and set plays
- Retakes - Defensive recovery
- Utility - Smoke lineups, molly spots
- Communication - Callouts, coordination
- Map Control - Mid control, lurks
- Anti-Strat - Counter-strategies

**Mechanics:**
- 2% weekly decay for unpracticed maps
- Improvements based on scrim intensity and partner tier
- Maximum attribute value: 85
- Up to 15% bonus in match simulation

### 4. Weekly Limits

- Maximum 4 scrims per week
- Weekly tracker resets on Monday
- Displayed in TodayActivities and ScrimModal

### 5. Match Integration

- Map strength calculated as average of 6 attributes
- Bonus = (average / 100) * 15%
- Applied to player combat ratings during map simulation
- Injected via optional mapPool parameters

## Scrim Flow

1. Player clicks "Team Scrim" in TodayActivities
2. ScrimModal opens with partner selection
3. Player selects tier tab (T1/T2/T3)
4. Player selects partner team
5. Player selects 1-3 maps to practice
6. Player selects intensity
7. Click "Start Scrim" to simulate
8. Results show:
   - Map-by-map scores
   - Chemistry change (immediate)
   - Relationship change
   - Map improvements by attribute
   - Any relationship events

## T2/T3 Team Templates

**T2 (Academy) Examples:**
- G2 Academy, Sentinels Academy, FNATIC Rising
- Stat range: 60-75 overall

**T3 (Amateur) Examples:**
- Storm Rising, Nova Gaming, Apex Esports
- Stat range: 45-60 overall

## Testing

- TypeScript compiles without errors
- Build succeeds (512KB bundle)
- All engine classes are pure (no React/store dependencies)
- Scrim events generated in calendar
- Map decay applied on week advance
- T2/T3 teams generated on game init

## Constants

```typescript
SCRIM_CONSTANTS = {
  MAX_WEEKLY_SCRIMS: 4,
  TIER_EFFICIENCY: { T1: 1.0, T2: 0.7, T3: 0.4 },
  BASE_RELATIONSHIP: { SAME_REGION: 50, CROSS_REGION: 20 },
  MAP_DECAY_RATE: 0.02,
  MAX_MAP_ATTRIBUTE: 85,
  MAX_MAP_BONUS: 0.15,
}
```

## Next Steps

- Add MapPoolView to team detail pages
- Add RelationshipView to a dedicated partnerships page
- Implement coach system
- Add pre-match map veto system using map pool data
- Performance optimizations
- Additional relationship events
