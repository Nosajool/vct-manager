# Default Starting Screen - Feature Specification

## Overview

Change the default starting screen from the Dashboard to a dedicated "Game Start" screen that serves as the main entry point for both new games and loading existing saves. Currently, when you load the game, you see 5 navigation tabs and all of them except for the Roster tab say to start the game. Instead, the Game Start screen should be the default, providing both "New Game" and "Load Game" options in a centralized location.

## Current State Analysis

**Current Flow:**
1. Game loads → Dashboard tab is active by default (`activeView: 'dashboard'`)
2. Dashboard shows "Game not initialized" message when `!initialized || !gameStarted`
3. User must navigate to Roster tab to see "Start New Game" button
4. Setup wizard only appears from Roster tab
5. Save/load functionality is only accessible through the shared SaveLoadModal component

**Current Navigation Structure:**
- 5 tabs: Dashboard, Roster, Schedule, Tournament, Finances
- All tabs except Roster show "Game not initialized" when game hasn't started
- Only Roster tab has the setup wizard trigger
- Save/load is modal-based and not discoverable from the main navigation

**Problems:**
- Poor discoverability of game start functionality
- Inconsistent user experience across tabs
- Save/load features are not prominently featured
- No centralized game management interface

## Solution

Create a new "Game Start" screen that becomes the default landing page when the game loads. This screen will provide:
- **New Game**: Access to the existing SetupWizard for starting fresh games
- **Load Game**: Direct access to save/load functionality with save slot previews
- **Game Information**: Quick stats and game summary
- **Recent Activity**: Last played date and current progress

The navigation structure will be updated to include the Game Start tab, and the default active view logic will be modified to show Game Start when no game is active.

---

## Implementation Details

### New Components

```
src/pages/
├── GameStart.tsx              # New main game start page
└── index.ts

src/components/shared/
├── GameStartCard.tsx          # Reusable card component for game actions
└── SaveSlotPreview.tsx        # Preview component for save slots
```

### GameStart.tsx

Main game start page component that serves as the central hub for game management:

```typescript
interface GameStartProps {
  // No props needed - this is a standalone page
}

interface GameSummary {
  totalPlayers: number;
  totalTeams: number;
  totalTierTeams: number;
  freeAgents: number;
  lastPlayed: string | null;
  totalPlaytime: string;
}
```

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│                    VCT Manager                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🎮  Start New Game                                 │   │
│  │  Create a new VCT management career                 │   │
│  │                                                     │   │
│  │  [Start New Game]                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💾  Load Game                                     │   │
│  │  Continue your existing VCT journey                 │   │
│  │                                                     │   │
│  │  [Load Game]                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Game Summary                                       │   │
│  │  Total Players: 240                                 │   │
│  │  Total Teams: 48                                    │   │
│  │  Last Played: 2 days ago                            │   │
│  │  Total Playtime: 3h 25m                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### GameStartCard.tsx

Reusable card component for game actions:

```typescript
interface GameStartCardProps {
  icon: string;
  title: string;
  description: string;
  actionText: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}
```

### SaveSlotPreview.tsx

Component to show save slot information in a compact format:

```typescript
interface SaveSlotPreviewProps {
  slot: SaveSlotInfo;
  onAction: (action: 'load' | 'delete') => void;
  isLoading?: boolean;
}
```

---

## Modified Files

### src/store/slices/uiSlice.ts

Add new navigation state for Game Start:

```typescript
export type ActiveView =
  | 'dashboard'
  | 'roster'
  | 'schedule'
  | 'match'
  | 'finances'
  | 'tournament'
  | 'gamestart';  // NEW: Add game start view

export interface UISlice {
  // ... existing fields
  activeView: ActiveView;
  
  // ... existing actions
  setActiveView: (view: ActiveView) => void;
}
```

### src/components/layout/Navigation.tsx

Update navigation to include Game Start tab:

```typescript
const navItems: NavItem[] = [
  { id: 'gamestart', label: 'Game Start', icon: '🎮' },  // NEW: First tab
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'roster', label: 'Roster', icon: '👥' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'tournament', label: 'Tournament', icon: '🏆' },
  { id: 'finances', label: 'Finances', icon: '💰' },
];
```

### src/App.tsx

Update routing logic to handle Game Start as default:

```typescript
// Current logic needs to be updated to show Game Start when no game is active
const showGameStart = !gameStarted || !initialized;

return (
  <div className="min-h-screen bg-vct-dark">
    <Navigation />
    <main className="flex-1">
      {showGameStart ? (
        <GameStart />
      ) : (
        // Existing routing logic for other pages
      )}
    </main>
  </div>
);
```

### src/pages/Roster.tsx

Remove the setup wizard from Roster page and redirect to Game Start:

```typescript
// Remove the setup wizard logic from Roster.tsx
// Instead, show a message directing users to Game Start tab
if (!gameStarted) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-vct-light mb-4">
          Game Not Started
        </h2>
        <p className="text-vct-gray mb-6">
          Please go to the Game Start tab to begin a new game or load an existing save.
        </p>
        <button
          onClick={() => setActiveView('gamestart')}
          className="px-6 py-2 bg-vct-red text-white rounded-lg hover:bg-vct-red/80"
        >
          Go to Game Start
        </button>
      </div>
    </div>
  );
}
```

---

## UI/UX Design

### Game Start Screen Design

**Primary Layout:**
- Clean, welcoming interface with VCT branding
- Two main action cards: "Start New Game" and "Load Game"
- Game summary section with key statistics
- Responsive design that works on all screen sizes

