// PlayerGenerator - Pure engine class for generating players
// No React or store dependencies - pure functions only

import type { Player, PlayerPersonality, PlayerStats, Region } from '../../types';
import {
  FIRST_NAMES,
  LAST_NAMES,
  NATIONALITIES,
  GAMING_NAMES,
  IGN_PREFIXES,
  IGN_SUFFIXES,
  STAT_RANGES,
  SALARY_RANGES,
} from '../../utils/constants';

/**
 * Options for generating a player
 */
export interface PlayerGeneratorOptions {
  region?: Region;
  minAge?: number;
  maxAge?: number;
  minOverall?: number;
  maxOverall?: number;
  teamId?: string | null;
  /** Force a specific IGN (used for roster players without stats) */
  forceName?: string;
}

/**
 * PlayerGenerator - Generates random players with realistic stats
 */
export class PlayerGenerator {
  private usedNames: Set<string> = new Set();

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get a random element from an array
   */
  private randomFrom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get a random number between min and max (inclusive)
   */
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate a random stat value with optional bias
   */
  private generateStat(min: number, max: number, bias: number = 0): number {
    // Use a slight bell curve distribution
    const r1 = Math.random();
    const r2 = Math.random();
    const gaussianRandom = (r1 + r2) / 2;

    const value = Math.floor(min + gaussianRandom * (max - min) + bias);
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Generate player name (real name)
   */
  private generateRealName(region: Region): { firstName: string; lastName: string } {
    const firstName = this.randomFrom(FIRST_NAMES[region]);
    const lastName = this.randomFrom(LAST_NAMES[region]);
    return { firstName, lastName };
  }

  /**
   * Generate in-game name (IGN)
   */
  private generateIGN(): string {
    // 70% chance of gaming-style name, 30% chance of modified real name
    if (Math.random() < 0.7) {
      const baseName = this.randomFrom(GAMING_NAMES);

      // Sometimes add prefix or suffix
      const addPrefix = Math.random() < 0.15;
      const addSuffix = Math.random() < 0.2;

      let ign = baseName;
      if (addPrefix) {
        const prefix = this.randomFrom(IGN_PREFIXES.filter((p) => p !== ''));
        ign = prefix + ign;
      }
      if (addSuffix) {
        const suffix = this.randomFrom(IGN_SUFFIXES.filter((s) => s !== ''));
        ign = ign + suffix;
      }

      // Ensure uniqueness
      let attempts = 0;
      while (this.usedNames.has(ign.toLowerCase()) && attempts < 100) {
        ign = baseName + this.randomBetween(1, 999);
        attempts++;
      }

      this.usedNames.add(ign.toLowerCase());
      return ign;
    } else {
      // Use a short version of a name
      const shortNames = ['Jay', 'Kay', 'Zee', 'Ess', 'Dee', 'Tee', 'Vee', 'Em'];
      let ign = this.randomFrom(shortNames) + this.randomBetween(1, 99);

      let attempts = 0;
      while (this.usedNames.has(ign.toLowerCase()) && attempts < 100) {
        ign = this.randomFrom(shortNames) + this.randomBetween(1, 999);
        attempts++;
      }

      this.usedNames.add(ign.toLowerCase());
      return ign;
    }
  }

  /**
   * Generate age with realistic distribution (peak 20-24)
   */
  private generateAge(minAge: number = 18, maxAge: number = 30): number {
    // Bias towards younger players (esports demographic)
    const r = Math.random();
    if (r < 0.3) {
      return this.randomBetween(minAge, 20); // 30% are 18-20
    } else if (r < 0.7) {
      return this.randomBetween(21, 24); // 40% are 21-24
    } else if (r < 0.9) {
      return this.randomBetween(25, 27); // 20% are 25-27
    } else {
      return this.randomBetween(28, maxAge); // 10% are 28-30
    }
  }

  /**
   * Calculate stat bias based on age
   * Peak performance is 22-25, younger players have higher potential
   */
  private getAgeBias(age: number): number {
    if (age >= 22 && age <= 25) return 5; // Peak age bonus
    if (age >= 20 && age <= 27) return 0; // Prime age
    if (age < 20) return -5; // Young, still developing
    return -10; // Older, declining
  }

  /**
   * Generate player stats
   */
  private generateStats(
    overall: number,
    age: number,
    role?: 'duelist' | 'initiator' | 'controller' | 'sentinel'
  ): PlayerStats {
    const ageBias = this.getAgeBias(age);
    const baseMin = Math.max(STAT_RANGES.min, overall - 20);
    const baseMax = Math.min(STAT_RANGES.max, overall + 15);

    // Role-based stat biases
    const roleBiases: Record<string, Partial<Record<keyof PlayerStats, number>>> = {
      duelist: { mechanics: 10, entry: 15, clutch: 5, lurking: -5, support: -10 },
      initiator: { igl: 5, support: 10, entry: 5, lurking: -5 },
      controller: { igl: 10, support: 15, mental: 5, entry: -10, lurking: -5 },
      sentinel: { support: 15, clutch: 10, lurking: 5, entry: -15 },
    };

    const biases = role ? roleBiases[role] : {};

    const generateStatValue = (stat: keyof PlayerStats): number => {
      const bias = (biases[stat] || 0) + ageBias;
      return this.generateStat(baseMin, baseMax, bias);
    };

    return {
      mechanics: generateStatValue('mechanics'),
      igl: generateStatValue('igl'),
      mental: generateStatValue('mental'),
      clutch: generateStatValue('clutch'),
      vibes: generateStatValue('vibes'),
      lurking: generateStatValue('lurking'),
      entry: generateStatValue('entry'),
      support: generateStatValue('support'),
      stamina: generateStatValue('stamina'),
    };
  }

  /**
   * Calculate overall rating from stats
   */
  calculateOverall(stats: PlayerStats): number {
    const weights = {
      mechanics: 0.2,
      igl: 0.1,
      mental: 0.1,
      clutch: 0.1,
      vibes: 0.05,
      lurking: 0.1,
      entry: 0.1,
      support: 0.1,
      stamina: 0.15,
    };

    let total = 0;
    for (const [stat, weight] of Object.entries(weights)) {
      total += stats[stat as keyof PlayerStats] * weight;
    }

    return Math.round(total);
  }

  /**
   * Generate potential based on age and stats
   */
  private generatePotential(age: number, overall: number): number {
    // Younger players have higher potential ceiling
    const ageFactor = Math.max(0, 28 - age) * 2;
    const basePotential = overall + this.randomBetween(5, 20);

    return Math.min(
      STAT_RANGES.potentialMax,
      Math.max(overall, basePotential + ageFactor)
    );
  }

  /**
   * Generate contract based on overall rating
   */
  private generateContract(
    overall: number,
    yearsRemaining?: number
  ): Player['contract'] | null {
    // 20% chance of being a free agent (no contract)
    if (Math.random() < 0.2) {
      return null;
    }

    let salaryRange = SALARY_RANGES.rookie;
    if (overall >= 85) {
      salaryRange = SALARY_RANGES.superstar;
    } else if (overall >= 78) {
      salaryRange = SALARY_RANGES.star;
    } else if (overall >= 70) {
      salaryRange = SALARY_RANGES.good;
    } else if (overall >= 60) {
      salaryRange = SALARY_RANGES.average;
    }

    const salary = this.randomBetween(salaryRange.min, salaryRange.max);
    const years = yearsRemaining ?? this.randomBetween(1, 3);
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + years);

    return {
      salary,
      bonusPerWin: Math.round(salary * 0.01), // 1% of salary per win
      yearsRemaining: years,
      endDate: endDate.toISOString(),
    };
  }

