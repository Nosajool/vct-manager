// EconomyEngine - Pure engine class for financial calculations
// No React or store dependencies - pure functions only

import type {
  Team,
  TeamFinances,
  Transaction,
  Loan,
  MonthlyRevenue,
  MonthlyExpenses,
} from '../../types';

/**
 * Sponsorship deal structure
 */
export interface Sponsorship {
  id: string;
  sponsorName: string;
  monthlyValue: number;
  duration: number; // months
  startDate: string; // ISO date
  endDate: string; // ISO date
  requirements: SponsorshipRequirements;
  status: 'active' | 'expired' | 'terminated';
}

export interface SponsorshipRequirements {
  minFanbase?: number;
  minWinRate?: number;
  tournamentAppearances?: number;
}

/**
 * Sponsorship offer for negotiation
 */
export interface SponsorshipOffer {
  sponsorName: string;
  monthlyValue: number;
  duration: number;
  requirements: SponsorshipRequirements;
  expiresAt: string; // ISO date when offer expires
}

/**
 * Loan options available to teams
 */
export interface LoanOption {
  principal: number;
  interestRate: number; // Annual rate (0.05 = 5%)
  termMonths: number;
  monthlyPayment: number;
}

/**
 * Result of monthly financial processing
 */
export interface MonthlyFinanceResult {
  previousBalance: number;
  newBalance: number;
  totalRevenue: number;
  totalExpenses: number;
  netChange: number;
  transactions: Transaction[];
  warnings: string[];
}

/**
 * Prize distribution result
 */
export interface PrizeDistribution {
  teamId: string;
  placement: number;
  amount: number;
  tournamentName: string;
}

/**
 * EconomyEngine - Handles all financial calculations
 */
export class EconomyEngine {
  // Sponsor templates by tier
  private static readonly SPONSOR_TEMPLATES = {
    major: [
      { name: 'Red Bull', baseValue: 150000 },
      { name: 'BMW', baseValue: 120000 },
      { name: 'Secretlab', baseValue: 100000 },
      { name: 'HyperX', baseValue: 90000 },
    ],
    mid: [
      { name: 'Logitech G', baseValue: 60000 },
      { name: 'Razer', baseValue: 55000 },
      { name: 'SteelSeries', baseValue: 50000 },
      { name: 'Corsair', baseValue: 45000 },
    ],
    minor: [
      { name: 'ASUS ROG', baseValue: 30000 },
      { name: 'MSI', baseValue: 25000 },
      { name: 'Elgato', baseValue: 20000 },
      { name: 'SCUF', baseValue: 15000 },
    ],
  };

  // Loan interest rates based on team financial health
  private static readonly LOAN_RATES = {
    excellent: 0.05, // 5% annual
    good: 0.08, // 8% annual
    fair: 0.12, // 12% annual
    poor: 0.18, // 18% annual
  };

