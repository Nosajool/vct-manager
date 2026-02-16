// useDayPlan Hook - Unified hooks for Today's Plan and Week Planner
//
// Reactive hooks that provide day plan data from DayPlanService.
// Automatically re-render when game state changes.

import { useGameStore } from '../store';
import { dayPlanService } from '../services/DayPlanService';
import type { DayPlan } from '../types/dayPlan';

/**
 * Hook to get a day plan for a specific date
 *
 * Returns a DayPlan object with all items (matches, activities, alerts, info)
 * for the specified date, sorted by priority. Reactive to store changes.
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns DayPlan for the specified date
 *
 * @example
 * ```tsx
 * function TodayPlanPanel() {
 *   const currentDate = useGameStore(state => state.calendar.currentDate);
 *   const dayPlan = useDayPlan(currentDate);
 *
 *   return (
 *     <div>
 *       {dayPlan.items.map(item => (
 *         <DayPlanItemCard key={item.id} item={item} variant="full" />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDayPlan(date: string): DayPlan {
  // Subscribe to store changes - hook will re-render when any state changes
  // We call useGameStore() to subscribe the component to state updates
  // The service internally calls useGameStore.getState() to read current state
  useGameStore();

  const acknowledged = useGameStore((state) => state.acknowledgedDayPlanItems);

  // Get day plan from service
  const plan = dayPlanService.getDayPlan(date);

  // Merge acknowledged state into items
  if (acknowledged.size > 0) {
    return {
      ...plan,
      items: plan.items.map((item) =>
        !item.completed && acknowledged.has(item.id)
          ? { ...item, completed: true }
          : item
      ),
    };
  }

  return plan;
}

/**
 * Hook to get day plans for the upcoming week (6 days starting from tomorrow)
 *
 * Returns an array of DayPlan objects for the next 6 days, excluding today.
 * Reactive to store changes. Week planner shows only match and activity items.
 *
 * @returns Array of 6 DayPlan objects, starting from tomorrow
 *
 * @example
 * ```tsx
 * function WeekPlannerPanel() {
 *   const weekPlans = useWeekPlan();
 *
 *   return (
 *     <div>
 *       {weekPlans.map(dayPlan => (
 *         <DayPlanCard key={dayPlan.date} dayPlan={dayPlan} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWeekPlan(): DayPlan[] {
  // Subscribe to store changes
  const currentDate = useGameStore(state => state.calendar.currentDate);

  // Generate 6 dates starting from tomorrow
  const weekDates = generateWeekDates(currentDate, 6);

  // Get day plans for each date
  return weekDates.map(date => dayPlanService.getDayPlan(date));
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate an array of ISO date strings starting from the day after the given date
 *
 * @param startDate - ISO date string to start from (YYYY-MM-DD)
 * @param count - Number of dates to generate
 * @returns Array of ISO date strings
 *
 * @internal
 */
function generateWeekDates(startDate: string, count: number): string[] {
  const dates: string[] = [];

  for (let i = 1; i <= count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

// Re-export types for convenience
export type { DayPlan, DayPlanItem, DayPlanItemAction, ActivityState } from '../types/dayPlan';
