# Session Log: Unified Simulation System Implementation

**Date:** 2026-01-16
**Feature:** Investigation, Design, and Implementation of Unified Time/Simulation System

---

## Summary

Investigated the time advancement and simulation systems throughout the codebase, identified 5 distinct systems with inconsistent behavior, designed a unified architecture, and **implemented it**.

---

## Problem Analysis

### Discovery: 5 Distinct Simulation Systems

The codebase has multiple entry points for simulation with inconsistent behavior:

| System | Location | Time Advances? | Modal Shown | Event Marked? |
|--------|----------|----------------|-------------|---------------|
| Dashboard TimeControls | `TimeControls.tsx` | Yes | SimulationResultsModal | Auto |
| Schedule TimeControls | `Schedule.tsx` (compact) | Yes | None (silent) | Auto |
| Dashboard Match Click | `Dashboard.tsx:63` | No | SimulationResultsModal | Manual |
| Tournament Simulation | `Tournament.tsx` | No | Banner notification | No |
| Schedule DayDetailPanel | `DayDetailPanel.tsx` | No | MatchResult detail | No |

### Core Issues Identified

1. **No Clear Turn Structure**
   - Users can simulate from multiple places with different outcomes
   - No clear mental model of "what ends my turn"

2. **Simulate Without Time Creates Paradoxes**
   - Clicking "MATCH DAY" on Dashboard simulates match but doesn't advance time
   - Results in being at "start of match day" with match already completed
   - Breaks the time model

3. **Tournament Matches Outside Time**
   - Tournament page allows instant bracket simulation
   - Same matches also exist on calendar
   - Dual state management creates potential bugs

4. **Inconsistent Feedback**
   - Different modals/notifications per context
   - Schedule page silent simulation vs Dashboard modal
   - Tournament shows banner vs full modal

---

## Proposed Solution: Global TimeBar

### Design Principle: "Time is King"

Every match simulation should advance time. No "simulate without advancing" option for official matches.

### UI Concept

Single persistent time control bar visible on ALL pages:
```
┌────────────────────────────────────────────────────────────────────┐
│  📅 January 15, 2026  |  Stage 1  |  MATCH TODAY: vs Sentinels     │
│  [Advance Day]  [Advance Week]  [Jump to Match]                    │
└────────────────────────────────────────────────────────────────────┘
```

### Game Loop

```
START OF DAY → View calendar, do activities → Click TimeBar button →
Process events + simulate matches → Show SimulationResultsModal → NEXT DAY
```

### What Gets Removed

- `TimeControls` component from Dashboard/Schedule (replaced by global bar)
- "MATCH DAY" click handler from TodayActivities
- "Simulate Match" button from DayDetailPanel
- "Simulate Match/Round/All" from Tournament page (becomes view-only)

### Tournament Integration

Tournament matches work identically to league matches:
1. Scheduled on calendar for specific date
2. When date arrives, appears in "Today's Activities"
3. User advances day via TimeBar → match simulates
4. Bracket auto-updates via existing `advanceTournament()` flow

---

## Files Analyzed

**Pages:**
- `src/pages/Dashboard.tsx` - Match click handler (line 63-89)
- `src/pages/Schedule.tsx` - Compact TimeControls + handleSimulate
- `src/pages/Tournament.tsx` - Tournament simulation controls

**Services:**
- `src/services/CalendarService.ts` - advanceDay/Week/ToMatch methods
- `src/services/TournamentService.ts` - simulateNextMatch/Round/Tournament
- `src/services/MatchService.ts` - Core simulateMatch method

**Components:**
- `src/components/calendar/TimeControls.tsx` - Time control buttons
- `src/components/calendar/TodayActivities.tsx` - Match click handler
- `src/components/calendar/DayDetailPanel.tsx` - Day detail simulate button
- `src/components/calendar/SimulationResultsModal.tsx` - Results display

---

## Documentation Updated

- Added Section 19 "Unified Simulation System (PLANNED REFACTOR)" to architecture doc
- Added to Known Technical Debt table with High priority
- Created detailed plan file at `.claude/plans/zippy-fluttering-teacup.md`

---

## Implementation (COMPLETED)

### Phase 1: Create Global TimeBar Component
- Created `src/components/layout/TimeBar.tsx`
- Three buttons: Advance Day, Advance Week, Jump to Match
- Shows current date, phase, and match today indicator
- Includes `SimulationResultsModal` for showing results
- Added to `Layout.tsx` between Navigation and main content

### Phase 2: Remove Per-Page Simulation
- Removed `TimeControls` from Dashboard and Schedule
- Removed "MATCH DAY" click handler from `TodayActivities`
- Changed match display in `TodayActivities` from button to static display
- Removed "Simulate Match" button from `DayDetailPanel`
- Removed all simulation buttons from Tournament page (now view-only)

### Phase 3: Update Bracket Components
- Removed `onSimulate` prop from `BracketMatch`
- Removed `onSimulateMatch` prop from `BracketView` and `BracketListView`
- Removed simulate button from bracket match cards

---

## Files Modified

**Created:**
- `src/components/layout/TimeBar.tsx` - Global time control bar with SimulationResultsModal

**Modified:**
- `src/components/layout/Layout.tsx` - Added TimeBar
- `src/components/layout/index.ts` - Export TimeBar
- `src/pages/Dashboard.tsx` - Removed TimeControls, match click handler, SimulationResultsModal
- `src/pages/Schedule.tsx` - Removed TimeControls, handleSimulate, notification
- `src/pages/Tournament.tsx` - Removed all simulation handlers and TournamentControls
- `src/components/calendar/TodayActivities.tsx` - Removed onMatchClick, made match display static
- `src/components/calendar/DayDetailPanel.tsx` - Removed onSimulateMatch, isSimulating props
- `src/components/tournament/BracketView.tsx` - Removed onSimulateMatch from both components
- `src/components/tournament/BracketMatch.tsx` - Removed onSimulate prop and button

**Not Modified (still exists but unused):**
- `src/components/calendar/TimeControls.tsx` - Can be deleted in future cleanup
- `src/components/tournament/TournamentControls.tsx` - Can be deleted in future cleanup

---

## Verification

Build completed successfully with no TypeScript errors.
