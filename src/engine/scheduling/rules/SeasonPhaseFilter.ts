import type { SchedulingRule, DayContext, RuleResult, SchedulableActivityType, SeasonPhase } from '../types';

/**
 * SeasonPhaseFilter - Restricts certain activities to specific season phases
 *
 * This rule allows for phase-specific activity restrictions. For example:
 * - Bootcamps might only be available during offseason
 * - Team offsites might be restricted during playoffs
 *
 * Priority: 80 (high priority - structural constraint)
 */
export class SeasonPhaseFilter implements SchedulingRule {
  id = 'season_phase_filter';
  name = 'Season Phase Filter';
  priority = 80;

  // Define which activities are allowed in which phases
  // If an activity isn't listed, it's allowed in all phases
  private phaseRestrictions: Partial<Record<SchedulableActivityType, SeasonPhase[]>> = {
    // Example restrictions (can be expanded):
    // bootcamp: ['offseason', 'kickoff'],
    // team_offsite: ['offseason'],
  };

  evaluate(context: DayContext): RuleResult {
    const { seasonPhase } = context;
    const blockedTypes: SchedulableActivityType[] = [];

    // Check each restricted activity type
    for (const [activityType, allowedPhases] of Object.entries(this.phaseRestrictions)) {
      if (!allowedPhases.includes(seasonPhase)) {
        blockedTypes.push(activityType as SchedulableActivityType);
      }
    }

    if (blockedTypes.length > 0) {
      return {
        type: 'block',
        blockedTypes,
        reason: `Certain activities are not available during ${seasonPhase} phase`
      };
    }

    // No phase-based restrictions apply
    return { type: 'allow' };
  }
}
