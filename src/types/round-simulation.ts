// Round Simulation Types
// New type definitions for the revamped simulation system
// All summary elements are derived from the timeline - never generated independently

import type { BuyType, AgentRole } from './strategy';

// ============================================
// BASIC TYPES & IDENTIFIERS
// ============================================

/** Weapon identifier - matches keys in weapon data */
export type WeaponId = string;

/** Agent identifier - Valorant agent name */
export type AgentId = string;

/** Ability identifier - format: "agentName_abilitySlot" (e.g., "Jett_E") */
export type AbilityId = string;

/** Shield types available in Valorant */
export type ShieldType = 'none' | 'light' | 'heavy' | 'regen';

/** Position on map (for spike tracking) */
export interface Position {
  x: number;
  y: number;
  area?: string; // Named area like "A Site", "B Main", etc.
}

// ============================================
// PLAYER STATE
// ============================================

/** Player alive/dead state */
export type PlayerState = 'alive' | 'dead';

/** Player's team side for the current half */
export type TeamSide = 'attacker' | 'defender';

/** Ability charges for a player */
export interface AbilityCharges {
  /** Basic ability 1 (C key) - purchasable */
  basic1: number;
  /** Basic ability 2 (Q key) - purchasable */
  basic2: number;
  /** Signature ability (E key) - free each round, may have charges */
  signature: number;
  /** Ultimate points accumulated */
  ultimatePoints: number;
  /** Points needed for ultimate */
  ultimateRequired: number;
}

/** Complete player state during a round */
export interface PlayerRoundState {
  playerId: string;
  playerName: string;
  teamSide: TeamSide;
  state: PlayerState;

  // Health & Shield
  hp: number;
  maxHp: number;
  shieldHp: number;
  shieldType: ShieldType;
  regenPool: number; // For regen shields - reserve HP that can regenerate

  // Equipment
  weapon: WeaponId;
  sidearm: WeaponId;

  // Economy
  credits: number;
  creditsSpent: number;

  // Agent & Abilities
  agentId: AgentId;
  agentRole: AgentRole;
  abilities: AbilityCharges;

  // Optional position tracking (for spike carrier)
  position?: Position;

  // Round tracking
  hasSpike?: boolean;
  killsThisRound: number;
  damageDealtThisRound: number;
  damageTakenThisRound: number;
}

// ============================================
// SPIKE STATE MACHINE
// ============================================

/** Spike state machine states */
export type SpikeState =
  | 'carried'    // Attacker has the spike
  | 'dropped'    // Spike on ground (carrier died)
  | 'planting'   // Plant in progress
  | 'planted'    // Successfully planted
  | 'defusing'   // Defuse in progress
  | 'defused'    // Successfully defused
  | 'detonated'; // Spike exploded

/** Complete spike state during a round */
export interface SpikeRoundState {
  state: SpikeState;

  // Carrier info (when carried)
  carrierId?: string;

  // Drop info (when dropped)
  dropLocation?: Position;
  dropTime?: number;

  // Plant info (when planted or beyond)
  site?: 'A' | 'B';
  planterId?: string;
  plantTime?: number; // Timestamp when plant completed

  // Defuse info (when defusing)
  defuserId?: string;
  defuseStartTime?: number;
}

// ============================================
// DAMAGE CALCULATION
// ============================================

/** Hit location for damage calculation */
export type HitLocation = 'head' | 'body' | 'leg';

/** Source of damage */
export type DamageSourceType = 'weapon' | 'ability' | 'melee' | 'utility' | 'environment';

/** Breakdown of a single hit's damage */
export interface HitBreakdown {
  location: HitLocation;
  /** Raw damage before any reduction */
  baseDamage: number;
  /** Damage absorbed by shield (reduced by absorption rate) */
  shieldAbsorbed: number;
  /** Final damage applied to HP */
  hpDamage: number;
  /** Whether this was a penetration (through shield) */
  penetrated: boolean;
}

// ============================================
// TIMELINE EVENTS
// ============================================

/** Base interface for all timeline events */
interface BaseTimelineEvent {
  id: string;
  timestamp: number; // Milliseconds from round start
}

/** Damage event with explicit hit breakdown */
export interface SimDamageEvent extends BaseTimelineEvent {
  type: 'damage';
  attackerId: string;
  defenderId: string;
  source: DamageSourceType;
  weapon?: WeaponId;
  ability?: AbilityId;
  distance: number;
  hits: HitBreakdown[];
  totalDamage: number;
  defenderHpAfter: number;
  defenderShieldAfter: number;
  /** Whether this damage resulted in a kill */
  isLethal: boolean;
}

