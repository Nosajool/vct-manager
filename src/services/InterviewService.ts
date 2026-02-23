// InterviewService - Business logic for generating and resolving interviews
// Part of the narrative layer (System 2: Interview System)

import type { MatchResult } from '../types/match';
import type { Team } from '../types/team';
import type { DramaState } from '../types/drama';
import type {
  InterviewEffects,
  InterviewOption,
  InterviewSnapshot,
  InterviewTemplate,
  PendingInterview,
  InterviewHistoryEntry,
  TournamentMatchContext,
} from '../types/interview';
import { evaluateTemplateFlagGate, resolveInterviewEffects } from '../engine/interview';
import { INTERVIEW_TEMPLATES } from '../data/interviews';
import { useGameStore } from '../store';

export interface InterviewEffectResult {
  appliedEffects: InterviewEffects;
  newMorale: Record<string, number>;    // playerId -> new morale value
  pendingDramaBoost: number;            // accumulated dramaChance stored in slice
}

export class InterviewService {
  // ============================================================================
  // Check methods — return a PendingInterview if the interview should fire
  // ============================================================================

  /**
   * Check whether a post-match interview should trigger.
   * Base: 40%; +20% if playoff; +15% if loss streak >= 2; +15% if upset win.
   *
   * An "upset win" is defined as the player team winning against an opponent
   * whose current win streak is >= 3.
   */
  checkPostMatchInterview(
    matchResult: MatchResult,
    playerTeamId: string,
    team: Team,
    isPlayoffMatch?: boolean,
    isUpsetWin?: boolean,
    context?: TournamentMatchContext,
  ): PendingInterview | null {
    const state = useGameStore.getState();
    const match = state.matches[matchResult.matchId];
    if (!match) return null;

    // Roll probability
    let chance = 80;
    if (isPlayoffMatch) chance += 20;

    const lossStreak = team.standings.currentStreak < 0
      ? Math.abs(team.standings.currentStreak)
      : 0;
    if (lossStreak >= 2) chance += 15;
    if (isUpsetWin) chance += 15;

    if (Math.random() * 100 >= chance) return null;

    // Determine win/loss context
    const won = matchResult.winnerId === playerTeamId;

    // Build snapshot and filter templates by context and conditions
    const opponentTeamId = match.teamAId === playerTeamId ? match.teamBId : match.teamAId;
    const snapshot = this.buildInterviewSnapshot({
      isPlayoffMatch,
      isUpsetWin,
      lastMatchWon: won,
      opponentTeamId,
      tournamentContext: context,
    });
    const candidates = INTERVIEW_TEMPLATES.filter((t) => {
      if (t.context !== 'POST_MATCH') return false;
      return evaluateTemplateFlagGate(t, snapshot);
    });

    // Filter by match outcome using the template's matchOutcome field
    const outcome = won ? 'win' : 'loss';
    const relevant = candidates.filter(
      (t) => !t.matchOutcome || t.matchOutcome === 'any' || t.matchOutcome === outcome
    );

    // Prefer upset win template if applicable
    const pool = won && isUpsetWin
      ? relevant.filter((t) => t.id === 'post_win_upset')
      : relevant;

    const template = this.pickTemplate(pool.length > 0 ? pool : relevant);
    if (!template) return null;

    return this.toPendingInterview(template, matchResult.matchId);
  }

