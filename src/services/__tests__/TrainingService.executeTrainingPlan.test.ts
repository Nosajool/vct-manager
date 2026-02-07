// Test for TrainingService.executeTrainingPlan
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrainingService } from '../TrainingService';
import { useGameStore } from '../../store';
import type { TrainingPlan, Player } from '../../types';

// Mock the store
vi.mock('../../store', () => ({
  useGameStore: {
    getState: vi.fn(),
  },
}));

// Mock the playerDevelopment engine
vi.mock('../../engine/player', () => ({
  playerDevelopment: {
    trainPlayerWithGoal: vi.fn((player, goal, intensity) => ({
      playerId: player.id,
      focus: 'balanced',
      goal,
      statImprovements: { mechanics: 1 },
      effectiveness: 75,
      moraleChange: 5,
      fatigueIncrease: 10,
      factors: {
        coachBonus: 0,
        playerMorale: 80,
        playerAge: 20,
        playerPotential: 85,
      },
    })),
    updatePlayerAfterTraining: vi.fn((player, result) => ({
      ...player,
      stats: {
        ...player.stats,
        mechanics: player.stats.mechanics + 1,
      },
      morale: player.morale + result.moraleChange,
    })),
    canPlayerTrain: vi.fn(() => ({
      canTrain: true,
      reason: undefined,
    })),
  },
  PlayerDevelopment: {
    getGoalInfo: vi.fn(),
    getAllGoals: vi.fn(),
  },
}));

describe('TrainingService - executeTrainingPlan', () => {
  let trainingService: TrainingService;
  let mockPlayer1: Player;
  let mockPlayer2: Player;

  beforeEach(() => {
    trainingService = new TrainingService();

    mockPlayer1 = {
      id: 'player1',
      teamId: 'team1',
      stats: {
        mechanics: 70,
        igl: 60,
        mental: 65,
        clutch: 68,
        vibes: 75,
        lurking: 62,
        entry: 72,
        support: 64,
        stamina: 70,
      },
      morale: 80,
    } as Player;

    mockPlayer2 = {
      id: 'player2',
      teamId: 'team1',
      stats: {
        mechanics: 65,
        igl: 75,
        mental: 70,
        clutch: 66,
        vibes: 72,
        lurking: 60,
        entry: 64,
        support: 78,
        stamina: 68,
      },
      morale: 85,
    } as Player;

    // Mock store state
    vi.mocked(useGameStore.getState).mockReturnValue({
      players: {
        player1: mockPlayer1,
        player2: mockPlayer2,
      },
      playerTeamId: 'team1',
      teams: {
        team1: {
          id: 'team1',
          coachIds: [],
        },
      },
      updatePlayer: vi.fn(),
      calendar: {
        currentDate: '2024-01-15',
      },
    } as any);
  });

  it('should execute training plan with per-player assignments', () => {
    // Create a training plan with different goals and intensities per player
    const plan: TrainingPlan = new Map([
      [
        'player1',
        {
          playerId: 'player1',
          goal: 'mechanical_ceiling',
          intensity: 'intense',
          isAutoAssigned: false,
        },
      ],
      [
        'player2',
        {
          playerId: 'player2',
          goal: 'leadership_comms',
          intensity: 'moderate',
          isAutoAssigned: true,
        },
      ],
    ]);

    const result = trainingService.executeTrainingPlan(plan);

    // Should return results for both players
    expect(result.results).toHaveLength(2);

    // Check player 1 result
    const player1Result = result.results.find((r) => r.playerId === 'player1');
    expect(player1Result).toBeDefined();
    expect(player1Result?.success).toBe(true);
    expect(player1Result?.result?.goal).toBe('mechanical_ceiling');

    // Check player 2 result
    const player2Result = result.results.find((r) => r.playerId === 'player2');
    expect(player2Result).toBeDefined();
    expect(player2Result?.success).toBe(true);
    expect(player2Result?.result?.goal).toBe('leadership_comms');
  });

  it('should handle empty training plan', () => {
    const plan: TrainingPlan = new Map();

    const result = trainingService.executeTrainingPlan(plan);

    expect(result.results).toHaveLength(0);
  });

  it('should handle invalid player in plan', () => {
    const plan: TrainingPlan = new Map([
      [
        'invalid-player',
        {
          playerId: 'invalid-player',
          goal: 'mechanical_ceiling',
          intensity: 'intense',
          isAutoAssigned: false,
        },
      ],
    ]);

    const result = trainingService.executeTrainingPlan(plan);

    expect(result.results).toHaveLength(1);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toBe('Player not found');
  });

  it('should handle mixed valid and invalid players', () => {
    const plan: TrainingPlan = new Map([
      [
        'player1',
        {
          playerId: 'player1',
          goal: 'mechanical_ceiling',
          intensity: 'intense',
          isAutoAssigned: false,
        },
      ],
      [
        'invalid-player',
        {
          playerId: 'invalid-player',
          goal: 'decision_making',
          intensity: 'moderate',
          isAutoAssigned: false,
        },
      ],
    ]);

    const result = trainingService.executeTrainingPlan(plan);

    expect(result.results).toHaveLength(2);

    const player1Result = result.results.find((r) => r.playerId === 'player1');
    expect(player1Result?.success).toBe(true);

    const invalidResult = result.results.find((r) => r.playerId === 'invalid-player');
    expect(invalidResult?.success).toBe(false);
    expect(invalidResult?.error).toBe('Player not found');
  });
});
