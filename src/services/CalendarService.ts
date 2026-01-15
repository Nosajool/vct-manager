// CalendarService - Orchestrates time progression and calendar events
// Connects TimeProgression/EventScheduler engines with the Zustand store

import { useGameStore } from '../store';
import { timeProgression, eventScheduler } from '../engine/calendar';
import { economyService } from './EconomyService';
import { scrimService } from './ScrimService';
import { matchService } from './MatchService';
import type { CalendarEvent, MatchResult, MatchEventData } from '../types';

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
  simulatedMatches: MatchResult[]; // Matches that were auto-simulated
  autoSaveTriggered: boolean;
}

/**
 * CalendarService - Handles all time progression logic
 */
export class CalendarService {
  /**
   * Advance time by one day
   *
   * Game loop flow:
   * 1. User starts at beginning of Day X
   * 2. User does activities (training, roster changes, etc.)
   * 3. User clicks "Advance Day"
   * 4. TODAY's matches (Day X) are simulated
   * 5. User is now at beginning of Day X+1
   */
  advanceDay(): TimeAdvanceResult {
    const state = useGameStore.getState();
    const currentDate = state.calendar.currentDate;
    const newDate = timeProgression.addDays(currentDate, 1);

    // Get events for TODAY (current date) - these are what we simulate before advancing
    const eventsToday = timeProgression.getEventsBetween(
      currentDate,
      currentDate,
      state.calendar.scheduledEvents
    );

    const unprocessedEvents = eventsToday.filter((e) => !e.processed);
    const processedEvents: CalendarEvent[] = [];
    const skippedEvents: CalendarEvent[] = [];
    const simulatedMatches: MatchResult[] = [];

    // Process each event for TODAY
    for (const event of unprocessedEvents) {
      if (event.type === 'salary_payment') {
        // Auto-process salary payments
        this.processSalaryPayment(event);
        processedEvents.push(event);
      } else if (event.type === 'match') {
        // Simulate today's matches before advancing
        const result = this.simulateMatchEvent(event);
        if (result) {
          simulatedMatches.push(result);
          processedEvents.push(event);
        }
      } else if (timeProgression.isRequiredEventType(event.type)) {
        // Auto-mark as processed (informational)
        state.markEventProcessed(event.id);
        processedEvents.push(event);
      } else {
        // Skip optional events that weren't taken (training, scrims, etc.)
        state.markEventProcessed(event.id);
        skippedEvents.push(event);
      }
    }

    // Now advance the date to tomorrow
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
      needsAttention: [], // Nothing needs attention - we're now at start of new day
      simulatedMatches,
      autoSaveTriggered,
    };
  }

  /**
   * Advance time by one week
   *
   * Simulates all events from today through 6 days from now (7 days total),
   * then advances to day 8. Skips optional events that weren't taken.
   */
  advanceWeek(): TimeAdvanceResult {
    const state = useGameStore.getState();
    const currentDate = state.calendar.currentDate;
    // We process 7 days (today + 6 more), then land on day 8
    const lastDayToProcess = timeProgression.addDays(currentDate, 6);
    const newDate = timeProgression.addDays(currentDate, 7);

    // Get all events from today through the 7th day (inclusive)
    const eventsInWeek = timeProgression.getUnprocessedEventsBetween(
      currentDate,
      lastDayToProcess,
      state.calendar.scheduledEvents
    );

    const processedEvents: CalendarEvent[] = [];
    const skippedEvents: CalendarEvent[] = [];
    const simulatedMatches: MatchResult[] = [];

    // Process events (including auto-simulating matches)
    for (const event of eventsInWeek) {
      if (event.type === 'salary_payment') {
        this.processSalaryPayment(event);
        processedEvents.push(event);
      } else if (event.type === 'match') {
        // Auto-simulate matches
        const result = this.simulateMatchEvent(event);
        if (result) {
          simulatedMatches.push(result);
          processedEvents.push(event);
        }
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
      newDate,
      state.lastSaveDate
    );

    if (autoSaveTriggered) {
      state.setLastSaveDate(newDate);
    }

    return {
      success: true,
      daysAdvanced: 7,
      newDate,
      processedEvents,
      skippedEvents,
      needsAttention: [], // Nothing needs attention - we're at start of new day
      simulatedMatches,
      autoSaveTriggered,
    };
  }

  /**
   * Advance to the next match date (morning of match day)
   *
   * This allows the player to prepare on match day before simulating.
   * - If match is TODAY: do nothing (already at match day)
   * - If match is in FUTURE: simulate everything up to (but NOT including) match day,
   *   then land at the START of match day
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
        simulatedMatches: [],
        autoSaveTriggered: false,
      };
    }

    const daysUntilMatch = timeProgression.getDaysDifference(currentDate, nextMatch.date);

    // If match is today, we're already at match day - nothing to do
    if (daysUntilMatch === 0) {
      return {
        success: true,
        daysAdvanced: 0,
        newDate: currentDate,
        processedEvents: [],
        skippedEvents: [],
        needsAttention: [nextMatch], // Match needs attention today
        simulatedMatches: [],
        autoSaveTriggered: false,
      };
    }

    // Get events from today through the day BEFORE match day
    // We want to land at the START of match day, not simulate it
    const dayBeforeMatch = timeProgression.addDays(nextMatch.date, -1);
    const eventsToProcess = timeProgression.getUnprocessedEventsBetween(
      currentDate,
      dayBeforeMatch,
      state.calendar.scheduledEvents
    );

    const processedEvents: CalendarEvent[] = [];
    const skippedEvents: CalendarEvent[] = [];
    const simulatedMatches: MatchResult[] = [];

    // Process all events up to (but not including) match day
    for (const event of eventsToProcess) {
      if (event.type === 'salary_payment') {
        this.processSalaryPayment(event);
        processedEvents.push(event);
      } else if (event.type === 'match') {
        // Simulate matches that occur BEFORE our target match day
        const result = this.simulateMatchEvent(event);
        if (result) {
          simulatedMatches.push(result);
          processedEvents.push(event);
        }
      } else if (timeProgression.isRequiredEventType(event.type)) {
        state.markEventProcessed(event.id);
        processedEvents.push(event);
      } else {
        // Skip optional events
        state.markEventProcessed(event.id);
        skippedEvents.push(event);
      }
    }

    // Advance to match day morning
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
      daysAdvanced: daysUntilMatch,
      newDate: nextMatch.date,
      processedEvents,
      skippedEvents,
      needsAttention: [nextMatch], // Match is ready to be played today
      simulatedMatches,
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
   * Simulate a match from a calendar event
   * Returns the match result if successful, null otherwise
   */
  simulateMatchEvent(event: CalendarEvent): MatchResult | null {
    const state = useGameStore.getState();
    const data = event.data as MatchEventData;

    if (!data.matchId) {
      console.warn('Match event has no matchId:', event.id);
      state.markEventProcessed(event.id);
      return null;
    }

    // Try to simulate the match
    const result = matchService.simulateMatch(data.matchId);

    if (result) {
      // Mark calendar event as processed
      state.markEventProcessed(event.id);
      console.log(`Auto-simulated match: ${data.matchId}`);
    } else {
      console.warn(`Failed to simulate match: ${data.matchId}`);
    }

    return result;
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

