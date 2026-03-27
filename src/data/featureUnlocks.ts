// Feature Unlock Schedule
// Defines when game features become available to the player
// Based on in-game progression (days elapsed or season phase)

import type { SeasonPhase } from '../types/calendar';

// ============================================
// TYPES
// ============================================

/** Available game features that can be unlocked */
export type FeatureType =
  | 'training'
  | 'scrims'
  | 'transfers'
  | 'strategy'
  | 'roster_optimization'
  | 'auto_assign'
  | 'advancedTraining'
  | 'advancedScrims'
  // Downtime features
  | 'downtime_activities'   // watch party + fan meetup
  | 'bootcamp'              // regional bootcamp (7-day commit)
  | 'content_events'        // streamer collab, youtube doc, sponsored content
  | 'coach_briefing';       // daily coach condition briefing

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
  {
    feature: 'roster_optimization',
    condition: { type: 'day', day: 8 },
    description: 'Lineup Optimizer unlocks on day 8 - analyze your roster to find the optimal 5-player starting lineup',
  },
  {
    feature: 'auto_assign',
    condition: { type: 'day', day: 22 },
    description: 'Smart coaching tools unlocked - auto-optimize training and scrims',
  },
  {
    feature: 'advancedTraining',
    condition: { type: 'phase', phase: 'stage1_playoffs' },
    description: 'Advanced training options unlock in Stage 1 Playoffs - per-player goals, intensity control, and bench training',
  },
  {
    feature: 'advancedScrims',
    condition: { type: 'phase', phase: 'stage2' },
    description: 'Advanced scrim options unlock in Stage 2 - map selection and intensity control',
  },
  {
    feature: 'downtime_activities',
    condition: { type: 'day', day: 15 },
    description: 'Downtime activities unlock on day 15 - watch party and fan meetup available when not in a tournament',
  },
  {
    feature: 'bootcamp',
    condition: { type: 'phase', phase: 'stage1' },
    description: 'Regional bootcamps unlock in Stage 1 - commit your team to a 7-day trip for region-specific skill focus',
  },
  {
    feature: 'content_events',
    condition: { type: 'day', day: 30 },
    description: 'Content & brand events unlock on day 30 - streamer collabs, youtube documentaries, and sponsored content',
  },
  {
    feature: 'coach_briefing',
    condition: { type: 'day', day: 10 },
    description: "Your coach will now brief you on team conditions after each day — morale concerns, chemistry shifts, momentum, and upcoming rivalries.",
  },
];
