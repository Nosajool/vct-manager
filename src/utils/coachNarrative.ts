// Coach Narrative Utility
//
// Generates coach-voice hints from current team state.
// Each condition maps to a variant pool; selection is deterministic per week
// so text stays stable within a week but rotates over time.

import type { Team } from '../types/team';
import type { Player } from '../types/player';
import type { ActiveView } from '../store/slices/uiSlice';

export interface CoachHint {
  text: string;
  severity: 'warning' | 'positive' | 'neutral';
  playerName?: string;
  action?: {
    label: string;
    navigateTo: ActiveView;
    teamTab?: string;
  };
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
  isMatchDay?: boolean,
): CoachHint[] {
  const actionHints: CoachHint[] = [];
  const narrativeHints: CoachHint[] = [];
  const seed = getWeekSeed(team.id, currentDate);
  const chemistry = team.chemistry.overall;
  const streak = team.standings.currentStreak;

  // Check players on team roster only
  const rosterPlayers = players.filter(p => team.playerIds.includes(p.id));

  // --- Actionable alert hints (shown first) ---

  // Roster incomplete
  if (team.playerIds.length < 5) {
    actionHints.push({
      text: `Only ${team.playerIds.length}/5 active players on the roster.`,
      severity: 'warning',
      action: { label: 'Sign Players', navigateTo: 'team', teamTab: 'free-agents' },
    });
  }

  // Contract expiring within 30 days
  const currentDateObj = new Date(currentDate);
  const thirtyDaysFromNow = new Date(currentDateObj);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringPlayers = rosterPlayers
    .filter(p => {
      if (!p.contract?.endDate) return false;
      const end = new Date(p.contract.endDate);
      return end <= thirtyDaysFromNow && end > currentDateObj;
    })
    .sort((a, b) => new Date(a.contract!.endDate).getTime() - new Date(b.contract!.endDate).getTime());
  if (expiringPlayers.length > 0) {
    const first = expiringPlayers[0];
    const daysUntil = Math.ceil((new Date(first.contract!.endDate).getTime() - currentDateObj.getTime()) / (1000 * 60 * 60 * 24));
    const others = expiringPlayers.length > 1 ? ` (+${expiringPlayers.length - 1} more)` : '';
    actionHints.push({
      text: `${first.name}'s contract expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}${others}.`,
      severity: 'warning',
      playerName: first.name,
      action: { label: 'View Roster', navigateTo: 'team', teamTab: 'roster' },
    });
  }

  // Low morale (< 40)
  const lowMoralePlayers = rosterPlayers.filter(p => p.morale < 40).sort((a, b) => a.morale - b.morale);
  if (lowMoralePlayers.length > 0) {
    const worst = lowMoralePlayers[0];
    actionHints.push({
      text: pick(POOLS.playerMoraleLow(worst.name), seed, 0),
      severity: 'warning',
      playerName: worst.name,
      action: { label: 'View Roster', navigateTo: 'team', teamTab: 'roster' },
    });
  }

  // Low form (< 40)
  const lowFormPlayers = rosterPlayers.filter(p => p.form < 40).sort((a, b) => a.form - b.form);
  if (lowFormPlayers.length > 0) {
    const worst = lowFormPlayers[0];
    actionHints.push({
      text: `${worst.name}'s form has dropped to ${worst.form}%. They need consistent play time.`,
      severity: 'warning',
      playerName: worst.name,
      action: { label: 'View Roster', navigateTo: 'team', teamTab: 'roster' },
    });
  }

  // Map practice low (not on match days)
  if (!isMatchDay && team.mapPool?.maps) {
    const maps = Object.entries(team.mapPool.maps);
    const lowMaps = maps.filter(([, strength]) => {
      const avg = Object.values(strength.attributes).reduce((a, b) => a + b, 0) / 6;
      return avg < 50;
    });
    if (lowMaps.length > 0) {
      const [lowestMapName, lowestMap] = lowMaps.reduce((prev, curr) => {
        const prevAvg = Object.values(prev[1].attributes).reduce((a, b) => a + b, 0) / 6;
        const currAvg = Object.values(curr[1].attributes).reduce((a, b) => a + b, 0) / 6;
        return prevAvg < currAvg ? prev : curr;
      });
      const avgStrength = Math.round(Object.values(lowestMap.attributes).reduce((a, b) => a + b, 0) / 6);
      actionHints.push({
        text: `${lowestMapName} practice is lagging at ${avgStrength}% strength.`,
        severity: 'warning',
      });
    }
  }

  // Low balance (< 2 months runway)
  const monthlyExpenses =
    team.finances.monthlyExpenses.playerSalaries +
    team.finances.monthlyExpenses.coachSalaries +
    team.finances.monthlyExpenses.facilities +
    team.finances.monthlyExpenses.travel;
  if (monthlyExpenses > 0 && team.finances.balance < monthlyExpenses * 2) {
    const monthsRunway = team.finances.balance > 0 ? (team.finances.balance / monthlyExpenses).toFixed(1) : '0';
    actionHints.push({
      text: `Only ${monthsRunway} months of runway left. Finances need attention.`,
      severity: 'warning',
      action: { label: 'View Finances', navigateTo: 'finances' },
    });
  }

  // --- Narrative hints (morale > 40 but < 45 gets the narrative version without action) ---

  // Player morale narrative (45–40 range already caught above; this covers 40–45 without action)
  const narrativeMoralePlayers = rosterPlayers
    .filter(p => p.morale >= 40 && p.morale < 45)
    .sort((a, b) => a.morale - b.morale);
  narrativeMoralePlayers.forEach((player, i) => {
    narrativeHints.push({
      text: pick(POOLS.playerMoraleLow(player.name), seed, i),
      severity: 'warning',
      playerName: player.name,
    });
  });

  // 2. Chemistry low (< 55)
  if (chemistry < 55) {
    narrativeHints.push({
      text: pick(POOLS.chemistryLow(), seed, 1),
      severity: 'warning',
    });
  }

  // 3. Loss streak (2+)
  if (streak <= -2) {
    narrativeHints.push({
      text: pick(POOLS.lossStreak(), seed, 2),
      severity: 'warning',
    });
  }

  // 4. Hype pressure (> 70)
  if (team.reputation.hypeLevel > 70) {
    narrativeHints.push({
      text: pick(POOLS.hypeHigh(), seed, 3),
      severity: 'neutral',
    });
  }

  // 5. Rivalry match upcoming
  if (upcomingOpponentName && rivalryIntensity && rivalryIntensity > 40) {
    narrativeHints.push({
      text: pick(POOLS.rivalryUpcoming(upcomingOpponentName), seed, 4),
      severity: 'neutral',
    });
  }

  // 6. Win streak (2+)
  if (streak >= 2) {
    narrativeHints.push({
      text: pick(POOLS.winStreak(), seed, 5),
      severity: 'positive',
    });
  }

  // 7. Chemistry high (> 80) — positive
  if (chemistry > 80) {
    narrativeHints.push({
      text: pick(POOLS.chemistryHigh(), seed, 6),
      severity: 'positive',
    });
  }

  // Actionable hints first, then narrative flavor
  return [...actionHints, ...narrativeHints];
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
