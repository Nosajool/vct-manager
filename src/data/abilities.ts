// Agent Abilities Data
// Comprehensive data for all Valorant agent abilities
// Used for simulation, buy phase, and ability tracking

import type { AgentRole } from '../types';

// ============================================
// TYPES
// ============================================

/** Ability slot keys */
export type AbilitySlot = 'C' | 'Q' | 'E' | 'X';

/** Effect types for abilities */
export type AbilityEffectType =
  | 'damage'
  | 'heal'
  | 'smoke'
  | 'flash'
  | 'recon'
  | 'wall'
  | 'teleport'
  | 'stim'
  | 'molly'
  | 'trap'
  | 'debuff'
  | 'revive'
  | 'suppress'
  | 'blind'
  | 'concuss'
  | 'slow'
  | 'vulnerable'
  | 'reveal'
  | 'barrier';

/** Single ability definition */
export interface Ability {
  /** Unique identifier: agentName_slot (e.g., "Jett_E") */
  id: string;
  /** Display name of the ability */
  name: string;
  /** Slot: C, Q, E (signature), X (ultimate) */
  slot: AbilitySlot;
  /** Cost in credits (0 for signature abilities) */
  cost: number;
  /** Maximum charges per round */
  maxCharges: number;
  /** Whether this is the signature ability (free each round) */
  isSignature: boolean;
  /** Ultimate cost in points (only for X slot, typically 6-8) */
  ultimateCost?: number;
  /** Primary effect type */
  effectType: AbilityEffectType;
  /** Secondary effect types if any */
  secondaryEffects?: AbilityEffectType[];
  /** Damage values if applicable */
  damage?: {
    min?: number;
    max?: number;
    dps?: number;
  };
  /** Duration in milliseconds if applicable */
  durationMs?: number;
  /** Area of effect radius in meters if applicable */
  aoeRadius?: number;
  /** Brief description */
  description: string;
}

/** Agent abilities collection */
export interface AgentAbilities {
  /** Agent name */
  agentId: string;
  /** Agent role */
  role: AgentRole;
  /** All four abilities */
  abilities: {
    C: Ability;
    Q: Ability;
    E: Ability;
    X: Ability;
  };
}

// ============================================
// DUELISTS
// ============================================

const JETT: AgentAbilities = {
  agentId: 'Jett',
  role: 'Duelist',
  abilities: {
    C: {
      id: 'Jett_C',
      name: 'Cloudburst',
      slot: 'C',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'smoke',
      durationMs: 4500,
      aoeRadius: 3,
      description: 'Throw a projectile that expands into a brief smoke cloud on impact.',
    },
    Q: {
      id: 'Jett_Q',
      name: 'Updraft',
      slot: 'Q',
      cost: 150,
      maxCharges: 2,
      isSignature: false,
      effectType: 'teleport',
      description: 'Propel Jett high into the air.',
    },
    E: {
      id: 'Jett_E',
      name: 'Tailwind',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'teleport',
      description: 'Dash in the direction you are moving. Recharges on 2 kills.',
    },
    X: {
      id: 'Jett_X',
      name: 'Blade Storm',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'damage',
      damage: { min: 50, max: 150 },
      description: 'Equip a set of deadly throwing knives that deal moderate damage and kill on headshots.',
    },
  },
};

const PHOENIX: AgentAbilities = {
  agentId: 'Phoenix',
  role: 'Duelist',
  abilities: {
    C: {
      id: 'Phoenix_C',
      name: 'Blaze',
      slot: 'C',
      cost: 200,
      maxCharges: 1,
      isSignature: false,
      effectType: 'wall',
      secondaryEffects: ['damage', 'heal'],
      damage: { dps: 30 },
      durationMs: 8000,
      description: 'Cast a flame wall that blocks vision and damages enemies passing through.',
    },
    Q: {
      id: 'Phoenix_Q',
      name: 'Curveball',
      slot: 'Q',
      cost: 250,
      maxCharges: 2,
      isSignature: false,
      effectType: 'flash',
      durationMs: 1100,
      description: 'Cast a curving flare that blinds enemies.',
    },
    E: {
      id: 'Phoenix_E',
      name: 'Hot Hands',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'molly',
      secondaryEffects: ['heal'],
      damage: { dps: 60 },
      durationMs: 4000,
      aoeRadius: 4,
      description: 'Throw a fireball that creates a damaging zone. Heals Phoenix when standing in it.',
    },
    X: {
      id: 'Phoenix_X',
      name: 'Run It Back',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 6,
      effectType: 'revive',
      durationMs: 10000,
      description: 'Mark your current location. If you die or the timer expires, respawn at the marked location.',
    },
  },
};

