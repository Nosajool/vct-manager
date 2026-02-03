// RoundSimulator - Simulates individual rounds with economy, ultimates, and detailed events
// Integrates EconomyEngine, UltimateEngine, and CompositionEngine
// Pure class with no React/store dependencies

import type {
  Player,
  TeamStrategy,
  EnhancedRoundInfo,
  WinCondition,
  FirstBlood,
  ClutchAttempt,
  UltUsage,
  EnhancedPlayerMapPerformance,
  BuyType,
} from '../../types';
import { STAT_FORMULAS } from './constants';
import { EconomyEngine, type TeamEconomyState } from './EconomyEngine';
import { UltimateEngine, type TeamUltimateState } from './UltimateEngine';

/**
 * Individual round result with all tracking data
 */
export interface RoundResult {
  /** Enhanced round info for storage */
  roundInfo: EnhancedRoundInfo;

  /** Updated economy states */
  teamAEconomy: TeamEconomyState;
  teamBEconomy: TeamEconomyState;

  /** Updated ult states */
  teamAUlts: TeamUltimateState;
  teamBUlts: TeamUltimateState;

  /** Player performance updates for this round */
  playerPerformance: Map<string, RoundPlayerPerformance>;
}

/**
 * Per-round performance tracking for a player
 */
export interface RoundPlayerPerformance {
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  gotFirstKill: boolean;
  gotFirstDeath: boolean;
  attemptedClutch: boolean;
  wonClutch: boolean;
  planted: boolean;
  defused: boolean;
  survivedRound: boolean;
  usedUlt: boolean;
  headshotKills: number;
}

/**
 * Team context for round simulation
 */
export interface TeamRoundContext {
  players: Player[];
  agents: string[];
  strategy: TeamStrategy;
  economy: TeamEconomyState;
  ultState: TeamUltimateState;
  baseStrength: number;
  compositionBonus: number;
  isAttacking: boolean;
}

export class RoundSimulator {
  private economyEngine: EconomyEngine;
  private ultimateEngine: UltimateEngine;

  constructor() {
    this.economyEngine = new EconomyEngine();
    this.ultimateEngine = new UltimateEngine();
  }

