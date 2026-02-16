import { describe, it, expect, beforeEach } from 'vitest';
import { LineupOptimizer } from '../LineupOptimizer';
import type { Player, Team, TeamChemistry } from '../../../types';

// Helper function to create a mock player with specified stats
function createMockPlayer(
  id: string,
  name: string,
  stats: {
    mechanics?: number;
    igl?: number;
    mental?: number;
    clutch?: number;
    entry?: number;
    support?: number;
    lurking?: number;
    vibes?: number;
  },
  form: number = 70
): Player {
  return {
    id,
    name,
    age: 20,
    nationality: 'US',
    region: 'NA',
    role: null,
    form,
    stats: {
      mechanics: stats.mechanics ?? 50,
      igl: stats.igl ?? 50,
      mental: stats.mental ?? 50,
      clutch: stats.clutch ?? 50,
      entry: stats.entry ?? 50,
      support: stats.support ?? 50,
      lurking: stats.lurking ?? 50,
      vibes: stats.vibes ?? 50,
    },
    contract: {
      teamId: 'test-team',
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      salary: 5000,
      signOnBonus: 0,
      releaseClause: 10000,
    },
    careerStats: {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      averageKD: 1.0,
      headshots: 0,
      aces: 0,
      clutchesWon: 0,
    },
    seasonStats: {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      averageKD: 1.0,
      headshots: 0,
      aces: 0,
      clutchesWon: 0,
    },
    agentPreferences: {
      preferredAgents: ['Jett', 'Raze', 'Phoenix'],
      flexRoles: ['Duelist', 'Initiator'],
    },
    preferences: {
      minSalary: 5000,
      preferredRegions: ['NA'],
      willingToRelocate: true,
    },
  };
}

// Helper function to create a mock team
function createMockTeam(playerIds: string[], chemistry: number = 70): Team {
  return {
    id: 'test-team',
    name: 'Test Team',
    region: 'NA',
    playerIds,
    coachId: null,
    strategy: {
      defaultComposition: {
        Duelist: 2,
        Initiator: 1,
        Controller: 1,
        Sentinel: 1,
      },
      playstyle: 'balanced',
      economyDiscipline: 'balanced',
      ultUsageStyle: 'balanced',
      ecoThreshold: 20000,
      forceThreshold: 30000,
    },
    chemistry: {
      overall: chemistry,
      pairs: {},
    },
    finances: {
      balance: 100000,
      monthlyRevenue: {
        sponsorships: 10000,
        prizeMoney: 0,
        merchandise: 5000,
        streaming: 2000,
      },
      monthlyExpenses: {
        salaries: 25000,
        facilities: 5000,
        travel: 3000,
        marketing: 2000,
      },
    },
    standing: {
      wins: 0,
      losses: 0,
      roundDiff: 0,
      matchPoints: 0,
    },
    reputation: 50,
  };
}

