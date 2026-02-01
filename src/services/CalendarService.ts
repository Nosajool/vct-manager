// CalendarService - Orchestrates time progression and calendar events
// Connects TimeProgression/EventScheduler engines with the Zustand store

import { useGameStore } from '../store';
import { timeProgression, eventScheduler } from '../engine/calendar';
import { economyService } from './EconomyService';
import { matchService } from './MatchService';
import { tournamentService } from './TournamentService';
import { teamSlotResolver } from './TeamSlotResolver';
import type { CalendarEvent, MatchResult, MatchEventData, Region, SeasonPhase } from '../types';

/**
 * Result of advancing time
 */
export interface TimeAdvanceResult {
  success: boolean;
  daysAdvanced: number;
  newDate: string;
  processedEvents: CalendarEvent[];
  skippedEvents: CalendarEvent[];
  needsAttention: CalendarEvent[]; // Events that require player action (matches)
  simulatedMatches: MatchResult[]; // Matches that were auto-simulated
  autoSaveTriggered: boolean;
}

/**
 * CalendarService - Handles all time progression logic
 */
export class CalendarService {
  /**
   * Advance time by one day
   *
   * Game loop flow:
   * 1. User starts at beginning of Day X
   * 2. User does activities (training, roster changes, etc.)
   * 3. User clicks "Advance Day"
   * 4. TODAY's matches (Day X) are simulated
   * 5. User is now at beginning of Day X+1
   */
  advanceDay(): TimeAdvanceResult {
    const state = useGameStore.getState();
    const currentDate = state.calendar.currentDate;
    const newDate = timeProgression.addDays(currentDate, 1);

    // Get events for TODAY (current date) - these are what we simulate before advancing
    const eventsToday = timeProgression.getEventsBetween(
      currentDate,
      currentDate,
      state.calendar.scheduledEvents
    );

    const unprocessedEvents = eventsToday.filter((e) => !e.processed);
    const processedEvents: CalendarEvent[] = [];
    const skippedEvents: CalendarEvent[] = [];
    const simulatedMatches: MatchResult[] = [];

    // Process each event for TODAY
    const currentPhase = state.calendar.currentPhase;

    for (const event of unprocessedEvents) {
      if (event.type === 'salary_payment') {
        // Auto-process salary payments
        this.processSalaryPayment(event);
        processedEvents.push(event);
      } else if (event.type === 'match') {
        // Check if this match belongs to the current phase
        // League matches (stage1, stage2) have a phase property that must match current phase
        const matchData = event.data as MatchEventData;
        const matchPhase = matchData.phase;

        if (matchPhase && matchPhase !== currentPhase) {
          // Skip matches that belong to a different phase
          // Don't mark as processed - they'll be simulated when their phase is active
          skippedEvents.push(event);
          continue;
        }

        // Simulate today's matches before advancing
        const result = this.simulateMatchEvent(event);
        if (result) {
          simulatedMatches.push(result);
          processedEvents.push(event);
        }
      } else if (timeProgression.isRequiredEventType(event.type)) {
        // Auto-mark as processed (informational)
        state.markEventProcessed(event.id);
        processedEvents.push(event);
      } else {
        // Skip optional events that weren't taken (training, scrims, etc.)
        state.markEventProcessed(event.id);
        skippedEvents.push(event);
      }
    }

    // Check if a league stage has completed (all matches played)
    // Always check during stage phases - the last match might have been yesterday
    if (currentPhase === 'stage1' || currentPhase === 'stage2') {
      this.checkStageCompletion(currentPhase);
    }

    // Check tournament completion for ALL regions
    this.checkAllTournamentCompletion(state.calendar.currentPhase);

    // Now advance the date to tomorrow
    state.advanceDay();

    // Check if auto-save should trigger
    const autoSaveTriggered = timeProgression.shouldAutoSave(
      newDate,
      state.lastSaveDate
    );

    if (autoSaveTriggered) {
      state.setLastSaveDate(newDate);
    }

    return {
      success: true,
      daysAdvanced: 1,
      newDate,
      processedEvents,
      skippedEvents,
      needsAttention: [], // Nothing needs attention - we're now at start of new day
      simulatedMatches,
      autoSaveTriggered,
    };
  }

