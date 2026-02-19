// MatchMoraleCalculator - Pure calculation logic for post-match morale changes
// PRINCIPLE: No store access - takes input, returns result

import type {
  MapResult,
  MoraleCalculationInput,
  MatchMoraleResult,
  PlayerMoraleChange,
  SpecialMoraleEvent,
  MoraleChangeReason,
} from '../../types/match';

export class MatchMoraleCalculator {
  calculate(input: MoraleCalculationInput): MatchMoraleResult {
    const { matchResult, playerTeamId, playerTeamPlayers } = input;

    const playerIds = new Set(playerTeamPlayers.map(p => p.id));
    const isWin = matchResult.winnerId === playerTeamId;

    const playerAcsMap = this.aggregatePlayerAcs(matchResult.maps, playerIds);

    if (playerAcsMap.size === 0) {
      return {
        playerChanges: [],
        specialEvents: [],
        isWin,
      };
    }

    const teamAvgAcs = this.calculateTeamAverageAcs(playerAcsMap);

    const playerSide = this.determinePlayerTeamSide(matchResult.maps[0], playerIds);
    if (!playerSide) {
      return {
        playerChanges: [],
        specialEvents: [],
        isWin,
      };
    }

    const specialEvents = this.detectSpecialEvents(input, playerSide);
    const specialTotal = specialEvents.reduce((sum, e) => sum + e.delta, 0);

    const baseDelta = isWin ? 5 : -5;

    const playerChanges: PlayerMoraleChange[] = [];

    for (const player of playerTeamPlayers) {
      const acsData = playerAcsMap.get(player.id);
      if (!acsData) continue;

      const acsRatio = teamAvgAcs > 0 ? acsData.acs / teamAvgAcs : 1;
      const perfModifier = this.getPerformanceModifier(acsRatio);
      const perfLabel = this.getPerformanceReason(acsRatio);

      const reasons: MoraleChangeReason[] = [
        { label: isWin ? 'Match Win' : 'Match Loss', delta: baseDelta },
      ];

      if (perfLabel && perfModifier !== 0) {
        reasons.push({ label: perfLabel, delta: perfModifier });
      }

      for (const event of specialEvents) {
        reasons.push({ label: event.label, delta: event.delta });
      }

      const rawDelta = baseDelta + perfModifier + specialTotal;
      const delta = this.clamp(rawDelta, -20, 20);
      const newMorale = this.clamp(player.morale + delta, 0, 100);

      playerChanges.push({
        playerId: player.id,
        playerName: player.name,
        delta,
        newMorale,
        reasons,
      });
    }

    return {
      playerChanges,
      specialEvents,
      isWin,
    };
  }

  private determinePlayerTeamSide(
    map: MapResult,
    playerIds: Set<string>
  ): 'teamA' | 'teamB' | null {
    for (const perf of map.teamAPerformances) {
      if (playerIds.has(perf.playerId)) return 'teamA';
    }
    for (const perf of map.teamBPerformances) {
      if (playerIds.has(perf.playerId)) return 'teamB';
    }
    return null;
  }

  private aggregatePlayerAcs(
    maps: MapResult[],
    playerIds: Set<string>
  ): Map<string, { acs: number; mapsPlayed: number }> {
    const playerAcsMap = new Map<string, { weightedAcs: number; totalRounds: number; mapsPlayed: number }>();

    for (const map of maps) {
      for (const perf of map.teamAPerformances) {
        if (playerIds.has(perf.playerId)) {
          const existing = playerAcsMap.get(perf.playerId) || { weightedAcs: 0, totalRounds: 0, mapsPlayed: 0 };
          existing.weightedAcs += perf.acs * map.totalRounds;
          existing.totalRounds += map.totalRounds;
          existing.mapsPlayed += 1;
          playerAcsMap.set(perf.playerId, existing);
        }
      }
      for (const perf of map.teamBPerformances) {
        if (playerIds.has(perf.playerId)) {
          const existing = playerAcsMap.get(perf.playerId) || { weightedAcs: 0, totalRounds: 0, mapsPlayed: 0 };
          existing.weightedAcs += perf.acs * map.totalRounds;
          existing.totalRounds += map.totalRounds;
          existing.mapsPlayed += 1;
          playerAcsMap.set(perf.playerId, existing);
        }
      }
    }

    const result = new Map<string, { acs: number; mapsPlayed: number }>();
    for (const [playerId, data] of playerAcsMap) {
      const acs = data.totalRounds > 0 ? data.weightedAcs / data.totalRounds : 0;
      result.set(playerId, { acs, mapsPlayed: data.mapsPlayed });
    }

    return result;
  }

  private calculateTeamAverageAcs(
    playerAcsMap: Map<string, { acs: number }>
  ): number {
    if (playerAcsMap.size === 0) return 0;

    let total = 0;
    for (const data of playerAcsMap.values()) {
      total += data.acs;
    }
    return total / playerAcsMap.size;
  }

