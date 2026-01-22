// TournamentTransitionService - Generic tournament transition logic
// Handles phase transitions and tournament creation for all VCT phases
// Pattern: getState() -> engine calls -> store updates

import { useGameStore } from '../store';
import { bracketManager, tournamentEngine } from '../engine/competition';
import { regionalSimulationService } from './RegionalSimulationService';
import { tournamentService } from './TournamentService';
import type {
  TournamentTransitionConfig,
  TransitionResult,
  Region,
  Tournament,
  MultiStageTournament,
  Match,
  CalendarEvent,
} from '../types';
import { isMultiStageTournament } from '../types';
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
    } else {
      return this.executeInternationalTransition(config, playerRegion);
    }
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

    // Add to store
    state.addTournament(tournament);

    // Schedule ready matches
    tournamentService.scheduleTournamentMatches(tournament.id);
    tournamentService.addTournamentCalendarEvents(tournament.id);

    // Create Match entities for ready bracket matches
    tournamentService.createMatchEntitiesForReadyBracketMatches(tournament.id);

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
    playerRegion?: Region
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
  simulateOtherRegions(playerRegion: Region, qualificationSource: string): QualificationRecord[] {
    return regionalSimulationService.simulateOtherKickoffs(playerRegion);
  }
}

// Export singleton
export const tournamentTransitionService = new TournamentTransitionService();
