// FastForwardService - Debug-only headless day simulation
// Loops N days calling CalendarService.advanceDay() and auto-resolving all decision modals

import { useGameStore } from '../store';
import { calendarService } from './CalendarService';
import { interviewService } from './InterviewService';
import { dramaService } from './DramaService';
import { tournamentService } from './TournamentService';
import { tournamentTransitionService } from './TournamentTransitionService';
import type { PendingInterview } from '../types/interview';
import type { DramaChoice } from '../types/drama';
import type { Region } from '../types';
import type { StageCompletionModalData } from '../components/tournament/StageCompletionModal';
import type { MastersCompletionModalData } from '../components/tournament/MastersCompletionModal';
import type { QualificationModalData } from '../components/tournament/QualificationModal';
import { DRAMA_EVENT_TEMPLATES } from '../data/drama';

export type AutoResolveStrategy = 'first' | 'random' | 'best';

export interface FastForwardStrategyConfig {
  preMatchInterview: AutoResolveStrategy;
  postMatchInterview: AutoResolveStrategy;
  crisisInterview: AutoResolveStrategy;
  generalInterview: AutoResolveStrategy;
  dramaEvents: AutoResolveStrategy;
}

export interface FastForwardConfig {
  days: number;
  strategies: FastForwardStrategyConfig;
}

export interface FastForwardProgress {
  currentDay: number;
  totalDays: number;
  currentDate: string;
  action: string;
}

export interface FastForwardResult {
  daysSimulated: number;
  cancelled: boolean;
  startDate: string;
  endDate: string;
  totalMatchesPlayed: number;
  playerTeamWins: number;
  playerTeamLosses: number;
  totalInterviewsResolved: number;
  totalDramaEventsResolved: number;
  phaseChanges: Array<{ fromPhase: string; toPhase: string; date: string }>;
}

// ============================================================================
// Auto-resolve helpers
// ============================================================================

