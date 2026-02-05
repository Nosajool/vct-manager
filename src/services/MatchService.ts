// MatchService - Orchestrates match simulation with store updates
// Connects the pure MatchSimulator engine with Zustand store

import { useGameStore } from '../store';
import { matchSimulator } from '../engine/match';
import { tournamentService } from './TournamentService';
import type { Match, MatchResult, Player, Team } from '../types';
import { isLeagueToPlayoffTournament } from '../types';
import type { TournamentStandingsEntry, LeagueStage } from '../types/competition';

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

    // Get team strategies
    const strategyA = state.getTeamStrategy(match.teamAId);
    const strategyB = state.getTeamStrategy(match.teamBId);

    // Get map pools if available
    const mapPoolA = teamA.mapPool;
    const mapPoolB = teamB.mapPool;

    // Run simulation with strategies
    const result = matchSimulator.simulate(
      teamA,
      teamB,
      playersA,
      playersB,
      mapPoolA,
      mapPoolB,
      strategyA,
      strategyB
    );

    // Update result's matchId to the actual match
    result.matchId = matchId;

// Apply all updates to the store
    this.applyMatchResult(match, result, playersA, playersB);

    // Store round data for detailed viewing
    this.storeRoundData(result);

    // Advance tournament bracket if this is a tournament match
    if (match.tournamentId) {
      tournamentService.advanceTournament(match.tournamentId, matchId, result);
    }

    return result;
  }

  /**
   * Store detailed round data for the match
   */
  private storeRoundData(result: MatchResult): void {
    const state = useGameStore.getState();
    state.storeMatchRoundData(result.matchId, result.maps);
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

    // 4. Update TOURNAMENT standings (per-phase, resets between tournaments)
    if (match.tournamentId) {
      this.updateTournamentStandings(match.tournamentId, match, result, roundDiff);
    }

    // 5. Update team career standings (for display purposes)
    if (result.winnerId === match.teamAId) {
      recordWin(match.teamAId, roundDiff);
      recordLoss(match.teamBId, roundDiff);
    } else {
      recordWin(match.teamBId, roundDiff);
      recordLoss(match.teamAId, roundDiff);
    }

    // 6. Update player stats
    this.updatePlayerStats(playersA, result, match.teamAId, match, updatePlayer);
    this.updatePlayerStats(playersB, result, match.teamBId, match, updatePlayer);
  }

  /**
   * Update tournament-specific standings (used for qualification decisions)
   */
  private updateTournamentStandings(
    tournamentId: string,
    _match: Match,
    result: MatchResult,
    roundDiff: number
  ): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];
    if (!tournament) return;

    // Calculate map differential
    const mapsWonA = result.scoreTeamA;
    const mapsWonB = result.scoreTeamB;

    // Get or initialize standings
    let standings: TournamentStandingsEntry[] = tournament.standings ??
      tournament.teamIds.map(id => ({
        teamId: id,
        wins: 0,
        losses: 0,
        roundDiff: 0,
        mapDiff: 0
      }));

    // Update winner/loser entries
    standings = standings.map(entry => {
      if (entry.teamId === result.winnerId) {
        return {
          ...entry,
          wins: entry.wins + 1,
          roundDiff: entry.roundDiff + roundDiff,
          mapDiff: entry.mapDiff + (mapsWonA > mapsWonB ? mapsWonA - mapsWonB : mapsWonB - mapsWonA)
        };
      }
      if (entry.teamId === result.loserId) {
        return {
          ...entry,
          losses: entry.losses + 1,
          roundDiff: entry.roundDiff - roundDiff,
          mapDiff: entry.mapDiff - (mapsWonA > mapsWonB ? mapsWonA - mapsWonB : mapsWonB - mapsWonA)
        };
      }
      return entry;
    });

    // Sort standings: wins DESC, then roundDiff DESC, then mapDiff DESC
    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff;
      return b.mapDiff - a.mapDiff;
    });

    // Assign placements
    standings.forEach((entry, idx) => {
      entry.placement = idx + 1;
    });

    state.updateTournament(tournamentId, { standings });

    // Sync to standings slice for round-robin (league) tournaments
    // This moves the sync logic from UI (Tournament.tsx useEffect) to service layer
    if (tournament.format === 'round_robin') {
      tournamentService.calculateLeagueStandings(tournamentId);
    }

    // For league_to_playoff tournaments, also update leagueStage standings and matchesCompleted
    if (isLeagueToPlayoffTournament(tournament) && tournament.currentStage === 'league') {
      const leagueStage = tournament.leagueStage;
      if (leagueStage) {
        // Update leagueStage standings to match tournament standings
        const updatedLeagueStage: LeagueStage = {
          ...leagueStage,
          standings: standings,
          matchesCompleted: leagueStage.matchesCompleted + 1,
        };

        // Update leagueStage in tournament using dedicated action
        state.updateLeagueStage(tournamentId, updatedLeagueStage);

        // Check if league stage is complete (all matches played)
        if (updatedLeagueStage.matchesCompleted >= updatedLeagueStage.totalMatches) {
          console.log(`League stage complete for ${tournament.name} (${updatedLeagueStage.matchesCompleted}/${updatedLeagueStage.totalMatches} matches)`);

          // Only trigger stage completion modal for the player's region tournament
          const playerTeamId = state.playerTeamId;
          const playerTeam = playerTeamId ? state.teams[playerTeamId] : null;

          if (playerTeam && tournament.region === playerTeam.region) {
            // Trigger stage completion modal for player's tournament
            tournamentService.handleStageCompletion(tournamentId);
          } else {
            // For other regions, just log completion (no modal)
            console.log(`  (Not player's region - no modal shown)`);
          }
        }
      }

      // Also sync to standings slice
      tournamentService.calculateLeagueStandings(tournamentId);
    }
  }

  /**
   * Update individual player career stats and form
   */
  private updatePlayerStats(
    players: Player[],
    result: MatchResult,
    teamId: string,
    _match: Match,
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

      // Update season stats
      const currentSeasonStats = player.seasonStats;
      const state = useGameStore.getState();
      const currentSeason = state.calendar.currentSeason;

      // Check for season transition - if player's stats are from a different season,
      // archive the old stats before starting fresh for the new season
      if (currentSeasonStats.season !== currentSeason && currentSeasonStats.matchesPlayed > 0) {
        // Archive the old season stats before resetting
        state.archiveSeasonStats(player.id, currentSeasonStats);
        console.log(
          `Archived season ${currentSeasonStats.season} stats for ${player.name} before starting season ${currentSeason}`
        );

        // Start fresh for the new season
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
          seasonStats: {
            season: currentSeason,
            matchesPlayed: 1,
            wins: won ? 1 : 0,
            losses: won ? 0 : 1,
            avgKills: Math.round(avgKillsThisMatch * 10) / 10,
            avgDeaths: Math.round(avgDeathsThisMatch * 10) / 10,
            avgAssists: Math.round(avgAssistsThisMatch * 10) / 10,
            tournamentsWon: 0, // Reset for new season
          },
          form: newForm,
        });
      } else {
        // Same season - update with weighted averages
        const seasonMatchesPlayed = currentSeasonStats.matchesPlayed + 1;

        // Calculate new season averages
        const seasonAvgKills =
          (currentSeasonStats.avgKills * currentSeasonStats.matchesPlayed + avgKillsThisMatch) /
          seasonMatchesPlayed;
        const seasonAvgDeaths =
          (currentSeasonStats.avgDeaths * currentSeasonStats.matchesPlayed + avgDeathsThisMatch) /
          seasonMatchesPlayed;
        const seasonAvgAssists =
          (currentSeasonStats.avgAssists * currentSeasonStats.matchesPlayed + avgAssistsThisMatch) /
          seasonMatchesPlayed;

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
          seasonStats: {
            season: currentSeason,
            matchesPlayed: seasonMatchesPlayed,
            wins: currentSeasonStats.wins + (won ? 1 : 0),
            losses: currentSeasonStats.losses + (won ? 0 : 1),
            avgKills: Math.round(seasonAvgKills * 10) / 10,
            avgDeaths: Math.round(seasonAvgDeaths * 10) / 10,
            avgAssists: Math.round(seasonAvgAssists * 10) / 10,
            // tournamentsWon is NOT incremented here - it's only incremented
            // when a team wins a tournament in TournamentService.awardTournamentWin()
            tournamentsWon: currentSeasonStats.tournamentsWon,
          },
          form: newForm,
        });
      }
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
