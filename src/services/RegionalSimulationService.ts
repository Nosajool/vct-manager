// RegionalSimulationService - Simulates tournaments for other regions
// Follows service pattern: getState() -> engine calls -> store updates

import { useGameStore } from '../store';
import { bracketManager, tournamentEngine } from '../engine/competition';
import { tournamentService } from './TournamentService';
import type { Region, Tournament, Team, MultiStageTournament, Match, CalendarEvent, MatchResult } from '../types';
import { isMultiStageTournament } from '../types';
import type { QualificationRecord } from '../store/slices/competitionSlice';
import {
  AMERICAS_KICKOFF_SEEDING,
  EMEA_KICKOFF_SEEDING,
  PACIFIC_KICKOFF_SEEDING,
  CHINA_KICKOFF_SEEDING,
} from '../utils/constants';

// All VCT regions
const ALL_REGIONS: Region[] = ['Americas', 'EMEA', 'Pacific', 'China'];

export class RegionalSimulationService {
  /**
   * Simulate Kickoff tournaments for regions other than player's
   * Pattern: getState() -> engine calls -> store updates
   */
  simulateOtherKickoffs(playerRegion: Region): QualificationRecord[] {
    const otherRegions = ALL_REGIONS.filter((r) => r !== playerRegion);
    const results: QualificationRecord[] = [];

    for (const region of otherRegions) {
      // Get fresh state each iteration (state changes after each tournament)
      const state = useGameStore.getState();

      // Get teams from this region
      const allRegionTeams = Object.values(state.teams).filter((t) => t.region === region);

      // Sort teams according to official VCT 2026 Kickoff seeding for each region
      const regionTeams = this.sortTeamsByKickoffSeeding(allRegionTeams, region).slice(0, 12);

      if (regionTeams.length < 12) {
        console.warn(
          `Region ${region} has only ${regionTeams.length} teams, need 12 for Kickoff`
        );
        continue;
      }

      // Call engine to create tournament (pure function)
      const tournament = tournamentEngine.createTournament(
        `VCT ${region} Kickoff 2026`,
        'kickoff',
        'triple_elim',
        region,
        regionTeams.map((t) => t.id),
        new Date(state.calendar.currentDate),
        500000
      );

      // Update store
      state.addTournament(tournament);

      // Simulate entire tournament via TournamentService
      tournamentService.simulateTournament(tournament.id);

      // Get fresh state after simulation
      const freshState = useGameStore.getState();
      const completedTournament = freshState.tournaments[tournament.id];

      // Call engine to extract qualifiers (pure function)
      const qualifiers = bracketManager.getQualifiers(completedTournament.bracket);

      // Validate qualifiers
      if (!qualifiers.alpha || !qualifiers.beta || !qualifiers.omega) {
        console.error(`Failed to get all qualifiers for ${region}`, qualifiers);
        continue;
      }

      // Get team data for qualification record
      const alphaTeam = freshState.teams[qualifiers.alpha];
      const betaTeam = freshState.teams[qualifiers.beta];
      const omegaTeam = freshState.teams[qualifiers.omega];

      // Build qualification record
      const record: QualificationRecord = {
        tournamentId: tournament.id,
        tournamentType: 'kickoff',
        region,
        qualifiedTeams: [
          {
            teamId: qualifiers.alpha,
            teamName: alphaTeam?.name || 'Unknown',
            bracket: 'alpha',
          },
          {
            teamId: qualifiers.beta,
            teamName: betaTeam?.name || 'Unknown',
            bracket: 'beta',
          },
          {
            teamId: qualifiers.omega,
            teamName: omegaTeam?.name || 'Unknown',
            bracket: 'omega',
          },
        ],
      };

      // Update store with qualification
      freshState.addQualification(record);
      results.push(record);
    }

    return results;
  }

