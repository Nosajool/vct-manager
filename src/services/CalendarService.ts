// CalendarService - Orchestrates time progression and calendar events
// Connects TimeProgression/EventScheduler engines with the Zustand store

import { useGameStore } from '../store';
import { timeProgression, eventScheduler } from '../engine/calendar';
import { economyService } from './EconomyService';
import { matchService } from './MatchService';
import { tournamentService } from './TournamentService';
import { teamSlotResolver } from './TeamSlotResolver';
import { featureGateService } from './FeatureGateService';
import { progressTrackingService } from './ProgressTrackingService';
import { dramaService } from './DramaService';
import { reputationService, type ReputationDelta } from './ReputationService';
import { rivalryService, type RivalryDelta } from './RivalryService';
import { interviewService } from './InterviewService';
import { matchMoraleCalculator } from '../engine/match';
import type { MatchMoraleResult } from '../types';
import type { PendingInterview } from '../types/interview';
import { activityResolutionService } from './ActivityResolutionService';
import { trainingService } from './TrainingService';
import { scrimService } from './ScrimService';
import { eventLifecycleManager } from '../engine/scheduling/EventLifecycleManager';
import type { CalendarEvent, MatchResult, MatchEventData, Region, SeasonPhase } from '../types';
import type { BracketMatch, BracketRound, BracketStructure, Tournament } from '../types/competition';
import type { TournamentMatchContext } from '../types/interview';
import type { FeatureUnlock, FeatureType } from '../data/featureUnlocks';
import type { DramaEventInstance } from '../types/drama';
import type { ActivityResolutionResult, ActivityConfig, TrainingActivityConfig, ScrimActivityConfig } from '../types/activityPlan';
import { isLeagueToPlayoffTournament } from '../types';

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
  newlyUnlockedFeatures: FeatureUnlock[]; // Features that unlocked as a result of this advance
  dramaEvents: DramaEventInstance[]; // Drama events that triggered today
  activityResults?: ActivityResolutionResult; // Results from resolved training/scrim activities
  reputationDelta?: ReputationDelta;   // Reputation change from player team matches today
  rivalryDelta?: RivalryDelta;         // Rivalry change from player team matches today
  interviewQueue?: PendingInterview[]; // Interviews to show after SimulationResultsModal
  crisisInterview?: PendingInterview;  // Crisis interview to show (after post-match interview)
  generalInterview?: PendingInterview; // General media-day interview for non-match days
  moraleChanges?: MatchMoraleResult;   // Morale changes from player team match
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
    *
    * @param withProgress - Whether to track and report progress
    * @returns Promise resolving to the time advance result
    */
   async advanceDay(withProgress?: boolean): Promise<TimeAdvanceResult> {
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

    // Debug logging
    console.log(`CalendarService.advanceDay: Processing ${currentDate}`);
    console.log(`  Total events in store: ${state.calendar.scheduledEvents.length}`);
    console.log(`  Events today: ${eventsToday.length}`);
    console.log(`  Unprocessed events: ${unprocessedEvents.length}`);
    if (unprocessedEvents.length > 0) {
      console.log(`  Events:`, unprocessedEvents.map(e => ({ id: e.id, type: e.type, date: e.date })));
    }
    const processedEvents: CalendarEvent[] = [];
    const skippedEvents: CalendarEvent[] = [];
    const simulatedMatches: MatchResult[] = [];
    let reputationDelta: ReputationDelta | undefined;
    let rivalryDelta: RivalryDelta | undefined;
    let interviewQueue: PendingInterview[] | undefined;
    let moraleChanges: MatchMoraleResult | undefined;

    // Setup progress tracking if requested
    if (withProgress && unprocessedEvents.length > 0) {
      progressTrackingService.startCalendarSimulation(unprocessedEvents.length);
    }

    // Process each event for TODAY
    const currentPhase = state.calendar.currentPhase;
    console.log(`  Current phase: ${currentPhase}`);

    // Separate events into required and scheduled activities
    const requiredEvents: CalendarEvent[] = [];
    const scheduledActivities: CalendarEvent[] = []; // scheduled_training, scheduled_scrim

    for (const event of unprocessedEvents) {
      if (
        event.type === 'scheduled_training' ||
        event.type === 'scheduled_scrim'
      ) {
        scheduledActivities.push(event);
      } else {
        requiredEvents.push(event);
      }
    }

    // Phase 4: Lifecycle state transitions for scheduled activities
    // Handle lifecycle transitions at day start (before processing)
    for (const event of scheduledActivities) {
      const config = state.getActivityConfigByEventId(event.id);

      if (config) {
        // Transition configured → locked
        if (config.status === 'configured') {
          const transitionResult = eventLifecycleManager.transitionToLocked(config.status);
          if (transitionResult.valid) {
            // Update both the event and the config
            state.updateEventLifecycleState(event.id, 'locked');
            state.setActivityConfig({ ...config, status: 'locked' });
            console.log(`  Transitioned ${event.type} (${event.id}) to locked state`);
          }
        }
      } else {
        // No config found - check if this is a needs_setup activity
        // Auto-configure at 80% efficiency
        if (event.type === 'scheduled_training') {
          const trainingPlan = trainingService.autoAssignTraining();
          const assignments = Array.from(trainingPlan.values()).map(assignment => ({
            playerId: assignment.playerId,
            action: 'train' as const,
            goal: assignment.goal,
            intensity: assignment.intensity,
          }));

          const autoConfig: TrainingActivityConfig = {
            type: 'training',
            id: crypto.randomUUID(),
            date: event.date,
            eventId: event.id,
            status: 'locked', // Immediately locked since it's today
            assignments,
            autoConfigured: true,
          };

          state.setActivityConfig(autoConfig);
          state.updateEventLifecycleState(event.id, 'locked');
          console.log(`  Auto-configured training activity (${event.id}) at 80% efficiency`);
        } else if (event.type === 'scheduled_scrim') {
          const scrimOptions = scrimService.generateAutoConfig();

          if (scrimOptions) {
            const autoConfig: ScrimActivityConfig = {
              type: 'scrim',
              id: crypto.randomUUID(),
              date: event.date,
              eventId: event.id,
              status: 'locked', // Immediately locked since it's today
              action: 'play',
              partnerTeamId: scrimOptions.partnerTeamId,
              maps: scrimOptions.focusMaps || [],
              intensity: scrimOptions.intensity || 'moderate',
              autoConfigured: true,
            };

            state.setActivityConfig(autoConfig);
            state.updateEventLifecycleState(event.id, 'locked');
            console.log(`  Auto-configured scrim activity (${event.id}) at 80% efficiency`);
          } else {
            // Auto-config failed - skip the scrim
            const skipConfig: ScrimActivityConfig = {
              type: 'scrim',
              id: crypto.randomUUID(),
              date: event.date,
              eventId: event.id,
              status: 'locked',
              action: 'skip',
              autoConfigured: true,
            };

            state.setActivityConfig(skipConfig);
            state.updateEventLifecycleState(event.id, 'locked');
            console.log(`  Auto-configured scrim to skip (${event.id}) - no partner available`);
          }
        }
      }
    }

    // Initialize activity resolution result
    let activityResults: ActivityResolutionResult | undefined;

    // Process required events (matches, salary payments, tournaments)
    for (let i = 0; i < requiredEvents.length; i++) {
      const event = requiredEvents[i];

      // Update progress
      if (withProgress) {
        progressTrackingService.updateProgress(
          i + 1,
          `Processing event ${i + 1}/${unprocessedEvents.length}: ${event.type}`
        );
      }
      if (event.type === 'salary_payment') {
        // Auto-process salary payments
        this.processSalaryPayment(event);
        processedEvents.push(event);
      } else if (event.type === 'tournament_start') {
        // Transition tournament from 'upcoming' to 'in_progress'
        this.processTournamentStart(event);
        processedEvents.push(event);
      } else if (event.type === 'match') {
        // Check if this match belongs to the current phase
        // League matches (stage1, stage2) have a phase property that must match current phase
        const matchData = event.data as MatchEventData;
        const matchPhase = matchData.phase;

        console.log(`  Processing match event ${event.id}: matchPhase=${matchPhase}, isPlayoffMatch=${matchData.isPlayoffMatch}`);

        if (matchPhase && matchPhase !== currentPhase) {
          // Skip matches that belong to a different phase
          // Don't mark as processed - they'll be simulated when their phase is active
          console.log(`    SKIPPED: phase mismatch (event phase: ${matchPhase}, current: ${currentPhase})`);
          skippedEvents.push(event);
          continue;
        }

        // Simulate today's matches before advancing
        const result = await this.simulateMatchEvent(event);
        if (result) {
          simulatedMatches.push(result);
          processedEvents.push(event);

          // Check if this is the player's team match (direct comparison instead of flag)
          // TODO: Fix isPlayerMatch flag in tournament match events (tech debt)
          const isPlayerMatch = (matchData.homeTeamId === state.playerTeamId || 
                                 matchData.awayTeamId === state.playerTeamId);

          // Process reputation and rivalry for player team matches
          if (isPlayerMatch && state.playerTeamId) {
            const playerTeam = state.teams[state.playerTeamId];
            if (playerTeam) {
              const tournament = matchData.tournamentId
                ? state.tournaments[matchData.tournamentId]
                : undefined;
              reputationDelta = reputationService.processMatchReputation(
                result,
                state.playerTeamId,
                playerTeam,
                tournament?.type,
                matchData.isPlayoffMatch,
              );
              rivalryDelta = rivalryService.processMatchRivalry(
                result,
                state.playerTeamId,
                matchData.isPlayoffMatch,
              ) ?? undefined;

              // Calculate morale changes for player team match
              const opponentTeamId = result.winnerId === state.playerTeamId
                ? result.loserId
                : result.winnerId;
              const opponentTeam = state.teams[opponentTeamId];
              const rivalry = state.rivalries?.[opponentTeamId];

              const playerRoster = (state.teams[state.playerTeamId]?.playerIds ?? [])
                .map(id => state.players[id])
                .filter(Boolean)
                .map(p => ({ id: p.id, name: p.name, morale: p.morale }));

              moraleChanges = matchMoraleCalculator.calculate({
                matchResult: result,
                playerTeamId: state.playerTeamId,
                playerTeamPlayers: playerRoster,
                rivalryIntensity: rivalry?.intensity ?? 0,
                isPlayoffMatch: matchData.isPlayoffMatch ?? false,
                opponentWinStreak: Math.max(0, opponentTeam?.standings?.currentStreak ?? 0),
                hypeLevel: playerTeam.reputation?.hypeLevel,
              });

              // Apply morale changes to store
              for (const change of moraleChanges.playerChanges) {
                state.updatePlayer(change.playerId, { morale: change.newMorale });
              }

              // Check for post-match press conference (at most once; first match wins)
              if (!interviewQueue?.length) {
                const tournamentContext = this.computeTournamentMatchContext(
                  result,
                  state.playerTeamId,
                  matchData.tournamentId,
                  state.tournaments,
                );
                const queue = interviewService.checkPostMatchPressConference(
                  result,
                  state.playerTeamId,
                  playerTeam,
                  matchData.isPlayoffMatch,
                  undefined, // isUpsetWin
                  tournamentContext,
                );
                if (queue.length > 0) {
                  interviewQueue = queue;
                }
              }
            }
          }
        }
      } else if (timeProgression.isRequiredEventType(event.type)) {
        // Auto-mark as processed (informational)
        state.markEventProcessed(event.id);
        processedEvents.push(event);
      } else {
        // Fallback for other required events
        state.markEventProcessed(event.id);
        processedEvents.push(event);
      }
    }

    // Process scheduled activities (training, scrim) using activity configs
    if (scheduledActivities.length > 0) {
      const activityConfigs: ActivityConfig[] = [];

      for (const event of scheduledActivities) {
        // Feature gate check - map event type to feature name
        const featureMap: Record<string, FeatureType> = {
          'scheduled_training': 'training',
          'scheduled_scrim': 'scrims'
        };
        const featureName = featureMap[event.type];

        if (featureName && !featureGateService.isFeatureUnlocked(featureName)) {
          // Feature is locked - skip this activity
          state.markEventProcessed(event.id);
          skippedEvents.push(event);
          console.log(`  Skipping locked feature: ${event.type} (${event.id})`);
          continue;
        }

        const config = state.getActivityConfigByEventId(event.id);

        if (config && config.status === 'locked') {
          // Collect locked activities for resolution
          // They will be transitioned to completed after resolution
          activityConfigs.push(config);

          console.log(`  Processing locked activity: ${event.type} (${event.id})`);
        } else {
          // No config or not in locked state - skip the activity
          state.markEventProcessed(event.id);
          skippedEvents.push(event);

          console.log(`  Skipping activity not in locked state: ${event.type} (${event.id}) - status: ${config?.status || 'no config'}`);
        }
      }

      // Resolve all locked activities
      if (activityConfigs.length > 0) {
        console.log(`  Resolving ${activityConfigs.length} locked activities`);
        activityResults = await activityResolutionService.resolveAllActivities(activityConfigs);

        // Transition locked → completed after resolution
        for (const config of activityConfigs) {
          const transitionResult = eventLifecycleManager.transitionToCompleted('locked');
          if (transitionResult.valid) {
            state.updateEventLifecycleState(config.eventId, 'completed');
            state.setActivityConfig({ ...config, status: 'completed' });
            state.markEventProcessed(config.eventId);
            processedEvents.push(scheduledActivities.find(e => e.id === config.eventId)!);
            console.log(`  Completed activity: ${config.eventId}`);
          }
        }
      }

      // Clear today's configs from slice
      state.clearConfigsForDate(currentDate);
    }

    // Mark progress as complete
    if (withProgress) {
      progressTrackingService.completeSimulation('Day processing complete');
    }

    // Check if a league stage has completed (all matches played)
    // Always check during stage phases - the last match might have been yesterday
    if (currentPhase === 'stage1' || currentPhase === 'stage2') {
      this.checkStageCompletion(currentPhase);
    }

    // Check tournament completion for ALL regions
    this.checkAllTournamentCompletion(state.calendar.currentPhase);

    // Capture unlocked features BEFORE advancing (for comparison)
    const unlockedFeaturesBefore = featureGateService.getUnlockedFeatures();

    // Now advance the date to tomorrow
    state.advanceDay();

    // Capture unlocked features AFTER advancing
    const unlockedFeaturesAfter = featureGateService.getUnlockedFeatures();

    // Find newly unlocked features
    const newlyUnlocked: FeatureUnlock[] = [];
    for (const feature of unlockedFeaturesAfter) {
      if (!unlockedFeaturesBefore.includes(feature)) {
        // This feature was just unlocked!
        const unlock = featureGateService.getFeatureUnlock(feature);
        if (unlock) {
          newlyUnlocked.push(unlock);
        }
      }
    }

    // Weekly hype decay and rivalry decay — fire every Sunday
    if (new Date(newDate).getDay() === 0 && state.playerTeamId) {
      const playerTeam = state.teams[state.playerTeamId];
      if (playerTeam) {
        reputationService.processWeeklyHypeDecay(playerTeam, state.playerTeamId);
      }
      rivalryService.processRivalryDecay(newDate);
    }

    // Evaluate drama events for today
    const dramaEvents = dramaService.evaluateDay();

    // Check for crisis interview (daily - both match and non-match days)
    let crisisInterview: PendingInterview | undefined;
    if (state.playerTeamId) {
      const playerTeam = state.teams[state.playerTeamId];
      if (playerTeam) {
        const dramaState = {
          activeFlags: state.activeFlags,
        };
        crisisInterview = interviewService.checkCrisisInterview(
          dramaState,
          playerTeam,
          currentDate,
        ) ?? undefined;
      }
    }

    // Check for general interview (non-match days only)
    const isMatchDay = simulatedMatches.length > 0;
    let generalInterview: PendingInterview | undefined;
    if (!isMatchDay && state.playerTeamId) {
      generalInterview = interviewService.checkGeneralInterview(currentDate) ?? undefined;
    }

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
      newlyUnlockedFeatures: newlyUnlocked,
      dramaEvents,
      activityResults,
      reputationDelta,
      rivalryDelta,
      interviewQueue,
      crisisInterview: crisisInterview ?? undefined,
      generalInterview: generalInterview ?? undefined,
      moraleChanges,
    };
  }

  /**
   * Process a tournament start event
   * Transitions tournament status from 'upcoming' to 'in_progress'
   */
  processTournamentStart(event: CalendarEvent): void {
    const state = useGameStore.getState();
    const data = event.data as { tournamentId: string; tournamentName: string };

    if (!data.tournamentId) {
      console.warn('Tournament start event has no tournamentId:', event.id);
      state.markEventProcessed(event.id);
      return;
    }

    const tournament = state.tournaments[data.tournamentId];
    if (!tournament) {
      console.warn(`Tournament not found: ${data.tournamentId}`);
      state.markEventProcessed(event.id);
      return;
    }

    // Only transition if currently upcoming
    if (tournament.status === 'upcoming') {
      state.updateTournament(data.tournamentId, { status: 'in_progress' });
      console.log(`Tournament started: ${data.tournamentName} (${data.tournamentId})`);
    }

    state.markEventProcessed(event.id);
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
  async simulateMatchEvent(event: CalendarEvent): Promise<MatchResult | null> {
    const state = useGameStore.getState();
    const data = event.data as MatchEventData;

    if (!data.matchId) {
      console.warn('Match event has no matchId:', event.id);
      state.markEventProcessed(event.id);
      return null;
    }

    // Try to simulate the match
    const result = await matchService.simulateMatch(data.matchId);

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

    const isPlayoffPhase = phase.includes('_playoffs');

    // Find matching tournament
    for (const tournament of Object.values(state.tournaments)) {
      if (tournament.type === tournamentType && tournament.region === region) {
        // For league_to_playoff tournaments, check currentStage instead of name
        if (isLeagueToPlayoffTournament(tournament)) {
          const isInPlayoffStage = tournament.currentStage === 'playoff';
          // During playoffs phase, only match tournaments in playoff stage
          if (isPlayoffPhase && !isInPlayoffStage) {
            continue;
          }
          // During league phase, only match tournaments in league stage
          if (!isPlayoffPhase && isInPlayoffStage) {
            continue;
          }
          return { id: tournament.id, name: tournament.name };
        }

        // Legacy handling for separate tournament architecture
        // For playoffs phases, check if this is a playoffs tournament
        if (isPlayoffPhase && !tournament.name.includes('Playoffs')) {
          continue;
        }
        // For non-playoffs phases, skip playoffs tournaments
        if (!isPlayoffPhase && tournament.name.includes('Playoffs')) {
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
   * Compute TournamentMatchContext from the just-completed match's bracket data.
   * Used to enrich post-match interviews with bracket awareness.
   */
  private computeTournamentMatchContext(
    matchResult: MatchResult,
    playerTeamId: string,
    tournamentId: string | undefined,
    tournaments: Record<string, Tournament>,
  ): TournamentMatchContext | undefined {
    if (!tournamentId) return undefined;
    const tournament = tournaments[tournamentId];
    if (!tournament) return undefined;

    const bracket = tournament.bracket;

    // Find the BracketMatch corresponding to this match result
    const bracketEntry = findBracketMatchById(bracket, matchResult.matchId);
    if (!bracketEntry) {
      // Could be grand final
      const gf = bracket.grandfinal;
      if (gf && gf.matchId === matchResult.matchId) {
        const opponentTeamId = gf.teamAId === playerTeamId ? gf.teamBId : gf.teamAId;
        return {
          bracketPosition: 'upper',
          eliminationRisk: gf.loserDestination.type === 'eliminated',
          isGrandFinal: true,
          opponent: opponentTeamId
            ? this.buildOpponentContext(opponentTeamId, bracket, matchResult.matchId, tournaments)
            : undefined,
        };
      }
      return undefined;
    }

    const { match, round } = bracketEntry;
    const bracketPosition: 'upper' | 'lower' = round.bracketType === 'lower' ? 'lower' : 'upper';
    const opponentTeamId = match.teamAId === playerTeamId ? match.teamBId : match.teamAId;

    return {
      bracketPosition,
      eliminationRisk: match.loserDestination.type === 'eliminated',
      isGrandFinal: false,
      opponent: opponentTeamId
        ? this.buildOpponentContext(opponentTeamId, bracket, matchResult.matchId, tournaments)
        : undefined,
    };
  }

  /**
   * Build opponent sub-context: whether they dropped from upper bracket,
   * their recent win streak, and rivalry level.
   */
  private buildOpponentContext(
    opponentTeamId: string,
    bracket: BracketStructure,
    currentMatchId: string,
    _tournaments: Record<string, Tournament>,
  ): TournamentMatchContext['opponent'] {
    const state = useGameStore.getState();

    const droppedFromUpper = didTeamDropFromUpper(bracket, opponentTeamId);

    // Compute opponent recent win streak from their match history (excluding current match)
    const opponentHistory = state.getTeamMatchHistory(opponentTeamId);
    let recentWinStreak = 0;
    for (const result of opponentHistory) {
      if (result.matchId === currentMatchId) continue;
      if (result.winnerId === opponentTeamId) {
        recentWinStreak++;
      } else {
        break;
      }
    }

    const rivalry = state.rivalries?.[opponentTeamId];
    const rivalryLevel = rivalry?.intensity ?? 0;

    return { teamId: opponentTeamId, droppedFromUpper, recentWinStreak, rivalryLevel };
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

// ============================================================================
// Bracket navigation helpers (module-private)
// ============================================================================

/**
 * Find a BracketMatch by its matchId across all bracket rounds.
 * Returns the match and its parent BracketRound, or null if not found.
 */
function findBracketMatchById(
  bracket: BracketStructure,
  matchId: string,
): { match: BracketMatch; round: BracketRound } | null {
  const roundGroups: BracketRound[][] = [
    bracket.upper,
    ...(bracket.lower ? [bracket.lower] : []),
    ...(bracket.middle ? [bracket.middle] : []),
  ];

  for (const rounds of roundGroups) {
    for (const round of rounds) {
      for (const match of round.matches) {
        if (match.matchId === matchId) return { match, round };
      }
    }
  }
  return null;
}

/**
 * Returns true if the given team has ever been the loser of an upper bracket match
 * in the provided bracket (i.e., they dropped from upper to lower).
 */
function didTeamDropFromUpper(bracket: BracketStructure, teamId: string): boolean {
  for (const round of bracket.upper) {
    for (const match of round.matches) {
      if (match.loserId === teamId && match.status === 'completed') {
        return true;
      }
    }
  }
  return false;
}

