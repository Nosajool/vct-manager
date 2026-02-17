// ContractNegotiator - Pure engine class for contract negotiations
// No React or store dependencies - pure functions only

import type { Player, Team, PlayerContract } from '../../types';
import { playerGenerator } from './PlayerGenerator';

/**
 * Contract offer from a team
 */
export interface ContractOffer {
  salary: number;
  signingBonus: number;
  yearsRemaining: number;
  bonusPerWin?: number;
}

/**
 * Result of evaluating a contract offer
 */
export interface NegotiationResult {
  accepted: boolean;
  acceptanceProbability: number;
  reason: string;
  counterOffer?: ContractOffer;
  factors: NegotiationFactors;
}

/**
 * Breakdown of factors affecting negotiation
 */
export interface NegotiationFactors {
  salaryFactor: number;        // -1 to 1: how good the salary is
  teamQualityFactor: number;   // -1 to 1: how attractive the team is
  regionFactor: number;        // -1 to 1: region preference match
  overallScore: number;        // 0-100: combined weighted score
}

/**
 * Expected salary range for a player based on overall rating
 */
export interface SalaryExpectation {
  minimum: number;
  expected: number;
  maximum: number;
}

/**
 * ContractNegotiator - Handles contract negotiations between players and teams
 */
export class ContractNegotiator {
  /**
   * Calculate expected salary based on player's overall rating
   */
  getSalaryExpectation(player: Player): SalaryExpectation {
    const overall = playerGenerator.calculateOverall(player.stats);

    // Base salary tiers
    let baseSalary: number;
    if (overall >= 85) {
      baseSalary = 800000; // Superstar tier
    } else if (overall >= 78) {
      baseSalary = 400000; // Star tier
    } else if (overall >= 70) {
      baseSalary = 200000; // Good tier
    } else if (overall >= 60) {
      baseSalary = 100000; // Average tier
    } else {
      baseSalary = 50000;  // Rookie tier
    }

    // Age modifier - younger players may accept less, veterans want more
    const ageModifier = player.age < 21 ? 0.8 : player.age > 26 ? 1.2 : 1.0;

    // Potential modifier - high potential players want more
    const potentialModifier = player.potential > 85 ? 1.3 : player.potential > 75 ? 1.1 : 1.0;

    const adjustedBase = baseSalary * ageModifier * potentialModifier;

    return {
      minimum: Math.round(adjustedBase * 0.6),
      expected: Math.round(adjustedBase),
      maximum: Math.round(adjustedBase * 1.5),
    };
  }

  /**
   * Calculate team quality score (0-100)
   */
  private calculateTeamQuality(team: Team): number {
    // Factors: organization value, fanbase, standings
    const orgScore = Math.min(100, team.organizationValue / 10000000 * 50);
    const fanScore = team.reputation.fanbase / 100 * 30;

    const winRate = team.standings.wins + team.standings.losses > 0
      ? team.standings.wins / (team.standings.wins + team.standings.losses)
      : 0.5;
    const performanceScore = winRate * 20;

    return Math.round(orgScore + fanScore + performanceScore);
  }

