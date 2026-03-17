// DayPlanService - Unified backend for Today's Plan and Week Planner
//
// Wraps DayScheduleService and ports alert/objective logic from ObjectivesService
// to provide a single source of truth for daily planning UI.

import { useGameStore } from '../store';
import { DayScheduleService } from './DayScheduleService';
import { featureGateService } from './FeatureGateService';
import { lineupOptimizer } from '../engine/team/LineupOptimizer';
import type { DayPlan, DayPlanItem, ActivityState } from '../types/dayPlan';
import type { CalendarEvent, SchedulableActivityType } from '../types/calendar';
import type { BootcampDayEventData } from './BootcampService';

/**
 * Priority levels for day plan items
 */
const PRIORITY = {
  CRITICAL: 100,  // Match day prep
  HIGH: 80,       // Urgent alerts
  MEDIUM: 60,     // Training/Scrims available
  LOW: 40,        // Secondary tasks
  INFO: 20,       // Informational items
} as const;

/**
 * DayPlanService - Provides unified day planning data for UI components
 *
 * Architecture:
 * - Wraps DayScheduleService for scheduling rules and calendar integration
 * - Ports alert/info logic from ObjectivesService
 * - Returns DayPlan objects with categorized, prioritized items
 */
export class DayPlanService {
  private dayScheduleService: DayScheduleService;

  constructor() {
    this.dayScheduleService = new DayScheduleService();
  }

  /**
   * Get complete day plan for a specific date
   *
   * @param date - ISO date string (YYYY-MM-DD)
   * @returns DayPlan with all items sorted by priority
   */
  getDayPlan(date: string): DayPlan {
    const state = useGameStore.getState();
    const daySchedule = this.dayScheduleService.getDaySchedule(date);
    const items: DayPlanItem[] = [];

    // 1. Convert matches to items
    items.push(...this.getMatchItems(daySchedule.fixedEvents));

    // 1b. Bootcamp progress item (replaces generic team_activity display for bootcamp days)
    const bootcampItem = this.getBootcampItem(date);
    if (bootcampItem) items.push(bootcampItem);

    // 1c. Downtime activity items (watch_party, streamer_collab, etc.)
    items.push(...this.getDowntimeActivityItems(date, daySchedule.scheduledActivities));

    // 2. Convert scheduled activities to items (bootcamp team_activity events are skipped here)
    items.push(...this.getScheduledActivityItems(daySchedule.scheduledActivities));

    // 3. Add available-but-not-scheduled activities
    items.push(...this.getAvailableActivityItems(
      daySchedule.availableActivityTypes,
      daySchedule.scheduledActivities,
      date
    ));

    // 4. Add unavailable activities (blocked by rules)
    items.push(...this.getUnavailableActivityItems(daySchedule.blockers, date));

    // Only add alerts and info for today
    const isToday = date === state.calendar.currentDate;
    if (isToday) {
      // 5. Generate alert items
      items.push(...this.getAlertItems());

      // 6. Generate info items
      items.push(...this.getInfoItems());
    }

    // Sort by priority (highest first)
    items.sort((a, b) => b.priority - a.priority);

    return {
      date,
      items,
      isMatchDay: daySchedule.isMatchDay,
      isPlaceholderMatchDay: daySchedule.isPlaceholderMatchDay,
      isToday,
    };
  }

  /**
   * Schedule an activity on a specific date
   * Delegates to DayScheduleService
   */
  scheduleActivity(date: string, activityType: SchedulableActivityType): CalendarEvent {
    return this.dayScheduleService.scheduleActivity(date, activityType);
  }

  /**
   * Unschedule (cancel) a future activity
   * Delegates to DayScheduleService
   */
  unscheduleActivity(eventId: string): void {
    this.dayScheduleService.unscheduleActivity(eventId);
  }

  // ============================================================================
  // Item Generation Methods
  // ============================================================================

