// TournamentService - Orchestrates tournament operations with store updates
// Connects the pure competition engines with Zustand store

import { useGameStore } from '../store';
import { bracketManager, tournamentEngine } from '../engine/competition';
import { matchService } from './MatchService';
import type {
  Tournament,
  TournamentFormat,
  CompetitionType,
  TournamentRegion,
  BracketMatch,
  MatchResult,
  CalendarEvent,
} from '../types';
import type { StandingsEntry } from '../store/slices/competitionSlice';

export class TournamentService {
  /**
   * Create a new tournament and add it to the store
   */
  createTournament(
    name: string,
    type: CompetitionType,
    format: TournamentFormat,
    region: TournamentRegion,
    teamIds: string[],
    startDate: Date,
    prizePool?: number
  ): Tournament | null {
    // Validate
    const validation = tournamentEngine.validateTournament(teamIds, type, format);
    if (!validation.valid) {
      console.error(`Tournament validation failed: ${validation.error}`);
      return null;
    }

    // Create tournament using engine
    const tournament = tournamentEngine.createTournament(
      name,
      type,
      format,
      region,
      teamIds,
      startDate,
      prizePool
    );

    // Add to store
    useGameStore.getState().addTournament(tournament);

    // Schedule tournament matches on calendar
    this.scheduleTournamentMatches(tournament);

    // Add tournament events to calendar
    this.addTournamentCalendarEvents(tournament);

    return tournament;
  }

  /**
   * Start a tournament (change status to in_progress)
   */
  startTournament(tournamentId: string): boolean {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      console.error(`Tournament not found: ${tournamentId}`);
      return false;
    }

    if (tournament.status !== 'upcoming') {
      console.warn(`Tournament already started or completed: ${tournamentId}`);
      return false;
    }

