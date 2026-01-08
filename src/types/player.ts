// Player System Types
// Based on VCT Manager Technical Specification

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

export interface PlayerPreferences {
  salaryImportance: number;      // 0-100
  teamQualityImportance: number; // 0-100
  regionLoyalty: number;         // 0-100
  preferredTeammates: string[];  // Player IDs
}

export type Region = 'Americas' | 'EMEA' | 'Pacific' | 'China';

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

  // Preferences (for AI negotiations)
  preferences: PlayerPreferences;
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
