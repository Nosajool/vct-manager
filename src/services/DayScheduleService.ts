import { useGameStore } from '../store';
import { AvailabilityRulesEngine } from '../engine/scheduling/AvailabilityRulesEngine';
import { MatchDayBlocker } from '../engine/scheduling/rules/MatchDayBlocker';
import { FeatureGateRule } from '../engine/scheduling/rules/FeatureGateRule';
import { SeasonPhaseFilter } from '../engine/scheduling/rules/SeasonPhaseFilter';
import { FeatureGateService } from './FeatureGateService';
import type { DaySchedule, DayContext } from '../types/scheduling';
import type { CalendarEvent, CalendarEventType, SchedulableActivityType } from '../types/calendar';

/**
 * DayScheduleService - Single scheduling authority for the game
 *
 * This service computes what activities are available on any given day
 * and provides methods to schedule/unschedule activities.
 *
 * Architecture:
 * - Uses AvailabilityRulesEngine (pure) to determine what's allowed
 * - Integrates with store for calendar events and game state
 * - Creates scheduled_training/scheduled_scrim events (not training_available)
 */
export class DayScheduleService {
  private rulesEngine: AvailabilityRulesEngine;
  private featureGateService: FeatureGateService;

  constructor() {
    this.featureGateService = new FeatureGateService();
    this.rulesEngine = new AvailabilityRulesEngine();

    // Register built-in rules
    this.rulesEngine.registerRule(new MatchDayBlocker());
    this.rulesEngine.registerRule(new FeatureGateRule(this.featureGateService));
    this.rulesEngine.registerRule(new SeasonPhaseFilter());
  }

  /**
   * Get the computed schedule for a specific day
   *
   * @param date - ISO date string
   * @returns DaySchedule with available activities and blockers
   */
  getDaySchedule(date: string): DaySchedule {
    const state = useGameStore.getState();
    const { calendar, playerTeamId } = state;

    // Get all events on this date
    const eventsOnDate = state.getEventsOnDate(date);

    // Build context for rules engine
    const context: DayContext = {
      date,
      seasonPhase: calendar.currentPhase,
      eventsOnDate,
      playerTeamId: playerTeamId || '',
    };

    // Evaluate rules
    const { availableActivityTypes, blockers } = this.rulesEngine.evaluateDay(context);

    // Categorize events
    const fixedEvents: CalendarEvent[] = [];
    const scheduledActivities: CalendarEvent[] = [];

    for (const event of eventsOnDate) {
      if (this.isActivityEvent(event.type)) {
        scheduledActivities.push(event);
      } else {
        fixedEvents.push(event);
      }
    }

    // Determine if this is a match day
    const isMatchDay = eventsOnDate.some(e => {
      if (e.type !== 'match') return false;
      const data = e.data as any;
      return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId;
    });

    const isPlaceholderMatchDay = eventsOnDate.some(e => {
      if (e.type !== 'placeholder_match') return false;
      const data = e.data as any;
      return data.resolvedTeamAId === playerTeamId || data.resolvedTeamBId === playerTeamId;
    });

    return {
      date,
      fixedEvents,
      scheduledActivities,
      availableActivityTypes,
      blockers,
      isMatchDay,
      isPlaceholderMatchDay,
    };
  }

  /**
   * Schedule an activity on a specific date
   *
   * @param date - ISO date string
   * @param activityType - Type of activity to schedule
   * @returns The created calendar event
   * @throws Error if activity type is not schedulable or blocked
   */
  scheduleActivity(date: string, activityType: SchedulableActivityType): CalendarEvent {
    const daySchedule = this.getDaySchedule(date);

    // Check if this activity type is available
    if (!daySchedule.availableActivityTypes.includes(activityType)) {
      const blocker = daySchedule.blockers.find(b =>
        b.blockedActivityTypes.includes(activityType)
      );
      const reason = blocker?.reason || 'Activity not available on this day';
      throw new Error(`Cannot schedule ${activityType}: ${reason}`);
    }

    // Map activity type to calendar event type
    const eventType = this.activityTypeToEventType(activityType);

    // Create the event
    const event: CalendarEvent = {
      id: this.generateEventId(),
      date,
      type: eventType,
      data: {
        activityType,
        scheduledAt: new Date().toISOString(),
      },
      processed: false,
      required: false,
      lifecycleState: 'needs_setup', // User needs to configure it
    };

    // Add to store
    useGameStore.getState().addCalendarEvent(event);

    return event;
  }

  /**
   * Unschedule (cancel) a future activity
   *
   * @param eventId - ID of the event to cancel
   * @throws Error if event is locked or already processed
   */
  unscheduleActivity(eventId: string): void {
    const state = useGameStore.getState();
    const event = state.calendar.scheduledEvents.find(e => e.id === eventId);

    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    // Can only unschedule activity events
    if (!this.isActivityEvent(event.type)) {
      throw new Error('Can only unschedule activity events');
    }

    // Can't unschedule locked or completed events
    if (event.lifecycleState === 'locked' || event.lifecycleState === 'completed') {
      throw new Error(`Cannot unschedule ${event.lifecycleState} event`);
    }

    // Remove from store
    state.removeCalendarEvent(eventId);
  }

  /**
   * Get schedule for a week starting from a specific date
   *
   * @param startDate - ISO date string for the start of the week
   * @returns Array of 7 DaySchedule objects
   */
  getWeekSchedule(startDate: string): DaySchedule[] {
    const schedules: DaySchedule[] = [];

    for (let i = 0; i < 7; i++) {
      const date = this.addDays(startDate, i);
      schedules.push(this.getDaySchedule(date));
    }

    return schedules;
  }

  // Helper methods

  private isActivityEvent(type: CalendarEventType): boolean {
    return type === 'scheduled_training' ||
           type === 'scheduled_scrim' ||
           type === 'team_activity';
  }

  private activityTypeToEventType(activityType: SchedulableActivityType): CalendarEventType {
    switch (activityType) {
      case 'training':
        return 'scheduled_training';
      case 'scrim':
        return 'scheduled_scrim';
      case 'rest':
      case 'social_media':
      case 'team_offsite':
      case 'bootcamp':
        return 'team_activity';
      default:
        throw new Error(`Unknown activity type: ${activityType}`);
    }
  }

  private generateEventId(): string {
    return `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private addDays(isoDate: string, days: number): string {
    const date = new Date(isoDate);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }
}
