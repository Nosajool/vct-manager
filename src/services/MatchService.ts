// MatchService - Orchestrates match simulation with store updates
// Connects the pure MatchSimulator engine with Zustand store

import { useGameStore } from '../store';
import { matchSimulator } from '../engine/match';
import type { Match, MatchResult, Player, Team } from '../types';

export class MatchService {
  /**
   * Simulate a match and update all related state
   */
  simulateMatch(matchId: string): MatchResult | null {
    const state = useGameStore.getState();
    const match = state.matches[matchId];

    if (!match) {
      console.error(`Match not found: ${matchId}`);
      return null;
    }

    if (match.status === 'completed') {
      console.warn(`Match already completed: ${matchId}`);
      return state.results[matchId] || null;
    }

    // Get teams
    const teamA = state.teams[match.teamAId];
    const teamB = state.teams[match.teamBId];

    if (!teamA || !teamB) {
      console.error(`Teams not found for match: ${matchId}`);
      return null;
    }

    // Get players for each team
    const playersA = this.getTeamPlayers(teamA, state.players);
    const playersB = this.getTeamPlayers(teamB, state.players);

    if (playersA.length === 0 || playersB.length === 0) {
      console.error(`Teams don't have players: ${matchId}`);
      return null;
    }

    // Run simulation
    const result = matchSimulator.simulate(teamA, teamB, playersA, playersB);

    // Update result's matchId to the actual match
    result.matchId = matchId;

    // Apply all updates to the store
    this.applyMatchResult(match, result, playersA, playersB);

    return result;
  }

  /**
   * Create and schedule a new match
   */
  createMatch(
    teamAId: string,
    teamBId: string,
    scheduledDate: string,
    tournamentId?: string
  ): Match {
    const match: Match = {
      id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      teamAId,
      teamBId,
      scheduledDate,
      status: 'scheduled',
      tournamentId,
    };

    useGameStore.getState().addMatch(match);
    return match;
  }

  /**
   * Get active roster players for a team
   */
  private getTeamPlayers(
    team: Team,
    allPlayers: Record<string, Player>
  ): Player[] {
    return team.playerIds
      .map((id) => allPlayers[id])
      .filter((p): p is Player => p !== undefined);
  }

  /**
   * Apply match result to the store
   */
  private applyMatchResult(
    match: Match,
    result: MatchResult,
    playersA: Player[],
    playersB: Player[]
  ): void {
    const { updateMatch, addResult, recordWin, recordLoss, updatePlayer } =
      useGameStore.getState();

    // 1. Update match status
    updateMatch(match.id, {
      status: 'completed',
      result,
    });

    // 2. Add result to results store
    addResult(result);

    // 3. Calculate round differential
    const roundsA = result.maps.reduce((sum, m) => sum + m.teamAScore, 0);
    const roundsB = result.maps.reduce((sum, m) => sum + m.teamBScore, 0);
    const roundDiff = Math.abs(roundsA - roundsB);

    // 4. Update team standings
    if (result.winnerId === match.teamAId) {
      recordWin(match.teamAId, roundDiff);
      recordLoss(match.teamBId, roundDiff);
    } else {
      recordWin(match.teamBId, roundDiff);
      recordLoss(match.teamAId, roundDiff);
    }

    // 5. Update player stats
    this.updatePlayerStats(playersA, result, match.teamAId, updatePlayer);
    this.updatePlayerStats(playersB, result, match.teamBId, updatePlayer);
  }

  /**
   * Update individual player career stats and form
   */
  private updatePlayerStats(
    players: Player[],
    result: MatchResult,
    teamId: string,
    updatePlayer: (id: string, updates: Partial<Player>) => void
  ): void {
    const won = result.winnerId === teamId;
    const side = result.maps[0].teamAPerformances[0]?.playerId
      && players.some((p) => p.id === result.maps[0].teamAPerformances[0]?.playerId)
      ? 'A'
      : 'B';

    for (const player of players) {
      // Aggregate stats across all maps
      let totalKills = 0;
      let totalDeaths = 0;
      let totalAssists = 0;

      for (const map of result.maps) {
        const performances =
          side === 'A' ? map.teamAPerformances : map.teamBPerformances;
        const perf = performances.find((p) => p.playerId === player.id);

        if (perf) {
          totalKills += perf.kills;
          totalDeaths += perf.deaths;
          totalAssists += perf.assists;
        }
      }

      const mapsPlayed = result.maps.length;
      const avgKillsThisMatch = totalKills / mapsPlayed;
      const avgDeathsThisMatch = totalDeaths / mapsPlayed;
      const avgAssistsThisMatch = totalAssists / mapsPlayed;

      // Update career stats (rolling average)
      const currentStats = player.careerStats;
      const matchesPlayed = currentStats.matchesPlayed + 1;

      // Calculate new averages
      const avgKills =
        (currentStats.avgKills * currentStats.matchesPlayed + avgKillsThisMatch) /
        matchesPlayed;
      const avgDeaths =
        (currentStats.avgDeaths * currentStats.matchesPlayed + avgDeathsThisMatch) /
        matchesPlayed;
      const avgAssists =
        (currentStats.avgAssists * currentStats.matchesPlayed + avgAssistsThisMatch) /
        matchesPlayed;

      // Update form based on performance
      // Good K/D ratio and wins increase form, losses decrease it
      const kd = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;
      let formDelta = 0;

      if (won) {
        formDelta += 3; // Win bonus
      } else {
        formDelta -= 2; // Loss penalty
      }

      if (kd >= 1.5) {
        formDelta += 3; // Great performance
      } else if (kd >= 1.0) {
        formDelta += 1; // Good performance
      } else if (kd < 0.7) {
        formDelta -= 2; // Poor performance
      }

      // Clamp form between 30 and 100
      const newForm = Math.max(30, Math.min(100, player.form + formDelta));

      updatePlayer(player.id, {
        careerStats: {
          ...currentStats,
          matchesPlayed,
          wins: currentStats.wins + (won ? 1 : 0),
          losses: currentStats.losses + (won ? 0 : 1),
          avgKills: Math.round(avgKills * 10) / 10,
          avgDeaths: Math.round(avgDeaths * 10) / 10,
          avgAssists: Math.round(avgAssists * 10) / 10,
        },
        form: newForm,
      });
    }
  }

  /**
   * Get upcoming matches for a team
   */
  getUpcomingMatches(teamId: string): Match[] {
    return useGameStore.getState().getUpcomingMatches(teamId);
  }

  /**
   * Get match history for a team
   */
  getMatchHistory(teamId: string): MatchResult[] {
    return useGameStore.getState().getTeamMatchHistory(teamId);
  }
}

// Export singleton instance
export const matchService = new MatchService();