  /**
   * Simulate a single round
   */
  simulateRound(
    roundNumber: number,
    teamAContext: TeamRoundContext,
    teamBContext: TeamRoundContext,
    currentScoreA: number,
    currentScoreB: number
  ): RoundResult {
    // Determine buy types
    const buyTypeA = this.economyEngine.determineBuyType(
      teamAContext.economy,
      teamAContext.strategy,
      roundNumber,
      teamBContext.economy
    );
    const buyTypeB = this.economyEngine.determineBuyType(
      teamBContext.economy,
      teamBContext.strategy,
      roundNumber,
      teamAContext.economy
    );

    // Get buy strength modifiers
    const buyModA = this.economyEngine.getBuyStrengthModifier(buyTypeA);
    const buyModB = this.economyEngine.getBuyStrengthModifier(buyTypeB);

    // Decide on ult usage
    const ultDecisionA = this.ultimateEngine.decideUltUsage(
      teamAContext.ultState,
      teamAContext.strategy,
      roundNumber,
      currentScoreA,
      currentScoreB,
      teamAContext.isAttacking
    );
    const ultDecisionB = this.ultimateEngine.decideUltUsage(
      teamBContext.ultState,
      teamBContext.strategy,
      roundNumber,
      currentScoreB,
      currentScoreA,
      teamBContext.isAttacking
    );

    // Calculate effective round strengths
    const strengthA =
      teamAContext.baseStrength *
      buyModA *
      (1 + teamAContext.compositionBonus) *
      (1 + ultDecisionA.impactModifier);

    const strengthB =
      teamBContext.baseStrength *
      buyModB *
      (1 + teamBContext.compositionBonus) *
      (1 + ultDecisionB.impactModifier);

    // Calculate win probability
    const totalStrength = strengthA + strengthB;
    let probA = strengthA / totalStrength;

    // Add randomness (±10% swing per round)
    const randomFactor = 0.9 + Math.random() * 0.2;
    probA = Math.min(0.85, Math.max(0.15, probA * randomFactor));

    // Determine round winner
    const teamAWins = Math.random() < probA;
    const winner = teamAWins ? 'teamA' : 'teamB';

    // Simulate round events
    const events = this.simulateRoundEvents(
      teamAContext,
      teamBContext,
      teamAWins,
      ultDecisionA.ultsToUse,
      ultDecisionB.ultsToUse
    );

    // Update economy states
    const updatedEconomyA = this.updateEconomy(
      teamAContext.economy,
      teamAWins,
      events.playerKillsA,
      events.spikePlanted && teamAContext.isAttacking,
      events.winCondition === 'spike_defused' && !teamAContext.isAttacking,
      buyTypeA
    );

    const updatedEconomyB = this.updateEconomy(
      teamBContext.economy,
      !teamAWins,
      events.playerKillsB,
      events.spikePlanted && teamBContext.isAttacking,
      events.winCondition === 'spike_defused' && !teamBContext.isAttacking,
      buyTypeB
    );

    // Update ult states
    const updatedUltsA = this.updateUlts(
      teamAContext.ultState,
      events.playerKillsA,
      events.spikePlanted && teamAContext.isAttacking,
      events.winCondition === 'spike_defused' && !teamAContext.isAttacking,
      events.planterId,
      events.defuserId,
      ultDecisionA.ultsToUse
    );

    const updatedUltsB = this.updateUlts(
      teamBContext.ultState,
      events.playerKillsB,
      events.spikePlanted && teamBContext.isAttacking,
      events.winCondition === 'spike_defused' && !teamBContext.isAttacking,
      events.planterId,
      events.defuserId,
      ultDecisionB.ultsToUse
    );

    // Create round info
    const roundInfo: EnhancedRoundInfo = {
      roundNumber,
      winner,
      winCondition: events.winCondition,
      teamAEconomy: this.economyEngine.createEconomySnapshot(teamAContext.economy, buyTypeA),
      teamBEconomy: this.economyEngine.createEconomySnapshot(teamBContext.economy, buyTypeB),
      firstBlood: events.firstBlood,
      spikePlanted: events.spikePlanted,
      clutchAttempt: events.clutchAttempt,
      ultsUsed: [...ultDecisionA.ultsToUse, ...ultDecisionB.ultsToUse],
      teamAScore: currentScoreA + (teamAWins ? 1 : 0),
      teamBScore: currentScoreB + (teamAWins ? 0 : 1),
    };

    return {
      roundInfo,
      teamAEconomy: updatedEconomyA,
      teamBEconomy: updatedEconomyB,
      teamAUlts: updatedUltsA,
      teamBUlts: updatedUltsB,
      playerPerformance: events.playerPerformance,
    };
  }

  /**
   * Initialize player performance tracking
   */
  initializePlayerPerformance(playerIds: string[]): Map<string, EnhancedPlayerMapPerformance> {
    const performances = new Map<string, EnhancedPlayerMapPerformance>();

    for (const id of playerIds) {
      performances.set(id, {
        playerId: id,
        playerName: '',
        agent: '',
        kills: 0,
        deaths: 0,
        assists: 0,
        acs: 0,
        kd: 0,
        firstKills: 0,
        firstDeaths: 0,
        clutchesAttempted: 0,
        clutchesWon: 0,
        plants: 0,
        defuses: 0,
        kast: 0,
        adr: 0,
        hsPercent: 0,
        ultsUsed: 0,
      });
    }

    return performances;
  }

