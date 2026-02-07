// FeatureGateService - Progressive feature unlock system
// Determines which game features are available based on game progression

import { FEATURE_UNLOCKS, type FeatureType, type FeatureUnlock } from '../data/featureUnlocks';
import { useGameStore } from '../store';
import { timeProgression } from '../engine/calendar/TimeProgression';

/** The date the game always starts on */
const GAME_START_DATE = '2026-01-01T00:00:00.000Z';

/**
 * FeatureGateService - Controls access to game features based on progression
 *
 * Features unlock progressively as the game advances:
 * - Day-based unlocks: training (day 1), scrims (day 8), transfers (day 22)
 * - Phase-based unlocks: strategy (stage1)
 */
export class FeatureGateService {
  /**
   * Check if a feature is currently unlocked
   *
   * @param featureId - The feature to check (e.g., 'training', 'scrims')
   * @returns true if the feature is unlocked, false otherwise
   */
  isFeatureUnlocked(featureId: FeatureType): boolean {
    const unlock = FEATURE_UNLOCKS.find((u) => u.feature === featureId);
    if (!unlock) {
      console.warn(`Unknown feature: ${featureId}`);
      return false;
    }

    return this.checkUnlockCondition(unlock);
  }

  /**
   * Get all features that are currently locked
   *
   * @returns Array of feature unlocks that haven't been met yet
   */
  getLockedFeatures(): FeatureUnlock[] {
    return FEATURE_UNLOCKS.filter((unlock) => !this.checkUnlockCondition(unlock));
  }

  /**
   * Get the next feature that will unlock
   *
   * @returns The next feature unlock, or null if all features are unlocked
   */
  getNextUnlock(): FeatureUnlock | null {
    const locked = this.getLockedFeatures();
    if (locked.length === 0) return null;

    const store = useGameStore.getState();
    const currentDay = this.getCurrentDayCount();
    const currentPhase = store.calendar.currentPhase;

    // Sort locked features by proximity to unlock
    // Day-based features sort by day difference, phase-based come after all day unlocks
    const sorted = locked.sort((a, b) => {
      // Both day-based: sort by day
      if (a.condition.type === 'day' && b.condition.type === 'day') {
        return a.condition.day - b.condition.day;
      }

      // Day-based comes before phase-based
      if (a.condition.type === 'day' && b.condition.type === 'phase') {
        return -1;
      }
      if (a.condition.type === 'phase' && b.condition.type === 'day') {
        return 1;
      }

      // Both phase-based: maintain order from FEATURE_UNLOCKS
      // (in current schedule, only one phase-based unlock exists)
      return 0;
    });

    return sorted[0];
  }

  /**
   * Get the current day count (days since game start)
   * Day 1 = first day of the game (2026-01-01)
   *
   * @returns The current day number (1-based)
   */
  getCurrentDayCount(): number {
    const store = useGameStore.getState();
    const currentDate = store.calendar.currentDate;

    // Calculate days elapsed since game start
    const daysDifference = timeProgression.getDaysDifference(GAME_START_DATE, currentDate);

    // Day count is 1-based (day 1 = game start)
    return daysDifference + 1;
  }

  /**
   * Check if a specific unlock condition is met
   *
   * @param unlock - The feature unlock to check
   * @returns true if the condition is met, false otherwise
   */
  private checkUnlockCondition(unlock: FeatureUnlock): boolean {
    const store = useGameStore.getState();

    if (unlock.condition.type === 'day') {
      const currentDay = this.getCurrentDayCount();
      return currentDay >= unlock.condition.day;
    }

    if (unlock.condition.type === 'phase') {
      const currentPhase = store.calendar.currentPhase;
      const targetPhase = unlock.condition.phase;

      // Phase progression order
      const phaseOrder = [
        'offseason',
        'kickoff',
        'stage1',
        'stage1_playoffs',
        'stage2',
        'stage2_playoffs',
        'masters1',
        'masters2',
        'champions',
      ];

      const currentIndex = phaseOrder.indexOf(currentPhase);
      const targetIndex = phaseOrder.indexOf(targetPhase);

      // Unlocked if we've reached or passed the target phase
      return currentIndex >= targetIndex;
    }

    return false;
  }

  /**
   * Get all unlocked features
   *
   * @returns Array of feature types that are currently unlocked
   */
  getUnlockedFeatures(): FeatureType[] {
    return FEATURE_UNLOCKS
      .filter((unlock) => this.checkUnlockCondition(unlock))
      .map((unlock) => unlock.feature);
  }

  /**
   * Get days until a feature unlocks (for day-based unlocks only)
   *
   * @param featureId - The feature to check
   * @returns Number of days until unlock, 0 if already unlocked, null if phase-based
   */
  getDaysUntilUnlock(featureId: FeatureType): number | null {
    const unlock = FEATURE_UNLOCKS.find((u) => u.feature === featureId);
    if (!unlock) return null;

    if (unlock.condition.type === 'phase') {
      return null; // Phase-based unlocks don't have a day count
    }

    const currentDay = this.getCurrentDayCount();
    const unlockDay = unlock.condition.day;

    return Math.max(0, unlockDay - currentDay);
  }

  /**
   * Get the FeatureUnlock definition for a specific feature
   *
   * @param featureId - The feature to look up
   * @returns The feature unlock definition, or null if not found
   */
  getFeatureUnlock(featureId: FeatureType): FeatureUnlock | null {
    return FEATURE_UNLOCKS.find((u) => u.feature === featureId) ?? null;
  }
}

// Export singleton instance
export const featureGateService = new FeatureGateService();