  /**
   * Check whether a pre-match interview should trigger.
   * Base: 25%; +20% if playoff. Only fires for tournament matches (not scrims).
   */
  checkPreMatchInterview(
    matchId: string,
    playerTeamId: string,
    team: Team,
    isPlayoffMatch?: boolean,
    context?: TournamentMatchContext,
  ): PendingInterview | null {
    const state = useGameStore.getState();
    const match = state.matches[matchId];

    console.log('checkPreMatchInterview called:', { 
      matchId, 
      playerTeamId, 
      isPlayoffMatch,
      teamName: team.name,
      currentStreak: team.standings.currentStreak,
      hasMatch: !!match
    });
    
    if (!match) {
      console.log('checkPreMatchInterview: no match found');
      return null;
    }

    // Only tournament matches
    if (!match.tournamentId) {
      console.log('checkPreMatchInterview: not a tournament match');
      return null;
    }

    const opponentTeamId =
      match.teamAId === playerTeamId ? match.teamBId : match.teamAId;

    // Roll probability
    let chance = 80;
    if (isPlayoffMatch) chance += 20;

    const roll = Math.random() * 100;
    console.log('checkPreMatchInterview probability:', { chance, roll, passes: roll < chance });

    if (roll >= chance) {
      console.log('checkPreMatchInterview: failed probability check');
      return null;
    }

    // Build snapshot and filter templates by context and conditions
    const snapshot = this.buildInterviewSnapshot({
      isPlayoffMatch,
      opponentTeamId,
      tournamentContext: context,
    });
    const candidates = INTERVIEW_TEMPLATES.filter((t) => {
      if (t.context !== 'PRE_MATCH') return false;
      return evaluateTemplateFlagGate(t, snapshot);
    });

    console.log('checkPreMatchInterview candidates:', {
      candidateCount: candidates.length,
      hasRivalry: snapshot.hasRivalry,
    });

    const template = this.pickTemplate(candidates);
    if (!template) {
      console.log('checkPreMatchInterview: no template found');
      return null;
    }

    console.log('checkPreMatchInterview: returning interview:', { templateId: template.id });
    return this.toPendingInterview(template, matchId);
  }

  /**
   * Check whether a crisis interview should trigger.
   * Fires if: loss streak >= 3, OR any player morale < 30, OR crisis_active drama flag.
   */
  checkCrisisInterview(
    dramaState: Pick<DramaState, 'activeFlags'>,
    team: Team,
    _currentDate: string,
  ): PendingInterview | null {
    const state = useGameStore.getState();

    const lossStreak = team.standings.currentStreak < 0
      ? Math.abs(team.standings.currentStreak)
      : 0;

    const playerMorales = team.playerIds
      .map((id) => state.players[id]?.morale ?? 100);
    const anyLowMorale = playerMorales.some((m) => m < 30);

    const hasCrisisFlag = 'crisis_active' in dramaState.activeFlags;
    const hasSponsorFlag = 'sponsor_trust_low' in dramaState.activeFlags;
    const hasVisaDelayFlag = Object.keys(dramaState.activeFlags).some(
      flag => flag.startsWith('visa_delayed_')
    );

    if (lossStreak < 3 && !anyLowMorale && !hasCrisisFlag && !hasSponsorFlag && !hasVisaDelayFlag) {
      return null;
    }

    // Pick matching template based on trigger reason
    const snapshot = this.buildInterviewSnapshot({});
    const candidates = INTERVIEW_TEMPLATES.filter((t) => {
      if (t.context !== 'CRISIS') return false;
      return evaluateTemplateFlagGate(t, snapshot);
    });

    const template = this.pickTemplate(candidates);
    if (!template) return null;

    return this.toPendingInterview(template, undefined);
  }

  // ============================================================================
  // Resolve interview — apply effects to game state
  // ============================================================================

