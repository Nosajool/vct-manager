// Match Narrative Generator
// Produces headline, reason tags, and highlight bullets from raw MatchResult data

import type { MatchResult, PlayerMapPerformance } from '../types/match';
import { COMPOSITION_CONSTANTS } from '../engine/match/constants';
import type { AgentRole } from '../types';

export interface NarrativeTag {
  label: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface MatchNarrative {
  headline: string;
  tags: NarrativeTag[];
  highlights: string[];
  isWin: boolean;
}

type Side = 'teamA' | 'teamB';

function getAgentRole(agent: string): AgentRole | null {
  return (COMPOSITION_CONSTANTS.AGENT_ROLES as Record<string, AgentRole>)[agent] ?? null;
}

interface AggPerf {
  playerId: string;
  playerName: string;
  agent: string;
  kills: number;
  deaths: number;
  acs: number;
  acsSum: number;
  clutchesWon: number;
  clutchesAttempted: number;
  mapCount: number;
}

function aggregatePerfs(perfsPerMap: PlayerMapPerformance[][]): AggPerf[] {
  const map = new Map<string, AggPerf>();
  for (const perfs of perfsPerMap) {
    for (const p of perfs) {
      const existing = map.get(p.playerId);
      if (existing) {
        existing.kills += p.kills;
        existing.deaths += p.deaths;
        existing.acsSum += p.acs;
        existing.acs = existing.acsSum / (existing.mapCount + 1);
        existing.clutchesWon += p.clutchesWon ?? 0;
        existing.clutchesAttempted += p.clutchesAttempted ?? 0;
        existing.mapCount++;
      } else {
        map.set(p.playerId, {
          playerId: p.playerId,
          playerName: p.playerName,
          agent: p.agent,
          kills: p.kills,
          deaths: p.deaths,
          acs: p.acs,
          acsSum: p.acs,
          clutchesWon: p.clutchesWon ?? 0,
          clutchesAttempted: p.clutchesAttempted ?? 0,
          mapCount: 1,
        });
      }
    }
  }
  return Array.from(map.values());
}

function kdStr(kills: number, deaths: number): string {
  if (deaths === 0) return `${kills}-0`;
  return (kills / deaths).toFixed(1);
}

/**
 * Generate a narrative summary for a match.
 * @param result - The MatchResult from the simulation
 * @param playerSide - Which side is the player's team ('teamA' | 'teamB' | null for neutral)
 * @param playerRoles - Optional map of playerId → role label string for richer highlight text
 */
export function generateMatchNarrative(
  result: MatchResult,
  playerSide: Side | null,
  playerRoles?: Record<string, string>
): MatchNarrative {
  const side: Side = playerSide ?? 'teamA';
  const oppSide: Side = side === 'teamA' ? 'teamB' : 'teamA';

  const playerScore = side === 'teamA' ? result.scoreTeamA : result.scoreTeamB;
  const oppScore = side === 'teamA' ? result.scoreTeamB : result.scoreTeamA;
  const isWin = playerScore > oppScore;

  const maps = result.maps;
  if (maps.length === 0) {
    return { headline: 'MATCH COMPLETE', tags: [], highlights: [], isWin };
  }

  // Map margins: positive = player won that map
  const margins = maps.map(m => {
    const p = side === 'teamA' ? m.teamAScore : m.teamBScore;
    const o = side === 'teamA' ? m.teamBScore : m.teamAScore;
    return p - o;
  });

  const avgAbsMargin =
    margins.reduce((sum, m) => sum + Math.abs(m), 0) / maps.length;

  const anyOT = maps.some(m => m.overtime);

  // Reverse sweep: 2-1 win after losing map 1
  const isReverseSwept = isWin && maps.length >= 3 && margins[0] < 0;

  // Comeback: player was down 5+ rounds at half on a map they ended up winning
  let comebackMapIdx = -1;
  for (let i = 0; i < maps.length; i++) {
    if (margins[i] <= 0) continue;
    const enhanced = maps[i].enhancedRounds;
    if (!enhanced || enhanced.length < 12) continue;
    const half = enhanced[11];
    const pHalf = side === 'teamA' ? half.teamAScore : half.teamBScore;
    const oHalf = side === 'teamA' ? half.teamBScore : half.teamAScore;
    if (oHalf - pHalf >= 5) {
      comebackMapIdx = i;
      break;
    }
  }

  // Choked lead: player was up 9+ on a map they lost
  let chokedMapIdx = -1;
  let chokedMaxLead = 0;
  for (let i = 0; i < maps.length; i++) {
    if (margins[i] >= 0) continue;
    const enhanced = maps[i].enhancedRounds;
    if (!enhanced) continue;
    const maxLead = Math.max(
      ...enhanced.map(r => {
        const p = side === 'teamA' ? r.teamAScore : r.teamBScore;
        const o = side === 'teamA' ? r.teamBScore : r.teamAScore;
        return p - o;
      })
    );
    if (maxLead >= 9) {
      chokedMapIdx = i;
      chokedMaxLead = maxLead;
      break;
    }
  }
  const playerChoked = chokedMapIdx >= 0;

  // Aggregate player performances
  const playerPerfsPerMap = maps.map(m =>
    side === 'teamA' ? m.teamAPerformances : m.teamBPerformances
  );
  const oppPerfsPerMap = maps.map(m =>
    side === 'teamA' ? m.teamBPerformances : m.teamAPerformances
  );

  const playerAgg = aggregatePerfs(playerPerfsPerMap);
  const oppAgg = aggregatePerfs(oppPerfsPerMap);

  const bestPlayer = [...playerAgg].sort((a, b) => b.acs - a.acs)[0];
  const bestOppPlayer = [...oppAgg].sort((a, b) => b.acs - a.acs)[0];

  const totalPlayerClutchWon = playerAgg.reduce((s, p) => s + p.clutchesWon, 0);
  const totalPlayerClutchAttempted = playerAgg.reduce((s, p) => s + p.clutchesAttempted, 0);
  const totalOppClutchWon = oppAgg.reduce((s, p) => s + p.clutchesWon, 0);
  const totalOppClutchAttempted = oppAgg.reduce((s, p) => s + p.clutchesAttempted, 0);

  // Eco rounds
  let playerEcoWins = 0;
  let oppEcoWins = 0;
  for (const map of maps) {
    if (!map.enhancedRounds) continue;
    for (const round of map.enhancedRounds) {
      const playerEco = side === 'teamA' ? round.teamAEconomy : round.teamBEconomy;
      const oppEco = side === 'teamA' ? round.teamBEconomy : round.teamAEconomy;
      if (
        round.winner === side &&
        (playerEco.buyType === 'eco' || playerEco.buyType === 'force_buy')
      ) {
        playerEcoWins++;
      }
      if (
        round.winner === oppSide &&
        (oppEco.buyType === 'eco' || oppEco.buyType === 'force_buy')
      ) {
        oppEcoWins++;
      }
    }
  }

  // Opponent weak comp on maps they lost
  const oppHasWeakComp = maps.some((m, i) => {
    if (margins[i] <= 0) return false; // player didn't win this map
    const oppPerfs = side === 'teamA' ? m.teamBPerformances : m.teamAPerformances;
    const roles: Record<AgentRole, number> = {
      Duelist: 0,
      Controller: 0,
      Initiator: 0,
      Sentinel: 0,
    };
    for (const p of oppPerfs) {
      const role = getAgentRole(p.agent);
      if (role) roles[role]++;
    }
    return roles.Controller === 0 || roles.Duelist >= 3;
  });

  // ============================================
  // HEADLINE
  // ============================================
  let headline: string;
  if (isWin) {
    if (playerScore === 2 && oppScore === 0) {
      if (avgAbsMargin >= 8) headline = 'DOMINANT 2-0 SWEEP';
      else if (avgAbsMargin >= 5) headline = 'CLEAN SWEEP';
      else headline = 'NARROW SWEEP';
    } else {
      // 2-1
      if (anyOT) headline = 'OVERTIME THRILLER — VICTORY';
      else if (isReverseSwept) headline = 'REVERSE SWEEP';
      else if (comebackMapIdx >= 0) headline = 'COMEBACK VICTORY';
      else if (avgAbsMargin >= 7) headline = 'SERIES CONTROL';
      else if (avgAbsMargin <= 3) headline = 'BATTLE TO THE END';
      else headline = 'HARD-FOUGHT VICTORY';
    }
  } else {
    if (playerScore === 0 && oppScore === 2) {
      if (avgAbsMargin >= 8) headline = 'DEMOLISHED 0-2';
      else if (avgAbsMargin >= 5) headline = 'SWEPT OUT';
      else headline = 'AGONIZING 0-2';
    } else {
      // 1-2
      if (anyOT) headline = 'OVERTIME THRILLER — LOSS';
      else if (playerChoked) headline = 'HEARTBREAKING COLLAPSE';
      else if (maps.length >= 3 && margins[0] > 0) headline = "COULDN'T CLOSE IT";
      else if (avgAbsMargin <= 3) headline = 'FELL SHORT IN FIVE';
      else headline = 'SERIES LOSS';
    }
  }

  // ============================================
  // TAGS
  // ============================================
  const positiveTags: NarrativeTag[] = [];
  const negativeTags: NarrativeTag[] = [];
  const neutralTags: NarrativeTag[] = [];

  if (bestPlayer && bestPlayer.acs >= 260) {
    positiveTags.push({ label: 'STAR CARRY', type: 'positive' });
  }
  if (
    totalPlayerClutchAttempted >= 2 &&
    totalPlayerClutchWon / totalPlayerClutchAttempted >= 0.6
  ) {
    positiveTags.push({ label: 'CLUTCH KINGS', type: 'positive' });
  }
  if (playerEcoWins >= 2) {
    positiveTags.push({ label: 'ECO WARRIORS', type: 'positive' });
  }
  if (isWin && oppHasWeakComp) {
    positiveTags.push({ label: 'COMP DIFF', type: 'positive' });
  }

  if (anyOT) {
    neutralTags.push({ label: 'OVERTIME DRAMA', type: 'neutral' });
  }
  if (margins.every(m => Math.abs(m) <= 3)) {
    neutralTags.push({ label: 'EVEN CONTEST', type: 'neutral' });
  }

  if (playerChoked) {
    negativeTags.push({ label: 'CHOKED LEAD', type: 'negative' });
  }
  if (
    totalOppClutchAttempted >= 2 &&
    totalOppClutchWon / totalOppClutchAttempted >= 0.6
  ) {
    negativeTags.push({ label: 'CLUTCH DEFICIT', type: 'negative' });
  }
  if (oppEcoWins >= 2) {
    negativeTags.push({ label: 'ECO PUNISHED', type: 'negative' });
  }
  if (!isWin && bestOppPlayer && bestOppPlayer.acs >= 260) {
    negativeTags.push({ label: 'OUTDUELED', type: 'negative' });
  }

  const ordered = isWin
    ? [...positiveTags, ...neutralTags, ...negativeTags]
    : [...negativeTags, ...neutralTags, ...positiveTags];
  const tags = ordered.slice(0, 4);

  // ============================================
  // HIGHLIGHTS
  // ============================================
  const highlights: string[] = [];

  // 1. Best player
  if (bestPlayer) {
    const kd = kdStr(bestPlayer.kills, bestPlayer.deaths);
    const roleTag = playerRoles?.[bestPlayer.playerId];
    const roleSuffix = roleTag ? ` (${roleTag})` : '';
    if (bestPlayer.acs >= 260) {
      highlights.push(
        `${bestPlayer.playerName}${roleSuffix} dominated — ${kd} K/D, the best player in the series`
      );
    } else {
      const span = bestPlayer.mapCount > 1 ? 'across all maps' : 'on the map';
      highlights.push(
        `${bestPlayer.playerName}${roleSuffix} led the team with a ${kd} K/D ${span}`
      );
    }
  }

  // 2. Best/worst map moment
  const bestMapIdx = margins.indexOf(Math.max(...margins));
  const worstMapIdx = margins.indexOf(Math.min(...margins));

  if (isWin && Math.abs(margins[bestMapIdx]) >= 6) {
    const bm = maps[bestMapIdx];
    const p = side === 'teamA' ? bm.teamAScore : bm.teamBScore;
    const o = side === 'teamA' ? bm.teamBScore : bm.teamAScore;
    highlights.push(`${bm.map}: dominant ${p}-${o} — controlled throughout`);
  } else if (!isWin && Math.abs(margins[worstMapIdx]) >= 6) {
    const wm = maps[worstMapIdx];
    const p = side === 'teamA' ? wm.teamAScore : wm.teamBScore;
    const o = side === 'teamA' ? wm.teamBScore : wm.teamAScore;
    highlights.push(`${wm.map}: ${p}-${o} — couldn't get a foothold on this one`);
  } else if (anyOT) {
    const otMap = maps.find(m => m.overtime);
    if (otMap) {
      const p = side === 'teamA' ? otMap.teamAScore : otMap.teamBScore;
      const o = side === 'teamA' ? otMap.teamBScore : otMap.teamAScore;
      highlights.push(
        `${otMap.map} went all the way to overtime — ${isWin ? `pulled through ${p}-${o}` : `fell just short ${p}-${o}`}`
      );
    }
  }

  // 3. Dropped map note (2-1 scenarios)
  if (isWin && maps.length >= 3 && margins[worstMapIdx] < 0) {
    const wm = maps[worstMapIdx];
    const p = side === 'teamA' ? wm.teamAScore : wm.teamBScore;
    const o = side === 'teamA' ? wm.teamBScore : wm.teamAScore;
    highlights.push(`Dropped ${wm.map} ${p}-${o} — a map to sharpen before the next series`);
  }

  // 4. Economy
  if (playerEcoWins >= 2) {
    highlights.push(
      `Won ${playerEcoWins} rounds on tight budgets — economic discipline was the difference`
    );
  } else if (oppEcoWins >= 2) {
    highlights.push(
      `Gave up ${oppEcoWins} rounds on eco — opponent punished the buys`
    );
  }

  // 5. Clutch
  if (totalPlayerClutchWon >= 2) {
    highlights.push(
      `Converted ${totalPlayerClutchWon}/${totalPlayerClutchAttempted} clutches — stepped up under pressure`
    );
  } else if (totalPlayerClutchAttempted >= 3 && totalPlayerClutchWon === 0) {
    highlights.push(
      `0 for ${totalPlayerClutchAttempted} in clutch situations — couldn't convert when it mattered`
    );
  }

  // 6. Comeback moment
  if (comebackMapIdx >= 0 && isWin) {
    const cm = maps[comebackMapIdx];
    const cpScore = side === 'teamA' ? cm.teamAScore : cm.teamBScore;
    const coScore = side === 'teamA' ? cm.teamBScore : cm.teamAScore;
    const half = cm.enhancedRounds![11];
    const pHalf = side === 'teamA' ? half.teamAScore : half.teamBScore;
    const oHalf = side === 'teamA' ? half.teamBScore : half.teamAScore;
    highlights.push(
      `Came back from ${pHalf}-${oHalf} at half to take ${cm.map} ${cpScore}-${coScore}`
    );
  }

  // 7. Choke moment
  if (playerChoked && !isWin && chokedMapIdx >= 0) {
    const cm = maps[chokedMapIdx];
    const cpScore = side === 'teamA' ? cm.teamAScore : cm.teamBScore;
    const coScore = side === 'teamA' ? cm.teamBScore : cm.teamAScore;
    highlights.push(
      `Led by ${chokedMaxLead} on ${cm.map} before losing ${cpScore}-${coScore} — couldn't hold it`
    );
  }

  // 8. Opponent star
  if (!isWin && bestOppPlayer && bestOppPlayer.acs >= 260) {
    const kd = kdStr(bestOppPlayer.kills, bestOppPlayer.deaths);
    const oppRoleTag = playerRoles?.[bestOppPlayer.playerId];
    const oppRoleSuffix = oppRoleTag ? ` (${oppRoleTag})` : '';
    highlights.push(
      `Opponent's ${bestOppPlayer.playerName}${oppRoleSuffix} went ${kd} — was unstoppable`
    );
  }

  return {
    headline,
    tags,
    highlights: highlights.slice(0, 5),
    isWin,
  };
}
