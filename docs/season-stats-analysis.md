# Season Stats System Analysis

## Executive Summary

This document provides a comprehensive analysis of the current season stats population and data flow in the vct-manager codebase, identifying gaps and providing a roadmap for implementing a complete season stats system.

## Current Implementation Analysis

### Data Structures

**Current Season Stats Interface:**
```typescript
export interface PlayerSeasonStats {
  season: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  tournamentsWon: number;
}
```

**Storage Pattern:**
- Stored directly on Player object (`player.seasonStats`)
- Single current season stats only
- No historical season data storage

### Current Data Flow

**Match Simulation → Season Stats Flow:**
1. Match simulation generates `MatchResult` with `MapResult` and `PlayerMapPerformance`
2. `MatchService.processMatchResult()` updates player stats
3. Service layer calls `updatePlayer()` with new aggregated stats
4. Season stats updated using weighted averages in `MatchService.ts:352-387`

**Calculation Logic:**
```typescript
const seasonAvgKills =
  (currentSeasonStats.avgKills * currentSeasonStats.matchesPlayed + avgKillsThisMatch) /
  seasonMatchesPlayed;
```

### Calendar System Context

**Current Implementation:**
```typescript
export interface GameCalendar {
  currentDate: string;
  currentSeason: number;
  currentPhase: SeasonPhase;
}
```

**Season Phases Available:**
- `'offseason' | 'kickoff' | 'stage1' | 'stage1_playoffs' | 'stage2' | 'stage2_playoffs' | 'masters1' | 'masters2' | 'champions'`

**Missing:**
- No season transition logic
- No season end processing
- `season_end` phase exists but marked as "Future feature"

## Critical Gaps Identified

### 1. Historical Season Data Storage
**Problem:** Only current season stats are maintained
**Impact:** No historical data for season comparisons or trends
**Solution:** Need dedicated storage for historical season stats

### 2. Season Transition Logic
**Problem:** No end-of-season processing
**Impact:** Stats never reset or archive at season end
**Solution:** Implement season end logic in `SeasonManager`

### 3. Season Context in Queries
**Problem:** All stats queries return current season only
**Impact:** No way to access historical season data
**Solution:** Add season filtering to all stats queries

### 4. Season Selection UI
**Problem:** No way to view historical seasons
**Impact:** Users can only see current season stats
**Solution:** Add season selector to PlayerDetailModal and other components

## Architecture Recommendations

### Phase 1: Foundation
1. **Create `SeasonStatsSlice`** for historical season data storage
2. **Implement season transition logic** in `SeasonManager`
3. **Add season context** to all stats queries

### Phase 2: Storage
1. **Archive current season stats** at season end
2. **Store historical season data** in dedicated store
3. **Implement season lookup and filtering**

### Phase 3: UI/UX
1. **Add season selection interface** to PlayerDetailModal
2. **Display historical season stats** with proper filtering
3. **Add season comparison features**

### Phase 4: Analytics
1. **Season-over-season comparisons**
2. **Historical trends analysis**
3. **Multi-season analytics**

## Dependent Task Requirements

### For `vct-manager-svr` (Fix season stats calculation logic)
**Required Information:**
1. Season context from calendar system
2. Historical data archival logic
3. Transition logic for season changes
4. Updated data structures for historical storage

**Implementation Points:**
- Must handle season transitions in calculation logic
- Need to archive old season stats before updating new ones
- Must use weighted averages for season stat updates
- Should integrate with new `SeasonStatsSlice`

### For `vct-manager-6si` (Update PlayerDetailModal)
**Required Information:**
1. Season selection UI components
2. Historical data access methods
3. Season filtering logic
4. Display patterns for historical vs current data

**Implementation Points:**
- Add season selector to PlayerDetailModal
- Implement season-based data loading
- Handle "current season" vs "historical season" display
- Add season filtering to stats display

### For `vct-manager-lhy` (Add season context to player data)
**Required Information:**
1. Store structure for season context
2. Data flow patterns for season filtering
3. Normalization requirements
4. Integration with existing store slices

**Implementation Points:**
- Create new `SeasonStatsSlice` for historical data
- Add season context to player data queries
- Implement season filtering in store operations
- Ensure proper data normalization

### For `vct-manager-chn` (Create tests for season stats)
**Required Information:**
1. Test scenarios for season transitions
2. Calculation logic test cases
3. Historical data archival tests
4. UI interaction test cases

**Implementation Points:**
- Test season transition logic
- Test weighted average calculations
- Test historical data archival and retrieval
- Test season selection UI interactions

## Technical Implementation Details

### Data Flow Updates
```typescript
// Current flow (needs enhancement)
MatchResult → MatchService.processMatchResult() → updatePlayer()

// Enhanced flow (proposed)
MatchResult → MatchService.processMatchResult() → 
  ├── Check season transition → Archive old season stats
  └── Update current season stats with weighted averages
  └── Store in SeasonStatsSlice for historical access
```

### Store Structure Proposal
```typescript
// Current: Player.seasonStats (current only)
// Proposed: SeasonStatsSlice (historical + current)
interface SeasonStatsSlice {
  [playerId: string]: {
    [season: number]: PlayerSeasonStats;
  };
}
```

### Season Transition Logic
```typescript
// In SeasonManager
checkSeasonTransition() {
  if (currentPhase === 'season_end') {
    archiveCurrentSeasonStats();
    initializeNewSeason();
  }
}
```

## Risk Assessment

### High Risk
- **Data Loss:** Current season stats could be lost during transition
- **Performance:** Historical data storage could impact performance
- **Complexity:** Season filtering adds complexity to queries

### Medium Risk
- **Backward Compatibility:** Changes may break existing functionality
- **Testing Coverage:** Comprehensive testing required for all scenarios
- **UI Complexity:** Season selection adds UI complexity

### Low Risk
- **Data Migration:** Current data structure is compatible
- **Integration Points:** Clear interfaces for dependent tasks
- **Scalability:** Architecture supports future enhancements

## Success Criteria

### Functional Requirements
- [ ] Historical season stats are properly archived
- [ ] Season transitions are handled correctly
- [ ] Season filtering works for all stats queries
- [ ] Season selection UI is intuitive and functional
- [ ] Season comparisons and analytics are available

### Technical Requirements
- [ ] No data loss during season transitions
- [ ] Performance impact is minimal
- [ ] Backward compatibility is maintained
- [ ] Code follows existing architecture patterns
- [ ] Comprehensive test coverage is achieved

### User Experience Requirements
- [ ] Users can easily view historical season stats
- [ ] Season selection is intuitive and responsive
- [ ] Historical data is presented clearly
- [ ] Season comparisons are meaningful and useful
- [ ] No performance degradation in UI interactions

## Next Steps

1. **Document Current State:** Complete analysis of existing implementation
2. **Design Architecture:** Create detailed implementation plan
3. **Implement Foundation:** Build core season stats system
4. **Update Dependent Tasks:** Provide specific requirements to each task
5. **Test Thoroughly:** Ensure comprehensive test coverage
6. **Iterate Based on Feedback:** Refine based on testing and user feedback

This analysis provides the foundation for implementing a complete season stats system that addresses all current gaps while maintaining compatibility with existing functionality.