const REYNA: AgentAbilities = {
  agentId: 'Reyna',
  role: 'Duelist',
  abilities: {
    C: {
      id: 'Reyna_C',
      name: 'Leer',
      slot: 'C',
      cost: 250,
      maxCharges: 2,
      isSignature: false,
      effectType: 'blind',
      durationMs: 2000,
      description: 'Cast a destructible ethereal eye that nearsights enemies who look at it.',
    },
    Q: {
      id: 'Reyna_Q',
      name: 'Devour',
      slot: 'Q',
      cost: 100,
      maxCharges: 2,
      isSignature: false,
      effectType: 'heal',
      durationMs: 3000,
      description: 'Consume a soul orb to rapidly heal. Overheals up to 150 HP.',
    },
    E: {
      id: 'Reyna_E',
      name: 'Dismiss',
      slot: 'E',
      cost: 0,
      maxCharges: 2,
      isSignature: true,
      effectType: 'teleport',
      durationMs: 2000,
      description: 'Consume a soul orb to become intangible for a short duration.',
    },
    X: {
      id: 'Reyna_X',
      name: 'Empress',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 6,
      effectType: 'stim',
      durationMs: 30000,
      description: 'Enter a frenzy, gaining combat stim and infinite soul orbs for the duration.',
    },
  },
};

const RAZE: AgentAbilities = {
  agentId: 'Raze',
  role: 'Duelist',
  abilities: {
    C: {
      id: 'Raze_C',
      name: 'Boom Bot',
      slot: 'C',
      cost: 400,
      maxCharges: 1,
      isSignature: false,
      effectType: 'recon',
      secondaryEffects: ['damage'],
      damage: { min: 30, max: 80 },
      description: 'Deploy a bot that travels in a straight line, bouncing off walls and exploding on enemies.',
    },
    Q: {
      id: 'Raze_Q',
      name: 'Blast Pack',
      slot: 'Q',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'damage',
      damage: { min: 15, max: 50 },
      aoeRadius: 5,
      description: 'Throw a blast pack that sticks to surfaces. Detonate to damage and move anything caught in the blast.',
    },
    E: {
      id: 'Raze_E',
      name: 'Paint Shells',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'damage',
      damage: { min: 15, max: 55 },
      aoeRadius: 6,
      description: 'Throw a cluster grenade that deals damage and creates sub-munitions on impact.',
    },
    X: {
      id: 'Raze_X',
      name: 'Showstopper',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 8,
      effectType: 'damage',
      damage: { min: 30, max: 150 },
      aoeRadius: 6,
      description: 'Equip a rocket launcher that deals massive damage in an area.',
    },
  },
};

const YORU: AgentAbilities = {
  agentId: 'Yoru',
  role: 'Duelist',
  abilities: {
    C: {
      id: 'Yoru_C',
      name: 'Fakeout',
      slot: 'C',
      cost: 100,
      maxCharges: 2,
      isSignature: false,
      effectType: 'recon',
      secondaryEffects: ['flash'],
      durationMs: 1400,
      description: 'Deploy a decoy that flashes enemies when destroyed.',
    },
    Q: {
      id: 'Yoru_Q',
      name: 'Blindside',
      slot: 'Q',
      cost: 250,
      maxCharges: 2,
      isSignature: false,
      effectType: 'flash',
      durationMs: 1500,
      description: 'Throw a flash that activates after bouncing off a surface.',
    },
    E: {
      id: 'Yoru_E',
      name: 'Gatecrash',
      slot: 'E',
      cost: 0,
      maxCharges: 2,
      isSignature: true,
      effectType: 'teleport',
      durationMs: 30000,
      description: 'Send out a rift tether that you can teleport to.',
    },
    X: {
      id: 'Yoru_X',
      name: 'Dimensional Drift',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'teleport',
      durationMs: 10000,
      description: 'Enter a dimension between realms, invisible and invulnerable.',
    },
  },
};

const NEON: AgentAbilities = {
  agentId: 'Neon',
  role: 'Duelist',
  abilities: {
    C: {
      id: 'Neon_C',
      name: 'Fast Lane',
      slot: 'C',
      cost: 300,
      maxCharges: 1,
      isSignature: false,
      effectType: 'wall',
      durationMs: 6000,
      description: 'Fire two energy lines that extend forward, creating walls that block vision.',
    },
    Q: {
      id: 'Neon_Q',
      name: 'Relay Bolt',
      slot: 'Q',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'concuss',
      aoeRadius: 4,
      description: 'Throw an energy bolt that bounces once and concusses enemies.',
    },
    E: {
      id: 'Neon_E',
      name: 'High Gear',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'stim',
      secondaryEffects: ['teleport'],
      description: 'Sprint at high speed. Use alt-fire to slide.',
    },
    X: {
      id: 'Neon_X',
      name: 'Overdrive',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'damage',
      damage: { dps: 22 },
      durationMs: 20000,
      description: 'Unleash your full power, firing a deadly electric beam.',
    },
  },
};

const ISO: AgentAbilities = {
  agentId: 'Iso',
  role: 'Duelist',
  abilities: {
    C: {
      id: 'Iso_C',
      name: 'Undercut',
      slot: 'C',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'vulnerable',
      durationMs: 4000,
      description: 'Throw a molecular bolt that applies vulnerable to enemies.',
    },
    Q: {
      id: 'Iso_Q',
      name: 'Contingency',
      slot: 'Q',
      cost: 250,
      maxCharges: 1,
      isSignature: false,
      effectType: 'wall',
      durationMs: 3500,
      description: 'Assemble a prismatic wall that blocks bullets.',
    },
    E: {
      id: 'Iso_E',
      name: 'Double Tap',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'stim',
      description: 'Start a focus timer. Killing an enemy refreshes it and creates a shield orb.',
    },
    X: {
      id: 'Iso_X',
      name: 'Kill Contract',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'teleport',
      durationMs: 10000,
      description: 'Throw a column of energy that pulls you and the first enemy hit into a 1v1 arena.',
    },
  },
};

