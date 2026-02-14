// EventScheduler - Pure engine class for generating calendar events
// No React or store dependencies - pure functions only

import type { CalendarEvent, CalendarEventType, Team, Match, SeasonPhase } from '../../types';

/**
 * Options for generating a season schedule
 */
export interface ScheduleOptions {
  startDate: string; // ISO date string
  seasonYear: number;
  includeTrainingDays?: boolean;
  includeRestDays?: boolean;
  /** Skip league match events (use when GlobalTournamentScheduler handles matches) */
  skipMatchEvents?: boolean;
}

/**
 * Options for scheduling matches
 */
export interface MatchScheduleOptions {
  startDate: string;
  matchesPerWeek: number; // 1-3
  totalMatches: number;
  playerTeamId: string;
  opponents: Team[];
}

/**
 * VCT Season structure
 */
interface SeasonStructure {
  phase: SeasonPhase;
  startOffset: number; // Days from season start
  duration: number; // Days
  description: string;
}

/**
 * EventScheduler - Generates all calendar events for the game
 */
export class EventScheduler {
  // VCT 2026 Season structure (matches actual format from valorantesports.com)
  // Order: Kickoff → Masters Santiago → Stage 1 → Stage 1 Playoffs → Masters London →
  //        Stage 2 → Stage 2 Playoffs → Champions Shanghai
  private static readonly SEASON_STRUCTURE: SeasonStructure[] = [
    // Phase 1: Kickoff (Jan 15 - ~Feb 10) - ~4 weeks, Triple Elim, 12 teams
    { phase: 'kickoff', startOffset: 0, duration: 28, description: 'VCT Kickoff' },

    // Phase 2: Masters Santiago (~Feb 15 - Mar 1) - ~2 weeks, International event
    { phase: 'masters1', startOffset: 35, duration: 14, description: 'Masters Santiago' },

    // Phase 3: Stage 1 League (~Mar 10 - Apr 14) - 5 weeks round-robin, 2 groups of 6
    { phase: 'stage1', startOffset: 56, duration: 35, description: 'Stage 1' },

    // Phase 4: Stage 1 Playoffs (~Apr 21 - May 5) - 2 weeks, top 8 teams
    { phase: 'stage1_playoffs', startOffset: 98, duration: 14, description: 'Stage 1 Playoffs' },

    // Phase 5: Masters London (~May 12 - May 26) - 2 weeks, International event
    { phase: 'masters2', startOffset: 119, duration: 14, description: 'Masters London' },

    // Phase 6: Stage 2 League (~Jun 2 - Jul 7) - 5 weeks round-robin
    { phase: 'stage2', startOffset: 140, duration: 35, description: 'Stage 2' },

    // Phase 7: Stage 2 Playoffs (~Jul 14 - Jul 28) - 2 weeks
    { phase: 'stage2_playoffs', startOffset: 182, duration: 14, description: 'Stage 2 Playoffs' },

    // Phase 8: Champions Shanghai (~Aug 18 - Sep 8) - 3 weeks, International event
    { phase: 'champions', startOffset: 217, duration: 21, description: 'Champions Shanghai' },

    // Offseason (~Sep 15 onwards)
    { phase: 'offseason', startOffset: 245, duration: 120, description: 'Offseason' },
  ];

