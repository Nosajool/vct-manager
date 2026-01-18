// RegionalSimulationService - Simulates tournaments for other regions
// Follows service pattern: getState() -> engine calls -> store updates

import { useGameStore } from '../store';
import { bracketManager, tournamentEngine } from '../engine/competition';
import { tournamentService } from './TournamentService';
import type { Region, Tournament, Team } from '../types';
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

    // Gather all 12 qualified team IDs (normalized references)
    const qualifiedTeamIds = qualifications.flatMap((q) =>
      q.qualifiedTeams.map((t) => t.teamId)
    );

    // Calculate Masters start date (7 days after current date)
    const mastersDate = this.calculateMastersStartDate(state.calendar.currentDate);

    // Use TournamentService to create (handles store updates, calendar events)
    const masters = tournamentService.createTournament(
      'VCT Masters Santiago 2026',
      'masters',
      'double_elim',
      'International',
      qualifiedTeamIds,
      mastersDate,
      1000000
    );

    // Update phase
    if (masters) {
      state.setCurrentPhase('masters1');
    }

    return masters;
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
