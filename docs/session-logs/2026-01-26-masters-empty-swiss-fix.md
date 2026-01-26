# Session Log: Fix Masters Santiago Swiss Stage Empty After Kickoffs Complete

**Date**: 2026-01-26
**Phase**: 20
**Status**: Complete

## Problem

After kickoff tournaments complete, Masters Santiago has no teams in the Swiss stage. The `swissTeamIds` array is empty, causing the tournament to be non-functional.

### Root Cause Analysis

1. When the player's kickoff completes, the `QualificationModal` shows immediately (before other regions finish)
2. Modal's `simulateOtherKickoffs()` creates NEW tournaments with different IDs (separate from GlobalTournamentScheduler's)
3. These new tournaments only save `QualificationRecord`s but never call `TeamSlotResolver`
4. The original kickoffs from GlobalTournamentScheduler are the ones TeamSlotResolver monitors
5. Since the original kickoffs are never properly completed (matches played in duplicates), Masters' `swissTeamIds` stays empty

### The Broken Flow (Before)

```
Player's Kickoff Completes
    │
    ▼
TournamentService.handleKickoffCompletion()
    │
    ├── Only processes player's region
    ├── Shows QualificationModal immediately
    │
    ▼
QualificationModal.simulateOtherKickoffs()
    │
    ├── Creates NEW tournament objects (different IDs!)
    ├── Simulates these duplicates
    ├── Saves QualificationRecords
    │
    ▼
TeamSlotResolver never called for duplicates
    │
    ▼
Masters swissTeamIds = [] (empty!)
```

## Solution

Changed the flow so that:
1. All matches simulate day-by-day for ALL regions via `CalendarService`
2. When ANY kickoff completes, save its `QualificationRecord`
3. `TeamSlotResolver.resolveQualifications` is called via `CalendarService` (existing flow)
4. Only show modal when ALL 4 kickoffs are complete
5. Modal receives all qualifications - no simulation needed

### The Fixed Flow (After)

```
All Kickoffs Progress Day-by-Day (via CalendarService)
    │
    ▼
Each Kickoff Completes → handleKickoffCompletion()
    │
    ├── Save QualificationRecord for THIS region
    ├── Check: areAllKickoffsComplete()?
    │       │
    │       ├── No: Return (wait for others)
    │       └── Yes: Continue ▼
    │
    ▼
Show QualificationModal with ALL qualifications
    │
    ▼
User clicks Continue → TournamentTransitionService
    │
    ▼
TeamSlotResolver fills Masters swissTeamIds (8 teams)
```

## Implementation

### 1. TournamentService.ts - `handleKickoffCompletion()`

**Before**: Only processed player's region, showed modal immediately

**After**:
- Save `QualificationRecord` for ALL regions (moved before player-region check)
- Added `areAllKickoffsComplete()` helper
- Only show modal when all 4 kickoffs complete
- Pass all 4 qualifications to modal via `allRegionsQualifiers`

```typescript
handleKickoffCompletion(tournamentId: string): void {
  // Extract qualifiers and save for ALL regions
  const record: QualificationRecord = { ... };
  state.addQualification(record);

  // Only show modal when ALL 4 kickoffs complete
  if (!this.areAllKickoffsComplete()) {
    return;
  }

  // All kickoffs complete - show modal with all qualifications
  const allQualifications = state.getQualificationsForType('kickoff');
  state.openModal('qualification', {
    allRegionsQualifiers: allQualifications,
    ...
  });
}

private areAllKickoffsComplete(): boolean {
  const kickoffs = Object.values(state.tournaments).filter(t => t.type === 'kickoff');
  if (kickoffs.length !== 4) return false;
  return kickoffs.every(t => t.championId || t.status === 'completed');
}
```

### 2. QualificationModal.tsx - Remove Simulation Logic

**Before**: Called `regionalSimulationService.simulateOtherKickoffs()` to simulate other regions

**After**:
- Removed `regionalSimulationService` import
- Removed `isSimulating` state
- Removed `simulationTriggeredRef` ref
- Removed `ensureOtherRegionsSimulated` and `ensureOtherRegionsSimulatedSync` functions
- Simplified handlers to just execute transition and close
- All qualifications are passed in via `data.allRegionsQualifiers`

```typescript
// All qualifications are now passed in from TournamentService (no simulation needed)
const allQualifications = data.allRegionsQualifiers;

// Handle showing all qualifiers (instant - data already available)
const handleSeeAllQualifiers = () => {
  setStep('all');
};

// Handle Continue button - just execute transition and close
const handleContinue = () => {
  tournamentTransitionService.executeTransition(data.transitionConfigId, ...);
  onClose();
};
```

## Files Changed

1. **`src/services/TournamentService.ts`**
   - Modified `handleKickoffCompletion()` to save qualifications for all regions
   - Added `areAllKickoffsComplete()` private helper
   - Changed modal trigger to wait for all 4 kickoffs

2. **`src/components/tournament/QualificationModal.tsx`**
   - Removed `regionalSimulationService` import
   - Removed simulation state and refs
   - Simplified all handlers (no more async simulation)
   - Removed loading states from buttons

## Verification

To verify the fix:

1. Start a new game and play through kickoff phase
2. Advance days until all 4 regional kickoffs complete
3. Qualification modal should appear only when ALL kickoffs are done
4. Modal should show all 4 regions' qualifications instantly (no "Simulating..." state)
5. After closing modal, navigate to Masters Santiago tournament
6. Swiss stage should show 8 teams with Round 1 matches scheduled
7. Verify `swissTeamIds` has 8 entries in the tournament data

## Key Benefits

1. **No Duplicate Tournaments**: Original kickoffs complete naturally, no duplicates created
2. **Proper TeamSlotResolver Flow**: All qualifications saved, Masters slots filled correctly
3. **Cleaner UX**: No loading states, all data available immediately
4. **Simpler Code**: Removed simulation logic from modal component

## Related

- Architecture update: `docs/architecture/core-architecture.md` (Kickoff Completion and Qualification Flow section)
- Previous session: `docs/session-logs/2026-01-26-upfront-match-scheduling.md`
