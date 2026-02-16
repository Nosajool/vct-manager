// Activity Plan Slice - Zustand store slice for scheduled activity configuration
// Manages training and scrim activity configs keyed by calendar event ID

import type { StateCreator } from 'zustand';
import type { ActivityConfig } from '../../types/activityPlan';
import { featureGateService } from '../../services/FeatureGateService';
import type { FeatureType } from '../../data/featureUnlocks';
import { DayScheduleService } from '../../services/DayScheduleService';
import type { SchedulableActivityType } from '../../types/calendar';

const ACTIVITY_TO_EVENT_TYPE: Record<string, string> = {
  training: 'scheduled_training',
  scrim: 'scheduled_scrim',
};

const CONFIGURABLE_ACTIVITY_TYPES: SchedulableActivityType[] = ['training', 'scrim'];

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
        if (config.date !== date) {
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

    return Object.values(configs).filter((config) => config.date === today);
  },

  hasUnconfiguredActivities: () => {
    const fullState = get() as any;
    const today = fullState.calendar?.currentDate;
    if (!today) return false;

    const todaysEvents = fullState.calendar?.scheduledEvents?.filter(
      (event: any) =>
        event.date === today &&
        !event.processed &&
        (event.type === 'scheduled_training' || event.type === 'scheduled_scrim')
    ) || [];

    const configs = get().activityConfigs;

    // Check 1: Scheduled events without config
    const hasUnconfiguredScheduled = todaysEvents.some((event: any) => {
      const feature = getFeatureForEventType(event.type);
      if (feature && !featureGateService.isFeatureUnlocked(feature)) {
        return false;
      }

      const config = Object.values(configs).find((c) => c.eventId === event.id);
      return !config || config.status === 'needs_setup';
    });

    if (hasUnconfiguredScheduled) return true;

    // Check 2: Available activity types that haven't been scheduled at all
    const dayScheduleService = new DayScheduleService();
    const daySchedule = dayScheduleService.getDaySchedule(today);
    const scheduledEventTypes = new Set(todaysEvents.map((e: any) => e.type));

    return CONFIGURABLE_ACTIVITY_TYPES.some((activityType) => {
      if (!daySchedule.availableActivityTypes.includes(activityType)) return false;
      const eventType = ACTIVITY_TO_EVENT_TYPE[activityType];
      return !scheduledEventTypes.has(eventType);
    });
  },

  getUnconfiguredActivities: () => {
    const fullState = get() as any;
    const today = fullState.calendar?.currentDate;
    if (!today) return [];

    const todaysEvents = fullState.calendar?.scheduledEvents?.filter(
      (event: any) =>
        event.date === today &&
        !event.processed &&
        (event.type === 'scheduled_training' || event.type === 'scheduled_scrim')
    ) || [];

    const configs = get().activityConfigs;

    // Existing scheduled events without config
    const unconfiguredEventIds = todaysEvents
      .filter((event: any) => {
        const feature = getFeatureForEventType(event.type);
        if (feature && !featureGateService.isFeatureUnlocked(feature)) {
          return false;
        }

        const config = Object.values(configs).find((c) => c.eventId === event.id);
        return !config || config.status === 'needs_setup';
      })
      .map((event: any) => event.id);

    // Also include available-but-unscheduled activity types as sentinel values
    // These use the format "unscheduled:training" / "unscheduled:scrim"
    const dayScheduleService = new DayScheduleService();
    const daySchedule = dayScheduleService.getDaySchedule(today);
    const scheduledEventTypes = new Set(todaysEvents.map((e: any) => e.type));

    for (const activityType of CONFIGURABLE_ACTIVITY_TYPES) {
      if (!daySchedule.availableActivityTypes.includes(activityType)) continue;
      const eventType = ACTIVITY_TO_EVENT_TYPE[activityType];
      if (!scheduledEventTypes.has(eventType)) {
        unconfiguredEventIds.push(`unscheduled:${activityType}`);
      }
    }

    return unconfiguredEventIds;
  },
});