  /**
   * Generate a unique event ID
   */
  private generateId(prefix: string = 'event'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Add days to an ISO date string
   */
  private addDays(isoDate: string, days: number): string {
    const date = new Date(isoDate);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * Generate match events from Match objects
   */
  scheduleMatchEvents(matches: Match[]): CalendarEvent[] {
    return matches.map((match) => ({
      id: this.generateId('match'),
      date: match.scheduledDate,
      type: 'match' as CalendarEventType,
      required: true,
      processed: false,
      data: {
        matchId: match.id,
        homeTeamId: match.teamAId,
        awayTeamId: match.teamBId,
        tournamentId: match.tournamentId,
      },
    }));
  }

  /**
   * Generate match schedule for player's team
   * Creates matches spread out over time with specified frequency
   */
  generatePlayerMatchSchedule(options: MatchScheduleOptions): CalendarEvent[] {
    const { startDate, matchesPerWeek, totalMatches, playerTeamId, opponents } = options;

    if (opponents.length === 0) {
      return [];
    }

    const events: CalendarEvent[] = [];
    let currentDate = startDate;
    let matchIndex = 0;

    // Calculate days between matches based on frequency
    const daysBetweenMatches = Math.floor(7 / matchesPerWeek);

    // Shuffle opponents for variety
    const shuffledOpponents = this.shuffleArray([...opponents]);

    while (matchIndex < totalMatches) {
      // Get opponent (cycle through if more matches than opponents)
      const opponent = shuffledOpponents[matchIndex % shuffledOpponents.length];

      // Alternate home/away
      const isHome = matchIndex % 2 === 0;
      const homeTeamId = isHome ? playerTeamId : opponent.id;
      const awayTeamId = isHome ? opponent.id : playerTeamId;

      events.push({
        id: this.generateId('match'),
        date: currentDate,
        type: 'match',
        required: true,
        processed: false,
        data: {
          matchId: this.generateId('match-instance'),
          homeTeamId,
          awayTeamId,
          homeTeamName: isHome ? 'Your Team' : opponent.name,
          awayTeamName: isHome ? opponent.name : 'Your Team',
          isPlayerMatch: true,
        },
      });

      matchIndex++;
      currentDate = this.addDays(currentDate, daysBetweenMatches);
    }

    return events;
  }

  /**
   * Generate match schedule only during league phases (Stage 1 and Stage 2)
   * Uses round-robin format: 12 teams split into 2 groups of 6
   * Each team plays every other team in their group once per stage (5 matches)
   */
  generateLeagueMatchSchedule(options: {
    seasonStartDate: string;
    leaguePhases: SeasonStructure[];
    matchesPerWeek: number;
    playerTeamId: string;
    opponents: Team[];
  }): CalendarEvent[] {
    const { seasonStartDate, leaguePhases, playerTeamId, opponents } = options;

    if (opponents.length === 0 || leaguePhases.length === 0) {
      return [];
    }

    const events: CalendarEvent[] = [];

    // VCT round-robin: 12 teams split into 2 groups of 6
    // Player's team is in a group with 5 other teams
    // Sort opponents by organization value to create balanced groups
    const sortedOpponents = [...opponents].sort((a, b) => b.organizationValue - a.organizationValue);

    // Snake draft into groups: 1st, 4th, 5th, 8th, 9th, etc. to one group
    // This ensures balanced groups based on team strength
    const groupA: Team[] = [];
    const groupB: Team[] = [];
    sortedOpponents.forEach((team, index) => {
      // Snake pattern: 0,3,4,7,8,11 go to A; 1,2,5,6,9,10 go to B
      const row = Math.floor(index / 2);
      const col = index % 2;
      if ((row % 2 === 0 && col === 0) || (row % 2 === 1 && col === 1)) {
        groupA.push(team);
      } else {
        groupB.push(team);
      }
    });

    // Determine player's group - place player in group A (with top seeded opponents)
    // This assumes player is a top team; in future could be based on seeding
    const playerGroup = groupA.slice(0, 5); // 5 opponents in player's group

    // Schedule matches within each league phase (Stage 1 and Stage 2)
    for (const phase of leaguePhases) {
      const phaseStartDate = this.addDays(seasonStartDate, phase.startOffset);

      // Round-robin: play each opponent once per stage (5 matches over 5 weeks)
      // Shuffle opponent order for variety between stages
      const phaseOpponents = this.shuffleArray([...playerGroup]);

      phaseOpponents.forEach((opponent, matchIndex) => {
        // Schedule one match per week, spread across the stage
        const matchDay = matchIndex * 7; // One match per week
        const matchDate = this.addDays(phaseStartDate, matchDay);

        // Alternate home/away
        const isHome = matchIndex % 2 === 0;
        const homeTeamId = isHome ? playerTeamId : opponent.id;
        const awayTeamId = isHome ? opponent.id : playerTeamId;

        events.push({
          id: this.generateId('match'),
          date: matchDate,
          type: 'match',
          required: true,
          processed: false,
          data: {
            matchId: this.generateId('match-instance'),
            homeTeamId,
            awayTeamId,
            homeTeamName: isHome ? 'Your Team' : opponent.name,
            awayTeamName: isHome ? opponent.name : 'Your Team',
            isPlayerMatch: true,
            phase: phase.phase,
          },
        });
      });
    }

    return events;
  }

  /**
   * Generate salary payment events (1st of each month)
   */
  scheduleSalaryPayments(startDate: string, months: number): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const start = new Date(startDate);

    for (let i = 0; i < months; i++) {
      const paymentDate = new Date(start.getFullYear(), start.getMonth() + i, 1);

      // Skip if payment date is before start date
      if (paymentDate >= start) {
        events.push({
          id: this.generateId('salary'),
          date: paymentDate.toISOString(),
          type: 'salary_payment',
          required: true,
          processed: false,
          data: {
            month: paymentDate.getMonth() + 1,
            year: paymentDate.getFullYear(),
          },
        });
      }
    }

    return events;
  }

  /**
   * DEPRECATED: Training day events are no longer pre-generated.
   * Use DayScheduleService for dynamic availability computation.
   * @deprecated Phase 1: Removed pre-generation of training_available events
   */
  scheduleTrainingDays(
    _startDate: string,
    _endDate: string,
    _matchDates: string[]
  ): CalendarEvent[] {
    // No longer generates events - training availability is computed dynamically
    return [];
  }

  /**
   * DEPRECATED: Scrim availability events are no longer pre-generated.
   * Use DayScheduleService for dynamic availability computation.
   * @deprecated Phase 1: Removed pre-generation of scrim_available events
   */
  scheduleScrimDays(
    _startDate: string,
    _endDate: string,
    _matchDates: string[]
  ): CalendarEvent[] {
    // No longer generates events - scrim availability is computed dynamically
    return [];
  }

  /**
   * Generate rest day events (one per week, typically Sunday)
   */
  scheduleRestDays(startDate: string, weeks: number): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const start = new Date(startDate);

    // Find the next Sunday
    const daysUntilSunday = (7 - start.getDay()) % 7;
    const firstSunday = new Date(start);
    firstSunday.setDate(firstSunday.getDate() + daysUntilSunday);

    for (let i = 0; i < weeks; i++) {
      const restDate = new Date(firstSunday);
      restDate.setDate(restDate.getDate() + i * 7);

      events.push({
        id: this.generateId('rest'),
        date: restDate.toISOString(),
        type: 'rest_day',
        required: false,
        processed: false,
        data: {
          week: i + 1,
          description: 'Scheduled rest day - team recovery',
        },
      });
    }

    return events;
  }

