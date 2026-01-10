// EconomyService - Orchestrates economy operations
// Connects EconomyEngine with the Zustand store

import { useGameStore } from '../store';
import {
  economyEngine,
  type Sponsorship,
  type SponsorshipOffer,
  type LoanOption,
  type MonthlyFinanceResult,
  type PrizeDistribution,
} from '../engine/team';
import type { Transaction, Loan } from '../types';

/**
 * Result of accepting a sponsorship offer
 */
export interface SponsorshipResult {
  success: boolean;
  sponsorship?: Sponsorship;
  error?: string;
}

/**
 * Result of taking a loan
 */
export interface LoanResult {
  success: boolean;
  loan?: Loan;
  newBalance?: number;
  error?: string;
}

/**
 * Financial summary for a team
 */
export interface FinancialSummary {
  balance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netCashFlow: number;
  loanPayments: number;
  projectedBalance3Months: number;
  projectedBalance6Months: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  warnings: string[];
}

/**
 * EconomyService - Handles all economy-related operations
 */
export class EconomyService {
  /**
   * Get financial summary for player's team
   */
  getFinancialSummary(teamId?: string): FinancialSummary {
    const state = useGameStore.getState();
    const id = teamId || state.playerTeamId;
    if (!id) {
      throw new Error('No team specified');
    }

    const team = state.teams[id];
    if (!team) {
      throw new Error('Team not found');
    }

    const monthlyRevenue = economyEngine.calculateMonthlyRevenue(
      team.finances.monthlyRevenue
    );
    const monthlyExpenses = economyEngine.calculateMonthlyExpenses(
      team.finances.monthlyExpenses
    );
    const loanPayments = economyEngine.calculateTotalLoanPayments(
      team.finances.loans
    );
    const netCashFlow = monthlyRevenue - monthlyExpenses - loanPayments;

    // Project future balances
    const projectedBalance3Months = team.finances.balance + netCashFlow * 3;
    const projectedBalance6Months = team.finances.balance + netCashFlow * 6;

    // Determine health status
    let healthStatus: FinancialSummary['healthStatus'];
    const warnings: string[] = [];

    if (team.finances.balance < 0) {
      healthStatus = 'critical';
      warnings.push('Team is in debt! Immediate action required.');
    } else if (netCashFlow < 0 && projectedBalance3Months < 0) {
      healthStatus = 'poor';
      warnings.push('Negative cash flow will lead to debt within 3 months.');
    } else if (netCashFlow < 0) {
      healthStatus = 'fair';
      warnings.push('Spending exceeds income. Consider reducing expenses.');
    } else if (team.finances.balance < monthlyExpenses * 2) {
      healthStatus = 'fair';
      warnings.push('Low reserves. Build up savings for emergencies.');
    } else if (netCashFlow > 0 && team.finances.balance > monthlyExpenses * 6) {
      healthStatus = 'excellent';
    } else {
      healthStatus = 'good';
    }

    return {
      balance: team.finances.balance,
      monthlyRevenue,
      monthlyExpenses: monthlyExpenses + loanPayments,
      netCashFlow,
      loanPayments,
      projectedBalance3Months,
      projectedBalance6Months,
      healthStatus,
      warnings,
    };
  }

  /**
   * Process monthly finances for player's team
   * Called when a salary_payment event is processed
   */
  processMonthlyFinances(teamId?: string): MonthlyFinanceResult {
    const state = useGameStore.getState();
    const id = teamId || state.playerTeamId;
    if (!id) {
      throw new Error('No team specified');
    }

    const team = state.teams[id];
    if (!team) {
      throw new Error('Team not found');
    }

    const currentDate = state.calendar.currentDate;

    // Calculate monthly finances
    const result = economyEngine.processMonthlyFinances(team, currentDate);

    // Update team balance
    state.updateTeamFinances(id, {
      balance: result.newBalance,
    });

    // Process loan payments (reduce remaining months)
    const updatedLoans = economyEngine.processLoanPayments(team.finances.loans);
    state.updateTeamFinances(id, {
      loans: updatedLoans,
    });

    // Add transactions to history
    for (const transaction of result.transactions) {
      this.addTransaction(id, transaction);
    }

    return result;
  }

  /**
   * Get sponsorship offers for player's team
   */
  getSponsorshipOffers(teamId?: string): SponsorshipOffer[] {
    const state = useGameStore.getState();
    const id = teamId || state.playerTeamId;
    if (!id) return [];

    const team = state.teams[id];
    if (!team) return [];

    const currentDate = state.calendar.currentDate;
    return economyEngine.generateSponsorshipOffers(team, currentDate);
  }