  /**
   * Process a salary payment event
   * Uses EconomyService to process full monthly finances
   */
  processSalaryPayment(event: CalendarEvent): void {
    const state = useGameStore.getState();
    const teams = Object.values(state.teams);

    // Process monthly finances for all teams
    for (const team of teams) {
      try {
        const result = economyService.processMonthlyFinances(team.id);

        // Log warnings for player's team
        if (team.id === state.playerTeamId && result.warnings.length > 0) {
          console.warn('Financial warnings:', result.warnings);
          // TODO: Show notifications to player
        }
      } catch (error) {
        console.error(`Error processing finances for team ${team.id}:`, error);
      }
    }

    // Mark event as processed
    state.markEventProcessed(event.id);
  }

  /**
   * Simulate a match from a calendar event
   * Returns the match result if successful, null otherwise
   */
  simulateMatchEvent(event: CalendarEvent): MatchResult | null {
    const state = useGameStore.getState();
    const data = event.data as MatchEventData;

    if (!data.matchId) {
      console.warn('Match event has no matchId:', event.id);
      state.markEventProcessed(event.id);
      return null;
    }

    // Try to simulate the match
    const result = matchService.simulateMatch(data.matchId);

    if (result) {
      // Mark calendar event as processed
      state.markEventProcessed(event.id);
      console.log(`Auto-simulated match: ${data.matchId}`);
    } else {
      console.warn(`Failed to simulate match: ${data.matchId}`);
    }

    return result;
  }

  /**
   * Get today's activities from the calendar
   */
  getTodaysActivities(): CalendarEvent[] {
    return useGameStore.getState().getTodaysActivities();
  }

  /**
   * Get upcoming events
   */
  getUpcomingEvents(limit: number = 10): CalendarEvent[] {
    return useGameStore.getState().getUpcomingEvents(limit);
  }

  /**
   * Get next match
   */
  getNextMatch(): CalendarEvent | undefined {
    return useGameStore.getState().getNextMatchEvent();
  }

  /**
   * Get current date
   */
  getCurrentDate(): string {
    return useGameStore.getState().calendar.currentDate;
  }

  /**
   * Get formatted current date
   */
  getFormattedDate(): string {
    return timeProgression.formatDate(this.getCurrentDate());
  }

  /**
   * Get days until next match
   */
  getDaysUntilNextMatch(): number | null {
    const nextMatch = this.getNextMatch();
    if (!nextMatch) return null;

    return timeProgression.getDaysDifference(
      this.getCurrentDate(),
      nextMatch.date
    );
  }

  /**
   * Generate schedule for the season
   * Called during game initialization
   */
  generateSeasonSchedule(playerTeamId: string): CalendarEvent[] {
    const state = useGameStore.getState();
    const teams = Object.values(state.teams);
    const startDate = '2026-01-01T00:00:00.000Z';

    const events = eventScheduler.generateInitialSchedule(
      playerTeamId,
      teams,
      startDate
    );

    // Add events to the calendar
    state.addCalendarEvents(events);

    return events;
  }

  /**
   * Check if a league stage (Stage 1 or Stage 2) has completed
   * If all league matches are done, trigger the stage completion modal
   */
  checkStageCompletion(currentPhase: string): void {
    // Only check during stage1 or stage2 phases
    if (currentPhase !== 'stage1' && currentPhase !== 'stage2') {
      return;
    }

    const stageType = currentPhase as 'stage1' | 'stage2';
    const { complete, tournamentId } = tournamentService.isStageComplete(stageType);

    if (complete && tournamentId) {
      console.log(`${currentPhase} league complete! Triggering completion handler.`);
      tournamentService.handleStageCompletion(tournamentId);
    }
  }

  /**
   * Clear processed events from the calendar (cleanup)
   */
  cleanupProcessedEvents(): void {
    useGameStore.getState().clearProcessedEvents();
  }

  /**
   * Mark a specific event as processed
   */
  markEventProcessed(eventId: string): void {
    useGameStore.getState().markEventProcessed(eventId);
  }

  /**
   * Get event by ID
   */
  getEventById(eventId: string): CalendarEvent | undefined {
    const events = useGameStore.getState().calendar.scheduledEvents;
    return events.find((e) => e.id === eventId);
  }

  /**
   * Check if there's a match today
   */
  hasMatchToday(): boolean {
    const activities = this.getTodaysActivities();
    return activities.some((a) => a.type === 'match');
  }

  /**
   * Get human-readable description of next match
   */
  getNextMatchDescription(): string | null {
    const nextMatch = this.getNextMatch();
    if (!nextMatch) return null;

    return timeProgression.getEventDescription(nextMatch);
  }

