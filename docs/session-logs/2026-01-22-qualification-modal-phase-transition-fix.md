# Session Log: Qualification Modal Phase Transition Fix

**Date**: 2026-01-22
**Feature**: Bug fix for Masters tournament creation and phase transition
**Status**: Fixed

---

## Problem Statement

After completing the regional Kickoff tournament, clicking "Continue" on the QualificationModal did not transition the game to the Masters Santiago phase. The user could click "Advance Day" infinitely and remain stuck in the Kickoff phase.

### Root Cause

The `QualificationModal` component had two separate code paths for closing:

1. **"Continue" button** → Simulated other regions → Closed modal (MISSING: Masters creation)
2. **"View Masters Bracket" button** → Created Masters tournament → Navigated to tournament view

The bug occurred when users clicked "Continue" because this path never called `createMastersTournament()`, so:
- Other regions were simulated ✓
- Masters tournament was never created ✗
- Phase remained stuck on "kickoff" ✗
- No Masters matches appeared on the calendar ✗

Additionally, the `handleClose()` function (used for Escape key and backdrop clicks) also had the same issue.

---

## Solution

### 1. Updated `handleContinue()` Function

**File**: `src/components/tournament/QualificationModal.tsx`

```typescript
// Before:
const handleContinue = async () => {
  setIsSimulating(true);
  try {
    await ensureOtherRegionsSimulated();
    onClose();  // ❌ Missing Masters creation
  } catch (error) {
    console.error('Failed to simulate other regions:', error);
    onClose();
  } finally {
    setIsSimulating(false);
  }
};

// After:
const handleContinue = async () => {
  setIsSimulating(true);
  try {
    await ensureOtherRegionsSimulated();

    // ✓ Create Masters tournament now that all 4 regions are complete
    const masters = regionalSimulationService.createMastersTournament();
    if (masters) {
      console.log('Masters Santiago created successfully:', masters.name);
    } else {
      console.error('Failed to create Masters tournament');
    }

    onClose();
  } catch (error) {
    console.error('Failed to simulate other regions:', error);
    onClose();
  } finally {
    setIsSimulating(false);
  }
};
```

### 2. Updated `handleClose()` Function

**File**: `src/components/tournament/QualificationModal.tsx`

```typescript
// Before:
const handleClose = useCallback(() => {
  ensureOtherRegionsSimulatedSync();
  onClose();  // ❌ Missing Masters creation
}, [ensureOtherRegionsSimulatedSync, onClose]);

// After:
const handleClose = useCallback(() => {
  ensureOtherRegionsSimulatedSync();

  // ✓ Create Masters tournament now that all 4 regions are complete
  const masters = regionalSimulationService.createMastersTournament();
  if (masters) {
    console.log('Masters Santiago created successfully:', masters.name);
  } else {
    console.error('Failed to create Masters tournament');
  }

  onClose();
}, [ensureOtherRegionsSimulatedSync, onClose]);
```

### 3. Made `createMastersTournament()` Idempotent

**File**: `src/services/RegionalSimulationService.ts`

Added idempotency check to prevent creating duplicate Masters tournaments if the function is called multiple times:

```typescript
createMastersTournament(): Tournament | null {
  const state = useGameStore.getState();

  // ✓ Check if Masters tournament already exists (idempotency)
  const existingMasters = Object.values(state.tournaments).find(
    (t) => t.name === 'VCT Masters Santiago 2026'
  );

  if (existingMasters) {
    console.log('Masters Santiago already exists, returning existing tournament');
    // Ensure phase is set correctly
    if (state.calendar.currentPhase !== 'masters1') {
      state.setCurrentPhase('masters1');
    }
    return existingMasters;
  }

  // Continue with normal creation logic...
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/tournament/QualificationModal.tsx` | Updated `handleContinue()` and `handleClose()` to call `createMastersTournament()` after simulating other regions |
| `src/services/RegionalSimulationService.ts` | Added idempotency check to `createMastersTournament()` to prevent duplicate tournament creation |

---

## What's Now Working

1. **"Continue" button flow**:
   - Simulates other 3 regional Kickoffs ✓
   - Creates Masters Santiago tournament ✓
   - Transitions phase to 'masters1' ✓
   - Adds Masters matches to calendar ✓
   - User can see Masters tournament in Tournament page ✓

2. **"Escape key / Backdrop click" flow**:
   - Same as "Continue" button ✓

3. **"View Masters Bracket" button flow**:
   - Already worked, unchanged ✓

4. **Idempotency**:
   - Multiple calls to `createMastersTournament()` won't create duplicates ✓
   - If Masters already exists, returns existing tournament ✓
   - Ensures phase is set to 'masters1' ✓

---

## Testing Steps

1. Start new game (or load save at Kickoff phase)
2. Complete your regional Kickoff tournament
3. When QualificationModal appears, click **"Continue"**
4. Verify:
   - Modal closes ✓
   - Current phase is "Masters Santiago" (check dashboard) ✓
   - Tournament page shows "VCT Masters Santiago 2026" ✓
   - Calendar shows Masters matches scheduled ✓
   - Clicking "Advance Day" progresses time normally ✓

---

## Implementation Pattern

This fix follows the **"Ensure Consistency Across All Exit Paths"** pattern:

**Problem**: Modal has multiple ways to close (Continue, Escape, Backdrop, View Masters)

**Solution**: Ensure all exit paths perform the same critical operations:
1. Simulate other regions (if needed)
2. Create Masters tournament
3. Close modal

**Code Structure**:
```typescript
// Shared simulation logic
ensureOtherRegionsSimulated() → Sets allQualifications state

// Multiple close handlers, all call createMastersTournament():
handleContinue() → simulate + create + close
handleClose() → simulate + create + close
handleViewMasters() → create + navigate (simulation already done)
```

---

## Architecture Notes

### Phase Transition Flow

```
Kickoff Tournament Completes
    ↓
QualificationModal Opens (shows player's region)
    ↓
User clicks "Continue" (or Escape, or Backdrop)
    ↓
ensureOtherRegionsSimulated() runs
    ├── Simulates 3 other regional Kickoffs
    └── Saves qualifications to store
    ↓
createMastersTournament() runs
    ├── Validates 4 regional qualifications exist
    ├── Separates alpha (Kickoff winners) from beta+omega (Swiss participants)
    ├── Creates Swiss-to-Playoff tournament (VCT Masters Santiago 2026)
    ├── Schedules Swiss Round 1 matches
    ├── Adds calendar events
    └── Sets phase to 'masters1'
    ↓
Modal closes
    ↓
Dashboard/Tournament page now shows Masters Santiago
```

### Idempotency Rationale

The modal has multiple code paths, and users could theoretically:
1. Click "See All Qualifiers" → "Back" → "Continue" (calls create twice)
2. Close modal via Escape after clicking "See All" (calls create twice)

Making `createMastersTournament()` idempotent prevents:
- Duplicate tournaments in the store
- Duplicate calendar events
- Inconsistent state

---

## Related Documentation

- **Phase Transitions**: See `docs/vct_manager_game_technical_specification.md` section "VCT 2026 Season Structure"
- **Swiss Format**: See session log `2026-01-21-masters-swiss-stage.md`
- **Regional Simulation**: See session log `2026-01-17-tournament-progression-qualification.md`

---

## Next Steps

The bug is now fixed. Users should be able to:
1. Complete Kickoff → See qualification modal
2. Click Continue → See Masters Santiago in tournament list
3. Advance through time → Play Swiss matches
4. Complete Swiss → Transition to Playoffs
5. Complete Playoffs → Transition to Stage 1

No further work needed on this issue.
