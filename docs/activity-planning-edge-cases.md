# Activity Planning System - Edge Cases Handled

This document tracks the edge case handling for the scheduled training & scrim planning system (Step 18 of the implementation plan).

## Edge Cases Implemented

### 1. Save/Load: Prune Configs for Past Dates ✅

**Issue:** Activity configs accumulate over time as users save/load games. Old configs for past dates are no longer needed.

**Solution:**
- File: `src/store/middleware/persistence.ts`
- Function: `pruneOldActivityConfigs()`
- Logic: On game load, only keep configs for events on current date or future dates
- Old configs are automatically discarded

**Test:**
1. Configure activities for multiple days
2. Save game
3. Advance several days
4. Load game
5. Verify old configs are pruned from state

---

### 2. Weekly Limits: Auto-Config Respects Training and Scrim Limits ✅

**Issue:** Auto-configuration should respect weekly limits (2 trainings per player, 4 scrims per team) to prevent unrealistic scheduling.

**Solution:**

#### Training (2/week limit per player)
- File: `src/services/TrainingService.ts`
- Method: `autoAssignTraining()`
- Logic: Already checks `checkWeeklyLimit()` for each player (lines 548-551)
- Players at weekly limit are skipped from auto-assignment

#### Scrim (4/week limit per team)
- File: `src/services/ScrimService.ts`
- Method: `generateAutoConfig()`
- Logic: Added `checkWeeklyLimit()` check before generating config
- Returns `null` if weekly scrim limit is reached
- TimeBar treats `null` as "skip scrim" and creates a skip config

**Test:**
1. Exhaust weekly training limit for a player (train 2x in one week)
2. Trigger auto-config on next training event
3. Verify that player is skipped in auto-assigned plan
4. Repeat for scrims (4 scrims in one week, then auto-config)
5. Verify scrim is auto-skipped

---

### 3. Re-editing: Clicking Configured Event Re-opens Modal with Saved Config ✅

**Issue:** Users should be able to review and modify already-configured activities.

**Solution:**
- File: `src/components/today/DayPlanPanel.tsx`
- Logic: Already implemented (lines 246-268)
- When opening TrainingModal or ScrimModal, passes `existingConfig` prop
- Modals pre-populate form fields from existing config

**Test:**
1. Configure a training event with specific players/goals/intensity
2. Click the "Configured" event card again
3. Verify modal opens with previously saved configuration
4. Modify configuration and save
5. Verify changes are persisted

---

### 4. Match Days: No Activity Cards Shown ✅

**Issue:** Training and scrims shouldn't be scheduled on match days.

**Solution:**
- File: `src/components/today/DayPlanPanel.tsx`
- Logic: Already implemented (lines 130-163)
- Uses `useMatchDay()` hook to detect match days
- Shows "MATCH DAY" message instead of activity cards
- Provides quick access to roster but no training/scrim configuration

**Test:**
1. Navigate to a match day
2. Open Today page
3. Verify no training or scrim cards are shown
4. Verify "MATCH DAY" message is displayed

---

### 5. Scrim Partner Cancellation: Still Works During Resolution ✅

**Issue:** Random scrim partner cancellations (`rollRelationshipEvent`) could break activity resolution.

**Solution:**
- File: `src/services/ScrimService.ts`
- Method: `scheduleScrim()`
- Logic: Scrim engine already handles cancellation via `rollRelationshipEvent()`
- Cancellation is checked during execution, not during configuration
- If partner cancels, scrim fails gracefully with error message
- ActivityResolutionService handles failed scrims (returns null)

**Test:**
1. Configure a scrim with a partner
2. Manually trigger a partner cancellation event (if possible via drama system)
3. Advance day
4. Verify scrim gracefully fails without crashing
5. Verify DayRecapModal shows scrim was skipped/cancelled

**Note:** This is already handled by the existing scrim engine, no code changes needed.

---

### 6. All Players Skip Training: Event is Configured, Morale Boost Only ✅

**Issue:** If all players skip training, the training event should still be considered "configured" and should resolve with morale boost only.

**Solution:**
- File: `src/services/ActivityResolutionService.ts`
- Method: `resolveAllActivities()`
- Logic: Already implemented (lines 170-174)
- Checks if all assignments have `action='skip'`
- Sets `skippedTraining: true` in result
- Each skipped player gets morale boost via `applyRestMoraleBoost()` (+1 to +2 morale)

**Test:**
1. Configure training event with all players marked "Skip"
2. Verify event shows "Configured" status (not "Needs Setup")
3. Advance day
4. Verify DayRecapModal shows "Training skipped - team rests"
5. Verify all players receive small morale boost

---

## Summary

All 6 edge cases from Step 18 are now handled:

| Edge Case | Status | File(s) Modified |
|-----------|--------|------------------|
| Save/load pruning | ✅ Implemented | `persistence.ts` |
| Weekly limits (training) | ✅ Already working | `TrainingService.ts` |
| Weekly limits (scrim) | ✅ Implemented | `ScrimService.ts` |
| Re-editing configs | ✅ Already working | `DayPlanPanel.tsx` |
| Match day handling | ✅ Already working | `DayPlanPanel.tsx` |
| Scrim cancellation | ✅ Already working | `ScrimService.ts` |
| All players skip | ✅ Already working | `ActivityResolutionService.ts` |

**New Code Added:**
- `pruneOldActivityConfigs()` in `persistence.ts` - Prunes old activity configs on game load
- Weekly limit check in `ScrimService.generateAutoConfig()` - Prevents auto-config when limit reached

**Existing Code Verified:**
- Re-editing, match days, scrim cancellation, and all-skip training were already properly handled by the existing implementation.
