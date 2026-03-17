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
  action: 'play';
  partnerTeamId?: string;
  maps?: string[];
  intensity?: 'light' | 'moderate' | 'competitive';
  autoConfigured: boolean;
}

export type BootcampRegion = 'APAC' | 'EU' | 'Americas';

/**
 * Configuration for a single day of a regional bootcamp (auto-configured, no user input needed)
 */
export interface BootcampDayActivityConfig {
  type: 'bootcamp_day';
  id: string;
  date: string;
  eventId: string;
  status: ActivityLifecycleState;
  bootcampId: string;   // Links to BootcampConfig in bootcampSlice
  bootcampDay: number;  // 1-7
  autoConfigured: true;
}

/**
 * Union type for all activity configurations
 */
export type ActivityConfig = TrainingActivityConfig | ScrimActivityConfig | BootcampDayActivityConfig;

/**
 * Result of resolving a single downtime activity during day advancement
 */
export interface DowntimeActivityResult {
  activityType: 'watch_party' | 'fan_meetup' | 'streamer_collab' | 'youtube_documentary' | 'sponsored_content';
  financialDelta: number;
  moraleChanges: { playerId: string; playerName: string; delta: number }[];
  reputationDeltas: { fanbase?: number; hype?: number; sponsorTrust?: number };
  featuredPlayerName?: string;
  dramaTriggered?: boolean;
  interviewPending?: boolean;
}

/**
 * Result of resolving all configured activities during day advancement
 */
export interface ActivityResolutionResult {
  trainingResults: TrainingResult[];
  scrimResult: ScrimResult | null;
  skippedTraining: boolean;
}
