# Feature: Roster Management Improvements - Active/Reserve Player Movement

## Overview
Currently, the game displays active roster (5 players) and reserve roster separately in the RosterList component, but there is no user interface to move players between these rosters. The backend logic exists in `ContractService.movePlayerPosition()`, but users cannot trigger these operations through the UI. This feature will add UX controls to allow roster management operations.

## Current State Analysis
- **Backend Logic**: ✅ `ContractService.movePlayerPosition()` method exists and handles moving players between active and reserve rosters
- **Data Structure**: ✅ Teams have separate `playerIds` (active roster, max 5) and `reservePlayerIds` (reserve roster, unlimited)
- **Display**: ✅ `RosterList` component shows both active and reserve sections with player counts
- **UI Controls**: ❌ No buttons or actions to move players between rosters
- **Validation**: ✅ Backend validates roster limits (5 max active) and prevents invalid operations

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

## Technical Implementation Plan

### 1. Update PlayerCard Component (`src/components/roster/PlayerCard.tsx`)
Add quick action buttons for roster movements:
- **Promote Button (↑)**: For reserve players, promote to active roster
- **Demote Button (↓)**: For active players, move to reserve roster
- **Conditional Display**: Only show relevant buttons based on player's current roster status
- **Disabled State**: Disable promote button when active roster is full (5/5)

### 2. Update PlayerDetailModal Component (`src/components/roster/PlayerDetailModal.tsx`)
Add roster management actions:
- **"Move to Reserve" Button**: For active players, with confirmation
- **"Move to Active Roster" Button**: For reserve players, disabled when active roster full
- **Action Handlers**: Connect to `contractService.movePlayerPosition()`

### 3. Update RosterList Component (`src/components/roster/RosterList.tsx`)
- Add action handlers that call roster movement service methods
- Add success/error state management for user feedback
- Ensure roster counts update immediately after operations

### 4. Verify ContractService Integration (`src/services/ContractService.ts`)
- Confirm `movePlayerPosition()` method works correctly
- Verify proper state updates through store actions
- Ensure validation prevents invalid operations

### 5. Add Store Actions (if needed) (`src/store/slices/teamSlice.ts`)
- Ensure `movePlayerToActive()` and `movePlayerToReserve()` actions exist
- Add proper state updates for roster movements
- Maintain data consistency between active and reserve arrays

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
