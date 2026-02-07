// useObjectives Hook - Context-aware daily objectives for the manager
//
// Reactive hook that computes daily objectives from current game state.
// Uses ObjectivesService to analyze state and return 2-4 prioritized objectives.

import { useGameStore } from '../store';
import { getDailyObjectives, type DailyObjective } from '../services/ObjectivesService';

/**
 * Hook to get daily objectives computed from game state
 * Returns 2-4 context-aware objectives prioritized by importance
 *
 * @returns Array of daily objectives sorted by priority (highest first)
 *
 * @example
 * ```tsx
 * function ObjectivesPanel() {
 *   const objectives = useObjectives();
 *
 *   return (
 *     <div>
 *       {objectives.map(obj => (
 *         <ObjectiveCard key={obj.id} objective={obj} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useObjectives(): DailyObjective[] {
  const state = useGameStore();
  return getDailyObjectives(state);
}

// Re-export types for convenience
export type { DailyObjective, ObjectiveAction } from '../services/ObjectivesService';
