# useActivityModals Hook - Usage Examples

## Overview

The `useActivityModals` hook and `ActivityModals` component provide centralized modal state management for training and scrim activities. This replaces the duplicated modal logic previously found in `ObjectivesPanel` and `WeekPlannerPanel`.

## Basic Usage

```tsx
import { useActivityModals } from '../../hooks/useActivityModals';
import { ActivityModals } from '../../components/dayplan/ActivityModals';

function MyPanel() {
  const modals = useActivityModals();

  const handleConfigureTraining = (eventId: string) => {
    modals.openTrainingModal(eventId);
  };

  const handleConfigureScrim = (eventId: string) => {
    modals.openScrimModal(eventId);
  };

  return (
    <>
      <div>
        <button onClick={() => handleConfigureTraining('event-123')}>
          Configure Training
        </button>
        <button onClick={() => handleConfigureScrim('event-456')}>
          Configure Scrim
        </button>
      </div>

      {/* Render modals at the end */}
      <ActivityModals {...modals} />
    </>
  );
}
```

## Migration from Old Pattern

### Before (ObjectivesPanel)

```tsx
const [selectedTrainingEventId, setSelectedTrainingEventId] = useState<string | null>(null);
const [selectedScrimEventId, setSelectedScrimEventId] = useState<string | null>(null);

const handleObjectiveClick = (objective: DailyObjective) => {
  if (objective.action?.openModal === 'training' && objective.action.eventId) {
    setSelectedTrainingEventId(objective.action.eventId);
    return;
  }
  if (objective.action?.openModal === 'scrim' && objective.action.eventId) {
    setSelectedScrimEventId(objective.action.eventId);
    return;
  }
};

// Modal rendering
{selectedTrainingEventId && (() => {
  const config = getActivityConfig(selectedTrainingEventId);
  return (
    <TrainingModal
      isOpen={selectedTrainingEventId !== null}
      onClose={() => setSelectedTrainingEventId(null)}
      eventId={selectedTrainingEventId}
      existingConfig={config?.type === 'training' ? config : undefined}
    />
  );
})()}
```

### After (with useActivityModals)

```tsx
const modals = useActivityModals();

const handleObjectiveClick = (objective: DailyObjective) => {
  if (objective.action?.openModal === 'training' && objective.action.eventId) {
    modals.openTrainingModal(objective.action.eventId);
    return;
  }
  if (objective.action?.openModal === 'scrim' && objective.action.eventId) {
    modals.openScrimModal(objective.action.eventId);
    return;
  }
};

// Modal rendering
<ActivityModals {...modals} />
```

## API Reference

### useActivityModals()

Returns an object with the following properties:

- `selectedTrainingEventId: string | null` - Currently selected training event ID (null if no modal open)
- `selectedScrimEventId: string | null` - Currently selected scrim event ID (null if no modal open)
- `openTrainingModal(eventId: string): void` - Opens the training modal for the given event
- `openScrimModal(eventId: string): void` - Opens the scrim modal for the given event
- `closeTrainingModal(): void` - Closes the training modal
- `closeScrimModal(): void` - Closes the scrim modal

### ActivityModals Component

Props: Accepts all properties from `ActivityModalsState` (spread `{...modals}`)

Renders:
- `TrainingModal` when `selectedTrainingEventId` is not null
- `ScrimModal` when `selectedScrimEventId` is not null
- Automatically fetches activity config from the game store
- Handles modal close callbacks

## Benefits

1. **DRY Principle**: Eliminates duplicated modal state logic across panels
2. **Centralized Management**: Single source of truth for activity modal state
3. **Easier Maintenance**: Changes to modal logic only need to be made in one place
4. **Type Safety**: Full TypeScript support with proper typing
5. **Consistent Behavior**: Both panels use the same modal rendering logic
