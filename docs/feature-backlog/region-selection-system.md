# Region Selection and Cross-Region Management - Feature Specification

## Overview

**Feature Name**: Region Selection and Cross-Region Management
**Priority**: High
**Estimated Effort**: 2-3 weeks
**Target Release**: Next phase

## Problem Statement

Currently, players are automatically assigned to Sentinels (Americas region) with no choice. The game generates all teams globally but limits the player's experience to their region. Players should be able to choose their region at game start, affecting team management, league opponents, tournament participation, and available players.

## Solution

Add a region selection system at game initialization that:
- Allows players to choose from 4 VCT regions (Americas, EMEA, Pacific, China)
- Assigns them to manage an existing VCT team in that region
- Filters league matches and regional tournaments to the chosen region
- Maintains global free agent visibility with import slot restrictions (max 2 imported players per team)
- Keeps international tournaments (Masters, Champions) cross-region
- Limits scrim partners to the player's region

## Goals

1. **Regional Choice**: Players can select their preferred VCT region at game start
2. **Regional Immersion**: League matches and regional tournaments reflect chosen region
3. **Global Flexibility**: Access to global free agents with strategic import limits
4. **Tournament Integrity**: International tournaments remain cross-region with proper qualification
5. **Scrim Balance**: Practice partners appropriate to regional skill level

## Technical Requirements

### New Components

#### UI Components
```
src/components/init/
├── RegionSelectionModal.tsx    # Region selection with visual cards
├── TeamSelectionModal.tsx      # Team picker within selected region
└── index.ts
```

#### Engine Components
```
src/engine/team/
├── ImportSlotManager.ts        # Track and validate import slots
└── index.ts
```

#### Types
```
src/types/
├── region.ts                   # Region-specific types and constants
└── index.ts (updated)
```

### Modified Components

#### Services
- `GameInitService.ts` - Add region/team selection flow
- `ContractService.ts` - Validate import slots during signing
- `TournamentService.ts` - Handle regional vs international tournaments

#### Engines
- `EventScheduler.ts` - Filter league opponents by region
- `ScheduleGenerator.ts` - Generate region-specific tournaments
- `TeamManager.ts` - Add import slot tracking and validation

#### UI Components
- Roster components - Display import slot status
- Free agent list - Show regional indicators
- Tournament brackets - Filter by region where appropriate

#### Store
- Add `playerRegion` to game state
- Add import slot tracking to team state
- Update selectors for regional filtering

## Key Design Decisions

### Region Selection
- **Options**: Americas, EMEA, Pacific, China (4 regions)
- **Timing**: Only at game initialization (cannot change mid-season)
- **Team Assignment**: Pick from existing VCT teams in chosen region
- **No Custom Teams**: Focus on authentic VCT experience

### Import Slot System
- **Limit**: Maximum 2 imported players per team
- **Scope**: Players from regions other than the team's region
- **Validation**: Enforced at contract signing
- **UI**: Clear indicators showing slots used/available

### Tournament Structure
- **Regional Tournaments**: Kickoff, Stage 1, Stage 2 (region-only participants)
- **International Tournaments**: Masters, Champions (cross-region with qualification)
- **Qualification**: Regional tournament winners advance to international events

### Free Agent Access
- **Visibility**: All global free agents visible
- **Regional Indicators**: Clear badges showing player regions
- **Import Restrictions**: Only enforced at signing, not browsing

### Scrim System
- **Partners**: T2/T3 teams limited to player's region
- **Rationale**: Maintains regional skill balance and immersion

## Data Model Changes

### Team Interface Updates
```typescript
export interface Team {
  // ... existing fields
  importSlotsUsed: number;        // 0-2, tracks imported players
  maxImportSlots: number;         // Always 2
  region: Region;                 // Team's home region
}
```

### Game State Updates
```typescript
interface GameState {
  // ... existing fields
  playerRegion: Region;           // Player's chosen region
}
```

### New Types
```typescript
export type Region = 'Americas' | 'EMEA' | 'Pacific' | 'China';

export interface RegionInfo {
  name: string;
  flag: string;                   // Emoji flag
  description: string;
  teamCount: number;
  playerCount: number;
}
```

## Implementation Phases

### Phase 1: Core Region Selection (Week 1)

**Tasks**:
- [ ] Create region selection modal with visual region cards
- [ ] Implement team selection within chosen region
- [ ] Modify GameInitService to include region/team selection
- [ ] Add region validation and error handling
- [ ] Update store to track player region

**Acceptance Criteria**:
- Players can select from 4 regions at game start
- Team selection limited to chosen region's VCT teams
- Game initializes successfully with any region/team combination
- Clear visual feedback during selection process

### Phase 2: Regional Filtering (Week 2)

**Tasks**:
- [ ] Modify EventScheduler to filter league opponents by region
- [ ] Update ScheduleGenerator for region-specific tournaments
- [ ] Filter scrim partners to player's region
- [ ] Add regional filtering to all relevant UI components
- [ ] Test regional isolation (league matches, tournaments, scrims)

**Acceptance Criteria**:
- League matches only against teams from player's region
- Regional tournaments only include regional teams
- Scrim partners are region-appropriate
- No cross-region contamination in regional activities

### Phase 3: Import Slot System (Week 2-3)

**Tasks**:
- [ ] Implement import slot tracking in Team model
- [ ] Add import slot validation in contract negotiations
- [ ] Create UI indicators for import slots in roster management
- [ ] Add regional badges in free agent list
- [ ] Implement import slot warnings and confirmations

