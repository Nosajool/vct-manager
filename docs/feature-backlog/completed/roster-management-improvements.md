# Feature: Roster Management Improvements - Active/Reserve Player Movement

**Status:** ✅ Complete
**Priority:** High
**Completed:** 2026-01-21

## Overview
Currently, the game displays active roster (5 players) and reserve roster separately in the RosterList component, but there is no user interface to move players between these rosters. The backend logic exists in `ContractService.movePlayerPosition()`, but users cannot trigger these operations through the UI. This feature will add UX controls to allow roster management operations.

## Current State Analysis

### ✅ Backend Implementation Complete

| Component | Status | Location | Details |
|-----------|--------|----------|---------|
| **ContractService.movePlayerPosition()** | ✅ Complete | `src/services/ContractService.ts:243-299` | Handles active↔reserve movements with full validation |
| **teamSlice.movePlayerToActive()** | ✅ Complete | `src/store/slices/teamSlice.ts:188-204` | Zustand action for reserve→active |
| **teamSlice direct setState** | ✅ Complete | Used in ContractService | For active→reserve movement |
| **Data Structure** | ✅ Complete | `Team.playerIds` + `Team.reservePlayerIds` | Normalized roster arrays |

### ❌ UI Implementation Missing

| Component | Status | Location | Required Changes |
|-----------|--------|----------|------------------|
| **PlayerCard.tsx** | ❌ Missing | `src/components/roster/PlayerCard.tsx` | Add promote/demote quick action buttons |
| **PlayerDetailModal.tsx** | ❌ Missing | `src/components/roster/PlayerDetailModal.tsx` | Add roster movement buttons in footer |
| **RosterList.tsx** | ❌ Missing | `src/components/roster/RosterList.tsx` | Pass handlers to child components, add feedback |

### Validation Rules (Already Implemented in ContractService)

```typescript
// From ContractService.movePlayerPosition() at line 243
movePlayerPosition(playerId: string, newPosition: 'active' | 'reserve'): { success: boolean; error?: string }
```

**Validations performed:**
1. Player must be on a team (`player.teamId` not null)
2. Team must exist
3. Active→Reserve: Always allowed
4. Reserve→Active: Only if `team.playerIds.length < 5`
5. No-op protection: Returns error if player already in target position

## Requirements

### Core Functionality
1. **Move Player from Active to Reserve**: Allow demoting active roster players to reserve
2. **Move Player from Reserve to Active**: Allow promoting reserve players to active roster (when space available)
3. **Real-time Feedback**: Show success/error messages for roster operations
4. **Visual Indicators**: Clear UI showing roster limits (5/5 active) and available actions

### User Experience
- **Quick Actions**: Small buttons on PlayerCard for one-click roster moves
- **Modal Actions**: Additional options in PlayerDetailModal for roster management
- **Validation Messages**: Clear feedback when operations fail (e.g., "Active roster is full")
- **Roster Counts**: Real-time updates of active/reserve player counts

### Constraints
- Only player's team roster can be modified (other teams are AI-controlled)
- Active roster limited to 5 players maximum
- Reserve roster unlimited
- Cannot move players during active matches (not currently enforced, low priority)

## Technical Implementation Plan

### 1. Update PlayerCard Component (`src/components/roster/PlayerCard.tsx`)

**New Props Required:**
```typescript
interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  selected?: boolean;
  showContract?: boolean;
  compact?: boolean;
  // NEW PROPS
  rosterPosition?: 'active' | 'reserve';  // Current position
  canPromote?: boolean;                     // Active roster has space
  onMoveToActive?: (playerId: string) => void;
  onMoveToReserve?: (playerId: string) => void;
  isPlayerTeam?: boolean;                   // Only show actions for player's team
}
```

**UI Changes:**
- Add quick action buttons overlay (absolute positioned top-right)
- **Promote Button (↑)**: Green, visible for reserve players when `canPromote && isPlayerTeam`
- **Demote Button (↓)**: Orange, visible for active players when `isPlayerTeam`
- Buttons should have hover effects and tooltips

### 2. Update PlayerDetailModal Component (`src/components/roster/PlayerDetailModal.tsx`)