  /**
   * Create Masters tournament with all qualified teams from all regions
   * Called after all 4 regional Kickoffs are complete
   *
   * Uses Swiss-to-Playoff format:
   * - Swiss Stage: 8 teams (beta+omega qualifiers from each region)
   * - Playoffs: 8 teams (4 Swiss qualifiers + 4 Kickoff winners)
   */
  createMastersTournament(): Tournament | null {
    const state = useGameStore.getState();

    // Get all Kickoff qualifications
    const qualifications = Object.values(state.qualifications).filter(
      (q) => q.tournamentType === 'kickoff'
    );

    if (qualifications.length !== 4) {
      console.error(
        `Expected 4 regional qualifications for Masters, got ${qualifications.length}`
      );
      return null;
    }

    // Separate qualified teams by bracket
    const kickoffWinners: string[] = [];  // alpha bracket = 1st place (join at playoffs)
    const swissParticipants: string[] = []; // beta+omega = 2nd+3rd place (play Swiss)

    // Build team regions map for Swiss cross-regional pairings
    const teamRegions = new Map<string, string>();

    for (const qual of qualifications) {
      for (const team of qual.qualifiedTeams) {
        teamRegions.set(team.teamId, qual.region);

        if (team.bracket === 'alpha') {
          kickoffWinners.push(team.teamId);
        } else {
          // beta or omega
          swissParticipants.push(team.teamId);
        }
      }
    }

    // Validate counts
    if (kickoffWinners.length !== 4) {
      console.error(`Expected 4 Kickoff winners (alpha), got ${kickoffWinners.length}`);
    }
    if (swissParticipants.length !== 8) {
      console.error(`Expected 8 Swiss participants (beta+omega), got ${swissParticipants.length}`);
    }

    // Calculate Masters start date (7 days after current date)
    const mastersDate = this.calculateMastersStartDate(state.calendar.currentDate);

    // Create Masters with Swiss-to-Playoff format
    const masters = tournamentEngine.createMastersSantiago(
      swissParticipants,    // 8 teams for Swiss
      kickoffWinners,       // 4 teams join at playoffs
      teamRegions,
      mastersDate,
      1000000
    );

    // Add to store
    state.addTournament(masters);

    // Create Match entities for Swiss Round 1
    this.createSwissRound1MatchEntities(masters);

    // Add tournament start event to calendar
    this.addMastersCalendarEvents(masters);

    // Update phase
    state.setCurrentPhase('masters1');

    return masters;
  }

  /**
   * Simulate entire Masters tournament (Swiss + Playoffs)
   */
  simulateMastersTournament(tournamentId: string): {
    results: MatchResult[];
    champion: string | null;
  } {
    const allResults: MatchResult[] = [];
    let champion: string | null = null;

    // Get fresh state
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) {
      console.error(`Tournament not found: ${tournamentId}`);
      return { results: allResults, champion };
    }

    // Ensure tournament is in progress
    tournamentService.startTournament(tournamentId);

    // If it's a Swiss-to-Playoff tournament, simulate Swiss first
    if (isMultiStageTournament(tournament) && tournament.currentStage === 'swiss') {
      console.log('Simulating Masters Swiss Stage...');
      const qualifiedTeams = tournamentService.simulateSwissStage(tournamentId);
      console.log(`Swiss Stage complete. Qualified teams: ${qualifiedTeams.length}`);
    }

    // Now simulate playoffs (standard bracket simulation)
    console.log('Simulating Masters Playoffs...');
    const { results, champion: playoffChampion } = tournamentService.simulateTournament(tournamentId);
    allResults.push(...results);
    champion = playoffChampion;

    return { results: allResults, champion };
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
   * Add Masters tournament calendar events
   */
  private addMastersCalendarEvents(tournament: MultiStageTournament): void {
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
   * Get all qualifications for a given competition type
   */
  getAllQualifications(type: 'kickoff' | 'stage1' | 'stage2'): QualificationRecord[] {
    const state = useGameStore.getState();
    return Object.values(state.qualifications).filter((q) => q.tournamentType === type);
  }

  /**
   * Calculate Masters start date (7 days after current date)
   */
  private calculateMastersStartDate(currentDate: string): Date {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 7);
    return date;
  }

  /**
   * Sort teams according to official VCT 2026 Kickoff seeding for each region
   */
  private sortTeamsByKickoffSeeding(teams: Team[], region: Region): Team[] {
    const seedingArray = this.getKickoffSeeding(region);
    const seedingMap = new Map<string, number>();
    seedingArray.forEach((teamName, index) => {
      seedingMap.set(teamName.toLowerCase(), index);
    });

    return [...teams].sort((a, b) => {
      const seedA = seedingMap.get(a.name.toLowerCase()) ?? 999;
      const seedB = seedingMap.get(b.name.toLowerCase()) ?? 999;
      return seedA - seedB;
    });
  }

  /**
   * Get the official Kickoff seeding array for a region
   */
  private getKickoffSeeding(region: Region): string[] {
    switch (region) {
      case 'Americas':
        return AMERICAS_KICKOFF_SEEDING;
      case 'EMEA':
        return EMEA_KICKOFF_SEEDING;
      case 'Pacific':
        return PACIFIC_KICKOFF_SEEDING;
      case 'China':
        return CHINA_KICKOFF_SEEDING;
      default:
        return AMERICAS_KICKOFF_SEEDING;
    }
  }
}

// Export singleton
export const regionalSimulationService = new RegionalSimulationService();
