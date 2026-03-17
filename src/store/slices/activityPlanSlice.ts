// Activity Plan Slice - Zustand store slice for scheduled activity configuration
// Manages training and scrim activity configs keyed by calendar event ID

import type { StateCreator } from 'zustand';
import type { ActivityConfig } from '../../types/activityPlan';
import { featureGateService } from '../../services/FeatureGateService';
import type { FeatureType } from '../../data/featureUnlocks';
import { DayScheduleService } from '../../services/DayScheduleService';
import type { SchedulableActivityType } from '../../types/calendar';

const isSameDay = (date1: string, date2: string): boolean =>
  new Date(date1).toDateString() === new Date(date2).toDateString();

const ACTIVITY_TO_EVENT_TYPE: Record<string, string> = {
  training: 'scheduled_training',
  scrim: 'scheduled_scrim',
};

const CONFIGURABLE_ACTIVITY_TYPES: SchedulableActivityType[] = ['training', 'scrim'];

const DOWNTIME_ACTIVITY_TYPES: SchedulableActivityType[] = [
  'watch_party',
  'fan_meetup',
  'streamer_collab',
  'youtube_documentary',
  'sponsored_content',
  'regional_bootcamp',
];

/**
 * Map event types to their corresponding feature gates
 */
function getFeatureForEventType(eventType: string): FeatureType | null {
  switch (eventType) {
    case 'scheduled_training':
      return 'training';
    case 'scheduled_scrim':
      return 'scrims';
    default:
      return null;
  }
}

export interface ActivityPlanSlice {
  // State: activity configs keyed by config ID (not event ID)
  activityConfigs: Record<string, ActivityConfig>;

  // Actions
  setActivityConfig: (config: ActivityConfig) => void;
  removeActivityConfig: (configId: string) => void;
  removeActivityConfigByEventId: (eventId: string) => void;
  clearConfigsForDate: (date: string) => void;

  // Selectors
  getActivityConfig: (configId: string) => ActivityConfig | undefined;
  getActivityConfigByEventId: (eventId: string) => ActivityConfig | undefined;
  getTodayConfigs: () => ActivityConfig[];
  hasUnconfiguredActivities: () => boolean;
  getUnconfiguredActivities: () => string[]; // Returns array of unconfigured event IDs
}

export const createActivityPlanSlice: StateCreator<
  ActivityPlanSlice,
  [],
  [],
  ActivityPlanSlice