/** Kill event - always follows lethal damage */
export interface SimKillEvent extends BaseTimelineEvent {
  type: 'kill';
  killerId: string;
  victimId: string;
  weapon: WeaponId;
  ability?: AbilityId;
  isHeadshot: boolean;
  /** The damage event that caused this kill */
  damageEventId: string;
  /** Assisters who dealt damage to victim */
  assisters: string[];
}

/** Trade kill - kill that happened within trade window */
export interface TradeKillEvent extends BaseTimelineEvent {
  type: 'trade_kill';
  killerId: string;
  victimId: string;
  weapon: WeaponId;
  isHeadshot: boolean;
  /** The original kill being traded */
  tradedKillId: string;
  /** Time since original kill (ms) */
  tradeWindow: number;
}

// ============================================
// SPIKE EVENTS
// ============================================

/** Plant started */
export interface PlantStartEvent extends BaseTimelineEvent {
  type: 'plant_start';
  planterId: string;
  site: 'A' | 'B';
}

/** Plant interrupted (planter killed or moved) */
export interface PlantInterruptEvent extends BaseTimelineEvent {
  type: 'plant_interrupt';
  planterId: string;
  site: 'A' | 'B';
  reason: 'killed' | 'cancelled' | 'moved';
  /** Progress percentage when interrupted (0-100) */
  progress: number;
}

/** Plant completed */
export interface PlantCompleteEvent extends BaseTimelineEvent {
  type: 'plant_complete';
  planterId: string;
  site: 'A' | 'B';
}

/** Defuse started */
export interface DefuseStartEvent extends BaseTimelineEvent {
  type: 'defuse_start';
  defuserId: string;
}

/** Defuse interrupted */
export interface DefuseInterruptEvent extends BaseTimelineEvent {
  type: 'defuse_interrupt';
  defuserId: string;
  reason: 'killed' | 'cancelled' | 'moved';
  /** Progress percentage when interrupted (0-100) */
  progress: number;
}

/** Defuse completed */
export interface DefuseCompleteEvent extends BaseTimelineEvent {
  type: 'defuse_complete';
  defuserId: string;
}

/** Spike dropped (carrier killed) */
export interface SpikeDropEvent extends BaseTimelineEvent {
  type: 'spike_drop';
  dropperId: string;
  location: Position;
}

/** Spike picked up */
export interface SpikePickupEvent extends BaseTimelineEvent {
  type: 'spike_pickup';
  pickerId: string;
  location: Position;
}

/** Spike detonated */
export interface SpikeDetonationEvent extends BaseTimelineEvent {
  type: 'spike_detonation';
  site: 'A' | 'B';
  /** Defenders caught in blast */
  casualties: string[];
}

// ============================================
// ABILITY EVENTS
// ============================================

/** Ability use event */
export interface AbilityUseEvent extends BaseTimelineEvent {
  type: 'ability_use';
  playerId: string;
  agentId: AgentId;
  abilityId: AbilityId;
  abilityName: string;
  slot: 'basic1' | 'basic2' | 'signature' | 'ultimate';
  /** Targets affected, if any */
  targets?: string[];
}

/** Heal event (Sage, Skye, Phoenix, etc.) */
export interface HealEvent extends BaseTimelineEvent {
  type: 'heal';
  healerId: string;
  targetId: string;
  ability: AbilityId;
  amount: number;
  targetHpAfter: number;
}

// ============================================
// ROUND END EVENT
// ============================================

/** Win condition for round end */
export type SimWinCondition =
  | 'attackers_eliminated'
  | 'defenders_eliminated'
  | 'spike_detonated'
  | 'spike_defused'
  | 'time_expired';

/** Round end event */
export interface RoundEndEvent extends BaseTimelineEvent {
  type: 'round_end';
  winner: TeamSide;
  winCondition: SimWinCondition;
  /** Surviving players */
  survivors: string[];
}

// ============================================
// TIMELINE EVENT UNION
// ============================================

/** Discriminated union of all timeline events */
export type TimelineEvent =
  | SimDamageEvent
  | SimKillEvent
  | TradeKillEvent
  | PlantStartEvent
  | PlantInterruptEvent
  | PlantCompleteEvent
  | DefuseStartEvent
  | DefuseInterruptEvent
  | DefuseCompleteEvent
  | SpikeDropEvent
  | SpikePickupEvent
  | SpikeDetonationEvent
  | AbilityUseEvent
  | HealEvent
  | RoundEndEvent;

/** Extract event type string from TimelineEvent */
export type TimelineEventType = TimelineEvent['type'];

