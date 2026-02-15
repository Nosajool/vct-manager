// Worker message protocol types
// Discriminated unions for type-safe communication between main thread and worker

import type {
  Team,
  Player,
  TeamStrategy,
  MatchResult,
  TrainingResult,
  TrainingFocus,
  TrainingGoal,
  TrainingIntensity,
  ScrimResult,
  ScrimOptions,
  ScrimRelationship,
  MapPoolStrength,
  DramaGameStateSnapshot,
  DramaEventTemplate,
  DramaEvaluationResult,
  TierTeam,
  TeamTier,
} from '../types';

// ============================================================================
// Request Messages (Main → Worker)
// ============================================================================

/** Input for match simulation */
export interface MatchSimInput {
  teamA: Team;
  teamB: Team;
  playersA: Player[];
  playersB: Player[];
  strategyA?: TeamStrategy;
  strategyB?: TeamStrategy;
}

/** Input for training a single player */
export interface TrainingInput {
  player: Player;
  goal?: TrainingGoal;
  focus?: TrainingFocus;  // Legacy support
  intensity: TrainingIntensity;
  coachBonus: number;
}

/** Input for batch training multiple players */
export interface TrainingBatchInput {
  assignments: Array<{
    player: Player;
    goal?: TrainingGoal;
    focus?: TrainingFocus;
    intensity: TrainingIntensity;
    coachBonus: number;
  }>;
}

/** Input for scrim simulation */
export interface ScrimInput {
  playerTeam: Team;
  partnerTeam: (Team & { tier: TeamTier }) | TierTeam;
  playerTeamPlayers: Player[];
  partnerTeamPlayers: Player[];
  options: ScrimOptions;
  relationship: ScrimRelationship;
  mapPool: MapPoolStrength;
  currentDate: string;  // ISO date string for relationship events
  // Strength calculations (pre-computed on main thread to avoid needing full roster)
  playerTeamStrength: number;
  partnerTeamStrength: number;
  // "Before" snapshots for display
  chemistryBefore: number;
  relationshipBefore: number;
}

/** Input for drama evaluation */
export interface DramaInput {
  snapshot: DramaGameStateSnapshot;
  templates: DramaEventTemplate[];
}

/** Discriminated union of all worker request types */
export type WorkerRequest =
  | { type: 'SIMULATE_MATCH'; id: string; payload: MatchSimInput }
  | { type: 'TRAIN_PLAYER'; id: string; payload: TrainingInput }
  | { type: 'TRAIN_BATCH'; id: string; payload: TrainingBatchInput }
  | { type: 'RESOLVE_SCRIM'; id: string; payload: ScrimInput }
  | { type: 'EVALUATE_DRAMA'; id: string; payload: DramaInput };

// ============================================================================
// Response Messages (Worker → Main)
// ============================================================================

/** Progress update for long-running operations */
export interface ProgressUpdate {
  stage: string;          // e.g., "Simulating Map 1/3"
  progress: number;       // 0-100
  details?: string;       // Optional additional context
}

/** Discriminated union of all worker response types */
export type WorkerResponse =
  | { type: 'RESULT'; id: string; payload: WorkerResult }
  | { type: 'PROGRESS'; id: string; payload: ProgressUpdate }
  | { type: 'ERROR'; id: string; error: string };

/** Union of all possible result payloads */
export type WorkerResult =
  | { resultType: 'match'; data: MatchResult }
  | { resultType: 'training'; data: TrainingResult }
  | { resultType: 'training_batch'; data: TrainingResult[] }
  | { resultType: 'scrim'; data: ScrimResult }
  | { resultType: 'drama'; data: DramaEvaluationResult };