  /**
   * Convert match events to DayPlanItems
   */
  private getMatchItems(fixedEvents: CalendarEvent[]): DayPlanItem[] {
    const state = useGameStore.getState();
    const items: DayPlanItem[] = [];

    for (const event of fixedEvents) {
      if (event.type === 'match' || event.type === 'placeholder_match') {
        const matchData = event.data as any;
        const isToday = event.date === state.calendar.currentDate;

        // Filter out matches that don't involve the player's team
        if (!state.playerTeamId) continue;

        // Skip regular matches not involving player's team
        if (event.type === 'match') {
          const isPlayerMatch =
            matchData.homeTeamId === state.playerTeamId ||
            matchData.awayTeamId === state.playerTeamId;
          if (!isPlayerMatch) continue;
        }

        // Skip placeholder matches not involving player's team
        if (event.type === 'placeholder_match') {
          const isPlayerMatch =
            matchData.resolvedTeamAId === state.playerTeamId ||
            matchData.resolvedTeamBId === state.playerTeamId;
          if (!isPlayerMatch) continue;
        }

        // Determine match participants
        let homeTeamName = 'TBD';
        let awayTeamName = 'TBD';

        if (event.type === 'match') {
          const homeTeam = state.teams[matchData.homeTeamId];
          const awayTeam = state.teams[matchData.awayTeamId];
          homeTeamName = homeTeam?.name || 'Unknown';
          awayTeamName = awayTeam?.name || 'Unknown';
        } else if (event.type === 'placeholder_match') {
          const teamA = matchData.resolvedTeamAId && state.teams[matchData.resolvedTeamAId];
          const teamB = matchData.resolvedTeamBId && state.teams[matchData.resolvedTeamBId];
          homeTeamName = teamA?.name || matchData.teamAPlaceholder || 'TBD';
          awayTeamName = teamB?.name || matchData.teamBPlaceholder || 'TBD';
        }

        const label = isToday ? 'Match Today' : `${homeTeamName} vs ${awayTeamName}`;
        const description = isToday
          ? `${homeTeamName} vs ${awayTeamName}`
          : 'Upcoming match';

        items.push({
          id: `match-${event.id}`,
          category: 'match',
          label,
          description,
          priority: isToday ? PRIORITY.CRITICAL : PRIORITY.MEDIUM,
          completed: event.processed,
          matchData: {
            homeTeamName,
            awayTeamName,
            isToday,
          },
          action: {
            view: 'today',
            data: { matchId: matchData.matchId || event.id },
          },
        });
      }
    }

    return items;
  }

  /**
   * Convert scheduled activities to DayPlanItems with lifecycle state
   */
  private getScheduledActivityItems(
    scheduledActivities: CalendarEvent[]
  ): DayPlanItem[] {
    const state = useGameStore.getState();
    const items: DayPlanItem[] = [];

    for (const event of scheduledActivities) {
      const activityType = this.getActivityTypeFromEvent(event);
      if (!activityType) continue;

      // Determine activity state
      const activityState = this.getActivityState(event);
      // Skip if activity was cancelled (shouldn't happen but be safe)
      if (event.lifecycleState === 'cancelled') continue;

      // Get activity config to check completion status
      const config = state.getActivityConfigByEventId?.(event.id);
      const isConfigured = !!(config && config.status !== 'needs_setup');

      // Determine label and description
      const label = this.getActivityLabel(activityType);
      const description = this.getActivityDescription(activityType, activityState);

      // Type-safe access to event.data
      const eventData = event.data as { activityType?: SchedulableActivityType } | undefined;

      items.push({
        id: `activity-${event.id}`,
        category: 'activity',
        label,
        description,
        priority: PRIORITY.MEDIUM,
        completed: isConfigured,
        activityType,
        activityState,
        calendarEventId: event.id,
        schedulableType: eventData?.activityType,
        action: {
          view: 'team',
          openModal: activityType,
          eventId: event.id,
        },
      });
    }

    return items;
  }

