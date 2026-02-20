// InterviewService - Business logic for generating and resolving interviews
// Part of the narrative layer (System 2: Interview System)

import type { MatchResult } from '../types/match';
import type { Team } from '../types/team';
import type { DramaState } from '../types/drama';
import type {
  InterviewEffects,
  InterviewOption,
  InterviewTemplate,
  PendingInterview,
  InterviewHistoryEntry,
} from '../types/interview';
import { INTERVIEW_TEMPLATES } from '../data/interviewTemplates';
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
  ): PendingInterview | null {
    const state = useGameStore.getState();
    const match = state.matches[matchResult.matchId];
    if (!match) return null;

    const opponentTeamId =
      match.teamAId === playerTeamId ? match.teamBId : match.teamAId;

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

    // Filter templates by context and conditions
    const context = 'POST_MATCH' as const;
    const candidates = INTERVIEW_TEMPLATES.filter((t) => {
      if (t.context !== context) return false;
      if (!t.condition || t.condition === 'always') return true;
      if (t.condition === 'pre_playoff' && isPlayoffMatch) return true;
      return false;
    });

    // Prefer win/loss specific templates based on match result
    const winIds = ['post_win_dominant', 'post_win_close', 'post_win_comeback', 'post_win_upset', 'post_coach_win', 'post_player_win'];
    const lossIds = ['post_loss_standard', 'post_loss_close', 'post_loss_blowout', 'post_loss_elimination', 'post_coach_loss', 'post_player_loss'];

    const relevant = candidates.filter((t) =>
      won ? winIds.includes(t.id) : lossIds.includes(t.id)
    );

    // Prefer upset win template if applicable
    const pool = won && isUpsetWin
      ? relevant.filter((t) => t.id === 'post_win_upset')
      : relevant;

    const template = this.pickTemplate(pool.length > 0 ? pool : relevant);
    if (!template) return null;

    return this.toPendingInterview(template, opponentTeamId);
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

    // Build condition flags
    const lossStreak = team.standings.currentStreak < 0
      ? Math.abs(team.standings.currentStreak)
      : 0;
    const winStreak = team.standings.currentStreak > 0
      ? team.standings.currentStreak
      : 0;

    const rivalry = state.rivalries[opponentTeamId];
    const hasRivalry = rivalry && rivalry.intensity > 0;

    const candidates = INTERVIEW_TEMPLATES.filter((t) => {
      if (t.context !== 'PRE_MATCH') return false;
      if (!t.condition || t.condition === 'always') return true;
      if (t.condition === 'pre_playoff' && isPlayoffMatch) return true;
      if (t.condition === 'rivalry_active' && hasRivalry) return true;
      if (t.condition === 'loss_streak_2plus' && lossStreak >= 2) return true;
      if (t.condition === 'win_streak_2plus' && winStreak >= 2) return true;
      return false;
    });

    console.log('checkPreMatchInterview candidates:', { 
      candidateCount: candidates.length,
      lossStreak, 
      winStreak, 
      hasRivalry 
    });

    const template = this.pickTemplate(candidates);
    if (!template) {
      console.log('checkPreMatchInterview: no template found');
      return null;
    }

    console.log('checkPreMatchInterview: returning interview:', { templateId: template.id });
    return this.toPendingInterview(template, opponentTeamId);
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

    if (lossStreak < 3 && !anyLowMorale && !hasCrisisFlag && !hasSponsorFlag) {
      return null;
    }

    // Pick matching template based on trigger reason
    const candidates = INTERVIEW_TEMPLATES.filter((t) => {
      if (t.context !== 'CRISIS') return false;
      if (t.condition === 'loss_streak_3plus' && lossStreak >= 3) return true;
      if (t.condition === 'drama_active' && (anyLowMorale || hasCrisisFlag)) return true;
      if (t.condition === 'sponsor_trust_low' && hasSponsorFlag) return true;
      return false;
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
    console.log('InterviewService: resolveInterview START', { templateId: pending.templateId, choiceIndex, context: pending.context });
    const option: InterviewOption = pending.options[choiceIndex];
    const effects = option.effects;
    console.log('InterviewService: effects:', effects);
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId!;
    const team = state.teams[playerTeamId];

    // 1. Morale delta — apply to all active roster players
    console.log('InterviewService: applying morale delta...');
    const newMorale: Record<string, number> = {};
    if (effects.morale !== undefined && effects.morale !== 0) {
      for (const playerId of team.playerIds) {
        const player = state.players[playerId];
        if (!player) continue;
        const next = Math.max(0, Math.min(100, player.morale + effects.morale));
        newMorale[playerId] = next;
        state.updatePlayer(playerId, { morale: next });
      }
    }

    // 2. Reputation deltas — fanbase, hype, sponsorTrust
    console.log('InterviewService: applying reputation deltas...');
    const rep = team.reputation;
    const repUpdate = {
      fanbase: effects.fanbase !== undefined
        ? Math.max(0, Math.min(100, rep.fanbase + effects.fanbase))
        : rep.fanbase,
      hypeLevel: effects.hype !== undefined
        ? Math.max(0, Math.min(100, rep.hypeLevel + effects.hype))
        : rep.hypeLevel,
      sponsorTrust: effects.sponsorTrust !== undefined
        ? Math.max(0, Math.min(100, rep.sponsorTrust + effects.sponsorTrust))
        : rep.sponsorTrust,
    };
    if (
      repUpdate.fanbase !== rep.fanbase ||
      repUpdate.hypeLevel !== rep.hypeLevel ||
      repUpdate.sponsorTrust !== rep.sponsorTrust
    ) {
      state.updateTeam(playerTeamId, { reputation: repUpdate });
    }

    // 3. Rivalry delta
    if (
      effects.rivalryDelta !== undefined &&
      effects.rivalryDelta !== 0 &&
      pending.opponentTeamId
    ) {
      state.updateRivalryIntensity(pending.opponentTeamId, effects.rivalryDelta);
    }

    // 4. Drama chance — accumulate in slice
    const dramaBoost = effects.dramaChance ?? 0;
    if (dramaBoost > 0) {
      const current = state.pendingDramaBoost;
      useGameStore.setState({ pendingDramaBoost: current + dramaBoost });
    }

    // 5. Build history entry and commit to slice
    console.log('InterviewService: building history entry...');
    const historyEntry: InterviewHistoryEntry = {
      date: currentDate,
      templateId: pending.templateId,
      context: pending.context,
      chosenTone: option.tone,
      effects,
    };

    // Re-read state so we get the latest after prior mutations
    const latestState = useGameStore.getState();
    console.log('InterviewService: adding to history...');
    latestState.addInterviewHistory(historyEntry);
    // Note: clearPendingInterview is handled by the parent component after the modal closes

    console.log('InterviewService: resolveInterview END');
    return {
      ...historyEntry,
      appliedEffects: effects,
      newMorale,
      pendingDramaBoost: dramaBoost,
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

  private toPendingInterview(
    template: InterviewTemplate,
    opponentTeamId: string | undefined,
  ): PendingInterview {
    let subjectId: string | undefined;

    if (template.subjectType === 'player') {
      const state = useGameStore.getState();
      const team = state.teams[state.playerTeamId!];
      const playerIds = team?.playerIds ?? [];
      if (playerIds.length > 0) {
        subjectId = playerIds[Math.floor(Math.random() * playerIds.length)];
      }
    }

    return {
      templateId: template.id,
      context: template.context,
      subjectType: template.subjectType,
      subjectId,
      opponentTeamId,
      prompt: template.prompt,
      options: template.options,
    };
  }
}

export const interviewService = new InterviewService();