const WAYLAY: AgentAbilities = {
  agentId: 'Waylay',
  role: 'Duelist',
  abilities: {
    C: {
      id: 'Waylay_C',
      name: 'Light Speed',
      slot: 'C',
      cost: 250,
      maxCharges: 1,
      isSignature: false,
      effectType: 'stim',
      description: 'Dash forward twice (or once with alt fire). First dash can go upward.',
    },
    Q: {
      id: 'Waylay_Q',
      name: 'Saturate',
      slot: 'Q',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'slow',
      aoeRadius: 5,
      description: 'Instantly throw a cluster of light that explodes on ground contact, hindering nearby enemies.',
    },
    E: {
      id: 'Waylay_E',
      name: 'Refract',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'stim',
      description: 'Create a beacon of light on the floor. Reactivate to speed back to it as an invulnerable mote.',
    },
    X: {
      id: 'Waylay_X',
      name: 'Convergent Paths',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 8,
      effectType: 'flash',
      aoeRadius: 30,
      description: 'Launch a luminous beam through walls that hinders enemies, then surge forward.',
    },
  },
};

// ============================================
// INITIATORS
// ============================================

const SOVA: AgentAbilities = {
  agentId: 'Sova',
  role: 'Initiator',
  abilities: {
    C: {
      id: 'Sova_C',
      name: 'Owl Drone',
      slot: 'C',
      cost: 400,
      maxCharges: 1,
      isSignature: false,
      effectType: 'recon',
      secondaryEffects: ['debuff'],
      description: 'Deploy a pilotable drone that can fire a dart to reveal enemies.',
    },
    Q: {
      id: 'Sova_Q',
      name: 'Shock Bolt',
      slot: 'Q',
      cost: 150,
      maxCharges: 2,
      isSignature: false,
      effectType: 'damage',
      damage: { min: 14, max: 90 },
      aoeRadius: 5,
      description: 'Fire an explosive bolt that emits a damaging pulse on impact.',
    },
    E: {
      id: 'Sova_E',
      name: 'Recon Bolt',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'recon',
      durationMs: 6000,
      aoeRadius: 30,
      description: 'Fire a bolt that deploys a sonar emitter, revealing nearby enemies.',
    },
    X: {
      id: 'Sova_X',
      name: "Hunter's Fury",
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 8,
      effectType: 'damage',
      secondaryEffects: ['recon'],
      damage: { min: 80, max: 80 },
      description: 'Fire up to three wall-piercing energy blasts that damage and reveal enemies.',
    },
  },
};

const BREACH: AgentAbilities = {
  agentId: 'Breach',
  role: 'Initiator',
  abilities: {
    C: {
      id: 'Breach_C',
      name: 'Aftershock',
      slot: 'C',
      cost: 200,
      maxCharges: 1,
      isSignature: false,
      effectType: 'damage',
      damage: { min: 60, max: 60 },
      aoeRadius: 4,
      description: 'Fire a fusion charge through a wall that deals heavy damage.',
    },
    Q: {
      id: 'Breach_Q',
      name: 'Flashpoint',
      slot: 'Q',
      cost: 250,
      maxCharges: 2,
      isSignature: false,
      effectType: 'flash',
      durationMs: 2000,
      description: 'Fire a blinding charge through a wall that flashes all players looking at it.',
    },
    E: {
      id: 'Breach_E',
      name: 'Fault Line',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'concuss',
      durationMs: 3000,
      aoeRadius: 30,
      description: 'Fire a seismic blast that dazes all players in its zone.',
    },
    X: {
      id: 'Breach_X',
      name: 'Rolling Thunder',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'concuss',
      durationMs: 6000,
      aoeRadius: 40,
      description: 'Send a seismic charge across the ground that dazes and knocks up enemies.',
    },
  },
};

const SKYE: AgentAbilities = {
  agentId: 'Skye',
  role: 'Initiator',
  abilities: {
    C: {
      id: 'Skye_C',
      name: 'Regrowth',
      slot: 'C',
      cost: 200,
      maxCharges: 1,
      isSignature: false,
      effectType: 'heal',
      aoeRadius: 10,
      description: 'Channel to heal allies in range and line of sight.',
    },
    Q: {
      id: 'Skye_Q',
      name: 'Trailblazer',
      slot: 'Q',
      cost: 250,
      maxCharges: 1,
      isSignature: false,
      effectType: 'recon',
      secondaryEffects: ['concuss'],
      durationMs: 1200,
      description: 'Control a Tasmanian tiger that can leap and concuss enemies.',
    },
    E: {
      id: 'Skye_E',
      name: 'Guiding Light',
      slot: 'E',
      cost: 0,
      maxCharges: 2,
      isSignature: true,
      effectType: 'flash',
      durationMs: 2000,
      description: 'Guide a hawk that transforms into a flash on reactivation.',
    },
    X: {
      id: 'Skye_X',
      name: 'Seekers',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 6,
      effectType: 'recon',
      secondaryEffects: ['blind'],
      description: 'Send out three seekers that track down and nearsight enemies.',
    },
  },
};

