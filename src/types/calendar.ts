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
  | 'training_available'
  | 'scrim_available'
  | 'rest_day';

export interface CalendarEvent {
  id: string;
  date: string;  // ISO date string for serialization
  type: CalendarEventType;
  data: unknown;  // Event-specific data
  processed: boolean;
  required?: boolean;  // Must process (matches) vs optional (training)
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

// Union type for all event data - used for type-safe casting
export type CalendarEventData =
  | MatchEventData
  | TournamentEventData
  | SalaryPaymentEventData
  | RestDayEventData;