  /**
   * Get available-but-not-scheduled activity items
   */
  private getAvailableActivityItems(
    availableTypes: SchedulableActivityType[],
    scheduledActivities: CalendarEvent[],
    date: string
  ): DayPlanItem[] {
    const items: DayPlanItem[] = [];

    // Get already scheduled activity types
    const scheduledTypes = new Set(
      scheduledActivities
        .map(e => {
          const eventData = e.data as { activityType?: SchedulableActivityType } | undefined;
          return eventData?.activityType;
        })
        .filter(Boolean) as SchedulableActivityType[]
    );

    // Downtime activity types that need a modal
    const downtimeModalTypes = new Set<SchedulableActivityType>(['watch_party']);
    // Downtime activity types that are one-click (no modal)
    const downtimeOneClickTypes = new Set<SchedulableActivityType>([
      'fan_meetup', 'streamer_collab', 'youtube_documentary', 'sponsored_content',
    ]);

    const downtimeLabels: Partial<Record<SchedulableActivityType, string>> = {
      watch_party: 'Watch Party',
      fan_meetup: 'Fan Meetup',
      streamer_collab: 'Streamer Collab',
      youtube_documentary: 'YouTube Documentary',
      sponsored_content: 'Sponsored Content',
      regional_bootcamp: 'Regional Bootcamp',
    };

    // Add items for available but not scheduled types
    for (const activityType of availableTypes) {
      if (scheduledTypes.has(activityType)) continue;

      const activityCategory = this.getActivityCategory(activityType);
      if (!activityCategory) continue;

      const downtimeLabel = downtimeLabels[activityType];
      const isDowntime = downtimeLabel !== undefined;

      if (isDowntime) {
        // Downtime activity
        if (downtimeModalTypes.has(activityType)) {
          // Needs a modal after scheduling
          items.push({
            id: `available-${activityType}-${date}`,
            category: 'activity',
            label: `${downtimeLabel} Available`,
            description: `Schedule a ${downtimeLabel} for your team`,
            priority: PRIORITY.LOW,
            completed: false,
            activityType: activityCategory,
            activityState: 'available',
            schedulableType: activityType,
            action: {
              openModal: activityType as 'watch_party',
              scheduleData: { date, activityType },
            },
          });
        } else if (downtimeOneClickTypes.has(activityType)) {
          // One-click: schedule immediately, no modal
          items.push({
            id: `available-${activityType}-${date}`,
            category: 'activity',
            label: `${downtimeLabel} Available`,
            description: `Schedule a ${downtimeLabel} for your team`,
            priority: PRIORITY.LOW,
            completed: false,
            activityType: activityCategory,
            activityState: 'available',
            schedulableType: activityType,
            action: {
              scheduleData: { date, activityType },
            },
          });
        }
      } else {
        items.push({
          id: `available-${activityType}-${date}`,
          category: 'activity',
          label: `${this.getActivityLabel(activityCategory)} Available`,
          description: `Schedule ${activityType} for this day`,
          priority: PRIORITY.LOW,
          completed: false,
          activityType: activityCategory,
          activityState: 'available',
          schedulableType: activityType,
          action: {
            view: 'team',
            openModal: activityCategory,
            scheduleData: {
              date: date,
              activityType: activityType,
            }
          }
        });
      }
    }

    return items;
  }

  /**
   * Get unavailable activity items (blocked by rules)
   */
  private getUnavailableActivityItems(
    blockers: Array<{ reason: string; blockedActivityTypes: SchedulableActivityType[] }>,
    date: string
  ): DayPlanItem[] {
    const items: DayPlanItem[] = [];

    // Collect all blocked types
    const blockedTypes = new Set<SchedulableActivityType>();
    for (const blocker of blockers) {
      for (const type of blocker.blockedActivityTypes) {
        blockedTypes.add(type);
      }
    }

    // Only show unavailable items for major activity types
    const majorTypes: SchedulableActivityType[] = ['training', 'scrim'];
    for (const activityType of majorTypes) {
      if (blockedTypes.has(activityType)) {
        const activityCategory = this.getActivityCategory(activityType);
        if (!activityCategory) continue;

        const blocker = blockers.find(b => b.blockedActivityTypes.includes(activityType));

        items.push({
          id: `unavailable-${activityType}-${date}`,
          category: 'activity',
          label: `${this.getActivityLabel(activityCategory)} Unavailable`,
          description: blocker?.reason || 'Not available on this day',
          priority: PRIORITY.INFO,
          completed: false,
          activityType: activityCategory,
          activityState: 'unavailable',
          schedulableType: activityType,
        });
      }
    }

    return items;
  }

