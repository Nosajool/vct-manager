// Scheduling System Types
// Types for dynamic availability computation and day scheduling

import type { CalendarEvent, SeasonPhase, SchedulableActivityType } from './calendar';

/**
 * Represents the computed schedule state for a specific day
 */
export interface DaySchedule {
  date: string;
  fixedEvents: CalendarEvent[];              // matches, salary, tournaments
  scheduledActivities: CalendarEvent[];      // user-scheduled activities
  availableActivityTypes: SchedulableActivityType[];
  blockers: DayBlocker[];                    // why activities are blocked
  isMatchDay: boolean;
  isPlaceholderMatchDay: boolean;
}

/**
 * Represents a reason why certain activities are blocked on a day
 */
export interface DayBlocker {
  ruleId: string;
  reason: string;
  blockedActivityTypes: SchedulableActivityType[];
  severity: 'hard' | 'soft';
}

/**
 * Context information for evaluating scheduling rules
 */
export interface DayContext {
  date: string;
  seasonPhase: SeasonPhase;
  eventsOnDate: CalendarEvent[];
  playerTeamId: string;
}

/**
 * Result of evaluating a scheduling rule
 */
export type RuleResult =
  | { type: 'allow' }
  | { type: 'block'; blockedTypes: SchedulableActivityType[]; reason: string }
  | { type: 'skip' };

/**
 * Interface for scheduling rules that determine activity availability
 */
export interface SchedulingRule {
  id: string;
  name: string;
  priority: number;
  evaluate(context: DayContext): RuleResult;
}
