// Calendar System Types
// Based on VCT Manager Technical Specification

export type SeasonPhase =
  | 'offseason'
  | 'kickoff'
  | 'stage1'
  | 'stage2'
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