  /**
   * Generate a unique ID
   */
  private generateId(prefix: string = 'txn'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Calculate total monthly revenue
   */
  calculateMonthlyRevenue(revenue: MonthlyRevenue): number {
    return (
      revenue.sponsorships +
      revenue.merchandise +
      revenue.prizeWinnings +
      revenue.fanDonations
    );
  }

  /**
   * Calculate total monthly expenses
   */
  calculateMonthlyExpenses(expenses: MonthlyExpenses): number {
    return (
      expenses.playerSalaries +
      expenses.coachSalaries +
      expenses.facilities +
      expenses.travel
    );
  }

  /**
   * Calculate net monthly cash flow
   */
  calculateNetCashFlow(finances: TeamFinances): number {
    const revenue = this.calculateMonthlyRevenue(finances.monthlyRevenue);
    const expenses = this.calculateMonthlyExpenses(finances.monthlyExpenses);
    const loanPayments = this.calculateTotalLoanPayments(finances.loans);
    return revenue - expenses - loanPayments;
  }

  /**
   * Calculate total monthly loan payments
   */
  calculateTotalLoanPayments(loans: Loan[]): number {
    return loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  }

  /**
   * Process monthly finances (salaries, revenue, loan payments)
   */
  processMonthlyFinances(
    team: Team,
    currentDate: string
  ): MonthlyFinanceResult {
    const finances = team.finances;
    const transactions: Transaction[] = [];
    const warnings: string[] = [];
    const previousBalance = finances.balance;

    // Calculate totals
    const totalRevenue = this.calculateMonthlyRevenue(finances.monthlyRevenue);
    const totalExpenses = this.calculateMonthlyExpenses(finances.monthlyExpenses);
    const loanPayments = this.calculateTotalLoanPayments(finances.loans);

    // Create revenue transaction
    if (totalRevenue > 0) {
      transactions.push({
        id: this.generateId('rev'),
        type: 'sponsorship_deal', // Using existing type for revenue
        amount: totalRevenue,
        date: currentDate,
        description: 'Monthly revenue (sponsorships, merchandise, fan donations)',
      });
    }

    // Create salary expense transaction
    if (finances.monthlyExpenses.playerSalaries > 0) {
      transactions.push({
        id: this.generateId('sal'),
        type: 'signing_bonus', // Using for salary (negative amount)
        amount: -finances.monthlyExpenses.playerSalaries,
        date: currentDate,
        description: 'Monthly player salaries',
      });
    }

    // Create other expenses transaction
    const otherExpenses =
      finances.monthlyExpenses.coachSalaries +
      finances.monthlyExpenses.facilities +
      finances.monthlyExpenses.travel;
    if (otherExpenses > 0) {
      transactions.push({
        id: this.generateId('exp'),
        type: 'transfer_fee', // Using for expenses (negative amount)
        amount: -otherExpenses,
        date: currentDate,
        description: 'Monthly expenses (coaches, facilities, travel)',
      });
    }

    // Create loan payment transactions
    for (const loan of finances.loans) {
      if (loan.remainingMonths > 0) {
        transactions.push({
          id: this.generateId('loan'),
          type: 'loan_payment',
          amount: -loan.monthlyPayment,
          date: currentDate,
          description: `Loan payment (${loan.remainingMonths} months remaining)`,
        });
      }
    }

    // Calculate net change
    const netChange = totalRevenue - totalExpenses - loanPayments;
    const newBalance = previousBalance + netChange;

    // Add warnings if balance is low
    if (newBalance < 0) {
      warnings.push('Team balance is negative! Consider taking a loan or reducing expenses.');
    } else if (newBalance < totalExpenses * 2) {
      warnings.push('Low balance warning: Less than 2 months of expenses in reserve.');
    }

    // Check if monthly cash flow is negative
    if (netChange < 0) {
      warnings.push(`Negative cash flow: Losing $${Math.abs(netChange).toLocaleString()} per month.`);
    }

    return {
      previousBalance,
      newBalance,
      totalRevenue,
      totalExpenses: totalExpenses + loanPayments,
      netChange,
      transactions,
      warnings,
    };
  }

  /**
   * Update loans after monthly payment (returns updated loans)
   */
  processLoanPayments(loans: Loan[]): Loan[] {
    return loans
      .map((loan) => ({
        ...loan,
        remainingMonths: loan.remainingMonths - 1,
      }))
      .filter((loan) => loan.remainingMonths > 0);
  }

  /**
   * Calculate sponsorship value based on team factors
   */
  calculateSponsorshipValue(
    baseValue: number,
    team: Team
  ): number {
    // Fanbase factor (0.5 to 1.5)
    const fanbaseFactor = 0.5 + (team.reputation.fanbase / 100);

    // Org value factor (0.7 to 1.3)
    const orgValueFactor = 0.7 + (team.organizationValue / 5000000) * 0.6;

    // Win rate factor (0.8 to 1.2)
    const totalGames = team.standings.wins + team.standings.losses;
    const winRate = totalGames > 0 ? team.standings.wins / totalGames : 0.5;
    const winRateFactor = 0.8 + winRate * 0.4;

    return Math.round(baseValue * fanbaseFactor * orgValueFactor * winRateFactor);
  }

  /**
   * Generate sponsorship offers for a team
   */
  generateSponsorshipOffers(
    team: Team,
    currentDate: string,
    count: number = 3
  ): SponsorshipOffer[] {
    const offers: SponsorshipOffer[] = [];
    const expiryDate = new Date(currentDate);
    expiryDate.setDate(expiryDate.getDate() + 14); // 2 weeks to decide

    // Determine tier based on team strength
    const totalStrength = team.organizationValue + team.reputation.fanbase * 10000;
    let tierPool: { name: string; baseValue: number }[];

    if (totalStrength > 4000000) {
      tierPool = [
        ...EconomyEngine.SPONSOR_TEMPLATES.major,
        ...EconomyEngine.SPONSOR_TEMPLATES.mid,
      ];
    } else if (totalStrength > 2500000) {
      tierPool = [
        ...EconomyEngine.SPONSOR_TEMPLATES.mid,
        ...EconomyEngine.SPONSOR_TEMPLATES.minor,
      ];
    } else {
      tierPool = EconomyEngine.SPONSOR_TEMPLATES.minor;
    }

    // Shuffle and pick sponsors
    const shuffled = this.shuffleArray([...tierPool]);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    for (const sponsor of selected) {
      const monthlyValue = this.calculateSponsorshipValue(sponsor.baseValue, team);
      const duration = this.randomChoice([6, 12, 24]); // 6 months, 1 year, or 2 years

      offers.push({
        sponsorName: sponsor.name,
        monthlyValue,
        duration,
        requirements: this.generateSponsorshipRequirements(sponsor.baseValue),
        expiresAt: expiryDate.toISOString(),
      });
    }

    return offers;
  }

  /**
   * Generate requirements for a sponsorship
   */
  private generateSponsorshipRequirements(baseValue: number): SponsorshipRequirements {
    const requirements: SponsorshipRequirements = {};

    // Higher value sponsors have stricter requirements
    if (baseValue >= 100000) {
      requirements.minFanbase = 60;
      requirements.minWinRate = 0.4;
    } else if (baseValue >= 50000) {
      requirements.minFanbase = 40;
    }

    return requirements;
  }

  /**
   * Check if team meets sponsorship requirements
   */
  checkSponsorshipRequirements(
    team: Team,
    requirements: SponsorshipRequirements
  ): { met: boolean; failures: string[] } {
    const failures: string[] = [];

    if (requirements.minFanbase && team.reputation.fanbase < requirements.minFanbase) {
      failures.push(`Fanbase too low (${team.reputation.fanbase} < ${requirements.minFanbase})`);
    }

    if (requirements.minWinRate) {
      const totalGames = team.standings.wins + team.standings.losses;
      const winRate = totalGames > 0 ? team.standings.wins / totalGames : 0;
      if (winRate < requirements.minWinRate) {
        failures.push(`Win rate too low (${(winRate * 100).toFixed(1)}% < ${requirements.minWinRate * 100}%)`);
      }
    }

    return { met: failures.length === 0, failures };
  }

  /**
   * Create a sponsorship from an accepted offer
   */
  createSponsorship(
    offer: SponsorshipOffer,
    startDate: string
  ): Sponsorship {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + offer.duration);

    return {
      id: this.generateId('sponsor'),
      sponsorName: offer.sponsorName,
      monthlyValue: offer.monthlyValue,
      duration: offer.duration,
      startDate,
      endDate: endDate.toISOString(),
      requirements: offer.requirements,
      status: 'active',
    };
  }