  /**
   * Generate career stats based on age
   */
  private generateCareerStats(age: number): Player['careerStats'] {
    const yearsPlaying = Math.max(0, age - 17);
    const matchesPerYear = this.randomBetween(40, 80);
    const matchesPlayed = yearsPlaying * matchesPerYear;

    const winRate = 0.4 + Math.random() * 0.3; // 40-70% win rate
    const wins = Math.round(matchesPlayed * winRate);
    const losses = matchesPlayed - wins;

    return {
      matchesPlayed,
      wins,
      losses,
      avgKills: 12 + Math.random() * 8, // 12-20
      avgDeaths: 10 + Math.random() * 6, // 10-16
      avgAssists: 2 + Math.random() * 5, // 2-7
      tournamentsWon: Math.floor(yearsPlaying * Math.random() * 0.5),
    };
  }

  /**
   * Generate initial season stats (empty stats for new season)
   */
  private generateSeasonStats(season: number = 1): Player['seasonStats'] {
    return {
      season,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      avgKills: 0,
      avgDeaths: 0,
      avgAssists: 0,
      tournamentsWon: 0,
    };
  }

  /**
   * Generate player preferences for AI negotiations
   */
  private generatePreferences(): Player['preferences'] {
    return {
      salaryImportance: this.randomBetween(30, 90),
      teamQualityImportance: this.randomBetween(40, 95),
      regionLoyalty: this.randomBetween(20, 80),
      preferredTeammates: [], // Will be populated later
    };
  }

