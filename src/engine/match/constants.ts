// Shared match simulation constants
// Extracted to avoid duplication across engine classes

// Stat weights for team strength calculation
export const STAT_WEIGHTS = {
  mechanics: 0.30,
  igl: 0.15,
  mental: 0.15,
  clutch: 0.10,
  entry: 0.10,
  support: 0.10,
  lurking: 0.05,
  vibes: 0.05,
} as const;

// Maximum chemistry bonus (20%)
export const MAX_CHEMISTRY_BONUS = 0.20;

// Type exports for consumers
export type { Player, TeamChemistry } from '../../types';
