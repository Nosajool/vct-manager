// FreeAgentInterestEngine - Pure engine class for free agent interest calculations
// No store imports - pure functions only

import type { Player } from '../../types/player';
import type { Team } from '../../types/team';
import { playerGenerator } from './PlayerGenerator';
import type { ContractOffer } from './ContractNegotiator';
import { seededRandom, dailyInterestSeed } from '../../utils/seededRandom';

/**
 * FreeAgentInterestEngine - Handles free agent interest score calculations
 */
export class FreeAgentInterestEngine {
  /**
   * Calculate baseline interest score for a player toward a team (0-100)
   */
  calculateBaselineInterest(player: Player, team: Team): number {
    const overall = playerGenerator.calculateOverall(player.stats);

    // Star tier base interest
    let base: number;
    if (overall >= 80) {
      base = 30;
    } else if (overall >= 65) {
      base = 50;
    } else {
      base = 60;
    }

    // Team reputation modifier
    const winRate =
      team.standings.wins + team.standings.losses > 0
        ? team.standings.wins / (team.standings.wins + team.standings.losses)
        : 0.5;
    const reputationModifier =
      (team.reputation.fanbase / 100) * 15 + winRate * 10;

    // Region match bonus
    const regionBonus = player.region === team.region ? 15 : 0;

    const raw = base + reputationModifier + regionBonus;
    return Math.max(20, Math.min(80, raw));
  }

  /**
   * Apply daily interest drift using seeded randomness
   */
  applyDailyDrift(
    current: number,
    playerId: string,
    teamId: string,
    date: string,
    teamWinStreak: number,
    teamLossStreak: number
  ): number {
    const seed = dailyInterestSeed(playerId, teamId, date);
    const baseDrift = (seededRandom(seed) - 0.5) * 10; // -5 to +5

    const winBonus = teamWinStreak >= 2 ? 2 : 0;
    const lossPenalty = teamLossStreak >= 3 ? 3 : 0;

    return Math.max(0, Math.min(100, current + baseDrift + winBonus - lossPenalty));
  }

  /**
   * Get the score threshold a player needs to accept an offer
   */
  getAcceptanceThreshold(interest: number): number {
    if (interest >= 75) return 55;
    if (interest >= 60) return 63;
    if (interest >= 45) return 73;
    if (interest >= 30) return 83;
    return 93;
  }

  /**
   * Salary range returned by getMinimumAcceptableOffer
   */
  getMinimumAcceptableOffer(
    player: Player,
    _team: Team,
    interest: number,
    scoreOffer: (offer: ContractOffer) => number
  ): { minSalary: number; maxSalary: number } | null {
    const threshold = this.getAcceptanceThreshold(interest);

    // Determine salary search range from player expectations
    const overall = playerGenerator.calculateOverall(player.stats);
    let baseSalary: number;
    if (overall >= 85) {
      baseSalary = 800000;
    } else if (overall >= 78) {
      baseSalary = 400000;
    } else if (overall >= 70) {
      baseSalary = 200000;
    } else if (overall >= 60) {
      baseSalary = 100000;
    } else {
      baseSalary = 50000;
    }
    const ageModifier = player.age < 21 ? 0.8 : player.age > 26 ? 1.2 : 1.0;
    const potentialModifier =
      player.potential > 85 ? 1.3 : player.potential > 75 ? 1.1 : 1.0;
    const salaryImp = player.preferences.salaryImportance;
    const salaryImportanceMultiplier = salaryImp > 70 ? 1.2 : salaryImp < 40 ? 0.85 : 1.0;
    const adjustedBase = baseSalary * ageModifier * potentialModifier * salaryImportanceMultiplier;

    // Extended range to account for cold offer penalty
    const searchMin = Math.round(adjustedBase * 0.5);
    const searchMax = Math.round(adjustedBase * 3);

    // Binary search for minimum salary that passes threshold
    let low = searchMin;
    let high = searchMax;
    let foundSalary: number | null = null;

    for (let i = 0; i < 22; i++) {
      const mid = Math.round((low + high) / 2);
      const offer: ContractOffer = {
        salary: mid,
        signingBonus: 0,
        yearsRemaining: 1,
      };
      const score = scoreOffer(offer);
      if (score >= threshold) {
        foundSalary = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    if (foundSalary === null) return null; // No salary in range works at current interest

    return {
      minSalary: foundSalary,
      maxSalary: Math.round(foundSalary * 1.12),
    };
  }


  /**
   * Get a human-readable rejection flavor text
   */
  getRejectionFlavor(interest: number, finalScore: number, threshold: number): string {
    if (interest < 35) {
      return "He's not really aware of your organization yet.";
    }
    if (interest < 60 && finalScore < threshold - 10) {
      return "The offer doesn't reflect what he's looking for.";
    }
    if (interest >= 60 && finalScore < threshold) {
      return 'He wants to join but the terms need work.';
    }
    return "The overall package doesn't quite meet his expectations.";
  }
}

// Export singleton instance
export const freeAgentInterestEngine = new FreeAgentInterestEngine();