  /**
   * Apply the effects of a chosen interview option to the game state.
   *
   * - morale: applied as delta to all team players (clamped 0-100)
   * - fanbase/hype/sponsorTrust: update team.reputation via updateTeam()
   * - rivalryDelta: dispatch rivalrySlice.updateRivalryIntensity()
   * - dramaChance: accumulated in interviewSlice.pendingDramaBoost
   *
   * Commits the history entry and clears the pending interview from the slice.
   */
  resolveInterview(
    pending: PendingInterview,
    choiceIndex: number,
    currentDate: string,
  ): InterviewHistoryEntry & InterviewEffectResult {
    const option: InterviewOption = pending.options[choiceIndex];
    const effects = option.effects;
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId!;
    const team = state.teams[playerTeamId];

    // Derive opponentTeamId for rivalry effects
    let opponentTeamId: string | undefined;
    if (effects.rivalryDelta !== undefined && pending.matchId) {
      const match = state.matches[pending.matchId];
      opponentTeamId = match?.teamAId === playerTeamId ? match?.teamBId : match?.teamAId;
    }

    // Build snapshot (provides players list for team-wide morale fallback)
    const snapshot = this.buildInterviewSnapshot({});

    // Translate effects → concrete mutations
    const resolved = resolveInterviewEffects(effects, snapshot, opponentTeamId);

    // Apply mutations to store
    const newMorale: Record<string, number> = {};
    let pendingDramaBoost = 0;
    const repPatch: Partial<{ fanbase: number; hypeLevel: number; sponsorTrust: number }> = {};

    for (const r of resolved) {
      switch (r.type) {
        case 'update_player': {
          const player = state.players[r.playerId!];
          if (!player) break;
          const next = Math.max(0, Math.min(100, player.morale + r.delta!));
          newMorale[r.playerId!] = next;
          state.updatePlayer(r.playerId!, { morale: next });
          break;
        }
        case 'update_team': {
          const rep = team.reputation;
          const current = r.field === 'fanbase' ? rep.fanbase
            : r.field === 'hypeLevel' ? rep.hypeLevel
            : rep.sponsorTrust;
          const next = Math.max(0, Math.min(100, current + r.delta!));
          repPatch[r.field as 'fanbase' | 'hypeLevel' | 'sponsorTrust'] = next;
          break;
        }
        case 'rivalry_delta':
          state.updateRivalryIntensity(r.opponentTeamId!, r.delta!);
          break;
        case 'drama_boost': {
          pendingDramaBoost = r.delta!;
          const current = state.pendingDramaBoost;
          useGameStore.setState({ pendingDramaBoost: current + r.delta! });
          break;
        }
        case 'set_flag': {
          const expiry = new Date(currentDate);
          expiry.setDate(expiry.getDate() + r.flagDuration!);
          useGameStore.getState().setDramaFlag(r.flag!, {
            setDate: currentDate,
            expiresDate: expiry.toISOString().slice(0, 10),
          });
          break;
        }
        case 'clear_flag':
          useGameStore.getState().clearDramaFlag(r.flag!);
          break;
      }
    }

    // Apply reputation patch once if any field changed
    if (Object.keys(repPatch).length > 0) {
      state.updateTeam(playerTeamId, { reputation: { ...team.reputation, ...repPatch } });
    }

    // Build and commit history entry
    const historyEntry: InterviewHistoryEntry = {
      date: currentDate,
      templateId: pending.templateId,
      context: pending.context,
      chosenTone: option.tone,
      effects,
    };
    useGameStore.getState().addInterviewHistory(historyEntry);
    // Note: clearPendingInterview is handled by the parent component after the modal closes

    return {
      ...historyEntry,
      appliedEffects: effects,
      newMorale,
      pendingDramaBoost,
    };
  }