  /**
   * Accept a sponsorship offer
   */
  acceptSponsorship(offer: SponsorshipOffer, teamId?: string): SponsorshipResult {
    const state = useGameStore.getState();
    const id = teamId || state.playerTeamId;
    if (!id) {
      return { success: false, error: 'No team specified' };
    }

    const team = state.teams[id];
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    // Check requirements
    const reqCheck = economyEngine.checkSponsorshipRequirements(
      team,
      offer.requirements
    );
    if (!reqCheck.met) {
      return {
        success: false,
        error: `Requirements not met: ${reqCheck.failures.join(', ')}`,
      };
    }

    const currentDate = state.calendar.currentDate;
    const sponsorship = economyEngine.createSponsorship(offer, currentDate);

    // Update monthly revenue
    const newSponsorshipRevenue =
      team.finances.monthlyRevenue.sponsorships + offer.monthlyValue;
    state.updateTeamFinances(id, {
      monthlyRevenue: {
        ...team.finances.monthlyRevenue,
        sponsorships: newSponsorshipRevenue,
      },
    });

    // Add signing bonus transaction (first month paid upfront)
    const signingBonus: Transaction = {
      id: `txn-sponsor-${Date.now()}`,
      type: 'sponsorship_deal',
      amount: offer.monthlyValue,
      date: currentDate,
      description: `${offer.sponsorName} sponsorship deal signed (${offer.duration} months)`,
    };
    this.addTransaction(id, signingBonus);
    state.updateTeamBalance(id, offer.monthlyValue);

    return { success: true, sponsorship };
  }

  /**
   * Get available loan options for player's team
   */
  getLoanOptions(teamId?: string): LoanOption[] {
    const state = useGameStore.getState();
    const id = teamId || state.playerTeamId;
    if (!id) return [];

    const team = state.teams[id];
    if (!team) return [];

    return economyEngine.getLoanOptions(team);
  }

  /**
   * Take out a loan
   */
  takeLoan(option: LoanOption, teamId?: string): LoanResult {
    const state = useGameStore.getState();
    const id = teamId || state.playerTeamId;
    if (!id) {
      return { success: false, error: 'No team specified' };
    }

    const team = state.teams[id];
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    // Check if team can handle the monthly payment
    if (!economyEngine.canAffordMonthlyExpense(team, option.monthlyPayment)) {
      return {
        success: false,
        error: 'Cannot afford monthly loan payments with current cash flow',
      };
    }

    // Create the loan
    const loan = economyEngine.createLoan(option);
    const currentDate = state.calendar.currentDate;

    // Add loan to team's loans
    const updatedLoans = [...team.finances.loans, loan];
    const newBalance = team.finances.balance + option.principal;

    state.updateTeamFinances(id, {
      balance: newBalance,
      loans: updatedLoans,
    });

    // Add transaction
    const transaction: Transaction = {
      id: `txn-loan-${Date.now()}`,
      type: 'loan_payment', // Using existing type
      amount: option.principal,
      date: currentDate,
      description: `Loan received: $${option.principal.toLocaleString()} at ${(option.interestRate * 100).toFixed(1)}% APR (${option.termMonths} months)`,
    };
    this.addTransaction(id, transaction);

    return { success: true, loan, newBalance };
  }

  /**
   * Pay off a loan early
   */
  payOffLoan(loanId: string, teamId?: string): { success: boolean; error?: string } {
    const state = useGameStore.getState();
    const id = teamId || state.playerTeamId;
    if (!id) {
      return { success: false, error: 'No team specified' };
    }

    const team = state.teams[id];
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    // Find the loan
    const loan = team.finances.loans.find((l) => l.id === loanId);
    if (!loan) {
      return { success: false, error: 'Loan not found' };
    }

    // Calculate remaining balance (simplified: remaining payments)
    const remainingBalance = loan.monthlyPayment * loan.remainingMonths;

    if (!economyEngine.canAfford(team, remainingBalance)) {
      return { success: false, error: 'Insufficient funds to pay off loan' };
    }

    const currentDate = state.calendar.currentDate;

    // Remove loan and deduct balance
    const updatedLoans = team.finances.loans.filter((l) => l.id !== loanId);
    state.updateTeamFinances(id, {
      balance: team.finances.balance - remainingBalance,
      loans: updatedLoans,
    });

    // Add transaction
    const transaction: Transaction = {
      id: `txn-payoff-${Date.now()}`,
      type: 'loan_payment',
      amount: -remainingBalance,
      date: currentDate,
      description: `Loan paid off early: $${remainingBalance.toLocaleString()}`,
    };
    this.addTransaction(id, transaction);

    return { success: true };
  }

