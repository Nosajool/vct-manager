import type { SchedulingRule, DayContext, RuleResult } from '../types';
import type { MatchEventData } from '../../../types/calendar';

/**
 * MatchDayBlocker - Blocks training and scrims on days with matches
 *
 * This rule prevents scheduling training or scrims when the player's team
 * has a match (confirmed or placeholder) on the same day.
 *
 * Priority: 100 (high priority - hard blocker)
 */
export class MatchDayBlocker implements SchedulingRule {
  id = 'match_day_blocker';
  name = 'Match Day Blocker';
  priority = 100;

  evaluate(context: DayContext): RuleResult {
    const { eventsOnDate, playerTeamId } = context;

    // Check for confirmed matches
    const hasMatch = eventsOnDate.some(event => {
      if (event.type !== 'match') return false;

      const matchData = event.data as MatchEventData;
      return matchData.homeTeamId === playerTeamId ||
             matchData.awayTeamId === playerTeamId;
    });

    if (hasMatch) {
      return {
        type: 'block',
        blockedTypes: ['training', 'scrim'],
        reason: 'Team has a match scheduled on this day'
      };
    }

    // Check for placeholder matches
    const hasPlaceholderMatch = eventsOnDate.some(event => {
      if (event.type !== 'placeholder_match') return false;

      // For Phase 2, we'll do a simple check
      // Phase 5 will implement full TeamSlot resolution logic
      const placeholderData = event.data as any;

      // If teams are already resolved, check those
      if (placeholderData.resolvedTeamAId === playerTeamId ||
          placeholderData.resolvedTeamBId === playerTeamId) {
        return true;
      }

      // TODO (Phase 5): Check if player's team could qualify via TeamSlot chains
      // For now, we'll be conservative and not block if unresolved

      return false;
    });

    if (hasPlaceholderMatch) {
      return {
        type: 'block',
        blockedTypes: ['training', 'scrim'],
        reason: 'Team has a potential match on this day'
      };
    }

    return { type: 'allow' };
  }
}
