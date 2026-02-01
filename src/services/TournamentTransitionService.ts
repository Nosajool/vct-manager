// TournamentTransitionService - Generic tournament transition logic
// Handles phase transitions and tournament creation for all VCT phases
// Pattern: getState() -> engine calls -> store updates

import { useGameStore } from '../store';
import { tournamentEngine } from '../engine/competition';
import { regionalSimulationService } from './RegionalSimulationService';
import type {
  TournamentTransitionConfig,
  TransitionResult,
  Region,
  Tournament,
  MultiStageTournament,
  Match,
  CalendarEvent,
  BracketMatch,
  SeasonPhase,
} from '../types';
import type { QualificationRecord } from '../store/slices/competitionSlice';
import { TOURNAMENT_TRANSITIONS } from '../utils/tournament-transitions';

export class TournamentTransitionService {
  /**
   * Execute a tournament transition based on configuration
   * This is the main entry point for all transitions
   */
  executeTransition(configId: string, playerRegion?: Region): TransitionResult {
    const config = TOURNAMENT_TRANSITIONS[configId];
    if (!config) {
      return {
        success: false,
        error: `No transition configuration found for ID: ${configId}`,
      };
    }

    const state = useGameStore.getState();

    // Check if tournament already exists (idempotency)
    const tournamentName = this.resolveTournamentName(config, playerRegion);
    const existing = Object.values(state.tournaments).find((t) => t.name === tournamentName);

    if (existing) {
      console.log(`${tournamentName} already exists, returning existing tournament`);
      if (state.calendar.currentPhase !== config.toPhase) {
        state.setCurrentPhase(config.toPhase);
      }
      return {
        success: true,
        tournamentId: existing.id,
        tournamentName: existing.name,
        newPhase: config.toPhase,
      };
    }

    // Execute transition based on type
    if (config.type === 'regional_to_playoff') {
      return this.executeRegionalPlayoffTransition(config, playerRegion!);
    } else if (config.type === 'international_to_league') {
      return this.executeLeagueTransition(config);
    } else {
      return this.executeInternationalTransition(config, playerRegion);
    }
  }

  /**
   * League transition: International Tournament → Regional League
   * Example: Masters Santiago → Stage 1, Masters London → Stage 2
   *
   * This is a simple phase transition - league matches are already pre-generated
   * at game init time, so we just need to update the current phase.
   */
  private executeLeagueTransition(
    config: TournamentTransitionConfig
  ): TransitionResult {
    const state = useGameStore.getState();

    // Check if we're already in the target phase
    if (state.calendar.currentPhase === config.toPhase) {
      console.log(`Already in ${config.toPhase} phase`);
      return {
        success: true,
        newPhase: config.toPhase,
      };
    }

    // Transition to the new phase
    state.setCurrentPhase(config.toPhase);

    console.log(`Transitioned from ${config.fromPhase} to ${config.toPhase}`);

    return {
      success: true,
      newPhase: config.toPhase,
      tournamentName: config.tournamentName,
    };
  }

  /**
   * Regional transition: League → Regional Playoffs
   * Example: Stage 1 → Stage 1 Playoffs (per region)
   */
  private executeRegionalPlayoffTransition(
    config: TournamentTransitionConfig,
    region: Region
  ): TransitionResult {
    const state = useGameStore.getState();

    // Get top N teams from league standings for this region
    const teamsPerRegion = config.qualificationRules.teamsPerRegion || 8;
    const regionalTeams = Object.values(state.teams)
      .filter((t) => t.region === region)
      .sort((a, b) => {
        // Sort by wins, then round diff
        if (b.standings.wins !== a.standings.wins) {
          return b.standings.wins - a.standings.wins;
        }
        return b.standings.roundDiff - a.standings.roundDiff;
      })
      .slice(0, teamsPerRegion);

    if (regionalTeams.length < teamsPerRegion) {
      return {
        success: false,
        error: `Not enough teams in ${region} for playoffs. Need ${teamsPerRegion}, found ${regionalTeams.length}`,
      };
    }

    // Calculate start date
    const startDate = this.calculateStartDate(state.calendar.currentDate, config.daysUntilStart);

    // Create regional playoff tournament
    const tournamentName = config.tournamentName.replace('{REGION}', region);
    const tournament = tournamentEngine.createTournament(
      tournamentName,
      this.mapPhaseToCompetitionType(config.toPhase),
      config.format,
      region,
      regionalTeams.map((t) => t.id),
      startDate,
      config.prizePool
    );

    // Schedule ready matches before adding to store
    this.scheduleTournamentMatches(tournament);

    // Add to store
    state.addTournament(tournament);

    // Add calendar events and create Match entities for ready bracket matches
    this.addTournamentCalendarEvents(tournament);
    this.createMatchEntitiesForReadyBracketMatches(tournament);

    // Transition phase
    state.setCurrentPhase(config.toPhase);

    // Build qualification record
    const qualifiedTeams = regionalTeams.map((team, index) => ({
      teamId: team.id,
      teamName: team.name,
      region,
      seed: index + 1,
    }));

    return {
      success: true,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      newPhase: config.toPhase,
      qualifiedTeams,
    };
  }

