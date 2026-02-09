// RoundSimulator - Timeline-based round simulation
// Runs buy phase -> combat encounters -> derives everything from timeline
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
import { EconomyEngine, type TeamEconomyState } from './EconomyEngine';
import { UltimateEngine, type TeamUltimateState } from './UltimateEngine';
import { weaponEngine, type PlayerLoadout } from './WeaponEngine';
import { type DamageEvent, type RoundDamageEvents, type PlayerArmorState } from '../../types/match';
import { RoundStateMachine } from './RoundStateMachine';
import { buyPhaseGenerator, type BuyPhaseTeamInput, type BuyPhasePlayerInfo } from './BuyPhaseGenerator';
import { WEAPONS } from '../../data/weapons';
import { SHIELDS } from '../../data/shields';
import { AGENT_ABILITIES } from '../../data/abilities';
import type {
  PlayerRoundState,
  TimelineEvent,
  SimKillEvent,
  TeamSide,
  SimWinCondition,
  BuyPhaseEntry,
} from '../../types/round-simulation';

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

  /** Player loadouts for the round */
  playerLoadouts: Map<string, PlayerLoadout>;
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
  shotsFired: number;
  totalHits: number;
  weaponUsed: string;
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

// ============================================
// COMBAT PHASE TYPES
// ============================================

type CombatPhase = 'opening' | 'early' | 'mid' | 'late' | 'final';

const PHASE_ENCOUNTER_PROBABILITY: Record<CombatPhase, number> = {
  opening: 0.3,
  early: 0.7,
  mid: 0.8,
  late: 0.6,
  final: 0.4,
};

export class RoundSimulator {
  private economyEngine: EconomyEngine;
  private ultimateEngine: UltimateEngine;

  constructor() {
    this.economyEngine = new EconomyEngine();
    this.ultimateEngine = new UltimateEngine();
  }

