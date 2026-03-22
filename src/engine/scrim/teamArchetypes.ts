// teamArchetypes - Team play style archetypes and regional map tendencies
// Used during map pool initialization to create asymmetric starting strengths

import type { Region, MapStrengthAttributes } from '../../types';

export type TeamArchetype = 'aggressive' | 'defensive' | 'tactical' | 'utility' | 'balanced';

/**
 * Per-attribute weight multipliers for each archetype.
 * Applied to the base attribute range during map pool generation.
 */
export const ARCHETYPE_WEIGHTS: Record<TeamArchetype, MapStrengthAttributes> = {
  aggressive: {
    executes: 1.35,
    mapControl: 1.25,
    retakes: 0.75,
    communication: 0.85,
    utility: 0.85,
    antiStrat: 0.70,
  },
  defensive: {
    retakes: 1.35,
    communication: 1.20,
    executes: 0.75,
    mapControl: 0.80,
    utility: 1.05,
    antiStrat: 1.05,
  },
  tactical: {
    antiStrat: 1.40,
    communication: 1.20,
    executes: 1.00,
    retakes: 1.00,
    mapControl: 0.90,
    utility: 1.10,
  },
  utility: {
    utility: 1.35,
    antiStrat: 1.20,
    communication: 1.10,
    executes: 0.85,
    retakes: 0.85,
    mapControl: 0.85,
  },
  balanced: {
    executes: 1.00,
    retakes: 1.00,
    utility: 1.00,
    communication: 1.00,
    mapControl: 1.00,
    antiStrat: 1.00,
  },
};

/**
 * Maps each region tends to be strong or weak on.
 * Used to give 1-2 signature strong maps and 1-2 weak maps per team.
 */
export const REGION_MAP_TENDENCIES: Record<Region, { strong: string[]; weak: string[] }> = {
  Americas: {
    strong: ['Fracture', 'Icebox', 'Breeze', 'Abyss'],
    weak: ['Bind', 'Lotus', 'Split'],
  },
  EMEA: {
    strong: ['Bind', 'Ascent', 'Haven', 'Pearl'],
    weak: ['Breeze', 'Fracture', 'Corrode'],
  },
  Pacific: {
    strong: ['Split', 'Lotus', 'Sunset', 'Haven'],
    weak: ['Icebox', 'Abyss', 'Fracture'],
  },
  China: {
    strong: ['Ascent', 'Bind', 'Haven', 'Corrode'],
    weak: ['Fracture', 'Abyss', 'Breeze'],
  },
};

/**
 * Which archetypes are most likely for each region (weighted random).
 * Index maps to archetypes: aggressive, defensive, tactical, utility, balanced
 */
const REGION_ARCHETYPE_WEIGHTS: Record<Region, number[]> = {
  Americas: [0.35, 0.10, 0.15, 0.15, 0.25], // More aggressive
  EMEA:     [0.10, 0.20, 0.35, 0.20, 0.15], // More tactical
  Pacific:  [0.15, 0.35, 0.20, 0.15, 0.15], // More defensive
  China:    [0.15, 0.25, 0.25, 0.20, 0.15], // Tactical/defensive mix
};

const ARCHETYPES: TeamArchetype[] = ['aggressive', 'defensive', 'tactical', 'utility', 'balanced'];

/**
 * Pick a random archetype weighted toward the region's play style.
 */
export function pickArchetypeForRegion(region: Region): TeamArchetype {
  const weights = REGION_ARCHETYPE_WEIGHTS[region];
  const roll = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) return ARCHETYPES[i];
  }
  return 'balanced';
}

/**
 * Pick a fully random archetype (no regional bias).
 */
export function pickRandomArchetype(): TeamArchetype {
  return ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
}