  /**
   * International transition: Regional Playoffs → International Tournament
   * Example: Kickoff → Masters Santiago, Stage 1 Playoffs → Masters London
   */
  private executeInternationalTransition(
    config: TournamentTransitionConfig,
    _playerRegion?: Region
  ): TransitionResult {
    const state = useGameStore.getState();

    // Get qualifications from all regions
    const qualifications = this.getQualifications(config.qualificationSource);

    if (qualifications.length !== 4) {
      return {
        success: false,
        error: `Expected 4 regional qualifications, got ${qualifications.length}. Other regions may need to be simulated first.`,
      };
    }

    // Extract qualified teams based on rules
    const { swissParticipants, directPlayoffTeams, teamRegions } =
      this.extractQualifiedTeams(config, qualifications);

    // Validate counts
    const expectedSwiss = config.qualificationRules.swissStageTeams || 0;
    const expectedDirect = config.qualificationRules.directPlayoffTeams || 0;

    if (swissParticipants.length !== expectedSwiss) {
      console.error(
        `Expected ${expectedSwiss} Swiss participants, got ${swissParticipants.length}`
      );
    }
    if (directPlayoffTeams.length !== expectedDirect) {
      console.error(
        `Expected ${expectedDirect} direct playoff teams, got ${directPlayoffTeams.length}`
      );
    }

    // Calculate start date
    const startDate = this.calculateStartDate(state.calendar.currentDate, config.daysUntilStart);

    // Create international tournament with Swiss-to-Playoff format
    const tournament = tournamentEngine.createMastersSantiago(
      swissParticipants,
      directPlayoffTeams,
      teamRegions,
      startDate,
      config.prizePool,
      config.tournamentName // Pass custom name for flexibility
    );

    // Add to store
    state.addTournament(tournament);

    // Create Match entities for Swiss Round 1
    this.createSwissRound1MatchEntities(tournament);

    // Add calendar events
    this.addInternationalTournamentCalendarEvents(tournament);

    // Transition phase
    state.setCurrentPhase(config.toPhase);

    // Build qualified teams list
    const allQualifiedTeams = [...swissParticipants, ...directPlayoffTeams].map(
      (teamId, index) => {
        const team = state.teams[teamId];
        return {
          teamId,
          teamName: team?.name || 'Unknown',
          region: teamRegions.get(teamId) || 'Unknown',
          seed: index + 1,
        };
      }
    );

    return {
      success: true,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      newPhase: config.toPhase,
      qualifiedTeams: allQualifiedTeams,
    };
  }

  /**
   * Get qualifications for a given source
   */
  private getQualifications(source: string): QualificationRecord[] {
    const state = useGameStore.getState();
    return Object.values(state.qualifications).filter((q) => q.tournamentType === source);
  }

