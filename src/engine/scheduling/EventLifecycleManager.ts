// Event Lifecycle Manager
// Manages state transitions for scheduled activity events

import type { ActivityLifecycleState } from '../../types/calendar';

/**
 * Valid state transitions for activity lifecycle
 */
const VALID_TRANSITIONS: Record<ActivityLifecycleState, ActivityLifecycleState[]> = {
  needs_setup: ['configured', 'cancelled'],
  configured: ['locked', 'cancelled'],
  locked: ['completed'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Result of a transition validation
 */
export interface TransitionResult {
  valid: boolean;
  error?: string;
}

/**
 * Manages lifecycle state transitions for scheduled activities
 *
 * State flow:
 * - needs_setup → configured (user configures activity)
 * - configured → locked (day arrives, auto-transition)
 * - locked → completed (after resolution by ActivityResolutionService)
 * - needs_setup|configured → cancelled (user cancels before execution)
 */
export class EventLifecycleManager {
  /**
   * Validate if a state transition is allowed
   */
  canTransition(from: ActivityLifecycleState, to: ActivityLifecycleState): TransitionResult {
    const allowedTransitions = VALID_TRANSITIONS[from];

    if (!allowedTransitions.includes(to)) {
      return {
        valid: false,
        error: `Invalid transition from '${from}' to '${to}'. Allowed: ${allowedTransitions.join(', ') || 'none (terminal state)'}`,
      };
    }

    return { valid: true };
  }

  /**
   * Transition to configured state (user has set up the activity)
   */
  transitionToConfigured(currentState: ActivityLifecycleState): TransitionResult {
    return this.canTransition(currentState, 'configured');
  }

  /**
   * Transition to locked state (day has arrived, activity is frozen)
   */
  transitionToLocked(currentState: ActivityLifecycleState): TransitionResult {
    return this.canTransition(currentState, 'locked');
  }

  /**
   * Transition to completed state (activity has been resolved)
   */
  transitionToCompleted(currentState: ActivityLifecycleState): TransitionResult {
    return this.canTransition(currentState, 'completed');
  }

  /**
   * Transition to cancelled state (user cancelled before execution)
   */
  transitionToCancelled(currentState: ActivityLifecycleState): TransitionResult {
    return this.canTransition(currentState, 'cancelled');
  }

  /**
   * Check if a state is terminal (no further transitions possible)
   */
  isTerminalState(state: ActivityLifecycleState): boolean {
    return VALID_TRANSITIONS[state].length === 0;
  }

  /**
   * Check if an activity can be modified (not locked or terminal)
   */
  canModify(state: ActivityLifecycleState): boolean {
    return state === 'needs_setup' || state === 'configured';
  }

  /**
   * Check if an activity can be cancelled
   */
  canCancel(state: ActivityLifecycleState): boolean {
    return state === 'needs_setup' || state === 'configured';
  }

  /**
   * Get the next expected state in the normal flow
   * (needs_setup → configured → locked → completed)
   */
  getNextState(currentState: ActivityLifecycleState): ActivityLifecycleState | null {
    switch (currentState) {
      case 'needs_setup':
        return 'configured';
      case 'configured':
        return 'locked';
      case 'locked':
        return 'completed';
      default:
        return null; // Terminal states have no next state
    }
  }
}

/**
 * Singleton instance
 */
export const eventLifecycleManager = new EventLifecycleManager();
