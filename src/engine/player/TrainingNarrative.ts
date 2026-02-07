// TrainingNarrative - Pure function generating narrative sentences for training results
// Provides context-aware, template-based narratives with variety to avoid repetition

import type { Player, TrainingResult } from '../../types';

/**
 * Generate 1-3 narrative sentences describing a training session result
 *
 * Algorithm:
 * 1. Identify most improved stat (if any significant improvement)
 * 2. Check morale impact (if significant change)
 * 3. Add general effectiveness comment based on training quality
 *
 * @param player - The player who trained
 * @param result - The training result data
 * @returns Array of 1-3 narrative sentences
 */
export function generateTrainingNarrative(
  player: Player,
  result: TrainingResult
): string[] {
  const narratives: string[] = [];

  // 1. Stat improvement narrative (if significant)
  const statNarrative = getStatImprovementNarrative(player.name, result);
  if (statNarrative) {
    narratives.push(statNarrative);
  }

  // 2. Morale change narrative (if significant)
  const moraleNarrative = getMoraleNarrative(player.name, result);
  if (moraleNarrative) {
    narratives.push(moraleNarrative);
  }

  // 3. General effectiveness narrative (always include if we have room)
  if (narratives.length < 3) {
    const effectivenessNarrative = getEffectivenessNarrative(player.name, result);
    if (effectivenessNarrative) {
      narratives.push(effectivenessNarrative);
    }
  }

  // Ensure we always have at least one narrative
  if (narratives.length === 0) {
    narratives.push(getFallbackNarrative(player.name));
  }

  return narratives;
}

/**
 * Generate narrative for stat improvements
 * Focuses on the most improved stat
 */
function getStatImprovementNarrative(
  playerName: string,
  result: TrainingResult
): string | null {
  const improvements = result.statImprovements;

  // Find the stat with highest improvement
  let maxStat: string | null = null;
  let maxValue = 0;

  for (const [stat, value] of Object.entries(improvements)) {
    if (value > maxValue) {
      maxValue = value;
      maxStat = stat;
    }
  }

  // Only generate narrative for significant improvements (>= 1 point)
  if (!maxStat || maxValue < 1) {
    return null;
  }

  const statTemplates = getStatTemplates(maxStat);
  const template = pickRandom(statTemplates);

  return template
    .replace('{name}', playerName)
    .replace('{value}', maxValue >= 2 ? `+${Math.round(maxValue)}` : '+1');
}

/**
 * Generate narrative for morale changes
 */
function getMoraleNarrative(
  playerName: string,
  result: TrainingResult
): string | null {
  const moraleChange = result.moraleChange;

  // Only generate for significant morale changes (absolute value >= 3)
  if (Math.abs(moraleChange) < 3) {
    return null;
  }

  let templates: string[];

  if (moraleChange > 0) {
    // Positive morale
    templates = [
      `{name} seems energized by today's session.`,
      `{name} is feeling confident after the workout.`,
      `{name} left practice with a smile today.`,
      `Good vibes from {name} during training.`,
      `{name} is motivated and ready to improve.`,
    ];
  } else {
    // Negative morale
    templates = [
      `{name} looks frustrated after the intense session.`,
      `{name} seemed burned out by the end of training.`,
      `{name} is showing signs of training fatigue.`,
      `{name} appeared drained after today's workout.`,
      `{name} struggled to stay motivated during drills.`,
    ];
  }

  const template = pickRandom(templates);
  return template.replace('{name}', playerName);
}

/**
 * Generate narrative based on training effectiveness
 */
function getEffectivenessNarrative(
  playerName: string,
  result: TrainingResult
): string | null {
  const effectiveness = result.effectiveness;

  let templates: string[];

  if (effectiveness >= 75) {
    // Excellent training
    templates = [
      `{name} looked sharp during drills today.`,
      `Outstanding session from {name}.`,
      `{name} is really dialing in the fundamentals.`,
      `Coach is impressed with {name}'s focus.`,
      `{name} showed great improvement potential.`,
    ];
  } else if (effectiveness >= 50) {
    // Good training
    templates = [
      `{name} put in solid work today.`,
      `Productive session for {name}.`,
      `{name} is making steady progress.`,
      `{name} showed good effort in training.`,
      `Decent practice from {name} today.`,
    ];
  } else if (effectiveness >= 25) {
    // Mediocre training
    templates = [
      `{name} had an average session today.`,
      `{name} went through the motions in practice.`,
      `{name} seemed a bit off during drills.`,
      `Mixed results from {name} in training.`,
      `{name} had trouble finding rhythm today.`,
    ];
  } else {
    // Poor training
    templates = [
      `{name} struggled in today's session.`,
      `Rough training day for {name}.`,
      `{name} couldn't find consistency in drills.`,
      `{name} looked unfocused during practice.`,
      `{name} had difficulty executing today.`,
    ];
  }

  const template = pickRandom(templates);
  return template.replace('{name}', playerName);
}

