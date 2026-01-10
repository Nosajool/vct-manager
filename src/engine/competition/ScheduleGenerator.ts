// ScheduleGenerator Engine
// Pure class with no React/store dependencies
// Generates VCT season schedules with tournaments and matches

import type {
  Tournament,
  CompetitionType,
  Match,
  CalendarEvent,
  SeasonPhase,
} from '../../types';
import { tournamentEngine } from './TournamentEngine';

// VCT Season Timeline (simplified)
// January: Kickoff (2 weeks, triple elim)
// February-March: Stage 1 (8 weeks, round robin)
// April: Masters 1 (1 week, double elim)
// May-June: Stage 2 (8 weeks, round robin)
// July: Masters 2 (1 week, double elim)
// August: Champions (2 weeks, double elim)
// September-December: Offseason

export interface SeasonSchedule {
  tournaments: Tournament[];
  matches: Match[];
  events: CalendarEvent[];
  phases: SeasonPhaseSchedule[];
}

export interface SeasonPhaseSchedule {
  phase: SeasonPhase;
  startDate: string;
  endDate: string;
  tournamentId?: string;
}

export interface TournamentSchedule {
  tournament: Tournament;
  matches: Match[];
  events: CalendarEvent[];
}

// Phase duration in days
const PHASE_DURATIONS: Record<SeasonPhase, number> = {
  offseason: 120, // Sept-Dec
  kickoff: 14,
  stage1: 56, // 8 weeks
  masters1: 7,
  stage2: 56, // 8 weeks
  masters2: 7,
  champions: 14,
};

// Phase start months (0-indexed)
const PHASE_START_MONTHS: Record<SeasonPhase, number> = {
  kickoff: 0, // January
  stage1: 1, // February
  masters1: 3, // April
  stage2: 4, // May
  masters2: 6, // July
  champions: 7, // August
  offseason: 8, // September
};

/**
 * ScheduleGenerator creates VCT season schedules with all tournaments and matches.
 * Pure engine class with no store dependencies.
 */
export class ScheduleGenerator {
  /**
   * Generate a complete VCT season schedule
   */
  generateVCTSeason(
    year: number,
    region: 'Americas' | 'EMEA' | 'Pacific' | 'China',
    teamIds: string[]
  ): SeasonSchedule {
    const tournaments: Tournament[] = [];
    const matches: Match[] = [];
    const events: CalendarEvent[] = [];
    const phases: SeasonPhaseSchedule[] = [];

    // Generate each phase
    const phaseOrder: SeasonPhase[] = [
      'kickoff',
      'stage1',
      'masters1',
      'stage2',
      'masters2',
      'champions',
      'offseason',
    ];

    for (const phase of phaseOrder) {
      const startDate = this.getPhaseStartDate(year, phase);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + PHASE_DURATIONS[phase]);

      const phaseSchedule: SeasonPhaseSchedule = {
        phase,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      // Generate tournament for this phase if applicable
      if (phase !== 'offseason') {
        const tournamentSchedule = this.generatePhaseSchedule(
          phase,
          region,
          teamIds,
          startDate
        );

        if (tournamentSchedule) {
          tournaments.push(tournamentSchedule.tournament);
          matches.push(...tournamentSchedule.matches);
          events.push(...tournamentSchedule.events);
          phaseSchedule.tournamentId = tournamentSchedule.tournament.id;
        }
      }

      phases.push(phaseSchedule);

      // Add phase transition events
      events.push({
        id: `phase-${phase}-start-${year}`,
        type: 'tournament_start',
        date: startDate.toISOString(),
        data: { phase, title: `${this.getPhaseName(phase)} Begins` },
        processed: false,
        required: false,
      });
    }

    return { tournaments, matches, events, phases };
  }

  /**
   * Generate schedule for a specific phase
   */
  private generatePhaseSchedule(
    phase: SeasonPhase,
    region: string,
    teamIds: string[],
    startDate: Date
  ): TournamentSchedule | null {
    const competitionType = this.phaseToCompetitionType(phase);
    if (!competitionType) return null;

    const format = tournamentEngine.getDefaultFormat(competitionType);
    const name = this.getTournamentName(phase, region);

    // For Masters/Champions, only top teams qualify
    let participatingTeams = teamIds;
    if (phase === 'masters1' || phase === 'masters2') {
      // Top 3 teams from region (simplified - normally based on standings)
      participatingTeams = teamIds.slice(0, Math.min(3, teamIds.length));
    } else if (phase === 'champions') {
      // Top 2 teams from region
      participatingTeams = teamIds.slice(0, Math.min(2, teamIds.length));
    }

    const tournament = tournamentEngine.createTournament(
      name,
      competitionType,
      format,
      region as 'Americas' | 'EMEA' | 'Pacific' | 'China',
      participatingTeams,
      startDate
    );

    // Generate matches from bracket
    const matches = this.generateMatchesFromTournament(tournament);
    const events = this.generateTournamentEvents(tournament);

    return { tournament, matches, events };
  }

  /**
   * Generate Kickoff tournament schedule
   */
  generateKickoffSchedule(
    teamIds: string[],
    region: string,
    startDate: Date
  ): TournamentSchedule {
    const tournament = tournamentEngine.createTournament(
      `VCT ${region} Kickoff`,
      'kickoff',
      'triple_elim',
      region as 'Americas' | 'EMEA' | 'Pacific' | 'China',
      teamIds,
      startDate,
      500000
    );

    const matches = this.generateMatchesFromTournament(tournament);
    const events = this.generateTournamentEvents(tournament);

    return { tournament, matches, events };
  }

