// CalendarService - Orchestrates time progression and calendar events
// Connects TimeProgression/EventScheduler engines with the Zustand store

import { useGameStore } from '../store';
import { timeProgression, eventScheduler } from '../engine/calendar';
import { economyService } from './EconomyService';
import { scrimService } from './ScrimService';
import type { CalendarEvent } from '../types';

/**
 * Result of advancing time
 */
export interface TimeAdvanceResult {
  success: boolean;
  daysAdvanced: number;
  newDate: string;
  processedEvents: CalendarEvent[];
  skippedEvents: CalendarEvent[];
  needsAttention: CalendarEvent[]; // Events that require player action (matches)
  autoSaveTriggered: boolean;
}

/**
 * CalendarService - Handles all time progression logic
 */
export class CalendarService {
  /**
   * Advance time by one day
   * - Processes required events automatically (salary payments)
   * - Returns events that need attention (matches, training options)
   */
  advanceDay(): TimeAdvanceResult {
    const state = useGameStore.getState();
    const currentDate = state.calendar.currentDate;
    const newDate = timeProgression.addDays(currentDate, 1);

    // Get events that occurred on the new date
    const eventsOnNewDate = timeProgression.getEventsBetween(
      newDate,
      newDate,
      state.calendar.scheduledEvents
    );

    const unprocessedEvents = eventsOnNewDate.filter((e) => !e.processed);
    const processedEvents: CalendarEvent[] = [];
    const skippedEvents: CalendarEvent[] = [];
    const needsAttention: CalendarEvent[] = [];

    // Process each event based on type
    for (const event of unprocessedEvents) {
      if (event.type === 'salary_payment') {
        // Auto-process salary payments
        this.processSalaryPayment(event);
        processedEvents.push(event);
      } else if (event.type === 'match') {
        // Matches need player attention
        needsAttention.push(event);
      } else if (
        event.type === 'training_available' ||
        event.type === 'scrim_available' ||
        event.type === 'rest_day'
      ) {
        // Optional events - player can choose to act or skip
        needsAttention.push(event);
      } else {
        // Other required events (tournament markers, etc.)
        if (timeProgression.isRequiredEventType(event.type)) {
          // Auto-mark as processed (informational)
          state.markEventProcessed(event.id);
          processedEvents.push(event);
        } else {
          skippedEvents.push(event);
        }
      }
    }

    // Advance the date
    state.advanceDay();

    // Check if auto-save should trigger
    const autoSaveTriggered = timeProgression.shouldAutoSave(
      newDate,
      state.lastSaveDate
    );

    if (autoSaveTriggered) {
      state.setLastSaveDate(newDate);
    }

    return {
      success: true,
      daysAdvanced: 1,
      newDate,
      processedEvents,
      skippedEvents,
      needsAttention,
      autoSaveTriggered,
    };
  }

  /**
   * Advance time by one week
   * - Auto-processes all required events
   * - Skips optional events (training days not taken)
   */
  advanceWeek(): TimeAdvanceResult {
    const state = useGameStore.getState();
    const currentDate = state.calendar.currentDate;
    const endDate = timeProgression.addDays(currentDate, 7);

    // Get all events in the week
    const eventsInWeek = timeProgression.getUnprocessedEventsBetween(
      currentDate,
      endDate,
      state.calendar.scheduledEvents
    );

    const processedEvents: CalendarEvent[] = [];
    const skippedEvents: CalendarEvent[] = [];
    const needsAttention: CalendarEvent[] = [];

    // Check for matches first - they require attention
    const matches = eventsInWeek.filter((e) => e.type === 'match');
    if (matches.length > 0) {
      // Can't skip a week with matches - needs attention
      needsAttention.push(...matches);
      return {
        success: false,
        daysAdvanced: 0,
        newDate: currentDate,
        processedEvents: [],
        skippedEvents: [],
        needsAttention,
        autoSaveTriggered: false,
      };
    }

    // Process events
    for (const event of eventsInWeek) {
      if (event.type === 'salary_payment') {
        this.processSalaryPayment(event);
        processedEvents.push(event);
      } else if (timeProgression.isRequiredEventType(event.type)) {
        state.markEventProcessed(event.id);
        processedEvents.push(event);
      } else {
        // Skip optional events
        state.markEventProcessed(event.id);
        skippedEvents.push(event);
      }
    }

    // Advance the date
    state.advanceWeek();

    // Apply weekly map decay for player's team (Phase 6 - Scrim System)
    scrimService.applyWeeklyMapDecay();

    // Check auto-save
    const autoSaveTriggered = timeProgression.shouldAutoSave(
      endDate,
      state.lastSaveDate
    );

    if (autoSaveTriggered) {
      state.setLastSaveDate(endDate);
    }

    return {
      success: true,
      daysAdvanced: 7,
      newDate: endDate,
      processedEvents,
      skippedEvents,
      needsAttention,
      autoSaveTriggered,
    };
  }

