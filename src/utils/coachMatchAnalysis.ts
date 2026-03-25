// Coach Match Analysis Utility
//
// Generates a 1-2 sentence coach-voice attribution of a match result.
// Picks the 1-2 most relevant factors from team state at match time.

// --- Variant pools ---

type AnalysisPool = string[];

const WIN_CHEMISTRY_HIGH: AnalysisPool = [
  "The team was locked in tonight. Clean chemistry carried you through the tight moments — everyone was on the same page when it mattered.",
  "Everyone was on the same page when it counted. That's what good chemistry looks like.",
  "No wasted rounds, no confusion — the team played as one unit.",
  "The trust in the server was obvious. Wins like this are built in the off days.",
];

const WIN_RIVALRY: AnalysisPool = [
  "That win hit different. Beating them with this much on the line is the kind of result that builds identity.",
  "Rivalry wins do something to a team's confidence that regular wins can't. The squad knows what they're capable of.",
  "A win that meant something beyond the bracket. The team will carry this one for a while.",
  "High-stakes and they delivered. That's character.",
];

const WIN_LOW_MORALE: AnalysisPool = [
  "A much-needed W. The team was running on fumes going in, but they found something in the clutch. Use this to rebuild.",
  "They weren't in the best headspace going in, but they grinded it out anyway. This win matters.",
  "The team was struggling mentally, and they still got the result. That's resilience.",
  "Not their best week emotionally, but they found a way. Let that build some confidence back up.",
];

const WIN_CLUTCH: AnalysisPool = [
  "It wasn't clean, but they got the job done. Sometimes grinding out a win is more valuable than a dominant one.",
  "Close one. The team held their nerve when it mattered — that's a skill you can't practice.",
  "Scraped it out. Not every win needs to be pretty.",
  "Tight game, right result. The team showed composure under pressure.",
];

const WIN_DOMINANT: AnalysisPool = [
  "Dominant performance. The team looked sharp and in control throughout — carry this energy forward.",
  "Not much to say — the team was just better today. Enjoy it.",
  "Clean result. The preparation is showing.",
  "Statement win. The team outclassed the opposition from start to finish.",
];

const LOSS_MORALE: AnalysisPool = [
  "Low morale dragged performance down. Two or three players were running on fumes, and it showed in the late rounds when composure mattered most.",
  "The team went in carrying too much. Hard to compete when the tank is empty.",
  "Mentally, the team wasn't there. Morale issues don't stay in the practice room.",
  "They needed this win, and not getting it will sting. Address the morale before the next one.",
];

const LOSS_CHEMISTRY: AnalysisPool = [
  "The team wasn't communicating. Plays that should have been automatic fell apart — chemistry issues don't stay in the server.",
  "Something's fractured right now, and it cost them. A roster that doesn't trust each other can't close out games.",
  "The disconnection between players was visible. Chemistry problems get exposed under pressure.",
  "Individual skill wasn't the issue — it was the team falling apart at the seams.",
];

const LOSS_HYPE: AnalysisPool = [
  "The spotlight got heavy. The expectations this week created pressure the team couldn't absorb, and it cost you in the moments that mattered.",
  "Too much pressure, not enough composure. High-profile matches demand mental fortitude the team didn't have today.",
  "The team was nervous. You could see it. That kind of pressure needs to be managed better.",
  "Playing with expectation is hard. The team let it get to them this time.",
];

const LOSS_CLOSE: AnalysisPool = [
  "You were right there. This one stings because it was winnable — but close games like this build something if you channel it right.",
  "A loss by the narrowest of margins. Don't let the squad dwell too long — they were in it until the end.",
  "Heartbreaker. The difference was tiny. Make sure the team sees it as proof they're close, not proof they can't win.",
  "They gave everything and it wasn't enough today. That's the game sometimes. Stay the course.",
];

const LOSS_STANDARD: AnalysisPool = [
  "Not their day. Sometimes the opponent is just better prepared — figure out why and fix it.",
  "A result to learn from. The team needs to regroup and look honestly at what went wrong.",
  "Outplayed. The team needs to look at this honestly and come back sharper.",
  "A defeat that needs to be understood, not just accepted. Find the patterns.",
];

// --- Simple hash for variant selection ---

function simpleHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

function pick(pool: string[], seed: number): string {
  return pool[Math.abs(seed) % pool.length];
}

export interface CoachMatchAnalysisInput {
  won: boolean;
  /** Total map wins minus map losses (positive = dominant win, negative = dominant loss) */
  mapDiff: number;
  chemistry: number;       // 0-100
  avgMorale: number;       // 0-100 average across roster
  hypeLevel: number;       // 0-100
  rivalryIntensity: number; // 0-100 (0 = no rivalry)
  /** Unique seed string (e.g. matchId) for variant selection */
  matchId: string;
}

export function generateCoachMatchAnalysis(input: CoachMatchAnalysisInput): string {
  const { won, mapDiff, chemistry, avgMorale, hypeLevel, rivalryIntensity, matchId } = input;
  const seed = simpleHash(matchId);

  if (won) {
    // Pick most relevant win narrative
    if (rivalryIntensity > 50) {
      return pick(WIN_RIVALRY, seed);
    }
    if (avgMorale < 50) {
      return pick(WIN_LOW_MORALE, seed);
    }
    if (chemistry > 75) {
      return pick(WIN_CHEMISTRY_HIGH, seed);
    }
    if (Math.abs(mapDiff) <= 1) {
      return pick(WIN_CLUTCH, seed);
    }
    return pick(WIN_DOMINANT, seed);
  } else {
    // Pick most relevant loss narrative
    if (avgMorale < 50) {
      return pick(LOSS_MORALE, seed);
    }
    if (chemistry < 55) {
      return pick(LOSS_CHEMISTRY, seed);
    }
    if (hypeLevel > 70) {
      return pick(LOSS_HYPE, seed);
    }
    if (Math.abs(mapDiff) <= 1) {
      return pick(LOSS_CLOSE, seed);
    }
    return pick(LOSS_STANDARD, seed);
  }
}