  /**
   * Generate Stage (league) schedule
   */
  generateStageSchedule(
    teamIds: string[],
    region: string,
    stage: 1 | 2,
    startDate: Date
  ): TournamentSchedule {
    const competitionType: CompetitionType = stage === 1 ? 'stage1' : 'stage2';

    const tournament = tournamentEngine.createTournament(
      `VCT ${region} Stage ${stage}`,
      competitionType,
      'round_robin',
      region as 'Americas' | 'EMEA' | 'Pacific' | 'China',
      teamIds,
      startDate,
      200000
    );

    const matches = this.generateMatchesFromTournament(tournament);
    const events = this.generateTournamentEvents(tournament);

    return { tournament, matches, events };
  }

  /**
   * Generate Masters tournament schedule
   */
  generateMastersSchedule(
    qualifiedTeamIds: string[],
    masters: 1 | 2,
    startDate: Date
  ): TournamentSchedule {
    const tournament = tournamentEngine.createTournament(
      `VCT Masters ${masters}`,
      'masters',
      'double_elim',
      'International',
      qualifiedTeamIds,
      startDate,
      1000000
    );

    const matches = this.generateMatchesFromTournament(tournament);
    const events = this.generateTournamentEvents(tournament);

    return { tournament, matches, events };
  }

  /**
   * Generate Champions tournament schedule
   */
  generateChampionsSchedule(
    qualifiedTeamIds: string[],
    startDate: Date
  ): TournamentSchedule {
    const tournament = tournamentEngine.createTournament(
      'VCT Champions',
      'champions',
      'double_elim',
      'International',
      qualifiedTeamIds,
      startDate,
      2500000
    );

    const matches = this.generateMatchesFromTournament(tournament);
    const events = this.generateTournamentEvents(tournament);

    return { tournament, matches, events };
  }

  /**
   * Generate Match entities from tournament bracket
   */
  private generateMatchesFromTournament(tournament: Tournament): Match[] {
    const matches: Match[] = [];
    let matchIndex = 0;

    const processRounds = (rounds: { matches: { teamAId?: string; teamBId?: string; scheduledDate?: string }[] }[]) => {
      for (const round of rounds) {
        for (const bracketMatch of round.matches) {
          if (bracketMatch.teamAId && bracketMatch.teamBId) {
            matches.push({
              id: `${tournament.id}-match-${matchIndex++}`,
              teamAId: bracketMatch.teamAId,
              teamBId: bracketMatch.teamBId,
              scheduledDate: bracketMatch.scheduledDate || tournament.startDate,
              status: 'scheduled',
              tournamentId: tournament.id,
            });
          }
        }
      }
    };

    processRounds(tournament.bracket.upper);
    if (tournament.bracket.lower) {
      processRounds(tournament.bracket.lower);
    }
    if (tournament.bracket.middle) {
      processRounds(tournament.bracket.middle);
    }

    return matches;
  }

  /**
   * Generate calendar events for tournament
   */
  private generateTournamentEvents(tournament: Tournament): CalendarEvent[] {
    return [
      {
        id: `${tournament.id}-start`,
        type: 'tournament_start',
        date: tournament.startDate,
        data: { tournamentId: tournament.id, name: tournament.name },
        processed: false,
        required: false,
      },
      {
        id: `${tournament.id}-end`,
        type: 'tournament_end',
        date: tournament.endDate,
        data: { tournamentId: tournament.id, name: tournament.name },
        processed: false,
        required: false,
      },
    ];
  }

  /**
   * Get phase start date for a given year
   */
  private getPhaseStartDate(year: number, phase: SeasonPhase): Date {
    const month = PHASE_START_MONTHS[phase];
    return new Date(year, month, 1);
  }

  /**
   * Convert SeasonPhase to CompetitionType
   */
  private phaseToCompetitionType(phase: SeasonPhase): CompetitionType | null {
    const mapping: Partial<Record<SeasonPhase, CompetitionType>> = {
      kickoff: 'kickoff',
      stage1: 'stage1',
      masters1: 'masters',
      stage2: 'stage2',
      masters2: 'masters',
      champions: 'champions',
    };
    return mapping[phase] || null;
  }

  /**
   * Get tournament name for a phase
   */
  private getTournamentName(phase: SeasonPhase, region: string): string {
    const names: Record<SeasonPhase, string> = {
      kickoff: `VCT ${region} Kickoff`,
      stage1: `VCT ${region} Stage 1`,
      masters1: 'VCT Masters Bangkok',
      stage2: `VCT ${region} Stage 2`,
      masters2: 'VCT Masters Shanghai',
      champions: 'VCT Champions',
      offseason: 'Offseason',
    };
    return names[phase];
  }

  /**
   * Get display name for a phase
   */
  private getPhaseName(phase: SeasonPhase): string {
    const names: Record<SeasonPhase, string> = {
      kickoff: 'Kickoff',
      stage1: 'Stage 1',
      masters1: 'Masters 1',
      stage2: 'Stage 2',
      masters2: 'Masters 2',
      champions: 'Champions',
      offseason: 'Offseason',
    };
    return names[phase];
  }

  /**
   * Calculate number of matches for round robin
   */
  getMatchCountForRoundRobin(teamCount: number): number {
    // Each team plays every other team once
    return (teamCount * (teamCount - 1)) / 2;
  }

  /**
   * Get estimated match dates for round robin
   */
  generateRoundRobinDates(
    teamCount: number,
    startDate: Date,
    matchesPerDay: number = 2
  ): Date[] {
    const totalMatches = this.getMatchCountForRoundRobin(teamCount);
    const dates: Date[] = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < totalMatches; i++) {
      dates.push(new Date(currentDate));
      if ((i + 1) % matchesPerDay === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return dates;
  }
}

// Export singleton instance
export const scheduleGenerator = new ScheduleGenerator();
