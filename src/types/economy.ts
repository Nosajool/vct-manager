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

// Legacy stat-based training focus (kept for backward compatibility)
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

// New goal-based training system
export type TrainingGoal =
  | 'role_mastery_entry'
  | 'role_mastery_lurk'
  | 'role_mastery_support'
  | 'mechanical_ceiling'
  | 'decision_making'
  | 'leadership_comms'
  | 'all_round_growth';

export type TrainingIntensity = 'light' | 'moderate' | 'intense';

// Mapping from training goal to affected stats and UI descriptors
export interface GoalMapping {
  // Display information
  displayName: string;
  description: string;

  // Stat impacts
  primaryStats: string[];   // Stats that get full boost
  secondaryStats: string[]; // Stats that get partial boost

  // Preview descriptors for UI
  previewDescriptors: string[]; // e.g., '+First Blood Rate', '+Clutch Success'

  // Underlying TrainingFocus for backward compatibility
  underlyingFocus: TrainingFocus;
}

// Configuration mapping goals to stats
export const TRAINING_GOAL_MAPPINGS: Record<TrainingGoal, GoalMapping> = {
  role_mastery_entry: {
    displayName: 'Entry Fragging Mastery',
    description: 'Dominate first contacts and site takes. Improve opening duel success and aggression timing.',
    primaryStats: ['entry'],
    secondaryStats: ['mechanics', 'stamina'],
    previewDescriptors: ['+First Blood Rate', '+Opening Duel Success', '+Site Entry Impact'],
    underlyingFocus: 'entry',
  },

  role_mastery_lurk: {
    displayName: 'Lurk & Flank Mastery',
    description: 'Master map control and timing. Learn to find advantageous positions and create space.',
    primaryStats: ['lurking'],
    secondaryStats: ['mental', 'clutch'],
    previewDescriptors: ['+Lurk Kill Rate', '+Map Control', '+Timing & Positioning'],
    underlyingFocus: 'lurking',
  },

  role_mastery_support: {
    displayName: 'Support & Utility Mastery',
    description: 'Perfect utility usage and team play. Enable your team with flashes, smokes, and setups.',
    primaryStats: ['support'],
    secondaryStats: ['igl', 'vibes'],
    previewDescriptors: ['+Utility Impact', '+Trade Efficiency', '+Team Play'],
    underlyingFocus: 'support',
  },

  mechanical_ceiling: {
    displayName: 'Mechanical Ceiling',
    description: 'Raw aim and gunplay training. Elevate crosshair placement, spray control, and pure fragging.',
    primaryStats: ['mechanics'],
    secondaryStats: ['clutch', 'entry'],
    previewDescriptors: ['+Aim Precision', '+Spray Control', '+Flick Shots'],
    underlyingFocus: 'mechanics',
  },

  decision_making: {
    displayName: 'Decision Making',
    description: 'Sharpen mid-round calls and clutch composure. Learn when to rotate, save, or commit.',
    primaryStats: ['mental', 'clutch'],
    secondaryStats: ['igl'],
    previewDescriptors: ['+Clutch Success', '+Round Reading', '+Decision Speed'],
    underlyingFocus: 'mental',
  },

  leadership_comms: {
    displayName: 'Leadership & Comms',
    description: 'Build IGL skills, callout quality, and team coordination. Lead your squad to victory.',
    primaryStats: ['igl'],
    secondaryStats: ['mental', 'support', 'vibes'],
    previewDescriptors: ['+Strategic Calls', '+Team Coordination', '+Mid-Round Leadership'],
    underlyingFocus: 'igl',
  },

  all_round_growth: {
    displayName: 'All-Round Growth',
    description: 'Balanced development across all skills. Good for maintaining well-rounded performance.',
    primaryStats: [],
    secondaryStats: ['mechanics', 'igl', 'mental', 'clutch', 'vibes', 'lurking', 'entry', 'support', 'stamina'],
    previewDescriptors: ['+Overall Rating', '+Versatility', '+Consistency'],
    underlyingFocus: 'balanced',
  },
};

export interface TrainingSession {
  playerId: string;
  focus: TrainingFocus;     // Legacy field
  goal?: TrainingGoal;      // New goal-based field (preferred)
  coachId?: string;         // Optional coach boost
  intensity: TrainingIntensity;
  date: string;             // ISO date string
}

export interface TrainingFactors {
  coachBonus: number;
  playerMorale: number;
  playerAge: number;
  playerPotential: number;
}

export interface TrainingResult {
  playerId: string;
  focus: TrainingFocus;     // Legacy field
  goal?: TrainingGoal;      // New goal-based field (if training used goals)
  statImprovements: Record<string, number>;  // Partial<PlayerStats>
  effectiveness: number;    // 0-100: How effective was training
  moraleChange: number;
  fatigueIncrease: number;

  // Factors that affected effectiveness
  factors: TrainingFactors;

  // Snapshot of stats before training (for "old → new" display)
  // Added by TrainingService after engine returns result
  statsBefore?: Record<string, number>;  // Full PlayerStats snapshot
  moraleBefore?: number;
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