  /**
   * Generate alert items from game state
   * Ported from ObjectivesService
   */
  private getAlertItems(): DayPlanItem[] {
    const state = useGameStore.getState();
    const alerts: DayPlanItem[] = [];

    if (!state.playerTeamId) return alerts;

    const team = state.teams[state.playerTeamId];
    if (!team) return alerts;

    // Low funds alert
    if (team.finances.balance < 50000) {
      alerts.push({
        id: 'alert-low-funds',
        category: 'alert',
        label: 'Low Funds',
        description: `Team balance is critically low ($${Math.floor(team.finances.balance).toLocaleString()}). Review finances and consider cuts.`,
        priority: PRIORITY.HIGH,
        completed: false,
        severity: 'critical',
        action: { view: 'finances' },
      });
    }

    const players = [...team.playerIds, ...team.reservePlayerIds]
      .map(id => state.players[id])
      .filter(Boolean);

    // Expiring contracts alert
    const currentDate = new Date(state.calendar.currentDate);
    const expiringPlayers = players.filter(p => {
      if (!p.contract?.endDate) return false;
      const endDate = new Date(p.contract.endDate);
      const daysUntilExpiry = Math.floor((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });

    if (expiringPlayers.length > 0) {
      alerts.push({
        id: 'alert-expiring-contracts',
        category: 'alert',
        label: 'Contracts Expiring',
        description: `${expiringPlayers.length} player contract${expiringPlayers.length > 1 ? 's' : ''} expiring soon. Consider renewals.`,
        priority: PRIORITY.HIGH,
        completed: false,
        severity: 'warning',
        action: { view: 'team' },
      });
    }

    // Only return the most urgent alert
    return alerts.slice(0, 1);
  }

  /**
   * Generate info items from game state
   * Ported from ObjectivesService
   */
  private getInfoItems(): DayPlanItem[] {
    const state = useGameStore.getState();
    const items: DayPlanItem[] = [];

    if (!state.playerTeamId) return items;

    const team = state.teams[state.playerTeamId];
    if (!team) return items;

    // Review tournament standings
    const activeTournament = Object.values(state.tournaments).find(
      t => t.status === 'in_progress' &&
      (t.teamIds?.includes(state.playerTeamId!) || false)
    );

    if (activeTournament) {
      items.push({
        id: 'info-review-standings',
        category: 'info',
        label: 'Review Bracket',
        description: `Check your position in ${activeTournament.name || 'the tournament'}.`,
        priority: PRIORITY.LOW,
        completed: false,
        severity: 'info',
        action: {
          view: 'tournament',
          data: { tournamentId: activeTournament.id },
        },
      });
    }

    // Lineup optimization check - only if team has reserves and feature is unlocked
    if (team.reservePlayerIds && team.reservePlayerIds.length > 0
        && featureGateService.isFeatureUnlocked('roster_optimization')) {
      // Get all players (active + reserves)
      const allPlayerIds = [...team.playerIds, ...team.reservePlayerIds];
      const allPlayers = allPlayerIds
        .map(id => state.players[id])
        .filter(p => p !== undefined);

      // Run lineup optimizer
      const result = lineupOptimizer.findOptimalLineup(team, allPlayers);

      // Show notification if improvement > 3%
      if (result.improvementPercent > 3) {
        items.push({
          id: 'info-optimal-lineup',
          category: 'info',
          label: 'Optimize Lineup',
          description: `Lineup improvements available (+${result.improvementPercent.toFixed(1)}% team strength). Consider roster adjustments.`,
          priority: PRIORITY.LOW,
          completed: false,
          severity: 'info',
          action: { view: 'team' },
        });
      }
    }

    // Review strategy info (feature gated)
    if (featureGateService.isFeatureUnlocked('strategy')) {
      items.push({
        id: 'info-review-strategy',
        category: 'info',
        label: 'Review Strategy',
        description: 'Review and adjust your team strategy and agent compositions.',
        priority: PRIORITY.INFO,
        completed: false,
        severity: 'info',
        activityType: 'strategy',
        action: { view: 'team', data: { tab: 'strategy' } },
      });
    }

    // Return top 2 info items
    return items.slice(0, 2);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Determine activity state from calendar event and config
   */
  private getActivityState(event: CalendarEvent): ActivityState {
    const state = useGameStore.getState();
    const config = state.getActivityConfigByEventId?.(event.id);

    // Check lifecycle state from event or config
    const lifecycleState = event.lifecycleState || config?.status;

    switch (lifecycleState) {
      case 'locked':
      case 'completed':
        return 'locked';
      case 'cancelled':
        return 'locked'; // Treat as locked for display purposes
      case 'configured':
        return 'configured';
      case 'needs_setup':
      default:
        return 'needs_setup';
    }
  }

  /**
   * Get activity type (training/scrim/strategy) from calendar event.
   * Returns null for team_activity events — they are handled by getBootcampItem or future resolvers.
   */
  private getActivityTypeFromEvent(event: CalendarEvent): 'training' | 'scrim' | 'strategy' | null {
    switch (event.type) {
      case 'scheduled_training':
        return 'training';
      case 'scheduled_scrim':
        return 'scrim';
      case 'team_activity':
        // Bootcamp days and other downtime activities are rendered via dedicated item methods
        return null;
      default:
        return null;
    }
  }

  /**
   * Generate a bootcamp progress item for days where an active bootcamp is running.
   * Shows "Day X/7: Bootcamp in [Region] — Focus: [stat focus]"
   */
  private getBootcampItem(date: string): DayPlanItem | null {
    const state = useGameStore.getState();
    const { activeBootcamp } = state;
    if (!activeBootcamp || activeBootcamp.status !== 'active') return null;

    // Find the bootcamp day event for this date
    const event = state.calendar.scheduledEvents.find(e => {
      if (e.type !== 'team_activity') return false;
      const d = e.data as Partial<BootcampDayEventData>;
      return (
        d.activityType === 'bootcamp_day' &&
        d.bootcampId === activeBootcamp.id &&
        new Date(e.date).toDateString() === new Date(date).toDateString()
      );
    });
    if (!event) return null;

    const data = event.data as BootcampDayEventData;
    const regionLabels: Record<string, string> = {
      APAC: 'Korea (APAC)',
      EU: 'Europe',
      Americas: 'Americas',
    };
    const focusLabels: Record<string, string> = {
      APAC: 'Mechanics & Clutch',
      EU: 'IGL & Mental',
      Americas: 'Entry & Lurking',
    };

    // Build cumulative gains string
    const cumulative = activeBootcamp.cumulativeStatGains;
    const gainEntries = Object.entries(cumulative)
      .filter(([, v]) => v !== 0)
      .map(([k, v]) => `${v > 0 ? '+' : ''}${v.toFixed(1)} ${k.charAt(0).toUpperCase() + k.slice(1)}`);
    const gainsStr = gainEntries.length > 0
      ? `Gains so far: ${gainEntries.join(', ')}`
      : `Focus: ${focusLabels[data.region] ?? data.region}`;

    return {
      id: `bootcamp-day-${event.id}`,
      category: 'activity',
      label: `Day ${data.bootcampDay}/7: Bootcamp in ${regionLabels[data.region] ?? data.region}`,
      description: `${gainsStr} — auto-resolves at end of day`,
      priority: PRIORITY.MEDIUM,
      completed: event.processed,
      activityType: 'training', // closest visual category
      activityState: 'locked',
      calendarEventId: event.id,
      action: {
        cancelBootcamp: true,
      },
    };
  }

  /**
   * Generate DayPlanItems for the 5 single-day downtime activities scheduled on a given date.
   */
  private getDowntimeActivityItems(_date: string, scheduledActivities: CalendarEvent[]): DayPlanItem[] {
    const items: DayPlanItem[] = [];

    const downtimeTypeLabels: Record<string, string> = {
      watch_party: 'Watch Party',
      streamer_collab: 'Streamer Collab',
      youtube_documentary: 'YouTube Documentary',
      fan_meetup: 'Fan Meetup',
      sponsored_content: 'Sponsored Content',
    };

    for (const event of scheduledActivities) {
      if (event.type !== 'team_activity') continue;

      const data = event.data as { activityType?: string } | undefined;
      const activityType = data?.activityType;
      if (!activityType || !(activityType in downtimeTypeLabels)) continue;

      const label = downtimeTypeLabels[activityType];

      items.push({
        id: `downtime-${activityType}-${event.id}`,
        category: 'activity',
        label,
        description: `${label} — auto-resolves at end of day`,
        priority: PRIORITY.MEDIUM,
        completed: event.processed,
        activityType: 'training', // closest visual category
        activityState: 'locked',
        calendarEventId: event.id,
      });
    }

    return items;
  }

  /**
   * Get activity category from schedulable activity type
   */
  private getActivityCategory(schedulableType: SchedulableActivityType): 'training' | 'scrim' | 'strategy' | null {
    switch (schedulableType) {
      case 'training':
        return 'training';
      case 'scrim':
        return 'scrim';
      case 'rest':
      case 'social_media':
      case 'team_offsite':
      case 'bootcamp':
        return null; // These don't map to our activity categories
      // Downtime activities use 'training' as visual category
      case 'watch_party':
      case 'fan_meetup':
      case 'streamer_collab':
      case 'youtube_documentary':
      case 'sponsored_content':
      case 'regional_bootcamp':
        return 'training';
      default:
        return null;
    }
  }

  /**
   * Get display label for activity type
   */
  private getActivityLabel(activityType: 'training' | 'scrim' | 'strategy'): string {
    switch (activityType) {
      case 'training':
        return 'Training';
      case 'scrim':
        return 'Scrim';
      case 'strategy':
        return 'Strategy';
    }
  }

  /**
   * Get description for activity based on type and state
   */
  private getActivityDescription(
    activityType: 'training' | 'scrim' | 'strategy',
    state: ActivityState
  ): string {
    const baseDescriptions = {
      training: 'Schedule training sessions for your players to improve their skills.',
      scrim: 'Practice match available against another team. Build synergy and test strategies.',
      strategy: 'Review and adjust team strategy and agent compositions.',
    };

    const stateDescriptions: Record<ActivityState, string> = {
      needs_setup: 'Needs configuration',
      configured: 'Ready to go',
      locked: 'In progress or completed',
      skipped: 'Skipped',
      available: 'Available to schedule',
      unavailable: 'Not available',
    };

    return `${baseDescriptions[activityType]} ${stateDescriptions[state] || ''}`.trim();
  }
}

// Export singleton instance
export const dayPlanService = new DayPlanService();
