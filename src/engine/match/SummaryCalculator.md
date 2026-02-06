# SummaryCalculator

## Overview

The `SummaryCalculator` is a core component of the Round Simulation & Timeline Revamp. It derives round summary statistics **exclusively** from timeline events, following the principle:

> **If an event is not in the timeline, it MUST NOT appear in the summary.**

## Purpose

- Ensures internal consistency between timeline events and round summaries
- Prevents summary data from being generated independently of what actually happened
- Makes the simulation system deterministic and verifiable
- Enables validation by reconstructing summaries from stored timelines

## Architecture

```
Timeline Events (Source of Truth)
         ↓
   SummaryCalculator
         ↓
  DerivedRoundSummary (Read-only)
```

## Core Principle

The SummaryCalculator is a **pure derivation engine**. It:
- ✅ Reads timeline events
- ✅ Counts, filters, and aggregates event data
- ✅ Derives statistics from event sequences
- ❌ Never generates or assumes data
- ❌ Never creates events
- ❌ Never modifies the timeline

## Usage

```typescript
import { summaryCalculator } from './SummaryCalculator';

const summary = summaryCalculator.deriveFromTimeline({
  timeline: roundTimeline,
  playerStates: playerStateMap,
  teamAPlayerIds: new Set(['p1', 'p2', 'p3', 'p4', 'p5']),
  teamBPlayerIds: new Set(['p6', 'p7', 'p8', 'p9', 'p10']),
});

console.log(summary.firstBlood); // { killerId, killerName, victimId, ... }
console.log(summary.totalKills);  // Count of kill events
console.log(summary.spikePlanted); // true if PlantCompleteEvent exists
```

## What It Derives

### First Blood
- **Source**: First `SimKillEvent` in timeline
- **Result**: Player names, timestamp, weapon used
- **Null if**: No kills occurred

### Spike Events
- **spikePlanted**: Presence of `PlantCompleteEvent`
- **plantSite**: Site from `PlantCompleteEvent`
- **spikeDefused**: Presence of `DefuseCompleteEvent`
- **spikeDetonated**: Presence of `SpikeDetonationEvent`
- **plantsAttempted**: Count of `PlantStartEvent`
- **plantsInterrupted**: Count of `PlantInterruptEvent`
- **defusesAttempted**: Count of `DefuseStartEvent`
- **defusesInterrupted**: Count of `DefuseInterruptEvent`

### Combat Stats
- **totalKills**: Count of `SimKillEvent`
- **totalHeadshots**: Count of `SimKillEvent` where `isHeadshot === true`
- **headshotPercentage**: `(headshots / kills) * 100`
- **totalDamage**: Sum of `SimDamageEvent.totalDamage`
- **tradeKills**: Count of `TradeKillEvent`

### Clutch Detection
- **Algorithm**: Reconstruct alive player counts after each kill
- **Trigger**: When exactly 1 player remains on one team vs 2+ on the other
- **Won**: Clutch player in `RoundEndEvent.survivors`
- **Null if**: No 1vN situation occurred

### Ability Usage
- **abilitiesUsed**: Count of `AbilityUseEvent`
- **ultimatesUsed**: Count of `AbilityUseEvent` where `slot === 'ultimate'`
- **healsApplied**: Count of `HealEvent`
- **totalHealing**: Sum of `HealEvent.amount`

### Round Info
- **roundDuration**: Timestamp of last event
- **winCondition**: From `RoundEndEvent`
- **winner**: From `RoundEndEvent`

## Example: Clutch Detection

Given this timeline:
```typescript
[
  { type: 'kill', victimId: 'a2', ... }, // a2 dies → 1v2 clutch starts for a1
  { type: 'kill', killerId: 'a1', victimId: 'd1', ... }, // a1 gets kill
  { type: 'kill', killerId: 'a1', victimId: 'd2', ... }, // a1 wins clutch
  { type: 'round_end', survivors: ['a1'], ... }
]
```

Produces:
```typescript
clutchAttempt: {
  playerId: 'a1',
  playerName: 'Alice',
  situation: '1v2',
  startTimestamp: 5000,
  won: true,
  killsDuring: 2
}
```

## Validation

The `SummaryCalculator` enforces:
1. **Timeline must have a `round_end` event** - throws error otherwise
2. **All references must exist in playerStates** - falls back to 'Unknown' if missing
3. **Derived values are read-only** - summary is a computed result, not state

## Testing

See `__tests__/SummaryCalculator.test.ts` for comprehensive test coverage:
- ✅ First blood extraction
- ✅ Spike event detection
- ✅ Damage aggregation
- ✅ Ability usage counting
- ✅ Clutch detection (won and lost)
- ✅ Edge cases (no kills, no events, etc.)

## Integration

The `SummaryCalculator` integrates with:
- **RoundSimulator**: Calls `deriveFromTimeline` after generating timeline
- **TimelineValidator**: Summary can be re-derived to verify consistency
- **UI Components**: Summary feeds round statistics displays

## Related Files

- `src/types/round-simulation.ts` - Type definitions
- `src/engine/match/RoundSimulator.ts` - Main consumer
- `src/engine/match/TimelineValidator.ts` - Validation system
- Plan file: `~/.claude/plans/cryptic-leaping-tulip.md`