**New Props Required:**
```typescript
interface PlayerDetailModalProps {
  player: Player;
  onClose: () => void;
  onSign?: () => void;
  onRelease?: () => void;
  isOnPlayerTeam?: boolean;
  // NEW PROPS
  rosterPosition?: 'active' | 'reserve';
  canPromote?: boolean;
  onMoveToActive?: () => void;
  onMoveToReserve?: () => void;
}
```

**UI Changes:**
- Add "Move to Active Roster" / "Move to Reserve" buttons in footer
- Position between Release and Close buttons
- Disable "Move to Active Roster" when `!canPromote`
- Show tooltip explaining why disabled

### 3. Update RosterList Component (`src/components/roster/RosterList.tsx`)

**Implementation Steps:**
1. Import `contractService` from `'../../services/ContractService'`
2. Add local state for feedback messages: `const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)`
3. Create handler functions:

```typescript
const handleMoveToActive = (playerId: string) => {
  const result = contractService.movePlayerPosition(playerId, 'active');
  if (result.success) {
    setMessage({ type: 'success', text: 'Player moved to active roster' });
  } else {
    setMessage({ type: 'error', text: result.error || 'Failed to move player' });
  }
  // Auto-clear message after 3 seconds
  setTimeout(() => setMessage(null), 3000);
};

const handleMoveToReserve = (playerId: string) => {
  const result = contractService.movePlayerPosition(playerId, 'reserve');
  if (result.success) {
    setMessage({ type: 'success', text: 'Player moved to reserve' });
  } else {
    setMessage({ type: 'error', text: result.error || 'Failed to move player' });
  }
  setTimeout(() => setMessage(null), 3000);
};
```

4. Pass handlers and context to PlayerCard components
5. Pass handlers to PlayerDetailModal
6. Add feedback message display above roster sections

### 4. Verify ContractService Integration (`src/services/ContractService.ts`)

**Status: ✅ Already Complete**

The `movePlayerPosition()` method at line 243 handles:
- Validation of player/team existence
- Checking current roster position
- Enforcing 5-player active roster limit
- Calling appropriate store actions
- Returning success/error status

No changes needed.

### 5. Add Store Actions (if needed) (`src/store/slices/teamSlice.ts`)

**Status: ✅ Already Complete**

The following actions exist and work correctly:
- `movePlayerToActive(teamId, playerId)` - line 188
- Direct `setState` in ContractService for active→reserve

No changes needed.

## Architecture Compliance
Following existing VCT Manager architecture patterns:

- **Engine layer**: No changes needed - roster movement is already pure logic in `ContractService`
- **Services layer**: Leverage existing `ContractService.movePlayerPosition()` method
- **Store layer**: Use existing team slice actions for state updates
- **UI layer**: Add action buttons and handlers following existing PlayerCard/PlayerDetailModal patterns

## UI Design Specifications

### PlayerCard Quick Actions
```typescript
// Small action buttons overlaid on player card
<div className="absolute top-2 right-2 flex gap-1">
  {isReservePlayer && activeRosterCount < 5 && (
    <button
      onClick={() => moveToActive(player.id)}
      className="w-6 h-6 bg-green-600 hover:bg-green-500 rounded text-white text-xs"
      title="Move to Active Roster"
    >
      ↑
    </button>
  )}
  {isActivePlayer && (
    <button
      onClick={() => moveToReserve(player.id)}
      className="w-6 h-6 bg-orange-600 hover:bg-orange-500 rounded text-white text-xs"
      title="Move to Reserve"
    >
      ↓
    </button>
  )}
</div>
```

### PlayerDetailModal Actions
```typescript
// Action buttons in modal footer
<div className="flex justify-end gap-3">
  {isActivePlayer && (
    <button
      onClick={handleMoveToReserve}
      className="px-4 py-2 bg-orange-600 text-white font-medium rounded
                 hover:bg-orange-500 transition-colors"
    >
      Move to Reserve
    </button>
  )}
  {isReservePlayer && activeRosterCount < 5 && (
    <button
      onClick={handleMoveToActive}
      className="px-4 py-2 bg-green-600 text-white font-medium rounded
                 hover:bg-green-500 transition-colors"
    >
      Move to Active Roster
    </button>
  )}
</div>
```

