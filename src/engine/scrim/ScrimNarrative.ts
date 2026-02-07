// ScrimNarrative - Pure function generating narrative sentences for scrim results
// Provides context-aware, template-based narratives with variety to avoid repetition

import type { ScrimResult } from '../../types/scrim';

/**
 * Generate 1-3 narrative sentences describing a scrim session result
 *
 * Algorithm:
 * 1. Identify match outcome and map performance
 * 2. Check chemistry/relationship changes (if significant)
 * 3. Add partner-specific commentary based on tier and intensity
 *
 * @param result - The scrim result data
 * @returns Array of 1-3 narrative sentences
 */
export function generateScrimNarrative(result: ScrimResult): string[] {
  const narratives: string[] = [];

  // 1. Map performance narrative (if notable)
  const mapNarrative = getMapPerformanceNarrative(result);
  if (mapNarrative) {
    narratives.push(mapNarrative);
  }

  // 2. Chemistry/relationship change narrative (if significant)
  const relationshipNarrative = getRelationshipNarrative(result);
  if (relationshipNarrative) {
    narratives.push(relationshipNarrative);
  }

  // 3. Partner/intensity narrative (always include if we have room)
  if (narratives.length < 3) {
    const partnerNarrative = getPartnerNarrative(result);
    if (partnerNarrative) {
      narratives.push(partnerNarrative);
    }
  }

  // Ensure we always have at least one narrative
  if (narratives.length === 0) {
    narratives.push(getFallbackNarrative(result));
  }

  return narratives;
}

/**
 * Generate narrative for map performance and improvements
 * Focuses on the most improved attribute or best performed map
 */
function getMapPerformanceNarrative(result: ScrimResult): string | null {
  // Find the map with highest improvements
  let bestMap: string | null = null;
  let maxImprovement = 0;
  let bestAttribute: string | null = null;

  for (const [mapName, improvements] of Object.entries(result.mapImprovements)) {
    for (const [attr, value] of Object.entries(improvements)) {
      if (value && value > maxImprovement) {
        maxImprovement = value;
        bestMap = mapName;
        bestAttribute = attr;
      }
    }
  }

  // Only generate narrative for significant improvements (>= 2 points)
  if (!bestMap || !bestAttribute || maxImprovement < 2) {
    // Check if we won convincingly instead
    if (result.maps.length > 0) {
      const mapResults = result.maps;
      const playerWins = mapResults.filter(m => m.winner === result.playerTeamId).length;

      if (playerWins === mapResults.length) {
        const templates = [
          `The team looked organized on ${mapResults[0].map}.`,
          `Clean execution across all maps today.`,
          `Strong showing on every map in the series.`,
          `Dominant performance throughout the scrim.`,
        ];
        return pickRandom(templates);
      }
    }
    return null;
  }

  const attrTemplates = getAttributeTemplates(bestAttribute, bestMap);
  const template = pickRandom(attrTemplates);

  return template
    .replace('{map}', bestMap)
    .replace('{value}', `+${Math.round(maxImprovement)}`);
}

/**
 * Generate narrative for chemistry and relationship changes
 */
function getRelationshipNarrative(result: ScrimResult): string | null {
  const chemistryChange = result.chemistryChange;
  const relationshipChange = result.relationshipChange;

  // Prioritize chemistry if it's significant
  if (Math.abs(chemistryChange) >= 3) {
    let templates: string[];

    if (chemistryChange > 0) {
      // Positive chemistry
      templates = [
        'Chemistry improved after competitive practice.',
        'The team is finding their rhythm together.',
        'Great synergy building between players.',
        'Team coordination is getting sharper.',
        'Players are reading each other better.',
      ];
    } else {
      // Negative chemistry
      templates = [
        'Some friction showed during intense moments.',
        'Team communication broke down in key rounds.',
        'Players struggled to stay on the same page.',
        'Coordination issues need addressing.',
        'Frustration bubbled up during close rounds.',
      ];
    }

    return pickRandom(templates);
  }

  // Check relationship changes if chemistry wasn't significant
  if (Math.abs(relationshipChange) >= 5) {
    let templates: string[];

    if (relationshipChange > 0) {
      templates = [
        `${result.partnerTeamName} was a great scrim partner today.`,
        `Positive experience working with ${result.partnerTeamName}.`,
        `${result.partnerTeamName} brought good energy to practice.`,
        `Professional and productive session with ${result.partnerTeamName}.`,
      ];
    } else {
      templates = [
        `Concerns about practicing with ${result.partnerTeamName}.`,
        `${result.partnerTeamName} wasn't taking it seriously.`,
        `Disappointing professionalism from ${result.partnerTeamName}.`,
        `May need to find different scrim partners.`,
      ];
    }

    return pickRandom(templates);
  }

  return null;
}

/**
 * Generate narrative based on partner tier and match intensity
 */