  /**
   * Distribute prize money for a tournament
   */
  distributePrizeMoney(
    prizePool: Record<number, number>,
    placements: { teamId: string; placement: number }[],
    tournamentName: string
  ): PrizeDistribution[] {
    const state = useGameStore.getState();
    const currentDate = state.calendar.currentDate;

    const distributions = economyEngine.distributePrizeMoney(
      prizePool,
      placements,
      tournamentName
    );

    // Award money to each team
    for (const distribution of distributions) {
      const team = state.teams[distribution.teamId];
      if (team) {
        // Add to balance
        state.updateTeamBalance(distribution.teamId, distribution.amount);

        // Create transaction
        const transaction = economyEngine.createPrizeTransaction(
          distribution,
          currentDate
        );
        this.addTransaction(distribution.teamId, transaction);

        // Update monthly prize winnings (for tracking)
        state.updateTeamFinances(distribution.teamId, {
          monthlyRevenue: {
            ...team.finances.monthlyRevenue,
            prizeWinnings:
              team.finances.monthlyRevenue.prizeWinnings + distribution.amount,
          },
        });
      }
    }

    return distributions;
  }

  /**
   * Calculate transfer fee for a player
   */
  calculateTransferFee(playerId: string): number {
    const state = useGameStore.getState();
    const player = state.players[playerId];
    if (!player || !player.contract) return 0;

    // Calculate player overall
    const stats = player.stats;
    const overall = Math.round(
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

    return economyEngine.calculateTransferFee(
      overall,
      player.contract.yearsRemaining,
      player.age
    );
  }

  /**
   * Check if team can afford a one-time expense
   */
  canAfford(amount: number, teamId?: string): boolean {
    const state = useGameStore.getState();
    const id = teamId || state.playerTeamId;
    if (!id) return false;

    const team = state.teams[id];
    if (!team) return false;

    return economyEngine.canAfford(team, amount);
  }

  /**
   * Check if team can afford a recurring monthly expense
   */
  canAffordMonthly(monthlyAmount: number, teamId?: string): boolean {
    const state = useGameStore.getState();
    const id = teamId || state.playerTeamId;
    if (!id) return false;

    const team = state.teams[id];
    if (!team) return false;

    return economyEngine.canAffordMonthlyExpense(team, monthlyAmount);
  }

  /**
   * Add a transaction to team history
   */
  addTransaction(teamId: string, transaction: Transaction): void {
    const state = useGameStore.getState();
    const team = state.teams[teamId];
    if (!team) return;

    const updatedTransactions = [
      transaction,
      ...team.finances.pendingTransactions,
    ].slice(0, 100); // Keep last 100 transactions

    state.updateTeamFinances(teamId, {
      pendingTransactions: updatedTransactions,
    });
  }

  /**
   * Get recent transactions for a team
   */
  getTransactionHistory(limit: number = 20, teamId?: string): Transaction[] {
    const state = useGameStore.getState();
    const id = teamId || state.playerTeamId;
    if (!id) return [];

    const team = state.teams[id];
    if (!team) return [];

    return team.finances.pendingTransactions.slice(0, limit);
  }

  /**
   * Get active loans for a team
   */
  getActiveLoans(teamId?: string): Loan[] {
    const state = useGameStore.getState();
    const id = teamId || state.playerTeamId;
    if (!id) return [];

    const team = state.teams[id];
    if (!team) return [];

    return team.finances.loans.filter((l) => l.remainingMonths > 0);
  }

  /**
   * Get total debt (sum of remaining loan payments)
   */
  getTotalDebt(teamId?: string): number {
    const loans = this.getActiveLoans(teamId);
    return loans.reduce(
      (sum, loan) => sum + loan.monthlyPayment * loan.remainingMonths,
      0
    );
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (absAmount >= 1000000) {
      return `${sign}$${(absAmount / 1000000).toFixed(1)}M`;
    } else if (absAmount >= 1000) {
      return `${sign}$${(absAmount / 1000).toFixed(0)}K`;
    } else {
      return `${sign}$${absAmount.toLocaleString()}`;
    }
  }
}

// Export singleton instance
export const economyService = new EconomyService();