  /**
   * Advance to the next match date
   * - Processes all events between now and the match
   * - Stops at the match day (match needs player attention)
   */
  advanceToNextMatch(): TimeAdvanceResult {
    const state = useGameStore.getState();
    const currentDate = state.calendar.currentDate;
    const nextMatch = state.getNextMatchEvent();

    if (!nextMatch) {
      // No upcoming matches
      return {
        success: false,
        daysAdvanced: 0,
        newDate: currentDate,
        processedEvents: [],
        skippedEvents: [],
        needsAttention: [],
        autoSaveTriggered: false,
      };
    }

    // Check if match is today
    if (timeProgression.isSameDay(currentDate, nextMatch.date)) {
      return {
        success: true,
        daysAdvanced: 0,
        newDate: currentDate,
        processedEvents: [],
        skippedEvents: [],
        needsAttention: [nextMatch],
        autoSaveTriggered: false,
      };
    }

    // Get all events between now and the match
    const eventsBeforeMatch = timeProgression.getUnprocessedEventsBetween(
      currentDate,
      nextMatch.date,
      state.calendar.scheduledEvents
    );

    const processedEvents: CalendarEvent[] = [];
    const skippedEvents: CalendarEvent[] = [];

    // Process events (excluding the match itself)
    for (const event of eventsBeforeMatch) {
      if (event.id === nextMatch.id) continue; // Skip the match

      if (event.type === 'salary_payment') {
        this.processSalaryPayment(event);
        processedEvents.push(event);
      } else if (timeProgression.isRequiredEventType(event.type)) {
        state.markEventProcessed(event.id);
        processedEvents.push(event);
      } else {
        // Skip optional events
        state.markEventProcessed(event.id);
        skippedEvents.push(event);
      }
    }

    // Advance to match date
    const daysAdvanced = timeProgression.getDaysDifference(currentDate, nextMatch.date);
    state.advanceToDate(nextMatch.date);

    // Check auto-save
    const autoSaveTriggered = timeProgression.shouldAutoSave(
      nextMatch.date,
      state.lastSaveDate
    );

    if (autoSaveTriggered) {
      state.setLastSaveDate(nextMatch.date);
    }

    return {
      success: true,
      daysAdvanced,
      newDate: nextMatch.date,
      processedEvents,
      skippedEvents,
      needsAttention: [nextMatch],
      autoSaveTriggered,
    };
  }

  /**
   * Process a salary payment event
   * Uses EconomyService to process full monthly finances
   */
  processSalaryPayment(event: CalendarEvent): void {
    const state = useGameStore.getState();
    const teams = Object.values(state.teams);

    // Process monthly finances for all teams
    for (const team of teams) {
      try {
        const result = economyService.processMonthlyFinances(team.id);

        // Log warnings for player's team
        if (team.id === state.playerTeamId && result.warnings.length > 0) {
          console.warn('Financial warnings:', result.warnings);
          // TODO: Show notifications to player
        }
      } catch (error) {
        console.error(`Error processing finances for team ${team.id}:`, error);
      }
    }

    // Mark event as processed
    state.markEventProcessed(event.id);
  }

  /**
   * Get today's activities from the calendar
   */
  getTodaysActivities(): CalendarEvent[] {
    return useGameStore.getState().getTodaysActivities();
  }

  /**
   * Get upcoming events
   */
  getUpcomingEvents(limit: number = 10): CalendarEvent[] {
    return useGameStore.getState().getUpcomingEvents(limit);
  }

  /**
   * Get next match
   */
  getNextMatch(): CalendarEvent | undefined {
    return useGameStore.getState().getNextMatchEvent();
  }

  /**
   * Get current date
   */
  getCurrentDate(): string {
    return useGameStore.getState().calendar.currentDate;
  }

  /**
   * Get formatted current date
   */
  getFormattedDate(): string {
    return timeProgression.formatDate(this.getCurrentDate());
  }

  /**
   * Get days until next match
   */
  getDaysUntilNextMatch(): number | null {
    const nextMatch = this.getNextMatch();
    if (!nextMatch) return null;

    return timeProgression.getDaysDifference(
      this.getCurrentDate(),
      nextMatch.date
    );
  }

  /**
   * Generate schedule for the season
   * Called during game initialization
   */
  generateSeasonSchedule(playerTeamId: string): CalendarEvent[] {
    const state = useGameStore.getState();
    const teams = Object.values(state.teams);
    const startDate = '2026-01-01T00:00:00.000Z';

    const events = eventScheduler.generateInitialSchedule(
      playerTeamId,
      teams,
      startDate
    );

    // Add events to the calendar
    state.addCalendarEvents(events);

    return events;
  }

  /**
   * Clear processed events from the calendar (cleanup)
   */
  cleanupProcessedEvents(): void {
    useGameStore.getState().clearProcessedEvents();
  }

  /**
   * Mark a specific event as processed
   */
  markEventProcessed(eventId: string): void {
    useGameStore.getState().markEventProcessed(eventId);
  }

  /**
   * Get event by ID
   */
  getEventById(eventId: string): CalendarEvent | undefined {
    const events = useGameStore.getState().calendar.scheduledEvents;
    return events.find((e) => e.id === eventId);
  }

  /**
   * Check if there's a match today
   */
  hasMatchToday(): boolean {
    const activities = this.getTodaysActivities();
    return activities.some((a) => a.type === 'match');
  }

  /**
   * Get human-readable description of next match
   */
  getNextMatchDescription(): string | null {
    const nextMatch = this.getNextMatch();
    if (!nextMatch) return null;

    return timeProgression.getEventDescription(nextMatch);
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
