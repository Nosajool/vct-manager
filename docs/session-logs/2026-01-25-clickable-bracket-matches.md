# Session Log: Clickable Bracket Matches

**Date**: 2026-01-25
**Feature**: Click on completed bracket matches to view match details
**Status**: Complete

---

## Problem Statement

After tournament matches are simulated, users can only see the scores displayed in the bracket view. To view detailed match statistics (individual player performances, round-by-round scores, etc.), users had no direct way to access this information from the bracket UI.

### User Request

> "In the tournament brackets, after a BracketMatch has been completed, I want to be able to click on the BracketMatch component and have it open the SimulationResultsModal for that match like when we click 'View Details'."

---

## Solution

Added click handling to bracket match components that opens the `MatchResult` modal for completed matches, showing full match details including player statistics and scoreboard.

### Implementation Details

#### 1. BracketMatch Component

Added `onMatchClick` optional callback prop:
```typescript
interface BracketMatchProps {
  match: BracketMatchType;
  compact?: boolean;
  showScore?: boolean;
  teamSlots?: { teamA?: TeamSlot; teamB?: TeamSlot };
  onMatchClick?: (matchId: string) => void;  // New prop
}
```

Click handling logic:
- Only completed matches are clickable (`match.status === 'completed'`)
- Visual feedback with `cursor-pointer` and hover border color change
- Click calls `onMatchClick(match.matchId)` to notify parent

#### 2. BracketView Component

Added prop passthrough to all child BracketMatch components:
- Upper bracket rounds
- Middle bracket rounds (triple elimination)
- Lower bracket rounds
- Grand final

```typescript
interface BracketViewProps {
  bracket: BracketStructure;
  onMatchClick?: (matchId: string) => void;  // New prop
}
```

#### 3. SwissStageView Component

Added same click handling to `SwissMatchCard` internal component:
- Works for current round matches
- Works for completed previous round matches (displayed with opacity-60)

#### 4. Tournament Page

Added state management and modal rendering:
```typescript
const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
const matches = useGameStore((state) => state.matches);
const selectedMatch = selectedMatchId ? matches[selectedMatchId] : null;

const handleMatchClick = (matchId: string) => {
  setSelectedMatchId(matchId);
};
```

Modal rendered when match is selected:
```tsx
{selectedMatch && (
  <MatchResult match={selectedMatch} onClose={handleCloseMatchDetails} />
)}
```

---

## User Experience

### Before
1. User views tournament bracket
2. Sees team names and scores for completed matches
3. No way to view detailed match statistics from bracket view

### After
1. User views tournament bracket
2. Completed matches show hover effect (cursor pointer, border highlight)
3. Click opens full match details modal with:
   - Final score and duration
   - Map-by-map results
   - Individual player statistics (K/D/A, ACS)
   - Full scoreboard

---

## Files Changed

1. **`src/components/tournament/BracketMatch.tsx`**
   - Added `onMatchClick` prop to interface
   - Added `isClickable` check for completed status
   - Added `handleClick()` function
   - Applied cursor-pointer and hover styles to clickable matches
   - Both compact and full-size variants support clicking

2. **`src/components/tournament/BracketView.tsx`**
   - Added `onMatchClick` prop to interface
   - Passed prop to all BracketMatch components (rounds + grand final)

3. **`src/components/tournament/SwissStageView.tsx`**
   - Added `onMatchClick` prop to interface
   - Added `onMatchClick` prop to `SwissMatchCard` internal component
   - Applied click handling to swiss match cards

4. **`src/pages/Tournament.tsx`**
   - Added `selectedMatchId` state
   - Added `matches` from store
   - Added `handleMatchClick()` and `handleCloseMatchDetails()` handlers
   - Passed `onMatchClick` to BracketView and SwissStageView
   - Rendered MatchResult modal when match selected
   - Imported `MatchResult` component from match components

5. **`docs/architecture/development-status.md`**
   - Added Phase 18 documentation

---

## Technical Notes

### Match ID Relationship

`BracketMatch.matchId` corresponds to `Match.id` in the store. When a bracket match is clicked, the `matchId` is used to look up the full `Match` object from `state.matches`, which is then passed to the `MatchResult` component.

### Non-Clickable States

Matches that are not yet completed (pending, ready, in_progress) intentionally do not have click handling. These matches either:
- Have no result data to display
- Are still awaiting team resolution (TBD slots)
- Are currently being simulated

### Visual Feedback

Clickable matches have:
- `cursor-pointer` class for mouse cursor change
- `hover:border-vct-gray/50` for border color transition on hover
- `transition-colors` for smooth animation

---

## Verification

- TypeScript compilation passes with no errors
- Feature works for bracket view (upper, middle, lower brackets, grand final)
- Feature works for Swiss stage view (current and previous rounds)
- Non-completed matches correctly remain non-clickable
- Modal closes properly and returns to bracket view
