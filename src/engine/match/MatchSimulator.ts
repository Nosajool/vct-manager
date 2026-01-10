// MatchSimulator Engine
// Pure class with no React/store dependencies
// Handles match simulation logic

import type {
  Team,
  Player,
  MatchResult,
  MapResult,
  PlayerMapPerformance,
} from '../../types';
import { MAPS, ALL_AGENTS } from '../../utils/constants';

// Stat weights for team strength calculation
const STAT_WEIGHTS = {
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
const MAX_CHEMISTRY_BONUS = 0.20;

export class MatchSimulator {
  /**
   * Simulate a complete match between two teams
   * Best-of-3 format (first to 2 maps)
   */
  simulate(
    teamA: Team,
    teamB: Team,
    playersA: Player[],
    playersB: Player[]
  ): MatchResult {
    const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Calculate team strengths
    const strengthA = this.calculateTeamStrength(playersA, teamA.chemistry.overall);
    const strengthB = this.calculateTeamStrength(playersB, teamB.chemistry.overall);

    // Select maps for the match (pick 3 unique maps)
    const selectedMaps = this.selectMaps(3);

    // Simulate maps until one team wins 2
    const maps: MapResult[] = [];
    let mapsWonA = 0;
    let mapsWonB = 0;

    for (const map of selectedMaps) {
      if (mapsWonA >= 2 || mapsWonB >= 2) break;

      const mapResult = this.simulateMap(
        map,
        strengthA,
        strengthB,
        playersA,
        playersB
      );
      maps.push(mapResult);

      if (mapResult.winner === 'teamA') {
        mapsWonA++;
      } else {
        mapsWonB++;
      }
    }

    // Calculate total duration (roughly 30-45 min per map)
    const totalRounds = maps.reduce((sum, m) => sum + m.totalRounds, 0);
    const duration = Math.round(totalRounds * 1.8); // ~1.8 min per round

    const winnerId = mapsWonA > mapsWonB ? teamA.id : teamB.id;
    const loserId = mapsWonA > mapsWonB ? teamB.id : teamA.id;

    return {
      matchId,
      winnerId,
      loserId,
      maps,
      scoreTeamA: mapsWonA,
      scoreTeamB: mapsWonB,
      duration,
    };
  }

  /**
   * Calculate overall team strength from player stats and chemistry
   */
  calculateTeamStrength(players: Player[], chemistryScore: number): number {
    if (players.length === 0) return 50;

    // Calculate average weighted stats for all players
    let totalStrength = 0;

    for (const player of players) {
      let playerStrength = 0;

      // Apply stat weights
      playerStrength += player.stats.mechanics * STAT_WEIGHTS.mechanics;
      playerStrength += player.stats.igl * STAT_WEIGHTS.igl;
      playerStrength += player.stats.mental * STAT_WEIGHTS.mental;
      playerStrength += player.stats.clutch * STAT_WEIGHTS.clutch;
      playerStrength += player.stats.entry * STAT_WEIGHTS.entry;
      playerStrength += player.stats.support * STAT_WEIGHTS.support;
      playerStrength += player.stats.lurking * STAT_WEIGHTS.lurking;
      playerStrength += player.stats.vibes * STAT_WEIGHTS.vibes;

      // Apply form modifier (±10%)
      const formModifier = 1 + ((player.form - 70) / 100) * 0.1;
      playerStrength *= formModifier;

      totalStrength += playerStrength;
    }

    const avgStrength = totalStrength / players.length;

    // Apply chemistry bonus (0-20%)
    const chemistryBonus = 1 + (chemistryScore / 100) * MAX_CHEMISTRY_BONUS;

    return avgStrength * chemistryBonus;
  }

  /**
   * Select random unique maps
   */
  private selectMaps(count: number): string[] {
    const shuffled = [...MAPS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Simulate a single map
   */
  private simulateMap(
    mapName: string,
    teamAStrength: number,
    teamBStrength: number,
    playersA: Player[],
    playersB: Player[]
  ): MapResult {
    // Calculate win probability for each round
    const totalStrength = teamAStrength + teamBStrength;
    const probA = teamAStrength / totalStrength;

    // Simulate rounds
    let scoreA = 0;
    let scoreB = 0;
    let roundsPlayed = 0;

    // First to 13 wins, but must win by 2 in OT
    while (true) {
      roundsPlayed++;

      // Add some randomness to each round (±10% swing)
      const roundRandom = 0.9 + Math.random() * 0.2;
      const adjustedProbA = Math.min(0.85, Math.max(0.15, probA * roundRandom));

      if (Math.random() < adjustedProbA) {
        scoreA++;
      } else {
        scoreB++;
      }

      // Check win conditions
      if (scoreA >= 13 && scoreA - scoreB >= 2) break;
      if (scoreB >= 13 && scoreB - scoreA >= 2) break;

      // Safety: cap at 30 rounds (should never hit)
      if (roundsPlayed >= 30) break;
    }

    const winner = scoreA > scoreB ? 'teamA' : 'teamB';
    const overtime = scoreA > 12 && scoreB > 12;
    const overtimeRounds = overtime ? roundsPlayed - 24 : 0;

    // Generate player performances
    const teamAPerformances = playersA.map((player) =>
      this.generatePlayerPerformance(player, teamAStrength, winner === 'teamA', roundsPlayed)
    );
    const teamBPerformances = playersB.map((player) =>
      this.generatePlayerPerformance(player, teamBStrength, winner === 'teamB', roundsPlayed)
    );

    return {
      map: mapName,
      teamAScore: scoreA,
      teamBScore: scoreB,
      winner,
      teamAPerformances,
      teamBPerformances,
      totalRounds: roundsPlayed,
      overtime,
      overtimeRounds: overtime ? overtimeRounds : undefined,
    };
  }

  /**
   * Generate individual player performance for a map
   */
  private generatePlayerPerformance(
    player: Player,
    _teamStrength: number,
    teamWon: boolean,
    totalRounds: number
  ): PlayerMapPerformance {
    // Base performance from player stats
    const mechanicsImpact = player.stats.mechanics / 100;
    const entryImpact = player.stats.entry / 100;
    const supportImpact = player.stats.support / 100;

    // Expected kills per round (0.6-1.2 based on skill)
    const baseKillsPerRound = 0.6 + mechanicsImpact * 0.6;

    // Winners get slightly better stats (+10%)
    const winBonus = teamWon ? 1.1 : 0.95;

    // Add randomness (±20%)
    const randomFactor = 0.8 + Math.random() * 0.4;

    // Calculate kills
    const kills = Math.round(
      totalRounds * baseKillsPerRound * winBonus * randomFactor
    );

    // Deaths are based on team performance and opponent strength
    // Fewer deaths if your team won
    const deathsPerRound = teamWon ? 0.7 : 0.85;
    const deaths = Math.round(
      totalRounds * deathsPerRound * (0.8 + Math.random() * 0.4)
    );

    // Assists based on support stat
    const assistsPerRound = 0.2 + supportImpact * 0.4;
    const assists = Math.round(
      totalRounds * assistsPerRound * (0.7 + Math.random() * 0.6)
    );

    // Calculate K/D ratio
    const kd = deaths > 0 ? Math.round((kills / deaths) * 100) / 100 : kills;

    // Calculate ACS (Average Combat Score)
    // Simplified: based on kills, assists, and some randomness
    // Real ACS is more complex but this gives realistic values
    const acs = Math.round(
      (kills * 200 + assists * 50 + kills * entryImpact * 50) / (totalRounds / 10)
    );

    // Select a random agent
    const agent = ALL_AGENTS[Math.floor(Math.random() * ALL_AGENTS.length)];

    return {
      playerId: player.id,
      playerName: player.name,
      agent,
      kills,
      deaths,
      assists,
      acs,
      kd,
    };
  }
}

// Export singleton instance
export const matchSimulator = new MatchSimulator();