**Color Scheme:**
- Primary: VCT red (#FF4D4D) for action buttons
- Background: Dark theme consistent with existing game
- Text: High contrast for readability

**Typography:**
- Headings: Bold, attention-grabbing
- Body text: Clean, readable font
- Icons: Emoji-based for quick recognition

### Interaction Flow

**Start New Game Flow:**
1. User clicks "Start New Game"
2. Redirect to Roster tab with SetupWizard open
3. User completes region/team/difficulty selection
4. Game initializes and redirects to Dashboard

**Load Game Flow:**
1. User clicks "Load Game"
2. SaveLoadModal opens with load mode
3. User selects save slot and loads game
4. Redirect to Dashboard with loaded game state

**Game Summary Updates:**
- Real-time updates of game statistics
- Last played date from save metadata
- Total playtime calculation from save data

---

## Implementation Tasks

### Phase 1: Core Game Start Screen

- [ ] Create `GameStart.tsx` page component
- [ ] Create `GameStartCard.tsx` reusable component
- [ ] Create `SaveSlotPreview.tsx` component
- [ ] Update `uiSlice.ts` to include 'gamestart' in ActiveView type
- [ ] Update `Navigation.tsx` to include Game Start tab
- [ ] Add Tailwind styling matching existing game aesthetic

### Phase 2: Integration and Routing

- [ ] Update `App.tsx` routing logic to handle Game Start as default
- [ ] Modify `Roster.tsx` to redirect to Game Start when no game active
- [ ] Update navigation state management for proper tab highlighting
- [ ] Ensure proper state transitions between Game Start and other pages

### Phase 3: Polish and Features

- [ ] Add game summary statistics display
- [ ] Implement save slot preview functionality
- [ ] Add keyboard navigation support
- [ ] Add hover states and animations
- [ ] Add responsive design for mobile devices

### Phase 4: Testing and Validation

- [ ] Test navigation flow between all tabs
- [ ] Test game start functionality
- [ ] Test save/load integration
- [ ] Test state persistence across page transitions
- [ ] Validate responsive design

---

## Compatibility with Existing Features

### Save/Load System Integration

The Game Start screen will integrate seamlessly with the existing SaveLoadModal component:

- **Load Game**: Opens SaveLoadModal in load mode
- **Save Management**: Users can still access full save management through the modal
- **Auto-save**: Continues to work in the background
- **Save Slots**: All existing save slot functionality preserved

### Setup Wizard Integration

The existing SetupWizard component will be reused without modification:

- **Region Selection**: Works as before
- **Team Selection**: Works as before  
- **Difficulty Selection**: Works as before
- **Game Initialization**: Works as before

### Navigation State Management

The existing navigation state management will be extended:

- **Active Tab Highlighting**: Game Start tab highlights when active
- **State Persistence**: Navigation state preserved across page reloads
- **Deep Linking**: Direct links to Game Start tab work correctly

---

## Future Enhancements (Not in Scope)

These features are noted for future consideration but are **not part of this implementation**:

### Quick Start Options

Add quick start presets for different play styles:
- **Quick Career**: Pre-configured settings for fast setup
- **Custom Setup**: Full customization options
- **Tutorial Mode**: Guided introduction for new players

### Game Statistics Dashboard

Enhanced game summary with more detailed statistics:
- **Performance Metrics**: Win rates, tournament progress
- **Financial Summary**: Earnings, expenses, net worth
- **Player Development**: Training progress, skill improvements

### Multi-Save Management

Advanced save management features:
- **Save Categories**: Organize saves by play style or progress
- **Save Sharing**: Export/import save files
- **Save Comparison**: Compare different save states

### Tutorial Integration

Guided onboarding for new players:
- **Interactive Tutorial**: Step-by-step game introduction
- **Tips and Tricks**: Contextual help and advice
- **Progress Tracking**: Track tutorial completion

---

## Testing Checklist

- [ ] Game Start tab appears as first navigation item
- [ ] Game Start is default active tab when no game is loaded
- [ ] "Start New Game" button opens SetupWizard correctly
- [ ] "Load Game" button opens SaveLoadModal correctly
- [ ] Game summary statistics display correctly
- [ ] Navigation works correctly between all tabs
- [ ] State transitions preserve game data
- [ ] Responsive design works on mobile devices
- [ ] Keyboard navigation works correctly
- [ ] All existing functionality remains intact

---

## Success Criteria

1. **Default Behavior**: Game Start screen appears by default when game loads
2. **Navigation**: Game Start tab is first in navigation order
3. **Game Start Flow**: "Start New Game" opens SetupWizard correctly
4. **Load Flow**: "Load Game" opens SaveLoadModal correctly
5. **Integration**: All existing features work without modification
6. **User Experience**: Clear, intuitive interface for game management
7. **Performance**: No performance impact on existing functionality
8. **Accessibility**: Keyboard navigation and screen reader support
9. **Responsive**: Works correctly on all screen sizes
10. **Backward Compatibility**: Existing saves and settings preserved

---

## Technical Notes

### State Management Strategy

The implementation uses the existing Zustand store pattern:
- Navigation state managed through uiSlice
- Game state managed through existing gameSlice
- No new state management patterns introduced

### Component Architecture

Follows existing component patterns:
- TypeScript interfaces for all props
- Reusable components where appropriate
- Consistent naming conventions
- Proper separation of concerns

### Styling Approach

Maintains existing design system:
- Tailwind CSS classes consistent with existing components
- Color scheme matches current VCT theme
- Typography follows existing patterns
- Responsive design principles applied

### Error Handling

Robust error handling for all operations:
- Graceful fallbacks for failed operations
- Clear error messages for users
- Logging for debugging purposes
- No data loss in case of errors
