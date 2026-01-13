# VLR Player Data Integration - Feature Specification

## Overview

**Feature Name**: Real Player Data Integration
**Priority**: High
**Estimated Effort**: 4-6 weeks (part-time)
**Target Release**: Phase 8

## Problem Statement

The VCT Manager game currently uses procedural player generation (`PlayerGenerator.ts`) to create ~400 fictional players with randomized stats, names, and careers. This results in:

- Unrealistic match outcomes
- No connection to actual VCT ecosystem
- Limited replayability and immersion
- Players don't reflect real Valorant skill levels

## Solution

Replace procedural generation with real player data sourced from the vlrggapi (https://github.com/axsddlr/vlrggapi), an unofficial REST API for vlr.gg that provides:

- Current team rankings and rosters
- Detailed player statistics from official tournaments
- Real player names and organizations
- Performance metrics that reflect actual competitive play

## Goals

1. **Authenticity**: Use real VCT player names, teams, and performance data
2. **Accuracy**: Player stats derived from actual tournament performance
3. **Scalability**: System that can be updated with new VLR data
4. **Reliability**: Graceful fallback when API is unavailable
5. **Performance**: Minimal impact on game startup time

## Technical Requirements

### Data Sources

**Primary API**: https://vlrggapi.vercel.app

**Endpoints Used**:
- `GET /rankings?region={region}` - Team rankings and info
- `GET /stats?region={region}&timespan=all` - Player statistics
- `GET /health` - API availability check

**Data Mapping**:
```typescript
// VLR Player Stats → Game Player Interface
interface VlrPlayerStats {
  player: string;           // IGN
  org: string;             // Team name
  rating: string;          // "1.18" (overall rating)
  average_combat_score: string;  // "235.2"
  kill_deaths: string;     // "1.19"
  kill_assists_survived_traded: string;  // "72%"
  average_damage_per_round: string;  // "158.4"
  kills_per_round: string; // "0.81"
  assists_per_round: string; // "0.29"
  first_kills_per_round: string; // "0.19"
  first_deaths_per_round: string; // "0.13"
  headshot_percentage: string; // "26%"
  clutch_success_percentage: string; // "28%"
}
```

### Architecture Changes

**New Components**:
```
src/engine/player/
├── VlrApiClient.ts       # API communication
├── VlrDataProcessor.ts   # Data transformation
├── PlayerDataCache.ts    # Caching layer
└── index.ts

src/services/
├── VlrDataService.ts     # Orchestration layer
└── index.ts

src/types/
├── vlr.ts                # VLR API type definitions
└── index.ts
```

**Modified Components**:
- `GameInitService.ts` - Replace PlayerGenerator with VLR data fetching
- `src/utils/constants.ts` - Remove procedural generation constants

### Stat Conversion Algorithm

**Core Conversion Logic**:

```typescript
function convertVlrToGameStats(vlrStats: VlrPlayerStats): PlayerStats {
  const rating = parseFloat(vlrStats.rating);
  const acs = parseFloat(vlrStats.average_combat_score);
  const kd = parseFloat(vlrStats.kill_deaths);
  const kast = parseFloat(vlrStats.kill_assists_survived_traded.replace('%', '')) / 100;
  const fkpr = parseFloat(vlrStats.first_kills_per_round);
  const clutchPct = parseFloat(vlrStats.clutch_success_percentage.replace('%', '')) / 100;

  // Rating-based base value (0.8-1.5 scale → 50-100 game scale)
  const ratingMultiplier = ((rating - 0.8) / 0.7) * 50 + 50;

  return {
    mechanics: Math.round(Math.min(100, (acs / 3) + ratingMultiplier * 0.3)),
    igl: Math.round(Math.min(100, kast * 100)),
    mental: Math.round(Math.min(100, kd * 40 + ratingMultiplier * 0.2)),
    clutch: Math.round(Math.min(100, clutchPct * 100 + kd * 20)),
    vibes: Math.round(Math.min(100, ratingMultiplier + (Math.random() - 0.5) * 20)),
    lurking: Math.round(Math.min(100, (1 - fkpr * 4) * 60 + ratingMultiplier * 0.2)),
    entry: Math.round(Math.min(100, fkpr * 400 + ratingMultiplier * 0.3)),
    support: Math.round(Math.min(100, kast * 80 + ratingMultiplier * 0.2)),
    stamina: Math.round(Math.min(100, ratingMultiplier + (Math.random() - 0.5) * 15))
  };
}
```

**Validation Rules**:
- All stats must be 0-100
- Overall rating should correlate with VLR rating
- Team players should have correlated stats (no 90 mechanics + 30 clutch)

### Data Processing Pipeline

1. **Fetch Phase**: Parallel API calls for all regions
2. **Correlation Phase**: Match players to teams via "org" field
3. **Transformation Phase**: Convert VLR stats to game format
4. **Enrichment Phase**: Add missing data (age, nationality, preferences)
5. **Validation Phase**: Ensure data completeness and consistency

### Caching Strategy

**Storage**: IndexedDB via Dexie.js (existing game persistence)

**Cache Structure**:
```typescript
interface VlrCache {
  id: 'vlr-data-v1';
  lastFetch: string;        // ISO date
  ttl: number;             // 7 days in milliseconds
  rankings: VlrRanking[];
  playerStats: VlrPlayerStats[];
  processedPlayers: Player[];
}
```

**Refresh Logic**:
- Check cache validity on game start
- Auto-refresh if cache > 7 days old
- Manual refresh option in settings
- Fallback to cached data if API unavailable

### Error Handling & Fallbacks

**API Failure Scenarios**:
1. **Network Error**: Use cached data with warning
2. **API Down**: Show retry option, fallback to procedural generation
3. **Partial Data**: Use available data, generate missing players procedurally
4. **Invalid Data**: Validate and sanitize, skip corrupted entries

**Fallback Strategy**:
```typescript
async function getPlayerData(): Promise<Player[]> {
  try {
    // Try VLR API first
    const vlrData = await fetchVlrData();
    if (vlrData) return processVlrData(vlrData);
  } catch (error) {
    console.warn('VLR API failed, trying cache:', error);
  }

  try {
    // Try cached data
    const cachedData = await getCachedVlrData();
    if (cachedData && isCacheValid(cachedData)) {
      return cachedData.processedPlayers;
    }
  } catch (error) {
    console.warn('Cache failed, using procedural generation:', error);
  }

  // Final fallback: procedural generation
  return playerGenerator.generatePlayers(400);
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

**Tasks**:
- [ ] Create VLR API client (`VlrApiClient.ts`)
- [ ] Define TypeScript types for VLR data (`src/types/vlr.ts`)
- [ ] Implement basic data fetching with error handling
- [ ] Add API health checking
- [ ] Create unit tests for API client

**Acceptance Criteria**:
- Can fetch rankings and stats for all regions
- Proper error handling for network failures
- API responses parsed correctly
- Basic logging and monitoring

### Phase 2: Data Processing (Week 3)

**Tasks**:
- [ ] Implement stat conversion algorithm
- [ ] Create data correlation logic (players ↔ teams)
- [ ] Add data validation and sanitization
- [ ] Generate missing player attributes (age, nationality, etc.)
- [ ] Create data processing pipeline

**Acceptance Criteria**:
- VLR stats convert to valid game stats (0-100 range)
- Players correctly matched to teams
- All required Player fields populated
- Processing handles edge cases gracefully

### Phase 3: Caching & Persistence (Week 4)

**Tasks**:
- [ ] Implement IndexedDB caching layer
- [ ] Add cache validation and refresh logic
- [ ] Create cache management utilities
- [ ] Add cache size limits and cleanup
- [ ] Implement offline support

**Acceptance Criteria**:
- Data persists between sessions
- Cache automatically refreshes when stale
- Reasonable storage usage (< 50MB)
- Works offline with cached data

### Phase 4: Game Integration (Week 5)

**Tasks**:
- [ ] Modify `GameInitService` to use VLR data
- [ ] Add loading states for data fetching
- [ ] Implement fallback to procedural generation
- [ ] Update team generation logic
- [ ] Add progress indicators for long operations

**Acceptance Criteria**:
- Game starts successfully with VLR data
- Loading times acceptable (< 30 seconds)
- Fallback works when API unavailable
- No breaking changes to existing functionality

### Phase 5: Testing & Balancing (Week 6)

**Tasks**:
- [ ] Test match simulations with real data
- [ ] Balance stat conversion formulas
- [ ] Validate team chemistry calculations
- [ ] Performance optimization
- [ ] End-to-end testing

**Acceptance Criteria**:
- Match outcomes feel realistic
- Team strengths reflect real VCT standings
- Game performance not degraded
- All edge cases handled

## Success Metrics

### Quantitative Metrics
- **Data Accuracy**: 95% of players have valid VLR data
- **Performance**: Game startup < 30 seconds with fresh data
- **Reliability**: < 5% API failure rate (with caching)
- **Coverage**: All major VCT teams represented

### Qualitative Metrics
- **Realism**: Players recognize real pro players and teams
- **Immersion**: Match outcomes feel authentic
- **Replayability**: Different team compositions feel meaningful
- **User Experience**: Smooth loading with clear feedback

## Risk Mitigation

### Technical Risks
- **API Dependency**: VLR API could change or go down
  - *Mitigation*: Caching, fallback to procedural, monitor API health

- **Data Quality**: VLR data might be incomplete or inaccurate
  - *Mitigation*: Validation, sanitization, manual overrides

- **Performance Impact**: Large datasets slow game startup
  - *Mitigation*: Progressive loading, caching, lazy initialization

### Business Risks
- **Legal Concerns**: Using unofficial API for commercial game
  - *Mitigation*: Monitor terms of service, have backup data strategy

- **Data Freshness**: Player rosters change frequently
  - *Mitigation*: Regular cache refresh, versioned data structure

## Dependencies

### External Dependencies
- **vlrggapi**: Unofficial VLR REST API (https://vlrggapi.vercel.app)
- **Network Access**: Required for initial data fetch

### Internal Dependencies
- **Existing Game Architecture**: Zustand store, Dexie persistence
- **Player System**: Must maintain compatibility with existing Player interface
- **Team System**: Team generation logic needs updates

## Testing Strategy

### Unit Tests
- API client functionality
- Data transformation algorithms
- Cache operations
- Error handling paths

### Integration Tests
- Full data pipeline (API → Processing → Game)
- Game initialization with VLR data
- Fallback scenarios

### Manual Testing
- Match simulation balance
- Team chemistry calculations
- UI loading states
- Offline functionality

## Deployment Considerations

### Rollout Strategy
1. **Beta Release**: Enable feature flag for VLR data
2. **A/B Testing**: Compare procedural vs real data
3. **Gradual Rollout**: Start with Americas region only
4. **Full Release**: Enable for all regions

### Monitoring
- API response times and success rates
- Cache hit/miss ratios
- Game startup performance
- User-reported issues

### Rollback Plan
- Feature flag to disable VLR data
- Automatic fallback to procedural generation
- Cache clearing mechanism

## Future Enhancements

### Phase 2 Features (Post-MVP)
- **Dynamic Updates**: Real-time roster changes during season
- **Historical Data**: Player career progression over seasons
- **Advanced Stats**: Include map-specific performance
- **Player Development**: Training based on real player weaknesses

### Technical Improvements
- **GraphQL Integration**: More efficient data fetching
- **WebSocket Updates**: Real-time data updates
- **Machine Learning**: Better stat conversion algorithms
- **Multi-Source Data**: Combine multiple esports APIs

## Conclusion

This feature transforms VCT Manager from a generic management sim into an authentic VCT experience by using real player data. The implementation maintains backward compatibility while significantly improving realism and engagement.

The modular architecture ensures the feature can be developed incrementally with proper fallbacks, minimizing risk to the existing codebase.