const KAYO: AgentAbilities = {
  agentId: 'KAY/O',
  role: 'Initiator',
  abilities: {
    C: {
      id: 'KAYO_C',
      name: 'FRAG/ment',
      slot: 'C',
      cost: 200,
      maxCharges: 1,
      isSignature: false,
      effectType: 'damage',
      damage: { min: 25, max: 60 },
      aoeRadius: 6,
      durationMs: 4000,
      description: 'Throw an explosive fragment that sticks to the floor and explodes multiple times.',
    },
    Q: {
      id: 'KAYO_Q',
      name: 'FLASH/drive',
      slot: 'Q',
      cost: 250,
      maxCharges: 2,
      isSignature: false,
      effectType: 'flash',
      durationMs: 2000,
      description: 'Throw a flash grenade that explodes after a short fuse.',
    },
    E: {
      id: 'KAYO_E',
      name: 'ZERO/point',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'suppress',
      durationMs: 4000,
      aoeRadius: 15,
      description: 'Throw a suppression blade that sticks to surfaces and suppresses enemies caught in the explosion.',
    },
    X: {
      id: 'KAYO_X',
      name: 'NULL/cmd',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'suppress',
      secondaryEffects: ['stim'],
      durationMs: 15000,
      aoeRadius: 15,
      description: 'Overload with polarized radianite energy, suppressing enemies and gaining combat stim.',
    },
  },
};

const FADE: AgentAbilities = {
  agentId: 'Fade',
  role: 'Initiator',
  abilities: {
    C: {
      id: 'Fade_C',
      name: 'Prowler',
      slot: 'C',
      cost: 250,
      maxCharges: 2,
      isSignature: false,
      effectType: 'recon',
      secondaryEffects: ['blind'],
      durationMs: 2500,
      description: 'Send out a prowler that tracks and nearsights enemies.',
    },
    Q: {
      id: 'Fade_Q',
      name: 'Seize',
      slot: 'Q',
      cost: 200,
      maxCharges: 1,
      isSignature: false,
      effectType: 'debuff',
      secondaryEffects: ['slow'],
      damage: { min: 75, max: 75 },
      durationMs: 4500,
      aoeRadius: 7,
      description: 'Throw an orb that tethers and decays enemies caught in its zone.',
    },
    E: {
      id: 'Fade_E',
      name: 'Haunt',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'recon',
      secondaryEffects: ['debuff'],
      durationMs: 6000,
      aoeRadius: 30,
      description: 'Throw an orb that reveals enemies and applies a trail.',
    },
    X: {
      id: 'Fade_X',
      name: 'Nightfall',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'debuff',
      secondaryEffects: ['blind', 'slow'],
      aoeRadius: 30,
      durationMs: 12000,
      description: 'Send out a wave of nightmare energy that trails, deafens, and decays enemies.',
    },
  },
};

const GEKKO: AgentAbilities = {
  agentId: 'Gekko',
  role: 'Initiator',
  abilities: {
    C: {
      id: 'Gekko_C',
      name: 'Mosh Pit',
      slot: 'C',
      cost: 150,
      maxCharges: 1,
      isSignature: false,
      effectType: 'damage',
      damage: { min: 10, max: 150 },
      aoeRadius: 8,
      durationMs: 6000,
      description: 'Throw Mosh, who explodes into a damaging zone.',
    },
    Q: {
      id: 'Gekko_Q',
      name: 'Wingman',
      slot: 'Q',
      cost: 300,
      maxCharges: 1,
      isSignature: false,
      effectType: 'recon',
      secondaryEffects: ['concuss'],
      durationMs: 2000,
      description: 'Send Wingman to seek enemies or plant/defuse the spike.',
    },
    E: {
      id: 'Gekko_E',
      name: 'Dizzy',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'blind',
      durationMs: 3500,
      description: 'Send Dizzy to fly and blind enemies she spots.',
    },
    X: {
      id: 'Gekko_X',
      name: 'Thrash',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'debuff',
      durationMs: 6000,
      aoeRadius: 6,
      description: 'Link with Thrash and lunge to detain enemies caught in her explosion.',
    },
  },
};

const TEJO: AgentAbilities = {
  agentId: 'Tejo',
  role: 'Initiator',
  abilities: {
    C: {
      id: 'Tejo_C',
      name: 'Stealth Drone',
      slot: 'C',
      cost: 200,
      maxCharges: 1,
      isSignature: false,
      effectType: 'reveal',
      secondaryEffects: ['suppress'],
      description: 'Throw a drone and assume control. Fire to pulse: suppresses and reveals enemies hit.',
    },
    Q: {
      id: 'Tejo_Q',
      name: 'Special Delivery',
      slot: 'Q',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'concuss',
      aoeRadius: 5,
      description: 'Launch a sticky concuss grenade. Alt fire for a single bounce.',
    },
    E: {
      id: 'Tejo_E',
      name: 'Guided Salvo',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'concuss',
      aoeRadius: 6,
      description: 'Select up to 2 target locations and launch missiles that auto-navigate and concuss on arrival.',
    },
    X: {
      id: 'Tejo_X',
      name: 'Armageddon',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 9,
      effectType: 'damage',
      damage: { min: 50, max: 150 },
      aoeRadius: 40,
      description: 'Select an origin and end point, then unleash a wave of explosions along the path.',
    },
  },
};

