// Coach Narrative Utility
//
// Generates coach-voice hints from current team state.
// Each condition maps to a variant pool; selection is deterministic per week
// so text stays stable within a week but rotates over time.

import type { Team } from '../types/team';
import type { Player } from '../types/player';
export interface CoachHint {
  text: string;
  severity: 'warning' | 'positive' | 'neutral';
  playerName?: string;
}

// --- Variant pools ---

const POOLS = {
  playerMoraleLow: (playerName: string): string[] => [
    `${playerName} is running on empty. Another rough match could push them over the edge.`,
    `${playerName} isn't in a good headspace right now. They need a win — or a break.`,
    `Something's off with ${playerName}. You might want to check in before the next match.`,
    `${playerName} has been struggling. The team feeds off their energy, and right now that well is dry.`,
  ],

  chemistryLow: (): string[] => [
    "There's tension in the server right now. The team isn't talking like they used to.",
    "Something's fractured between the players. It shows up in the late rounds.",
    "The squad isn't vibing. Plays that should be automatic are falling apart.",
    "Team dynamics are off. It's the kind of thing that gets worse without intervention.",
  ],

  chemistryHigh: (): string[] => [
    "The squad is locked in. Communication is clean and everyone's buying in.",
    "Good energy right now. The team is playing for each other.",
    "These five have figured something out. The synergy shows in how they play.",
    "The team chemistry is as strong as it's been. Don't let it slip.",
  ],

  rivalryUpcoming: (opponentName: string): string[] => [
    `You're playing ${opponentName} — and they haven't forgotten last time. Expect them to come in hungry.`,
    `${opponentName} is on the schedule. This one has history behind it.`,
    `The rivalry with ${opponentName} is real. Emotional matches like this can go either way.`,
    `${opponentName} will be motivated. Make sure your team is just as locked in.`,
  ],

  hypeHigh: (): string[] => [
    "All eyes are on you this week. That spotlight cuts both ways — your clutch players will thrive, but the nervous ones might crack.",
    "The buzz around this team is loud. Make sure the players are channeling it, not drowning in it.",
    "There's a lot of expectation on this squad right now. Stay grounded.",
    "You're in the spotlight. The team that handles pressure better usually wins.",
  ],

  winStreak: (): string[] => [
    "You're on a roll. The team is confident and playing loose.",
    "Back-to-back wins. The team is starting to believe in themselves.",
    "Momentum is real. Keep the pressure on.",
    "The team has found their rhythm. Protect it.",
  ],

  lossStreak: (): string[] => [
    "The team has taken some hits lately. Morale is fragile — this next match matters more than the scoreboard.",
    "Two losses in a row is a pattern. The team needs something to hold onto.",
    "Confidence is low after the recent run. One win can change the whole energy.",
    "The losing is starting to weigh on them. You can feel it.",
  ],
};

// --- Week-stable hash ---

function getWeekSeed(teamId: string, isoDate: string): number {
  const d = new Date(isoDate);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.floor(dayOfYear / 7);
  const key = `${teamId}_w${d.getFullYear()}_${weekNum}`;
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash + key.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

function pick<T>(pool: T[], seed: number, offset = 0): T {
  return pool[Math.abs(seed + offset) % pool.length];
}

// --- Main generator ---

export function generateCoachHints(
  team: Team,
  players: Player[],
  currentDate: string,
  upcomingOpponentName?: string | null,
  rivalryIntensity?: number | null,
): CoachHint[] {
  const hints: CoachHint[] = [];
  const seed = getWeekSeed(team.id, currentDate);
  const chemistry = team.chemistry.overall;
  const streak = team.standings.currentStreak;

  // Check players on team roster only
  const rosterPlayers = players.filter(p => team.playerIds.includes(p.id));

  // 1. Player morale critical (< 45)
  const criticalPlayers = rosterPlayers
    .filter(p => p.morale < 45)
    .sort((a, b) => a.morale - b.morale);

  criticalPlayers.forEach((player, i) => {
    hints.push({
      text: pick(POOLS.playerMoraleLow(player.name), seed, i),
      severity: 'warning',
      playerName: player.name,
    });
  });

  // 2. Chemistry low (< 55)
  if (chemistry < 55) {
    hints.push({
      text: pick(POOLS.chemistryLow(), seed, 1),
      severity: 'warning',
    });
  }

  // 3. Loss streak (2+)
  if (streak <= -2) {
    hints.push({
      text: pick(POOLS.lossStreak(), seed, 2),
      severity: 'warning',
    });
  }

  // 4. Hype pressure (> 70)
  if (team.reputation.hypeLevel > 70) {
    hints.push({
      text: pick(POOLS.hypeHigh(), seed, 3),
      severity: 'neutral',
    });
  }

  // 5. Rivalry match upcoming
  if (upcomingOpponentName && rivalryIntensity && rivalryIntensity > 40) {
    hints.push({
      text: pick(POOLS.rivalryUpcoming(upcomingOpponentName), seed, 4),
      severity: 'neutral',
    });
  }

  // 6. Win streak (2+)
  if (streak >= 2) {
    hints.push({
      text: pick(POOLS.winStreak(), seed, 5),
      severity: 'positive',
    });
  }

  // 7. Chemistry high (> 80) — positive
  if (chemistry > 80) {
    hints.push({
      text: pick(POOLS.chemistryHigh(), seed, 6),
      severity: 'positive',
    });
  }

  return hints;
}

// --- Trigger condition (for deciding whether to show the briefing modal) ---

export function shouldShowCoachBriefing(
  team: Team,
  players: Player[],
  rivalryIntensity?: number | null,
): boolean {
  const rosterPlayers = players.filter(p => team.playerIds.includes(p.id));
  const streak = team.standings.currentStreak;

  return (
    rosterPlayers.some(p => p.morale < 45) ||
    team.chemistry.overall < 55 ||
    team.reputation.hypeLevel > 70 ||
    (rivalryIntensity != null && rivalryIntensity > 40) ||
    streak <= -2 ||
    streak >= 2
  );
}
