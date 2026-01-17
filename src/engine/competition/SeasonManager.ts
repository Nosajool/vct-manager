// SeasonManager Engine
// Pure class with no React/store dependencies
// Manages season progression and phase transitions

import type { SeasonPhase, MatchResult } from '../../types';
import type { StandingsEntry } from '../../store/slices/competitionSlice';
import type { SeasonPhaseSchedule } from './ScheduleGenerator';

// Phase order for progression (matches actual VCT 2026 structure)
const PHASE_ORDER: SeasonPhase[] = [
  'offseason',
  'kickoff',
  'masters1', // Masters Santiago - after Kickoff
  'stage1',
  'stage1_playoffs',
  'masters2', // Masters London - after Stage 1 Playoffs
  'stage2',
  'stage2_playoffs',
  'champions',
];

// Qualification counts for international events
const QUALIFICATION_COUNTS: Record<string, number> = {
  masters: 3, // Top 3 teams per region qualify for Masters
  champions: 2, // Top 2 teams per region qualify for Champions
};

/**
 * SeasonManager handles season progression and qualification logic.
 * Pure engine class with no store dependencies.
 */
export class SeasonManager {
  /**
   * Get the next phase in the season
   */
  getNextPhase(currentPhase: SeasonPhase): SeasonPhase {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    if (currentIndex === -1 || currentIndex === PHASE_ORDER.length - 1) {
      return 'offseason';
    }
    return PHASE_ORDER[currentIndex + 1];
  }

  /**
   * Get the previous phase in the season
   */
  getPreviousPhase(currentPhase: SeasonPhase): SeasonPhase | null {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    if (currentIndex <= 0) {
      return null;
    }
    return PHASE_ORDER[currentIndex - 1];
  }

  /**
   * Check if a phase is before another
   */
  isPhaseBefore(phase: SeasonPhase, compareTo: SeasonPhase): boolean {
    return PHASE_ORDER.indexOf(phase) < PHASE_ORDER.indexOf(compareTo);
  }

  /**
   * Check if a phase is after another
   */
  isPhaseAfter(phase: SeasonPhase, compareTo: SeasonPhase): boolean {
    return PHASE_ORDER.indexOf(phase) > PHASE_ORDER.indexOf(compareTo);
  }

  /**
   * Get qualified teams for an international event
   */
  getQualifiedTeams(standings: StandingsEntry[], count: number): string[] {
    return standings
      .slice(0, count)
      .map((entry) => entry.teamId);
  }

  /**
   * Get number of teams that qualify for Masters
   */
  getMastersQualificationCount(): number {
    return QUALIFICATION_COUNTS.masters;
  }

  /**
   * Get number of teams that qualify for Champions
   */
  getChampionsQualificationCount(): number {
    return QUALIFICATION_COUNTS.champions;
  }