function getPartnerNarrative(result: ScrimResult): string | null {
  const tier = result.partnerTier;
  const won = result.overallWinner === result.playerTeamId;
  const partner = result.partnerTeamName;

  let templates: string[];

  if (tier === 'T1') {
    // T1 scrims - high quality practice
    if (won) {
      templates = [
        `${partner} pushed the team hard today.`,
        `Competing against ${partner} revealed weaknesses to fix.`,
        `Strong performance against top-tier competition.`,
        `Valuable experience testing strategies against ${partner}.`,
        `The team held their own against ${partner}.`,
      ];
    } else {
      templates = [
        `${partner} exposed gaps in team coordination.`,
        `Tough loss but learned a lot from ${partner}.`,
        `${partner} punished every mistake ruthlessly.`,
        `Valuable lessons learned against elite competition.`,
        `${partner} showed what championship-level play looks like.`,
      ];
    }
  } else if (tier === 'T2') {
    // T2 scrims - solid practice
    if (won) {
      templates = [
        `Solid practice against ${partner}.`,
        `${partner} provided competitive resistance.`,
        `Good execution against tier 2 competition.`,
        `Productive session working with ${partner}.`,
        `Team strategies held up well against ${partner}.`,
      ];
    } else {
      templates = [
        `${partner} came prepared with counter-strategies.`,
        `Unexpected challenge from ${partner} today.`,
        `${partner} found weaknesses to address.`,
        `Need to tighten up after that performance.`,
        `${partner} capitalized on sloppy play.`,
      ];
    }
  } else {
    // T3 scrims - limited value
    if (won) {
      templates = [
        `Dominant showing, but limited growth against ${partner}.`,
        `Easy practice match against ${partner}.`,
        `Team needs tougher competition than ${partner}.`,
        `Routine win against developing team ${partner}.`,
        `Not enough challenge from ${partner} today.`,
      ];
    } else {
      templates = [
        `Concerning loss to ${partner}.`,
        `Team looked unfocused against ${partner}.`,
        `Should not be losing to ${partner}.`,
        `Wake-up call needed after losing to ${partner}.`,
        `Unacceptable performance against ${partner}.`,
      ];
    }
  }

  return pickRandom(templates);
}

/**
 * Get attribute-specific templates for map improvements
 */
function getAttributeTemplates(attribute: string, mapName: string): string[] {
  const templates: Record<string, string[]> = {
    executes: [
      `Site takes on ${mapName} looked much cleaner ({value}).`,
      `Execute timing improved significantly on ${mapName} ({value}).`,
      `Team hit their defaults perfectly on ${mapName} ({value}).`,
      `Crisp site takes on ${mapName} today ({value}).`,
    ],

    retakes: [
      `Retake coordination on ${mapName} was excellent ({value}).`,
      `Strong defensive recovery on ${mapName} ({value}).`,
      `Retakes on ${mapName} looked much sharper ({value}).`,
      `Post-plant defense on ${mapName} improved greatly ({value}).`,
    ],

    utility: [
      `Utility usage on ${mapName} was on point ({value}).`,
      `Lineups on ${mapName} are getting dialed in ({value}).`,
      `Smoke and flash timing improved on ${mapName} ({value}).`,
      `Better util coordination on ${mapName} today ({value}).`,
    ],

    communication: [
      `Callouts on ${mapName} were much clearer ({value}).`,
      `Team comms looked organized on ${mapName} ({value}).`,
      `Information sharing improved on ${mapName} ({value}).`,
      `Macro calls on ${mapName} were decisive ({value}).`,
    ],

    mapControl: [
      `Map control on ${mapName} was dominant ({value}).`,
      `Better mid reads on ${mapName} today ({value}).`,
      `Lurk timing on ${mapName} created space ({value}).`,
      `Map control fundamentals improved on ${mapName} ({value}).`,
    ],

    antiStrat: [
      `Counter-stratting on ${mapName} was effective ({value}).`,
      `Team adapted well to opponent setups on ${mapName} ({value}).`,
      `Read opponent tendencies perfectly on ${mapName} ({value}).`,
      `Anti-strat preparation paid off on ${mapName} ({value}).`,
    ],
  };

  return templates[attribute] || [
    `Improved ${attribute} on {map} ({value}).`,
  ];
}

/**
 * Fallback narrative when nothing significant happened
 */
function getFallbackNarrative(result: ScrimResult): string {
  const templates = [
    `Completed scrim practice against ${result.partnerTeamName}.`,
    `Standard practice session with ${result.partnerTeamName}.`,
    `Team got in some reps against ${result.partnerTeamName}.`,
    `Routine scrim block completed.`,
  ];

  return pickRandom(templates);
}

/**
 * Pick a random item from an array
 * Uses Math.random() with current timestamp as seed for variety
 */
function pickRandom<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}
