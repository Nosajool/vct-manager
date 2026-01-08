// Game Slice - Zustand store slice for core game state
// Handles calendar, season progression, and game metadata

import type { StateCreator } from 'zustand';
import type { GameCalendar, SeasonPhase, CalendarEvent } from '../../types';

export interface GameSlice {
  // Game initialization
  initialized: boolean;
  gameStarted: boolean;

  // Calendar state
  calendar: GameCalendar;

  // Actions
  setInitialized: (value: boolean) => void;
  setGameStarted: (value: boolean) => void;

  // Calendar actions
  setCurrentDate: (date: string) => void;
  advanceDate: (days: number) => void;
  setCurrentPhase: (phase: SeasonPhase) => void;
  setCurrentSeason: (season: number) => void;

  // Event actions
  addCalendarEvent: (event: CalendarEvent) => void;
  addCalendarEvents: (events: CalendarEvent[]) => void;
  markEventProcessed: (eventId: string) => void;
  removeCalendarEvent: (eventId: string) => void;

  // Selectors
  getCurrentDate: () => string;
  getUpcomingEvents: (limit?: number) => CalendarEvent[];
  getEventsOnDate: (date: string) => CalendarEvent[];
  getNextMatchEvent: () => CalendarEvent | undefined;
}

// Helper to add days to ISO date string
const addDaysToDate = (isoDate: string, days: number): string => {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
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

  setCurrentPhase: (phase) =>
    set((state) => ({
      calendar: { ...state.calendar, currentPhase: phase },
    })),

  setCurrentSeason: (season) =>
    set((state) => ({
      calendar: { ...state.calendar, currentSeason: season },
    })),

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

  removeCalendarEvent: (eventId) =>
    set((state) => ({
      calendar: {
        ...state.calendar,
        scheduledEvents: state.calendar.scheduledEvents.filter(
          (event) => event.id !== eventId
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
    const targetDate = new Date(date).toDateString();

    return calendar.scheduledEvents.filter(
      (event) => new Date(event.date).toDateString() === targetDate
    );
  },

  getNextMatchEvent: () => {
    const { calendar } = get();
    const currentDate = new Date(calendar.currentDate);

    return calendar.scheduledEvents
      .filter(
        (event) =>
          !event.processed &&
          event.type === 'match' &&
          new Date(event.date) >= currentDate
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  },
});
