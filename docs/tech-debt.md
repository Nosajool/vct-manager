# Technical Debt

This document tracks known technical debt and recommended refactors for future improvement.

---

## Calendar Event Handler Registry Pattern

**Priority**: Medium
**Effort**: Low-Medium
**Impact**: Maintainability, Type Safety

### Current State

`CalendarService.advanceDay()` uses an if-else chain to dispatch event handlers:

```typescript
for (const event of unprocessedEvents) {
  if (event.type === 'salary_payment') {
    this.processSalaryPayment(event);
  } else if (event.type === 'tournament_start') {
    this.processTournamentStart(event);
  } else if (event.type === 'match') {
    // ... match handling
  } else if (timeProgression.isRequiredEventType(event.type)) {
    // Required but unhandled - silently marks as processed
    state.markEventProcessed(event.id);
  } else {
    // Optional events - skipped
  }
}
```

### Problems

1. **Silent failures** - Required event types without handlers pass through silently. This caused a bug where `tournament_start` events were never handled, leaving tournaments in `upcoming` status indefinitely.

2. **No compile-time safety** - Adding a new `CalendarEventType` doesn't produce any warning that a handler is missing.

3. **Scattered logic** - All event handling lives in one method, making it hard to understand what each event type does.

4. **Hard to test** - Can't easily unit test individual event handlers in isolation.

5. **Not extensible** - Other services can't register their own event handlers.

### Recommended: Event Handler Registry

```typescript
type EventHandler = (event: CalendarEvent) => void;

interface EventHandlerConfig {
  handler: EventHandler;
  required: boolean;  // Should warn if event occurs without handler
}

class CalendarService {
  private handlers = new Map<CalendarEventType, EventHandlerConfig>();

  // Events that are user-initiated (no handler needed)
  private optionalEvents: Set<CalendarEventType> = new Set([
    'training_available',
    'scrim_available',
    'rest_day',
  ]);

  constructor() {
    // Register built-in handlers
    this.registerHandler('match', this.simulateMatchEvent.bind(this), true);
    this.registerHandler('tournament_start', this.processTournamentStart.bind(this), true);
    this.registerHandler('salary_payment', this.processSalaryPayment.bind(this), true);
    // tournament_end is informational - completion detected via checkAllTournamentCompletion()
  }

  registerHandler(
    type: CalendarEventType,
    handler: EventHandler,
    required: boolean = false
  ): void {
    this.handlers.set(type, { handler, required });
  }

  advanceDay(): TimeAdvanceResult {
    // ...
    for (const event of unprocessedEvents) {
      const config = this.handlers.get(event.type);

      if (config) {
        config.handler(event);
        processedEvents.push(event);
      } else if (this.optionalEvents.has(event.type)) {
        // User chose not to act - skip silently
        state.markEventProcessed(event.id);
        skippedEvents.push(event);
      } else if (timeProgression.isRequiredEventType(event.type)) {
        // Required event with no handler - this is a bug!
        console.error(`No handler registered for required event: ${event.type}`);
        state.markEventProcessed(event.id);
      } else {
        // Unknown optional event
        state.markEventProcessed(event.id);
      }
    }
    // ...
  }
}
```

### Benefits

1. **Explicit registration** - Missing handlers are obvious from the constructor
2. **Runtime warnings** - Required events without handlers log errors
3. **Testable** - Handlers can be tested in isolation
4. **Extensible** - Other services could register handlers (e.g., `economyService.registerHandler('sponsorship_renewal', ...)`)
5. **Self-documenting** - Handler registration serves as documentation

### Migration Path

1. Add `handlers` Map and `registerHandler()` method
2. Move existing handlers to registered functions
3. Replace if-else chain with Map lookup
4. Add runtime warning for unhandled required events
5. (Optional) Add exhaustive type checking via TypeScript

### Exhaustive Type Checking (Optional Enhancement)

To get compile-time errors for missing handlers:

```typescript
// Helper type that ensures all CalendarEventTypes are covered
type EventHandlerMap = {
  [K in CalendarEventType]: EventHandlerConfig | 'optional' | 'informational';
};

const EVENT_HANDLERS: EventHandlerMap = {
  match: { handler: simulateMatchEvent, required: true },
  tournament_start: { handler: processTournamentStart, required: true },
  salary_payment: { handler: processSalaryPayment, required: true },
  tournament_end: 'informational',  // Handled via checkAllTournamentCompletion
  training_available: 'optional',
  scrim_available: 'optional',
  rest_day: 'optional',
  transfer_window_open: 'informational',   // Future feature
  transfer_window_close: 'informational',  // Future feature
  sponsorship_renewal: 'informational',    // Future feature
  season_end: 'informational',             // Future feature
};
```

Adding a new `CalendarEventType` without updating `EVENT_HANDLERS` would produce a TypeScript error.

---

## Future Tech Debt Items

(Add new items here as they're identified)