  /**
   * Calculate standings from match results
   */
  calculateSeasonStandings(
    teamIds: string[],
    matchResults: MatchResult[],
    teamNames: Record<string, string>
  ): StandingsEntry[] {
    // Initialize standings for all teams
    const standingsMap = new Map<string, StandingsEntry>();

    for (const teamId of teamIds) {
      standingsMap.set(teamId, {
        teamId,
        teamName: teamNames[teamId] || 'Unknown',
        wins: 0,
        losses: 0,
        roundDiff: 0,
      });
    }

    // Process match results
    for (const result of matchResults) {
      const winnerEntry = standingsMap.get(result.winnerId);
      const loserEntry = standingsMap.get(result.loserId);

      if (winnerEntry) {
        winnerEntry.wins++;
        // Calculate round differential from map scores
        const roundsWon = result.maps.reduce((sum, m) =>
          sum + (result.winnerId === m.winner ? m.teamAScore : m.teamBScore), 0);
        const roundsLost = result.maps.reduce((sum, m) =>
          sum + (result.winnerId === m.winner ? m.teamBScore : m.teamAScore), 0);
        winnerEntry.roundDiff += (roundsWon - roundsLost);
      }

      if (loserEntry) {
        loserEntry.losses++;
        const roundsWon = result.maps.reduce((sum, m) =>
          sum + (result.loserId === m.winner ? m.teamAScore : m.teamBScore), 0);
        const roundsLost = result.maps.reduce((sum, m) =>
          sum + (result.loserId === m.winner ? m.teamBScore : m.teamAScore), 0);
        loserEntry.roundDiff += (roundsWon - roundsLost);
      }
    }

    // Sort by wins, then round differential
    const standings = Array.from(standingsMap.values()).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff;
      return b.losses - a.losses; // Fewer losses is better as tiebreaker
    });

    // Assign placements
    standings.forEach((entry, index) => {
      entry.placement = index + 1;
    });

    return standings;
  }

  /**
   * Check if the next phase should start based on date
   */
  shouldStartNextPhase(
    currentDate: Date,
    currentPhase: SeasonPhase,
    phaseSchedules: SeasonPhaseSchedule[]
  ): boolean {
    const nextPhase = this.getNextPhase(currentPhase);
    const nextPhaseSchedule = phaseSchedules.find((s) => s.phase === nextPhase);

    if (!nextPhaseSchedule) return false;

    const nextPhaseStart = new Date(nextPhaseSchedule.startDate);
    return currentDate >= nextPhaseStart;
  }

  /**
   * Get current phase based on date
   */
  getCurrentPhaseForDate(
    currentDate: Date,
    phaseSchedules: SeasonPhaseSchedule[]
  ): SeasonPhase {
    for (let i = phaseSchedules.length - 1; i >= 0; i--) {
      const schedule = phaseSchedules[i];
      if (currentDate >= new Date(schedule.startDate)) {
        return schedule.phase;
      }
    }
    return 'offseason';
  }

  /**
   * Check if a team is qualified for an international event
   */
  isTeamQualified(
    teamId: string,
    standings: StandingsEntry[],
    eventType: 'masters' | 'champions'
  ): boolean {
    const qualCount = QUALIFICATION_COUNTS[eventType];
    const teamStanding = standings.find((s) => s.teamId === teamId);

    if (!teamStanding || teamStanding.placement === undefined) {
      return false;
    }

    return teamStanding.placement <= qualCount;
  }

  /**
   * Get phase display name
   */
  getPhaseName(phase: SeasonPhase): string {
    const names: Record<SeasonPhase, string> = {
      offseason: 'Offseason',
      kickoff: 'Kickoff',
      stage1: 'Stage 1',
      stage1_playoffs: 'Stage 1 Playoffs',
      stage2: 'Stage 2',
      stage2_playoffs: 'Stage 2 Playoffs',
      masters1: 'Masters Santiago',
      masters2: 'Masters London',
      champions: 'Champions',
    };
    return names[phase];
  }

  /**
   * Get phase description
   */
  getPhaseDescription(phase: SeasonPhase): string {
    const descriptions: Record<SeasonPhase, string> = {
      offseason: 'Rest period between seasons. Teams can make roster changes.',
      kickoff: 'Season opener tournament. Triple elimination format.',
      stage1: 'First league split. Round robin matches in groups.',
      stage1_playoffs: 'Stage 1 playoff tournament. Top 8 teams compete.',
      stage2: 'Second league split. Round robin matches for final standings.',
      stage2_playoffs: 'Stage 2 playoff tournament. Determines Champions qualifiers.',
      masters1: 'First international tournament in Santiago. Top teams from Kickoff.',
      masters2: 'Second international tournament in London. Top playoff teams.',
      champions: 'World Championship in Shanghai. The biggest event of the year.',
    };
    return descriptions[phase];
  }

  /**
   * Check if it's a good time for roster changes
   */
  canMakeRosterChanges(phase: SeasonPhase): boolean {
    // Can only make roster changes during offseason and between stages
    return phase === 'offseason';
  }

  /**
   * Get all phases in order
   */
  getAllPhases(): SeasonPhase[] {
    return [...PHASE_ORDER];
  }

  /**
   * Get phase index (useful for progress indicators)
   */
  getPhaseIndex(phase: SeasonPhase): number {
    return PHASE_ORDER.indexOf(phase);
  }

  /**
   * Get total number of phases
   */
  getTotalPhases(): number {
    return PHASE_ORDER.length;
  }

  /**
   * Calculate season progress percentage
   */
  getSeasonProgress(currentPhase: SeasonPhase): number {
    const index = this.getPhaseIndex(currentPhase);
    return Math.round((index / (PHASE_ORDER.length - 1)) * 100);
  }
}

// Export singleton instance
export const seasonManager = new SeasonManager();