  /**
   * Simulate a single round using the timeline-based system
   *
   * ARCHITECTURE:
   * 1. Buy Phase: BuyPhaseGenerator determines equipment for all players
   * 2. Combat Simulation: All state changes go through RoundStateMachine
   * 3. Event Recording: Every action is recorded to the timeline
   * 4. Validation: Timeline is validated before deriving summary
   * 5. Summary Derivation: ALL summary data is derived from timeline (no generation)
   *
   * KEY PRINCIPLE: The timeline is the source of truth. Summary never generates
   * data - it only reads and aggregates from timeline events.
   */
  simulateRound(
    roundNumber: number,
    teamAContext: TeamRoundContext,
    teamBContext: TeamRoundContext,
    currentScoreA: number,
    currentScoreB: number
  ): RoundResult {
    // 1. Determine buy types
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

    // 2. Buy phase — generate equipment for both teams
    const attackerCtx = teamAContext.isAttacking ? teamAContext : teamBContext;
    const defenderCtx = teamAContext.isAttacking ? teamBContext : teamAContext;
    const attackerBuyType = teamAContext.isAttacking ? buyTypeA : buyTypeB;
    const defenderBuyType = teamAContext.isAttacking ? buyTypeB : buyTypeA;

    const attackerBuyInput = this.buildBuyPhaseInput(attackerCtx, roundNumber, attackerBuyType);
    const defenderBuyInput = this.buildBuyPhaseInput(defenderCtx, roundNumber, defenderBuyType);

    const buyResult = buyPhaseGenerator.generateBuyPhase(attackerBuyInput, defenderBuyInput);

    // 3. Build PlayerRoundState[] for all players
    const attackerStates = this.buildPlayerRoundStates(attackerCtx, buyResult.attackerEntries, 'attacker');
    const defenderStates = this.buildPlayerRoundStates(defenderCtx, buyResult.defenderEntries, 'defender');
    const allStates = [...attackerStates, ...defenderStates];

    // Build loadout map for backward compatibility
    const allLoadouts = new Map<string, PlayerLoadout>();
    for (const entry of [...buyResult.attackerEntries, ...buyResult.defenderEntries]) {
      const primaryId = entry.weaponPurchased || entry.weaponKept;
      const sidearmId = entry.sidearmPurchased || 'classic';
      allLoadouts.set(entry.playerId, {
        primary: primaryId ? weaponEngine.getWeaponProfileById(primaryId) : null,
        secondary: weaponEngine.getWeaponProfileById(sidearmId),
        shield: entry.shieldPurchased || 'none',
        hasUltimate: false,
      });
    }

    // 4. Select spike carrier (first attacker)
    const spikeCarrierId = attackerStates[0].playerId;

    // 5. Determine half number
    const halfNumber: 1 | 2 | 3 = roundNumber <= 12 ? 1 : roundNumber <= 24 ? 2 : 3;

    // 6. Initialize state machine
    const attackerTeamId = teamAContext.isAttacking ? 'teamA' : 'teamB';
    const defenderTeamId = teamAContext.isAttacking ? 'teamB' : 'teamA';

    const sm = new RoundStateMachine({
      players: allStates,
      spikeCarrierId,
      attackerTeamId,
      defenderTeamId,
      roundNumber,
      halfNumber,
    });

    // 7. Ult decisions (unchanged from old system)
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

    // 8. Calculate strength ratio for combat weighting
    const buyModA = this.economyEngine.getBuyStrengthModifier(buyTypeA);
    const buyModB = this.economyEngine.getBuyStrengthModifier(buyTypeB);
    const strengthA = teamAContext.baseStrength * buyModA *
      (1 + teamAContext.compositionBonus) * (1 + ultDecisionA.impactModifier);
    const strengthB = teamBContext.baseStrength * buyModB *
      (1 + teamBContext.compositionBonus) * (1 + ultDecisionB.impactModifier);
    const strengthRatio = strengthA / (strengthA + strengthB);

    // 9. Combat loop
    this.simulateCombat(sm, attackerCtx, defenderCtx, strengthRatio, ultDecisionA, ultDecisionB);

    // If round hasn't ended naturally (shouldn't happen, but safety), force end
    if (!sm.isRoundEnded()) {
      sm.forceEndRound(sm.getCurrentTimestamp(), 'defender', 'time_expired');
    }

    // 10. Validate timeline before deriving summary
    const validationResult = sm.validateTimeline();
    if (!validationResult.isValid) {
      console.warn('[RoundSimulator] Timeline validation errors:', validationResult.errors);
    }
    if (validationResult.warnings.length > 0) {
      console.warn('[RoundSimulator] Timeline validation warnings:', validationResult.warnings);
    }

    // 11. Derive performance from timeline
    // TODO: Replace with SummaryCalculator once implemented (vct-manager-jnl)
    const allPlayers = [...teamAContext.players, ...teamBContext.players];
    const playerPerformance = this.derivePerformance(sm, allPlayers, allLoadouts);

    // Mark ults used
    for (const ult of [...ultDecisionA.ultsToUse, ...ultDecisionB.ultsToUse]) {
      const perf = playerPerformance.get(ult.playerId);
      if (perf) perf.usedUlt = true;
    }

    // 13. Build backward-compatible result from timeline
    // All summary data is derived from timeline - no independent generation
    const timeline = sm.getTimeline();
    const winner = sm.getWinner();
    const teamAWins = (winner === 'attacker' && teamAContext.isAttacking) ||
                      (winner === 'defender' && !teamAContext.isAttacking);

    const winCondition = this.mapWinCondition(sm.getWinCondition()!);
    const spikePlanted = sm.isSpikePlanted();
    const firstBlood = this.extractFirstBlood(timeline, teamAContext, teamBContext);
    const clutchAttempt = this.deriveClutchInfo(sm, playerPerformance, timeline, teamAContext, teamBContext);

    // Extract planter/defuser IDs from timeline
    const plantEvent = timeline.find(e => e.type === 'plant_complete');
    const defuseEvent = timeline.find(e => e.type === 'defuse_complete');
    const planterId = plantEvent?.type === 'plant_complete' ? plantEvent.planterId : undefined;
    const defuserId = defuseEvent?.type === 'defuse_complete' ? defuseEvent.defuserId : undefined;

    // Build player kill arrays for economy/ult updates
    const playerKillsA = teamAContext.players.map(p => playerPerformance.get(p.id)?.kills || 0);
    const playerKillsB = teamBContext.players.map(p => playerPerformance.get(p.id)?.kills || 0);

    // 14. Build legacy damage events from timeline
    const damageEvents = this.buildLegacyDamageEvents(timeline, allPlayers);
    damageEvents.allEvents = this.buildLegacyRoundEvents(timeline, allPlayers, allLoadouts,
      spikePlanted, planterId, defuserId, winCondition);

    // 15. Update economy
    const updatedEconomyA = this.updateEconomy(
      teamAContext.economy, teamAWins, playerKillsA,
      spikePlanted && teamAContext.isAttacking,
      winCondition === 'spike_defused' && !teamAContext.isAttacking,
      buyTypeA
    );
    const updatedEconomyB = this.updateEconomy(
      teamBContext.economy, !teamAWins, playerKillsB,
      spikePlanted && teamBContext.isAttacking,
      winCondition === 'spike_defused' && !teamBContext.isAttacking,
      buyTypeB
    );

    // 16. Update ults
    const updatedUltsA = this.updateUlts(
      teamAContext.ultState, playerKillsA,
      spikePlanted && teamAContext.isAttacking,
      winCondition === 'spike_defused' && !teamAContext.isAttacking,
      planterId, defuserId, ultDecisionA.ultsToUse
    );
    const updatedUltsB = this.updateUlts(
      teamBContext.ultState, playerKillsB,
      spikePlanted && teamBContext.isAttacking,
      winCondition === 'spike_defused' && !teamBContext.isAttacking,
      planterId, defuserId, ultDecisionB.ultsToUse
    );

    // 17. Build round info
    const roundInfo: EnhancedRoundInfo = {
      roundNumber,
      winner: teamAWins ? 'teamA' : 'teamB',
      winCondition,
      teamAEconomy: this.economyEngine.createEconomySnapshot(teamAContext.economy, buyTypeA),
      teamBEconomy: this.economyEngine.createEconomySnapshot(teamBContext.economy, buyTypeB),
      firstBlood,
      spikePlanted,
      clutchAttempt,
      ultsUsed: [...ultDecisionA.ultsToUse, ...ultDecisionB.ultsToUse],
      damageEvents,
      playerArmorStates: this.buildPlayerArmorStates(sm),
      teamAScore: currentScoreA + (teamAWins ? 1 : 0),
      teamBScore: currentScoreB + (teamAWins ? 0 : 1),
      timeline,
      buyPhase: buyResult,
    };

    return {
      roundInfo,
      teamAEconomy: updatedEconomyA,
      teamBEconomy: updatedEconomyB,
      teamAUlts: updatedUltsA,
      teamBUlts: updatedUltsB,
      playerPerformance,
      playerLoadouts: allLoadouts,
    };
  }

  // ============================================
  // PUBLIC METHODS (kept for MatchSimulator)
  // ============================================

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

      // Calculate total hits across all rounds for this player
      const totalHits = roundPerformances.reduce((sum, roundPerf) => {
        const playerPerf = roundPerf.get(player.id);
        return sum + (playerPerf?.totalHits || 0);
      }, 0);

