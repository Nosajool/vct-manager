// TournamentService - Orchestrates tournament operations with store updates
// Connects the pure competition engines with Zustand store

import { useGameStore } from '../store';
import { bracketManager, tournamentEngine } from '../engine/competition';
import { matchService } from './MatchService';
import { economyService } from './EconomyService';
import type {
  Tournament,
  TournamentFormat,
  CompetitionType,
  TournamentRegion,
  BracketMatch,
  BracketStructure,
  MatchResult,
  CalendarEvent,
  Match,
} from '../types';
import type { StandingsEntry, QualificationRecord } from '../store/slices/competitionSlice';

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

    // Schedule tournament matches on calendar (assigns dates to bracket matches)
    this.scheduleTournamentMatches(tournament);

    // Create Match entities for ready bracket matches
    this.createMatchEntitiesForReadyBracketMatches(tournament);

    // Add tournament and match events to calendar
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

    // Schedule newly-ready matches FIRST (sets scheduledDate on bracket matches)
    // Then create Match entities (uses those dates)
    // IMPORTANT: Must get fresh state after updateBracket() - the original `state` snapshot is stale!
    const freshState = useGameStore.getState();
    const updatedTournament = freshState.tournaments[tournamentId];
    if (updatedTournament) {
      // Order matters! Schedule first, then create entities
      this.scheduleNewlyReadyMatches(updatedTournament);
      this.createMatchEntitiesForReadyBracketMatches(updatedTournament);
    }

    // Check if tournament is complete
    const bracketStatus = bracketManager.getBracketStatus(newBracket);
    if (bracketStatus === 'completed') {
      const champion = bracketManager.getChampion(newBracket);
      if (champion) {
        state.setTournamentChampion(tournamentId, champion);
        this.distributePrizes(tournamentId);

        // Handle Kickoff completion - extract qualifiers and trigger modal
        if (tournament.type === 'kickoff') {
          this.handleKickoffCompletion(tournamentId);
        }
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

    // Get existing Match entity or create one if it doesn't exist
    let match = state.matches[nextMatch.matchId];
    if (!match) {
      // Fallback: create Match entity if it wasn't created earlier
      match = matchService.createMatch(
        teamA.id,
        teamB.id,
        nextMatch.scheduledDate || new Date().toISOString(),
        tournamentId
      );
      // Note: This shouldn't happen if createMatchEntitiesForReadyBracketMatches works correctly
      console.warn(`Match entity not found for bracket match ${nextMatch.matchId}, created new one: ${match.id}`);
    }

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

    // Convert placements to array format for economyService
    const placementArray: { teamId: string; placement: number }[] = [];
    for (const [placement, teamId] of Object.entries(placements)) {
      if (teamId) {
        placementArray.push({
          teamId,
          placement: parseInt(placement),
        });
      }
    }

    // Build prize pool object from tournament prizes
    const prizePool: Record<number, number> = {
      1: tournament.prizePool.first,
      2: tournament.prizePool.second,
      3: tournament.prizePool.third,
    };
    if (tournament.prizePool.fourth) {
      prizePool[4] = tournament.prizePool.fourth;
    }
    if (tournament.prizePool.fifthSixth) {
      prizePool[5] = tournament.prizePool.fifthSixth;
      prizePool[6] = tournament.prizePool.fifthSixth;
    }
    if (tournament.prizePool.seventhEighth) {
      prizePool[7] = tournament.prizePool.seventhEighth;
      prizePool[8] = tournament.prizePool.seventhEighth;
    }

    // Use economyService to distribute prizes (creates transactions)
    const distributions = economyService.distributePrizeMoney(
      prizePool,
      placementArray,
      tournament.name
    );

    // Log distributions
    for (const dist of distributions) {
      const team = state.teams[dist.teamId];
      console.log(
        `Awarded $${dist.amount.toLocaleString()} to ${team?.name || dist.teamId} (${dist.placement}${this.getPlacementSuffix(dist.placement)} place)`
      );
    }
  }

  /**
   * Handle Kickoff tournament completion - extract qualifiers and trigger modal
   * Follows pattern: getState() -> engine calls -> state updates
   *
   * IMPORTANT: Only triggers modal for the player's region tournament.
   * Other regions are simulated in bulk via RegionalSimulationService.
   */
  handleKickoffCompletion(tournamentId: string): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      console.error(`Tournament not found for Kickoff completion: ${tournamentId}`);
      return;
    }

    // Only trigger modal for player's region tournament
    // Other regions are simulated in bulk and shouldn't show individual modals
    const playerTeam = state.playerTeamId ? state.teams[state.playerTeamId] : null;
    const isPlayerRegion = playerTeam && tournament.region === playerTeam.region;

    if (!isPlayerRegion) {
      // Not player's region - still save qualification but don't trigger modal
      // (This will be handled by RegionalSimulationService)
      return;
    }

    // Call engine (pure function, no side effects)
    const qualifiers = bracketManager.getQualifiers(tournament.bracket);

    // Validate all qualifiers exist
    if (!qualifiers.alpha || !qualifiers.beta || !qualifiers.omega) {
      console.error('Kickoff completion: Not all qualifiers found', qualifiers);
      return;
    }

    // Build qualification record (normalized data)
    const record: QualificationRecord = {
      tournamentId,
      tournamentType: 'kickoff',
      region: tournament.region as 'Americas' | 'EMEA' | 'Pacific' | 'China',
      qualifiedTeams: [
        { teamId: qualifiers.alpha, teamName: state.teams[qualifiers.alpha]?.name || 'Unknown', bracket: 'alpha' },
        { teamId: qualifiers.beta, teamName: state.teams[qualifiers.beta]?.name || 'Unknown', bracket: 'beta' },
        { teamId: qualifiers.omega, teamName: state.teams[qualifiers.omega]?.name || 'Unknown', bracket: 'omega' },
      ],
    };

    // Update store with qualification record
    state.addQualification(record);

    // Trigger modal via UISlice's existing system (only for player's region)
    state.openModal('qualification', {
      phase: 'kickoff',
      playerRegion: tournament.region,
      playerRegionQualifiers: record,
      allRegionsQualifiers: null,  // Filled later when user clicks "See All"
    });
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
   * Create Match entities for bracket matches that have known teams (status: 'ready')
   * Uses the bracket match's matchId as the Match id for proper linking
   */
  private createMatchEntitiesForReadyBracketMatches(tournament: Tournament): void {
    const state = useGameStore.getState();

    const processMatches = (matches: BracketMatch[]) => {
      for (const bracketMatch of matches) {
        // Only create Match entities for ready matches with known teams
        if (bracketMatch.status === 'ready' && bracketMatch.teamAId && bracketMatch.teamBId) {
          // Check if Match already exists
          if (state.matches[bracketMatch.matchId]) {
            continue;
          }

          // Create Match entity with same ID as bracket match
          const match: Match = {
            id: bracketMatch.matchId,
            teamAId: bracketMatch.teamAId,
            teamBId: bracketMatch.teamBId,
            scheduledDate: bracketMatch.scheduledDate || tournament.startDate,
            status: 'scheduled',
            tournamentId: tournament.id,
          };

          state.addMatch(match);
        }
      }
    };

    // Process all bracket rounds
    for (const round of tournament.bracket.upper) {
      processMatches(round.matches);
    }

    if (tournament.bracket.lower) {
      for (const round of tournament.bracket.lower) {
        processMatches(round.matches);
      }
    }

    if (tournament.bracket.middle) {
      for (const round of tournament.bracket.middle) {
        processMatches(round.matches);
      }
    }

    const gf = tournament.bracket.grandfinal;
    if (gf && gf.status === 'ready' && gf.teamAId && gf.teamBId) {
      if (!state.matches[gf.matchId]) {
        const match: Match = {
          id: gf.matchId,
          teamAId: gf.teamAId,
          teamBId: gf.teamBId,
          scheduledDate: gf.scheduledDate || tournament.endDate,
          status: 'scheduled',
          tournamentId: tournament.id,
        };
        state.addMatch(match);
      }
    }
  }

  /**
   * Schedule tournament matches on the calendar
   * Only schedules matches that are 'ready' (have both teams known)
   */
  private scheduleTournamentMatches(tournament: Tournament): void {
    const startDate = new Date(tournament.startDate);
    let currentDate = new Date(startDate);

    // Count only ready matches for scheduling
    const readyMatches = this.countReadyMatches(tournament.bracket);
    const daysAvailable = Math.max(
      1,
      Math.floor(
        (new Date(tournament.endDate).getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const matchesPerDay = Math.max(1, Math.ceil(readyMatches / daysAvailable));

    let matchCount = 0;

    // Process upper bracket - only schedule ready matches
    for (const round of tournament.bracket.upper) {
      for (const match of round.matches) {
        // Only schedule ready matches with known teams
        if (match.status !== 'ready') continue;

        match.scheduledDate = currentDate.toISOString();
        matchCount++;

        if (matchCount % matchesPerDay === 0) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    // Process lower bracket if exists - only schedule ready matches
    if (tournament.bracket.lower) {
      for (const round of tournament.bracket.lower) {
        for (const match of round.matches) {
          if (match.status !== 'ready') continue;

          match.scheduledDate = currentDate.toISOString();
          matchCount++;

          if (matchCount % matchesPerDay === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    }

    // Process middle bracket if exists - only schedule ready matches
    if (tournament.bracket.middle) {
      for (const round of tournament.bracket.middle) {
        for (const match of round.matches) {
          if (match.status !== 'ready') continue;

          match.scheduledDate = currentDate.toISOString();
          matchCount++;

          if (matchCount % matchesPerDay === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    }

    // Schedule grand final only if ready
    if (tournament.bracket.grandfinal && tournament.bracket.grandfinal.status === 'ready') {
      tournament.bracket.grandfinal.scheduledDate = new Date(
        tournament.endDate
      ).toISOString();
    }
  }

  /**
   * Add tournament events to calendar (tournament markers + ready match events only)
   * Only creates match events for matches that are 'ready' (have both teams known)
   */
  private addTournamentCalendarEvents(tournament: Tournament): void {
    const state = useGameStore.getState();
    const events: CalendarEvent[] = [
      {
        id: `event-${tournament.id}-start`,
        type: 'tournament_start',
        date: tournament.startDate,
        data: { tournamentId: tournament.id, tournamentName: tournament.name },
        processed: false,
        required: false,
      },
      {
        id: `event-${tournament.id}-end`,
        type: 'tournament_end',
        date: tournament.endDate,
        data: { tournamentId: tournament.id, tournamentName: tournament.name },
        processed: false,
        required: false,
      },
    ];

    // Add calendar events only for ready bracket matches
    const addMatchEvents = (matches: BracketMatch[]) => {
      for (const bracketMatch of matches) {
        // Only create events for ready matches with known teams
        if (bracketMatch.status !== 'ready') continue;
        if (!bracketMatch.teamAId || !bracketMatch.teamBId) continue;

        const teamA = state.teams[bracketMatch.teamAId];
        const teamB = state.teams[bracketMatch.teamBId];

        events.push({
          id: `event-match-${bracketMatch.matchId}`,
          type: 'match',
          date: bracketMatch.scheduledDate || tournament.startDate,
          data: {
            matchId: bracketMatch.matchId,
            homeTeamId: bracketMatch.teamAId,
            awayTeamId: bracketMatch.teamBId,
            homeTeamName: teamA?.name || 'Unknown',
            awayTeamName: teamB?.name || 'Unknown',
            tournamentId: tournament.id,
            tournamentName: tournament.name,
          },
          processed: false,
          required: true,
        });
      }
    };

    // Process all bracket rounds
    for (const round of tournament.bracket.upper) {
      addMatchEvents(round.matches);
    }

    if (tournament.bracket.lower) {
      for (const round of tournament.bracket.lower) {
        addMatchEvents(round.matches);
      }
    }

    if (tournament.bracket.middle) {
      for (const round of tournament.bracket.middle) {
        addMatchEvents(round.matches);
      }
    }

    // Add grand final only if ready
    if (tournament.bracket.grandfinal && tournament.bracket.grandfinal.status === 'ready') {
      const gf = tournament.bracket.grandfinal;
      if (gf.teamAId && gf.teamBId) {
        const teamA = state.teams[gf.teamAId];
        const teamB = state.teams[gf.teamBId];

        events.push({
          id: `event-match-${gf.matchId}`,
          type: 'match',
          date: gf.scheduledDate || tournament.endDate,
          data: {
            matchId: gf.matchId,
            homeTeamId: gf.teamAId,
            awayTeamId: gf.teamBId,
            homeTeamName: teamA?.name || 'Unknown',
            awayTeamName: teamB?.name || 'Unknown',
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            isGrandFinal: true,
          },
          processed: false,
          required: true,
        });
      }
    }

    state.addCalendarEvents(events);
  }

  /**
   * Count ready matches in a bracket (matches with status 'ready')
   */
  private countReadyMatches(bracket: {
    upper: { matches: BracketMatch[] }[];
    lower?: { matches: BracketMatch[] }[];
    middle?: { matches: BracketMatch[] }[];
    grandfinal?: BracketMatch;
  }): number {
    let count = 0;

    for (const round of bracket.upper) {
      count += round.matches.filter(m => m.status === 'ready').length;
    }

    if (bracket.lower) {
      for (const round of bracket.lower) {
        count += round.matches.filter(m => m.status === 'ready').length;
      }
    }

    if (bracket.middle) {
      for (const round of bracket.middle) {
        count += round.matches.filter(m => m.status === 'ready').length;
      }
    }

    if (bracket.grandfinal && bracket.grandfinal.status === 'ready') {
      count += 1;
    }

    return count;
  }

  /**
   * Schedule and create calendar events for newly-ready matches after a bracket match is completed
   * This is called after advanceTournament() updates the bracket
   */
  private scheduleNewlyReadyMatches(tournament: Tournament): void {
    const state = useGameStore.getState();
    const currentDate = state.calendar.currentDate;
    const events: CalendarEvent[] = [];

    // Deep clone bracket to avoid mutating store state directly
    // This is critical for Zustand immutability - we must not mutate objects in the store
    const bracket: BracketStructure = JSON.parse(JSON.stringify(tournament.bracket));

    // Helper to process matches in a round (now mutates cloned bracket)
    const processMatches = (matches: BracketMatch[]) => {
      for (const bracketMatch of matches) {
        // Only process ready matches that don't have a scheduled date yet
        if (bracketMatch.status !== 'ready') continue;
        if (!bracketMatch.teamAId || !bracketMatch.teamBId) continue;
        if (bracketMatch.scheduledDate) continue; // Already scheduled

        // Schedule for the next day after current date
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        bracketMatch.scheduledDate = nextDay.toISOString();

        // Get team names
        const teamA = state.teams[bracketMatch.teamAId];
        const teamB = state.teams[bracketMatch.teamBId];

        // Create calendar event
        events.push({
          id: `event-match-${bracketMatch.matchId}`,
          type: 'match',
          date: bracketMatch.scheduledDate,
          data: {
            matchId: bracketMatch.matchId,
            homeTeamId: bracketMatch.teamAId,
            awayTeamId: bracketMatch.teamBId,
            homeTeamName: teamA?.name || 'Unknown',
            awayTeamName: teamB?.name || 'Unknown',
            tournamentId: tournament.id,
            tournamentName: tournament.name,
          },
          processed: false,
          required: true,
        });
      }
    };

    // Process all bracket rounds (using cloned bracket)
    for (const round of bracket.upper) {
      processMatches(round.matches);
    }

    if (bracket.lower) {
      for (const round of bracket.lower) {
        processMatches(round.matches);
      }
    }

    if (bracket.middle) {
      for (const round of bracket.middle) {
        processMatches(round.matches);
      }
    }

    // Handle grand final (using cloned bracket)
    const gf = bracket.grandfinal;
    if (gf && gf.status === 'ready' && gf.teamAId && gf.teamBId && !gf.scheduledDate) {
      gf.scheduledDate = new Date(tournament.endDate).toISOString();

      const teamA = state.teams[gf.teamAId];
      const teamB = state.teams[gf.teamBId];

      events.push({
        id: `event-match-${gf.matchId}`,
        type: 'match',
        date: gf.scheduledDate,
        data: {
          matchId: gf.matchId,
          homeTeamId: gf.teamAId,
          awayTeamId: gf.teamBId,
          homeTeamName: teamA?.name || 'Unknown',
          awayTeamName: teamB?.name || 'Unknown',
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          isGrandFinal: true,
        },
        processed: false,
        required: true,
      });
    }

    // Save cloned+mutated bracket and add events to calendar
    if (events.length > 0) {
      state.updateBracket(tournament.id, bracket);
      state.addCalendarEvents(events);
    }
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
