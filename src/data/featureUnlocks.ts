// Feature Unlock Schedule
// Defines when game features become available to the player
// Based on in-game progression (days elapsed or season phase)

import type { SeasonPhase } from '../types/calendar';

// ============================================
// TYPES
// ============================================

/** Available game features that can be unlocked */
export type FeatureType = 'training' | 'scrims' | 'transfers' | 'strategy';

/** Unlock condition - either day-based or phase-based */
export type UnlockCondition =
  | { type: 'day'; day: number }  // Day 1 = first day of the game
  | { type: 'phase'; phase: SeasonPhase };

/** Feature unlock definition */
export interface FeatureUnlock {
  /** The feature being unlocked */
  feature: FeatureType;
  /** Condition that must be met to unlock this feature */
  condition: UnlockCondition;
  /** Human-readable description of when/why this unlocks */
  description: string;
}

// ============================================
// FEATURE UNLOCK SCHEDULE
// ============================================

/**
 * Progressive feature unlock schedule
 *
 * Design rationale:
 * - Day 1 (Training): Core team development available immediately
 * - Day 8 / Week 2 (Scrims): Practice matches after initial team setup
 * - Day 22 / Week 4 (Transfers): Roster changes after evaluation period
 * - Stage 1 Phase (Strategy): Advanced tactics when competitive play begins
 */
export const FEATURE_UNLOCKS: FeatureUnlock[] = [
  {
    feature: 'training',
    condition: { type: 'day', day: 8 },
    description: 'Training unlocks on day 8 (week 2) - develop your team and improve player skills',
  },
  {
    feature: 'scrims',
    condition: { type: 'day', day: 15 },
    description: 'Scrims unlock on day 15 (week 3) - practice matches become available',
  },
  {
    feature: 'transfers',
    condition: { type: 'day', day: 1 },
    description: 'Transfers unlock on day 1 (week 1) - make roster changes',
  },
  {
    feature: 'strategy',
    condition: { type: 'phase', phase: 'stage1' },
    description: 'Strategy unlocks in Stage 1 - advanced tactics for competitive play',
  },
];
