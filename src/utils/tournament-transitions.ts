// Tournament Transition Configuration
// Defines all phase transitions and tournament creation rules for VCT 2026

import type { TournamentTransitionConfig } from '../types';

/**
 * VCT 2026 Tournament Transitions
 *
 * Flow:
 * 1. Kickoff → Masters Santiago
 * 2. Stage 1 → Stage 1 Playoffs (regional)
 * 3. Stage 1 Playoffs → Masters London
 * 4. Stage 2 → Stage 2 Playoffs (regional)
 * 5. Stage 2 Playoffs → Champions Shanghai
 */

export const TOURNAMENT_TRANSITIONS: Record<string, TournamentTransitionConfig> = {
  // Kickoff → Masters Santiago
  kickoff_to_masters1: {
    id: 'kickoff_to_masters1',
    fromPhase: 'kickoff',
    toPhase: 'masters1',
    type: 'playoff_to_international',
    qualificationSource: 'kickoff',

    tournamentName: 'VCT Masters Santiago 2026',
    format: 'swiss_to_playoff',
    region: 'International',
    prizePool: 1000000,

    qualificationRules: {
      teamsFromKickoff: {
        alpha: 1, // Kickoff winner from each region (4 total)
        beta: 1,  // 2nd place from each region (4 total)
        omega: 1, // 3rd place from each region (4 total)
      },
      swissStageTeams: 8,       // Beta + Omega qualifiers play Swiss
      directPlayoffTeams: 4,     // Alpha qualifiers skip to playoffs
    },

    daysUntilStart: 7,
    durationDays: 18,
  },

  // Stage 1 → Stage 1 Playoffs (regional, happens per region)
  stage1_to_stage1_playoffs: {
    id: 'stage1_to_stage1_playoffs',
    fromPhase: 'stage1',
    toPhase: 'stage1_playoffs',
    type: 'regional_to_playoff',
    qualificationSource: 'stage1',

    tournamentName: 'VCT {REGION} Stage 1 Playoffs 2026', // {REGION} replaced at runtime
    format: 'double_elim',
    region: 'Americas', // Placeholder, actual region set at runtime
    prizePool: 200000,

    qualificationRules: {
      teamsPerRegion: 8, // Top 8 teams from Stage 1 league standings
    },

    daysUntilStart: 7,
    durationDays: 14,
  },

  // Stage 1 Playoffs → Masters London
  stage1_playoffs_to_masters2: {
    id: 'stage1_playoffs_to_masters2',
    fromPhase: 'stage1_playoffs',
    toPhase: 'masters2',
    type: 'playoff_to_international',
    qualificationSource: 'stage1_playoffs',

    tournamentName: 'VCT Masters London 2026',
    format: 'swiss_to_playoff',
    region: 'International',
    prizePool: 1000000,

    qualificationRules: {
      teamsFromPlayoffs: {
        winners: 1,    // Winner from each regional playoff (4 total)
        runnersUp: 1,  // 2nd place from each regional playoff (4 total)
        thirdPlace: 1, // 3rd place from each regional playoff (4 total)
      },
      swissStageTeams: 8,       // 2nd + 3rd place play Swiss
      directPlayoffTeams: 4,     // Winners skip to playoffs
    },

    daysUntilStart: 7,
    durationDays: 18,
  },

  // Stage 2 → Stage 2 Playoffs (regional, happens per region)
  stage2_to_stage2_playoffs: {
    id: 'stage2_to_stage2_playoffs',
    fromPhase: 'stage2',
    toPhase: 'stage2_playoffs',
    type: 'regional_to_playoff',
    qualificationSource: 'stage2',

    tournamentName: 'VCT {REGION} Stage 2 Playoffs 2026', // {REGION} replaced at runtime
    format: 'double_elim',
    region: 'Americas', // Placeholder, actual region set at runtime
    prizePool: 200000,

    qualificationRules: {
      teamsPerRegion: 8, // Top 8 teams from Stage 2 league standings
    },

    daysUntilStart: 7,
    durationDays: 14,
  },

  // Stage 2 Playoffs → Champions Shanghai
  stage2_playoffs_to_champions: {
    id: 'stage2_playoffs_to_champions',
    fromPhase: 'stage2_playoffs',
    toPhase: 'champions',
    type: 'playoff_to_international',
    qualificationSource: 'stage2_playoffs',

    tournamentName: 'VCT Champions Shanghai 2026',
    format: 'swiss_to_playoff',
    region: 'International',
    prizePool: 2250000,

    qualificationRules: {
      teamsFromPlayoffs: {
        winners: 1,    // Winner from each regional playoff (4 total)
        runnersUp: 1,  // 2nd place from each regional playoff (4 total)
        thirdPlace: 2, // Top 2 third-place teams based on circuit points (2 total)
      },
      swissStageTeams: 12,      // More teams in Champions Swiss
      directPlayoffTeams: 4,     // Winners skip to playoffs
    },

    daysUntilStart: 21,
    durationDays: 21,
  },
};

/**
 * Get transition config for a given phase
 */
export function getTransitionForPhase(phase: string): TournamentTransitionConfig | null {
  return Object.values(TOURNAMENT_TRANSITIONS).find((t) => t.fromPhase === phase) || null;
}

/**
 * Get all regional playoff transitions
 */
export function getRegionalPlayoffTransitions(): TournamentTransitionConfig[] {
  return Object.values(TOURNAMENT_TRANSITIONS).filter((t) => t.type === 'regional_to_playoff');
}

/**
 * Get all international tournament transitions
 */
export function getInternationalTransitions(): TournamentTransitionConfig[] {
  return Object.values(TOURNAMENT_TRANSITIONS).filter(
    (t) => t.type === 'playoff_to_international'
  );
}