  /**
   * Aggregate round performances into map performance
   */
  aggregatePerformances(
    roundPerformances: Map<string, RoundPlayerPerformance>[],
    players: Player[],
    agents: string[],
    totalRounds: number
  ): EnhancedPlayerMapPerformance[] {
    return players.map((player, index) => {
      let totalKills = 0;
      let totalDeaths = 0;
      let totalAssists = 0;
      let totalDamage = 0;
      let firstKills = 0;
      let firstDeaths = 0;
      let clutchesAttempted = 0;
      let clutchesWon = 0;
      let plants = 0;
      let defuses = 0;
      let kastRounds = 0;
      let ultsUsed = 0;
      let headshotKills = 0;

      for (const roundPerf of roundPerformances) {
        const perf = roundPerf.get(player.id);
        if (!perf) continue;

        totalKills += perf.kills;
        totalDeaths += perf.deaths;
        totalAssists += perf.assists;
        totalDamage += perf.damage;
        if (perf.gotFirstKill) firstKills++;
        if (perf.gotFirstDeath) firstDeaths++;
        if (perf.attemptedClutch) clutchesAttempted++;
        if (perf.wonClutch) clutchesWon++;
        if (perf.planted) plants++;
        if (perf.defused) defuses++;
        if (perf.usedUlt) ultsUsed++;
        headshotKills += perf.headshotKills;

        // KAST: Kills/Assists/Survived/Traded
        if (perf.kills > 0 || perf.assists > 0 || perf.survivedRound) {
          kastRounds++;
        }
      }

      const kd = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;
      const adr = totalRounds > 0 ? totalDamage / totalRounds : 0;
      const hsPercent = totalKills > 0 ? (headshotKills / totalKills) * 100 : 0;
      const kast = totalRounds > 0 ? (kastRounds / totalRounds) * 100 : 0;

      // Calculate ACS (simplified formula)
      const acs = Math.round(
        (totalKills * 200 + totalAssists * 50 + plants * 75 + defuses * 75) /
          Math.max(1, totalRounds / 10)
      );

      return {
        playerId: player.id,
        playerName: player.name,
        agent: agents[index],
        kills: totalKills,
        deaths: totalDeaths,
        assists: totalAssists,
        acs,
        kd: Math.round(kd * 100) / 100,
        firstKills,
        firstDeaths,
        clutchesAttempted,
        clutchesWon,
        plants,
        defuses,
        kast: Math.round(kast),
        adr: Math.round(adr),
        hsPercent: Math.round(hsPercent),
        ultsUsed,
      };
    });
  }

  /**
   * Simulate detailed round events
   */
  private simulateRoundEvents(
    teamAContext: TeamRoundContext,
    teamBContext: TeamRoundContext,
    teamAWins: boolean,
    ultsUsedA: UltUsage[],
    ultsUsedB: UltUsage[]
  ): {
    firstBlood: FirstBlood | null;
    spikePlanted: boolean;
    clutchAttempt: ClutchAttempt | null;
    winCondition: WinCondition;
    playerKillsA: number[];
    playerKillsB: number[];
    planterId?: string;
    defuserId?: string;
    playerPerformance: Map<string, RoundPlayerPerformance>;
  } {
    const playerPerformance = new Map<string, RoundPlayerPerformance>();

    // Initialize performance for all players
    [...teamAContext.players, ...teamBContext.players].forEach((p) => {
      playerPerformance.set(p.id, {
        kills: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        gotFirstKill: false,
        gotFirstDeath: false,
        attemptedClutch: false,
        wonClutch: false,
        planted: false,
        defused: false,
        survivedRound: true,
        usedUlt: false,
        headshotKills: 0,
      });
    });

    // Mark ults used
    for (const ult of [...ultsUsedA, ...ultsUsedB]) {
      const perf = playerPerformance.get(ult.playerId);
      if (perf) perf.usedUlt = true;
    }

    // Determine first blood
    const firstBlood = this.simulateFirstBlood(teamAContext, teamBContext, playerPerformance);

    // Determine if spike is planted (attacking team action)
    const attackingContext = teamAContext.isAttacking ? teamAContext : teamBContext;
    const defendingContext = teamAContext.isAttacking ? teamBContext : teamAContext;
    const attackerWon = teamAContext.isAttacking ? teamAWins : !teamAWins;

    // Spike plant probability based on round flow
    const spikePlanted = this.simulateSpikePlant(attackingContext, attackerWon);
    let planterId: string | undefined;
    let defuserId: string | undefined;

    if (spikePlanted) {
      // Determine who planted
      planterId = this.selectPlanter(attackingContext, playerPerformance);
      const planterPerf = playerPerformance.get(planterId);
      if (planterPerf) planterPerf.planted = true;
    }

    // Determine win condition
    let winCondition: WinCondition;
    if (spikePlanted) {
      if (attackerWon) {
        winCondition = 'spike_detonated';
      } else {
        winCondition = 'spike_defused';
        // Determine who defused
        defuserId = this.selectDefuser(defendingContext, playerPerformance);
        const defuserPerf = playerPerformance.get(defuserId);
        if (defuserPerf) defuserPerf.defused = true;
      }
    } else {
      if (attackerWon) {
        // Attackers won without plant = elimination
        winCondition = 'elimination';
      } else {
        // Defenders won without spike = elimination or time expired
        winCondition = Math.random() > 0.3 ? 'elimination' : 'time_expired';
      }
    }

    // Simulate kills and deaths distribution
    const { playerKillsA, playerKillsB } = this.distributeKillsAndDeaths(
      teamAContext,
      teamBContext,
      teamAWins,
      playerPerformance
    );

    // Simulate clutch scenario
    const clutchAttempt = this.simulateClutch(
      teamAContext,
      teamBContext,
      teamAWins,
      playerPerformance
    );

    // Mark deaths (losers died more)
    this.markDeaths(
      teamAWins ? teamBContext : teamAContext,
      teamAWins ? teamAContext : teamBContext,
      playerPerformance
    );

    return {
      firstBlood,
      spikePlanted,
      clutchAttempt,
      winCondition,
      playerKillsA,
      playerKillsB,
      planterId,
      defuserId,
      playerPerformance,
    };
  }