// ============================================
// BUY PHASE
// ============================================

/** Single ability purchase */
export interface AbilityPurchase {
  abilityId: AbilityId;
  abilityName: string;
  slot: 'basic1' | 'basic2';
  cost: number;
  charges: number;
}

/** Buy phase entry for a single player */
export interface BuyPhaseEntry {
  playerId: string;
  playerName: string;
  agentId: AgentId;
  teamSide: TeamSide;

  // Weapon decisions
  weaponPurchased: WeaponId | null;  // null if kept from previous
  weaponKept: WeaponId | null;       // Weapon carried over
  sidearmPurchased: WeaponId | null;

  // Shield decision
  shieldPurchased: ShieldType | null;

  // Abilities purchased
  abilitiesPurchased: AbilityPurchase[];

  // Economy
  creditsAtStart: number;
  creditsSpent: number;
  creditsRemaining: number;

  // Buy type classification
  buyType: BuyType;
}

/** Complete buy phase for both teams */
export interface BuyPhaseResult {
  roundNumber: number;
  attackerEntries: BuyPhaseEntry[];
  defenderEntries: BuyPhaseEntry[];
  attackerTotalSpend: number;
  defenderTotalSpend: number;
  attackerBuyType: BuyType;
  defenderBuyType: BuyType;
}

// ============================================
// DERIVED SUMMARY (Computed from Timeline)
// ============================================

/** Clutch attempt details */
export interface ClutchAttemptInfo {
  playerId: string;
  playerName: string;
  situation: '1v1' | '1v2' | '1v3' | '1v4' | '1v5';
  /** When the clutch situation started (ms) */
  startTimestamp: number;
  won: boolean;
  /** Kills during the clutch */
  killsDuring: number;
}

/** Summary derived entirely from timeline events */
export interface DerivedRoundSummary {
  // First blood
  firstBlood: {
    killerId: string;
    killerName: string;
    victimId: string;
    victimName: string;
    timestamp: number;
    weapon: WeaponId;
  } | null;

  // Spike events
  spikePlanted: boolean;
  plantSite: 'A' | 'B' | null;
  spikeDefused: boolean;
  spikeDetonated: boolean;
  plantsAttempted: number;
  plantsInterrupted: number;
  defusesAttempted: number;
  defusesInterrupted: number;

  // Clutch
  clutchAttempt: ClutchAttemptInfo | null;

  // Combat stats
  totalKills: number;
  totalHeadshots: number;
  headshotPercentage: number;
  totalDamage: number;
  tradeKills: number;

  // Round info
  roundDuration: number; // ms
  winCondition: SimWinCondition;
  winner: TeamSide;

  // Ability usage
  abilitiesUsed: number;
  ultimatesUsed: number;
  healsApplied: number;
  totalHealing: number;
}

// ============================================
// ROUND STATE (Complete snapshot)
// ============================================

/** Complete round state at any point in time */
export interface RoundState {
  roundNumber: number;
  halfNumber: 1 | 2 | 3; // 3 = overtime
  isOvertime: boolean;

  // Timer
  roundTimeRemaining: number; // ms
  postPlantTimeRemaining?: number; // ms (only if spike planted)

  // Teams
  attackerTeamId: string;
  defenderTeamId: string;

  // Player states
  playerStates: Map<string, PlayerRoundState>;

  // Spike state
  spikeState: SpikeRoundState;

  // Timeline
  timeline: TimelineEvent[];

  // Running scores
  attackerScore: number;
  defenderScore: number;
}

// ============================================
// VALIDATION
// ============================================

/** Validation error for timeline events */
export interface ValidationError {
  eventId: string;
  eventType: TimelineEventType;
  timestamp: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

/** Validation result */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================
// SIMULATION CONFIG
// ============================================

/** Round simulation configuration */
export interface RoundSimulationConfig {
  /** Base round time in ms (default: 100000 = 100s) */
  roundTime: number;
  /** Post-plant time in ms (default: 45000 = 45s) */
  postPlantTime: number;
  /** Plant duration in ms (default: 4000 = 4s) */
  plantDuration: number;
  /** Defuse duration in ms (default: 7000 = 7s) */
  defuseDuration: number;
  /** Trade kill window in ms (default: 3000 = 3s) */
  tradeWindow: number;
  /** Random seed for deterministic simulation */
  seed?: number;
}

/** Default simulation config */
export const DEFAULT_ROUND_CONFIG: RoundSimulationConfig = {
  roundTime: 100000,
  postPlantTime: 45000,
  plantDuration: 4000,
  defuseDuration: 7000,
  tradeWindow: 3000,
};
