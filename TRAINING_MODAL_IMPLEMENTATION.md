# Single-Modal Training Layout Implementation

## Summary

Successfully implemented the new single-modal 3-column training layout (vct-manager-5q1), replacing the previous multi-step wizard with a more efficient per-player assignment system.

## Layout Structure

```
┌──────────────┬──────────────────┬─────────────────────┐
│ Player List  │ Training Focus   │ Intensity & Preview  │
│              │                  │                      │
│ Starting 5   │ Goal selector    │ Intensity buttons    │
│ (expanded)   │ with icons       │                      │
│              │                  │ Projected OVR change │
│ Bench/       │ Impact preview   │ Morale impact        │
│ Reserves     │ (+FB Rate, etc)  │ Fatigue risk         │
│ (collapsed)  │                  │                      │
│              │                  │ [Train X Players]    │
└──────────────┴──────────────────┴─────────────────────┘
```

## Key Features

### 1. Three-Column Layout

- **Left Column (280px)**: Player list with Starting 5 / Bench split
  - Starting 5 always expanded
  - Bench/reserves collapsible
  - Shows OVR and training sessions used (X/2)
  - Checkbox to toggle player in/out of training plan
  - Visual selection highlighting

- **Middle Column (flexible)**: Goal-based training selector
  - Shows all 7 training goals with descriptions
  - Displays recommended goal for selected player
  - Shows impact preview descriptors (+First Blood Rate, etc.)
  - Empty state when no player selected

- **Right Column (320px)**: Intensity and preview panel
  - 3 intensity buttons (Light, Moderate, Intense)
  - Live preview of OVR change for selected player
  - Morale impact preview
  - Stat improvements preview (top 6 stats)
  - Aggregate summary of all assigned players
  - "Train X Players" button with count

### 2. State Management

Uses two main state concepts:
- **Training Plan** (`Map<playerId, PlayerTrainingAssignment>`): Accumulated assignments for all players
- **Selected Player**: Currently selected player for viewing/editing in middle/right columns

### 3. User Workflow

1. Click a player checkbox → auto-assigns recommended goal + moderate intensity
2. Player becomes selected → middle/right columns show their assignment
3. Click different goals → updates that player's goal
4. Click different intensity → updates that player's intensity
5. Select another player → view/edit their assignment
6. Click "Train X Players" → executes all assignments in one batch

### 4. API Integration

Uses the new goal-based training system:
- `trainingService.getRecommendedGoal(playerId)` - Auto-fill recommendations
- `trainingService.getAllGoals()` - Get all available goals
- `trainingService.previewOvrChange()` - Live OVR preview
- `trainingService.previewStatChanges()` - Stat improvement ranges
- `trainingService.previewMoraleImpact()` - Morale impact preview
- `trainingService.executeTrainingPlan(plan)` - Execute per-player assignments
- `TRAINING_GOAL_MAPPINGS` - Goal metadata (display names, descriptions, impact descriptors)

## Component Architecture

File: `src/components/calendar/TrainingModal.tsx`

### Main Component: `TrainingModal`
- Orchestrates the entire modal
- Manages training plan state
- Handles training execution and results display

### Sub-Components:

1. **`PlayerListColumn`**
   - Renders player list with Starting 5 / Bench split
   - Handles player selection and assignment toggling
   - Shows training status (sessions used, can train)

2. **`PlayerListItem`**
   - Individual player row
   - Checkbox for assignment
   - OVR and session count display
   - Selection highlighting

3. **`GoalSelectorColumn`**
   - Displays all training goals as buttons
   - Shows recommended goal badge
   - Displays goal descriptions and impact preview descriptors
   - Empty state when no player selected

4. **`IntensityPreviewColumn`**
   - Intensity selector buttons
   - Per-player preview (OVR, morale, stats)
   - Aggregate training plan summary
   - Training execution button

## Benefits Over Previous System

1. **Single Modal**: No more multi-step wizard - everything visible at once
2. **Per-Player Assignments**: Each player can have different goals and intensities
3. **Live Preview**: Real-time feedback on training outcomes as you build the plan
4. **Goal-Based UX**: User-friendly training goals instead of raw stat focuses
5. **Efficient Workflow**: Select, assign, preview, train - all in one view
6. **Recommended Goals**: Auto-suggests optimal training for each player
7. **Visual Feedback**: Clear indication of assigned players, selected player, and recommended goals

## Testing

The implementation uses:
- Existing training service APIs (already tested)
- Standard React patterns (useState, useMemo)
- Type-safe TrainingPlan data structure

Manual testing recommended:
1. Open training modal on a match-free day
2. Select players and verify auto-assigned goals
3. Change goals and intensities
4. Verify preview updates correctly
5. Execute training and verify results display
6. Test with players at weekly limit (2/2 sessions)
7. Test bench/reserves collapsible section

## Files Modified

- `/src/components/calendar/TrainingModal.tsx` - Complete rewrite with new layout

## Dependencies

All required dependencies were implemented in previous issues:
- ✓ vct-manager-2v9: Goal-based training types and mappings
- ✓ vct-manager-9nm: Training outcome preview calculations
- ✓ vct-manager-rhw: Per-player training assignment data model
- ◐ vct-manager-in8: (EPIC) Parent epic

## Next Steps

With this implementation complete, the next UX improvements can be:
- vct-manager-5sh: Auto-assign optimal training UI button (one-click fill)
- Further UX polish based on user feedback