  /**
   * Returns true if the most recent PRE_MATCH interview for the given opponent
   * used a TRASH_TALK tone. Used by RivalryService to award the +10 intensity bonus.
   */
  hadTrashTalkBeforeMatch(_opponentTeamId: string): boolean {
    const { interviewHistory } = useGameStore.getState();

    // Walk history backwards to find the last PRE_MATCH entry for this opponent
    for (let i = interviewHistory.length - 1; i >= 0; i--) {
      const entry = interviewHistory[i];
      if (entry.context === 'PRE_MATCH') {
        // The pre-match interview stores the opponentTeamId on the PendingInterview
        // but not on the history entry — we match on TRASH_TALK tone since a PRE_MATCH
        // TRASH_TALK interview is only available when rivalry_active, and we check
        // against the correct opponent via template id 'pre_rival'
        return entry.chosenTone === 'TRASH_TALK' && entry.templateId === 'pre_rival';
      }
    }
    return false;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private pickTemplate(candidates: InterviewTemplate[]): InterviewTemplate | null {
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private buildInterviewSnapshot(options: {
    isPlayoffMatch?: boolean;
    isUpsetWin?: boolean;
    lastMatchWon?: boolean;
    opponentTeamId?: string;
    tournamentContext?: TournamentMatchContext;
  }): InterviewSnapshot {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId!;
    const team = state.teams[playerTeamId];

    const rivalry = options.opponentTeamId
      ? state.rivalries[options.opponentTeamId]
      : undefined;
    const hasRivalry = rivalry ? rivalry.intensity > 0 : false;

    const matchHistory = state.getTeamMatchHistory(playerTeamId);
    const recentMatchResults = matchHistory.slice(-10).map((result) => {
      const match = state.matches[result.matchId];
      return {
        matchId: result.matchId,
        date: match?.scheduledDate ?? state.calendar.currentDate,
        won: result.winnerId === playerTeamId,
        teamId: playerTeamId,
      };
    });

    const dramaState: DramaState = {
      activeEvents: state.activeEvents,
      eventHistory: state.eventHistory,
      activeFlags: state.activeFlags,
      cooldowns: state.cooldowns as unknown as DramaState['cooldowns'],
    };

    const tournamentContext = options.tournamentContext
      ? {
          bracketPosition: options.tournamentContext.bracketPosition,
          eliminationRisk: options.tournamentContext.eliminationRisk,
          isGrandFinal: options.tournamentContext.isGrandFinal,
          opponent: options.tournamentContext.opponent
            ? { droppedFromUpper: options.tournamentContext.opponent.droppedFromUpper }
            : undefined,
        }
      : undefined;

    return {
      currentDate: state.calendar.currentDate,
      currentSeason: state.calendar.currentSeason,
      currentPhase: state.calendar.currentPhase,
      playerTeamId,
      playerTeamChemistry: team?.chemistry.overall ?? 50,
      players: Object.values(state.players),
      playerTeamRegion: team?.region,
      recentMatchResults,
      scrimCount: state.scrimHistory.length,
      dramaState,
      tournamentContext,
      isPlayoffMatch: options.isPlayoffMatch ?? false,
      isUpsetWin: options.isUpsetWin ?? false,
      lastMatchWon: options.lastMatchWon,
      hasRivalry,
    };
  }

  private toPendingInterview(
    template: InterviewTemplate,
    matchId?: string,
  ): PendingInterview {
    let subjectId: string | undefined;
    const state = useGameStore.getState();

    if (template.subjectType === 'player') {
      // If template gates on a flag with {playerId}, extract the player ID from the active flag
      const playerFlagCondition = template.conditions?.find(
        (c) => c.type === 'flag_active' && c.flag?.includes('{playerId}')
      );
      if (playerFlagCondition?.flag) {
        const prefix = playerFlagCondition.flag.split('{playerId}')[0];
        const matchingFlag = Object.keys(state.activeFlags).find(f => f.startsWith(prefix));
        if (matchingFlag) {
          subjectId = matchingFlag.substring(prefix.length);
        }
      }

      // Fallback: pick random from active roster
      if (!subjectId) {
        const team = state.teams[state.playerTeamId!];
        const playerIds = team?.playerIds ?? [];
        if (playerIds.length > 0) {
          subjectId = playerIds[Math.floor(Math.random() * playerIds.length)];
        }
      }
    }

    // For player interviews, inject targetPlayerIds on options that have a morale effect
    let options = template.subjectType === 'player' && subjectId
      ? template.options.map((opt) => ({
          ...opt,
          effects: opt.effects.morale !== undefined
            ? { ...opt.effects, targetPlayerIds: [subjectId as string] }
            : opt.effects,
        }))
      : [...template.options];

    // For player interviews, filter options by personality weights
    if (template.subjectType === 'player' && subjectId) {
      const player = state.players[subjectId];
      const personality = player?.personality;
      if (personality) {
        const filtered = options.filter((opt) => {
          const weight = opt.personalityWeights?.[personality];
          return weight === undefined || weight > 0;
        });
        // Only apply if at least 2 options survive
        if (filtered.length >= 2) {
          options = filtered;
        }
      }
    }

    // Filter options by requiresFlags — only show if ALL required flags are active
    if (options.some((opt) => opt.requiresFlags?.length)) {
      const activeFlags = state.activeFlags;
      options = options.filter((opt) => {
        if (!opt.requiresFlags?.length) return true;
        return opt.requiresFlags.every((flag) => flag in activeFlags);
      });
      // Fallback: ensure at least 2 options remain
      if (options.length < 2) {
        options = template.subjectType === 'player' && subjectId
          ? template.options.map((opt) => ({
              ...opt,
              effects: opt.effects.morale !== undefined
                ? { ...opt.effects, targetPlayerIds: [subjectId as string] }
                : opt.effects,
            }))
          : [...template.options];
      }
    }

    return {
      templateId: template.id,
      context: template.context,
      subjectType: template.subjectType,
      subjectId,
      matchId,
      prompt: template.prompt,
      options,
    };
  }

}


export const interviewService = new InterviewService();
