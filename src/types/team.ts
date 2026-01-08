// Team System Types
// Based on VCT Manager Technical Specification

import type { Region } from './player';

export type TransactionType =
  | 'signing_bonus'
  | 'transfer_fee'
  | 'prize'
  | 'sponsorship_deal'
  | 'loan_payment';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO date string for serialization
  description: string;
}

export interface Loan {
  id: string;
  principal: number;
  interestRate: number;
  monthlyPayment: number;
  remainingMonths: number;
}

export interface MonthlyRevenue {
  sponsorships: number;
  merchandise: number;
  prizeWinnings: number;
  fanDonations: number;
}

export interface MonthlyExpenses {
  playerSalaries: number;
  coachSalaries: number;
  facilities: number;
  travel: number;
}

export interface TeamFinances {
  balance: number;

  // Recurring monthly income
  monthlyRevenue: MonthlyRevenue;

  // Recurring monthly expenses
  monthlyExpenses: MonthlyExpenses;

  // One-time transactions
  pendingTransactions: Transaction[];

  // Debt management
  loans: Loan[];
}

export interface TeamChemistry {
  overall: number;
  pairs: Record<string, Record<string, number>>; // playerId -> playerId -> score
}

export interface TeamStandings {
  wins: number;
  losses: number;
  roundDiff: number;
  currentStreak: number;
}

export interface Team {
  id: string;
  name: string;
  region: Region;

  // Roster
  playerIds: string[];        // Active roster (5 players)
  reservePlayerIds: string[]; // Reserve roster
  coachIds: string[];

  // Organization strength
  organizationValue: number;  // Starting wealth
  fanbase: number;            // Affects sponsorships

  // Chemistry
  chemistry: TeamChemistry;

  // Finances
  finances: TeamFinances;

  // Performance
  standings: TeamStandings;
}
