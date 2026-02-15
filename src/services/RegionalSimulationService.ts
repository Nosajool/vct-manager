// RegionalSimulationService - Simulates tournaments for other regions
// Follows service pattern: getState() -> engine calls -> store updates
// Delegates to TournamentTransitionService for tournament creation
//
// NOTE: This service is being DEPRECATED in favor of the new architecture:
// - GlobalTournamentScheduler creates ALL tournaments upfront at game init
// - CalendarService handles day-by-day simulation for ALL regions
// - TeamSlotResolver handles qualification resolution
//
// The batch simulation methods (simulateOtherKickoffs, simulateOtherStagePlayoffs)
// are no longer needed as matches are simulated day-by-day for all regions.

import { useGameStore } from '../store';
import { bracketManager, tournamentEngine } from '../engine/competition';
import { tournamentService } from './TournamentService';
import { tournamentTransitionService } from './TournamentTransitionService';
import type { Region, Tournament, Team, MatchResult } from '../types';
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
   *
   * @deprecated This method is deprecated. With the new architecture:
   * - ALL tournaments are created upfront by GlobalTournamentScheduler
   * - Day-by-day simulation handles ALL regions via CalendarService
   * - Qualification resolution is handled by TeamSlotResolver
   *
   * Keeping for backwards compatibility but will be removed in future.
   */
  simulateOtherKickoffs(playerRegion: Region): QualificationRecord[] {
    console.warn(
      'RegionalSimulationService.simulateOtherKickoffs() is DEPRECATED. ' +
      'Use GlobalTournamentScheduler + CalendarService for multi-region simulation.'
    );
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
   * Delegates to TournamentTransitionService for generic transition logic
   *
   * @deprecated Use tournamentTransitionService.executeTransition('kickoff_to_masters1') instead
   */
  createMastersTournament(): Tournament | null {
    console.log('RegionalSimulationService.createMastersTournament() - delegating to TournamentTransitionService');

    const result = tournamentTransitionService.executeTransition('kickoff_to_masters1');

    if (!result.success) {
      console.error('Failed to create Masters tournament:', result.error);
      return null;
    }

    const state = useGameStore.getState();
    return state.tournaments[result.tournamentId!] || null;
  }

  /**
   * Simulate entire Masters tournament (Swiss + Playoffs)
   */
  async simulateMastersTournament(tournamentId: string): Promise<{
    results: MatchResult[];
    champion: string | null;
  }> {
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
      const qualifiedTeams = await tournamentService.simulateSwissStage(tournamentId);
      console.log(`Swiss Stage complete. Qualified teams: ${qualifiedTeams.length}`);
    }

    // Now simulate playoffs (standard bracket simulation)
    console.log('Simulating Masters Playoffs...');
    const { results, champion: playoffChampion } = await tournamentService.simulateTournament(tournamentId);
    allResults.push(...results);
    champion = playoffChampion;

    return { results: allResults, champion };
  }


  /**
   * Get all qualifications for a given competition type
   */
  getAllQualifications(type: 'kickoff' | 'stage1' | 'stage2'): QualificationRecord[] {
    const state = useGameStore.getState();
    return Object.values(state.qualifications).filter((q) => q.tournamentType === type);
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