// ============================================
// CONTROLLERS
// ============================================

const BRIMSTONE: AgentAbilities = {
  agentId: 'Brimstone',
  role: 'Controller',
  abilities: {
    C: {
      id: 'Brimstone_C',
      name: 'Stim Beacon',
      slot: 'C',
      cost: 200,
      maxCharges: 1,
      isSignature: false,
      effectType: 'stim',
      aoeRadius: 8,
      durationMs: 12000,
      description: 'Deploy a beacon that gives a combat stim to all players in range.',
    },
    Q: {
      id: 'Brimstone_Q',
      name: 'Incendiary',
      slot: 'Q',
      cost: 250,
      maxCharges: 1,
      isSignature: false,
      effectType: 'molly',
      damage: { dps: 60 },
      aoeRadius: 5,
      durationMs: 8000,
      description: 'Launch an incendiary grenade that deploys a damaging fire zone.',
    },
    E: {
      id: 'Brimstone_E',
      name: 'Sky Smoke',
      slot: 'E',
      cost: 0,
      maxCharges: 3,
      isSignature: true,
      effectType: 'smoke',
      aoeRadius: 5,
      durationMs: 19500,
      description: 'Use your tactical map to call in orbital smoke screens.',
    },
    X: {
      id: 'Brimstone_X',
      name: 'Orbital Strike',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'damage',
      damage: { dps: 80 },
      aoeRadius: 10,
      durationMs: 4000,
      description: 'Call in a devastating orbital laser that damages enemies in its path.',
    },
  },
};

const OMEN: AgentAbilities = {
  agentId: 'Omen',
  role: 'Controller',
  abilities: {
    C: {
      id: 'Omen_C',
      name: 'Shrouded Step',
      slot: 'C',
      cost: 100,
      maxCharges: 2,
      isSignature: false,
      effectType: 'teleport',
      description: 'Teleport a short distance after a brief delay.',
    },
    Q: {
      id: 'Omen_Q',
      name: 'Paranoia',
      slot: 'Q',
      cost: 300,
      maxCharges: 1,
      isSignature: false,
      effectType: 'blind',
      durationMs: 2000,
      description: 'Send out a shadow that nearsights enemies it touches.',
    },
    E: {
      id: 'Omen_E',
      name: 'Dark Cover',
      slot: 'E',
      cost: 0,
      maxCharges: 2,
      isSignature: true,
      effectType: 'smoke',
      aoeRadius: 5,
      durationMs: 15000,
      description: 'Cast a shadow orb that creates a long-lasting smoke sphere.',
    },
    X: {
      id: 'Omen_X',
      name: 'From the Shadows',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'teleport',
      description: 'Teleport anywhere on the map. Can be cancelled by enemies.',
    },
  },
};

const VIPER: AgentAbilities = {
  agentId: 'Viper',
  role: 'Controller',
  abilities: {
    C: {
      id: 'Viper_C',
      name: 'Snake Bite',
      slot: 'C',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'molly',
      secondaryEffects: ['vulnerable'],
      damage: { dps: 25 },
      aoeRadius: 6,
      durationMs: 6500,
      description: 'Fire a projectile that creates a chemical zone that damages and applies vulnerable.',
    },
    Q: {
      id: 'Viper_Q',
      name: 'Poison Cloud',
      slot: 'Q',
      cost: 200,
      maxCharges: 1,
      isSignature: false,
      effectType: 'smoke',
      secondaryEffects: ['debuff'],
      aoeRadius: 8,
      description: 'Throw a gas emitter that can be reactivated to create a toxic smoke cloud.',
    },
    E: {
      id: 'Viper_E',
      name: 'Toxic Screen',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'wall',
      secondaryEffects: ['debuff'],
      description: 'Deploy a line of gas emitters that create a toxic wall when activated.',
    },
    X: {
      id: 'Viper_X',
      name: "Viper's Pit",
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 8,
      effectType: 'smoke',
      secondaryEffects: ['blind', 'debuff'],
      aoeRadius: 20,
      description: 'Emit a massive toxic cloud that reduces vision and decays enemies inside.',
    },
  },
};

const ASTRA: AgentAbilities = {
  agentId: 'Astra',
  role: 'Controller',
  abilities: {
    C: {
      id: 'Astra_C',
      name: 'Gravity Well',
      slot: 'C',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      effectType: 'debuff',
      secondaryEffects: ['slow'],
      aoeRadius: 8,
      durationMs: 2000,
      description: 'Activate a star to form a gravity well that pulls and makes enemies vulnerable.',
    },
    Q: {
      id: 'Astra_Q',
      name: 'Nova Pulse',
      slot: 'Q',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      effectType: 'concuss',
      aoeRadius: 8,
      durationMs: 4000,
      description: 'Activate a star to detonate a concussive blast.',
    },
    E: {
      id: 'Astra_E',
      name: 'Nebula',
      slot: 'E',
      cost: 0,
      maxCharges: 2,
      isSignature: true,
      effectType: 'smoke',
      aoeRadius: 5,
      durationMs: 14000,
      description: 'Activate a star to transform it into a smoke sphere.',
    },
    X: {
      id: 'Astra_X',
      name: 'Cosmic Divide',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'wall',
      description: 'Create a cosmic barrier that blocks bullets and dampens audio.',
    },
  },
};