  /**
   * Simulate first blood event
   */
  private simulateFirstBlood(
    teamAContext: TeamRoundContext,
    teamBContext: TeamRoundContext,
    playerPerformance: Map<string, RoundPlayerPerformance>
  ): FirstBlood | null {
    // 95% of rounds have first blood (rest are time expires)
    if (Math.random() > 0.95) return null;

    // Calculate first blood chances for each player
    const calcFirstKillChance = (player: Player): number => {
      const { entry, mechanics } = player.stats;
      return entry * STAT_FORMULAS.FIRST_KILL.entry + mechanics * STAT_FORMULAS.FIRST_KILL.mechanics;
    };

    const calcFirstDeathChance = (player: Player): number => {
      const { entry, lurking, mental } = player.stats;
      // Higher entry = more first deaths, higher lurking/mental = fewer
      return (
        entry * 0.5 -
        lurking * 0.3 -
        mental * 0.2 +
        50 // Base
      );
    };

    // Select potential first blood participants
    const teamAKillers = teamAContext.players.map((p) => ({
      player: p,
      chance: calcFirstKillChance(p),
    }));
    const teamBKillers = teamBContext.players.map((p) => ({
      player: p,
      chance: calcFirstKillChance(p),
    }));

    const teamAVictims = teamAContext.players.map((p) => ({
      player: p,
      chance: calcFirstDeathChance(p),
    }));
    const teamBVictims = teamBContext.players.map((p) => ({
      player: p,
      chance: calcFirstDeathChance(p),
    }));

    // Determine which team gets first blood
    const teamATotalKillChance = teamAKillers.reduce((sum, k) => sum + k.chance, 0);
    const teamBTotalKillChance = teamBKillers.reduce((sum, k) => sum + k.chance, 0);

    const teamAGetsFirstBlood =
      Math.random() < teamATotalKillChance / (teamATotalKillChance + teamBTotalKillChance);

    // Select killer and victim
    const killers = teamAGetsFirstBlood ? teamAKillers : teamBKillers;
    const victims = teamAGetsFirstBlood ? teamBVictims : teamAVictims;

    const killer = this.weightedSelect(killers);
    const victim = this.weightedSelect(victims);

    // Update performance
    const killerPerf = playerPerformance.get(killer.id);
    const victimPerf = playerPerformance.get(victim.id);
    if (killerPerf) killerPerf.gotFirstKill = true;
    if (victimPerf) victimPerf.gotFirstDeath = true;

    return {
      killerId: killer.id,
      victimId: victim.id,
      side: teamAGetsFirstBlood ? 'teamA' : 'teamB',
    };
  }

  /**
   * Simulate spike plant
   */
  private simulateSpikePlant(
    attackingContext: TeamRoundContext,
    attackerWon: boolean
  ): boolean {
    // Base plant probability
    let plantProb = attackerWon ? 0.65 : 0.35;

    // Aggressive playstyle increases plant chance
    if (attackingContext.strategy.playstyle === 'aggressive') {
      plantProb += 0.1;
    } else if (attackingContext.strategy.playstyle === 'passive') {
      plantProb -= 0.1;
    }

    return Math.random() < plantProb;
  }

  /**
   * Select which player planted
   */
  private selectPlanter(
    attackingContext: TeamRoundContext,
    playerPerformance: Map<string, RoundPlayerPerformance>
  ): string {
    // Weight by entry stat (entry players tend to be near site)
    const weights = attackingContext.players.map((p) => ({
      player: p,
      chance: p.stats.entry * 0.5 + p.stats.support * 0.3 + 30,
    }));

    // Exclude dead players
    const alive = weights.filter((w) => {
      const perf = playerPerformance.get(w.player.id);
      return perf?.survivedRound ?? true;
    });

    if (alive.length === 0) {
      return attackingContext.players[0].id;
    }

    return this.weightedSelect(alive).id;
  }