> = (set, get) => ({
  // Initial state
  activityConfigs: {},

  // Actions
  setActivityConfig: (config) =>
    set((state) => ({
      activityConfigs: { ...state.activityConfigs, [config.id]: config },
    })),

  removeActivityConfig: (configId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [configId]: removed, ...remaining } = state.activityConfigs;
      return { activityConfigs: remaining };
    }),

  removeActivityConfigByEventId: (eventId) =>
    set((state) => {
      const remaining: Record<string, ActivityConfig> = {};

      for (const [configId, config] of Object.entries(state.activityConfigs)) {
        if (config.eventId !== eventId) {
          remaining[configId] = config;
        }
      }

      return { activityConfigs: remaining };
    }),

  clearConfigsForDate: (date) =>
    set((state) => {
      const remaining: Record<string, ActivityConfig> = {};

      for (const [configId, config] of Object.entries(state.activityConfigs)) {
        if (!isSameDay(config.date, date)) {
          remaining[configId] = config;
        }
      }

      return { activityConfigs: remaining };
    }),

  // Selectors
  getActivityConfig: (configId) => get().activityConfigs[configId],

  getActivityConfigByEventId: (eventId) => {
    const configs = get().activityConfigs;
    return Object.values(configs).find((config) => config.eventId === eventId);
  },

  getTodayConfigs: () => {
    const fullState = get() as any;
    const today = fullState.calendar?.currentDate;
    if (!today) return [];

    const configs = get().activityConfigs;

    return Object.values(configs).filter((config) => isSameDay(config.date, today));
  },

  hasUnconfiguredActivities: () => {
    const fullState = get() as any;
    const today = fullState.calendar?.currentDate;
    if (!today) return false;

    const allTodaysEvents: any[] = fullState.calendar?.scheduledEvents?.filter(
      (event: any) => isSameDay(event.date, today) && !event.processed
    ) || [];

    const todaysRegularEvents = allTodaysEvents.filter(
      (e: any) => e.type === 'scheduled_training' || e.type === 'scheduled_scrim'
    );

    const todaysDowntimeEvents = allTodaysEvents.filter(
      (e: any) =>
        e.type === 'team_activity' &&
        DOWNTIME_ACTIVITY_TYPES.includes((e.data as any)?.activityType)
    );

    const configs = get().activityConfigs;

    // Check 1a: Training/scrim events without config
    const hasUnconfiguredRegular = todaysRegularEvents.some((event: any) => {
      const feature = getFeatureForEventType(event.type);
      if (feature && !featureGateService.isFeatureUnlocked(feature)) return false;
      const config = Object.values(configs).find((c) => c.eventId === event.id);
      return !config || config.status === 'needs_setup';
    });

    if (hasUnconfiguredRegular) return true;

    // Check 1b: Downtime events scheduled but still in needs_setup state
    const hasUnconfiguredDowntime = todaysDowntimeEvents.some(
      (event: any) => event.lifecycleState === 'needs_setup'
    );

    if (hasUnconfiguredDowntime) return true;

    // Check 2: Available activity types that haven't been scheduled at all
    const dayScheduleService = new DayScheduleService();
    const daySchedule = dayScheduleService.getDaySchedule(today);

    const scheduledRegularEventTypes = new Set(todaysRegularEvents.map((e: any) => e.type));
    const hasUnscheduledRegular = CONFIGURABLE_ACTIVITY_TYPES.some((activityType) => {
      if (!daySchedule.availableActivityTypes.includes(activityType)) return false;
      const eventType = ACTIVITY_TO_EVENT_TYPE[activityType];
      return !scheduledRegularEventTypes.has(eventType);
    });

    if (hasUnscheduledRegular) return true;

    const scheduledDowntimeTypes = new Set(
      todaysDowntimeEvents.map((e: any) => (e.data as any)?.activityType)
    );

    return DOWNTIME_ACTIVITY_TYPES.some((activityType) => {
      if (!daySchedule.availableActivityTypes.includes(activityType)) return false;
      return !scheduledDowntimeTypes.has(activityType);
    });
  },

  getUnconfiguredActivities: () => {
    const fullState = get() as any;
    const today = fullState.calendar?.currentDate;
    if (!today) return [];

    const allTodaysEvents: any[] = fullState.calendar?.scheduledEvents?.filter(
      (event: any) => isSameDay(event.date, today) && !event.processed
    ) || [];

    const todaysRegularEvents = allTodaysEvents.filter(
      (e: any) => e.type === 'scheduled_training' || e.type === 'scheduled_scrim'
    );

    const todaysDowntimeEvents = allTodaysEvents.filter(
      (e: any) =>
        e.type === 'team_activity' &&
        DOWNTIME_ACTIVITY_TYPES.includes((e.data as any)?.activityType)
    );

    const configs = get().activityConfigs;

    // Training/scrim events without config
    const unconfiguredEventIds: string[] = todaysRegularEvents
      .filter((event: any) => {
        const feature = getFeatureForEventType(event.type);
        if (feature && !featureGateService.isFeatureUnlocked(feature)) return false;
        const config = Object.values(configs).find((c) => c.eventId === event.id);
        return !config || config.status === 'needs_setup';
      })
      .map((event: any) => event.id);

    // Downtime events scheduled but still in needs_setup state
    for (const event of todaysDowntimeEvents) {
      if (event.lifecycleState === 'needs_setup') {
        unconfiguredEventIds.push(event.id);
      }
    }

    // Available-but-unscheduled sentinel values
    const dayScheduleService = new DayScheduleService();
    const daySchedule = dayScheduleService.getDaySchedule(today);

    const scheduledRegularEventTypes = new Set(todaysRegularEvents.map((e: any) => e.type));
    for (const activityType of CONFIGURABLE_ACTIVITY_TYPES) {
      if (!daySchedule.availableActivityTypes.includes(activityType)) continue;
      const eventType = ACTIVITY_TO_EVENT_TYPE[activityType];
      if (!scheduledRegularEventTypes.has(eventType)) {
        unconfiguredEventIds.push(`unscheduled:${activityType}`);
      }
    }

    const scheduledDowntimeTypes = new Set(
      todaysDowntimeEvents.map((e: any) => (e.data as any)?.activityType)
    );
    for (const activityType of DOWNTIME_ACTIVITY_TYPES) {
      if (!daySchedule.availableActivityTypes.includes(activityType)) continue;
      if (!scheduledDowntimeTypes.has(activityType)) {
        unconfiguredEventIds.push(`unscheduled:${activityType}`);
      }
    }

    return unconfiguredEventIds;
  },
});
