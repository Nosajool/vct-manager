// MatchSimulator Engine
// Pure class with no React/store dependencies
// Handles match simulation logic with enhanced round-by-round simulation

import type {
  Team,
  Player,
  MatchResult,
  MapResult,
  PlayerMapPerformance,
  EnhancedRoundInfo,
  TeamStrategy,
} from '../../types';
import { MAPS } from '../../utils/constants';

import { STAT_WEIGHTS, MAX_CHEMISTRY_BONUS } from './constants';
import { EconomyEngine } from './EconomyEngine';
import { UltimateEngine } from './UltimateEngine';
import { CompositionEngine } from './CompositionEngine';
import { RoundSimulator, type TeamRoundContext, type RoundPlayerPerformance } from './RoundSimulator';

export class MatchSimulator {
  private economyEngine: EconomyEngine;
  private ultimateEngine: UltimateEngine;
  private compositionEngine: CompositionEngine;
  private roundSimulator: RoundSimulator;

  constructor() {
    this.economyEngine = new EconomyEngine();
    this.ultimateEngine = new UltimateEngine();
    this.compositionEngine = new CompositionEngine();
    this.roundSimulator = new RoundSimulator();
  }

  /**
   * Simulate a complete match between two teams
   * Best-of-3 format (first to 2 maps)
   * @param teamA - First team
   * @param teamB - Second team
   * @param playersA - Players on team A
   * @param playersB - Players on team B
   * @param mapPoolA - Optional map pool for team A (applies map-specific bonuses)
   * @param mapPoolB - Optional map pool for team B (applies map-specific bonuses)
   * @param strategyA - Optional strategy for team A
   * @param strategyB - Optional strategy for team B
   */
  simulate(
    teamA: Team,
    teamB: Team,
    playersA: Player[],
    playersB: Player[],
    strategyA?: TeamStrategy,
    strategyB?: TeamStrategy,
    rivalryIntensity?: number
  ): MatchResult {
    const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Use default strategies if not provided
    const teamAStrategy = strategyA || this.getDefaultStrategy();
    const teamBStrategy = strategyB || this.getDefaultStrategy();

    // Calculate base team strengths
    let strengthA = this.calculateTeamStrength(playersA, teamA.chemistry.overall);
    let strengthB = this.calculateTeamStrength(playersB, teamB.chemistry.overall);

    // Rivalry volatility: high-intensity rivalries (>70) add ±3% noise to both sides
    if (rivalryIntensity !== undefined && rivalryIntensity > 70) {
      const noiseA = 1 + (Math.random() * 0.06 - 0.03);
      const noiseB = 1 + (Math.random() * 0.06 - 0.03);
      strengthA *= noiseA;
      strengthB *= noiseB;
    }

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
        playersB,
        teamAStrategy,
        teamBStrategy
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
   * Get default strategy
   */
  private getDefaultStrategy(): TeamStrategy {
    return {
      playstyle: 'balanced',
      economyDiscipline: 'standard',
      forceThreshold: 2400,
      defaultComposition: {
        duelist: 1,
        controller: 1,
        initiator: 2,
        sentinel: 1,
      },
      ultUsageStyle: 'save_for_key_rounds',
    };
  }

  /**
   * Select random unique maps
   */
  private selectMaps(count: number): string[] {
    const shuffled = [...MAPS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }



  /**
   * Simulate a single map with enhanced round-by-round simulation
   */
  private simulateMap(
    mapName: string,
    teamAStrength: number,
    teamBStrength: number,
    playersA: Player[],
    playersB: Player[],
    strategyA: TeamStrategy,
    strategyB: TeamStrategy
  ): MapResult {
    const adjustedStrengthA = teamAStrength;
    const adjustedStrengthB = teamBStrength;

    // Select agents for each team
    const agentSelectionA = this.compositionEngine.selectAgents(playersA, strategyA, mapName);
    const agentSelectionB = this.compositionEngine.selectAgents(playersB, strategyB, mapName);

    const agentsA = playersA.map((p) => agentSelectionA.assignments[p.id]);
    const agentsB = playersB.map((p) => agentSelectionB.assignments[p.id]);

    // Initialize economy and ult states
    let economyA = this.economyEngine.initializeHalf();
    let economyB = this.economyEngine.initializeHalf();
    let ultsA = this.ultimateEngine.initializeUltState(
      playersA.map((p) => p.id),
      agentsA
    );
    let ultsB = this.ultimateEngine.initializeUltState(
      playersB.map((p) => p.id),
      agentsB
    );

    // Track rounds and performances
    const enhancedRounds: EnhancedRoundInfo[] = [];
    const roundPerformances: Map<string, RoundPlayerPerformance>[] = [];

    let scoreA = 0;
    let scoreB = 0;
    let roundsPlayed = 0;

    // Track previous round state for weapon carryover
    let previousLoadoutsA: Map<string, any> | null = null;
    let previousLoadoutsB: Map<string, any> | null = null;
    let previousSurvivalA: boolean[] = Array(5).fill(false);
    let previousSurvivalB: boolean[] = Array(5).fill(false);

    // Team A attacks first half (rounds 1-12)
    // Team B attacks second half (rounds 13-24)
    // After 12 rounds, sides switch and economy resets

    while (true) {
      roundsPlayed++;

      // Side switch at round 13
      if (roundsPlayed === 13) {
        // Reset economy for second half
        economyA = this.economyEngine.initializeHalf();
        economyB = this.economyEngine.initializeHalf();
        // Ults persist through half (this is realistic)
        // Reset carryover state on half switch
        previousLoadoutsA = null;
        previousLoadoutsB = null;
        previousSurvivalA = Array(5).fill(false);
        previousSurvivalB = Array(5).fill(false);
      }

      // Determine which side is attacking
      const isFirstHalf = roundsPlayed <= 12;
      const teamAAttacking = isFirstHalf; // Team A attacks first half

      // Create round contexts
      const contextA: TeamRoundContext = {
        players: playersA,
        agents: agentsA,
        strategy: strategyA,
        economy: economyA,
        ultState: ultsA,
        baseStrength: adjustedStrengthA,
        compositionBonus: agentSelectionA.bonus.modifier,
        isAttacking: teamAAttacking,
        previousRoundLoadouts: previousLoadoutsA,
        previousRoundSurvival: previousSurvivalA,
      };

      const contextB: TeamRoundContext = {
        players: playersB,
        agents: agentsB,
        strategy: strategyB,
        economy: economyB,
        ultState: ultsB,
        baseStrength: adjustedStrengthB,
        compositionBonus: agentSelectionB.bonus.modifier,
        isAttacking: !teamAAttacking,
        previousRoundLoadouts: previousLoadoutsB,
        previousRoundSurvival: previousSurvivalB,
      };

      // Simulate the round
      const roundResult = this.roundSimulator.simulateRound(
        roundsPlayed,
        contextA,
        contextB,
        scoreA,
        scoreB
      );

      // Update states
      economyA = roundResult.teamAEconomy;
      economyB = roundResult.teamBEconomy;
      ultsA = roundResult.teamAUlts;
      ultsB = roundResult.teamBUlts;

      // Track loadouts and survival for next round carryover
      previousLoadoutsA = roundResult.playerLoadouts;
      previousLoadoutsB = roundResult.playerLoadouts;
      previousSurvivalA = playersA.map(p => {
        const perf = roundResult.playerPerformance.get(p.id);
        return perf?.survivedRound || false;
      });
      previousSurvivalB = playersB.map(p => {
        const perf = roundResult.playerPerformance.get(p.id);
        return perf?.survivedRound || false;
      });

      // Update scores
      if (roundResult.roundInfo.winner === 'teamA') {
        scoreA++;
      } else {
        scoreB++;
      }

      // Store round data
      enhancedRounds.push(roundResult.roundInfo);
      roundPerformances.push(roundResult.playerPerformance);

      // Check win conditions
      if (scoreA >= 13 && scoreA - scoreB >= 2) break;
      if (scoreB >= 13 && scoreB - scoreA >= 2) break;

      // Safety: cap at 30 rounds (should never hit)
      if (roundsPlayed >= 30) break;
    }

    const winner = scoreA > scoreB ? 'teamA' : 'teamB';
    const overtime = scoreA > 12 && scoreB > 12;
    const overtimeRounds = overtime ? roundsPlayed - 24 : 0;

    // Aggregate player performances
    const teamAPerformances = this.roundSimulator.aggregatePerformances(
      roundPerformances,
      playersA,
      agentsA,
      roundsPlayed
    );

    const teamBPerformances = this.roundSimulator.aggregatePerformances(
      roundPerformances,
      playersB,
      agentsB,
      roundsPlayed
    );

    // Convert enhanced performances to basic format for backward compatibility
    const basicTeamAPerformances: PlayerMapPerformance[] = teamAPerformances;
    const basicTeamBPerformances: PlayerMapPerformance[] = teamBPerformances;

    return {
      map: mapName,
      teamAScore: scoreA,
      teamBScore: scoreB,
      winner,
      teamAPerformances: basicTeamAPerformances,
      teamBPerformances: basicTeamBPerformances,
      totalRounds: roundsPlayed,
      overtime,
      overtimeRounds: overtime ? overtimeRounds : undefined,
      enhancedRounds,
    };
  }
}

// Export singleton instance
export const matchSimulator = new MatchSimulator();