### Roster Status Display
```typescript
// Updated roster header with action availability
<h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
  Active Roster ({activePlayers.length}/5)
  {activePlayers.length < 5 && reservePlayers.length > 0 && (
    <span className="text-green-400 text-xs ml-2">
      ({reservePlayers.length} available to promote)
    </span>
  )}
</h3>
```

## Edge Cases & Validation

### Roster Movement Rules
- **Active to Reserve**: Always allowed (no limit on reserve roster)
- **Reserve to Active**: Only allowed when active roster < 5
- **Last Active Player**: Allow moving the final active player to reserve (roster can go to 0/5)

### Error Handling
- **Active Roster Full**: "Cannot promote player: Active roster is full (5/5)"
- **Invalid Player**: "Player not found on team"
- **State Desync**: Handle cases where player exists in both arrays (shouldn't happen)

### UI States
- **Disabled Buttons**: Gray out promote buttons when roster full
- **Loading States**: Show spinner during roster operations
- **Success Feedback**: Brief green toast: "Player moved to active roster"
- **Error Feedback**: Red error message with specific reason

## Integration Points

### Existing Components Modified
- `PlayerCard.tsx`: Add quick action buttons
- `PlayerDetailModal.tsx`: Add roster management buttons
- `RosterList.tsx`: Add action handlers and feedback

### Existing Services Used
- `ContractService.movePlayerPosition()`: Core roster movement logic
- Team slice actions: State updates for roster changes

### No New Dependencies
- Uses existing UI patterns and service methods
- No new components or services required

## Testing Checklist

### Functional Tests
- [ ] Can move active player to reserve roster
- [ ] Can move reserve player to active roster (when space available)
- [ ] Cannot move reserve player to active roster when full (5/5)
- [ ] Roster counts update correctly after movements
- [ ] Player appears in correct section after movement

### UI Tests
- [ ] Quick action buttons appear on correct players
- [ ] Modal action buttons show/hide appropriately
- [ ] Buttons disable when operations invalid
- [ ] Success/error messages display correctly
- [ ] Roster status text updates in real-time

### Edge Case Tests
- [ ] Moving last active player to reserve (0/5 active)
- [ ] Multiple rapid roster movements
- [ ] Roster operations during other modal states
- [ ] Error handling for invalid operations

### Integration Tests
- [ ] Roster movements work with existing contract operations
- [ ] Chemistry calculations update after roster changes
- [ ] Match simulations use correct active roster
- [ ] Training applies to correct roster position

## Success Criteria
- Users can freely move players between active and reserve rosters
- Clear visual feedback for all operations and constraints
- No breaking changes to existing roster functionality
- Consistent UX with existing player management features
- Real-time UI updates without page refreshes

## Implementation Order

Recommended implementation sequence:

1. **RosterList.tsx** - Add handlers and message state (foundation)
2. **PlayerCard.tsx** - Add quick action buttons with new props
3. **PlayerDetailModal.tsx** - Add roster movement buttons
4. **Testing** - Manual testing of all flows

## File Changes Summary

| File | Action | Lines Changed (Est.) |
|------|--------|---------------------|
| `src/components/roster/RosterList.tsx` | Modify | +30 lines |
| `src/components/roster/PlayerCard.tsx` | Modify | +40 lines |
| `src/components/roster/PlayerDetailModal.tsx` | Modify | +25 lines |
| `src/services/ContractService.ts` | No change | 0 |
| `src/store/slices/teamSlice.ts` | No change | 0 |

**Total estimated changes:** ~95 lines of new code

## Dependencies

- No new npm packages required
- No new types or interfaces needed (existing types sufficient)
- No database/persistence changes needed

## Related Features

- **Contract Negotiation Modal**: Uses similar button patterns
- **Release Player Modal**: Uses similar confirmation patterns
- **Free Agent List**: Similar roster management UX

## Future Enhancements (Out of Scope)

- Drag-and-drop roster reordering
- Bulk roster operations
- Roster lock during match day
- AI roster suggestions
