// Day Plan Types - Unified types for Today's Plan and Week Planner
//
// Central type definitions for the day planning system that powers both
// the Today panel and Week Planner. Replaces the separate objective/schedule types
// with a unified item-based model.

import type { ActiveView } from '../store/slices/uiSlice';
import type { SchedulableActivityType } from './calendar';

/**
 * Categories for day plan items
 */
export type DayPlanItemCategory = 'match' | 'activity' | 'alert' | 'info';

/**
 * Action that can be triggered when clicking a day plan item
 * Supports both navigation to views and opening modals
 */
export interface DayPlanItemAction {
  /** View to navigate to when item is clicked */
  view?: ActiveView;
  /** Optional data context for navigation */
  data?: {
    matchId?: string;
    tournamentId?: string;
    playerId?: string;
    tab?: string;
  };
  /** Modal to open instead of navigating */
  openModal?: 'training' | 'scrim' | 'strategy';
  /** Event ID for modal context (e.g., calendar event ID) */
  eventId?: string;
  /** Schedule data for available activities that need scheduling */
  scheduleData?: {
    date: string;
    activityType: SchedulableActivityType;
  };
}

/**
 * Activity lifecycle states
 * Tracks the configuration and availability status of scheduled activities
 */
export type ActivityState =
  | 'available'      // Can be scheduled
  | 'needs_setup'    // Scheduled but not configured
  | 'configured'     // Scheduled and configured
  | 'skipped'        // Explicitly skipped
  | 'locked'         // Cannot be modified (past event)
  | 'unavailable';   // Cannot be scheduled (blocked by rules)

/**
 * Severity levels for alerts and info items
 */
export type DayPlanItemSeverity = 'critical' | 'warning' | 'info';

/**
 * A single item in a day plan
 * Can represent matches, activities, alerts, or informational items
 */
export interface DayPlanItem {
  /** Unique identifier for this item */
  id: string;
  /** Item category determines rendering and behavior */
  category: DayPlanItemCategory;
  /** Short display label */
  label: string;
  /** Detailed description or context */
  description: string;
  /** Priority for sorting (higher = more important) */
  priority: number;
  /** Whether the item has been completed/acknowledged */
  completed: boolean;

  // Optional fields based on category
  /** Action to perform when item is clicked */
  action?: DayPlanItemAction;
  /** Type of activity (for 'activity' category) */
  activityType?: 'training' | 'scrim' | 'strategy';
  /** Current state of the activity (for 'activity' category) */
  activityState?: ActivityState;
  /** Calendar event ID if this item is linked to a calendar event */
  calendarEventId?: string;
  /** Type of schedulable activity (for 'activity' category) */
  schedulableType?: SchedulableActivityType;
  /** Match information (for 'match' category) */
  matchData?: {
    homeTeamName: string;
    awayTeamName: string;
    isToday: boolean;
  };
  /** Severity level (for 'alert' and 'info' categories) */
  severity?: DayPlanItemSeverity;
}

/**
 * Complete plan for a single day
 * Contains all items (matches, activities, alerts, info) for that date
 */
export interface DayPlan {
  /** ISO date string for this plan (YYYY-MM-DD) */
  date: string;
  /** All items for this day, sorted by priority */
  items: DayPlanItem[];
  /** Whether this day has any matches */
  isMatchDay: boolean;
  /** Whether this day has a placeholder match (e.g., unscheduled playoff) */
  isPlaceholderMatchDay: boolean;
  /** Whether this is today's plan */
  isToday: boolean;
}
