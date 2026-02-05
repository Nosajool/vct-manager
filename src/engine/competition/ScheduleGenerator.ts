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

// VCT Season Timeline (VCT 2026)
// January: Kickoff (2 weeks, triple elim)
// February: Masters Santiago (Swiss Stage + Playoffs)
//   - Days 1-4: Swiss Stage (3 rounds, 8 teams)
//   - Days 6-15: Playoffs (double elim, 8 teams)
// March-April: Stage 1 (8 weeks, round robin)
// May: Masters London (Swiss + Playoffs)
// June-July: Stage 2 (8 weeks, round robin)
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

// Phase duration in days (matches VCT 2026 actual structure)
const PHASE_DURATIONS: Record<SeasonPhase, number> = {
  offseason: 120, // Sept-Dec
  kickoff: 28, // 4 weeks
  masters1: 14, // 2 weeks (Masters Santiago)
  stage1: 35, // 5 weeks round-robin
  stage1_playoffs: 14, // 2 weeks
  masters2: 14, // 2 weeks (Masters London)
  stage2: 35, // 5 weeks round-robin
  stage2_playoffs: 14, // 2 weeks
  champions: 21, // 3 weeks
};

// Phase start months (0-indexed) - approximate for VCT 2026
const PHASE_START_MONTHS: Record<SeasonPhase, number> = {
  kickoff: 0, // January
  masters1: 1, // February (Masters Santiago)
  stage1: 2, // March
  stage1_playoffs: 3, // April
  masters2: 4, // May (Masters London)
  stage2: 5, // June
  stage2_playoffs: 6, // July
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

    // Generate each phase (matches VCT 2026 actual order)
    const phaseOrder: SeasonPhase[] = [
      'kickoff',
      'masters1', // Masters Santiago after Kickoff
      'stage1',
      'stage1_playoffs',
      'masters2', // Masters London after Stage 1 Playoffs
      'stage2',
      'stage2_playoffs',
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
   * @param season - Season number for the matches (defaults to 1)
   */
  private generateMatchesFromTournament(tournament: Tournament, season: number = 1): Match[] {
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
              season,
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
      stage1_playoffs: 'stage1', // Playoffs use same competition type
      masters1: 'masters',
      stage2: 'stage2',
      stage2_playoffs: 'stage2', // Playoffs use same competition type
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
      stage1_playoffs: `VCT ${region} Stage 1 Playoffs`,
      masters1: 'VCT Masters Santiago',
      stage2: `VCT ${region} Stage 2`,
      stage2_playoffs: `VCT ${region} Stage 2 Playoffs`,
      masters2: 'VCT Masters London',
      champions: 'VCT Champions Shanghai',
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
      stage1_playoffs: 'Stage 1 Playoffs',
      masters1: 'Masters Santiago',
      stage2: 'Stage 2',
      stage2_playoffs: 'Stage 2 Playoffs',
      masters2: 'Masters London',
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
    const currentDate = new Date(startDate);

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