const HARBOR: AgentAbilities = {
  agentId: 'Harbor',
  role: 'Controller',
  abilities: {
    C: {
      id: 'Harbor_C',
      name: 'Cascade',
      slot: 'C',
      cost: 150,
      maxCharges: 1,
      isSignature: false,
      effectType: 'wall',
      secondaryEffects: ['slow'],
      durationMs: 5000,
      description: 'Send a wave of water that slows players passing through.',
    },
    Q: {
      id: 'Harbor_Q',
      name: 'Cove',
      slot: 'Q',
      cost: 350,
      maxCharges: 1,
      isSignature: false,
      effectType: 'smoke',
      aoeRadius: 5,
      durationMs: 15000,
      description: 'Create a water shield that blocks bullets.',
    },
    E: {
      id: 'Harbor_E',
      name: 'High Tide',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'wall',
      secondaryEffects: ['slow'],
      durationMs: 15000,
      description: 'Send a wave of water that can be bent while deploying.',
    },
    X: {
      id: 'Harbor_X',
      name: 'Reckoning',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'concuss',
      aoeRadius: 25,
      durationMs: 9000,
      description: 'Call down successive strikes that concuss enemies caught in the zone.',
    },
  },
};

const CLOVE: AgentAbilities = {
  agentId: 'Clove',
  role: 'Controller',
  abilities: {
    C: {
      id: 'Clove_C',
      name: 'Pick-me-up',
      slot: 'C',
      cost: 100,
      maxCharges: 1,
      isSignature: false,
      effectType: 'stim',
      durationMs: 10000,
      description: 'Absorb life force from a killed enemy to gain haste and health.',
    },
    Q: {
      id: 'Clove_Q',
      name: 'Meddle',
      slot: 'Q',
      cost: 250,
      maxCharges: 1,
      isSignature: false,
      effectType: 'debuff',
      durationMs: 6000,
      aoeRadius: 8,
      description: 'Throw a fragment that decays all enemies inside its radius.',
    },
    E: {
      id: 'Clove_E',
      name: 'Ruse',
      slot: 'E',
      cost: 0,
      maxCharges: 2,
      isSignature: true,
      effectType: 'smoke',
      aoeRadius: 5,
      durationMs: 13500,
      description: 'Cast smokes that can be used even after death.',
    },
    X: {
      id: 'Clove_X',
      name: 'Not Dead Yet',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'revive',
      durationMs: 12000,
      description: 'After dying, resurrect yourself. Must get a kill or assist to survive.',
    },
  },
};

// ============================================
// SENTINELS
// ============================================

const SAGE: AgentAbilities = {
  agentId: 'Sage',
  role: 'Sentinel',
  abilities: {
    C: {
      id: 'Sage_C',
      name: 'Barrier Orb',
      slot: 'C',
      cost: 400,
      maxCharges: 1,
      isSignature: false,
      effectType: 'wall',
      durationMs: 40000,
      description: 'Create a solid wall that blocks movement and can be rotated.',
    },
    Q: {
      id: 'Sage_Q',
      name: 'Slow Orb',
      slot: 'Q',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'slow',
      aoeRadius: 7,
      durationMs: 7000,
      description: 'Cast an orb that creates a slowing zone on impact.',
    },
    E: {
      id: 'Sage_E',
      name: 'Healing Orb',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'heal',
      durationMs: 5000,
      description: 'Heal an ally or yourself over time.',
    },
    X: {
      id: 'Sage_X',
      name: 'Resurrection',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 8,
      effectType: 'revive',
      description: 'Revive a dead ally with full health.',
    },
  },
};

const CYPHER: AgentAbilities = {
  agentId: 'Cypher',
  role: 'Sentinel',
  abilities: {
    C: {
      id: 'Cypher_C',
      name: 'Trapwire',
      slot: 'C',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'trap',
      secondaryEffects: ['debuff'],
      description: 'Place a tripwire that reveals and dazes enemies who cross it.',
    },
    Q: {
      id: 'Cypher_Q',
      name: 'Cyber Cage',
      slot: 'Q',
      cost: 100,
      maxCharges: 2,
      isSignature: false,
      effectType: 'trap',
      secondaryEffects: ['slow'],
      durationMs: 7000,
      description: 'Place a cage that creates a zone slowing and playing audio when enemies pass.',
    },
    E: {
      id: 'Cypher_E',
      name: 'Spycam',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'recon',
      secondaryEffects: ['debuff'],
      description: 'Place a remote camera that can fire tracking darts.',
    },
    X: {
      id: 'Cypher_X',
      name: 'Neural Theft',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 6,
      effectType: 'recon',
      description: 'Use on a dead enemy to reveal all living enemies.',
    },
  },
};

