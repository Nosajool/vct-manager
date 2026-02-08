// Drama Slice - Zustand store slice for drama event management
// Handles narrative events, conditions, effects, and player decisions

import type { StateCreator } from 'zustand';
import type { DramaEventInstance, DramaEffect, DramaCategory } from '../../types/drama';

export interface DramaSlice {
  // State
  activeEvents: DramaEventInstance[];
  eventHistory: DramaEventInstance[];
  activeFlags: Record<string, string>; // flagName -> ISO date
  cooldowns: Record<string, string>; // templateId -> last fired ISO date
  lastEventByCategory: Record<DramaCategory, string>; // category -> ISO date
  totalEventsTriggered: number;
  totalMajorDecisions: number;

  // Actions
  addDramaEvent: (event: DramaEventInstance) => void;
  addDramaEvents: (events: DramaEventInstance[]) => void;
  resolveDramaEvent: (
    eventId: string,
    choiceId?: string,
    outcomeNarrative?: string,
    effects?: DramaEffect[]
  ) => void;
  expireDramaEvent: (eventId: string) => void;
  escalateDramaEvent: (eventId: string, newEvent: DramaEventInstance) => void;
  setDramaFlag: (flag: string, date: string) => void;
  clearDramaFlag: (flag: string) => void;
  setCooldown: (templateId: string, date: string) => void;
  updateLastEventByCategory: (category: DramaCategory, date: string) => void;

  // Selectors
  getActiveEvents: () => DramaEventInstance[];
  getPendingMajorEvents: () => DramaEventInstance[];
  getEventHistory: (limit?: number) => DramaEventInstance[];
  getEventsByCategory: (category: DramaCategory) => DramaEventInstance[];
  hasActiveFlag: (flag: string) => boolean;
  isOnCooldown: (templateId: string, currentDate: string, cooldownDays: number) => boolean;
}

export const createDramaSlice: StateCreator<DramaSlice, [], [], DramaSlice> = (
  set,
  get
) => ({
  // Initial state
  activeEvents: [],
  eventHistory: [],
  activeFlags: {},
  cooldowns: {},
  lastEventByCategory: {} as Record<DramaCategory, string>,
  totalEventsTriggered: 0,
  totalMajorDecisions: 0,

  // Actions
  addDramaEvent: (event) =>
    set((state) => ({
      activeEvents: [...state.activeEvents, event],
      totalEventsTriggered: state.totalEventsTriggered + 1,
    })),

  addDramaEvents: (events) =>
    set((state) => ({
      activeEvents: [...state.activeEvents, ...events],
      totalEventsTriggered: state.totalEventsTriggered + events.length,
    })),

  resolveDramaEvent: (eventId, choiceId, outcomeNarrative, effects) =>
    set((state) => {
      const eventIndex = state.activeEvents.findIndex((e) => e.id === eventId);
      if (eventIndex === -1) return state;

      const event = state.activeEvents[eventIndex];
      const resolvedEvent: DramaEventInstance = {
        ...event,
        status: 'resolved',
        resolvedDate: new Date().toISOString(),
        chosenOptionId: choiceId,
        outcomeText: outcomeNarrative,
        appliedEffects: effects || event.appliedEffects,
      };

      // Remove from active, add to history (keep last 100)
      const newActiveEvents = state.activeEvents.filter((e) => e.id !== eventId);
      const newHistory = [...state.eventHistory, resolvedEvent].slice(-100);

      // Track major decisions
      const isMajorDecision = event.severity === 'major' && choiceId;

      return {
        activeEvents: newActiveEvents,
        eventHistory: newHistory,
        totalMajorDecisions: isMajorDecision
          ? state.totalMajorDecisions + 1
          : state.totalMajorDecisions,
      };
    }),

  expireDramaEvent: (eventId) =>
    set((state) => {
      const eventIndex = state.activeEvents.findIndex((e) => e.id === eventId);
      if (eventIndex === -1) return state;

      const event = state.activeEvents[eventIndex];
      const expiredEvent: DramaEventInstance = {
        ...event,
        status: 'expired',
        resolvedDate: new Date().toISOString(),
      };

      // Remove from active, add to history (keep last 100)
      const newActiveEvents = state.activeEvents.filter((e) => e.id !== eventId);
      const newHistory = [...state.eventHistory, expiredEvent].slice(-100);

      return {
        activeEvents: newActiveEvents,
        eventHistory: newHistory,
      };
    }),

  escalateDramaEvent: (eventId, newEvent) =>
    set((state) => {
      const eventIndex = state.activeEvents.findIndex((e) => e.id === eventId);
      if (eventIndex === -1) return state;

      const event = state.activeEvents[eventIndex];
      const escalatedEvent: DramaEventInstance = {
        ...event,
        status: 'escalated',
        resolvedDate: new Date().toISOString(),
        escalated: true,
        escalatedToEventId: newEvent.id,
      };

      // Remove old event from active, add to history
      // Add new escalated event to active
      const newActiveEvents = [
        ...state.activeEvents.filter((e) => e.id !== eventId),
        newEvent,
      ];
      const newHistory = [...state.eventHistory, escalatedEvent].slice(-100);

      return {
        activeEvents: newActiveEvents,
        eventHistory: newHistory,
        totalEventsTriggered: state.totalEventsTriggered + 1,
      };
    }),

  setDramaFlag: (flag, date) =>
    set((state) => ({
      activeFlags: { ...state.activeFlags, [flag]: date },
    })),

  clearDramaFlag: (flag) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [flag]: removed, ...remaining } = state.activeFlags;
      return { activeFlags: remaining };
    }),

  setCooldown: (templateId, date) =>
    set((state) => ({
      cooldowns: { ...state.cooldowns, [templateId]: date },
    })),

  updateLastEventByCategory: (category, date) =>
    set((state) => ({
      lastEventByCategory: { ...state.lastEventByCategory, [category]: date },
    })),

  // Selectors
  getActiveEvents: () => get().activeEvents,

  getPendingMajorEvents: () =>
    get().activeEvents.filter(
      (e) => e.severity === 'major' && (e.status === 'pending' || e.status === 'active')
    ),

  getEventHistory: (limit) => {
    const history = get().eventHistory;
    return limit ? history.slice(-limit) : history;
  },

  getEventsByCategory: (category) =>
    get().eventHistory.filter((e) => e.category === category),

  hasActiveFlag: (flag) => flag in get().activeFlags,

  isOnCooldown: (templateId, currentDate, cooldownDays) => {
    const lastFired = get().cooldowns[templateId];
    if (!lastFired) return false;

    const lastFiredDate = new Date(lastFired);
    const currentDateObj = new Date(currentDate);
    const daysSinceLastFired =
      (currentDateObj.getTime() - lastFiredDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceLastFired < cooldownDays;
  },
});
