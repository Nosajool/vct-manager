// Rivalry System Types
// Part of the narrative layer (System 4: Rivalry)

export interface Rivalry {
  id: string;
  opponentTeamId: string; // always relative to player's team
  intensity: number;      // 0-100
  lastMatchDate: string;
  totalMatches: number;
  eliminatedByCount: number; // times opponent eliminated player's team
  eliminatedCount: number;   // times player's team eliminated opponent
}