  /**
   * Check tournament completion for ALL regions
   * Triggers qualification resolution when tournaments complete
   */
  checkAllTournamentCompletion(currentPhase: SeasonPhase): void {
    const regions: Region[] = ['Americas', 'EMEA', 'Pacific', 'China'];

    for (const region of regions) {
      // Find tournaments for this phase and region that might be complete
      const tournament = this.findTournamentForPhaseAndRegion(currentPhase, region);

      if (tournament && this.isTournamentComplete(tournament.id)) {
        // Tournament is complete, trigger qualification resolution
        console.log(`Tournament ${tournament.name} complete, resolving qualifications`);
        this.handleTournamentCompletion(tournament.id);
      }
    }

    // Also check international tournaments (Masters, Champions)
    if (currentPhase === 'masters1' || currentPhase === 'masters2' || currentPhase === 'champions') {
      const internationalTournament = this.findInternationalTournament(currentPhase);
      if (internationalTournament && this.isTournamentComplete(internationalTournament.id)) {
        console.log(`International tournament ${internationalTournament.name} complete`);
        this.handleTournamentCompletion(internationalTournament.id);
      }
    }
  }

  /**
   * Find tournament for a specific phase and region
   */
  private findTournamentForPhaseAndRegion(
    phase: SeasonPhase,
    region: Region
  ): { id: string; name: string } | null {
    const state = useGameStore.getState();

    // Map phase to tournament type
    const phaseToType: Record<string, string> = {
      kickoff: 'kickoff',
      stage1: 'stage1',
      stage1_playoffs: 'stage1',
      stage2: 'stage2',
      stage2_playoffs: 'stage2',
    };

    const tournamentType = phaseToType[phase];
    if (!tournamentType) return null;

    // Find matching tournament
    for (const tournament of Object.values(state.tournaments)) {
      if (tournament.type === tournamentType && tournament.region === region) {
        // For playoffs phases, check if this is a playoffs tournament
        if (phase.includes('_playoffs') && !tournament.name.includes('Playoffs')) {
          continue;
        }
        // For non-playoffs phases, skip playoffs tournaments
        if (!phase.includes('_playoffs') && tournament.name.includes('Playoffs')) {
          continue;
        }
        return { id: tournament.id, name: tournament.name };
      }
    }

    return null;
  }

  /**
   * Find international tournament for a phase
   */
  private findInternationalTournament(
    phase: SeasonPhase
  ): { id: string; name: string } | null {
    const state = useGameStore.getState();

    const phaseToType: Record<string, string> = {
      masters1: 'masters',
      masters2: 'masters',
      champions: 'champions',
    };

    const tournamentType = phaseToType[phase];
    if (!tournamentType) return null;

    for (const tournament of Object.values(state.tournaments)) {
      if (tournament.type === tournamentType && tournament.region === 'International') {
        // For masters, distinguish by name
        if (tournamentType === 'masters') {
          if (phase === 'masters1' && tournament.name.includes('Santiago')) {
            return { id: tournament.id, name: tournament.name };
          }
          if (phase === 'masters2' && tournament.name.includes('London')) {
            return { id: tournament.id, name: tournament.name };
          }
        } else {
          return { id: tournament.id, name: tournament.name };
        }
      }
    }

    return null;
  }

  /**
   * Check if a tournament is complete
   */
  private isTournamentComplete(tournamentId: string): boolean {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) return false;

    // Already marked complete
    if (tournament.status === 'completed') return true;

    // For round-robin (leagues), ALWAYS check if all matches are completed
    // Don't rely on championId since round-robin doesn't have a single champion
    if (tournament.format === 'round_robin') {
      const tournamentMatches = Object.values(state.matches).filter(
        (m) => m.tournamentId === tournamentId
      );

      if (tournamentMatches.length === 0) return false;

      return tournamentMatches.every((m) => m.status === 'completed');
    }

    // For non-round-robin formats, check if champion has been determined
    if (tournament.championId) return true;

    return false;
  }

  /**
   * Handle tournament completion - resolve qualifications
   */
  private handleTournamentCompletion(tournamentId: string): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) return;

    // Mark as completed if not already
    if (tournament.status !== 'completed') {
      state.updateTournament(tournamentId, { status: 'completed' });
    }

    // Resolve qualifications to downstream tournaments
    teamSlotResolver.resolveQualifications(tournamentId);
  }
}

// Export singleton instance
export const calendarService = new CalendarService();

