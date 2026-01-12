// EventScheduler - Pure engine class for generating calendar events
// No React or store dependencies - pure functions only

import type { CalendarEvent, CalendarEventType, Team, Match, SeasonPhase, MatchEventData, TournamentEventData, SalaryPaymentEventData, RestDayEventData } from '../../types';

/**
 * Options for generating a season schedule
 */
export interface ScheduleOptions {
  startDate: string; // ISO date string
  seasonYear: number;
  includeTrainingDays?: boolean;
  includeRestDays?: boolean;
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
  // VCT Season structure (simplified for Phase 3)
  private static readonly SEASON_STRUCTURE: SeasonStructure[] = [
    { phase: 'kickoff', startOffset: 0, duration: 28, description: 'VCT Kickoff' },
    { phase: 'stage1', startOffset: 35, duration: 56, description: 'Stage 1' },
    { phase: 'masters1', startOffset: 98, duration: 14, description: 'Masters 1' },
    { phase: 'stage2', startOffset: 119, duration: 56, description: 'Stage 2' },
    { phase: 'masters2', startOffset: 182, duration: 14, description: 'Masters 2' },
    { phase: 'champions', startOffset: 245, duration: 21, description: 'Champions' },
    { phase: 'offseason', startOffset: 273, duration: 92, description: 'Offseason' },
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
   * Avoids tournament phases (Kickoff, Masters 1, Masters 2, Champions) and offseason
   */
  generateLeagueMatchSchedule(options: {
    seasonStartDate: string;
    leaguePhases: SeasonStructure[];
    matchesPerWeek: number;
    playerTeamId: string;
    opponents: Team[];
  }): CalendarEvent[] {
    const { seasonStartDate, leaguePhases, matchesPerWeek, playerTeamId, opponents } = options;

    if (opponents.length === 0 || leaguePhases.length === 0) {
      return [];
    }

    const events: CalendarEvent[] = [];
    const daysBetweenMatches = Math.floor(7 / matchesPerWeek);

    // Shuffle opponents for variety
    const shuffledOpponents = this.shuffleArray([...opponents]);
    let opponentIndex = 0;

    // Schedule matches within each league phase
    for (const phase of leaguePhases) {
      const phaseStartDate = this.addDays(seasonStartDate, phase.startOffset);
      const phaseEndDate = this.addDays(seasonStartDate, phase.startOffset + phase.duration);
      let currentDate = phaseStartDate;

      while (new Date(currentDate) < new Date(phaseEndDate)) {
        // Get opponent (cycle through if more matches than opponents)
        const opponent = shuffledOpponents[opponentIndex % shuffledOpponents.length];

        // Alternate home/away
        const isHome = opponentIndex % 2 === 0;
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
            phase: phase.phase,
          },
        });

        opponentIndex++;
        currentDate = this.addDays(currentDate, daysBetweenMatches);
      }
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
   * Generate training day events
   * Training is available on any day without a match
   */
  scheduleTrainingDays(
    startDate: string,
    endDate: string,
    matchDates: string[]
  ): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const matchDateSet = new Set(
      matchDates.map((d) => new Date(d).toDateString())
    );

    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateString = current.toDateString();

      // If no match on this day, training is available
      if (!matchDateSet.has(dateString)) {
        events.push({
          id: this.generateId('training'),
          date: current.toISOString(),
          type: 'training_available',
          required: false,
          processed: false,
          data: {
            description: 'Training session available',
          },
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return events;
  }

  /**
   * Generate scrim availability events
   * Scrims are available on days without matches (similar to training)
   * Teams can do up to 4 scrims per week
   */
  scheduleScrimDays(
    startDate: string,
    endDate: string,
    matchDates: string[]
  ): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const matchDateSet = new Set(
      matchDates.map((d) => new Date(d).toDateString())
    );

    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateString = current.toDateString();

      // If no match on this day, scrim is available
      if (!matchDateSet.has(dateString)) {
        events.push({
          id: this.generateId('scrim'),
          date: current.toISOString(),
          type: 'scrim_available',
          required: false,
          processed: false,
          data: {
            description: 'Scrim session available',
          },
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return events;
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
   * - Match events for player's team (2 per week)
   * - Monthly salary payments
   * - Tournament phase markers
   */
  generateSeasonSchedule(
    playerTeamId: string,
    opponents: Team[],
    options: ScheduleOptions
  ): CalendarEvent[] {
    const allEvents: CalendarEvent[] = [];
    const { startDate, seasonYear } = options;

    // Generate salary payments for the year (12 months)
    const salaryEvents = this.scheduleSalaryPayments(startDate, 12);
    allEvents.push(...salaryEvents);

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

    // Generate training days (available on non-match days)
    const matchDates = matchEvents.map((e) => e.date);
    const seasonEndDate = this.addDays(startDate, 365); // Full year
    const trainingEvents = this.scheduleTrainingDays(startDate, seasonEndDate, matchDates);
    allEvents.push(...trainingEvents);

    // Generate scrim availability days (available on non-match days)
    const scrimEvents = this.scheduleScrimDays(startDate, seasonEndDate, matchDates);
    allEvents.push(...scrimEvents);

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
   */
  generateInitialSchedule(
    playerTeamId: string,
    allTeams: Team[],
    startDate: string = '2026-01-01T00:00:00.000Z',
    seasonYear: number = 2026
  ): CalendarEvent[] {
    // Get opponents (all teams except player's team)
    const opponents = allTeams.filter((team) => team.id !== playerTeamId);

    return this.generateSeasonSchedule(playerTeamId, opponents, {
      startDate,
      seasonYear,
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