    state.updateTournament(tournamentId, { status: 'in_progress' });
    return true;
  }

  /**
   * Advance the tournament by completing a match
   */
  advanceTournament(
    tournamentId: string,
    bracketMatchId: string,
    result: MatchResult
  ): boolean {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      console.error(`Tournament not found: ${tournamentId}`);
      return false;
    }

    // Update bracket
    const newBracket = bracketManager.completeMatch(
      tournament.bracket,
      bracketMatchId,
      result.winnerId,
      result.loserId,
      result
    );

    // Update tournament bracket in store
    state.updateBracket(tournamentId, newBracket);

    // Check if tournament is complete
    const bracketStatus = bracketManager.getBracketStatus(newBracket);
    if (bracketStatus === 'completed') {
      const champion = bracketManager.getChampion(newBracket);
      if (champion) {
        state.setTournamentChampion(tournamentId, champion);
        this.distributePrizes(tournamentId);
      }
    }

    return true;
  }

  /**
   * Simulate the next ready match in the tournament
   */
  simulateNextMatch(tournamentId: string): MatchResult | null {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      console.error(`Tournament not found: ${tournamentId}`);
      return null;
    }

    // Ensure tournament is in progress
    if (tournament.status === 'upcoming') {
      this.startTournament(tournamentId);
    }

    // Get next ready match
    const nextMatch = bracketManager.getNextMatch(tournament.bracket);
    if (!nextMatch) {
      console.log('No ready matches in tournament');
      return null;
    }

    // Get teams
    const teamA = state.teams[nextMatch.teamAId!];
    const teamB = state.teams[nextMatch.teamBId!];

    if (!teamA || !teamB) {
      console.error('Teams not found for match');
      return null;
    }

    // Create a match in the match store for this bracket match
    const match = matchService.createMatch(
      teamA.id,
      teamB.id,
      new Date().toISOString(),
      tournamentId
    );

    // Simulate the match
    const result = matchService.simulateMatch(match.id);

    if (result) {
      // Advance the tournament bracket
      this.advanceTournament(tournamentId, nextMatch.matchId, result);
    }

    return result;
  }

  /**
   * Simulate an entire tournament round
   */
  simulateTournamentRound(tournamentId: string): MatchResult[] {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      console.error(`Tournament not found: ${tournamentId}`);
      return [];
    }

    // Ensure tournament is in progress
    if (tournament.status === 'upcoming') {
      this.startTournament(tournamentId);
    }

    // Get all ready matches
    const readyMatches = bracketManager.getReadyMatches(tournament.bracket);
    const results: MatchResult[] = [];

    for (const _bracketMatch of readyMatches) {
      const result = this.simulateNextMatch(tournamentId);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Simulate entire tournament to completion
   */
  simulateTournament(tournamentId: string): {
    results: MatchResult[];
    champion: string | null;
  } {
    const allResults: MatchResult[] = [];
    let champion: string | null = null;

    // Ensure tournament is in progress
    this.startTournament(tournamentId);

    // Keep simulating until tournament is complete
    let safetyCounter = 0;
    const maxIterations = 100;

    while (safetyCounter < maxIterations) {
      const state = useGameStore.getState();
      const tournament = state.tournaments[tournamentId];

      if (!tournament || tournament.status === 'completed') {
        champion = tournament?.championId || null;
        break;
      }

      const result = this.simulateNextMatch(tournamentId);
      if (result) {
        allResults.push(result);
      } else {
        // No more matches to simulate
        break;
      }

      safetyCounter++;
    }

    return { results: allResults, champion };
  }

  /**
   * Distribute prizes to teams based on final placements
   */
  distributePrizes(tournamentId: string): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      console.error(`Tournament not found: ${tournamentId}`);
      return;
    }

    const placements = bracketManager.getFinalPlacements(tournament.bracket);
    const prizeDistribution = tournamentEngine.calculatePrizeDistribution(
      tournament.type,
      tournament.prizePool.first +
        tournament.prizePool.second +
        tournament.prizePool.third +
        (tournament.prizePool.fourth || 0) +
        (tournament.prizePool.fifthSixth || 0) * 2 +
        (tournament.prizePool.seventhEighth || 0) * 2
    );

    // Award prizes to teams
    for (const [placement, teamId] of Object.entries(placements)) {
      const prize = prizeDistribution[parseInt(placement)];
      if (prize && teamId) {
        const team = state.teams[teamId];
        if (team) {
          // Update team finances (add prize money)
          state.updateTeam(teamId, {
            finances: {
              ...team.finances,
              balance: team.finances.balance + prize,
            },
          });
          console.log(`Awarded $${prize.toLocaleString()} to ${team.name} (${placement}${this.getPlacementSuffix(parseInt(placement))} place)`);
        }
      }
    }
  }

  /**
   * Get tournament standings for round-robin formats
   */
  calculateStandings(tournamentId: string): StandingsEntry[] {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      return [];
    }

    // Build standings from completed matches
    const standingsMap = new Map<string, StandingsEntry>();

    // Initialize all teams
    for (const teamId of tournament.teamIds) {
      const team = state.teams[teamId];
      standingsMap.set(teamId, {
        teamId,
        teamName: team?.name || 'Unknown',
        wins: 0,
        losses: 0,
        roundDiff: 0,
      });
    }

    // Process completed bracket matches
    const processMatches = (matches: BracketMatch[]) => {
      for (const match of matches) {
        if (match.status !== 'completed' || !match.result) continue;

        const result = match.result;
        const winnerEntry = standingsMap.get(result.winnerId);
        const loserEntry = standingsMap.get(result.loserId);

        if (winnerEntry) {
          winnerEntry.wins++;
          winnerEntry.roundDiff += result.scoreTeamA - result.scoreTeamB;
        }

        if (loserEntry) {
          loserEntry.losses++;
          loserEntry.roundDiff -= result.scoreTeamA - result.scoreTeamB;
        }
      }
    };

    for (const round of tournament.bracket.upper) {
      processMatches(round.matches);
    }

    tournament.bracket.lower?.forEach((round) => processMatches(round.matches));
    tournament.bracket.middle?.forEach((round) => processMatches(round.matches));

    // Sort by wins, then round diff
    const standings = Array.from(standingsMap.values()).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.roundDiff - a.roundDiff;
    });

    // Assign placements
    standings.forEach((entry, index) => {
      entry.placement = index + 1;
    });

    // Update store
    state.updateStandings(tournamentId, standings);

    return standings;
  }

  /**
   * Get current tournament info
   */
  getCurrentTournament(): Tournament | undefined {
    return useGameStore.getState().getCurrentTournament();
  }

  /**
   * Get all active tournaments
   */
  getActiveTournaments(): Tournament[] {
    return useGameStore.getState().getActiveTournaments();
  }

  /**
   * Get tournament by ID
   */
  getTournament(tournamentId: string): Tournament | undefined {
    return useGameStore.getState().getTournament(tournamentId);
  }

  /**
   * Get ready matches for a tournament
   */
  getReadyMatches(tournamentId: string): BracketMatch[] {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) return [];
    return bracketManager.getReadyMatches(tournament.bracket);
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Schedule tournament matches on the calendar
   */
  private scheduleTournamentMatches(tournament: Tournament): void {
    const startDate = new Date(tournament.startDate);
    let currentDate = new Date(startDate);

    // Schedule matches across the tournament duration
    const totalMatches = this.countTotalMatches(tournament.bracket);
    const daysAvailable = Math.max(
      1,
      Math.floor(
        (new Date(tournament.endDate).getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const matchesPerDay = Math.ceil(totalMatches / daysAvailable);

    let matchCount = 0;

    // Process upper bracket
    for (const round of tournament.bracket.upper) {
      for (const match of round.matches) {
        if (match.status === 'completed') continue;

        match.scheduledDate = currentDate.toISOString();
        matchCount++;

        if (matchCount % matchesPerDay === 0) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    // Process lower bracket if exists
    if (tournament.bracket.lower) {
      for (const round of tournament.bracket.lower) {
        for (const match of round.matches) {
          if (match.status === 'completed') continue;

          match.scheduledDate = currentDate.toISOString();
          matchCount++;

          if (matchCount % matchesPerDay === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    }

    // Schedule grand final
    if (tournament.bracket.grandfinal) {
      tournament.bracket.grandfinal.scheduledDate = new Date(
        tournament.endDate
      ).toISOString();
    }
  }

  /**
   * Add tournament events to calendar
   */
  private addTournamentCalendarEvents(tournament: Tournament): void {
    const events: CalendarEvent[] = [
      {
        id: `event-${tournament.id}-start`,
        type: 'tournament_start',
        date: tournament.startDate,
        data: { tournamentId: tournament.id, title: `${tournament.name} Starts` },
        processed: false,
        required: false,
      },
      {
        id: `event-${tournament.id}-end`,
        type: 'tournament_end',
        date: tournament.endDate,
        data: { tournamentId: tournament.id, title: `${tournament.name} Finals` },
        processed: false,
        required: false,
      },
    ];

    useGameStore.getState().addCalendarEvents(events);
  }

  /**
   * Count total matches in a bracket
   */
  private countTotalMatches(bracket: {
    upper: { matches: unknown[] }[];
    lower?: { matches: unknown[] }[];
    middle?: { matches: unknown[] }[];
    grandfinal?: unknown;
  }): number {
    let count = 0;

    for (const round of bracket.upper) {
      count += round.matches.length;
    }

    if (bracket.lower) {
      for (const round of bracket.lower) {
        count += round.matches.length;
      }
    }

    if (bracket.middle) {
      for (const round of bracket.middle) {
        count += round.matches.length;
      }
    }

    if (bracket.grandfinal) {
      count += 1;
    }

    return count;
  }

  /**
   * Get placement suffix (1st, 2nd, 3rd, etc.)
   */
  private getPlacementSuffix(n: number): string {
    if (n >= 11 && n <= 13) return 'th';
    switch (n % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }
}

// Export singleton instance
export const tournamentService = new TournamentService();
