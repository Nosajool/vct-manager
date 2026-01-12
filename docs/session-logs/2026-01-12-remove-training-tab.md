# 2026-01-12: Remove Training Navigation Tab

## Summary
Removed the unused "Training" navigation tab from the application. The training functionality is fully implemented and accessible via the Dashboard and Schedule pages through the calendar activities and TrainingModal component.

## Files Modified

### 1. `src/components/layout/Navigation.tsx`
- Removed `{ id: 'training', label: 'Training', icon: '💪' }` from `navItems` array

### 2. `src/store/slices/uiSlice.ts`
- Removed `'training'` from `ActiveView` type union

### 3. `src/App.tsx`
- Removed the `case 'training':` from the view routing switch statement that was rendering a placeholder page

## Why This Was Safe to Remove
- Training functionality is accessible from:
  - Dashboard → Today's Activities → Train button
  - Schedule → Calendar → Training days → TrainingModal
- No dedicated Training.tsx page was ever created
- The tab was showing a placeholder "Coming in Phase 3" page despite training being fully implemented

## Result
Navigation now has 5 tabs: Dashboard, Roster, Schedule, Tournament, Finances