  /**
   * Evaluate a contract offer
   */
  evaluateOffer(
    player: Player,
    offer: ContractOffer,
    team: Team
  ): NegotiationResult {
    const { preferences } = player;
    const salaryExpectation = this.getSalaryExpectation(player);
    const teamQuality = this.calculateTeamQuality(team);

    // Calculate salary factor (-1 to 1)
    let salaryFactor: number;
    if (offer.salary >= salaryExpectation.expected) {
      // Above expected - positive factor
      const aboveRatio = (offer.salary - salaryExpectation.expected) /
        (salaryExpectation.maximum - salaryExpectation.expected);
      salaryFactor = Math.min(1, aboveRatio);
    } else if (offer.salary >= salaryExpectation.minimum) {
      // Between minimum and expected - slight negative
      const belowRatio = (offer.salary - salaryExpectation.minimum) /
        (salaryExpectation.expected - salaryExpectation.minimum);
      salaryFactor = belowRatio - 1;
    } else {
      // Below minimum - strong negative
      salaryFactor = -1;
    }

    // Signing bonus factor (add to salary factor)
    const bonusFactor = Math.min(0.3, offer.signingBonus / salaryExpectation.expected * 0.5);
    salaryFactor = Math.min(1, salaryFactor + bonusFactor);

    // Calculate team quality factor (-1 to 1)
    // 50 is considered average
    const teamQualityFactor = (teamQuality - 50) / 50;

    // Calculate region factor (-1 to 1)
    const regionMatch = player.region === team.region;
    const regionFactor = regionMatch ? 0.5 : -0.3;

    // Calculate weighted overall score (0-100)
    // Normalize factors from [-1, 1] to [0, 100] and apply weights
    const normalizedSalary = (salaryFactor + 1) * 50;
    const normalizedTeamQuality = (teamQualityFactor + 1) * 50;
    const normalizedRegion = (regionFactor + 1) * 50;

    // Weight by player preferences (normalized to sum to 1)
    const totalImportance = preferences.salaryImportance +
      preferences.teamQualityImportance +
      preferences.regionLoyalty;

    const salaryWeight = preferences.salaryImportance / totalImportance;
    const teamQualityWeight = preferences.teamQualityImportance / totalImportance;
    const regionWeight = preferences.regionLoyalty / totalImportance;

    const overallScore =
      normalizedSalary * salaryWeight +
      normalizedTeamQuality * teamQualityWeight +
      normalizedRegion * regionWeight;

    // Contract length factor - players generally prefer shorter contracts unless salary is high
    const contractLengthPenalty = offer.yearsRemaining > 2 && offer.salary < salaryExpectation.expected
      ? (offer.yearsRemaining - 2) * 5
      : 0;

    const finalScore = Math.max(0, Math.min(100, overallScore - contractLengthPenalty));

    // Calculate acceptance probability
    // Score 70+ = high chance, 50-70 = medium, below 50 = low
    let acceptanceProbability: number;
    if (finalScore >= 75) {
      acceptanceProbability = 0.8 + (finalScore - 75) / 25 * 0.2; // 80-100%
    } else if (finalScore >= 60) {
      acceptanceProbability = 0.5 + (finalScore - 60) / 15 * 0.3; // 50-80%
    } else if (finalScore >= 45) {
      acceptanceProbability = 0.2 + (finalScore - 45) / 15 * 0.3; // 20-50%
    } else {
      acceptanceProbability = Math.max(0.05, finalScore / 45 * 0.2); // 5-20%
    }

    // Determine acceptance (with some randomness)
    const roll = Math.random();
    const accepted = roll < acceptanceProbability;

    // Generate reason
    const reason = this.generateReason(
      accepted,
      salaryFactor,
      teamQualityFactor,
      regionFactor,
      offer,
      salaryExpectation
    );

    // Generate counter-offer if rejected
    let counterOffer: ContractOffer | undefined;
    if (!accepted && acceptanceProbability > 0.15) {
      counterOffer = this.generateCounterOffer(player, offer, salaryExpectation);
    }

    return {
      accepted,
      acceptanceProbability,
      reason,
      counterOffer,
      factors: {
        salaryFactor,
        teamQualityFactor,
        regionFactor,
        overallScore: finalScore,
      },
    };
  }