  /**
   * Extract qualified teams from qualifications based on rules
   */
  private extractQualifiedTeams(
    config: TournamentTransitionConfig,
    qualifications: QualificationRecord[]
  ): {
    swissParticipants: string[];
    directPlayoffTeams: string[];
    teamRegions: Map<string, string>;
  } {
    const swissParticipants: string[] = [];
    const directPlayoffTeams: string[] = [];
    const teamRegions = new Map<string, string>();

    // Handle Kickoff qualifications (alpha/beta/omega brackets)
    if (config.qualificationRules.teamsFromKickoff) {
      const rules = config.qualificationRules.teamsFromKickoff;

      for (const qual of qualifications) {
        for (const team of qual.qualifiedTeams) {
          teamRegions.set(team.teamId, qual.region);

          if (team.bracket === 'alpha' && rules.alpha > 0) {
            directPlayoffTeams.push(team.teamId);
          } else if (
            (team.bracket === 'beta' || team.bracket === 'omega') &&
            (rules.beta > 0 || rules.omega > 0)
          ) {
            swissParticipants.push(team.teamId);
          }
        }
      }
    }

    // Handle Playoff qualifications (winners/runnersUp/thirdPlace)
    if (config.qualificationRules.teamsFromPlayoffs) {
      const rules = config.qualificationRules.teamsFromPlayoffs;

      for (const qual of qualifications) {
        const teams = qual.qualifiedTeams;

        for (let i = 0; i < teams.length; i++) {
          const team = teams[i];
          teamRegions.set(team.teamId, qual.region);

          if (i === 0 && rules.winners > 0) {
            directPlayoffTeams.push(team.teamId);
          } else if (i === 1 && rules.runnersUp > 0) {
            swissParticipants.push(team.teamId);
          } else if (i === 2 && rules.thirdPlace > 0) {
            swissParticipants.push(team.teamId);
          }
        }
      }
    }

    return { swissParticipants, directPlayoffTeams, teamRegions };
  }

  /**
   * Create Match entities for Swiss Round 1
   */
  private createSwissRound1MatchEntities(tournament: MultiStageTournament): void {
    const state = useGameStore.getState();
    const round1 = tournament.swissStage.rounds[0];

    if (!round1) return;

    for (const match of round1.matches) {
      if (match.teamAId && match.teamBId) {
        const matchEntity: Match = {
          id: match.matchId,
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          scheduledDate: match.scheduledDate || tournament.startDate,
          status: 'scheduled',
          tournamentId: tournament.id,
        };

        state.addMatch(matchEntity);
      }
    }
  }

  /**
   * Add international tournament calendar events
   */
  private addInternationalTournamentCalendarEvents(tournament: MultiStageTournament): void {
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

    // Add Swiss Round 1 match events
    const round1 = tournament.swissStage.rounds[0];
    const tournamentPhase = this.getPhaseForTournament(tournament);

    if (round1) {
      for (const match of round1.matches) {
        if (match.teamAId && match.teamBId) {
          const teamA = state.teams[match.teamAId];
          const teamB = state.teams[match.teamBId];

          events.push({
            id: `event-match-${match.matchId}`,
            type: 'match',
            date: match.scheduledDate || tournament.startDate,
            data: {
              matchId: match.matchId,
              homeTeamId: match.teamAId,
              awayTeamId: match.teamBId,
              homeTeamName: teamA?.name || 'Unknown',
              awayTeamName: teamB?.name || 'Unknown',
              tournamentId: tournament.id,
              tournamentName: tournament.name,
              isSwissMatch: true,
              phase: tournamentPhase,
            },
            processed: false,
            required: true,
          });
        }
      }
    }

    state.addCalendarEvents(events);
  }

