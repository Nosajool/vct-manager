// Interview Condition Evaluator
// Pure function module for evaluating InterviewCondition strings against an InterviewSnapshot.
// Delegates to DramaConditionEvaluator for conditions that map to drama condition types.

import { evaluateCondition } from '@/engine/drama/DramaConditionEvaluator';
import type { InterviewCondition, InterviewSnapshot, InterviewTemplate } from '@/types/interview';

/**
 * Evaluates a single InterviewCondition against the current interview snapshot.
 * Pure function — no side effects or store access.
 */
export function evaluateInterviewCondition(
  condition: InterviewCondition,
  snapshot: InterviewSnapshot
): boolean {
  switch (condition) {
    case 'always':
      return true;

    case 'pre_playoff':
      return snapshot.isPlayoffMatch;

    case 'rivalry_active':
      return snapshot.hasRivalry;

    case 'grand_final':
      return snapshot.tournamentContext?.isGrandFinal ?? false;

    case 'opponent_dropped_from_upper':
      return snapshot.tournamentContext?.opponent?.droppedFromUpper ?? false;

    case 'loss_streak_2plus':
      return evaluateCondition({ type: 'team_loss_streak', streakLength: 2 }, snapshot);

    case 'win_streak_2plus':
      return evaluateCondition({ type: 'team_win_streak', streakLength: 2 }, snapshot);

    case 'loss_streak_3plus':
      return evaluateCondition({ type: 'team_loss_streak', streakLength: 3 }, snapshot);

    case 'drama_active':
      return (
        evaluateCondition({ type: 'player_morale_below', threshold: 30 }, snapshot) ||
        evaluateCondition({ type: 'flag_active', flag: 'crisis_active' }, snapshot)
      );

    case 'sponsor_trust_low':
      return evaluateCondition({ type: 'flag_active', flag: 'sponsor_trust_low' }, snapshot);

    case 'lower_bracket':
      return evaluateCondition({ type: 'bracket_position', bracketPosition: 'lower' }, snapshot);

    case 'upper_bracket':
      return evaluateCondition({ type: 'bracket_position', bracketPosition: 'upper' }, snapshot);

    case 'elimination_risk':
      return evaluateCondition({ type: 'elimination_risk' }, snapshot);

    case 'team_identity_star_carry':
      return evaluateCondition({ type: 'flag_active', flag: 'team_identity_star_carry' }, snapshot);

    case 'team_identity_resilient':
      return evaluateCondition({ type: 'flag_active', flag: 'team_identity_resilient' }, snapshot);

    case 'team_identity_fragile':
      return evaluateCondition({ type: 'flag_active', flag: 'team_identity_fragile' }, snapshot);

    case 'visa_delay_active':
      return evaluateCondition({ type: 'flag_active', flag: 'visa_delayed_{playerId}' }, snapshot);

    default:
      return false;
  }
}

/**
 * Evaluates the template-level flag gate (requiresActiveFlag).
 * Returns true if the template has no flag gate, or if the required flag is active.
 * Handles {playerId} placeholder patterns via the underlying evaluateFlagActive logic.
 */
export function evaluateTemplateFlagGate(
  template: InterviewTemplate,
  snapshot: InterviewSnapshot
): boolean {
  if (!template.requiresActiveFlag) return true;
  return evaluateCondition(
    { type: 'flag_active', flag: template.requiresActiveFlag },
    snapshot
  );
}