const KILLJOY: AgentAbilities = {
  agentId: 'Killjoy',
  role: 'Sentinel',
  abilities: {
    C: {
      id: 'Killjoy_C',
      name: 'Nanoswarm',
      slot: 'C',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'damage',
      damage: { dps: 45 },
      aoeRadius: 6,
      durationMs: 4500,
      description: 'Deploy a grenade that goes covert and can be activated to deal damage.',
    },
    Q: {
      id: 'Killjoy_Q',
      name: 'Alarmbot',
      slot: 'Q',
      cost: 200,
      maxCharges: 1,
      isSignature: false,
      effectType: 'trap',
      secondaryEffects: ['vulnerable'],
      durationMs: 4000,
      description: 'Deploy a bot that hunts enemies and applies vulnerable.',
    },
    E: {
      id: 'Killjoy_E',
      name: 'Turret',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'damage',
      secondaryEffects: ['recon'],
      damage: { dps: 8 },
      description: 'Deploy a turret that fires at enemies in a 180-degree cone.',
    },
    X: {
      id: 'Killjoy_X',
      name: 'Lockdown',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 8,
      effectType: 'debuff',
      aoeRadius: 30,
      durationMs: 8000,
      description: 'Deploy a device that detains all enemies caught in its radius after a windup.',
    },
  },
};

const CHAMBER: AgentAbilities = {
  agentId: 'Chamber',
  role: 'Sentinel',
  abilities: {
    C: {
      id: 'Chamber_C',
      name: 'Trademark',
      slot: 'C',
      cost: 200,
      maxCharges: 1,
      isSignature: false,
      effectType: 'trap',
      secondaryEffects: ['slow'],
      aoeRadius: 10,
      durationMs: 9500,
      description: 'Place a trap that scans for enemies and slows them when triggered.',
    },
    Q: {
      id: 'Chamber_Q',
      name: 'Headhunter',
      slot: 'Q',
      cost: 100,
      maxCharges: 8,
      isSignature: false,
      effectType: 'damage',
      damage: { min: 55, max: 159 },
      description: 'Activate to equip a heavy pistol. Alt fire to ADS.',
    },
    E: {
      id: 'Chamber_E',
      name: 'Rendezvous',
      slot: 'E',
      cost: 0,
      maxCharges: 2,
      isSignature: true,
      effectType: 'teleport',
      description: 'Place two teleport anchors and teleport between them.',
    },
    X: {
      id: 'Chamber_X',
      name: 'Tour De Force',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 8,
      effectType: 'damage',
      secondaryEffects: ['slow'],
      damage: { min: 150, max: 255 },
      durationMs: 9000,
      aoeRadius: 8,
      description: 'Summon a powerful sniper rifle that kills on any hit and creates a slow field.',
    },
  },
};

const DEADLOCK: AgentAbilities = {
  agentId: 'Deadlock',
  role: 'Sentinel',
  abilities: {
    C: {
      id: 'Deadlock_C',
      name: 'GravNet',
      slot: 'C',
      cost: 200,
      maxCharges: 1,
      isSignature: false,
      effectType: 'trap',
      secondaryEffects: ['slow'],
      durationMs: 6000,
      aoeRadius: 6,
      description: 'Throw a grenade that detonates and forces enemies to crouch and move slowly.',
    },
    Q: {
      id: 'Deadlock_Q',
      name: 'Sonic Sensor',
      slot: 'Q',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'trap',
      secondaryEffects: ['concuss'],
      aoeRadius: 8,
      description: 'Deploy a sensor that triggers a concuss when enemies make sound nearby.',
    },
    E: {
      id: 'Deadlock_E',
      name: 'Barrier Mesh',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'wall',
      description: 'Generate a barrier that blocks character movement.',
    },
    X: {
      id: 'Deadlock_X',
      name: 'Annihilation',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'debuff',
      description: 'Equip a Nanowire accelerator that captures the first enemy contacted and cocoons them.',
    },
  },
};

const VYSE: AgentAbilities = {
  agentId: 'Vyse',
  role: 'Sentinel',
  abilities: {
    C: {
      id: 'Vyse_C',
      name: 'Shear',
      slot: 'C',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'trap',
      aoeRadius: 5,
      description: 'Place a liquid metal trap that creates a damaging zone when triggered.',
    },
    Q: {
      id: 'Vyse_Q',
      name: 'Arc Rose',
      slot: 'Q',
      cost: 150,
      maxCharges: 1,
      isSignature: false,
      effectType: 'wall',
      durationMs: 5000,
      description: 'Deploy a device that creates a protective magnetic wall.',
    },
    E: {
      id: 'Vyse_E',
      name: 'Razorvine',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'wall',
      secondaryEffects: ['damage'],
      durationMs: 12000,
      description: 'Deploy a liquid metal wall that damages and slows enemies passing through.',
    },
    X: {
      id: 'Vyse_X',
      name: 'Steel Garden',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 7,
      effectType: 'suppress',
      aoeRadius: 25,
      durationMs: 5000,
      description: 'Create a large zone where enemies cannot use weapons or abilities.',
    },
  },
};