/**
 * Get stat-specific templates
 */
function getStatTemplates(stat: string): string[] {
  const templates: Record<string, string[]> = {
    mechanics: [
      `{name}'s aim looked sharper today ({value} MEC).`,
      `{name} is tightening up their crosshair placement ({value} MEC).`,
      `Noticeable improvement in {name}'s gunplay ({value} MEC).`,
      `{name}'s spray control is getting more consistent ({value} MEC).`,
      `{name} landed more headshots in drills today ({value} MEC).`,
    ],

    igl: [
      `{name} is developing better strategic awareness ({value} IGL).`,
      `{name}'s callouts are getting clearer ({value} IGL).`,
      `{name} showed improved mid-round leadership ({value} IGL).`,
      `{name} is reading opponents better now ({value} IGL).`,
      `{name}'s game sense is evolving nicely ({value} IGL).`,
    ],

    mental: [
      `{name} stayed composed under pressure ({value} MEN).`,
      `{name} is building mental resilience ({value} MEN).`,
      `{name} showed better decision-making today ({value} MEN).`,
      `{name}'s mental game is strengthening ({value} MEN).`,
      `{name} kept focus through adversity ({value} MEN).`,
    ],

    clutch: [
      `{name} converted clutch scenarios in practice ({value} CLU).`,
      `{name}'s 1vX confidence is growing ({value} CLU).`,
      `{name} made smart plays in clutch drills ({value} CLU).`,
      `{name} is getting more comfortable in high-pressure situations ({value} CLU).`,
      `{name} executed clutch rounds with composure ({value} CLU).`,
    ],

    vibes: [
      `{name} brought great energy to practice ({value} VIB).`,
      `{name}'s positivity is lifting the team ({value} VIB).`,
      `{name} was hyping up teammates all session ({value} VIB).`,
      `Team synergy improved with {name}'s presence ({value} VIB).`,
      `{name} is becoming a locker room leader ({value} VIB).`,
    ],

    lurking: [
      `{name} is mastering off-angle timing ({value} LRK).`,
      `{name}'s lurk plays are getting more creative ({value} LRK).`,
      `{name} found advantageous positions in scrims ({value} LRK).`,
      `{name} is learning map control nuances ({value} LRK).`,
      `{name} executed smart flanks during drills ({value} LRK).`,
    ],

    entry: [
      `{name} dominated entry drills today ({value} ENT).`,
      `{name}'s first contact aggression is improving ({value} ENT).`,
      `{name} is winning more opening duels ({value} ENT).`,
      `{name} showed better site take execution ({value} ENT).`,
      `{name}'s entry timing is getting sharper ({value} ENT).`,
    ],

    support: [
      `{name}'s utility usage was on point ({value} SUP).`,
      `{name} is perfecting flash timing ({value} SUP).`,
      `{name} enabled great teamplay with util today ({value} SUP).`,
      `{name}'s support setups are becoming more effective ({value} SUP).`,
      `{name} traded efficiently in practice ({value} SUP).`,
    ],

    stamina: [
      `{name} maintained consistency throughout drills ({value} STA).`,
      `{name} showed better endurance today ({value} STA).`,
      `{name}'s late-round performance is improving ({value} STA).`,
      `{name} stayed focused through long scrims ({value} STA).`,
      `{name} is building better match conditioning ({value} STA).`,
    ],
  };

  return templates[stat] || [
    `{name} improved their {stat} skill ({value}).`,
  ];
}

/**
 * Fallback narrative when nothing significant happened
 */
function getFallbackNarrative(playerName: string): string {
  const templates = [
    `${playerName} completed training.`,
    `${playerName} put in work today.`,
    `${playerName} went through practice drills.`,
    `${playerName} attended the training session.`,
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
