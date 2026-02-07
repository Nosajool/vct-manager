// useFeatureGate Hook - Reactive feature unlock detection
//
// Provides reactive hooks for checking feature availability and next unlocks.
// Automatically updates when game time progresses or phases change.

import { useGameStore } from '../store';
import { featureGateService } from '../services/FeatureGateService';
import type { FeatureType, FeatureUnlock } from '../data/featureUnlocks';

/**
 * Hook to check if a feature is currently unlocked
 *
 * Reactively updates when:
 * - Current date changes (day-based unlocks)
 * - Current phase changes (phase-based unlocks)
 *
 * @param featureId - The feature to check (e.g., 'training', 'scrims')
 * @returns true if the feature is unlocked, false otherwise
 *
 * @example
 * ```tsx
 * const canUseScrims = useFeatureUnlocked('scrims');
 * return <Button disabled={!canUseScrims}>Schedule Scrim</Button>;
 * ```
 */
export function useFeatureUnlocked(featureId: FeatureType): boolean {
  // Subscribe to calendar state for reactive updates
  const currentDate = useGameStore((state) => state.calendar.currentDate);
  const currentPhase = useGameStore((state) => state.calendar.currentPhase);

  // Re-compute when date or phase changes
  return featureGateService.isFeatureUnlocked(featureId);
}

/**
 * Hook to get the next feature that will unlock
 *
 * Reactively updates when:
 * - Current date changes
 * - Current phase changes
 * - Features unlock (next in queue changes)
 *
 * @returns The next feature unlock, or null if all features are unlocked
 *
 * @example
 * ```tsx
 * const nextUnlock = useNextUnlock();
 * if (nextUnlock) {
 *   return <div>Next unlock: {nextUnlock.feature} - {nextUnlock.description}</div>;
 * }
 * ```
 */
export function useNextUnlock(): FeatureUnlock | null {
  // Subscribe to calendar state for reactive updates
  const currentDate = useGameStore((state) => state.calendar.currentDate);
  const currentPhase = useGameStore((state) => state.calendar.currentPhase);

  // Re-compute when date or phase changes
  return featureGateService.getNextUnlock();
}
