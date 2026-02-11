import type { TrainingGoal, TrainingIntensity, TrainingResult } from './economy';
import type { ScrimResult } from './scrim';

/**
 * Status of an activity configuration
 */
export type ActivityConfigStatus = 'needs_setup' | 'configured';

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
  eventId: string;
  status: ActivityConfigStatus;
  assignments: TrainingPlayerAssignment[];
  autoConfigured: boolean;
}

/**
 * Configuration for a scheduled scrim activity
 */
export interface ScrimActivityConfig {
  type: 'scrim';
  eventId: string;
  status: ActivityConfigStatus;
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
