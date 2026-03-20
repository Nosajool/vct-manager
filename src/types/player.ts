// Player System Types
// Based on VCT Manager Technical Specification

import type { PlayerAgentPreferences } from './strategy';

export interface PlayerStats {
  mechanics: number;    // 0-100: Aim and gunplay ability
  igl: number;          // 0-100: In-game leadership and strategy
  mental: number;       // 0-100: Composure when playing from behind
  clutch: number;       // 0-100: Performance in 1vX situations
  vibes: number;        // 0-100: Team morale contribution
  lurking: number;      // 0-100: Solo play and flanking
  entry: number;        // 0-100: First contact aggression
  support: number;      // 0-100: Utility usage and teamplay
  stamina: number;      // 0-100: Consistency across long matches
}

export interface PlayerContract {
  salary: number;
  bonusPerWin: number;
  yearsRemaining: number;
  endDate: string; // ISO date string for serialization
}

export interface PlayerCareerStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  tournamentsWon: number;
}

export interface PlayerSeasonStats {
  season: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  tournamentsWon: number;
}

export interface PlayerPreferences {
  salaryImportance: number;      // 0-100
  teamQualityImportance: number; // 0-100
  regionLoyalty: number;         // 0-100
  preferredTeammates: string[];  // Player IDs
}

export type Region = 'Americas' | 'EMEA' | 'Pacific' | 'China';

export type PlayerPersonality = 'FAME_SEEKER' | 'TEAM_FIRST' | 'INTROVERT' | 'BIG_STAGE' | 'STABLE';

/** Hidden personality traits (0-100, not shown directly to player) */
export interface PersonalityTraits {
  ego: number;            // 0=selfless, 100=star-ego
  loyalty: number;        // 0=mercenary, 100=ride-or-die
  dramaTendency: number;  // 0=zen, 100=powder keg
  workEthic: number;      // 0=coasts, 100=obsessive
}

export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  region: Region;

  // Current team
  teamId: string | null;

  // Stats and performance
  stats: PlayerStats;
  form: number;           // 0-100: Recent performance
  morale: number;         // 0-100: Current morale
  potential: number;      // 0-100: Growth ceiling

  // Contract details
  contract: PlayerContract | null;

  // Career stats
  careerStats: PlayerCareerStats;
  
  // Season stats - current season only
  seasonStats: PlayerSeasonStats;

  // Preferences (for AI negotiations)
  preferences: PlayerPreferences;

  // Agent preferences (for match simulation)
  agentPreferences?: PlayerAgentPreferences;

  // Personality archetype (for narrative system)
  personality?: PlayerPersonality;

  // Hidden personality traits (seeded from personality archetype)
  personalityTraits?: PersonalityTraits;

  // IGL status
  isFormerIGL?: boolean;

  // Free agent interest tracking
  teamInterests?: Record<string, number>;    // teamId → interest 0-100
  offerCooldowns?: Record<string, string>;   // teamId → ISO date cooldown expires
  outreachSpend?: Record<string, number>;    // teamId → total dollars spent on outreach
  outreachActions?: Record<string, string[]>; // teamId → list of completed action names
}

export type CoachType = 'Head Coach' | 'Assistant Coach' | 'Performance Coach';

export interface Coach {
  id: string;
  name: string;
  type: CoachType;
  statBoosts: Partial<PlayerStats>;
  salary: number;
  contract: {
    yearsRemaining: number;
    endDate: string; // ISO date string for serialization
  };
}