  /**
   * Calculate tournament start date
   */
  private calculateStartDate(currentDate: string, daysUntilStart: number): Date {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + daysUntilStart);
    return date;
  }

  /**
   * Resolve tournament name (replace placeholders like {REGION})
   */
  private resolveTournamentName(config: TournamentTransitionConfig, region?: Region): string {
    if (!region) return config.tournamentName;
    return config.tournamentName.replace('{REGION}', region);
  }

  /**
   * Map SeasonPhase to CompetitionType
   */
  private mapPhaseToCompetitionType(phase: string): 'kickoff' | 'stage1' | 'stage2' | 'masters' | 'champions' {
    if (phase.includes('kickoff')) return 'kickoff';
    if (phase.includes('stage1')) return 'stage1';
    if (phase.includes('stage2')) return 'stage2';
    if (phase.includes('masters')) return 'masters';
    if (phase.includes('champions')) return 'champions';
    return 'kickoff'; // fallback
  }

  /**
   * Simulate other regions' tournaments (for international transitions)
   * This ensures all 4 regions have completed before creating international tournament
   */
  simulateOtherRegions(playerRegion: Region, _qualificationSource: string): QualificationRecord[] {
    return regionalSimulationService.simulateOtherKickoffs(playerRegion);
  }

  /**
   * Get the SeasonPhase for a tournament based on its type and name
   */
  private getPhaseForTournament(tournament: Tournament): SeasonPhase | undefined {
    switch (tournament.type) {
      case 'masters':
        return tournament.name.includes('Santiago') ? 'masters1' : 'masters2';
      case 'champions':
        return 'champions';
      case 'stage1':
        return tournament.name.includes('Playoffs') ? 'stage1_playoffs' : 'stage1';
      case 'stage2':
        return tournament.name.includes('Playoffs') ? 'stage2_playoffs' : 'stage2';
      case 'kickoff':
        return 'kickoff';
      default:
        return undefined;
    }
  }

  /**
   * Schedule tournament matches (assigns dates to ready bracket matches)
   * Uses immutable updates to avoid mutating objects in Zustand store
   */
  private scheduleTournamentMatches(tournament: Tournament): void {
    const startDate = new Date(tournament.startDate);
    let currentDate = new Date(startDate);

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

    // Helper to schedule a match immutably
    const scheduleMatch = (): string => {
      const scheduledDate = currentDate.toISOString();
      matchCount++;
      if (matchCount % matchesPerDay === 0) {
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return scheduledDate;
    };

    // Create new bracket with immutable updates
    tournament.bracket = {
      ...tournament.bracket,
      upper: tournament.bracket.upper.map(round => ({
        ...round,
        matches: round.matches.map(match =>
          match.status === 'ready'
            ? { ...match, scheduledDate: scheduleMatch() }
            : match
        )
      })),
      lower: tournament.bracket.lower?.map(round => ({
        ...round,
        matches: round.matches.map(match =>
          match.status === 'ready'
            ? { ...match, scheduledDate: scheduleMatch() }
            : match
        )
      })),
      grandfinal: tournament.bracket.grandfinal?.status === 'ready'
        ? { ...tournament.bracket.grandfinal, scheduledDate: new Date(tournament.endDate).toISOString() }
        : tournament.bracket.grandfinal,
    };
  }

  /**
   * Add tournament calendar events for ready matches
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

    const tournamentPhase = this.getPhaseForTournament(tournament);

    const addMatchEvents = (matches: BracketMatch[]) => {
      for (const bracketMatch of matches) {
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
            phase: tournamentPhase,
          },
          processed: false,
          required: true,
        });
      }
    };

    for (const round of tournament.bracket.upper) {
      addMatchEvents(round.matches);
    }

    if (tournament.bracket.lower) {
      for (const round of tournament.bracket.lower) {
        addMatchEvents(round.matches);
      }
    }

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
            phase: tournamentPhase,
          },
          processed: false,
          required: true,
        });
      }
    }

    state.addCalendarEvents(events);
  }

  /**
   * Create Match entities for ready bracket matches
   */
  private createMatchEntitiesForReadyBracketMatches(tournament: Tournament): void {
    const state = useGameStore.getState();

    const processMatches = (matches: BracketMatch[]) => {
      for (const bracketMatch of matches) {
        if (bracketMatch.status === 'ready' && bracketMatch.teamAId && bracketMatch.teamBId) {
          if (state.matches[bracketMatch.matchId]) continue;

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

    for (const round of tournament.bracket.upper) {
      processMatches(round.matches);
    }

    if (tournament.bracket.lower) {
      for (const round of tournament.bracket.lower) {
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
   * Count ready matches in a bracket
   */
  private countReadyMatches(bracket: {
    upper: { matches: BracketMatch[] }[];
    lower?: { matches: BracketMatch[] }[];
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

    if (bracket.grandfinal && bracket.grandfinal.status === 'ready') {
      count += 1;
    }

    return count;
  }
}

// Export singleton
export const tournamentTransitionService = new TournamentTransitionService();
