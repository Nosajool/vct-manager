// Activity Plan Slice - Zustand store slice for scheduled activity configuration
// Manages training and scrim activity configs keyed by calendar event ID

import type { StateCreator } from 'zustand';
import type { ActivityConfig } from '../../types/activityPlan';
import { featureGateService } from '../../services/FeatureGateService';
import type { FeatureType } from '../../data/featureUnlocks';

/**
 * Map event types to their corresponding feature gates
 */
function getFeatureForEventType(eventType: string): FeatureType | null {
  switch (eventType) {
    case 'training_available':
      return 'training';
    case 'scrim_available':
      return 'scrims';
    default:
      return null;
  }
}

export interface ActivityPlanSlice {
  // State: activity configs keyed by event ID
  activityConfigs: Record<string, ActivityConfig>;

  // Actions
  setActivityConfig: (eventId: string, config: ActivityConfig) => void;
  removeActivityConfig: (eventId: string) => void;
  clearConfigsForDate: (date: string) => void;

  // Selectors
  getActivityConfig: (eventId: string) => ActivityConfig | undefined;
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
  setActivityConfig: (eventId, config) =>
    set((state) => ({
      activityConfigs: { ...state.activityConfigs, [eventId]: config },
    })),

  removeActivityConfig: (eventId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [eventId]: removed, ...remaining } = state.activityConfigs;
      return { activityConfigs: remaining };
    }),

  clearConfigsForDate: (date) =>
    set((state) => {
      // Access calendar from the full store state
      const fullState = get() as any;
      const eventsOnDate = fullState.calendar?.scheduledEvents?.filter(
        (event: any) => event.date === date
      ) || [];

      const eventIdsToRemove = new Set(eventsOnDate.map((e: any) => e.id));
      const remaining: Record<string, ActivityConfig> = {};

      for (const [eventId, config] of Object.entries(state.activityConfigs)) {
        if (!eventIdsToRemove.has(eventId)) {
          remaining[eventId] = config;
        }
      }

      return { activityConfigs: remaining };
    }),

  // Selectors
  getActivityConfig: (eventId) => get().activityConfigs[eventId],

  getTodayConfigs: () => {
    const fullState = get() as any;
    const today = fullState.calendar?.currentDate;
    if (!today) return [];

    const todaysEvents = fullState.calendar?.scheduledEvents?.filter(
      (event: any) => event.date === today
    ) || [];

    const todaysEventIds = new Set(todaysEvents.map((e: any) => e.id));
    const configs = get().activityConfigs;

    return Object.entries(configs)
      .filter(([eventId]) => todaysEventIds.has(eventId))
      .map(([, config]) => config);
  },

  hasUnconfiguredActivities: () => {
    const fullState = get() as any;
    const today = fullState.calendar?.currentDate;
    if (!today) return false;

    const todaysEvents = fullState.calendar?.scheduledEvents?.filter(
      (event: any) =>
        event.date === today &&
        !event.processed &&
        (event.type === 'training_available' || event.type === 'scrim_available')
    ) || [];

    const configs = get().activityConfigs;

    // Filter out locked features before checking configuration status
    return todaysEvents.some((event: any) => {
      const feature = getFeatureForEventType(event.type);
      if (feature && !featureGateService.isFeatureUnlocked(feature)) {
        return false; // Ignore locked features
      }

      const config = configs[event.id];
      return !config || config.status === 'needs_setup';
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
        (event.type === 'training_available' || event.type === 'scrim_available')
    ) || [];

    const configs = get().activityConfigs;

    // Filter out locked features before checking configuration status
    return todaysEvents
      .filter((event: any) => {
        const feature = getFeatureForEventType(event.type);
        if (feature && !featureGateService.isFeatureUnlocked(feature)) {
          return false; // Ignore locked features
        }

        const config = configs[event.id];
        return !config || config.status === 'needs_setup';
      })
      .map((event: any) => event.id);
  },
});
