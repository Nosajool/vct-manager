// RoundStateMachine - Manages all state during round simulation
// Provides validated state transitions for player states, spike state, and round timer
// All events are recorded to the timeline for later summary derivation

import type {
  PlayerRoundState,
  SpikeRoundState,
  TimelineEvent,
  SimDamageEvent,
  SimKillEvent,
  PlantStartEvent,
  PlantInterruptEvent,
  PlantCompleteEvent,
  DefuseStartEvent,
  DefuseInterruptEvent,
  DefuseCompleteEvent,
  SpikeDropEvent,
  SpikePickupEvent,
  SpikeDetonationEvent,
  AbilityUseEvent,
  RoundEndEvent,
  HealEvent,
  ValidationResult,
  ValidationError,
  RoundSimulationConfig,
  TeamSide,
  SimWinCondition,
  Position,
} from '../../types/round-simulation';

import { DEFAULT_ROUND_CONFIG } from '../../types/round-simulation';
import { timelineValidator } from './TimelineValidator';

// ============================================
// STATE MACHINE INITIALIZATION
// ============================================

export interface RoundStateMachineConfig {
  /** All player states at round start */
  players: PlayerRoundState[];
  /** Initial spike carrier ID (an attacker) */
  spikeCarrierId: string;
  /** Attacker team ID */
  attackerTeamId: string;
  /** Defender team ID */
  defenderTeamId: string;
  /** Round number */
  roundNumber: number;
  /** Half number (1, 2, or 3 for overtime) */
  halfNumber: 1 | 2 | 3;
  /** Simulation config (timing, etc.) */
  config?: Partial<RoundSimulationConfig>;
}

// ============================================
// ROUND STATE MACHINE CLASS
// ============================================

export class RoundStateMachine {
  // Player states
  private playerStates: Map<string, PlayerRoundState>;
  private attackerIds: Set<string>;
  private defenderIds: Set<string>;

  // Spike state
  private spikeState: SpikeRoundState;

  // Timer state
  private roundTimeRemaining: number; // ms
  private postPlantTimeRemaining: number | null = null; // ms, only set after plant
  private currentTimestamp: number = 0; // ms from round start

  // Timeline
  private timeline: TimelineEvent[] = [];

  // Config
  private config: RoundSimulationConfig;
  private roundNumber: number;
  private halfNumber: 1 | 2 | 3;
  private attackerTeamId: string;
  private defenderTeamId: string;

  // Round end state
  private roundEnded: boolean = false;
  private winner: TeamSide | null = null;
  private winCondition: SimWinCondition | null = null;

  constructor(initConfig: RoundStateMachineConfig) {
    // Initialize config
    this.config = { ...DEFAULT_ROUND_CONFIG, ...initConfig.config };
    this.roundNumber = initConfig.roundNumber;
    this.halfNumber = initConfig.halfNumber;
    this.attackerTeamId = initConfig.attackerTeamId;
    this.defenderTeamId = initConfig.defenderTeamId;

    // Initialize player states
    this.playerStates = new Map();
    this.attackerIds = new Set();
    this.defenderIds = new Set();

    for (const player of initConfig.players) {
      this.playerStates.set(player.playerId, { ...player });
      if (player.teamSide === 'attacker') {
        this.attackerIds.add(player.playerId);
      } else {
        this.defenderIds.add(player.playerId);
      }
    }

    // Initialize spike state
    this.spikeState = {
      state: 'carried',
      carrierId: initConfig.spikeCarrierId,
    };

    // Mark spike carrier
    const carrier = this.playerStates.get(initConfig.spikeCarrierId);
    if (carrier) {
      carrier.hasSpike = true;
    }

    // Initialize timer
    this.roundTimeRemaining = this.config.roundTime;
  }

  // ============================================
  // STATE QUERIES
  // ============================================

