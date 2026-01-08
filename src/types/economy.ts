// Economy System Types
// Based on VCT Manager Technical Specification

// Re-export finance types from team for convenience
export type {
  Transaction,
  TransactionType,
  Loan,
  TeamFinances,
  MonthlyRevenue,
  MonthlyExpenses,
} from './team';

// Training-related types (affects economy via time investment)
export type TrainingFocus =
  | 'mechanics'
  | 'igl'
  | 'mental'
  | 'clutch'
  | 'lurking'
  | 'entry'
  | 'support'
  | 'agents'
  | 'balanced';

export type TrainingIntensity = 'light' | 'moderate' | 'intense';

export interface TrainingSession {
  playerId: string;
  focus: TrainingFocus;
  coachId?: string;       // Optional coach boost
  intensity: TrainingIntensity;
  date: string;           // ISO date string
}

export interface TrainingFactors {
  coachBonus: number;
  playerMorale: number;
  playerAge: number;
  playerPotential: number;
}

export interface TrainingResult {
  playerId: string;
  focus: TrainingFocus;
  statImprovements: Record<string, number>;  // Partial<PlayerStats>
  effectiveness: number;    // 0-100: How effective was training
  moraleChange: number;
  fatigueIncrease: number;

  // Factors that affected effectiveness
  factors: TrainingFactors;
}

// Players can only train a limited amount before fatigue impacts performance
export interface PlayerFatigue {
  playerId: string;
  currentFatigue: number;  // 0-100 (100 = exhausted)
  weeklyTrainingSessions: number;
  maxWeeklyTraining: number; // Based on stamina stat
}

// Difficulty affects starting budget
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DifficultySettings {
  budgetMultiplier: number;
  aiStrength: number;
  transferMarketDifficulty: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    budgetMultiplier: 1.5,
    aiStrength: 0.8,
    transferMarketDifficulty: 0.7,
  },
  normal: {
    budgetMultiplier: 1.0,
    aiStrength: 1.0,
    transferMarketDifficulty: 1.0,
  },
  hard: {
    budgetMultiplier: 0.7,
    aiStrength: 1.2,
    transferMarketDifficulty: 1.3,
  },
};
