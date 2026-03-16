// IconicMomentDetector — scans completed MatchResult for highlight-reel moments
// Returns flags to set in the drama state (with 7-day expiry)
// Flag names embed playerId (e.g. iconic_knife_kill_player123) when player-specific,
// so the drama engine's {playerId} pattern can auto-select the right player.

import type { MatchResult } from '../../types/match';
import type { TeamStrategy } from '../../types/strategy';
import type { SimKillEvent, SpikeDropEvent } from '../../types/round-simulation';

export interface IconicFlag {
  flag: string; // e.g. 'iconic_knife_kill_player123' or 'iconic_spike_chaos'
}

/**
 * Detect iconic in-game moments from a completed match result.
 *
 * @param result      - The completed MatchResult
 * @param playerTeamId - The player's team ID
 * @param teamAId     - Which team is "teamA" in the MapResult structures
 * @param teamStrategy - The player team's current strategy (for playstyle checks)
 * @returns Array of flags to set in drama state (7-day expiry)
 */
export function detect(
  result: MatchResult,
  playerTeamId: string,
  teamAId: string,
  teamStrategy: TeamStrategy | null,
): IconicFlag[] {
  const flags: IconicFlag[] = [];
  const playerIsTeamA = playerTeamId === teamAId;

  // Collect player team's player IDs from map performances
  const playerTeamPlayerIds = new Set<string>();
  for (const map of result.maps) {
    const perfs = playerIsTeamA ? map.teamAPerformances : map.teamBPerformances;
    for (const perf of perfs) {
      playerTeamPlayerIds.add(perf.playerId);
    }
  }

  // Track whether we already found a flag to avoid duplicate detection
  const foundFlags = new Set<string>();

  function addFlag(flag: string): void {
    if (!foundFlags.has(flag)) {
      foundFlags.add(flag);
      flags.push({ flag });
    }
  }

  // ── Per-map, per-round detection ──────────────────────────────────────────

  for (const map of result.maps) {
    const enhancedRounds = map.enhancedRounds ?? [];
    const playerIsWinner = map.winner === (playerIsTeamA ? 'teamA' : 'teamB');

    // ── iconic_aggressive_identity: playstyle aggressive + wins a map 13-7 or better ──
    if (
      teamStrategy?.playstyle === 'aggressive' &&
      playerIsWinner &&
      !foundFlags.has('iconic_aggressive_identity')
    ) {
      const playerScore = playerIsTeamA ? map.teamAScore : map.teamBScore;
      const opponentScore = playerIsTeamA ? map.teamBScore : map.teamAScore;
      if (playerScore >= 13 && opponentScore <= 7) {
        addFlag('iconic_aggressive_identity');
      }
    }

    // Consecutive force-buy loss tracking for iconic_force_buy_crisis
    let consecutiveForceBuyLosses = 0;

    for (const round of enhancedRounds) {
      const playerEconomy = playerIsTeamA ? round.teamAEconomy : round.teamBEconomy;
      const playerWonRound = round.winner === (playerIsTeamA ? 'teamA' : 'teamB');
      const timeline = round.timeline ?? [];

      // ── iconic_knife_kill: any kill with weapon === 'knife' by player's team ──
      if (!foundFlags.has('iconic_knife_kill')) {
        for (const event of timeline) {
          if (
            event.type === 'kill' &&
            (event as SimKillEvent).weapon === 'knife' &&
            playerTeamPlayerIds.has((event as SimKillEvent).killerId)
          ) {
            addFlag(`iconic_knife_kill_${(event as SimKillEvent).killerId}`);
            break;
          }
        }
      }

      // ── iconic_ace_round: one player gets 5 kills in a round ──
      if (!foundFlags.has('iconic_ace_round')) {
        const killsPerPlayer: Record<string, number> = {};
        for (const event of timeline) {
          if (event.type === 'kill') {
            const killerId = (event as SimKillEvent).killerId;
            killsPerPlayer[killerId] = (killsPerPlayer[killerId] ?? 0) + 1;
          }
        }
        for (const [playerId, kills] of Object.entries(killsPerPlayer)) {
          if (kills >= 5 && playerTeamPlayerIds.has(playerId)) {
            addFlag(`iconic_ace_round_${playerId}`);
            break;
          }
        }
      }

      // ── iconic_clutch_1v3plus: clutch won 1v3 or better by player's team (Icebox only) ──
      if (
        !foundFlags.has('iconic_clutch_1v3plus') &&
        map.map === 'Icebox' &&
        round.clutchAttempt?.won === true &&
        playerTeamPlayerIds.has(round.clutchAttempt.playerId)
      ) {
        const { situation, playerId } = round.clutchAttempt;
        if (situation === '1v3' || situation === '1v4' || situation === '1v5') {
          addFlag(`iconic_clutch_1v3plus_${playerId}`);
        }
      }

      // ── iconic_spike_chaos: 2+ spike drops in a single round ──
      if (!foundFlags.has('iconic_spike_chaos')) {
        const dropCount = timeline.filter(
          (e): e is SpikeDropEvent => e.type === 'spike_drop'
        ).length;
        if (dropCount >= 2) {
          addFlag('iconic_spike_chaos');
        }
      }

      // ── iconic_ability_massacre: 3+ kills within 2 seconds from same ability ──
      if (!foundFlags.has('iconic_ability_massacre')) {
        // Group kills that have an ability set, by ability ID
        const abilityKills: Record<string, Array<{ timestamp: number; killerId: string }>> = {};
        for (const event of timeline) {
          if (event.type === 'kill') {
            const kill = event as SimKillEvent;
            if (kill.ability && playerTeamPlayerIds.has(kill.killerId)) {
              if (!abilityKills[kill.ability]) {
                abilityKills[kill.ability] = [];
              }
              abilityKills[kill.ability].push({ timestamp: kill.timestamp, killerId: kill.killerId });
            }
          }
        }
        for (const [, kills] of Object.entries(abilityKills)) {
          if (kills.length >= 3) {
            // Check if any 3 kills are within a 2-second window
            const sorted = kills.slice().sort((a, b) => a.timestamp - b.timestamp);
            for (let i = 0; i <= sorted.length - 3; i++) {
              if (sorted[i + 2].timestamp - sorted[i].timestamp <= 2000) {
                addFlag(`iconic_ability_massacre_${sorted[i].killerId}`);
                break;
              }
            }
            if (foundFlags.has('iconic_ability_massacre')) break;
          }
        }
        // Alias: mark the base flag so condition evaluator can find it via {playerId} pattern
        // (already done above by embedding playerId in the flag name)
      }

      // ── iconic_force_buy_comeback: force buy + win ──
      if (
        !foundFlags.has('iconic_force_buy_comeback') &&
        playerEconomy.buyType === 'force_buy' &&
        playerWonRound
      ) {
        addFlag('iconic_force_buy_comeback');
      }

      // ── iconic_force_buy_crisis: 3+ consecutive force-buy losses ──
      if (!foundFlags.has('iconic_force_buy_crisis')) {
        if (playerEconomy.buyType === 'force_buy' && !playerWonRound) {
          consecutiveForceBuyLosses++;
          if (consecutiveForceBuyLosses >= 3) {
            addFlag('iconic_force_buy_crisis');
          }
        } else {
          consecutiveForceBuyLosses = 0;
        }
      }
    }
  }

  return flags;
}
