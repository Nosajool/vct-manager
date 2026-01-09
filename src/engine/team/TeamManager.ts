// TeamManager - Pure engine class for team operations
// No React or store dependencies - pure functions only

import type { Team, Player, Region, TeamFinances, TeamChemistry } from '../../types';
import { VCT_TEAMS, ROSTER_SIZE } from '../../utils/constants';
import { playerGenerator } from '../player/PlayerGenerator';

/**
 * Team tier based on organization value
 */
export type TeamTier = 'top' | 'mid' | 'low';

/**
 * Options for generating a team
 */
export interface TeamGeneratorOptions {
  generatePlayers?: boolean;
}

/**
 * Result of team generation including players
 */
export interface GeneratedTeam {
  team: Team;
  players: Player[];
}

/**
 * TeamManager - Handles team generation and operations
 */
export class TeamManager {
  /**
   * Generate a unique team ID
   */
  private generateId(): string {
    return `team-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Determine team tier based on org value
   */
  getTeamTier(orgValue: number): TeamTier {
    if (orgValue >= 4000000) return 'top';
    if (orgValue >= 3000000) return 'mid';
    return 'low';
  }

  /**
   * Generate default team finances
   */
  private generateFinances(orgValue: number, fanbase: number): TeamFinances {
    // Scale finances based on org value and fanbase
    const scaleFactor = orgValue / 3000000;
    const fanFactor = fanbase / 100;

    return {
      balance: Math.round(orgValue * 0.4), // Start with 40% of org value

      monthlyRevenue: {
        sponsorships: Math.round(100000 * scaleFactor * fanFactor),
        merchandise: Math.round(30000 * scaleFactor * fanFactor),
        prizeWinnings: 0,
        fanDonations: Math.round(10000 * fanFactor),
      },

      monthlyExpenses: {
        playerSalaries: 0, // Will be calculated from roster
        coachSalaries: Math.round(20000 * scaleFactor),
        facilities: Math.round(15000 * scaleFactor),
        travel: Math.round(10000 * scaleFactor),
      },

      pendingTransactions: [],
      loans: [],
    };
  }

  /**
   * Generate default team chemistry
   */
  private generateChemistry(): TeamChemistry {
    return {
      overall: 50 + Math.floor(Math.random() * 30), // 50-80
      pairs: {},
    };
  }

  /**
   * Generate a single VCT team from template
   */
  generateTeamFromTemplate(
    template: { name: string; orgValue: number; fanbase: number },
    region: Region,
    options: TeamGeneratorOptions = {}
  ): GeneratedTeam {
    const teamId = this.generateId();
    const tier = this.getTeamTier(template.orgValue);

    // Generate players if requested
    let players: Player[] = [];
    let playerIds: string[] = [];
    let reservePlayerIds: string[] = [];

    if (options.generatePlayers !== false) {
      players = playerGenerator.generateTeamRoster(teamId, region, tier);

      // First 5 are starters, rest are reserves
      playerIds = players.slice(0, ROSTER_SIZE.active).map((p) => p.id);
      reservePlayerIds = players.slice(ROSTER_SIZE.active).map((p) => p.id);
    }

    const finances = this.generateFinances(template.orgValue, template.fanbase);

    // Calculate player salaries
    if (players.length > 0) {
      const totalSalaries = players.reduce((sum, p) => {
        return sum + (p.contract?.salary || 0);
      }, 0);
      finances.monthlyExpenses.playerSalaries = Math.round(totalSalaries / 12);
    }

    const team: Team = {
      id: teamId,
      name: template.name,
      region,
      playerIds,
      reservePlayerIds,
      coachIds: [],
      organizationValue: template.orgValue,
      fanbase: template.fanbase,
      chemistry: this.generateChemistry(),
      finances,
      standings: {
        wins: 0,
        losses: 0,
        roundDiff: 0,
        currentStreak: 0,
      },
    };

    return { team, players };
  }

  /**
   * Generate all teams for a region
   */
  generateRegionTeams(
    region: Region,
    options: TeamGeneratorOptions = {}
  ): GeneratedTeam[] {
    const templates = VCT_TEAMS[region];
    return templates.map((template) =>
      this.generateTeamFromTemplate(template, region, options)
    );
  }

  /**
   * Generate all teams for all regions
   */
  generateAllTeams(options: TeamGeneratorOptions = {}): {
    teams: Team[];
    players: Player[];
  } {
    const regions: Region[] = ['Americas', 'EMEA', 'Pacific', 'China'];
    const allTeams: Team[] = [];
    const allPlayers: Player[] = [];

    for (const region of regions) {
      const results = this.generateRegionTeams(region, options);
      for (const { team, players } of results) {
        allTeams.push(team);
        allPlayers.push(...players);
      }
    }

    return { teams: allTeams, players: allPlayers };
  }

  /**
   * Calculate team overall rating from players
   */
  calculateTeamOverall(players: Player[]): number {
    if (players.length === 0) return 0;

    const overalls = players.map((p) => {
      const stats = p.stats;
      return (
        stats.mechanics * 0.2 +
        stats.igl * 0.1 +
        stats.mental * 0.1 +
        stats.clutch * 0.1 +
        stats.vibes * 0.05 +
        stats.lurking * 0.1 +
        stats.entry * 0.1 +
        stats.support * 0.1 +
        stats.stamina * 0.15
      );
    });

    return Math.round(overalls.reduce((a, b) => a + b, 0) / overalls.length);
  }

  /**
   * Calculate team strength for match simulation
   */
  calculateTeamStrength(team: Team, players: Player[]): number {
    const teamPlayers = players.filter((p) => team.playerIds.includes(p.id));
    const baseOverall = this.calculateTeamOverall(teamPlayers);

    // Apply chemistry bonus (up to 10%)
    const chemistryBonus = (team.chemistry.overall / 100) * 0.1;

    // Apply form/morale factor
    const avgForm =
      teamPlayers.reduce((sum, p) => sum + p.form, 0) / teamPlayers.length;
    const avgMorale =
      teamPlayers.reduce((sum, p) => sum + p.morale, 0) / teamPlayers.length;
    const formMoraleFactor = ((avgForm + avgMorale) / 200) * 0.1;

    return baseOverall * (1 + chemistryBonus + formMoraleFactor);
  }

  /**
   * Calculate monthly profit/loss for a team
   */
  calculateMonthlyBalance(team: Team): number {
    const revenue = Object.values(team.finances.monthlyRevenue).reduce(
      (a, b) => a + b,
      0
    );
    const expenses = Object.values(team.finances.monthlyExpenses).reduce(
      (a, b) => a + b,
      0
    );
    return revenue - expenses;
  }

  /**
   * Check if team can afford a salary
   */
  canAffordSalary(team: Team, annualSalary: number): boolean {
    const monthlyIncrease = annualSalary / 12;
    const currentBalance = this.calculateMonthlyBalance(team);
    const projectedBalance = currentBalance - monthlyIncrease;

    // Must have positive monthly balance or enough reserves
    return projectedBalance > 0 || team.finances.balance > annualSalary * 2;
  }

  /**
   * Estimate salary offer for a player based on team finances
   */
  estimateSalaryOffer(team: Team, playerOverall: number): number {
    // Base salary on player overall
    let baseSalary: number;
    if (playerOverall >= 85) {
      baseSalary = 1000000 + (playerOverall - 85) * 100000;
    } else if (playerOverall >= 75) {
      baseSalary = 300000 + (playerOverall - 75) * 70000;
    } else if (playerOverall >= 65) {
      baseSalary = 100000 + (playerOverall - 65) * 20000;
    } else {
      baseSalary = 50000 + (playerOverall - 50) * 3000;
    }

    // Adjust based on team wealth
    const wealthFactor = team.organizationValue / 3000000;
    return Math.round(baseSalary * wealthFactor);
  }
}

// Export singleton instance
export const teamManager = new TeamManager();