      // Headshot percentage formula: (headshot kills/total kills) × 100
      const hsPercent = totalKills > 0 ? (headshotKills / totalKills) * 100 : 0;
      const kast = totalRounds > 0 ? (kastRounds / totalRounds) * 100 : 0;

      // Calculate ACS with proper Valorant formula
      const acs = Math.round(
        (totalDamage + totalKills * 90 + totalAssists * 25) /
          Math.max(1, totalRounds)
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
        headshotKills,
      };
    });
  }

  // ============================================
  // BUY PHASE BRIDGE FUNCTIONS
  // ============================================

  /**
   * Convert TeamRoundContext -> BuyPhaseTeamInput
   */
  private buildBuyPhaseInput(
    context: TeamRoundContext,
    roundNumber: number,
    buyType: BuyType
  ): BuyPhaseTeamInput {
    const players: BuyPhasePlayerInfo[] = context.players.map((player, i) => ({
      playerId: player.id,
      playerName: player.name,
      agentId: context.agents[i],
      teamSide: context.isAttacking ? 'attacker' as const : 'defender' as const,
      credits: context.economy.playerCredits[i],
      previousWeapon: null,
      survivedPreviousRound: false,
    }));

    return {
      players,
      roundNumber,
      isOvertime: roundNumber > 24,
      forceBuyType: buyType,
    };
  }

  /**
   * Convert BuyPhaseEntry[] + TeamRoundContext -> PlayerRoundState[]
   */
  private buildPlayerRoundStates(
    context: TeamRoundContext,
    buyEntries: BuyPhaseEntry[],
    side: TeamSide
  ): PlayerRoundState[] {
    return buyEntries.map((entry, i) => {
      const player = context.players[i];
      const agentId = context.agents[i];
      const agentData = AGENT_ABILITIES[agentId];
      const role = agentData?.role || 'Duelist';

      // Determine weapon: purchased or kept, fallback to classic
      const weaponId = entry.weaponPurchased || entry.weaponKept || 'classic';
      const sidearmId = entry.sidearmPurchased || 'classic';

      // Shield HP
      const shieldType = entry.shieldPurchased || 'none';
      const shieldHp = SHIELDS[shieldType].maxHp;
      const regenPool = shieldType === 'regen' ? (SHIELDS.regen as any).reservePool ?? 50 : 0;

      // Ability charges from buy entries
      const basic1Charges = entry.abilitiesPurchased
        .filter(a => a.slot === 'basic1')
        .reduce((sum, a) => sum + a.charges, 0);
      const basic2Charges = entry.abilitiesPurchased
        .filter(a => a.slot === 'basic2')
        .reduce((sum, a) => sum + a.charges, 0);

      return {
        playerId: player.id,
        playerName: player.name,
        teamSide: side,
        state: 'alive' as const,
        hp: 100,
        maxHp: 100,
        shieldHp,
        shieldType,
        regenPool,
        weapon: weaponId,
        sidearm: sidearmId,
        credits: entry.creditsAtStart,
        creditsSpent: entry.creditsSpent,
        agentId,
        agentRole: role,
        abilities: {
          basic1: basic1Charges,
          basic2: basic2Charges,
          signature: agentData?.abilities.E.maxCharges || 1,
          ultimatePoints: 0,
          ultimateRequired: agentData?.abilities.X.ultimateCost || 7,
        },
        killsThisRound: 0,
        damageDealtThisRound: 0,
        damageTakenThisRound: 0,
      };
    });
  }

  // ============================================
  // COMBAT SIMULATION
  // ============================================

  /**
   * Main combat simulation loop with discrete time steps
   */
  private simulateCombat(
    sm: RoundStateMachine,
    attackerCtx: TeamRoundContext,
    defenderCtx: TeamRoundContext,
    strengthRatio: number,
    _ultDecisionA: { ultsToUse: UltUsage[]; impactModifier: number },
    _ultDecisionB: { ultsToUse: UltUsage[]; impactModifier: number }
  ): void {
    let time = 0;
    let iteration = 0;

    while (!sm.isRoundEnded() && iteration < 100) {
      iteration++;

      // Advance time by 2-5 seconds
      const delta = 2000 + Math.random() * 3000;
      time += delta;

      // Determine combat phase based on time
      const phase = this.getCombatPhase(time, sm.isSpikePlanted());

      // Maybe use abilities
      this.maybeUseAbility(sm, time, attackerCtx, defenderCtx);

      // Maybe plant spike
      if (!sm.isRoundEnded() && !sm.isSpikePlanted()) {
        this.maybePlantSpike(sm, time, attackerCtx);
      }

      // Maybe defuse spike
      if (!sm.isRoundEnded() && sm.isSpikePlanted() && sm.getSpikeState().state === 'planted') {
        this.maybeDefuseSpike(sm, time, defenderCtx);
      }

      // Maybe encounter
      if (!sm.isRoundEnded() && Math.random() < PHASE_ENCOUNTER_PROBABILITY[phase]) {
        this.resolveEncounter(sm, attackerCtx, defenderCtx, strengthRatio, time);

        // Check for trade kill after encounter
        if (!sm.isRoundEnded()) {
          this.checkTradeKill(sm, time, 3000);
        }
      }

      // Advance state machine time for timer-based round end conditions
      if (!sm.isRoundEnded()) {
        sm.advanceTime(delta);
      }
    }
  }

  /**
   * Determine combat phase based on elapsed time
   */
  private getCombatPhase(time: number, spikePlanted: boolean): CombatPhase {
    if (spikePlanted) {
      // Post-plant phases are compressed
      if (time < 5000) return 'opening';
      if (time < 15000) return 'mid';
      return 'final';
    }
    if (time < 8000) return 'opening';
    if (time < 25000) return 'early';
    if (time < 55000) return 'mid';
    if (time < 80000) return 'late';
    return 'final';
  }

  /**
   * Resolve a single encounter (duel) between two players
   */
  private resolveEncounter(
    sm: RoundStateMachine,
    attackerCtx: TeamRoundContext,
    defenderCtx: TeamRoundContext,
    strengthRatio: number,
    timestamp: number
  ): void {
    const aliveAttackers = sm.getAliveAttackers();
    const aliveDefenders = sm.getAliveDefenders();

    if (aliveAttackers.length === 0 || aliveDefenders.length === 0) return;

    // Select participants weighted by stats
    const aggressorId = this.selectEncounterParticipant(attackerCtx, aliveAttackers, defenderCtx, aliveDefenders);

    // Determine aggressor's team side
    const aggressorIsAttacker = aliveAttackers.includes(aggressorId);
    const targetPool = aggressorIsAttacker ? aliveDefenders : aliveAttackers;
    const targetCtx = aggressorIsAttacker ? defenderCtx : attackerCtx;
    const targetId = this.selectEncounterTarget(targetCtx, targetPool);

    // Get weapon info
    const aggressorState = sm.getPlayerState(aggressorId);
    const targetState = sm.getPlayerState(targetId);
    if (!aggressorState || !targetState) return;

    const weaponId = aggressorState.weapon || aggressorState.sidearm || 'classic';
    const weaponProfile = weaponEngine.getWeaponProfileById(weaponId);
    const distance = weaponEngine.getRandomCombatDistance();

    // Get player stats for combat calculations
    const aggressorPlayer = this.findPlayer(aggressorId, attackerCtx, defenderCtx);
    const targetPlayer = this.findPlayer(targetId, attackerCtx, defenderCtx);

    // Combat rating determines shot count — better players fire more effectively
    const hsProb = this.calculateHeadshotProbability(aggressorPlayer, weaponId);

    // Determine shot count from weapon data
    const weaponData = WEAPONS[weaponId.toLowerCase()];
    const minShots = weaponData?.shotsPerRound.min || 2;
    const maxShots = weaponData?.shotsPerRound.max || 6;
    const baseShotCount = Math.floor(minShots + Math.random() * (maxShots - minShots));
    // In a single encounter, fire a fraction of round total
    const shotCount = Math.max(1, Math.floor(baseShotCount * (0.2 + Math.random() * 0.2)));

    // Aggressor fires
    this.fireShots(sm, aggressorId, targetId, distance, shotCount, hsProb, timestamp, weaponId, weaponProfile);

    // Target fires back if still alive
    if (sm.isPlayerAlive(targetId) && !sm.isRoundEnded()) {
      const targetWeaponId = targetState.weapon || targetState.sidearm || 'classic';
      const targetWeaponProfile = weaponEngine.getWeaponProfileById(targetWeaponId);
      const targetHsProb = this.calculateHeadshotProbability(targetPlayer, targetWeaponId);

      // Target gets slightly fewer shots (reacting)
      const targetShotCount = Math.max(1, shotCount - 1);

      // Strength ratio affects whether target wins — if target's team is stronger, they're more likely to return fire effectively
      const targetIsAttacker = aliveAttackers.includes(targetId);
      const targetFavored = targetIsAttacker ? strengthRatio > 0.5 : strengthRatio < 0.5;
      if (targetFavored || Math.random() < 0.5) {
        this.fireShots(sm, targetId, aggressorId, distance, targetShotCount, targetHsProb, timestamp + 100, targetWeaponId, targetWeaponProfile);
      }
    }
  }

  /**
   * Fire shots from attacker to defender, applying damage and potentially killing
   */
  private fireShots(
    sm: RoundStateMachine,
    attackerId: string,
    defenderId: string,
    distance: number,
    shotCount: number,
    hsProb: number,
    timestamp: number,
    weaponId: string,
    weaponProfile: { name: string; category: string; cost: number; damageRanges: any[] }
  ): void {
    if (!sm.isPlayerAlive(attackerId) || !sm.isPlayerAlive(defenderId) || sm.isRoundEnded()) return;

    const targetState = sm.getPlayerState(defenderId);
    if (!targetState) return;

    // Use calculateSimDamage for proper multi-shot damage
    const result = weaponEngine.calculateSimDamage({
      weapon: weaponProfile as any,
      distance,
      targetState,
      shotCount,
      headshotProbability: hsProb,
    });

    if (result.hits.length === 0) return;

    const totalDamage = result.hits.reduce((sum, h) => sum + h.shieldAbsorbed + h.hpDamage, 0);
    const isLethal = result.targetStateAfter.hp <= 0;
    const hasHeadshot = result.hits.some(h => h.location === 'head');

    // Record damage event
    const damageResult = sm.applyDamage({
      type: 'damage',
      timestamp,
      attackerId,
      defenderId,
      source: 'weapon',
      weapon: weaponId,
      distance,
      hits: result.hits,
      totalDamage,
      defenderHpAfter: result.targetStateAfter.hp,
      defenderShieldAfter: result.targetStateAfter.shieldHp,
      isLethal,
    });

    if (!damageResult.isValid) return;

    // If lethal, record kill
    if (isLethal && sm.isPlayerAlive(defenderId)) {
      const lastDamageEvent = sm.getTimeline()[sm.getTimeline().length - 1];
      const assisters = this.findAssisters(sm, defenderId, attackerId);

      sm.killPlayer(
        attackerId,
        defenderId,
        timestamp,
        weaponId,
        hasHeadshot,
        lastDamageEvent.id,
        assisters
      );
    }
  }

  // ============================================
  // SPIKE & ABILITY INTEGRATION
  // ============================================

  /**
   * Maybe plant the spike (probability increases over time)
   */
  private maybePlantSpike(
    sm: RoundStateMachine,
    time: number,
    attackerCtx: TeamRoundContext
  ): void {
    // Probability increases over time: 2% early -> 25% late
    const timeFactor = Math.min(1, time / 80000);
    let plantProb = 0.02 + timeFactor * 0.23;

    // Aggressive strategy increases plant chance
    if (attackerCtx.strategy.playstyle === 'aggressive') {
      plantProb *= 1.3;
    } else if (attackerCtx.strategy.playstyle === 'passive') {
      plantProb *= 0.7;
    }

    // Number advantage increases plant chance
    const attackerCount = sm.getAliveAttackerCount();
    const defenderCount = sm.getAliveDefenderCount();
    if (attackerCount > defenderCount) {
      plantProb *= 1.4;
    }

    if (Math.random() > plantProb) return;

    // Find spike carrier or alive attacker
    const aliveAttackers = sm.getAliveAttackers();
    if (aliveAttackers.length === 0) return;

    const spikeState = sm.getSpikeState();
    let planterId: string | null = null;

    if (spikeState.state === 'carried' && spikeState.carrierId &&
        sm.isPlayerAlive(spikeState.carrierId)) {
      planterId = spikeState.carrierId;
    } else if (spikeState.state === 'dropped') {
      // Pick up dropped spike first
      const pickerId = aliveAttackers[Math.floor(Math.random() * aliveAttackers.length)];
      const pickupResult = sm.pickupSpike(pickerId, time);
      if (pickupResult.isValid) {
        planterId = pickerId;
      }
    }

    if (!planterId || !sm.canPlant(planterId)) return;

    const site: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
    const startResult = sm.startPlant(planterId, time, site);
    if (!startResult.isValid) return;

    // Plant may be interrupted (20% chance)
    if (Math.random() < 0.2) {
      sm.interruptPlant(time + 2000, 'cancelled', Math.random() * 80);
      return;
    }

    // Complete plant
    sm.completePlant(time + 4000);
  }

  /**
   * Maybe defuse the spike (urgency increases over time)
   */
  private maybeDefuseSpike(
    sm: RoundStateMachine,
    time: number,
    defenderCtx: TeamRoundContext
  ): void {
    const aliveDefenders = sm.getAliveDefenders();
    if (aliveDefenders.length === 0) return;

    // Urgency increases with post-plant time
    const postPlantTime = sm.getPostPlantTimeRemaining();
    if (postPlantTime === null) return;

    const urgencyFactor = 1 - (postPlantTime / 45000);
    let defuseProb = 0.05 + urgencyFactor * 0.4;

    // More defenders alive = more likely to attempt defuse
    defuseProb *= 0.5 + aliveDefenders.length * 0.15;

    if (Math.random() > defuseProb) return;

    // Select defuser (mental + clutch weighted)
    const defuserId = this.selectDefuserFromAlive(defenderCtx, aliveDefenders);
    if (!sm.canDefuse(defuserId)) return;

    const startResult = sm.startDefuse(defuserId, time);
    if (!startResult.isValid) return;

    // Defuse may be interrupted (30% chance unless no attackers alive)
    const aliveAttackers = sm.getAliveAttackerCount();
    if (aliveAttackers > 0 && Math.random() < 0.3) {
      sm.interruptDefuse(time + 3000, 'cancelled', Math.random() * 60);
      return;
    }

    // Complete defuse
    sm.completeDefuse(time + 7000);
  }

  /**
   * Maybe use abilities (~12% chance per alive player per tick)
   */
  private maybeUseAbility(
    sm: RoundStateMachine,
    time: number,
    _attackerCtx: TeamRoundContext,
    _defenderCtx: TeamRoundContext
  ): void {
    if (sm.isRoundEnded()) return;

    const allAlive = [...sm.getAliveAttackers(), ...sm.getAliveDefenders()];

    for (const playerId of allAlive) {
      if (Math.random() > 0.12) continue;
      if (sm.isRoundEnded()) break;

      const playerState = sm.getPlayerState(playerId);
      if (!playerState) continue;

      const agentData = AGENT_ABILITIES[playerState.agentId];
      if (!agentData) continue;

      // Pick a random available ability
      const slots: Array<{ slot: 'basic1' | 'basic2' | 'signature'; key: 'C' | 'Q' | 'E' }> = [
        { slot: 'basic1', key: 'C' },
        { slot: 'basic2', key: 'Q' },
        { slot: 'signature', key: 'E' },
      ];

      const available = slots.filter(s => {
        const charges = playerState.abilities[s.slot];
        return charges > 0;
      });

      if (available.length === 0) continue;

      const chosen = available[Math.floor(Math.random() * available.length)];
      const ability = agentData.abilities[chosen.key];

      sm.recordAbilityUse(
        playerId,
        playerState.agentId,
        ability.id,
        ability.name,
        chosen.slot,
        time
      );

      // If it's a heal ability, apply healing to self or teammate
      if (ability.effectType === 'heal') {
        const teamAlive = sm.getAliveAttackers().includes(playerId)
          ? sm.getAliveAttackers()
          : sm.getAliveDefenders();

        // Find a damaged teammate (or self)
        const damagedAlly = teamAlive.find(id => {
          const s = sm.getPlayerState(id);
          return s && s.hp < s.maxHp;
        }) || playerId;

        sm.applyHeal(playerId, damagedAlly, time, ability.id, 40 + Math.floor(Math.random() * 20));
      }
    }
  }

  /**
   * Check for trade kills after a kill event
   */
  private checkTradeKill(sm: RoundStateMachine, time: number, tradeWindow: number): void {
    const timeline = sm.getTimeline();
    const recentKills = timeline.filter(
      e => e.type === 'kill' && time - e.timestamp < tradeWindow
    ) as SimKillEvent[];

    if (recentKills.length < 2) return;

    // Check if the most recent kill is a trade (killer of victim A was then killed by victim A's teammate)
    const lastKill = recentKills[recentKills.length - 1];
    const previousKills = recentKills.slice(0, -1);

    for (const prevKill of previousKills) {
      // If the person who was just killed had killed someone, this is a trade
      if (lastKill.victimId === prevKill.killerId && lastKill.timestamp - prevKill.timestamp <= tradeWindow) {
        // Trade detected — already recorded as a regular kill, just noting for KAST
        break;
      }
    }
  }

  // ============================================
  // ENCOUNTER HELPERS
  // ============================================

  /**
   * Select encounter participant weighted by entry + mechanics stats
   */
  private selectEncounterParticipant(
    attackerCtx: TeamRoundContext,
    aliveAttackers: string[],
    defenderCtx: TeamRoundContext,
    aliveDefenders: string[]
  ): string {
    // Combine all alive players, weight by entry + mechanics
    const candidates: Array<{ id: string; weight: number }> = [];

    for (const id of aliveAttackers) {
      const player = attackerCtx.players.find(p => p.id === id);
      if (player) {
        candidates.push({ id, weight: player.stats.entry * 0.6 + player.stats.mechanics * 0.4 + 0.1 });
      }
    }
    for (const id of aliveDefenders) {
      const player = defenderCtx.players.find(p => p.id === id);
      if (player) {
        candidates.push({ id, weight: player.stats.entry * 0.6 + player.stats.mechanics * 0.4 + 0.1 });
      }
    }

    return this.weightedIdSelect(candidates);
  }

  /**
   * Select target from the opposing team
   */
  private selectEncounterTarget(targetCtx: TeamRoundContext, aliveIds: string[]): string {
    const candidates: Array<{ id: string; weight: number }> = [];
    for (const id of aliveIds) {
      const player = targetCtx.players.find(p => p.id === id);
      if (player) {
        // Higher entry players get targeted more (they're in aggressive positions)
        candidates.push({ id, weight: player.stats.entry * 0.5 + 0.5 });
      }
    }
    if (candidates.length === 0) return aliveIds[0];
    return this.weightedIdSelect(candidates);
  }

  /**
   * Calculate headshot probability from weapon data and player mechanics
   */
  private calculateHeadshotProbability(player: Player | undefined, weaponId: string): number {
    const weaponData = WEAPONS[weaponId.toLowerCase()];
    const baseRate = weaponData?.baseHeadshotRate || 25;

    // Scale by player mechanics (0-1 range) around the base rate
    const mechanics = player?.stats.mechanics || 0.5;
    // At mechanics=1.0, use full base rate. At mechanics=0.0, use 30% of base rate
    const scaledRate = baseRate * (0.3 + mechanics * 0.7);

    return Math.min(0.5, Math.max(0.02, scaledRate / 100));
  }

  /**
   * Select defuser from alive defenders weighted by mental + clutch
   */
  private selectDefuserFromAlive(defenderCtx: TeamRoundContext, aliveIds: string[]): string {
    const candidates: Array<{ id: string; weight: number }> = [];
    for (const id of aliveIds) {
      const player = defenderCtx.players.find(p => p.id === id);
      if (player) {
        candidates.push({ id, weight: player.stats.mental * 0.5 + player.stats.clutch * 0.3 + 0.2 });
      }
    }
    if (candidates.length === 0) return aliveIds[0];
    return this.weightedIdSelect(candidates);
  }

  /**
   * Find assisters — players who dealt damage to victim within 5s / 25+ damage
   */
  private findAssisters(sm: RoundStateMachine, victimId: string, killerId: string): string[] {
    const timeline = sm.getTimeline();
    const currentTime = sm.getCurrentTimestamp();
    const assisters = new Set<string>();

    for (const event of timeline) {
      if (event.type !== 'damage') continue;
      if (event.defenderId !== victimId) continue;
      if (event.attackerId === killerId) continue;

      // Within 5 seconds and at least 25 damage
      if (currentTime - event.timestamp <= 5000 && event.totalDamage >= 25) {
        assisters.add(event.attackerId);
      }
    }

    return Array.from(assisters);
  }

  /**
   * Find a Player object by ID across both team contexts
   */
  private findPlayer(playerId: string, ctxA: TeamRoundContext, ctxB: TeamRoundContext): Player | undefined {
    return ctxA.players.find(p => p.id === playerId) ||
           ctxB.players.find(p => p.id === playerId);
  }

  // ============================================
  // PERFORMANCE DERIVATION
  // ============================================

  /**
   * Derive all performance data from the state machine timeline
   */
  private derivePerformance(
    sm: RoundStateMachine,
    allPlayers: Player[],
    allLoadouts: Map<string, PlayerLoadout>
  ): Map<string, RoundPlayerPerformance> {
    const timeline = sm.getTimeline();
    const perf = new Map<string, RoundPlayerPerformance>();

    // Initialize all players
    for (const player of allPlayers) {
      const loadout = allLoadouts.get(player.id);
      perf.set(player.id, {
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
        survivedRound: sm.isPlayerAlive(player.id),
        usedUlt: false,
        headshotKills: 0,
        shotsFired: 0,
        totalHits: 0,
        weaponUsed: loadout?.primary?.name || loadout?.secondary?.name || 'Classic',
      });
    }

    // Scan timeline
    let firstKillFound = false;

    for (const event of timeline) {
      switch (event.type) {
        case 'damage': {
          const attackerPerf = perf.get(event.attackerId);
          if (attackerPerf) {
            attackerPerf.damage += event.totalDamage;
            attackerPerf.shotsFired += event.hits.length;
            attackerPerf.totalHits += event.hits.filter(h => h.hpDamage > 0 || h.shieldAbsorbed > 0).length;
          }
          break;
        }

        case 'kill': {
          const killerPerf = perf.get(event.killerId);
          const victimPerf = perf.get(event.victimId);

          if (killerPerf) {
            killerPerf.kills++;
            if (event.isHeadshot) killerPerf.headshotKills++;
          }
          if (victimPerf) {
            victimPerf.deaths++;
            victimPerf.survivedRound = false;
          }

          // First blood
          if (!firstKillFound) {
            firstKillFound = true;
            if (killerPerf) killerPerf.gotFirstKill = true;
            if (victimPerf) victimPerf.gotFirstDeath = true;
          }

          // Assists
          for (const assisterId of event.assisters) {
            const assisterPerf = perf.get(assisterId);
            if (assisterPerf) {
              assisterPerf.assists++;
            }
          }
          break;
        }

        case 'plant_complete': {
          const planterPerf = perf.get(event.planterId);
          if (planterPerf) planterPerf.planted = true;
          break;
        }

        case 'defuse_complete': {
          const defuserPerf = perf.get(event.defuserId);
          if (defuserPerf) defuserPerf.defused = true;
          break;
        }

        case 'ability_use': {
          if (event.slot === 'ultimate') {
            const userPerf = perf.get(event.playerId);
            if (userPerf) userPerf.usedUlt = true;
          }
          break;
        }
      }
    }

    return perf;
  }

  /**
   * Extract first blood info from timeline
   */
  private extractFirstBlood(
    timeline: TimelineEvent[],
    teamAContext: TeamRoundContext,
    _teamBContext: TeamRoundContext
  ): FirstBlood | null {
    const firstKill = timeline.find(e => e.type === 'kill') as SimKillEvent | undefined;
    if (!firstKill) return null;

    const killerIsTeamA = teamAContext.players.some(p => p.id === firstKill.killerId);

    return {
      killerId: firstKill.killerId,
      victimId: firstKill.victimId,
      side: killerIsTeamA ? 'teamA' : 'teamB',
    };
  }

  /**
   * Derive clutch info from timeline kill sequence
   * Analyzes the actual kill timeline to detect 1vN situations
   * PRINCIPLE: This method only reads from the timeline, never generates data
   */
  private deriveClutchInfo(
    sm: RoundStateMachine,
    performance: Map<string, RoundPlayerPerformance>,
    timeline: TimelineEvent[],
    teamAContext: TeamRoundContext,
    teamBContext: TeamRoundContext
  ): ClutchAttempt | null {
    // Get all kill events
    const kills = timeline.filter(e => e.type === 'kill') as SimKillEvent[];
    if (kills.length < 2) return null;

    // Reconstruct alive count after each kill to find 1vN situations
    // Start with initial team sizes (5v5)
    const teamAIds = new Set(teamAContext.players.map(p => p.id));
    const teamBIds = new Set(teamBContext.players.map(p => p.id));

    let aliveA = new Set(teamAIds);
    let aliveB = new Set(teamBIds);

    // Track if we ever entered a 1vN situation
    let clutchPlayerId: string | null = null;
    let clutchSituation: '1v1' | '1v2' | '1v3' | '1v4' | '1v5' | null = null;

    // Scan through kills chronologically
    for (let i = 0; i < kills.length; i++) {
      const kill = kills[i];

      // Remove victim from alive set
      if (aliveA.has(kill.victimId)) {
        aliveA.delete(kill.victimId);
      } else if (aliveB.has(kill.victimId)) {
        aliveB.delete(kill.victimId);
      }

      // After this kill, check for 1vN situation
      const aCount = aliveA.size;
      const bCount = aliveB.size;

      // 1vN situation detected - only record the first clutch situation
      if (aCount === 1 && bCount >= 1 && bCount <= 5 && !clutchPlayerId) {
        // Team A player in 1vN
        const [playerId] = Array.from(aliveA);
        clutchPlayerId = playerId;
        clutchSituation = `1v${bCount}` as '1v1' | '1v2' | '1v3' | '1v4' | '1v5';
      } else if (bCount === 1 && aCount >= 1 && aCount <= 5 && !clutchPlayerId) {
        // Team B player in 1vN
        const [playerId] = Array.from(aliveB);
        clutchPlayerId = playerId;
        clutchSituation = `1v${aCount}` as '1v1' | '1v2' | '1v3' | '1v4' | '1v5';
      }
    }

    // No clutch situation found
    if (!clutchPlayerId || !clutchSituation) {
      return null;
    }

    // Determine if clutch was won (clutcher survived)
    const clutchWon = sm.isPlayerAlive(clutchPlayerId);

    // Update performance
    const perf = performance.get(clutchPlayerId);
    if (perf) {
      perf.attemptedClutch = true;
      perf.wonClutch = clutchWon;
    }

    return {
      playerId: clutchPlayerId,
      situation: clutchSituation,
      won: clutchWon,
    };
  }

  // ============================================
  // BACKWARD COMPATIBILITY LAYER
  // ============================================

  /**
   * Map SimWinCondition to legacy WinCondition
   */
  private mapWinCondition(simWC: SimWinCondition): WinCondition {
    switch (simWC) {
      case 'attackers_eliminated':
      case 'defenders_eliminated':
        return 'elimination';
      case 'spike_detonated':
        return 'spike_detonated';
      case 'spike_defused':
        return 'spike_defused';
      case 'time_expired':
        return 'time_expired';
    }
  }

  /**
   * Build legacy RoundDamageEvents from timeline
   */
  private buildLegacyDamageEvents(timeline: TimelineEvent[], allPlayers: Player[]): RoundDamageEvents {
    const events: DamageEvent[] = [];
    const totalDamageByPlayer: Record<string, number> = {};
    const totalDamageReceived: Record<string, number> = {};
    const damageContributions: Record<string, DamageEvent[]> = {};

    allPlayers.forEach(p => {
      totalDamageByPlayer[p.id] = 0;
      totalDamageReceived[p.id] = 0;
      damageContributions[p.id] = [];
    });

    for (const event of timeline) {
      if (event.type !== 'damage') continue;

      // Convert SimDamageEvent -> legacy DamageEvent
      const primaryHit = event.hits[0];
      const totalFinal = event.hits.reduce((sum, h) => sum + h.shieldAbsorbed + h.hpDamage, 0);
      const totalShieldDmg = event.hits.reduce((sum, h) => sum + h.shieldAbsorbed, 0);
      const totalHpDmg = event.hits.reduce((sum, h) => sum + h.hpDamage, 0);

      const legacyEvent: DamageEvent = {
        id: event.id,
        dealerId: event.attackerId,
        victimId: event.defenderId,
        baseDamage: event.hits.reduce((sum, h) => sum + h.baseDamage, 0),
        finalDamage: totalFinal,
        hitLocation: primaryHit?.location || 'body',
        source: event.source === 'weapon' ? 'weapon' : event.source as any,
        weapon: event.weapon,
        ability: event.ability,
        distance: event.distance,
        timestamp: event.timestamp,
        armorBreakdown: {
          shieldDamage: totalShieldDmg,
          hpDamage: totalHpDmg,
          remainingShield: event.defenderShieldAfter,
          remainingHp: event.defenderHpAfter,
        },
      };

      events.push(legacyEvent);
      totalDamageByPlayer[event.attackerId] = (totalDamageByPlayer[event.attackerId] || 0) + totalFinal;
      totalDamageReceived[event.defenderId] = (totalDamageReceived[event.defenderId] || 0) + totalFinal;
      if (damageContributions[event.defenderId]) {
        damageContributions[event.defenderId].push(legacyEvent);
      }
    }

    return { events, totalDamageByPlayer, totalDamageReceived, damageContributions };
  }

  /**
   * Build timeline events for display (returns all timeline events except round_end)
   */
  private buildLegacyRoundEvents(
    timeline: TimelineEvent[],
    _allPlayers: Player[],
    _allLoadouts: Map<string, PlayerLoadout>,
    _spikePlanted: boolean,
    _planterId: string | undefined,
    _defuserId: string | undefined,
    _winCondition: WinCondition
  ): TimelineEvent[] {
    // Return all timeline events except round_end, sorted by timestamp
    return timeline
      .filter(event => event.type !== 'round_end')
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Build player armor states from state machine
   */
  private buildPlayerArmorStates(sm: RoundStateMachine): Record<string, PlayerArmorState> {
    const states: Record<string, PlayerArmorState> = {};

    for (const playerState of sm.getAllPlayerStates()) {
      states[playerState.playerId] = {
        shieldType: playerState.shieldType,
        shieldHealth: playerState.shieldHp,
        regenPool: playerState.regenPool,
        health: playerState.hp,
        maxHealth: playerState.maxHp,
      };
    }

    return states;
  }

  // ============================================
  // ECONOMY & ULT UPDATES (unchanged delegates)
  // ============================================

  private updateEconomy(
    economy: TeamEconomyState,
    won: boolean,
    playerKills: number[],
    planted: boolean,
    defused: boolean,
    buyType: BuyType
  ): TeamEconomyState {
    const update = this.economyEngine.calculateRoundCredits(
      won, playerKills, planted, defused, economy
    );
    return this.economyEngine.updateEconomyState(economy, update, buyType, playerKills);
  }

  private updateUlts(
    ultState: TeamUltimateState,
    playerKills: number[],
    planted: boolean,
    defused: boolean,
    planterId: string | undefined,
    defuserId: string | undefined,
    usedUlts: UltUsage[]
  ): TeamUltimateState {
    const playerKillMap = new Map<string, number>();
    ultState.players.forEach((p, i) => {
      playerKillMap.set(p.playerId, playerKills[i] || 0);
    });

    let updated = this.ultimateEngine.awardUltPoints(
      ultState, playerKillMap, planted, defused, planterId, defuserId
    );

    if (usedUlts.length > 0) {
      updated = this.ultimateEngine.consumeUlts(updated, usedUlts);
    }

    return updated;
  }

  // ============================================
  // UTILITY METHODS (kept)
  // ============================================

  /**
   * Weighted selection by ID
   */
  private weightedIdSelect(candidates: Array<{ id: string; weight: number }>): string {
    const total = candidates.reduce((sum, c) => sum + c.weight, 0);
    let random = Math.random() * total;

    for (const c of candidates) {
      random -= c.weight;
      if (random <= 0) return c.id;
    }

    return candidates[candidates.length - 1].id;
  }

}

// Export singleton instance
export const roundSimulator = new RoundSimulator();
