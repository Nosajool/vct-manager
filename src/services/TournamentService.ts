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
  MultiStageTournament,
  SwissStage,
  SwissTeamRecord,
} from '../types';
import { isMultiStageTournament } from '../types';
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
   * Handles both bracket matches and Swiss stage matches
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

    // Check if this is a Swiss stage match
    if (isMultiStageTournament(tournament) && tournament.currentStage === 'swiss') {
      // Check if match ID is a Swiss match
      const isSwissMatch = tournament.swissStage.rounds.some(
        round => round.matches.some(m => m.matchId === bracketMatchId)
      );

      if (isSwissMatch) {
        return this.advanceSwissMatch(tournamentId, bracketMatchId, result);
      }
    }

    // Standard bracket match handling
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
      console.log(`After bracket update, scheduling newly-ready matches...`);
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

        // Handle Masters/Champions completion - show results modal
        if (tournament.type === 'masters' || tournament.type === 'champions') {
          this.handleMastersCompletion(tournamentId);
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
      transitionConfigId: 'kickoff_to_masters1', // Transition to Masters Santiago
    });
  }

  /**
   * Handle Masters/Champions tournament completion - show results modal
   * Follows pattern: getState() -> engine calls -> state updates
   *
   * Shows the final tournament results including:
   * - Swiss Stage standings (for swiss_to_playoff format)
   * - Playoff bracket results
   * - Final placements and prize money
   */
  handleMastersCompletion(tournamentId: string): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      console.error(`Tournament not found for Masters completion: ${tournamentId}`);
      return;
    }

    // Get final placements from bracket
    const placementsMap = bracketManager.getFinalPlacements(tournament.bracket);

    // Build final placements array with team names and prize amounts
    const finalPlacements: Array<{
      teamId: string;
      teamName: string;
      placement: number;
      prize: number;
    }> = [];

    // Get prize pool
    const prizePool = tournament.prizePool;

    // Map placement to prize amounts
    const prizeMap: Record<number, number> = {
      1: prizePool.first,
      2: prizePool.second,
      3: prizePool.third,
      4: prizePool.fourth || 0,
      5: prizePool.fifthSixth || 0,
      6: prizePool.fifthSixth || 0,
      7: prizePool.seventhEighth || 0,
      8: prizePool.seventhEighth || 0,
    };

    for (const [placement, teamId] of Object.entries(placementsMap)) {
      if (teamId) {
        const placementNum = parseInt(placement);
        finalPlacements.push({
          teamId,
          teamName: state.teams[teamId]?.name || 'Unknown',
          placement: placementNum,
          prize: prizeMap[placementNum] || 0,
        });
      }
    }

    // Sort by placement
    finalPlacements.sort((a, b) => a.placement - b.placement);

    // Get Swiss stage standings if this is a swiss_to_playoff tournament
    let swissStandings: SwissTeamRecord[] = [];
    if (isMultiStageTournament(tournament)) {
      swissStandings = tournament.swissStage.standings;
    }

    // Get champion info
    const championId = tournament.championId || placementsMap[1] || '';
    const championName = state.teams[championId]?.name || 'Unknown';

    // Check player team placement
    const playerTeamId = state.playerTeamId;
    let playerTeamPlacement: { placement: number; prize: number; qualifiedFromSwiss: boolean } | undefined;

    if (playerTeamId) {
      const playerResult = finalPlacements.find((p) => p.teamId === playerTeamId);
      if (playerResult) {
        // Check if player's team was in Swiss stage
        const wasInSwiss = swissStandings.some((s) => s.teamId === playerTeamId);
        playerTeamPlacement = {
          placement: playerResult.placement,
          prize: playerResult.prize,
          qualifiedFromSwiss: wasInSwiss,
        };
      }
    }

    // Determine the next transition based on tournament type
    // Masters 1 (Santiago) → Stage 1, Masters 2 (London) → Stage 2
    let nextTransitionId: string | undefined;
    if (tournament.type === 'masters') {
      // Check which Masters this is based on the current phase
      const currentPhase = state.calendar.currentPhase;
      if (currentPhase === 'masters1') {
        nextTransitionId = 'masters1_to_stage1';
      } else if (currentPhase === 'masters2') {
        nextTransitionId = 'masters2_to_stage2';
      }
    }
    // Note: Champions doesn't transition to anything (end of season)

    // Trigger modal via UISlice
    state.openModal('masters_completion', {
      tournamentId,
      tournamentName: tournament.name,
      championId,
      championName,
      finalPlacements,
      swissStandings,
      playerTeamPlacement,
      nextTransitionId, // Pass transition ID to modal
    });

    console.log(`Masters tournament ${tournament.name} completed. Champion: ${championName}`);
  }

  /**
   * Handle Stage 1 or Stage 2 league completion
   *
   * Shows the final league standings and triggers the transition to Stage Playoffs.
   * Top 8 teams qualify for the regional playoffs.
   *
   * @param tournamentId - The Stage 1 or Stage 2 tournament ID
   */
  handleStageCompletion(tournamentId: string): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      console.error(`Tournament not found for Stage completion: ${tournamentId}`);
      return;
    }

    // Calculate final league standings
    const standings = this.calculateLeagueStandings(tournamentId);

    // Top 8 qualify for Stage Playoffs
    const qualifiedTeams = standings.slice(0, 8).map((entry) => ({
      teamId: entry.teamId,
      teamName: entry.teamName,
      placement: entry.placement || 0,
      wins: entry.wins,
      losses: entry.losses,
      roundDiff: entry.roundDiff,
    }));

    // Check player's team qualification status
    const playerTeamId = state.playerTeamId;
    let playerQualified = false;
    let playerPlacement: number | undefined;

    if (playerTeamId) {
      const playerEntry = standings.find((s) => s.teamId === playerTeamId);
      if (playerEntry) {
        playerPlacement = playerEntry.placement;
        playerQualified = (playerEntry.placement || 0) <= 8;
      }
    }

    // Determine the next transition
    // Stage 1 → Stage 1 Playoffs, Stage 2 → Stage 2 Playoffs
    let nextTransitionId: string | undefined;
    if (tournament.type === 'stage1') {
      nextTransitionId = 'stage1_to_stage1_playoffs';
    } else if (tournament.type === 'stage2') {
      nextTransitionId = 'stage2_to_stage2_playoffs';
    }

    // Mark tournament as completed
    state.updateTournament(tournamentId, { status: 'completed' });

    // Trigger modal via UISlice
    state.openModal('stage_completion', {
      tournamentId,
      tournamentName: tournament.name,
      stageType: tournament.type, // 'stage1' or 'stage2'
      standings,
      qualifiedTeams,
      playerQualified,
      playerPlacement,
      nextTransitionId,
    });

    console.log(`Stage tournament ${tournament.name} completed. Top 8 qualified for playoffs.`);
  }

  /**
   * Check if Stage 1 or Stage 2 league is complete
   * Returns true if all league matches for the stage have been played
   */
  isStageComplete(stageType: 'stage1' | 'stage2'): { complete: boolean; tournamentId: string | null } {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;

    if (!playerTeamId) {
      return { complete: false, tournamentId: null };
    }

    const playerTeam = state.teams[playerTeamId];
    if (!playerTeam) {
      return { complete: false, tournamentId: null };
    }

    // Find the Stage tournament for player's region
    const stageTournament = Object.values(state.tournaments).find(
      (t) =>
        t.type === stageType &&
        t.region === playerTeam.region &&
        t.status !== 'completed'
    );

    if (!stageTournament) {
      return { complete: false, tournamentId: null };
    }

    // Count matches for this stage tournament
    const stageMatches = Object.values(state.matches).filter(
      (m) => m.tournamentId === stageTournament.id
    );

    if (stageMatches.length === 0) {
      return { complete: false, tournamentId: stageTournament.id };
    }

    // Check if all matches are completed
    const allCompleted = stageMatches.every((m) => m.status === 'completed');

    return { complete: allCompleted, tournamentId: stageTournament.id };
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
   * Calculate league standings from team standings
   * Used for Stage 1/2 tournaments where matches aren't in a bracket
   * Takes standings directly from team.standings (updated by recordWin/recordLoss)
   */
  calculateLeagueStandings(tournamentId: string): StandingsEntry[] {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      return [];
    }

    // Build standings from team.standings for each team in the tournament
    const standings: StandingsEntry[] = tournament.teamIds.map((teamId) => {
      const team = state.teams[teamId];
      return {
        teamId,
        teamName: team?.name || 'Unknown',
        wins: team?.standings.wins || 0,
        losses: team?.standings.losses || 0,
        roundDiff: team?.standings.roundDiff || 0,
      };
    });

    // Sort by wins (desc), then round diff (desc)
    standings.sort((a, b) => {
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
  // Swiss Stage Methods
  // ============================================

  /**
   * Advance a Swiss match and update the stage
   * Handles qualification/elimination and round progression
   */
  advanceSwissMatch(
    tournamentId: string,
    matchId: string,
    result: MatchResult
  ): boolean {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      console.error(`Tournament not found: ${tournamentId}`);
      return false;
    }

    if (!isMultiStageTournament(tournament)) {
      console.error(`Tournament is not a multi-stage tournament: ${tournamentId}`);
      return false;
    }

    if (tournament.currentStage !== 'swiss') {
      console.error(`Tournament is not in Swiss stage: ${tournamentId}`);
      return false;
    }

    // Complete the Swiss match (pure engine call)
    const updatedSwissStage = bracketManager.completeSwissMatch(
      tournament.swissStage,
      matchId,
      result
    );

    // Update store with new Swiss stage
    state.updateSwissStage(tournamentId, updatedSwissStage);

    // Check if round is complete and need to generate next round
    if (bracketManager.isSwissRoundComplete(updatedSwissStage)) {
      // Check if Swiss stage is complete
      if (bracketManager.isSwissStageComplete(updatedSwissStage)) {
        // Transition to playoffs
        this.transitionToPlayoffs(tournamentId);
      } else if (updatedSwissStage.currentRound < updatedSwissStage.totalRounds) {
        // Generate next Swiss round
        this.generateNextSwissRound(tournamentId);
      } else {
        // Final round is complete but stage is not complete
        // This can happen if some teams didn't get paired in the final round due to:
        // - Odd number of active teams
        // - Rematch constraints preventing pairing
        // Force-complete by qualifying/eliminating remaining active teams based on standings
        console.warn(
          `Swiss stage reached totalRounds (${updatedSwissStage.totalRounds}) but stage is not complete. ` +
          `Forcing completion based on current standings.`
        );
        this.forceCompleteSwissStage(tournamentId);
      }
    }

    return true;
  }

  /**
   * Generate the next Swiss round for a tournament
   */
  generateNextSwissRound(tournamentId: string): boolean {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament || !isMultiStageTournament(tournament)) {
      console.error(`Invalid tournament for Swiss round generation: ${tournamentId}`);
      return false;
    }

    // Generate next round (pure engine call)
    const updatedSwissStage = bracketManager.generateNextSwissRound(
      tournament.swissStage,
      tournamentId
    );

    // Update store
    state.updateSwissStage(tournamentId, updatedSwissStage);

    // Create Match entities for the new round's matches
    const freshState = useGameStore.getState();
    const freshTournament = freshState.tournaments[tournamentId] as MultiStageTournament;
    if (freshTournament) {
      this.createMatchEntitiesForSwissRound(freshTournament, updatedSwissStage.currentRound);
    }

    return true;
  }

  /**
   * Transition a Masters tournament from Swiss to Playoffs
   * Called when Swiss stage is complete (4 teams qualified, 4 eliminated)
   */
  transitionToPlayoffs(tournamentId: string): boolean {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament || !isMultiStageTournament(tournament)) {
      console.error(`Invalid tournament for playoff transition: ${tournamentId}`);
      return false;
    }

    // Get Swiss qualifiers
    const swissQualifiers = bracketManager.getSwissQualifiedTeams(tournament.swissStage);

    if (swissQualifiers.length !== 4) {
      console.error(`Expected 4 Swiss qualifiers, got ${swissQualifiers.length}`);
      return false;
    }

    // Generate playoff bracket (pure engine call)
    const playoffBracket = tournamentEngine.generateMastersPlayoffBracket(
      swissQualifiers,
      tournament.playoffOnlyTeamIds,
      tournamentId
    );

    // Update tournament with playoff bracket and stage
    state.updateTournament(tournamentId, {
      bracket: playoffBracket,
    });
    state.setTournamentCurrentStage(tournamentId, 'playoff');

    // Get fresh state after updates
    const freshState = useGameStore.getState();
    const updatedTournament = freshState.tournaments[tournamentId];

    if (updatedTournament) {
      // Schedule playoff matches starting from the next day
      this.schedulePlayoffMatches(updatedTournament);
      // Save the updated bracket with scheduled dates back to store
      freshState.updateBracket(tournamentId, updatedTournament.bracket);
      // Get fresh state again after bracket update
      const finalState = useGameStore.getState();
      const finalTournament = finalState.tournaments[tournamentId];
      if (!finalTournament) return false;
      // Create Match entities for ready matches (using updated bracket)
      this.createMatchEntitiesForReadyBracketMatches(finalTournament);
      // Add calendar events for playoff matches
      this.addTournamentCalendarEvents(finalTournament);
    }

    console.log(`Masters tournament ${tournamentId} transitioned to playoffs`);
    return true;
  }

  /**
   * Force-complete the Swiss stage when totalRounds is reached but not all teams are qualified/eliminated
   * This handles edge cases where teams couldn't be paired in the final round
   * Qualifies/eliminates teams based on current standings
   */
  forceCompleteSwissStage(tournamentId: string): boolean {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament || !isMultiStageTournament(tournament)) {
      console.error(`Invalid tournament for force-completion: ${tournamentId}`);
      return false;
    }

    // Get current Swiss stage
    const swissStage = tournament.swissStage;

    // Get active teams sorted by standings
    const activeTeams = swissStage.standings
      .filter(t => t.status === 'active')
      .sort((a, b) => {
        // Sort by wins (desc), then losses (asc), then round diff (desc), then seed (asc)
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff;
        return (a.seed || 999) - (b.seed || 999);
      });

    if (activeTeams.length === 0) {
      console.warn('No active teams to force-complete');
      return false;
    }

    console.log(
      `Force-completing Swiss stage with ${activeTeams.length} active teams: `,
      activeTeams.map(t => `${state.teams[t.teamId]?.name} (${t.wins}-${t.losses})`).join(', ')
    );

    // Deep clone to avoid mutations
    const updatedSwissStage: SwissStage = JSON.parse(JSON.stringify(swissStage));

    // Calculate how many teams we still need to qualify
    const qualifiersNeeded = swissStage.winsToQualify * Math.floor(swissStage.standings.length / 2) - swissStage.qualifiedTeamIds.length;

    // Qualify top teams
    let qualified = 0;

    for (const team of activeTeams) {
      const standing = updatedSwissStage.standings.find((s: SwissTeamRecord) => s.teamId === team.teamId);
      if (!standing) continue;

      if (qualified < qualifiersNeeded) {
        // Qualify this team
        standing.status = 'qualified';
        if (!updatedSwissStage.qualifiedTeamIds.includes(standing.teamId)) {
          updatedSwissStage.qualifiedTeamIds.push(standing.teamId);
        }
        qualified++;
        console.log(`  Qualified: ${state.teams[standing.teamId]?.name} (${standing.wins}-${standing.losses})`);
      } else {
        // Eliminate this team
        standing.status = 'eliminated';
        if (!updatedSwissStage.eliminatedTeamIds.includes(standing.teamId)) {
          updatedSwissStage.eliminatedTeamIds.push(standing.teamId);
        }
        console.log(`  Eliminated: ${state.teams[standing.teamId]?.name} (${standing.wins}-${standing.losses})`);
      }
    }

    // Update store with modified Swiss stage
    state.updateSwissStage(tournamentId, updatedSwissStage);

    // Now transition to playoffs
    this.transitionToPlayoffs(tournamentId);

    return true;
  }

  /**
   * Simulate entire Swiss stage to completion
   * Returns the 4 qualified teams
   */
  simulateSwissStage(tournamentId: string): string[] {
    const state = useGameStore.getState();
    const initialTournament = state.tournaments[tournamentId];

    if (!initialTournament || !isMultiStageTournament(initialTournament)) {
      console.error(`Invalid tournament for Swiss simulation: ${tournamentId}`);
      return [];
    }

    // Ensure tournament is in progress
    if (initialTournament.status === 'upcoming') {
      this.startTournament(tournamentId);
    }

    // Simulate until Swiss is complete
    let safetyCounter = 0;
    const maxIterations = 50;

    while (safetyCounter < maxIterations) {
      // Get fresh state
      const freshState = useGameStore.getState();
      const tournament = freshState.tournaments[tournamentId];

      if (!tournament || !isMultiStageTournament(tournament)) {
        break;
      }

      const swissStage = tournament.swissStage;

      // Check if Swiss stage is complete
      if (
        tournament.currentStage === 'playoff' ||
        bracketManager.isSwissStageComplete(swissStage)
      ) {
        break;
      }

      // Get next ready Swiss match
      const currentRound = swissStage.rounds.find(
        r => r.roundNumber === swissStage.currentRound
      );

      if (!currentRound) {
        // No current round - need to generate next
        if (swissStage.currentRound < swissStage.totalRounds) {
          this.generateNextSwissRound(tournamentId);
        }
        safetyCounter++;
        continue;
      }

      const nextMatch = currentRound.matches.find(m => m.status === 'ready');

      if (!nextMatch) {
        // No ready matches in current round
        if (currentRound.completed) {
          // Round complete - check if need to generate next round
          if (
            swissStage.currentRound < swissStage.totalRounds &&
            !bracketManager.isSwissStageComplete(swissStage)
          ) {
            this.generateNextSwissRound(tournamentId);
          }
        }
        safetyCounter++;
        continue;
      }

      // Simulate the match
      const result = this.simulateSwissMatch(tournamentId, nextMatch.matchId);
      if (!result) {
        safetyCounter++;
        continue;
      }

      safetyCounter++;
    }

    // Return qualified teams
    const finalState = useGameStore.getState();
    const finalTournament = finalState.tournaments[tournamentId];
    if (finalTournament && isMultiStageTournament(finalTournament)) {
      return bracketManager.getSwissQualifiedTeams(finalTournament.swissStage);
    }

    return [];
  }

  /**
   * Simulate a single Swiss match
   */
  private simulateSwissMatch(tournamentId: string, matchId: string): MatchResult | null {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament || !isMultiStageTournament(tournament)) {
      return null;
    }

    // Find the match in Swiss rounds
    let swissMatch: BracketMatch | undefined;
    for (const round of tournament.swissStage.rounds) {
      swissMatch = round.matches.find(m => m.matchId === matchId);
      if (swissMatch) break;
    }

    if (!swissMatch || !swissMatch.teamAId || !swissMatch.teamBId) {
      console.error(`Swiss match not found or missing teams: ${matchId}`);
      return null;
    }

    // Get or create Match entity
    let match = state.matches[matchId];
    if (!match) {
      match = matchService.createMatch(
        swissMatch.teamAId,
        swissMatch.teamBId,
        swissMatch.scheduledDate || new Date().toISOString(),
        tournamentId
      );
      // Override the match ID to use the Swiss match ID
      state.addMatch({ ...match, id: matchId });
      match = state.matches[matchId];
    }

    // Simulate the match
    const result = matchService.simulateMatch(matchId);

    if (result) {
      // Advance the Swiss stage
      this.advanceSwissMatch(tournamentId, matchId, result);
    }

    return result;
  }

  /**
   * Create Match entities and calendar events for a Swiss round
   */
  private createMatchEntitiesForSwissRound(
    tournament: MultiStageTournament,
    roundNumber: number
  ): void {
    const state = useGameStore.getState();
    const round = tournament.swissStage.rounds.find(r => r.roundNumber === roundNumber);

    if (!round) return;

    const events: CalendarEvent[] = [];
    const currentDate = state.calendar.currentDate;

    for (const swissMatch of round.matches) {
      if (swissMatch.status === 'ready' && swissMatch.teamAId && swissMatch.teamBId) {
        // Set scheduled date if not set (next day after current date)
        if (!swissMatch.scheduledDate) {
          const nextDay = new Date(currentDate);
          nextDay.setDate(nextDay.getDate() + 1);
          swissMatch.scheduledDate = nextDay.toISOString();
        }

        // Create Match entity if it doesn't exist
        if (!state.matches[swissMatch.matchId]) {
          const match: Match = {
            id: swissMatch.matchId,
            teamAId: swissMatch.teamAId,
            teamBId: swissMatch.teamBId,
            scheduledDate: swissMatch.scheduledDate,
            status: 'scheduled',
            tournamentId: tournament.id,
          };

          state.addMatch(match);
        }

        // Create calendar event if it doesn't exist
        const eventId = `event-match-${swissMatch.matchId}`;
        const existingEvent = state.calendar.scheduledEvents.find(e => e.id === eventId);
        if (!existingEvent) {
          const teamA = state.teams[swissMatch.teamAId];
          const teamB = state.teams[swissMatch.teamBId];

          events.push({
            id: eventId,
            type: 'match',
            date: swissMatch.scheduledDate,
            data: {
              matchId: swissMatch.matchId,
              homeTeamId: swissMatch.teamAId,
              awayTeamId: swissMatch.teamBId,
              homeTeamName: teamA?.name || 'Unknown',
              awayTeamName: teamB?.name || 'Unknown',
              tournamentId: tournament.id,
              tournamentName: tournament.name,
              isSwissMatch: true,
              swissRound: roundNumber,
            },
            processed: false,
            required: true,
          });
        }
      }
    }

    // Add calendar events
    if (events.length > 0) {
      state.addCalendarEvents(events);
    }

    // Update the Swiss stage with scheduled dates
    state.updateSwissStage(tournament.id, tournament.swissStage);
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
    console.log(`Creating Match entities for tournament ${tournament.id}`);

    const processMatches = (matches: BracketMatch[]) => {
      for (const bracketMatch of matches) {
        // Only create Match entities for ready matches with known teams
        if (bracketMatch.status === 'ready' && bracketMatch.teamAId && bracketMatch.teamBId) {
          // Check if Match already exists
          if (state.matches[bracketMatch.matchId]) {
            console.log(`  Match ${bracketMatch.matchId} already exists, skipping`);
            continue;
          }

          console.log(`  Creating Match entity for ${bracketMatch.matchId} (${bracketMatch.teamAId} vs ${bracketMatch.teamBId})`);

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
   * Schedule playoff matches starting from current date + 1 day
   * Used when transitioning from Swiss to playoffs mid-tournament
   */
  private schedulePlayoffMatches(tournament: Tournament): void {
    const state = useGameStore.getState();
    const currentCalendarDate = state.calendar.currentDate;

    // Start scheduling from next day
    let currentDate = new Date(currentCalendarDate);
    currentDate.setDate(currentDate.getDate() + 1);

    console.log(`Scheduling playoff matches starting from ${currentDate.toISOString()}`);

    // Count only ready matches for scheduling
    const readyMatches = this.countReadyMatches(tournament.bracket);
    console.log(`  Found ${readyMatches} ready matches to schedule`);
    const daysAvailable = Math.max(
      1,
      Math.floor(
        (new Date(tournament.endDate).getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const matchesPerDay = Math.max(1, Math.ceil(readyMatches / daysAvailable));

    let matchCount = 0;

    // Process upper bracket - only schedule ready matches
    for (const round of tournament.bracket.upper) {
      for (const match of round.matches) {
        // Only schedule ready matches with known teams
        if (match.status !== 'ready') {
          console.log(`  Skipping non-ready match ${match.matchId} in upper R${round.roundNumber} (status: ${match.status})`);
          continue;
        }

        match.scheduledDate = currentDate.toISOString();
        console.log(`  Scheduled ${match.matchId} for ${currentDate.toISOString()}`);
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
    console.log(`Adding calendar events for tournament ${tournament.id}`);
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
        if (bracketMatch.status !== 'ready') {
          console.log(`  Skipping match ${bracketMatch.matchId} - status: ${bracketMatch.status}`);
          continue;
        }
        if (!bracketMatch.teamAId || !bracketMatch.teamBId) {
          console.log(`  Skipping match ${bracketMatch.matchId} - missing teams (A: ${bracketMatch.teamAId}, B: ${bracketMatch.teamBId})`);
          continue;
        }

        console.log(`  Adding calendar event for match ${bracketMatch.matchId} on ${bracketMatch.scheduledDate}`);

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

    console.log(`Total calendar events to add: ${events.length} (${events.filter(e => e.type === 'match').length} match events)`);
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

    console.log(`scheduleNewlyReadyMatches called for tournament ${tournament.id}`);

    // Deep clone bracket to avoid mutating store state directly
    // This is critical for Zustand immutability - we must not mutate objects in the store
    const bracket: BracketStructure = JSON.parse(JSON.stringify(tournament.bracket));

    // Helper to process matches in a round (now mutates cloned bracket)
    const processMatches = (matches: BracketMatch[]) => {
      for (const bracketMatch of matches) {
        // Only process ready matches that don't have a scheduled date yet
        if (bracketMatch.status !== 'ready') continue;
        if (!bracketMatch.teamAId || !bracketMatch.teamBId) continue;
        if (bracketMatch.scheduledDate) {
          console.log(`  Match ${bracketMatch.matchId} already scheduled for ${bracketMatch.scheduledDate}`);
          continue; // Already scheduled
        }

        console.log(`  Found newly ready match ${bracketMatch.matchId} - scheduling for next day`);

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
      console.log(`  Scheduling ${events.length} newly-ready matches and adding calendar events`);
      state.updateBracket(tournament.id, bracket);
      state.addCalendarEvents(events);
    } else {
      console.log(`  No newly-ready matches found`);
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
