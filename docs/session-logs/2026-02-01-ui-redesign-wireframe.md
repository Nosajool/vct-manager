# UI Redesign: Wireframe Implementation

**Date**: 2026-02-01

## Overview

Redesigned the main gameplay UI to align with a wireframe vision, consolidating from 5 navigation tabs to 4 tabs with a context-aware "Today" page as the main hub. This is a UI/UX-only change with no modifications to game engine or service logic.

## Changes Summary

### Navigation Restructure

**Before**: 5 tabs
- Dashboard, Roster, Schedule, Tournament, Finances

**After**: 4 tabs
- Today, Team, Tournament, Finances

### New Hooks Directory

Created `src/hooks/` with two custom hooks:

#### useMatchDay Hook
**File**: `src/hooks/useMatchDay.ts`

Centralizes match day detection logic previously in TimeBar:

```typescript
interface MatchDayInfo {
  isMatchDay: boolean;
  matchEvent: CalendarEvent | null;
  todaysMatch: Match | null;
  opponent: Team | null;
  tournament: Tournament | null;
  bracketMatch: BracketMatch | null;
  opponentName: string;
  tournamentContext: string;
}

export function useMatchDay(): MatchDayInfo
```

#### useAlerts Hook
**File**: `src/hooks/useAlerts.ts`

Extensible alert framework that computes alerts on-the-fly from game state:

```typescript
interface Alert {
  id: string;
  severity: 'urgent' | 'warning' | 'info';
  category: 'contract' | 'morale' | 'sponsor' | 'map' | 'roster' | 'finance' | 'other';
  title: string;
  description: string;
  action?: {
    label: string;
    navigateTo: ActiveView;
    subTab?: string;
  };
}

// Extensible rules system
const ALERT_RULES: AlertRule[] = [
  // Contract expiring (within 30 days)
  // Low morale (< 40)
  // Low form (< 40)
  // Map practice low (< 50%)
  // Roster incomplete (< 5 active)
  // Low balance (< 2 months runway)
];

export function useAlerts(): Alert[]
```

### Today Page Components

Created `src/components/today/` directory:

#### TournamentContextPanel
**File**: `src/components/today/TournamentContextPanel.tsx`

Dynamic tournament context display based on current phase:

- **Swiss Stage**: Record (2W-1L), qualification path, progress dots, win/lose paths
- **League Stage**: Mini standings table, playoff cutoff line, next match impact
- **Playoffs**: Bracket position (Upper/Lower), next opponent
- **Kickoff**: Alpha/Beta/Omega position
- **Between Tournaments**: Upcoming preview, season progress timeline

#### ActionsPanel
**File**: `src/components/today/ActionsPanel.tsx`

Training and scrim action buttons:
- Shows training capacity (X/Y players can train)
- Shows scrim availability (X/4 remaining this week)
- **Match Day State**: Greyed out with explanatory message
- Links to Team page for roster management

#### AlertsPanel
**File**: `src/components/today/AlertsPanel.tsx`

Displays computed alerts with severity-based styling:
- Urgent (red), Warning (yellow), Info (blue)
- Each alert is clickable to navigate to relevant page

### Today Page
**File**: `src/pages/Today.tsx`

Main game hub layout:
```
┌─────────────────────────────────────────┐
│ Header: Date, Phase, Team, Balance      │
├────────────────────┬────────────────────┤
│ Tournament Context │ Actions Panel      │
│ (2/3 width)        │ Alerts Panel       │
│                    │ (1/3 width)        │
└────────────────────┴────────────────────┘
```

### Team Page Refactor
**File**: `src/pages/Roster.tsx`

Updated tab labels:
- "My Team" → "Roster"
- Tab order: Roster | Free Agents | All Teams
- Page title: "Team"

### Tournament Page Sub-tabs
**File**: `src/pages/Tournament.tsx`

Added horizontal sub-tabs:
- **Current**: Existing tournament viewing (brackets, standings, Swiss/League views)
- **Schedule**: Calendar view with MonthCalendar and DayDetailPanel (moved from Schedule.tsx)

## Files Changed

### Created
- `src/hooks/useMatchDay.ts`
- `src/hooks/useAlerts.ts`
- `src/hooks/index.ts`
- `src/pages/Today.tsx`
- `src/components/today/TournamentContextPanel.tsx`
- `src/components/today/ActionsPanel.tsx`
- `src/components/today/AlertsPanel.tsx`
- `src/components/today/index.ts`

### Modified
- `src/store/slices/uiSlice.ts` - Updated ActiveView type
- `src/components/layout/Navigation.tsx` - 4 tabs instead of 5
- `src/components/layout/TimeBar.tsx` - Uses useMatchDay hook
- `src/App.tsx` - Updated routing
- `src/pages/Roster.tsx` - Updated tab labels and title
- `src/pages/Tournament.tsx` - Added sub-tabs with schedule view
- `src/pages/index.ts` - Updated exports
- `src/components/calendar/CalendarView.tsx` - Updated navigation link

### Architecture Docs Updated
- `docs/architecture/core-architecture.md` - Updated directory structure
- `docs/architecture/implementation-details-page-1.md` - Updated ActiveView type

## Key Design Decisions

### Alert Framework Extensibility

Alerts are computed on-the-fly using a rules-based system. To add a new alert:

```typescript
const ALERT_RULES: AlertRule[] = [
  // ... existing rules
  {
    id: 'new-alert-type',
    check: ({ playerTeam, players, currentDate }) => {
      // Check condition
      if (/* condition not met */) return null;

      return {
        id: 'new-alert-type',
        severity: 'warning',
        category: 'other',
        title: 'Alert Title',
        description: 'Alert description',
        action: {
          label: 'View',
          navigateTo: 'team',
        },
      };
    },
  },
];
```

### Tournament Context Reuse

The TournamentContextPanel leverages the existing `getPhaseStatusDisplay()` utility from `src/utils/phaseStatus.ts` for bracket position calculations, ensuring consistency with other parts of the UI.

### Schedule Integration

Rather than maintaining a separate Schedule page, the calendar view is now a sub-tab within the Tournament page, reducing navigation complexity while keeping all tournament-related features together.

## Testing

- TypeScript compilation: Pass
- Production build: Pass (928 KB bundle)
- All existing functionality preserved

## Future Considerations

1. **Sub-tab navigation from alerts**: Currently alerts navigate to main views. Could add support for opening specific sub-tabs or modals.

2. **More alert rules**: Easy to add rules for:
   - Training recommended (after loss)
   - Player birthday/milestone
   - Transfer window opening/closing

3. **Dashboard.tsx and Schedule.tsx**: These files still exist but are no longer used. Can be deleted in a future cleanup if not needed for reference.