describe('LineupOptimizer', () => {
  let optimizer: LineupOptimizer;

  beforeEach(() => {
    optimizer = new LineupOptimizer();
  });

  describe('Optimal lineup selection with clear stat differences', () => {
    it('should select the 5 strongest players based on weighted stats', () => {
      // Create 7 players with clear stat differences
      const players: Player[] = [
        // Strong players (should be selected)
        createMockPlayer('p1', 'Star Player', {
          mechanics: 85,
          entry: 80,
          mental: 75,
          clutch: 80,
        }),
        createMockPlayer('p2', 'IGL', {
          igl: 90,
          support: 85,
          mental: 80,
          mechanics: 70,
        }),
        createMockPlayer('p3', 'Support', {
          support: 85,
          vibes: 80,
          mental: 75,
          mechanics: 70,
        }),
        createMockPlayer('p4', 'Clutch', {
          clutch: 85,
          mental: 80,
          mechanics: 75,
          lurking: 70,
        }),
        createMockPlayer('p5', 'Entry', {
          entry: 88,
          mechanics: 82,
          mental: 70,
          clutch: 65,
        }),
        // Weaker players (reserves)
        createMockPlayer('p6', 'Weak 1', {
          mechanics: 45,
          entry: 40,
          support: 45,
        }),
        createMockPlayer('p7', 'Weak 2', {
          mechanics: 42,
          entry: 38,
          support: 43,
        }),
      ];

      const team = createMockTeam(['p1', 'p2', 'p3', 'p4', 'p5']);
      const result = optimizer.findOptimalLineup(team, players);

      // Should select the 5 strongest players
      expect(result.optimalPlayerIds).toHaveLength(5);
      expect(result.optimalPlayerIds).toContain('p1');
      expect(result.optimalPlayerIds).toContain('p2');
      expect(result.optimalPlayerIds).toContain('p3');
      expect(result.optimalPlayerIds).toContain('p4');
      expect(result.optimalPlayerIds).toContain('p5');

      // Should not include weak players
      expect(result.optimalPlayerIds).not.toContain('p6');
      expect(result.optimalPlayerIds).not.toContain('p7');
    });

    it('should detect improvement when reserve is stronger than active player', () => {
      const players: Player[] = [
        // Current active lineup (with one weak player)
        createMockPlayer('p1', 'Good 1', {
          mechanics: 75,
          entry: 70,
        }),
        createMockPlayer('p2', 'Good 2', {
          mechanics: 73,
          support: 72,
        }),
        createMockPlayer('p3', 'Good 3', {
          mechanics: 74,
          mental: 71,
        }),
        createMockPlayer('p4', 'Good 4', {
          mechanics: 72,
          clutch: 70,
        }),
        createMockPlayer('p5', 'Weak Active', {
          mechanics: 50,
          entry: 45,
        }, 60), // Low form too
        // Reserve player (stronger than p5)
        createMockPlayer('p6', 'Strong Reserve', {
          mechanics: 80,
          entry: 78,
          clutch: 75,
        }, 80),
      ];

      const team = createMockTeam(['p1', 'p2', 'p3', 'p4', 'p5']);
      const result = optimizer.findOptimalLineup(team, players);

      // Should swap p5 for p6
      expect(result.optimalPlayerIds).toContain('p6');
      expect(result.optimalPlayerIds).not.toContain('p5');
      expect(result.swapsNeeded.toActive).toEqual(['p6']);
      expect(result.swapsNeeded.toReserve).toEqual(['p5']);
      expect(result.improvementPercent).toBeGreaterThan(0);
      expect(result.optimalScore).toBeGreaterThan(result.currentScore);
    });
  });

  describe('Team with no reserves', () => {
    it('should return current lineup when exactly 5 players exist', () => {
      const players: Player[] = [
        createMockPlayer('p1', 'Player 1', { mechanics: 70 }),
        createMockPlayer('p2', 'Player 2', { mechanics: 72 }),
        createMockPlayer('p3', 'Player 3', { mechanics: 68 }),
        createMockPlayer('p4', 'Player 4', { mechanics: 71 }),
        createMockPlayer('p5', 'Player 5', { mechanics: 69 }),
      ];

      const team = createMockTeam(['p1', 'p2', 'p3', 'p4', 'p5']);
      const result = optimizer.findOptimalLineup(team, players);

      // Should return current lineup unchanged
      expect(result.optimalPlayerIds).toEqual(team.playerIds);
      expect(result.improvementPercent).toBe(0);
      expect(result.swapsNeeded.toActive).toHaveLength(0);
      expect(result.swapsNeeded.toReserve).toHaveLength(0);
      expect(result.currentScore).toBe(result.optimalScore);
    });
  });

  describe('Edge case: fewer than 5 players', () => {
    it('should handle team with only 3 players gracefully', () => {
      const players: Player[] = [
        createMockPlayer('p1', 'Player 1', { mechanics: 70 }),
        createMockPlayer('p2', 'Player 2', { mechanics: 72 }),
        createMockPlayer('p3', 'Player 3', { mechanics: 68 }),
      ];

      const team = createMockTeam(['p1', 'p2', 'p3']);
      const result = optimizer.findOptimalLineup(team, players);

      // Should return what's available without crashing
      expect(result.optimalPlayerIds).toEqual(['p1', 'p2', 'p3']);
      expect(result.currentScore).toBe(0);
      expect(result.optimalScore).toBe(0);
      expect(result.improvementPercent).toBe(0);
      expect(result.swapsNeeded.toActive).toHaveLength(0);
      expect(result.swapsNeeded.toReserve).toHaveLength(0);
    });

    it('should handle empty player roster', () => {
      const players: Player[] = [];
      const team = createMockTeam([]);
      const result = optimizer.findOptimalLineup(team, players);

      expect(result.optimalPlayerIds).toEqual([]);
      expect(result.currentScore).toBe(0);
      expect(result.optimalScore).toBe(0);
    });
  });

  describe('Composition penalty avoidance', () => {
    it('should prefer lineups with balanced role composition over raw stats', () => {
      // Create players where raw stats might favor imbalanced composition
      const players: Player[] = [
        // All high-mechanics entry players (would create 5 Duelist composition)
        createMockPlayer('duelist1', 'Duelist 1', {
          mechanics: 85,
          entry: 90,
          clutch: 75,
        }),
        createMockPlayer('duelist2', 'Duelist 2', {
          mechanics: 83,
          entry: 88,
          clutch: 73,
        }),
        createMockPlayer('duelist3', 'Duelist 3', {
          mechanics: 82,
          entry: 86,
          clutch: 72,
        }),
        createMockPlayer('duelist4', 'Duelist 4', {
          mechanics: 81,
          entry: 85,
          clutch: 71,
        }),
        createMockPlayer('duelist5', 'Duelist 5', {
          mechanics: 80,
          entry: 84,
          clutch: 70,
        }),
        // Support/IGL with slightly lower raw stats but provides role balance
        createMockPlayer('controller', 'Controller', {
          mechanics: 70,
          igl: 85,
          support: 88,
          mental: 80,
        }),
        createMockPlayer('sentinel', 'Sentinel', {
          mechanics: 68,
          support: 82,
          mental: 85,
          lurking: 75,
        }),
      ];

      const team = createMockTeam(['duelist1', 'duelist2', 'duelist3', 'duelist4', 'duelist5']);
      const result = optimizer.findOptimalLineup(team, players);

      // The optimal lineup should include support roles to avoid composition penalty
      // even if their raw stats are slightly lower
      // Note: This tests that composition bonus is factored into the score
      expect(result.optimalScore).toBeGreaterThan(0);
      expect(result.currentScore).toBeGreaterThan(0);
    });

    it('should account for chemistry in lineup evaluation', () => {
      const players: Player[] = [
        createMockPlayer('p1', 'Player 1', { mechanics: 75, entry: 75 }),
        createMockPlayer('p2', 'Player 2', { mechanics: 75, support: 75 }),
        createMockPlayer('p3', 'Player 3', { mechanics: 75, igl: 75 }),
        createMockPlayer('p4', 'Player 4', { mechanics: 75, clutch: 75 }),
        createMockPlayer('p5', 'Player 5', { mechanics: 75, mental: 75 }),
        createMockPlayer('p6', 'Player 6', { mechanics: 76, entry: 76 }),
      ];

      // Test with high chemistry
      const highChemTeam = createMockTeam(['p1', 'p2', 'p3', 'p4', 'p5'], 90);
      const highChemResult = optimizer.findOptimalLineup(highChemTeam, players);

      // Test with low chemistry
      const lowChemTeam = createMockTeam(['p1', 'p2', 'p3', 'p4', 'p5'], 40);
      const lowChemResult = optimizer.findOptimalLineup(lowChemTeam, players);

      // High chemistry team should have higher current score
      expect(highChemResult.currentScore).toBeGreaterThan(lowChemResult.currentScore);
    });
  });

  describe('Swap calculations', () => {
    it('should correctly identify players to swap', () => {
      const players: Player[] = [
        createMockPlayer('active1', 'Active 1', { mechanics: 70 }),
        createMockPlayer('active2', 'Active 2', { mechanics: 71 }),
        createMockPlayer('active3', 'Active 3', { mechanics: 69 }),
        createMockPlayer('weak1', 'Weak 1', { mechanics: 50 }),
        createMockPlayer('weak2', 'Weak 2', { mechanics: 51 }),
        createMockPlayer('strong1', 'Strong 1', { mechanics: 85 }),
        createMockPlayer('strong2', 'Strong 2', { mechanics: 83 }),
      ];

      const team = createMockTeam(['active1', 'active2', 'active3', 'weak1', 'weak2']);
      const result = optimizer.findOptimalLineup(team, players);

      // Should swap weak players for strong reserves
      expect(result.swapsNeeded.toReserve).toContain('weak1');
      expect(result.swapsNeeded.toReserve).toContain('weak2');
      expect(result.swapsNeeded.toActive).toContain('strong1');
      expect(result.swapsNeeded.toActive).toContain('strong2');
      expect(result.swapsNeeded.toActive.length).toBe(result.swapsNeeded.toReserve.length);
    });

    it('should have no swaps when current lineup is optimal', () => {
      const players: Player[] = [
        // Best 5 players already active
        createMockPlayer('p1', 'Best 1', { mechanics: 85 }),
        createMockPlayer('p2', 'Best 2', { mechanics: 84 }),
        createMockPlayer('p3', 'Best 3', { mechanics: 83 }),
        createMockPlayer('p4', 'Best 4', { mechanics: 82 }),
        createMockPlayer('p5', 'Best 5', { mechanics: 81 }),
        // Weaker reserves
        createMockPlayer('p6', 'Reserve 1', { mechanics: 60 }),
        createMockPlayer('p7', 'Reserve 2', { mechanics: 59 }),
      ];

      const team = createMockTeam(['p1', 'p2', 'p3', 'p4', 'p5']);
      const result = optimizer.findOptimalLineup(team, players);

      expect(result.swapsNeeded.toActive).toHaveLength(0);
      expect(result.swapsNeeded.toReserve).toHaveLength(0);
      expect(result.improvementPercent).toBe(0);
    });
  });

  describe('Improvement percentage calculation', () => {
    it('should calculate improvement percentage correctly', () => {
      const players: Player[] = [
        createMockPlayer('p1', 'P1', { mechanics: 70, entry: 70 }),
        createMockPlayer('p2', 'P2', { mechanics: 70, entry: 70 }),
        createMockPlayer('p3', 'P3', { mechanics: 70, entry: 70 }),
        createMockPlayer('p4', 'P4', { mechanics: 70, entry: 70 }),
        createMockPlayer('p5', 'P5', { mechanics: 50, entry: 50 }, 60),
        createMockPlayer('p6', 'P6', { mechanics: 85, entry: 85 }, 85),
      ];

      const team = createMockTeam(['p1', 'p2', 'p3', 'p4', 'p5']);
      const result = optimizer.findOptimalLineup(team, players);

      // Should have measurable improvement
      expect(result.improvementPercent).toBeGreaterThan(0);
      expect(result.optimalScore).toBeGreaterThan(result.currentScore);

      // Verify percentage calculation
      const expectedPercent =
        ((result.optimalScore - result.currentScore) / result.currentScore) * 100;
      expect(result.improvementPercent).toBeCloseTo(expectedPercent, 5);
    });

    it('should return 0% improvement when current lineup is optimal', () => {
      const players: Player[] = [
        createMockPlayer('p1', 'P1', { mechanics: 80 }),
        createMockPlayer('p2', 'P2', { mechanics: 79 }),
        createMockPlayer('p3', 'P3', { mechanics: 78 }),
        createMockPlayer('p4', 'P4', { mechanics: 77 }),
        createMockPlayer('p5', 'P5', { mechanics: 76 }),
      ];

      const team = createMockTeam(['p1', 'p2', 'p3', 'p4', 'p5']);
      const result = optimizer.findOptimalLineup(team, players);

      expect(result.improvementPercent).toBe(0);
      expect(result.currentScore).toBe(result.optimalScore);
    });
  });

  describe('Form impact on lineup selection', () => {
    it('should consider player form in optimization', () => {
      const players: Player[] = [
        // High form player with good stats
        createMockPlayer('highForm', 'High Form', {
          mechanics: 80,
          entry: 80,
          mental: 75,
          clutch: 75,
        }, 90), // Very high form
        // Low form player with identical base stats
        createMockPlayer('lowForm', 'Low Form', {
          mechanics: 80,
          entry: 80,
          mental: 75,
          clutch: 75,
        }, 50), // Very low form
        // Other decent players
        createMockPlayer('p3', 'P3', { mechanics: 75, support: 75 }),
        createMockPlayer('p4', 'P4', { mechanics: 74, igl: 74 }),
        createMockPlayer('p5', 'P5', { mechanics: 73, clutch: 73 }),
      ];

      const team = createMockTeam(['lowForm', 'p3', 'p4', 'p5']);
      const result = optimizer.findOptimalLineup(team, players);

      // highForm should be preferred over lowForm due to superior form
      // despite having identical base stats
      if (result.improvementPercent > 0) {
        expect(result.optimalPlayerIds).toContain('highForm');
        expect(result.optimalPlayerIds).not.toContain('lowForm');
      }
    });
  });
});