  private detectSpecialEvents(
    input: MoraleCalculationInput,
    playerSide: 'teamA' | 'teamB'
  ): SpecialMoraleEvent[] {
    const events: SpecialMoraleEvent[] = [];
    const { matchResult, rivalryIntensity, opponentWinStreak } = input;
    const isWin = matchResult.winnerId === input.playerTeamId;

    for (const map of matchResult.maps) {
      const playerWonMap = map.winner === playerSide;
      const playerScore = playerSide === 'teamA' ? map.teamAScore : map.teamBScore;
      const opponentScore = playerSide === 'teamA' ? map.teamBScore : map.teamAScore;

      if (playerWonMap && opponentScore <= 1) {
        events.push({
          type: 'dominant_win',
          label: 'Dominant Win',
          icon: '💪',
          delta: 3,
        });
      }

      if (!playerWonMap && playerScore <= 1) {
        events.push({
          type: 'dominant_loss',
          label: 'Dominant Loss',
          icon: '😓',
          delta: -4,
        });
      }

      if (map.overtime) {
        if (playerWonMap) {
          events.push({
            type: 'overtime_win',
            label: 'Overtime Win',
            icon: '⚡',
            delta: 2,
          });
        } else {
          events.push({
            type: 'overtime_loss',
            label: 'Overtime Loss',
            icon: '😔',
            delta: -2,
          });
        }
      }

      const halftimeResult = this.detectComebackOrBlownLead(map, playerSide);
      if (halftimeResult?.type === 'comeback') {
        events.push({
          type: 'comeback_win',
          label: 'Comeback Win',
          icon: '🔥',
          delta: 3,
        });
      } else if (halftimeResult?.type === 'blown_lead') {
        events.push({
          type: 'blown_lead',
          label: 'Blown Lead',
          icon: '💔',
          delta: -4,
        });
      }
    }

    if (rivalryIntensity >= 40) {
      if (isWin) {
        if (rivalryIntensity > 70) {
          events.push({
            type: 'rivalry_win_major',
            label: 'Major Rivalry Win',
            icon: '⚔️',
            delta: 5,
          });
        } else {
          events.push({
            type: 'rivalry_win_minor',
            label: 'Rivalry Win',
            icon: '⚔️',
            delta: 3,
          });
        }
      } else {
        if (rivalryIntensity > 70) {
          events.push({
            type: 'rivalry_loss_major',
            label: 'Major Rivalry Loss',
            icon: '⚔️',
            delta: -5,
          });
        } else {
          events.push({
            type: 'rivalry_loss_minor',
            label: 'Rivalry Loss',
            icon: '⚔️',
            delta: -3,
          });
        }
      }
    }

    if (isWin && opponentWinStreak >= 3) {
      events.push({
        type: 'upset_win',
        label: 'Upset Win',
        icon: '🎯',
        delta: 4,
      });
    }

    return events;
  }

  private getPerformanceModifier(acsRatio: number): number {
    if (acsRatio >= 1.4) return 4;
    if (acsRatio >= 1.15) return 2;
    if (acsRatio <= 0.6) return -4;
    if (acsRatio <= 0.85) return -2;
    return 0;
  }

  private getPerformanceReason(acsRatio: number): string | null {
    if (acsRatio >= 1.4) return 'MVP Performance';
    if (acsRatio >= 1.15) return 'Strong Performance';
    if (acsRatio <= 0.6) return 'Poor Performance';
    if (acsRatio <= 0.85) return 'Below Average';
    return null;
  }

  private detectComebackOrBlownLead(
    map: MapResult,
    playerSide: 'teamA' | 'teamB'
  ): { type: 'comeback' | 'blown_lead' } | null {
    const halftimeScore = this.getHalftimeScore(map);
    if (!halftimeScore) return null;

    const playerHalftimeScore = playerSide === 'teamA' ? halftimeScore.teamA : halftimeScore.teamB;
    const opponentHalftimeScore = playerSide === 'teamA' ? halftimeScore.teamB : halftimeScore.teamA;
    const scoreDiff = playerHalftimeScore - opponentHalftimeScore;

    const playerWonMap = map.winner === playerSide;

    if (!playerWonMap && scoreDiff >= 6) {
      return { type: 'blown_lead' };
    }

    if (playerWonMap && scoreDiff <= -6) {
      return { type: 'comeback' };
    }

    return null;
  }

  private getHalftimeScore(map: MapResult): { teamA: number; teamB: number } | null {
    if (!map.enhancedRounds || map.enhancedRounds.length === 0) return null;

    const halftimeRound = map.enhancedRounds.find(r => r.roundNumber === 12);
    if (!halftimeRound) return null;

    return {
      teamA: halftimeRound.teamAScore,
      teamB: halftimeRound.teamBScore,
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export const matchMoraleCalculator = new MatchMoraleCalculator();