  /**
   * Generate tournament events (start/end markers)
   */
  scheduleTournamentEvents(
    tournamentName: string,
    startDate: string,
    endDate: string,
    phase: SeasonPhase
  ): CalendarEvent[] {
    return [
      {
        id: this.generateId('tournament-start'),
        date: startDate,
        type: 'tournament_start',
        required: true,
        processed: false,
        data: {
          tournamentName,
          phase,
        },
      },
      {
        id: this.generateId('tournament-end'),
        date: endDate,
        type: 'tournament_end',
        required: true,
        processed: false,
        data: {
          tournamentName,
          phase,
        },
      },
    ];
  }

  /**
   * Generate a complete season schedule
   * For Phase 3, this generates a simplified schedule with:
   * - Match events for player's team (2 per week) - UNLESS skipMatchEvents is true
   * - Monthly salary payments
   * - Tournament phase markers
   */
  generateSeasonSchedule(
    playerTeamId: string,
    opponents: Team[],
    options: ScheduleOptions
  ): CalendarEvent[] {
    const allEvents: CalendarEvent[] = [];
    const { startDate, seasonYear, skipMatchEvents = false } = options;

    // Generate salary payments for the year (12 months)
    const salaryEvents = this.scheduleSalaryPayments(startDate, 12);
    allEvents.push(...salaryEvents);

    // Only generate match events if not skipped (GlobalTournamentScheduler handles them now)
    if (!skipMatchEvents) {
      // For Phase 3, simplified match schedule:
      // Generate league matches only during Stage 1 and Stage 2 periods
      // Avoid all tournament phases (Kickoff, Masters 1, Masters 2, Champions) and offseason
      const leaguePhases = EventScheduler.SEASON_STRUCTURE.filter(
        (s) => s.phase === 'stage1' || s.phase === 'stage2'
      );

      const matchEvents = this.generateLeagueMatchSchedule({
        seasonStartDate: startDate,
        leaguePhases,
        matchesPerWeek: 2,
        playerTeamId,
        opponents,
      });
      allEvents.push(...matchEvents);
    }

    // Training and scrim availability is now computed dynamically by DayScheduleService
    // No longer pre-generating training_available and scrim_available events

    // Add tournament phase markers
    for (const phase of EventScheduler.SEASON_STRUCTURE) {
      if (phase.phase !== 'offseason') {
        const phaseStart = this.addDays(startDate, phase.startOffset);
        const phaseEnd = this.addDays(phaseStart, phase.duration);

        const tournamentEvents = this.scheduleTournamentEvents(
          `${seasonYear} ${phase.description}`,
          phaseStart,
          phaseEnd,
          phase.phase
        );
        allEvents.push(...tournamentEvents);
      }
    }

    // Sort all events by date
    return allEvents.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  /**
   * Generate initial schedule for game start
   * Called when a new game is initialized
   *
   * NOTE: Match events are now handled by GlobalTournamentScheduler, so we skip them here.
   * This generates salary payments, training/scrim availability, and tournament phase markers.
   */
  generateInitialSchedule(
    playerTeamId: string,
    allTeams: Team[],
    startDate: string = '2026-01-01T00:00:00.000Z',
    seasonYear: number = 2026
  ): CalendarEvent[] {
    // Get player's team to filter by region
    const playerTeam = allTeams.find((team) => team.id === playerTeamId);

    // Get opponents (teams in the same region, excluding player's team)
    const opponents = allTeams.filter(
      (team) => team.id !== playerTeamId && team.region === playerTeam?.region
    );

    return this.generateSeasonSchedule(playerTeamId, opponents, {
      startDate,
      seasonYear,
      // Skip match events - GlobalTournamentScheduler now handles all match scheduling
      skipMatchEvents: true,
    });
  }

  /**
   * Add a single match event
   */
  createMatchEvent(
    homeTeamId: string,
    homeTeamName: string,
    awayTeamId: string,
    awayTeamName: string,
    date: string,
    isPlayerMatch: boolean = false
  ): CalendarEvent {
    return {
      id: this.generateId('match'),
      date,
      type: 'match',
      required: true,
      processed: false,
      data: {
        matchId: this.generateId('match-instance'),
        homeTeamId,
        homeTeamName,
        awayTeamId,
        awayTeamName,
        isPlayerMatch,
      },
    };
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get season phase for a given date
   */
  getSeasonPhase(startDate: string, currentDate: string): SeasonPhase {
    const start = new Date(startDate);
    const current = new Date(currentDate);
    const daysSinceStart = Math.floor(
      (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (const phase of EventScheduler.SEASON_STRUCTURE) {
      const phaseEnd = phase.startOffset + phase.duration;
      if (daysSinceStart >= phase.startOffset && daysSinceStart < phaseEnd) {
        return phase.phase;
      }
    }

    return 'offseason';
  }
}

// Export singleton instance for convenience
export const eventScheduler = new EventScheduler();
