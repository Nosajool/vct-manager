// TimeProgression - Pure engine class for time advancement logic
// No React or store dependencies - pure functions only

import type { CalendarEvent, CalendarEventType } from '../../types';

/**
 * Available activity for a given day
 */
export interface Activity {
  type: CalendarEventType;
  required: boolean;
  description: string;
  eventId?: string; // Reference to the calendar event if exists
}

/**
 * Result of processing events during time advancement
 */
export interface TimeAdvancementResult {
  processedEvents: CalendarEvent[];
  skippedOptionalEvents: CalendarEvent[];
  newDate: string;
  daysAdvanced: number;
}

/**
 * Options for time advancement
 */
export interface AdvanceTimeOptions {
  autoProcessRequired: boolean; // Auto-process salary payments, etc.
  skipOptional: boolean; // Skip training days, rest days
}

/**
 * TimeProgression - Handles all time-related logic for the game calendar
 */
export class TimeProgression {
  private static readonly AUTO_SAVE_INTERVAL_DAYS = 7;

  /**
   * Add days to an ISO date string
   */
  addDays(isoDate: string, days: number): string {
    const date = new Date(isoDate);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * Get difference in days between two dates
   */
  getDaysDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if two dates are the same day
   */
  isSameDay(date1: string, date2: string): boolean {
    return new Date(date1).toDateString() === new Date(date2).toDateString();
  }

  /**
   * Check if date1 is before date2 (ignoring time)
   */
  isDateBefore(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return d1.getTime() < d2.getTime();
  }

  /**
   * Check if date1 is before or equal to date2 (ignoring time)
   */
  isDateBeforeOrEqual(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return d1.getTime() <= d2.getTime();
  }

  /**
   * Get all events between two dates (inclusive)
   */
  getEventsBetween(
    startDate: string,
    endDate: string,
    events: CalendarEvent[]
  ): CalendarEvent[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return events
      .filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= start && eventDate <= end;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Get unprocessed events between two dates
   */
  getUnprocessedEventsBetween(
    startDate: string,
    endDate: string,
    events: CalendarEvent[]
  ): CalendarEvent[] {
    return this.getEventsBetween(startDate, endDate, events).filter(
      (event) => !event.processed
    );
  }

  /**
   * Find the next event of specified types
   */
  findNextEvent(
    currentDate: string,
    events: CalendarEvent[],
    types: CalendarEventType[]
  ): CalendarEvent | null {
    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);

    const upcoming = events
      .filter((event) => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return (
          !event.processed &&
          eventDate >= current &&
          types.includes(event.type)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return upcoming[0] || null;
  }

  /**
   * Find the next match event
   */
  findNextMatch(currentDate: string, events: CalendarEvent[]): CalendarEvent | null {
    return this.findNextEvent(currentDate, events, ['match']);
  }

  /**
   * Check if auto-save should trigger
   */
  shouldAutoSave(currentDate: string, lastSaveDate: string | null): boolean {
    if (!lastSaveDate) return true;

    const daysSinceLastSave = this.getDaysDifference(lastSaveDate, currentDate);
    return daysSinceLastSave >= TimeProgression.AUTO_SAVE_INTERVAL_DAYS;
  }

  /**
   * Get available activities for a specific date
   */
  getAvailableActivities(
    currentDate: string,
    events: CalendarEvent[]
  ): Activity[] {
    const activities: Activity[] = [];
    const eventsToday = this.getEventsBetween(currentDate, currentDate, events).filter(
      (event) => !event.processed
    );

    // Check for required events first (matches, salary payments)
    for (const event of eventsToday) {
      activities.push({
        type: event.type,
        required: event.required ?? this.isRequiredEventType(event.type),
        description: this.getEventDescription(event),
        eventId: event.id,
      });
    }

    // If no match today, training is available
    const hasMatch = eventsToday.some((e) => e.type === 'match');
    if (!hasMatch) {
      // Check if there's already a training_available event
      const hasTrainingEvent = eventsToday.some((e) => e.type === 'training_available');
      if (!hasTrainingEvent) {
        activities.push({
          type: 'training_available',
          required: false,
          description: 'Team training session available',
        });
      }
    }

    // Sort: required first, then by type
    return activities.sort((a, b) => {
      if (a.required && !b.required) return -1;
      if (!a.required && b.required) return 1;
      return 0;
    });
  }

  /**
   * Check if an event type is required (must be processed)
   */
  isRequiredEventType(type: CalendarEventType): boolean {
    const requiredTypes: CalendarEventType[] = [
      'match',
      'salary_payment',
      'tournament_start',
      'tournament_end',
      'transfer_window_open',
      'transfer_window_close',
      'season_end',
    ];
    return requiredTypes.includes(type);
  }

  /**
   * Get human-readable description for an event
   */
  getEventDescription(event: CalendarEvent): string {
    const data = event.data as Record<string, unknown>;

    switch (event.type) {
      case 'match':
        return `Match: ${data?.homeTeam || 'TBD'} vs ${data?.awayTeam || 'TBD'}`;
      case 'salary_payment':
        return 'Monthly salary payments due';
      case 'training_available':
        return 'Training session available';
      case 'rest_day':
        return 'Rest day - no activities scheduled';
      case 'tournament_start':
        return `Tournament begins: ${data?.tournamentName || 'Unknown'}`;
      case 'tournament_end':
        return `Tournament ends: ${data?.tournamentName || 'Unknown'}`;
      case 'transfer_window_open':
        return 'Transfer window opens';
      case 'transfer_window_close':
        return 'Transfer window closes';
      case 'sponsorship_renewal':
        return 'Sponsorship renewal deadline';
      case 'season_end':
        return 'Season ends';
      default:
        return `Event: ${event.type}`;
    }
  }

  /**
   * Get required events that need processing before a date
   */
  getRequiredEventsBefore(
    beforeDate: string,
    events: CalendarEvent[]
  ): CalendarEvent[] {
    return events
      .filter((event) => {
        const isRequired = event.required ?? this.isRequiredEventType(event.type);
        return (
          !event.processed &&
          isRequired &&
          this.isDateBeforeOrEqual(event.date, beforeDate)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Categorize events by type
   */
  categorizeEvents(events: CalendarEvent[]): Record<CalendarEventType, CalendarEvent[]> {
    const result: Record<CalendarEventType, CalendarEvent[]> = {
      match: [],
      tournament_start: [],
      tournament_end: [],
      transfer_window_open: [],
      transfer_window_close: [],
      salary_payment: [],
      sponsorship_renewal: [],
      season_end: [],
      training_available: [],
      rest_day: [],
    };

    for (const event of events) {
      result[event.type].push(event);
    }

    return result;
  }

  /**
   * Format date for display
   */
  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format date for short display (no year)
   */
  formatDateShort(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Get the day of week (0 = Sunday, 6 = Saturday)
   */
  getDayOfWeek(isoDate: string): number {
    return new Date(isoDate).getDay();
  }

  /**
   * Check if date is first of month (for salary payments)
   */
  isFirstOfMonth(isoDate: string): boolean {
    return new Date(isoDate).getDate() === 1;
  }

  /**
   * Get the first day of next month
   */
  getFirstOfNextMonth(isoDate: string): string {
    const date = new Date(isoDate);
    date.setMonth(date.getMonth() + 1);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }
}

// Export singleton instance for convenience
export const timeProgression = new TimeProgression();