const VETO: AgentAbilities = {
  agentId: 'Veto',
  role: 'Sentinel',
  abilities: {
    C: {
      id: 'Veto_C',
      name: 'Crosscut',
      slot: 'C',
      cost: 200,
      maxCharges: 1,
      isSignature: false,
      effectType: 'stim',
      description: 'Place a vortex on the ground; while in range looking at it, reactivate to teleport.',
    },
    Q: {
      id: 'Veto_Q',
      name: 'Chokehold',
      slot: 'Q',
      cost: 200,
      maxCharges: 2,
      isSignature: false,
      effectType: 'slow',
      secondaryEffects: ['debuff'],
      aoeRadius: 5,
      durationMs: 6000,
      description: 'Throw a viscous fragment that deploys a trap: holds, deafens, and decays enemies.',
    },
    E: {
      id: 'Veto_E',
      name: 'Interceptor',
      slot: 'E',
      cost: 0,
      maxCharges: 1,
      isSignature: true,
      effectType: 'barrier',
      description: 'Place a device that destroys utility bouncing off players or destroyed by gunfire.',
    },
    X: {
      id: 'Veto_X',
      name: 'Evolution',
      slot: 'X',
      cost: 0,
      maxCharges: 1,
      isSignature: false,
      ultimateCost: 8,
      effectType: 'stim',
      durationMs: 45000,
      description: 'Instantly fully mutate: combat stim, regeneration, and immunity to debuffs and ability damage for the entire round.',
    },
  },
};

// ============================================
// AGENT ABILITIES MAP
// ============================================

/** Map of all agent abilities by agent ID */
export const AGENT_ABILITIES: Record<string, AgentAbilities> = {
  // Duelists
  Jett: JETT,
  Phoenix: PHOENIX,
  Reyna: REYNA,
  Raze: RAZE,
  Yoru: YORU,
  Neon: NEON,
  Iso: ISO,
  Waylay: WAYLAY,
  // Initiators
  Sova: SOVA,
  Breach: BREACH,
  Skye: SKYE,
  'KAY/O': KAYO,
  Fade: FADE,
  Gekko: GEKKO,
  Tejo: TEJO,
  // Controllers
  Brimstone: BRIMSTONE,
  Omen: OMEN,
  Viper: VIPER,
  Astra: ASTRA,
  Harbor: HARBOR,
  Clove: CLOVE,
  // Sentinels
  Sage: SAGE,
  Cypher: CYPHER,
  Killjoy: KILLJOY,
  Chamber: CHAMBER,
  Deadlock: DEADLOCK,
  Vyse: VYSE,
  Veto: VETO,
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all abilities for an agent
 */
export function getAgentAbilities(agentId: string): AgentAbilities | undefined {
  return AGENT_ABILITIES[agentId];
}

/**
 * Get a specific ability by agent and slot
 */
export function getAbility(agentId: string, slot: AbilitySlot): Ability | undefined {
  const agent = AGENT_ABILITIES[agentId];
  return agent?.abilities[slot];
}

/**
 * Get ability by ability ID (format: "AgentName_Slot")
 */
export function getAbilityById(abilityId: string): Ability | undefined {
  const [agentId, slot] = abilityId.split('_');
  if (!agentId || !slot) return undefined;
  return getAbility(agentId, slot as AbilitySlot);
}

/**
 * Get all purchasable abilities for an agent (C and Q slots)
 */
export function getPurchasableAbilities(agentId: string): Ability[] {
  const agent = AGENT_ABILITIES[agentId];
  if (!agent) return [];
  return [agent.abilities.C, agent.abilities.Q].filter((a) => a.cost > 0);
}

/**
 * Get the signature ability for an agent (E slot)
 */
export function getSignatureAbility(agentId: string): Ability | undefined {
  return getAbility(agentId, 'E');
}

/**
 * Get the ultimate ability for an agent (X slot)
 */
export function getUltimateAbility(agentId: string): Ability | undefined {
  return getAbility(agentId, 'X');
}

/**
 * Calculate total cost to buy all abilities for an agent
 */
export function getMaxAbilityCost(agentId: string): number {
  const agent = AGENT_ABILITIES[agentId];
  if (!agent) return 0;

  const { C, Q } = agent.abilities;
  return C.cost * C.maxCharges + Q.cost * Q.maxCharges;
}

/**
 * Get all agents by role
 */
export function getAgentsByRole(role: AgentRole): string[] {
  return Object.entries(AGENT_ABILITIES)
    .filter(([, agent]) => agent.role === role)
    .map(([agentId]) => agentId);
}

/**
 * Get all ability IDs for an agent
 */
export function getAgentAbilityIds(agentId: string): string[] {
  const agent = AGENT_ABILITIES[agentId];
  if (!agent) return [];
  return ['C', 'Q', 'E', 'X'].map((slot) => `${agentId}_${slot}`);
}

/**
 * Check if an ability deals damage
 */
export function isAbilityDamaging(abilityId: string): boolean {
  const ability = getAbilityById(abilityId);
  if (!ability) return false;
  return (
    ability.effectType === 'damage' ||
    ability.effectType === 'molly' ||
    ability.secondaryEffects?.includes('damage') === true
  );
}

/**
 * Get all damaging abilities for an agent
 */
export function getDamagingAbilities(agentId: string): Ability[] {
  const agent = AGENT_ABILITIES[agentId];
  if (!agent) return [];
  return Object.values(agent.abilities).filter(
    (a) => a.effectType === 'damage' || a.effectType === 'molly' || a.secondaryEffects?.includes('damage')
  );
}
