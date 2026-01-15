// Game Slice - Zustand store slice for core game state
// Handles calendar, season progression, and game metadata

import type { StateCreator } from 'zustand';
import type { GameCalendar, SeasonPhase, CalendarEvent, CalendarEventType, MatchEventData } from '../../types';

export interface GameSlice {
  // Game initialization
  initialized: boolean;
  gameStarted: boolean;

  // Calendar state
  calendar: GameCalendar;

  // Auto-save tracking
  lastSaveDate: string | null;

  // Actions
  setInitialized: (value: boolean) => void;
  setGameStarted: (value: boolean) => void;

  // Calendar actions
  setCurrentDate: (date: string) => void;
  advanceDate: (days: number) => void;
  advanceDay: () => void;
  advanceWeek: () => void;
  advanceToDate: (date: string) => void;
  setCurrentPhase: (phase: SeasonPhase) => void;
  setCurrentSeason: (season: number) => void;
  setLastSaveDate: (date: string) => void;

  // Event actions
  addCalendarEvent: (event: CalendarEvent) => void;
  addCalendarEvents: (events: CalendarEvent[]) => void;
  markEventProcessed: (eventId: string) => void;
  batchProcessEvents: (eventIds: string[]) => void;
  removeCalendarEvent: (eventId: string) => void;
  clearProcessedEvents: () => void;

  // Selectors
  getCurrentDate: () => string;
  getUpcomingEvents: (limit?: number) => CalendarEvent[];
  getEventsOnDate: (date: string) => CalendarEvent[];
  getEventsBetweenDates: (startDate: string, endDate: string) => CalendarEvent[];
  getNextMatchEvent: () => CalendarEvent | undefined;
  getNextEventOfType: (type: CalendarEventType) => CalendarEvent | undefined;
  getUnprocessedRequiredEvents: (beforeDate: string) => CalendarEvent[];
  getTodaysActivities: () => CalendarEvent[];
}

// Helper to add days to ISO date string
const addDaysToDate = (isoDate: string, days: number): string => {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

// Helper to compare dates (ignoring time)
const isSameDay = (date1: string, date2: string): boolean => {
  return new Date(date1).toDateString() === new Date(date2).toDateString();
};

// Helper to check if date1 is before or on date2 (ignoring time)
const isDateBeforeOrEqual = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return d1.getTime() <= d2.getTime();
};

// Default calendar state
const defaultCalendar: GameCalendar = {
  currentDate: new Date().toISOString(),
  currentSeason: 1,
  currentPhase: 'offseason',
  scheduledEvents: [],
};

export const createGameSlice: StateCreator<
  GameSlice,
  [],
  [],
  GameSlice
