import type { TrainingGoal, TrainingIntensity, TrainingResult } from './economy';
import type { ScrimResult } from './scrim';
import type { ActivityLifecycleState } from './calendar';

/**
 * Player assignment for a training activity
 */
export interface TrainingPlayerAssignment {
  playerId: string;
  action: 'train' | 'skip';
  goal?: TrainingGoal;       // required when action='train'
  intensity?: TrainingIntensity; // required when action='train'
}

/**
 * Configuration for a scheduled training activity
 */
export interface TrainingActivityConfig {
  type: 'training';
  id: string;                           // Own identity, not tied to event ID
  date: string;                         // ISO date string for which day this is for
  eventId: string;                      // Links to the calendar event
  status: ActivityLifecycleState;       // Full lifecycle state
  assignments: TrainingPlayerAssignment[];
  autoConfigured: boolean;
}

/**
 * Configuration for a scheduled scrim activity
 */
export interface ScrimActivityConfig {
  type: 'scrim';
  id: string;                           // Own identity, not tied to event ID
  date: string;                         // ISO date string for which day this is for
  eventId: string;                      // Links to the calendar event
  status: ActivityLifecycleState;       // Full lifecycle state
  action: 'play' | 'skip';
  partnerTeamId?: string;
  maps?: string[];
  intensity?: 'light' | 'moderate' | 'competitive';
  autoConfigured: boolean;
}

/**
 * Union type for all activity configurations
 */
export type ActivityConfig = TrainingActivityConfig | ScrimActivityConfig;

/**
 * Result of resolving all configured activities during day advancement
 */
export interface ActivityResolutionResult {
  trainingResults: TrainingResult[];
  scrimResult: ScrimResult | null;
  skippedTraining: boolean;
  skippedScrim: boolean;
}
