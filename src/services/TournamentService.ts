// TournamentService - Orchestrates tournament operations with store updates
// Connects the pure competition engines with Zustand store

import { useGameStore } from '../store';
import { bracketManager, tournamentEngine } from '../engine/competition';
import { matchService } from './MatchService';
import { economyService } from './EconomyService';
import { globalTournamentScheduler } from './GlobalTournamentScheduler';
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
import { isMultiStageTournament, isLeagueToPlayoffTournament } from '../types';
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
    if (isMultiStageTournament(tournament) && tournament.currentStage === 'swiss' && tournament.swissStage) {
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
   * Saves QualificationRecord for ALL regions (not just player's).
   * Only triggers modal when ALL 4 regional kickoffs are complete.
   */
  handleKickoffCompletion(tournamentId: string): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      console.error(`Tournament not found for Kickoff completion: ${tournamentId}`);
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

    // Save qualification for ALL regions (not just player's)
    state.addQualification(record);

    // Check if all 4 kickoffs are complete - only show modal when all are done
    if (!this.areAllKickoffsComplete()) {
      return;
    }

    // All kickoffs complete - show modal with all qualifications
    const playerTeam = state.playerTeamId ? state.teams[state.playerTeamId] : null;
    if (!playerTeam) return;

    const allQualifications = state.getQualificationsForType('kickoff');
    const playerRegionQual = allQualifications.find(q => q.region === playerTeam.region);

    if (!playerRegionQual) {
      console.error('Kickoff completion: Player region qualification not found');
      return;
    }

    // Trigger modal via UISlice's existing system
    state.openModal('qualification', {
      phase: 'kickoff',
      playerRegion: playerTeam.region,
      playerRegionQualifiers: playerRegionQual,
      allRegionsQualifiers: allQualifications, // All 4 regions already available
      transitionConfigId: 'kickoff_to_masters1', // Transition to Masters Santiago
    });
  }

  /**
   * Check if all 4 regional kickoff tournaments are complete
   */
  private areAllKickoffsComplete(): boolean {
    const state = useGameStore.getState();
    const kickoffs = Object.values(state.tournaments).filter(t => t.type === 'kickoff');

    if (kickoffs.length !== 4) return false;

    return kickoffs.every(t => t.championId || t.status === 'completed');
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
    if (isMultiStageTournament(tournament) && tournament.swissStage) {
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

  // Track tournaments that have already triggered stage completion
  // Prevents duplicate calls from MatchService and CalendarService in the same cycle
  private stageCompletionTriggered: Set<string> = new Set();

  /**
   * Handle Stage 1 or Stage 2 league completion
   *
   * Shows the final league standings and triggers the transition to Stage Playoffs.
   * Top 8 teams qualify for the regional playoffs.
   *
   * For league_to_playoff tournaments, this triggers an internal stage transition
   * rather than creating a separate playoffs tournament.
   *
   * @param tournamentId - The Stage 1 or Stage 2 tournament ID
   */
  handleStageCompletion(tournamentId: string): void {
    // Guard against duplicate calls for the same tournament
    if (this.stageCompletionTriggered.has(tournamentId)) {
      console.log(`handleStageCompletion already triggered for ${tournamentId}, skipping duplicate call`);
      return;
    }
    this.stageCompletionTriggered.add(tournamentId);

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

    // Check if this is a league_to_playoff tournament (internal transition)
    // vs legacy separate tournament architecture (external transition)
    const isInternalTransition = isLeagueToPlayoffTournament(tournament);

    // Determine the next transition ID (only for legacy architecture)
    let nextTransitionId: string | undefined;
    if (!isInternalTransition) {
      if (tournament.type === 'stage1') {
        nextTransitionId = 'stage1_to_stage1_playoffs';
      } else if (tournament.type === 'stage2') {
        nextTransitionId = 'stage2_to_stage2_playoffs';
      }
    }

    // For league_to_playoff format, don't mark as completed yet
    // The transition will update the stage, not complete the tournament
    if (!isInternalTransition) {
      state.updateTournament(tournamentId, { status: 'completed' });
    }

    // Trigger modal via UISlice
    state.openModal('stage_completion', {
      tournamentId,
      tournamentName: tournament.name,
      stageType: tournament.type, // 'stage1' or 'stage2'
      standings,
      qualifiedTeams,
      playerQualified,
      playerPlacement,
      nextTransitionId,           // undefined for internal transitions
      internalTransition: isInternalTransition,  // Flag for modal to handle differently
    });

    console.log(`Stage tournament ${tournament.name} league phase completed. Top 8 qualified for playoffs.`);
  }

  /**
   * Check if Stage 1 or Stage 2 league is complete
   * Returns true if all league matches for the stage have been played
   *
   * For league_to_playoff tournaments, checks if:
   * 1. Tournament is in 'league' stage
   * 2. All league matches are completed
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
    // For league_to_playoff format: check if in 'league' stage
    // For legacy format: exclude Playoffs by name
    const stageTournament = Object.values(state.tournaments).find((t) => {
      if (t.type !== stageType) return false;
      if (t.region !== playerTeam.region) return false;

      // For league_to_playoff format
      if (isLeagueToPlayoffTournament(t)) {
        // Must be in league stage (not already transitioned to playoffs)
        return t.currentStage === 'league';
      }

      // Legacy format: exclude completed and Playoffs tournaments
      return t.status !== 'completed' && !t.name.includes('Playoffs');
    });

    if (!stageTournament) {
      return { complete: false, tournamentId: null };
    }

    // For league_to_playoff format, check league stage matches
    if (isLeagueToPlayoffTournament(stageTournament) && stageTournament.leagueStage) {
      const leagueBracket = stageTournament.leagueStage.bracket;
      let completedMatches = 0;
      let totalMatches = 0;

      for (const round of leagueBracket.upper) {
        for (const match of round.matches) {
          totalMatches++;
          if (match.status === 'completed') {
            completedMatches++;
          }
        }
      }

      return {
        complete: totalMatches > 0 && completedMatches === totalMatches,
        tournamentId: stageTournament.id,
      };
    }

    // Legacy format: count matches from store
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
   * Calculate league standings from tournament-specific standings
   * Used for Stage 1/2 tournaments where matches aren't in a bracket
   * Takes standings from tournament.standings (updated per-tournament, reset between phases)
   */
  calculateLeagueStandings(tournamentId: string): StandingsEntry[] {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      return [];
    }

    // Build standings from tournament.standings (per-tournament stats, not career stats)
    // This ensures Stage 1 shows only Stage 1 results, not cumulative career stats
    const standings: StandingsEntry[] = tournament.teamIds.map((teamId) => {
      const team = state.teams[teamId];
      // Find this team's tournament-specific standing
      const tournamentStanding = tournament.standings?.find(s => s.teamId === teamId);

      return {
        teamId,
        teamName: team?.name || 'Unknown',
        wins: tournamentStanding?.wins || 0,
        losses: tournamentStanding?.losses || 0,
        roundDiff: tournamentStanding?.roundDiff || 0,
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

    if (!tournament.swissStage) {
      console.error(`Tournament has no Swiss stage: ${tournamentId}`);
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

    if (!tournament.swissStage) {
      console.error(`Tournament has no Swiss stage: ${tournamentId}`);
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

    if (!tournament.swissStage) {
      console.error(`Tournament has no Swiss stage: ${tournamentId}`);
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
      tournament.playoffOnlyTeamIds || [],
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
   * Transition a Stage tournament from League to Playoffs
   * Called when league stage is complete (all round-robin matches played)
   *
   * Similar to transitionToPlayoffs() for Swiss tournaments.
   * Top 8 teams from league standings qualify for double elimination playoffs.
   */
  transitionLeagueToPlayoffs(tournamentId: string): boolean {
    console.log(`transitionLeagueToPlayoffs called for tournament: ${tournamentId}`);

    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament || !isLeagueToPlayoffTournament(tournament)) {
      console.error(`Invalid tournament for league-to-playoff transition: ${tournamentId}`);
      return false;
    }

    if (tournament.currentStage !== 'league') {
      console.log(`Tournament ${tournamentId} already in ${tournament.currentStage} stage, skipping transition`);
      return false;
    }

    console.log(`  Tournament name: ${tournament.name}, currentStage: ${tournament.currentStage}`);

    // Get top 8 teams from league standings
    const standings = tournament.leagueStage?.standings || tournament.standings || [];
    const sortedStandings = [...standings].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff;
      return b.mapDiff - a.mapDiff;
    });

    const qualifiedTeamIds = sortedStandings.slice(0, 8).map(s => s.teamId);

    if (qualifiedTeamIds.length < 8) {
      console.error(`Not enough qualified teams for playoffs: ${qualifiedTeamIds.length}`);
      return false;
    }

    console.log(`Transitioning ${tournament.name} from league to playoffs with teams:`,
      qualifiedTeamIds.map(id => state.teams[id]?.name || id).join(', ')
    );

    // Generate double elimination playoff bracket
    const playoffBracket = bracketManager.generateDoubleElimination(qualifiedTeamIds);

    // Prefix match IDs with tournament ID for uniqueness
    const prefix = tournamentId.slice(-12);
    this.prefixBracketMatchIds(playoffBracket, prefix);

    // Update tournament with playoff bracket
    state.updateTournament(tournamentId, {
      bracket: playoffBracket,
    });

    // Set current stage to playoff
    state.setTournamentCurrentStage(tournamentId, 'playoff');

    // Get fresh state after updates
    const freshState = useGameStore.getState();
    const updatedTournament = freshState.tournaments[tournamentId];

    if (updatedTournament) {
      // Schedule playoff matches starting from tomorrow
      // The tournament's designated playoff period will be respected
      this.schedulePlayoffMatches(updatedTournament);

      // Save the updated bracket with scheduled dates back to store
      freshState.updateBracket(tournamentId, updatedTournament.bracket);

      // Get fresh state again after bracket update
      const finalState = useGameStore.getState();
      const finalTournament = finalState.tournaments[tournamentId];

      if (!finalTournament) return false;

      // Create Match entities for ready matches
      this.createMatchEntitiesForReadyBracketMatches(finalTournament);

      // Add calendar events for playoff matches
      this.addPlayoffCalendarEvents(finalTournament);
    }

    // Clear the stage completion flag for this tournament
    // (it's now in playoffs stage, so can't trigger stage completion again anyway)
    this.stageCompletionTriggered.delete(tournamentId);

    console.log(`Stage tournament ${tournament.name} transitioned to playoffs`);
    return true;
  }

  /**
   * Add calendar events specifically for playoff matches
   * Used when transitioning from league/swiss to playoffs mid-tournament
   */
  private addPlayoffCalendarEvents(tournament: Tournament): void {
    const state = useGameStore.getState();
    const events: CalendarEvent[] = [];

    console.log(`addPlayoffCalendarEvents for ${tournament.name}:`);
    console.log(`  Upper bracket rounds: ${tournament.bracket.upper.length}`);
    console.log(`  Lower bracket rounds: ${tournament.bracket.lower?.length || 0}`);

    // Determine the correct phase for these playoff matches
    // stage1 tournament playoffs -> stage1_playoffs phase
    // stage2 tournament playoffs -> stage2_playoffs phase
    const playoffPhase = tournament.type === 'stage1' ? 'stage1_playoffs'
                       : tournament.type === 'stage2' ? 'stage2_playoffs'
                       : undefined;

    const addMatchEvents = (matches: BracketMatch[], isGrandFinal: boolean = false) => {
      for (const bracketMatch of matches) {
        console.log(`  Checking match ${bracketMatch.matchId}: status=${bracketMatch.status}, teamA=${bracketMatch.teamAId}, teamB=${bracketMatch.teamBId}, date=${bracketMatch.scheduledDate}`);
        if (bracketMatch.status !== 'ready') {
          console.log(`    Skipping - not ready`);
          continue;
        }
        if (!bracketMatch.teamAId || !bracketMatch.teamBId) {
          console.log(`    Skipping - missing teams`);
          continue;
        }

        // Skip if event already exists
        const eventId = `event-match-${bracketMatch.matchId}`;
        const existingEvent = state.calendar.scheduledEvents.find(e => e.id === eventId);
        if (existingEvent) {
          console.log(`    Skipping - event already exists`);
          continue;
        }
        console.log(`    Adding event for date ${bracketMatch.scheduledDate}`);

        const teamA = state.teams[bracketMatch.teamAId];
        const teamB = state.teams[bracketMatch.teamBId];

        events.push({
          id: eventId,
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
            isGrandFinal,
            isPlayoffMatch: true,
            phase: playoffPhase,
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

    // Handle grand final
    if (tournament.bracket.grandfinal) {
      addMatchEvents([tournament.bracket.grandfinal], true);
    }

    if (events.length > 0) {
      console.log(`  Adding ${events.length} calendar events for playoff matches:`);
      for (const event of events) {
        const data = event.data as { matchId: string; phase?: string };
        console.log(`    - ${event.id} on ${event.date.slice(0, 10)} (matchId: ${data.matchId}, phase: ${data.phase})`);
      }
      state.addCalendarEvents(events);
    }
  }

  /**
   * Helper to prefix all match IDs in a bracket for uniqueness
   */
  private prefixBracketMatchIds(bracket: BracketStructure, prefix: string): void {
    const prefixId = (id: string) => id.startsWith(prefix) ? id : `${prefix}-${id}`;

    const updateDestination = (dest: { type: string; matchId?: string }) => {
      if (dest.type === 'match' && dest.matchId) {
        dest.matchId = prefixId(dest.matchId);
      }
    };

    const updateSource = (source: { type: string; matchId?: string }) => {
      if ((source.type === 'winner' || source.type === 'loser') && source.matchId) {
        source.matchId = prefixId(source.matchId);
      }
    };

    const processRound = (round: { roundId: string; matches: BracketMatch[] }) => {
      round.roundId = prefixId(round.roundId);
      for (const match of round.matches) {
        match.matchId = prefixId(match.matchId);
        match.roundId = prefixId(match.roundId);
        updateSource(match.teamASource);
        updateSource(match.teamBSource);
        updateDestination(match.winnerDestination);
        updateDestination(match.loserDestination);
      }
    };

    for (const round of bracket.upper) {
      processRound(round);
    }

    if (bracket.lower) {
      for (const round of bracket.lower) {
        processRound(round);
      }
    }

    if (bracket.grandfinal) {
      const gf = bracket.grandfinal;
      gf.matchId = prefixId(gf.matchId);
      gf.roundId = prefixId(gf.roundId);
      updateSource(gf.teamASource);
      updateSource(gf.teamBSource);
      updateDestination(gf.winnerDestination);
      updateDestination(gf.loserDestination);
    }
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

    if (!swissStage) {
      console.error(`Tournament has no Swiss stage: ${tournamentId}`);
      return false;
    }

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

      if (!tournament || !isMultiStageTournament(tournament) || !tournament.swissStage) {
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
    if (finalTournament && isMultiStageTournament(finalTournament) && finalTournament.swissStage) {
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

    if (!tournament || !isMultiStageTournament(tournament) || !tournament.swissStage) {
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
   * Uses proper match days based on tournament region (International for Masters)
   */
  private createMatchEntitiesForSwissRound(
    tournament: MultiStageTournament,
    roundNumber: number
  ): void {
    const state = useGameStore.getState();

    if (!tournament.swissStage) return;

    const round = tournament.swissStage.rounds.find(r => r.roundNumber === roundNumber);

    if (!round) return;

    const events: CalendarEvent[] = [];
    const currentDate = state.calendar.currentDate;

    // Get proper match days for the tournament
    const region = tournament.region === 'International' ? 'International' : tournament.region;
    const matchDays = globalTournamentScheduler.getMatchDays(region);

    // Find next valid match day AFTER current date
    // This is critical: when generating Round N+1 after Round N completes on day X,
    // day X's events have already been processed and the day is about to advance.
    // Scheduling matches for day X would put them in the past.
    const tomorrow = new Date(currentDate);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    let matchDate = globalTournamentScheduler.getNextMatchDay(tomorrow, matchDays);

    // Ensure match date is within tournament range
    const tournamentStart = new Date(tournament.startDate);
    const tournamentEnd = new Date(tournament.endDate);
    if (matchDate < tournamentStart) matchDate = globalTournamentScheduler.getNextMatchDay(tournamentStart, matchDays);
    if (matchDate > tournamentEnd) matchDate = globalTournamentScheduler.getLastMatchDayBefore(tournamentEnd, matchDays);

    for (const swissMatch of round.matches) {
      if (swissMatch.status === 'ready' && swissMatch.teamAId && swissMatch.teamBId) {
        // Set scheduled date on proper match day if not set
        if (!swissMatch.scheduledDate) {
          swissMatch.scheduledDate = matchDate.toISOString();
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
    console.log(`Creating Match entities for tournament ${tournament.id} (stage: ${isMultiStageTournament(tournament) ? (tournament as MultiStageTournament).currentStage : 'N/A'})`);

    const processMatches = (matches: BracketMatch[]) => {
      for (const bracketMatch of matches) {
        // Only create Match entities for ready matches with known teams
        if (bracketMatch.status === 'ready' && bracketMatch.teamAId && bracketMatch.teamBId) {
          // Check if Match already exists
          const existingMatch = state.matches[bracketMatch.matchId];
          if (existingMatch) {
            console.log(`  Match ${bracketMatch.matchId} already exists (tournamentId: ${existingMatch.tournamentId}, date: ${existingMatch.scheduledDate}), skipping`);
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
   * Schedule playoff matches using proper match days
   * Used when transitioning from Swiss to playoffs mid-tournament
   */
  private schedulePlayoffMatches(tournament: Tournament): void {
    const state = useGameStore.getState();
    const currentCalendarDate = state.calendar.currentDate;

    // Determine region for match days
    const region = tournament.region === 'International' ? 'International' : tournament.region;

    // Start scheduling from the day AFTER current date (today's events already processed)
    const tomorrow = new Date(currentCalendarDate);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const startDate = tomorrow;

    // Ensure endDate is in the future - if tournament.endDate has passed,
    // extend it to accommodate the playoff bracket
    // Estimate: ~7-10 match days for a typical playoff bracket (8 teams double elim)
    let endDate = new Date(tournament.endDate);
    if (endDate <= startDate) {
      // Tournament end date is in the past, extend it
      // Add 14 days from startDate to ensure enough match days
      endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 14);
      console.log(`  Tournament endDate was in the past, extended to ${endDate.toISOString()}`);
    }

    console.log(`Scheduling playoff matches from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Use GlobalTournamentScheduler to schedule all bracket matches on proper match days
    globalTournamentScheduler.scheduleAllBracketMatches(
      tournament.bracket,
      startDate,
      endDate,
      region
    );

    console.log(`  Playoff matches scheduled using ${region} match days`);
  }

  /**
   * Schedule tournament matches on the calendar
   * With upfront scheduling, matches should already have dates set by GlobalTournamentScheduler.
   * This method now only handles fallback cases for matches without dates.
   */
  private scheduleTournamentMatches(tournament: Tournament): void {
    // Matches should already have scheduledDate from GlobalTournamentScheduler.
    // This is now just a fallback for any matches that somehow don't have dates.
    const fallbackDate = tournament.startDate;

    const assignFallbackDate = (matches: BracketMatch[]) => {
      for (const match of matches) {
        if (match.status === 'ready' && !match.scheduledDate) {
          console.warn(`Match ${match.matchId} missing scheduled date, using fallback: ${fallbackDate}`);
          match.scheduledDate = fallbackDate;
        }
      }
    };

    for (const round of tournament.bracket.upper) {
      assignFallbackDate(round.matches);
    }

    if (tournament.bracket.lower) {
      for (const round of tournament.bracket.lower) {
        assignFallbackDate(round.matches);
      }
    }

    if (tournament.bracket.middle) {
      for (const round of tournament.bracket.middle) {
        assignFallbackDate(round.matches);
      }
    }

    if (tournament.bracket.grandfinal && tournament.bracket.grandfinal.status === 'ready') {
      if (!tournament.bracket.grandfinal.scheduledDate) {
        console.warn(`Grand final ${tournament.bracket.grandfinal.matchId} missing scheduled date, using tournament end date`);
        tournament.bracket.grandfinal.scheduledDate = tournament.endDate;
      }
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
   * Create calendar events for newly-ready matches after a bracket match is completed.
   * With upfront scheduling, matches should already have dates assigned.
   * This method only creates calendar events for the newly-ready matches.
   */
  private scheduleNewlyReadyMatches(tournament: Tournament): void {
    const state = useGameStore.getState();
    const events: CalendarEvent[] = [];

    console.log(`scheduleNewlyReadyMatches called for tournament ${tournament.id}`);

    // Helper to process matches - only create calendar events for ready matches with teams
    const processMatches = (matches: BracketMatch[], isGrandFinal: boolean = false) => {
      for (const bracketMatch of matches) {
        // Only process ready matches with both teams known
        if (bracketMatch.status !== 'ready') continue;
        if (!bracketMatch.teamAId || !bracketMatch.teamBId) continue;

        // Check if calendar event already exists
        const eventId = `event-match-${bracketMatch.matchId}`;
        const existingEvent = state.calendar.scheduledEvents.find(e => e.id === eventId);
        if (existingEvent) {
          console.log(`  Match ${bracketMatch.matchId} already has calendar event`);
          continue;
        }

        // Warn if match doesn't have a scheduled date (shouldn't happen with upfront scheduling)
        if (!bracketMatch.scheduledDate) {
          console.warn(`  Match ${bracketMatch.matchId} missing scheduled date! Using tournament ${isGrandFinal ? 'end' : 'start'} date as fallback.`);
          bracketMatch.scheduledDate = isGrandFinal ? tournament.endDate : tournament.startDate;
        }

        console.log(`  Creating calendar event for newly-ready match ${bracketMatch.matchId} on ${bracketMatch.scheduledDate}`);

        // Get team names
        const teamA = state.teams[bracketMatch.teamAId];
        const teamB = state.teams[bracketMatch.teamBId];

        // Create calendar event
        events.push({
          id: eventId,
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
            isGrandFinal,
          },
          processed: false,
          required: true,
        });
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

    // Handle grand final
    if (tournament.bracket.grandfinal) {
      processMatches([tournament.bracket.grandfinal], true);
    }

    // Add events to calendar
    if (events.length > 0) {
      console.log(`  Adding ${events.length} calendar events for newly-ready matches`);
      state.addCalendarEvents(events);
    } else {
      console.log(`  No newly-ready matches need calendar events`);
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