  /** Check if a player is alive */
  isPlayerAlive(playerId: string): boolean {
    const player = this.playerStates.get(playerId);
    return player?.state === 'alive';
  }

  /** Get all alive attacker player IDs */
  getAliveAttackers(): string[] {
    return Array.from(this.attackerIds).filter(id => this.isPlayerAlive(id));
  }

  /** Get all alive defender player IDs */
  getAliveDefenders(): string[] {
    return Array.from(this.defenderIds).filter(id => this.isPlayerAlive(id));
  }

  /** Get count of alive attackers */
  getAliveAttackerCount(): number {
    return this.getAliveAttackers().length;
  }

  /** Get count of alive defenders */
  getAliveDefenderCount(): number {
    return this.getAliveDefenders().length;
  }

  /** Check if a player can plant the spike */
  canPlant(playerId: string): boolean {
    // Must be alive attacker with spike, spike must be carried or dropped
    const player = this.playerStates.get(playerId);
    if (!player || player.state !== 'alive' || player.teamSide !== 'attacker') {
      return false;
    }

    // Spike must be carried by this player
    if (this.spikeState.state !== 'carried' || this.spikeState.carrierId !== playerId) {
      return false;
    }

    // Round must not have ended
    if (this.roundEnded) {
      return false;
    }

    return true;
  }

  /** Check if a player can defuse the spike */
  canDefuse(playerId: string): boolean {
    // Must be alive defender, spike must be planted
    const player = this.playerStates.get(playerId);
    if (!player || player.state !== 'alive' || player.teamSide !== 'defender') {
      return false;
    }

    // Spike must be planted
    if (this.spikeState.state !== 'planted') {
      return false;
    }

    // Round must not have ended
    if (this.roundEnded) {
      return false;
    }

    return true;
  }

  /** Check if spike is planted */
  isSpikePlanted(): boolean {
    return this.spikeState.state === 'planted' ||
           this.spikeState.state === 'defusing' ||
           this.spikeState.state === 'defused' ||
           this.spikeState.state === 'detonated';
  }

  /** Get current spike state */
  getSpikeState(): SpikeRoundState {
    return { ...this.spikeState };
  }

  /** Get player state */
  getPlayerState(playerId: string): PlayerRoundState | undefined {
    const state = this.playerStates.get(playerId);
    return state ? { ...state } : undefined;
  }

  /** Get all player states */
  getAllPlayerStates(): PlayerRoundState[] {
    return Array.from(this.playerStates.values()).map(p => ({ ...p }));
  }

  /** Get timeline */
  getTimeline(): TimelineEvent[] {
    return [...this.timeline];
  }

  /** Get current timestamp */
  getCurrentTimestamp(): number {
    return this.currentTimestamp;
  }

  /** Get remaining round time */
  getRoundTimeRemaining(): number {
    return this.roundTimeRemaining;
  }

  /** Get remaining post-plant time (null if not planted) */
  getPostPlantTimeRemaining(): number | null {
    return this.postPlantTimeRemaining;
  }

  /** Check if round has ended */
  isRoundEnded(): boolean {
    return this.roundEnded;
  }

  /** Get winner (null if round not ended) */
  getWinner(): TeamSide | null {
    return this.winner;
  }

  /** Get win condition (null if round not ended) */
  getWinCondition(): SimWinCondition | null {
    return this.winCondition;
  }

  // ============================================
  // STATE MUTATIONS - DAMAGE & KILLS
  // ============================================

