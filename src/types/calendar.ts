// Calendar System Types
// Based on VCT Manager Technical Specification

export type SeasonPhase =
  | 'offseason'
  | 'kickoff'
  | 'stage1'
  | 'stage1_playoffs'
  | 'stage2'
  | 'stage2_playoffs'
  | 'masters1'
  | 'masters2'
  | 'champions';

export type CalendarEventType =
  | 'match'
  | 'tournament_start'
  | 'tournament_end'
  | 'transfer_window_open'
  | 'transfer_window_close'
  | 'salary_payment'
  | 'sponsorship_renewal'
  | 'season_end'
  | 'rest_day'
  | 'placeholder_match'
  | 'scheduled_training'
  | 'scheduled_scrim'
  | 'team_activity';

export type ActivityLifecycleState =
  | 'needs_setup'   // scheduled but unconfigured
  | 'configured'    // user has set it up, can still modify
  | 'locked'        // day arrived, frozen
  | 'completed'     // resolved by ActivityResolutionService
  | 'cancelled';    // removed before execution

export type SchedulableActivityType =
  | 'training'
  | 'scrim'
  | 'rest'
  | 'social_media'
  | 'team_offsite'
  | 'bootcamp';

export interface CalendarEvent {
  id: string;
  date: string;  // ISO date string for serialization
  type: CalendarEventType;
  data: unknown;  // Event-specific data
  processed: boolean;
  required?: boolean;  // Must process (matches) vs optional (training)
  lifecycleState?: ActivityLifecycleState;  // Only for activity events
}

export interface GameCalendar {
  currentDate: string;  // ISO date string for serialization
  currentSeason: number;
  currentPhase: SeasonPhase;

  // Event queue (pre-scheduled)
  scheduledEvents: CalendarEvent[];
}

import type { Region } from './player';

// Structured event data types (for type-safe access to event.data)
export interface MatchEventData {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName?: string;
  awayTeamName?: string;
  tournamentId?: string;
  tournamentName?: string;
  isPlayerMatch?: boolean;
  phase?: SeasonPhase;  // For league matches, indicates which phase this match belongs to
  region?: Region;      // Which region this match belongs to
  isSwissMatch?: boolean;    // Match is part of Swiss stage
  swissRound?: number;       // Which Swiss round this match is in
  isPlayoffMatch?: boolean;  // Match is part of playoff stage
  isGrandFinal?: boolean;    // Match is the grand final
}

export interface TournamentEventData {
  tournamentName: string;
  phase: SeasonPhase;
}

export interface SalaryPaymentEventData {
  month: number;
  year: number;
}

export interface RestDayEventData {
  week: number;
  description?: string;
}

// TeamSlot types for placeholder matches
export type TeamSlot =
  | { type: 'team'; teamId: string }
  | { type: 'tbd' }
  | { type: 'qualified_from'; tournamentId: string; position: number };

export interface PlaceholderMatchEventData {
  tournamentId: string;
  tournamentName: string;
  phase: SeasonPhase;
  region?: Region;
  bracketMatchId: string;        // links to BracketMatch
  teamASlot: TeamSlot;           // may be 'tbd' or 'qualified_from'
  teamBSlot: TeamSlot;
  resolvedTeamAId?: string;      // filled when resolved
  resolvedTeamBId?: string;
}

// Union type for all event data - used for type-safe casting
export type CalendarEventData =
  | MatchEventData
  | TournamentEventData
  | SalaryPaymentEventData
  | RestDayEventData
  | PlaceholderMatchEventData;