  /**
   * Get loan options available to a team
   */
  getLoanOptions(team: Team): LoanOption[] {
    const rate = this.getLoanInterestRate(team);
    const maxLoan = this.calculateMaxLoanAmount(team);

    // Offer 3 loan sizes: 25%, 50%, 100% of max
    const amounts = [
      Math.round(maxLoan * 0.25),
      Math.round(maxLoan * 0.5),
      maxLoan,
    ];

    const terms = [6, 12, 24]; // 6 months, 1 year, 2 years

    const options: LoanOption[] = [];

    for (const principal of amounts) {
      for (const termMonths of terms) {
        const monthlyPayment = this.calculateLoanPayment(principal, rate, termMonths);
        options.push({
          principal,
          interestRate: rate,
          termMonths,
          monthlyPayment,
        });
      }
    }

    return options;
  }

  /**
   * Get interest rate for a team based on financial health
   */
  private getLoanInterestRate(team: Team): number {
    const netCashFlow = this.calculateNetCashFlow(team.finances);
    const balanceRatio = team.finances.balance / team.organizationValue;

    if (netCashFlow > 0 && balanceRatio > 0.3) {
      return EconomyEngine.LOAN_RATES.excellent;
    } else if (netCashFlow >= 0 && balanceRatio > 0.1) {
      return EconomyEngine.LOAN_RATES.good;
    } else if (balanceRatio > 0) {
      return EconomyEngine.LOAN_RATES.fair;
    } else {
      return EconomyEngine.LOAN_RATES.poor;
    }
  }