  /**
   * Select which player defused
   */
  private selectDefuser(
    defendingContext: TeamRoundContext,
    playerPerformance: Map<string, RoundPlayerPerformance>
  ): string {
    // Weight by mental and clutch (calm under pressure)
    const weights = defendingContext.players.map((p) => ({
      player: p,
      chance: p.stats.mental * 0.5 + p.stats.clutch * 0.3 + 30,
    }));

    // Exclude dead players
    const alive = weights.filter((w) => {
      const perf = playerPerformance.get(w.player.id);
      return perf?.survivedRound ?? true;
    });

    if (alive.length === 0) {
      return defendingContext.players[0].id;
    }

    return this.weightedSelect(alive).id;
  }

  /**
   * Distribute kills and deaths among players
   */
  private distributeKillsAndDeaths(
    teamAContext: TeamRoundContext,
    teamBContext: TeamRoundContext,
    teamAWins: boolean,
    playerPerformance: Map<string, RoundPlayerPerformance>
  ): { playerKillsA: number[]; playerKillsB: number[] } {
    // Average total kills per round is about 7-8 across both teams
    const totalKills = 5 + Math.floor(Math.random() * 4); // 5-8 kills
    const winnerKills = teamAWins
      ? Math.ceil(totalKills * 0.6)
      : Math.floor(totalKills * 0.4);
    const loserKills = totalKills - winnerKills;

    const teamAKills = teamAWins ? winnerKills : loserKills;
    const teamBKills = teamAWins ? loserKills : winnerKills;

    // Distribute kills based on mechanics
    const distributeKills = (context: TeamRoundContext, totalKills: number): number[] => {
      const weights = context.players.map((p) => p.stats.mechanics + p.stats.entry * 0.5);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);

      const kills: number[] = [];
      let remaining = totalKills;

      for (let i = 0; i < context.players.length; i++) {
        if (i === context.players.length - 1) {
          kills.push(remaining);
        } else {
          const expected = (weights[i] / totalWeight) * totalKills;
          const variance = Math.random() * 0.4 - 0.2; // ±20%
          const playerKills = Math.max(
            0,
            Math.min(remaining, Math.round(expected * (1 + variance)))
          );
          kills.push(playerKills);
          remaining -= playerKills;
        }
      }

      return kills;
    };

    const playerKillsA = distributeKills(teamAContext, teamAKills);
    const playerKillsB = distributeKills(teamBContext, teamBKills);

    // Update performance map
    teamAContext.players.forEach((p, i) => {
      const perf = playerPerformance.get(p.id);
      if (perf) {
        perf.kills = playerKillsA[i];
        // Estimate headshots (30-50% based on mechanics)
        const hsRate = 0.3 + (p.stats.mechanics / 100) * 0.2;
        perf.headshotKills = Math.round(playerKillsA[i] * hsRate);
        // Estimate damage
        perf.damage = playerKillsA[i] * 130 + Math.round(Math.random() * 50);
      }
    });

    teamBContext.players.forEach((p, i) => {
      const perf = playerPerformance.get(p.id);
      if (perf) {
        perf.kills = playerKillsB[i];
        const hsRate = 0.3 + (p.stats.mechanics / 100) * 0.2;
        perf.headshotKills = Math.round(playerKillsB[i] * hsRate);
        perf.damage = playerKillsB[i] * 130 + Math.round(Math.random() * 50);
      }
    });

