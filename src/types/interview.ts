// Interview System Types
// Part of the narrative layer (System 2: Interview System)

import type { PlayerPersonality } from './player';

export type InterviewContext = 'PRE_MATCH' | 'POST_MATCH' | 'CRISIS';

export type InterviewTone =
  | 'CONFIDENT'
  | 'RESPECTFUL'
  | 'TRASH_TALK'
  | 'DEFLECTIVE'
  | 'BLAME_SELF'
  | 'BLAME_TEAM'
  | 'HUMBLE'
  | 'AGGRESSIVE';

export type InterviewSubject = 'manager' | 'player' | 'coach';

// Optional condition that gates when a template can appear
export type InterviewCondition =
  | 'always'
  | 'pre_playoff'
  | 'rivalry_active'
  | 'loss_streak_2plus'
  | 'win_streak_2plus'
  | 'loss_streak_3plus'
  | 'drama_active'
  | 'sponsor_trust_low';

export interface InterviewEffects {
  morale?: number;        // Delta applied to all player morale
  fanbase?: number;       // Delta applied to reputation.fanbase
  hype?: number;          // Delta applied to reputation.hypeLevel
  sponsorTrust?: number;  // Delta applied to reputation.sponsorTrust
  rivalryDelta?: number;  // Delta applied to rivalry intensity with opponent
  dramaChance?: number;   // 0-100 chance to trigger a random drama event
  targetPlayerIds?: string[];  // If set, morale only applies to these players
  setsFlags?: Array<{ key: string; durationDays: number }>;  // Drama flags to set when this option is chosen
  clearsFlags?: string[];  // Drama flags to remove when this option is chosen
}

export interface InterviewOption {
  tone: InterviewTone;
  label: string;          // Short label shown in UI (e.g. "Stay confident")
  quote: string;          // What the manager/player says verbatim
  effects: InterviewEffects;
  personalityWeights?: Partial<Record<PlayerPersonality, number>>;
  // Weight per personality (0 = locked out, 1 = normal, 2 = preferred).
  // Only applied when subjectType === 'player'. Manager/coach interviews ignore this.
  requiresFlags?: string[];
  // Option only shown if ALL these drama flags are currently active.
}

export interface InterviewTemplate {
  id: string;
  context: InterviewContext;
  subjectType: InterviewSubject;
  condition?: InterviewCondition;
  prompt: string;         // The question posed by the reporter
  options: InterviewOption[]; // Always exactly 3 options
  requiresActiveFlag?: string; // Template-level gate: only eligible if this drama flag is active
}

// A pending interview waiting for the player to respond
export interface PendingInterview {
  templateId: string;
  context: InterviewContext;
  subjectType: InterviewSubject;
  subjectId?: string;       // playerId or coachId if subject is player/coach
  opponentTeamId?: string;  // Relevant for PRE_MATCH and POST_MATCH
  prompt: string;
  options: InterviewOption[];
}

// Historical record of a completed interview choice
export interface InterviewHistoryEntry {
  date: string;             // ISO date string
  templateId: string;
  context: InterviewContext;
  chosenTone: InterviewTone;
  effects: InterviewEffects;
}