  /**
   * Calculate maximum loan amount for a team
   */
  private calculateMaxLoanAmount(team: Team): number {
    // Max loan is 50% of organization value or 12 months of revenue, whichever is lower
    const orgValueLimit = team.organizationValue * 0.5;
    const revenueLimit = this.calculateMonthlyRevenue(team.finances.monthlyRevenue) * 12;
    return Math.min(orgValueLimit, revenueLimit);
  }

  /**
   * Calculate monthly loan payment (amortizing loan formula)
   */
  calculateLoanPayment(
    principal: number,
    annualRate: number,
    termMonths: number
  ): number {
    const monthlyRate = annualRate / 12;
    if (monthlyRate === 0) {
      return principal / termMonths;
    }
    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
    return Math.round(payment);
  }

  /**
   * Create a loan from an accepted option
   */
  createLoan(option: LoanOption): Loan {
    return {
      id: this.generateId('loan'),
      principal: option.principal,
      interestRate: option.interestRate,
      monthlyPayment: option.monthlyPayment,
      remainingMonths: option.termMonths,
    };
  }

  /**
   * Calculate prize money distribution for tournament placements
   */
  distributePrizeMoney(
    prizePool: Record<number, number>,
    placements: { teamId: string; placement: number }[],
    tournamentName: string
  ): PrizeDistribution[] {
    return placements
      .filter((p) => prizePool[p.placement])
      .map((p) => ({
        teamId: p.teamId,
        placement: p.placement,
        amount: prizePool[p.placement],
        tournamentName,
      }));
  }

  /**
   * Create transaction for prize money
   */
  createPrizeTransaction(
    distribution: PrizeDistribution,
    date: string
  ): Transaction {
    return {
      id: this.generateId('prize'),
      type: 'prize',
      amount: distribution.amount,
      date,
      description: `${distribution.tournamentName} - ${this.getPlacementLabel(distribution.placement)} place`,
    };
  }

  /**
   * Get placement label (1st, 2nd, 3rd, etc.)
   */
  private getPlacementLabel(placement: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = placement % 100;
    return placement + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  /**
   * Calculate transfer fee for a player
   */
  calculateTransferFee(
    playerOverall: number,
    contractYearsRemaining: number,
    playerAge: number
  ): number {
    // Base value from player overall
    let baseValue: number;
    if (playerOverall >= 85) {
      baseValue = 2000000 + (playerOverall - 85) * 300000;
    } else if (playerOverall >= 75) {
      baseValue = 500000 + (playerOverall - 75) * 150000;
    } else if (playerOverall >= 65) {
      baseValue = 100000 + (playerOverall - 65) * 40000;
    } else {
      baseValue = 50000;
    }

    // Contract multiplier (more years = higher fee)
    const contractMultiplier = 0.5 + contractYearsRemaining * 0.25;

    // Age factor (younger = more valuable)
    let ageFactor: number;
    if (playerAge <= 20) {
      ageFactor = 1.3;
    } else if (playerAge <= 24) {
      ageFactor = 1.1;
    } else if (playerAge <= 28) {
      ageFactor = 1.0;
    } else {
      ageFactor = 0.7;
    }

    return Math.round(baseValue * contractMultiplier * ageFactor);
  }

  /**
   * Check if team can afford an expense
   */
  canAfford(team: Team, amount: number): boolean {
    return team.finances.balance >= amount;
  }

  /**
   * Check if team can afford recurring monthly expense
   */
  canAffordMonthlyExpense(team: Team, monthlyAmount: number): boolean {
    const currentCashFlow = this.calculateNetCashFlow(team.finances);
    const projectedCashFlow = currentCashFlow - monthlyAmount;

    // Must have positive cash flow or 6+ months reserve
    return projectedCashFlow > 0 || team.finances.balance > monthlyAmount * 6;
  }

  /**
   * Utility: Shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Utility: Random choice from array
   */
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// Export singleton instance
export const economyEngine = new EconomyEngine();
