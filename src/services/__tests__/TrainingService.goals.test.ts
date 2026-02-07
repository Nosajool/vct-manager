// TrainingService Goal-Based Training Tests
// Tests for the new goal-based training recommendation system

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trainingService } from '../TrainingService';
import { useGameStore } from '../../store';
import type { Player, TrainingGoal } from '../../types';

// Mock the store
vi.mock('../../store', () => ({
  useGameStore: {
    getState: vi.fn(),
  },
}));

describe('TrainingService - Goal-Based Training', () => {
  const mockPlayerTeamId = 'team-1';

  beforeEach(() => {
    trainingService.resetWeeklyTracker();
  });

  describe('getRecommendedGoal', () => {
    it('should recommend mechanical_ceiling for player with low mechanics', () => {
      const mockPlayer: Player = {
        id: 'p1',
        name: 'Test Player',
        age: 20,
        teamId: mockPlayerTeamId,
        stats: {
          mechanics: 50, // Weakest stat
          igl: 70,
          mental: 65,
          clutch: 68,
          vibes: 60,
          lurking: 72,
          entry: 75,
          support: 70,
          stamina: 65,
        },
        potential: 85,
        morale: 75,
        form: 70,
      } as Player;

      const mockState = {
        players: { p1: mockPlayer },
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const goal = trainingService.getRecommendedGoal('p1');

      expect(goal).toBe('mechanical_ceiling');
    });

    it('should recommend leadership_comms for player with low IGL', () => {
      const mockPlayer: Player = {
        id: 'p2',
        name: 'Test IGL',
        age: 22,
        teamId: mockPlayerTeamId,
        stats: {
          mechanics: 70,
          igl: 45, // Weakest stat
          mental: 65,
          clutch: 68,
          vibes: 60,
          lurking: 72,
          entry: 75,
          support: 70,
          stamina: 65,
        },
        potential: 80,
        morale: 70,
        form: 65,
      } as Player;

      const mockState = {
        players: { p2: mockPlayer },
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const goal = trainingService.getRecommendedGoal('p2');

      expect(goal).toBe('leadership_comms');
    });

    it('should recommend decision_making for player with low mental', () => {
      const mockPlayer: Player = {
        id: 'p3',
        name: 'Test Mental',
        age: 21,
        teamId: mockPlayerTeamId,
        stats: {
          mechanics: 70,
          igl: 65,
          mental: 48, // Weakest stat
          clutch: 68,
          vibes: 60,
          lurking: 72,
          entry: 75,
          support: 70,
          stamina: 65,
        },
        potential: 82,
        morale: 75,
        form: 70,
      } as Player;

      const mockState = {
        players: { p3: mockPlayer },
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const goal = trainingService.getRecommendedGoal('p3');

      expect(goal).toBe('decision_making');
    });

    it('should recommend role_mastery_entry for player with low entry', () => {
      const mockPlayer: Player = {
        id: 'p4',
        name: 'Test Entry',
        age: 19,
        teamId: mockPlayerTeamId,
        stats: {
          mechanics: 70,
          igl: 65,
          mental: 68,
          clutch: 68,
          vibes: 60,
          lurking: 72,
          entry: 42, // Weakest stat
          support: 70,
          stamina: 65,
        },
        potential: 88,
        morale: 80,
        form: 75,
      } as Player;

      const mockState = {
        players: { p4: mockPlayer },
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const goal = trainingService.getRecommendedGoal('p4');

      expect(goal).toBe('role_mastery_entry');
    });

    it('should return null for non-existent player', () => {
      const mockState = {
        players: {},
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const goal = trainingService.getRecommendedGoal('non-existent');

      expect(goal).toBeNull();
    });
  });

  describe('getGoalInfo', () => {
    it('should return goal information with display name and description', () => {
      const info = trainingService.getGoalInfo('mechanical_ceiling');

      expect(info).toHaveProperty('displayName');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('primaryStats');
      expect(info).toHaveProperty('secondaryStats');
      expect(info).toHaveProperty('previewDescriptors');
      expect(info).toHaveProperty('underlyingFocus');
      expect(info.underlyingFocus).toBe('mechanics');
    });

    it('should have correct mapping for all goals', () => {
      const goals: TrainingGoal[] = [
        'role_mastery_entry',
        'role_mastery_lurk',
        'role_mastery_support',
        'mechanical_ceiling',
        'decision_making',
        'leadership_comms',
        'all_round_growth',
      ];

      goals.forEach((goal) => {
        const info = trainingService.getGoalInfo(goal);
        expect(info).toBeDefined();
        expect(info.displayName).toBeTruthy();
        expect(info.description).toBeTruthy();
      });
    });
  });

  describe('getAllGoals', () => {
    it('should return all 7 training goals', () => {
      const goals = trainingService.getAllGoals();

      expect(goals).toHaveLength(7);
      expect(goals).toContain('role_mastery_entry');
      expect(goals).toContain('role_mastery_lurk');
      expect(goals).toContain('role_mastery_support');
      expect(goals).toContain('mechanical_ceiling');
      expect(goals).toContain('decision_making');
      expect(goals).toContain('leadership_comms');
      expect(goals).toContain('all_round_growth');
    });
  });

  describe('previewTrainingEffectiveness', () => {
    it('should calculate effectiveness without goal parameter', () => {
      const mockPlayer: Player = {
        id: 'p1',
        name: 'Test Player',
        age: 20,
        teamId: mockPlayerTeamId,
        stats: {
          mechanics: 60,
          igl: 65,
          mental: 70,
          clutch: 68,
          vibes: 60,
          lurking: 72,
          entry: 75,
          support: 70,
          stamina: 65,
        },
        potential: 85,
        morale: 75,
        form: 70,
      } as Player;

      const mockState = {
        players: { p1: mockPlayer },
        teams: {
          [mockPlayerTeamId]: {
            id: mockPlayerTeamId,
            coachIds: [],
          },
        },
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const effectiveness = trainingService.previewTrainingEffectiveness('p1', 'moderate');

      expect(effectiveness).toBeGreaterThan(0);
      expect(effectiveness).toBeLessThanOrEqual(100);
    });

    it('should calculate same effectiveness with goal parameter (goal does not affect effectiveness)', () => {
      const mockPlayer: Player = {
        id: 'p1',
        name: 'Test Player',
        age: 20,
        teamId: mockPlayerTeamId,
        stats: {
          mechanics: 60,
          igl: 65,
          mental: 70,
          clutch: 68,
          vibes: 60,
          lurking: 72,
          entry: 75,
          support: 70,
          stamina: 65,
        },
        potential: 85,
        morale: 75,
        form: 70,
      } as Player;

      const mockState = {
        players: { p1: mockPlayer },
        teams: {
          [mockPlayerTeamId]: {
            id: mockPlayerTeamId,
            coachIds: [],
          },
        },
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const effectivenessWithoutGoal = trainingService.previewTrainingEffectiveness('p1', 'moderate');
      const effectivenessWithGoal = trainingService.previewTrainingEffectiveness('p1', 'moderate', 'mechanical_ceiling');

      expect(effectivenessWithGoal).toBe(effectivenessWithoutGoal);
    });

    it('should return null for non-existent player', () => {
      const mockState = {
        players: {},
        teams: {},
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const effectiveness = trainingService.previewTrainingEffectiveness('non-existent', 'moderate');

      expect(effectiveness).toBeNull();
    });
  });

  describe('trainPlayerWithGoal', () => {
    it('should successfully train player with goal', () => {
      const mockPlayer: Player = {
        id: 'p1',
        name: 'Test Player',
        age: 20,
        teamId: mockPlayerTeamId,
        stats: {
          mechanics: 60,
          igl: 65,
          mental: 70,
          clutch: 68,
          vibes: 60,
          lurking: 72,
          entry: 75,
          support: 70,
          stamina: 65,
        },
        potential: 85,
        morale: 75,
        form: 70,
      } as Player;

      const mockState = {
        calendar: { currentDate: '2024-01-15' },
        playerTeamId: mockPlayerTeamId,
        players: { p1: mockPlayer },
        teams: {
          [mockPlayerTeamId]: {
            id: mockPlayerTeamId,
            coachIds: [],
          },
        },
        updatePlayer: vi.fn(),
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const result = trainingService.trainPlayerWithGoal('p1', 'mechanical_ceiling', 'moderate');

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.goal).toBe('mechanical_ceiling');
      expect(result.result?.focus).toBe('mechanics'); // Underlying focus
      expect(mockState.updatePlayer).toHaveBeenCalled();
    });

    it('should fail for non-existent player', () => {
      const mockState = {
        calendar: { currentDate: '2024-01-15' },
        playerTeamId: mockPlayerTeamId,
        players: {},
        teams: {},
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      const result = trainingService.trainPlayerWithGoal('non-existent', 'mechanical_ceiling', 'moderate');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail when weekly limit is reached', () => {
      const mockPlayer: Player = {
        id: 'p1',
        name: 'Test Player',
        age: 20,
        teamId: mockPlayerTeamId,
        stats: {
          mechanics: 60,
          igl: 65,
          mental: 70,
          clutch: 68,
          vibes: 60,
          lurking: 72,
          entry: 75,
          support: 70,
          stamina: 65,
        },
        potential: 85,
        morale: 75,
        form: 70,
      } as Player;

      const mockState = {
        calendar: { currentDate: '2024-01-15' },
        playerTeamId: mockPlayerTeamId,
        players: { p1: mockPlayer },
        teams: {
          [mockPlayerTeamId]: {
            id: mockPlayerTeamId,
            coachIds: [],
          },
        },
        updatePlayer: vi.fn(),
      };

      vi.mocked(useGameStore.getState).mockReturnValue(mockState as any);

      // Train player twice (max weekly sessions)
      trainingService.trainPlayerWithGoal('p1', 'mechanical_ceiling', 'moderate');
      trainingService.trainPlayerWithGoal('p1', 'decision_making', 'moderate');

      // Third attempt should fail
      const result = trainingService.trainPlayerWithGoal('p1', 'leadership_comms', 'moderate');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already trained');
    });
  });
});