function pickInterviewChoice(interview: PendingInterview, strategy: AutoResolveStrategy): number {
  if (interview.options.length === 0) return 0;
  if (strategy === 'first') return 0;
  if (strategy === 'random') return Math.floor(Math.random() * interview.options.length);
  // best: score each option by its positive effects minus dramaChance penalty
  let bestIdx = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < interview.options.length; i++) {
    const e = interview.options[i].effects;
    const score =
      (e.morale ?? 0) +
      (e.fanbase ?? 0) +
      (e.hype ?? 0) +
      (e.sponsorTrust ?? 0) -
      (e.dramaChance ?? 0) * 2;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function pickDramaChoice(choices: DramaChoice[], strategy: AutoResolveStrategy): string {
  if (choices.length === 0) return '';
  if (strategy === 'first') return choices[0].id;
  if (strategy === 'random') return choices[Math.floor(Math.random() * choices.length)].id;
  // best: sum effect deltas, pick max
  let bestId = choices[0].id;
  let bestScore = -Infinity;
  for (const choice of choices) {
    const score = choice.effects.reduce((sum, e) => sum + (e.delta ?? 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestId = choice.id;
    }
  }
  return bestId;
}

// ============================================================================
// Modal auto-handler
// ============================================================================

function autoHandleModal(type: string, data: unknown): void {
  if (type === 'stage_completion') {
    const d = data as StageCompletionModalData;
    if (d.internalTransition) {
      const newPhase = d.stageType === 'stage1' ? 'stage1_playoffs' : 'stage2_playoffs';
      tournamentService.transitionLeagueToPlayoffs(d.tournamentId);
      useGameStore.getState().setCurrentPhase(newPhase);
    } else if (d.nextTransitionId) {
      const state = useGameStore.getState();
      const playerTeamId = state.playerTeamId;
      const playerRegion = playerTeamId ? state.teams[playerTeamId]?.region : undefined;
      tournamentTransitionService.executeTransition(d.nextTransitionId, playerRegion as Region | undefined);
    }
  } else if (type === 'masters_completion') {
    const d = data as MastersCompletionModalData;
    if (d.nextTransitionId) {
      tournamentTransitionService.executeTransition(d.nextTransitionId);
    }
  } else if (type === 'qualification') {
    const d = data as QualificationModalData;
    tournamentTransitionService.executeTransition(d.transitionConfigId, d.playerRegion as Region);
  }
  useGameStore.getState().closeModal();
}

// ============================================================================
// FastForwardService
// ============================================================================

class FastForwardService {
  async run(
    config: FastForwardConfig,
    cancellationToken: { cancelled: boolean },
    onProgress: (p: FastForwardProgress) => void,
  ): Promise<FastForwardResult> {
    const startDate = useGameStore.getState().calendar.currentDate;
    let endDate = startDate;
    let daysSimulated = 0;
    let totalMatchesPlayed = 0;
    let playerTeamWins = 0;
    let playerTeamLosses = 0;
    let totalInterviewsResolved = 0;
    let totalDramaEventsResolved = 0;
    const phaseChanges: Array<{ fromPhase: string; toPhase: string; date: string }> = [];

    for (let day = 0; day < config.days; day++) {
      if (cancellationToken.cancelled) break;

      const state = useGameStore.getState();
      const currentDate = state.calendar.currentDate;
      const phaseBefore = state.calendar.currentPhase;

      // Close any stale open modal before this day
      if (state.isModalOpen && state.modalType) {
        autoHandleModal(state.modalType, state.modalData);
      }

      onProgress({
        currentDay: day + 1,
        totalDays: config.days,
        currentDate,
        action: 'Checking pre-match interviews…',
      });

      // Pre-match interview (replicate TimeBar.checkAndShowPreMatchInterview)
      const playerTeamId = state.playerTeamId;
      if (playerTeamId) {
        const matchEvents = state.calendar.scheduledEvents.filter(
          (e) => e.type === 'match' && e.date === currentDate && !e.processed
        );
        const playerMatchEvent = matchEvents.find((e) => {
          const d = e.data as { homeTeamId?: string; awayTeamId?: string };
          return d.homeTeamId === playerTeamId || d.awayTeamId === playerTeamId;
        });

        if (playerMatchEvent) {
          const matchData = playerMatchEvent.data as { matchId?: string; isPlayoffMatch?: boolean };
          const matchId = matchData.matchId;
          if (matchId) {
            const team = state.teams[playerTeamId];
            const isPlayoffMatch = matchData.isPlayoffMatch ?? false;
            const preQueue = interviewService.checkPreMatchPressConference(
              matchId,
              playerTeamId,
              team,
              isPlayoffMatch,
            );
            for (const interview of preQueue) {
              if (interview.options.length > 0) {
                const idx = pickInterviewChoice(interview, config.strategies.preMatchInterview);
                interviewService.resolveInterview(interview, idx, currentDate);
                totalInterviewsResolved++;
              }
            }
          }
        }
      }

      onProgress({
        currentDay: day + 1,
        totalDays: config.days,
        currentDate,
        action: 'Advancing day…',
      });

      // Advance the day
      const result = await calendarService.advanceDay();

      endDate = result.newDate;
      daysSimulated++;

      // Track match stats
      const storeAfterAdvance = useGameStore.getState();
      const playerTeamIdAfter = storeAfterAdvance.playerTeamId;
      if (playerTeamIdAfter) {
        for (const matchResult of result.simulatedMatches) {
          totalMatchesPlayed++;
          const match = storeAfterAdvance.matches[matchResult.matchId];
          if (match) {
            const playerInvolved = match.teamAId === playerTeamIdAfter || match.teamBId === playerTeamIdAfter;
            if (playerInvolved) {
              if (matchResult.winnerId === playerTeamIdAfter) playerTeamWins++;
              else playerTeamLosses++;
            }
          }
        }
      }

      // Auto-handle any modal opened during advance
      const stateAfter = useGameStore.getState();
      if (stateAfter.isModalOpen && stateAfter.modalType) {
        autoHandleModal(stateAfter.modalType, stateAfter.modalData);
      }

      // Resolve post-match interview queue
      if (result.interviewQueue && result.interviewQueue.length > 0) {
        onProgress({
          currentDay: day + 1,
          totalDays: config.days,
          currentDate: result.newDate,
          action: 'Resolving post-match interviews…',
        });
        for (const interview of result.interviewQueue) {
          if (interview.options.length > 0) {
            const idx = pickInterviewChoice(interview, config.strategies.postMatchInterview);
            interviewService.resolveInterview(interview, idx, result.newDate);
            totalInterviewsResolved++;
          }
        }
      }

      // Resolve crisis interview
      if (result.crisisInterview && result.crisisInterview.options.length > 0) {
        onProgress({
          currentDay: day + 1,
          totalDays: config.days,
          currentDate: result.newDate,
          action: 'Resolving crisis interview…',
        });
        const idx = pickInterviewChoice(result.crisisInterview, config.strategies.crisisInterview);
        interviewService.resolveInterview(result.crisisInterview, idx, result.newDate);
        totalInterviewsResolved++;
      }

      // Resolve general interview
      if (result.generalInterview && result.generalInterview.options.length > 0) {
        onProgress({
          currentDay: day + 1,
          totalDays: config.days,
          currentDate: result.newDate,
          action: 'Resolving general interview…',
        });
        const idx = pickInterviewChoice(result.generalInterview, config.strategies.generalInterview);
        interviewService.resolveInterview(result.generalInterview, idx, result.newDate);
        totalInterviewsResolved++;
      }

      // Resolve major drama events
      const majorEvents = result.dramaEvents.filter((e) => e.severity === 'major');
      if (majorEvents.length > 0) {
        onProgress({
          currentDay: day + 1,
          totalDays: config.days,
          currentDate: result.newDate,
          action: 'Resolving drama events…',
        });
        for (const event of majorEvents) {
          const template = DRAMA_EVENT_TEMPLATES.find((t) => t.id === event.templateId);
          if (template?.choices && template.choices.length > 0) {
            const choiceId = pickDramaChoice(template.choices, config.strategies.dramaEvents);
            if (choiceId) {
              dramaService.resolveEvent(event.id, choiceId);
              totalDramaEventsResolved++;
            }
          }
        }
      }

      // Track phase changes
      const phaseAfter = useGameStore.getState().calendar.currentPhase;
      if (phaseAfter !== phaseBefore) {
        phaseChanges.push({ fromPhase: phaseBefore, toPhase: phaseAfter, date: result.newDate });
      }

      onProgress({
        currentDay: day + 1,
        totalDays: config.days,
        currentDate: result.newDate,
        action: 'Done',
      });
    }

    return {
      daysSimulated,
      cancelled: cancellationToken.cancelled,
      startDate,
      endDate,
      totalMatchesPlayed,
      playerTeamWins,
      playerTeamLosses,
      totalInterviewsResolved,
      totalDramaEventsResolved,
      phaseChanges,
    };
  }
}

export const fastForwardService = new FastForwardService();
