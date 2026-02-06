// ScrimService Eligibility Tests
// Tests for comprehensive scrim eligibility checks

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scrimService } from '../ScrimService';
import { useGameStore } from '../../store';
import type { Team, CalendarEvent, MatchEventData } from '../../types';

// Mock the store
vi.mock('../../store', () => ({
  useGameStore: {
    getState: vi.fn(),
  },
}));

describe('ScrimService - Eligibility Checks', () => {
  const mockPlayerTeamId = 'team-1';
  const mockDate = '2024-01-15';

  beforeEach(() => {
    // Reset the service's internal state
    scrimService.resetWeeklyTracker();
  });

  describe('checkScrimEligibility', () => {
    it('should allow scrims when all conditions are met', () => {
      // Setup: team with 5 players, no match today, under weekly limit
      const mockState = {
        calendar: { currentDate: mockDate },
        playerTeamId: mockPlayerTeamId,
        teams: {
          [mockPlayerTeamId]: {
            id: mockPlayerTeamId,
            name: 'Test Team',
            playerIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
          } as Team,
        },
        getTodaysActivities: () => [],
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const result = scrimService.checkScrimEligibility();

      expect(result.canScrim).toBe(true);
      expect(result.failedChecks).toHaveLength(0);
      expect(result.reason).toBeUndefined();
    });

    it('should block scrims when player count is less than 5', () => {
      const mockState = {
        calendar: { currentDate: mockDate },
        playerTeamId: mockPlayerTeamId,
        teams: {
          [mockPlayerTeamId]: {
            id: mockPlayerTeamId,
            name: 'Test Team',
            playerIds: ['p1', 'p2', 'p3'], // Only 3 players
          } as Team,
        },
        getTodaysActivities: () => [],
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const result = scrimService.checkScrimEligibility();

      expect(result.canScrim).toBe(false);
      expect(result.failedChecks).toContain('player_count');
      expect(result.reason).toContain('Need at least 5 players');
      expect(result.reason).toContain('current: 3');
    });

    it('should block scrims on match days', () => {
      const matchEvent: CalendarEvent = {
        id: 'event-1',
        date: mockDate,
        type: 'match',
        processed: false,
        data: {
          homeTeamId: mockPlayerTeamId,
          awayTeamId: 'team-2',
          matchId: 'match-1',
        } as MatchEventData,
      };

      const mockState = {
        calendar: { currentDate: mockDate },
        playerTeamId: mockPlayerTeamId,
        teams: {
          [mockPlayerTeamId]: {
            id: mockPlayerTeamId,
            name: 'Test Team',
            playerIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
          } as Team,
        },
        getTodaysActivities: () => [matchEvent],
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const result = scrimService.checkScrimEligibility();

      expect(result.canScrim).toBe(false);
      expect(result.failedChecks).toContain('match_day');
      expect(result.reason).toBe('Cannot schedule scrims on match days');
    });

    it('should allow scrims when match is already processed', () => {
      const matchEvent: CalendarEvent = {
        id: 'event-1',
        date: mockDate,
        type: 'match',
        processed: true, // Match already played
        data: {
          homeTeamId: mockPlayerTeamId,
          awayTeamId: 'team-2',
          matchId: 'match-1',
        } as MatchEventData,
      };

      const mockState = {
        calendar: { currentDate: mockDate },
        playerTeamId: mockPlayerTeamId,
        teams: {
          [mockPlayerTeamId]: {
            id: mockPlayerTeamId,
            name: 'Test Team',
            playerIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
          } as Team,
        },
        getTodaysActivities: () => [matchEvent],
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const result = scrimService.checkScrimEligibility();

      expect(result.canScrim).toBe(true);
      expect(result.failedChecks).not.toContain('match_day');
    });

    it('should block scrims when weekly limit is reached', () => {
      const mockState = {
        calendar: { currentDate: mockDate },
        playerTeamId: mockPlayerTeamId,
        teams: {
          [mockPlayerTeamId]: {
            id: mockPlayerTeamId,
            name: 'Test Team',
            playerIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
          } as Team,
        },
        getTodaysActivities: () => [],
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      // Simulate 4 scrims already used this week
      for (let i = 0; i < 4; i++) {
        // @ts-ignore - Accessing private method for testing
        scrimService.recordScrimSession(`partner-${i}`);
      }

      const result = scrimService.checkScrimEligibility();

      expect(result.canScrim).toBe(false);
      expect(result.failedChecks).toContain('weekly_limit');
      expect(result.scrimsUsed).toBe(4);
      expect(result.reason).toContain('Maximum 4 scrims per week reached');
    });

    it('should report multiple failed checks with match day taking priority', () => {
      const matchEvent: CalendarEvent = {
        id: 'event-1',
        date: mockDate,
        type: 'match',
        processed: false,
        data: {
          homeTeamId: mockPlayerTeamId,
          awayTeamId: 'team-2',
          matchId: 'match-1',
        } as MatchEventData,
      };

      const mockState = {
        calendar: { currentDate: mockDate },
        playerTeamId: mockPlayerTeamId,
        teams: {
          [mockPlayerTeamId]: {
            id: mockPlayerTeamId,
            name: 'Test Team',
            playerIds: ['p1', 'p2'], // Only 2 players
          } as Team,
        },
        getTodaysActivities: () => [matchEvent],
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const result = scrimService.checkScrimEligibility();

      expect(result.canScrim).toBe(false);
      expect(result.failedChecks).toContain('match_day');
      expect(result.failedChecks).toContain('player_count');
      // Match day should take priority in the reason
      expect(result.reason).toBe('Cannot schedule scrims on match days');
    });

    it('should handle missing player team', () => {
      const mockState = {
        calendar: { currentDate: mockDate },
        playerTeamId: null,
        teams: {},
        getTodaysActivities: () => [],
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const result = scrimService.checkScrimEligibility();

      expect(result.canScrim).toBe(false);
      expect(result.reason).toBe('No player team found');
    });

    it('should track scrims used even when blocked', () => {
      const mockState = {
        calendar: { currentDate: mockDate },
        playerTeamId: mockPlayerTeamId,
        teams: {
          [mockPlayerTeamId]: {
            id: mockPlayerTeamId,
            name: 'Test Team',
            playerIds: ['p1', 'p2'], // Not enough players
          } as Team,
        },
        getTodaysActivities: () => [],
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      // Record 2 scrims
      // @ts-ignore - Accessing private method for testing
      scrimService.recordScrimSession('partner-1');
      // @ts-ignore
      scrimService.recordScrimSession('partner-2');

      const result = scrimService.checkScrimEligibility();

      expect(result.scrimsUsed).toBe(2);
    });
  });
});