  /**
   * Generate a human-readable reason for the decision
   */
  private generateReason(
    accepted: boolean,
    salaryFactor: number,
    teamQualityFactor: number,
    regionFactor: number,
    offer: ContractOffer,
    salaryExpectation: SalaryExpectation
  ): string {
    if (accepted) {
      if (salaryFactor > 0.5) {
        return 'The salary offer exceeded my expectations. I\'m excited to join!';
      }
      if (teamQualityFactor > 0.3) {
        return 'This is a great organization with a winning culture. I\'m in!';
      }
      if (regionFactor > 0.3) {
        return 'I\'m happy to stay in my preferred region. Let\'s do this!';
      }
      return 'This is a fair offer and I\'m ready to compete.';
    }

    // Rejection reasons
    if (offer.salary < salaryExpectation.minimum) {
      return `The salary is below my minimum expectations. I need at least $${Math.round(salaryExpectation.minimum / 1000)}K.`;
    }
    if (salaryFactor < -0.3) {
      return `I was hoping for something closer to $${Math.round(salaryExpectation.expected / 1000)}K. Can we revisit the salary?`;
    }
    if (teamQualityFactor < -0.3) {
      return 'I\'m looking for a team with stronger competitive potential.';
    }
    if (regionFactor < 0) {
      return 'I\'d prefer to stay closer to my home region if possible.';
    }
    if (offer.yearsRemaining > 3) {
      return 'I\'m not ready to commit to such a long contract.';
    }
    return 'The overall package doesn\'t quite meet my expectations.';
  }

  /**
   * Generate a counter-offer when a player rejects
   */
  private generateCounterOffer(
    _player: Player,
    originalOffer: ContractOffer,
    salaryExpectation: SalaryExpectation
  ): ContractOffer {
    // Counter with something between expected and maximum
    const counterSalary = Math.round(
      salaryExpectation.expected +
      (salaryExpectation.maximum - salaryExpectation.expected) * 0.3
    );

    // Request signing bonus if not offered
    const counterBonus = originalOffer.signingBonus < salaryExpectation.expected * 0.1
      ? Math.round(salaryExpectation.expected * 0.15)
      : originalOffer.signingBonus;

    // Prefer shorter contracts
    const counterYears = Math.min(originalOffer.yearsRemaining, 2);

    return {
      salary: Math.max(counterSalary, originalOffer.salary),
      signingBonus: counterBonus,
      yearsRemaining: counterYears,
      bonusPerWin: Math.round(counterSalary * 0.01),
    };
  }

  /**
   * Calculate the buyout/release cost for an existing contract
   */
  calculateReleaseCost(player: Player): number {
    if (!player.contract) return 0;

    // Release cost = remaining salary * years remaining * 0.5 (50% buyout)
    const remainingSalary = player.contract.salary * player.contract.yearsRemaining;
    return Math.round(remainingSalary * 0.5);
  }

  /**
   * Validate that a roster has space for a new player
   */
  validateRosterSpace(
    team: Team,
    position: 'active' | 'reserve'
  ): { valid: boolean; reason?: string } {
    const totalRoster = team.playerIds.length + team.reservePlayerIds.length;

    if (position === 'active') {
      if (team.playerIds.length >= 5) {
        return {
          valid: false,
          reason: 'Active roster is full (5/5). Move a player to reserve or release someone.',
        };
      }
    }

    if (totalRoster >= 10) {
      return {
        valid: false,
        reason: 'Total roster is full (10 players). Release a player first.',
      };
    }

    return { valid: true };
  }

  /**
   * Validate team can afford the contract
   */
  validateTeamBudget(
    team: Team,
    offer: ContractOffer
  ): { valid: boolean; reason?: string } {
    const totalCost = offer.signingBonus; // Signing bonus is immediate

    if (team.finances.balance < totalCost) {
      return {
        valid: false,
        reason: `Insufficient funds. Need $${Math.round(totalCost / 1000)}K but only have $${Math.round(team.finances.balance / 1000)}K.`,
      };
    }

    return { valid: true };
  }

  /**
   * Create a contract from an accepted offer
   */
  createContract(offer: ContractOffer): PlayerContract {
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + offer.yearsRemaining);

    return {
      salary: offer.salary,
      bonusPerWin: offer.bonusPerWin ?? Math.round(offer.salary * 0.01),
      yearsRemaining: offer.yearsRemaining,
      endDate: endDate.toISOString(),
    };
  }
}

// Export singleton instance
export const contractNegotiator = new ContractNegotiator();