> = (set, get) => ({
  // Initial state
  initialized: false,
  gameStarted: false,
  calendar: defaultCalendar,
  lastSaveDate: null,

  // Actions
  setInitialized: (value) =>
    set({ initialized: value }),

  setGameStarted: (value) =>
    set({ gameStarted: value }),

  // Calendar actions
  setCurrentDate: (date) =>
    set((state) => ({
      calendar: { ...state.calendar, currentDate: date },
    })),

  advanceDate: (days) =>
    set((state) => ({
      calendar: {
        ...state.calendar,
        currentDate: addDaysToDate(state.calendar.currentDate, days),
      },
    })),

  advanceDay: () =>
    set((state) => ({
      calendar: {
        ...state.calendar,
        currentDate: addDaysToDate(state.calendar.currentDate, 1),
      },
    })),

  advanceWeek: () =>
    set((state) => ({
      calendar: {
        ...state.calendar,
        currentDate: addDaysToDate(state.calendar.currentDate, 7),
      },
    })),

  advanceToDate: (date) =>
    set((state) => ({
      calendar: { ...state.calendar, currentDate: date },
    })),

  setCurrentPhase: (phase) =>
    set((state) => ({
      calendar: { ...state.calendar, currentPhase: phase },
    })),

  setCurrentSeason: (season) =>
    set((state) => ({
      calendar: { ...state.calendar, currentSeason: season },
    })),

  setLastSaveDate: (date) =>
    set({ lastSaveDate: date }),

  // Event actions
  addCalendarEvent: (event) =>
    set((state) => ({
      calendar: {
        ...state.calendar,
        scheduledEvents: [...state.calendar.scheduledEvents, event],
      },
    })),

  addCalendarEvents: (events) =>
    set((state) => ({
      calendar: {
        ...state.calendar,
        scheduledEvents: [...state.calendar.scheduledEvents, ...events],
      },
    })),

  markEventProcessed: (eventId) =>
    set((state) => ({
      calendar: {
        ...state.calendar,
        scheduledEvents: state.calendar.scheduledEvents.map((event) =>
          event.id === eventId ? { ...event, processed: true } : event
        ),
      },
    })),

  batchProcessEvents: (eventIds) =>
    set((state) => {
      const idSet = new Set(eventIds);
      return {
        calendar: {
          ...state.calendar,
          scheduledEvents: state.calendar.scheduledEvents.map((event) =>
            idSet.has(event.id) ? { ...event, processed: true } : event
          ),
        },
      };
    }),

  removeCalendarEvent: (eventId) =>
    set((state) => ({
      calendar: {
        ...state.calendar,
        scheduledEvents: state.calendar.scheduledEvents.filter(
          (event) => event.id !== eventId
        ),
      },
    })),

  clearProcessedEvents: () =>
    set((state) => ({
      calendar: {
        ...state.calendar,
        scheduledEvents: state.calendar.scheduledEvents.filter(
          (event) => !event.processed
        ),
      },
    })),

  // Selectors
  getCurrentDate: () => get().calendar.currentDate,

  getUpcomingEvents: (limit = 10) => {
    const { calendar } = get();
    const currentDate = new Date(calendar.currentDate);

    return calendar.scheduledEvents
      .filter((event) => !event.processed && new Date(event.date) >= currentDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);
  },

  getEventsOnDate: (date) => {
    const { calendar } = get();
    return calendar.scheduledEvents.filter(
      (event) => isSameDay(event.date, date)
    );
  },

  getEventsBetweenDates: (startDate, endDate) => {
    const { calendar } = get();
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return calendar.scheduledEvents
      .filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= start && eventDate <= end;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  getNextMatchEvent: () => {
    const state = get();
    const { calendar } = state;
    const currentDate = new Date(calendar.currentDate);
    // Access playerTeamId from combined state (TeamSlice)
    const playerTeamId = (state as unknown as { playerTeamId: string | null }).playerTeamId;

    return calendar.scheduledEvents
      .filter((event) => {
        if (event.processed || event.type !== 'match') return false;
        if (new Date(event.date) < currentDate) return false;

        // Only return matches for the player's team
        if (playerTeamId) {
          const data = event.data as MatchEventData;
          return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId;
        }
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  },

  getNextEventOfType: (type) => {
    const { calendar } = get();
    const currentDate = new Date(calendar.currentDate);

    return calendar.scheduledEvents
      .filter(
        (event) =>
          !event.processed &&
          event.type === type &&
          new Date(event.date) >= currentDate
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  },

  getUnprocessedRequiredEvents: (beforeDate) => {
    const { calendar } = get();

    return calendar.scheduledEvents
      .filter(
        (event) =>
          !event.processed &&
          event.required === true &&
          isDateBeforeOrEqual(event.date, beforeDate)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  getTodaysActivities: () => {
    const { calendar } = get();
    const today = calendar.currentDate;

    return calendar.scheduledEvents
      .filter(
        (event) =>
          !event.processed &&
          isSameDay(event.date, today)
      )
      .sort((a, b) => {
        // Required events first
        if (a.required && !b.required) return -1;
        if (!a.required && b.required) return 1;
        return 0;
      });
  },
});