  /** Apply damage to a player */
  applyDamage(event: Omit<SimDamageEvent, 'id'>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate attacker is alive
    if (!this.isPlayerAlive(event.attackerId)) {
      errors.push({
        eventId: '',
        eventType: 'damage',
        timestamp: event.timestamp,
        rule: 'attacker_alive',
        message: `Attacker ${event.attackerId} is not alive`,
        severity: 'error',
      });
    }

    // Validate defender is alive
    if (!this.isPlayerAlive(event.defenderId)) {
      errors.push({
        eventId: '',
        eventType: 'damage',
        timestamp: event.timestamp,
        rule: 'defender_alive',
        message: `Defender ${event.defenderId} is not alive`,
        severity: 'error',
      });
    }

    // Validate timestamp is chronological
    if (event.timestamp < this.currentTimestamp) {
      errors.push({
        eventId: '',
        eventType: 'damage',
        timestamp: event.timestamp,
        rule: 'chronological',
        message: `Timestamp ${event.timestamp} is before current time ${this.currentTimestamp}`,
        severity: 'error',
      });
    }

    // Validate round not ended
    if (this.roundEnded) {
      errors.push({
        eventId: '',
        eventType: 'damage',
        timestamp: event.timestamp,
        rule: 'round_active',
        message: 'Cannot apply damage after round has ended',
        severity: 'error',
      });
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // Apply the damage
    const defender = this.playerStates.get(event.defenderId)!;
    defender.damageTakenThisRound += event.totalDamage;

    const attacker = this.playerStates.get(event.attackerId)!;
    attacker.damageDealtThisRound += event.totalDamage;

    // Update timestamp
    this.currentTimestamp = event.timestamp;

    // Create and record event
    const damageEvent: SimDamageEvent = {
      ...event,
      id: this.generateEventId('damage'),
    };
    this.timeline.push(damageEvent);

    return { isValid: true, errors: [], warnings };
  }

  /** Kill a player */
  killPlayer(
    killerId: string,
    victimId: string,
    timestamp: number,
    weapon: string,
    isHeadshot: boolean,
    damageEventId: string,
    assisters: string[] = []
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate killer is alive
    if (!this.isPlayerAlive(killerId)) {
      errors.push({
        eventId: '',
        eventType: 'kill',
        timestamp,
        rule: 'killer_alive',
        message: `Killer ${killerId} is not alive`,
        severity: 'error',
      });
    }

    // Validate victim is alive
    if (!this.isPlayerAlive(victimId)) {
      errors.push({
        eventId: '',
        eventType: 'kill',
        timestamp,
        rule: 'victim_alive',
        message: `Victim ${victimId} is not alive`,
        severity: 'error',
      });
    }

    // Validate timestamp
    if (timestamp < this.currentTimestamp) {
      errors.push({
        eventId: '',
        eventType: 'kill',
        timestamp,
        rule: 'chronological',
        message: `Timestamp ${timestamp} is before current time ${this.currentTimestamp}`,
        severity: 'error',
      });
    }

    // Validate round not ended
    if (this.roundEnded) {
      errors.push({
        eventId: '',
        eventType: 'kill',
        timestamp,
        rule: 'round_active',
        message: 'Cannot kill player after round has ended',
        severity: 'error',
      });
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // Apply the kill
    const victim = this.playerStates.get(victimId)!;
    victim.state = 'dead';
    victim.hp = 0;
    victim.shieldHp = 0;

    const killer = this.playerStates.get(killerId)!;
    killer.killsThisRound++;

    // Update timestamp
    this.currentTimestamp = timestamp;

    // If victim was carrying spike, drop it
    if (victim.hasSpike && this.spikeState.state === 'carried') {
      victim.hasSpike = false;
      this.spikeState = {
        state: 'dropped',
        dropLocation: victim.position || { x: 0, y: 0 },
        dropTime: timestamp,
      };

      // Record spike drop event
      const dropEvent: SpikeDropEvent = {
        id: this.generateEventId('spike_drop'),
        type: 'spike_drop',
        timestamp,
        dropperId: victimId,
        location: this.spikeState.dropLocation!,
      };
      this.timeline.push(dropEvent);
    }

    // If victim was planting, interrupt
    if (this.spikeState.state === 'planting' && this.spikeState.carrierId === victimId) {
      this.interruptPlant(timestamp, 'killed');
    }

    // If victim was defusing, interrupt
    if (this.spikeState.state === 'defusing' && this.spikeState.defuserId === victimId) {
      this.interruptDefuse(timestamp, 'killed');
    }

    // Record kill event
    const killEvent: SimKillEvent = {
      id: this.generateEventId('kill'),
      type: 'kill',
      timestamp,
      killerId,
      victimId,
      weapon,
      isHeadshot,
      damageEventId,
      assisters,
    };
    this.timeline.push(killEvent);

    // Check for round end conditions
    this.checkRoundEndConditions(timestamp);

    return { isValid: true, errors: [], warnings };
  }

  // ============================================
  // STATE MUTATIONS - SPIKE PLANT
  // ============================================

  /** Start planting the spike */
  startPlant(playerId: string, timestamp: number, site: 'A' | 'B'): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!this.canPlant(playerId)) {
      errors.push({
        eventId: '',
        eventType: 'plant_start',
        timestamp,
        rule: 'can_plant',
        message: `Player ${playerId} cannot plant`,
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    // Validate timestamp
    if (timestamp < this.currentTimestamp) {
      errors.push({
        eventId: '',
        eventType: 'plant_start',
        timestamp,
        rule: 'chronological',
        message: `Timestamp ${timestamp} is before current time ${this.currentTimestamp}`,
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    // Update spike state
    this.spikeState = {
      state: 'planting',
      carrierId: playerId,
      site,
    };

    // Update timestamp
    this.currentTimestamp = timestamp;

    // Record event
    const event: PlantStartEvent = {
      id: this.generateEventId('plant_start'),
      type: 'plant_start',
      timestamp,
      planterId: playerId,
      site,
    };
    this.timeline.push(event);

    return { isValid: true, errors: [], warnings };
  }

  /** Interrupt plant (player killed, moved, or cancelled) */
  interruptPlant(
    timestamp: number,
    reason: 'killed' | 'cancelled' | 'moved',
    progress: number = 0
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (this.spikeState.state !== 'planting') {
      errors.push({
        eventId: '',
        eventType: 'plant_interrupt',
        timestamp,
        rule: 'is_planting',
        message: 'Cannot interrupt plant when not planting',
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    const planterId = this.spikeState.carrierId!;
    const site = this.spikeState.site!;

    // Update spike state back to carried (if not killed)
    if (reason !== 'killed') {
      this.spikeState = {
        state: 'carried',
        carrierId: planterId,
      };
    }
    // If killed, the spike drop is handled in killPlayer

    // Update timestamp
    this.currentTimestamp = timestamp;

    // Record event
    const event: PlantInterruptEvent = {
      id: this.generateEventId('plant_interrupt'),
      type: 'plant_interrupt',
      timestamp,
      planterId,
      site,
      reason,
      progress,
    };
    this.timeline.push(event);

    return { isValid: true, errors: [], warnings };
  }

  /** Complete spike plant */
  completePlant(timestamp: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (this.spikeState.state !== 'planting') {
      errors.push({
        eventId: '',
        eventType: 'plant_complete',
        timestamp,
        rule: 'is_planting',
        message: 'Cannot complete plant when not planting',
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    const planterId = this.spikeState.carrierId!;
    const site = this.spikeState.site!;

    // Update spike state
    this.spikeState = {
      state: 'planted',
      planterId,
      site,
      plantTime: timestamp,
    };

    // Remove spike from carrier
    const carrier = this.playerStates.get(planterId);
    if (carrier) {
      carrier.hasSpike = false;
    }

    // Start post-plant timer
    this.postPlantTimeRemaining = this.config.postPlantTime;

    // Update timestamp
    this.currentTimestamp = timestamp;

    // Record event
    const event: PlantCompleteEvent = {
      id: this.generateEventId('plant_complete'),
      type: 'plant_complete',
      timestamp,
      planterId,
      site,
    };
    this.timeline.push(event);

    return { isValid: true, errors: [], warnings };
  }

  // ============================================
  // STATE MUTATIONS - SPIKE DEFUSE
  // ============================================

  /** Start defusing the spike */
  startDefuse(playerId: string, timestamp: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!this.canDefuse(playerId)) {
      errors.push({
        eventId: '',
        eventType: 'defuse_start',
        timestamp,
        rule: 'can_defuse',
        message: `Player ${playerId} cannot defuse`,
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    // Validate timestamp
    if (timestamp < this.currentTimestamp) {
      errors.push({
        eventId: '',
        eventType: 'defuse_start',
        timestamp,
        rule: 'chronological',
        message: `Timestamp ${timestamp} is before current time ${this.currentTimestamp}`,
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    // Update spike state
    this.spikeState = {
      ...this.spikeState,
      state: 'defusing',
      defuserId: playerId,
      defuseStartTime: timestamp,
    };

    // Update timestamp
    this.currentTimestamp = timestamp;

    // Record event
    const event: DefuseStartEvent = {
      id: this.generateEventId('defuse_start'),
      type: 'defuse_start',
      timestamp,
      defuserId: playerId,
    };
    this.timeline.push(event);

    return { isValid: true, errors: [], warnings };
  }

  /** Interrupt defuse (player killed, moved, or cancelled) */
  interruptDefuse(
    timestamp: number,
    reason: 'killed' | 'cancelled' | 'moved',
    progress: number = 0
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (this.spikeState.state !== 'defusing') {
      errors.push({
        eventId: '',
        eventType: 'defuse_interrupt',
        timestamp,
        rule: 'is_defusing',
        message: 'Cannot interrupt defuse when not defusing',
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    const defuserId = this.spikeState.defuserId!;

    // Update spike state back to planted
    this.spikeState = {
      state: 'planted',
      planterId: this.spikeState.planterId,
      site: this.spikeState.site,
      plantTime: this.spikeState.plantTime,
    };

    // Update timestamp
    this.currentTimestamp = timestamp;

    // Record event
    const event: DefuseInterruptEvent = {
      id: this.generateEventId('defuse_interrupt'),
      type: 'defuse_interrupt',
      timestamp,
      defuserId,
      reason,
      progress,
    };
    this.timeline.push(event);

    return { isValid: true, errors: [], warnings };
  }

  /** Complete spike defuse */
  completeDefuse(timestamp: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (this.spikeState.state !== 'defusing') {
      errors.push({
        eventId: '',
        eventType: 'defuse_complete',
        timestamp,
        rule: 'is_defusing',
        message: 'Cannot complete defuse when not defusing',
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    const defuserId = this.spikeState.defuserId!;

    // Update spike state
    this.spikeState = {
      ...this.spikeState,
      state: 'defused',
    };

    // Update timestamp
    this.currentTimestamp = timestamp;

    // Record event
    const event: DefuseCompleteEvent = {
      id: this.generateEventId('defuse_complete'),
      type: 'defuse_complete',
      timestamp,
      defuserId,
    };
    this.timeline.push(event);

    // End round - defenders win
    this.endRound(timestamp, 'defender', 'spike_defused');

    return { isValid: true, errors: [], warnings };
  }

  // ============================================
  // STATE MUTATIONS - SPIKE PICKUP/DROP
  // ============================================

  /** Pick up a dropped spike */
  pickupSpike(playerId: string, timestamp: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate spike is dropped
    if (this.spikeState.state !== 'dropped') {
      errors.push({
        eventId: '',
        eventType: 'spike_pickup',
        timestamp,
        rule: 'spike_dropped',
        message: 'Cannot pickup spike when not dropped',
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    // Validate player is alive attacker
    const player = this.playerStates.get(playerId);
    if (!player || player.state !== 'alive' || player.teamSide !== 'attacker') {
      errors.push({
        eventId: '',
        eventType: 'spike_pickup',
        timestamp,
        rule: 'valid_picker',
        message: `Player ${playerId} cannot pick up spike`,
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    const location = this.spikeState.dropLocation!;

    // Update spike state
    this.spikeState = {
      state: 'carried',
      carrierId: playerId,
    };

    // Mark player as spike carrier
    player.hasSpike = true;

    // Update timestamp
    this.currentTimestamp = timestamp;

    // Record event
    const event: SpikePickupEvent = {
      id: this.generateEventId('spike_pickup'),
      type: 'spike_pickup',
      timestamp,
      pickerId: playerId,
      location,
    };
    this.timeline.push(event);

    return { isValid: true, errors: [], warnings };
  }

  /** Manually drop the spike (not from death) */
  dropSpike(playerId: string, timestamp: number, location: Position): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate player is carrying spike
    const player = this.playerStates.get(playerId);
    if (!player || !player.hasSpike || this.spikeState.carrierId !== playerId) {
      errors.push({
        eventId: '',
        eventType: 'spike_drop',
        timestamp,
        rule: 'has_spike',
        message: `Player ${playerId} is not carrying the spike`,
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    // Update player state
    player.hasSpike = false;

    // Update spike state
    this.spikeState = {
      state: 'dropped',
      dropLocation: location,
      dropTime: timestamp,
    };

    // Update timestamp
    this.currentTimestamp = timestamp;

    // Record event
    const event: SpikeDropEvent = {
      id: this.generateEventId('spike_drop'),
      type: 'spike_drop',
      timestamp,
      dropperId: playerId,
      location,
    };
    this.timeline.push(event);

    return { isValid: true, errors: [], warnings };
  }

  // ============================================
  // STATE MUTATIONS - HEALING
  // ============================================

  /** Apply healing to a player */
  applyHeal(
    healerId: string,
    targetId: string,
    timestamp: number,
    ability: string,
    amount: number
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate target is alive
    const target = this.playerStates.get(targetId);
    if (!target || target.state !== 'alive') {
      errors.push({
        eventId: '',
        eventType: 'heal',
        timestamp,
        rule: 'target_alive',
        message: `Target ${targetId} is not alive`,
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    // Apply healing (capped at max HP)
    const actualHeal = Math.min(amount, target.maxHp - target.hp);
    target.hp += actualHeal;

    // Update timestamp
    this.currentTimestamp = timestamp;

    // Record event
    const event: HealEvent = {
      id: this.generateEventId('heal'),
      type: 'heal',
      timestamp,
      healerId,
      targetId,
      ability,
      amount: actualHeal,
      targetHpAfter: target.hp,
    };
    this.timeline.push(event);

    return { isValid: true, errors: [], warnings };
  }

  // ============================================
  // STATE MUTATIONS - ABILITY USE
  // ============================================

  /** Record an ability use on the timeline */
  recordAbilityUse(
    playerId: string,
    agentId: string,
    abilityId: string,
    abilityName: string,
    slot: 'basic1' | 'basic2' | 'signature' | 'ultimate',
    timestamp: number,
    targets?: string[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!this.isPlayerAlive(playerId)) {
      errors.push({
        eventId: '',
        eventType: 'ability_use',
        timestamp,
        rule: 'player_alive',
        message: `Player ${playerId} is not alive`,
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    if (this.roundEnded) {
      errors.push({
        eventId: '',
        eventType: 'ability_use',
        timestamp,
        rule: 'round_active',
        message: 'Cannot use ability after round has ended',
        severity: 'error',
      });
      return { isValid: false, errors, warnings };
    }

    this.currentTimestamp = timestamp;

    const event: AbilityUseEvent = {
      id: this.generateEventId('ability_use'),
      type: 'ability_use',
      timestamp,
      playerId,
      agentId,
      abilityId,
      abilityName,
      slot,
      targets,
    };
    this.timeline.push(event);

    return { isValid: true, errors: [], warnings };
  }

  // ============================================
  // TIMER MANAGEMENT
  // ============================================

  /** Advance the round timer */
  advanceTime(deltaMs: number): void {
    if (this.roundEnded) return;

    this.currentTimestamp += deltaMs;

    if (this.postPlantTimeRemaining !== null) {
      // Post-plant timer
      this.postPlantTimeRemaining -= deltaMs;
      if (this.postPlantTimeRemaining <= 0) {
        this.detonateSpike();
      }
    } else {
      // Normal round timer
      this.roundTimeRemaining -= deltaMs;
      if (this.roundTimeRemaining <= 0) {
        this.timeExpired();
      }
    }
  }

  /** Set timestamp directly (for event-based simulation) */
  setTimestamp(timestamp: number): void {
    this.currentTimestamp = timestamp;
  }

  // ============================================
  // ROUND END CONDITIONS
  // ============================================

  /** Check and handle round end conditions */
  private checkRoundEndConditions(timestamp: number): void {
    if (this.roundEnded) return;

    const aliveAttackers = this.getAliveAttackerCount();
    const aliveDefenders = this.getAliveDefenderCount();

    // All attackers eliminated
    if (aliveAttackers === 0) {
      // If spike is planted, round continues until defuse or detonation
      if (!this.isSpikePlanted()) {
        this.endRound(timestamp, 'defender', 'attackers_eliminated');
      }
    }

    // All defenders eliminated
    if (aliveDefenders === 0) {
      this.endRound(timestamp, 'attacker', 'defenders_eliminated');
    }
  }

  /** Handle spike detonation */
  private detonateSpike(): void {
    if (this.roundEnded) return;

    const timestamp = this.currentTimestamp;

    // Find defenders caught in blast (any alive defenders)
    const casualties = this.getAliveDefenders();

    // Kill all defenders in blast
    for (const defenderId of casualties) {
      const defender = this.playerStates.get(defenderId);
      if (defender) {
        defender.state = 'dead';
        defender.hp = 0;
      }
    }

    // Update spike state
    this.spikeState = {
      ...this.spikeState,
      state: 'detonated',
    };

    // Record detonation event
    const event: SpikeDetonationEvent = {
      id: this.generateEventId('spike_detonation'),
      type: 'spike_detonation',
      timestamp,
      site: this.spikeState.site!,
      casualties,
    };
    this.timeline.push(event);

    // End round - attackers win
    this.endRound(timestamp, 'attacker', 'spike_detonated');
  }

  /** Handle time expiration */
  private timeExpired(): void {
    if (this.roundEnded) return;

    // If spike not planted, defenders win
    if (!this.isSpikePlanted()) {
      this.endRound(this.currentTimestamp, 'defender', 'time_expired');
    }
    // If spike planted, post-plant timer handles it
  }

  /** End the round */
  private endRound(timestamp: number, winner: TeamSide, winCondition: SimWinCondition): void {
    if (this.roundEnded) return;

    this.roundEnded = true;
    this.winner = winner;
    this.winCondition = winCondition;

    // Get survivors
    const survivors = winner === 'attacker'
      ? this.getAliveAttackers()
      : this.getAliveDefenders();

    // Also include surviving losers (rare but possible)
    const losingSide = winner === 'attacker' ? this.getAliveDefenders() : this.getAliveAttackers();
    survivors.push(...losingSide);

    // Record round end event
    const event: RoundEndEvent = {
      id: this.generateEventId('round_end'),
      type: 'round_end',
      timestamp,
      winner,
      winCondition,
      survivors,
    };
    this.timeline.push(event);
  }

  /** Force end the round (for external control) */
  forceEndRound(timestamp: number, winner: TeamSide, winCondition: SimWinCondition): void {
    this.endRound(timestamp, winner, winCondition);
  }

  // ============================================
  // VALIDATION
  // ============================================

  /** Validate an event before applying it */
  validateEvent(event: TimelineEvent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check chronological order
    if (event.timestamp < this.currentTimestamp) {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'chronological',
        message: `Event timestamp ${event.timestamp} is before current time ${this.currentTimestamp}`,
        severity: 'error',
      });
    }

    // Check round not ended (except for round_end events)
    if (this.roundEnded && event.type !== 'round_end') {
      errors.push({
        eventId: event.id,
        eventType: event.type,
        timestamp: event.timestamp,
        rule: 'round_active',
        message: 'Cannot process events after round has ended',
        severity: 'error',
      });
    }

    // Event-specific validation
    switch (event.type) {
      case 'damage':
        if (!this.isPlayerAlive(event.attackerId)) {
          errors.push({
            eventId: event.id,
            eventType: event.type,
            timestamp: event.timestamp,
            rule: 'attacker_alive',
            message: `Attacker ${event.attackerId} is not alive`,
            severity: 'error',
          });
        }
        if (!this.isPlayerAlive(event.defenderId)) {
          errors.push({
            eventId: event.id,
            eventType: event.type,
            timestamp: event.timestamp,
            rule: 'defender_alive',
            message: `Defender ${event.defenderId} is not alive`,
            severity: 'error',
          });
        }
        break;

      case 'kill':
        if (!this.isPlayerAlive(event.killerId)) {
          errors.push({
            eventId: event.id,
            eventType: event.type,
            timestamp: event.timestamp,
            rule: 'killer_alive',
            message: `Killer ${event.killerId} is not alive`,
            severity: 'error',
          });
        }
        if (!this.isPlayerAlive(event.victimId)) {
          errors.push({
            eventId: event.id,
            eventType: event.type,
            timestamp: event.timestamp,
            rule: 'victim_alive',
            message: `Victim ${event.victimId} is not alive`,
            severity: 'error',
          });
        }
        break;

      case 'plant_start':
        if (!this.canPlant(event.planterId)) {
          errors.push({
            eventId: event.id,
            eventType: event.type,
            timestamp: event.timestamp,
            rule: 'can_plant',
            message: `Player ${event.planterId} cannot plant`,
            severity: 'error',
          });
        }
        break;

      case 'defuse_start':
        if (!this.canDefuse(event.defuserId)) {
          errors.push({
            eventId: event.id,
            eventType: event.type,
            timestamp: event.timestamp,
            rule: 'can_defuse',
            message: `Player ${event.defuserId} cannot defuse`,
            severity: 'error',
          });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /** Validate the entire timeline using comprehensive TimelineValidator */
  validateTimeline(): ValidationResult {
    // Get initial player states snapshot (reconstruct from current states)
    const initialStates = Array.from(this.playerStates.values()).map(state => ({
      ...state,
      // Reset to initial values for validation
      state: 'alive' as const,
      hp: 100,
      shieldHp: state.shieldType === 'none' ? 0 : state.shieldType === 'light' ? 25 : 50,
      killsThisRound: 0,
      damageDealtThisRound: 0,
      damageTakenThisRound: 0,
    }));

    // Use comprehensive TimelineValidator
    return timelineValidator.validate(
      this.timeline,
      initialStates,
      { postPlantTime: this.config.postPlantTime }
    );
  }

  // ============================================
  // UTILITIES
  // ============================================

  /** Generate a unique event ID */
  private generateEventId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /** Get config */
  getConfig(): RoundSimulationConfig {
    return { ...this.config };
  }

  /** Get round info */
  getRoundInfo(): { roundNumber: number; halfNumber: 1 | 2 | 3 } {
    return {
      roundNumber: this.roundNumber,
      halfNumber: this.halfNumber,
    };
  }

  /** Get team IDs */
  getTeamIds(): { attackerTeamId: string; defenderTeamId: string } {
    return {
      attackerTeamId: this.attackerTeamId,
      defenderTeamId: this.defenderTeamId,
    };
  }
}
