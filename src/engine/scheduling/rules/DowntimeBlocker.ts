import type { SchedulingRule, DayContext, RuleResult, SchedulableActivityType } from '../types';

/**
 * The set of activity types that are ONLY available during downtime
 * (i.e. when the player's team is not in an active tournament).
 */
const DOWNTIME_ONLY_ACTIVITY_TYPES: SchedulableActivityType[] = [
  'regional_bootcamp',
  'watch_party',
  'streamer_collab',
  'youtube_documentary',
  'fan_meetup',
  'sponsored_content',
];

/**
 * DowntimeBlocker - Blocks downtime activities when the team is in an active tournament.
 *
 * The inverse is also true: when not blocked by this rule, downtime activities
 * become available for the FeatureGateRule and other rules to further gate.
 *
 * Priority: 95 (below MatchDayBlocker at 100, above BootcampWindowRule at 90)
 */
export class DowntimeBlocker implements SchedulingRule {
  id = 'downtime_blocker';
  name = 'Downtime Blocker';
  priority = 95;

  evaluate(context: DayContext): RuleResult {
    const { playerTeamId, tournaments } = context;

    const isInActiveTournament = Object.values(tournaments).some(
      t => t.status === 'in_progress' && t.teamIds.includes(playerTeamId)
    );

    if (isInActiveTournament) {
      return {
        type: 'block',
        blockedTypes: DOWNTIME_ONLY_ACTIVITY_TYPES,
        reason: 'Team is in an active tournament',
      };
    }

    return { type: 'allow' };
  }
}