**Acceptance Criteria**:
- Import slots correctly tracked (0-2 range)
- Contract signing blocked when import slots exhausted
- Clear UI feedback on import slot status
- Regional indicators visible in free agent browsing

### Phase 4: International Tournaments (Week 3)

**Tasks**:
- [ ] Ensure Masters/Champions remain cross-region
- [ ] Implement qualification logic from regional tournaments
- [ ] Update tournament scheduling for international events
- [ ] Test full tournament pipeline (regional → international)

**Acceptance Criteria**:
- International tournaments include teams from all regions
- Qualification system works correctly
- Tournament brackets generate properly for international events
- No breaking changes to existing tournament functionality

## UI/UX Requirements

### Region Selection Screen
- **Layout**: Grid of 4 region cards with flags and descriptions
- **Visual Design**: Attractive cards with region branding/colors
- **Information**: Team count, player count per region
- **Selection**: Clear visual feedback, confirmation step

### Team Selection Screen
- **Layout**: List/grid of available teams in selected region
- **Information**: Team name, current roster strength, finances
- **Selection**: Team cards with hover states and selection confirmation

### Import Slot Indicators
- **Roster View**: "X/2 Import Slots Used" badge
- **Free Agent Cards**: Regional badges (Americas, EMEA, etc.)
- **Contract Modal**: Import slot warnings when approaching/exceeding limit
- **Visual Design**: Color-coded indicators (green = available, yellow = warning, red = full)

### Regional Filtering UI
- **Schedule Page**: Only shows regional league matches
- **Tournament Page**: Filters to regional tournaments by default
- **Scrim Modal**: Only shows regional T2/T3 teams
- **Clear Labels**: Indicate when content is regionally filtered

## Testing Strategy

### Unit Tests
- Import slot validation logic
- Regional filtering algorithms
- Tournament qualification logic
- Region selection state management

### Integration Tests
- Full region selection flow (region → team → game start)
- Cross-region tournament participation
- Import slot enforcement across contract operations
- Regional filtering in scheduling and tournaments

### Manual Testing Scenarios
- All 4 regions selectable and functional
- Team selection works for each region
- Regional tournaments work correctly
- International tournaments include all regions
- Import limits enforced properly
- Scrim partners are region-appropriate
- No performance degradation

### Edge Cases
- Region with no available teams (shouldn't happen with VCT data)
- Tournament qualification when regional winner is player's team
- Import slot calculations with player releases/trades
- Mid-season save/load with regional data

## Success Metrics

### Quantitative Metrics
- **Region Selection**: 100% of new games include region selection
- **Regional Filtering**: 100% league matches are intra-region
- **Import Compliance**: 100% contract signings respect import limits
- **Tournament Coverage**: All international tournaments include ≥3 regions

### Qualitative Metrics
- **User Experience**: Smooth region/team selection flow
- **Visual Design**: Intuitive region cards and import indicators
- **Game Balance**: Regional choice feels meaningful without being game-breaking
- **Immersion**: Regional filtering enhances VCT authenticity

## Risk Mitigation

### Technical Risks
- **Tournament Complexity**: Mixing regional and international tournaments
  - *Mitigation*: Clear separation of tournament types, thorough testing

- **UI Complexity**: Multiple selection modals in initialization
  - *Mitigation*: Simple, linear flow with clear progress indicators

- **State Management**: Tracking region and import slots across components
  - *Mitigation*: Centralized in Zustand store with proper selectors

### Game Balance Risks
- **Regional Imbalance**: Some regions might feel stronger/weaker
  - *Mitigation*: Monitor player feedback, adjust if needed (not in scope for this feature)

- **Import Slot Abuse**: Players might game the import system
  - *Mitigation*: Reasonable limits (2 max), clear UI feedback, future balancing if needed

### Performance Risks
- **Filtering Overhead**: Regional filtering might impact performance
  - *Mitigation*: Efficient filtering logic, test with large datasets

## Dependencies

### External Dependencies
- Existing VCT team/player data structure
- Tournament scheduling system
- Contract negotiation system

### Internal Dependencies
- Game initialization flow
- Tournament engine
- Roster management UI
- Scrim system

## Deployment Considerations

### Feature Flags
- **Region Selection**: Can be disabled to fall back to Americas-only
- **Import Slots**: Can be disabled for unlimited cross-region transfers
- **Regional Filtering**: Can be disabled for global access (debug mode)

### Rollback Plan
- **Quick Rollback**: Feature flags to disable region selection
- **Data Migration**: Existing saves continue to work (default to Americas)
- **User Communication**: Clear messaging about regional limitations

### Monitoring
- **Usage Analytics**: Track region selection popularity
- **Error Tracking**: Monitor for region-related bugs
- **Balance Metrics**: Track tournament outcomes by region

## Future Enhancements

### Phase 2 Features (Post-MVP)
- **Regional Prestige**: Different starting bonuses/penalties per region
- **Cross-Region Trades**: Allow trading players between regions beyond imports
- **Regional Events**: Region-specific challenges or story elements
- **Season Migration**: Allow region changes between seasons (not mid-season)

### Technical Improvements
- **Region Statistics**: Advanced analytics on regional performance
- **Custom Regions**: Mod support for custom region creation
- **Dynamic Balancing**: Automatic difficulty adjustment based on region choice

## Conclusion

This feature transforms VCT Manager from a single-region experience to a truly global VCT simulation. By allowing players to choose their region while maintaining strategic cross-region elements (imports, international tournaments), we create a more authentic and engaging experience that respects the global nature of competitive Valorant while providing meaningful regional immersion.

The implementation maintains backward compatibility and includes proper fallbacks, ensuring the feature can be developed and deployed safely.