    return { playerKillsA, playerKillsB };
  }

  /**
   * Simulate clutch scenario
   */
  private simulateClutch(
    teamAContext: TeamRoundContext,
    teamBContext: TeamRoundContext,
    teamAWins: boolean,
    playerPerformance: Map<string, RoundPlayerPerformance>
  ): ClutchAttempt | null {
    // 15% of rounds have clutch situations
    if (Math.random() > 0.15) return null;

    // Clutcher is from winning team 60% of the time
    const clutcherContext = Math.random() < 0.6
      ? (teamAWins ? teamAContext : teamBContext)
      : (teamAWins ? teamBContext : teamAContext);

    // Select clutcher based on clutch stat
    const weights = clutcherContext.players.map((p) => ({
      player: p,
      chance: p.stats.clutch * 0.7 + p.stats.mental * 0.3,
    }));

    const clutcher = this.weightedSelect(weights);

    // Determine situation (1vX)
    const situations: Array<'1v1' | '1v2' | '1v3' | '1v4' | '1v5'> = ['1v1', '1v2', '1v3', '1v4', '1v5'];
    const situationWeights = [40, 30, 20, 8, 2]; // 1v1 most common
    const situation = situations[this.weightedIndexSelect(situationWeights)];

    // Calculate clutch success
    const baseClutchChance = {
      '1v1': 0.5,
      '1v2': 0.25,
      '1v3': 0.1,
      '1v4': 0.03,
      '1v5': 0.01,
    }[situation];

    const clutchStatBonus = (clutcher.stats.clutch / 100) * 0.3;
    const won = Math.random() < baseClutchChance + clutchStatBonus;

    // Update performance
    const perf = playerPerformance.get(clutcher.id);
    if (perf) {
      perf.attemptedClutch = true;
      perf.wonClutch = won;
    }

    return {
      playerId: clutcher.id,
      situation,
      won,
    };
  }

  /**
   * Mark deaths for losing team
   */
  private markDeaths(
    losingContext: TeamRoundContext,
    winningContext: TeamRoundContext,
    playerPerformance: Map<string, RoundPlayerPerformance>
  ): void {
    // All losers die
    for (const player of losingContext.players) {
      const perf = playerPerformance.get(player.id);
      if (perf) {
        perf.deaths = 1;
        perf.survivedRound = false;
      }
    }

    // Some winners might die (based on kills they gave up)
    const loserKills = losingContext.players.reduce((sum, p) => {
      const perf = playerPerformance.get(p.id);
      return sum + (perf?.kills || 0);
    }, 0);

    // Distribute deaths to winners
    const deathWeights = winningContext.players.map((p) => ({
      player: p,
      // Entry players and low lurking die more
      chance: p.stats.entry * 0.4 + (100 - p.stats.lurking) * 0.3 + 30,
    }));

    let deathsToAssign = Math.min(loserKills, winningContext.players.length - 1); // At least 1 survives

    while (deathsToAssign > 0) {
      const victim = this.weightedSelect(deathWeights);
      const perf = playerPerformance.get(victim.id);
      if (perf && perf.deaths === 0) {
        perf.deaths = 1;
        perf.survivedRound = false;
        deathsToAssign--;
      }
      // Prevent infinite loop
      if (Math.random() < 0.3) deathsToAssign--;
    }
  }

  /**
   * Update economy after round
   */
  private updateEconomy(
    economy: TeamEconomyState,
    won: boolean,
    playerKills: number[],
    planted: boolean,
    defused: boolean,
    buyType: BuyType
  ): TeamEconomyState {
    const update = this.economyEngine.calculateRoundCredits(
      won,
      playerKills,
      planted,
      defused,
      economy
    );

    return this.economyEngine.updateEconomyState(economy, update, buyType, playerKills);
  }

  /**
   * Update ultimates after round
   */
  private updateUlts(
    ultState: TeamUltimateState,
    playerKills: number[],
    planted: boolean,
    defused: boolean,
    planterId: string | undefined,
    defuserId: string | undefined,
    usedUlts: UltUsage[]
  ): TeamUltimateState {
    // First award points
    const playerKillMap = new Map<string, number>();
    ultState.players.forEach((p, i) => {
      playerKillMap.set(p.playerId, playerKills[i] || 0);
    });

    let updated = this.ultimateEngine.awardUltPoints(
      ultState,
      playerKillMap,
      planted,
      defused,
      planterId,
      defuserId
    );

    // Then consume used ults
    if (usedUlts.length > 0) {
      updated = this.ultimateEngine.consumeUlts(updated, usedUlts);
    }

    return updated;
  }

  /**
   * Weighted random selection
   */
  private weightedSelect<T extends { chance: number }>(items: Array<T & { player: Player }>): Player {
    const totalWeight = items.reduce((sum, i) => sum + i.chance, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
      random -= item.chance;
      if (random <= 0) {
        return item.player;
      }
    }

    return items[items.length - 1].player;
  }

  /**
   * Weighted index selection
   */
  private weightedIndexSelect(weights: number[]): number {
    const total = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * total;

    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return i;
      }
    }

    return weights.length - 1;
  }
}

// Export singleton instance
export const roundSimulator = new RoundSimulator();