  /**
   * Derive personality archetype from stats and age.
   * Thresholds are set at 70 (above average) for primary traits.
   */
  generatePersonality(stats: PlayerStats, age: number): PlayerPersonality {
    const { clutch, mental, vibes, support, mechanics, igl, entry } = stats;

    if (clutch >= 70 && mental >= 70) return 'BIG_STAGE';
    if (vibes >= 70 && support >= 70) return 'TEAM_FIRST';
    if (mechanics >= 70 && age <= 21) return 'FAME_SEEKER';
    if (igl >= 70 && entry < 55) return 'INTROVERT';
    return 'STABLE';
  }

  /**
   * Migration helper: assign personality to any player that is missing it.
   * Call once on game load to back-fill existing saves.
   */
  assignMissingPersonality(player: Player): Player {
    if (player.personality !== undefined) return player;
    return { ...player, personality: this.generatePersonality(player.stats, player.age) };
  }

  /**
   * Generate a single player
   */
  generatePlayer(options: PlayerGeneratorOptions = {}): Player {
    const {
      region = this.randomFrom(['Americas', 'EMEA', 'Pacific', 'China'] as Region[]),
      minAge = STAT_RANGES.youngAgeMin,
      maxAge = STAT_RANGES.oldAgeMax,
      minOverall = 50,
      maxOverall = 90,
      teamId = null,
      forceName,
    } = options;

    const age = this.generateAge(minAge, maxAge);
    const targetOverall = this.randomBetween(minOverall, maxOverall);
    const stats = this.generateStats(targetOverall, age);
    const overall = this.calculateOverall(stats);

    // Use forced name if provided, otherwise generate one
    let ign: string;
    if (forceName) {
      ign = forceName;
      this.usedNames.add(forceName.toLowerCase());
    } else {
      // Generate real name (for future use) and IGN
      this.generateRealName(region); // Reserved for future player profile feature
      ign = this.generateIGN();
    }

    return {
      id: this.generateId(),
      name: ign, // Use IGN as display name
      age,
      nationality: this.randomFrom(NATIONALITIES[region]),
      region,
      teamId,
      stats,
      form: this.randomBetween(60, 90),
      morale: this.randomBetween(65, 95),
      potential: this.generatePotential(age, overall),
      contract: teamId ? this.generateContract(overall) : null,
      careerStats: this.generateCareerStats(age),
      seasonStats: this.generateSeasonStats(),
      preferences: this.generatePreferences(),
      personality: this.generatePersonality(stats, age),
    };
  }

  /**
   * Generate multiple players
   */
  generatePlayers(count: number, options: PlayerGeneratorOptions = {}): Player[] {
    const players: Player[] = [];
    for (let i = 0; i < count; i++) {
      players.push(this.generatePlayer(options));
    }
    return players;
  }

  /**
   * Generate a team roster (5 starters + 2 reserves)
   */
  generateTeamRoster(
    teamId: string,
    region: Region,
    teamTier: 'top' | 'mid' | 'low' = 'mid'
  ): Player[] {
    // Tier affects overall rating ranges
    const overallRanges = {
      top: { min: 72, max: 92 },
      mid: { min: 62, max: 82 },
      low: { min: 52, max: 72 },
    };

    const range = overallRanges[teamTier];
    const roster: Player[] = [];

    // Generate 5 starters (slightly better stats)
    for (let i = 0; i < 5; i++) {
      roster.push(
        this.generatePlayer({
          region,
          teamId,
          minOverall: range.min + 5,
          maxOverall: range.max,
        })
      );
    }

    // Generate 2 reserves (slightly lower stats)
    for (let i = 0; i < 2; i++) {
      roster.push(
        this.generatePlayer({
          region,
          teamId,
          minOverall: range.min,
          maxOverall: range.max - 5,
        })
      );
    }

    return roster;
  }

  /**
   * Generate free agents for a region
   */
  generateFreeAgents(count: number, region: Region): Player[] {
    return this.generatePlayers(count, {
      region,
      teamId: null,
      minOverall: 45,
      maxOverall: 80,
    });
  }

  /**
   * Reset used names (call when starting a new game)
   */
  resetUsedNames(): void {
    this.usedNames.clear();
  }
}

// Export singleton instance for convenience
export const playerGenerator = new PlayerGenerator();
