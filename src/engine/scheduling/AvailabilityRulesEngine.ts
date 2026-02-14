import type { SchedulingRule, DayContext, DayBlocker, SchedulableActivityType } from './types';

/**
 * AvailabilityRulesEngine - Pure rule evaluation engine
 *
 * This engine evaluates a set of scheduling rules to determine which activities
 * are available on a given day. It's designed to be pure (no store dependencies)
 * for easier testing and reasoning.
 *
 * Rules are evaluated in priority order (highest first). Each rule can:
 * - Allow: This rule has no objection
 * - Block: This rule blocks certain activity types
 * - Skip: This rule doesn't apply to this context
 */
export class AvailabilityRulesEngine {
  private rules: SchedulingRule[] = [];

  /**
   * Register a new scheduling rule
   * Rules are automatically sorted by priority (highest first)
   */
  registerRule(rule: SchedulingRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluate all rules for a given day context
   *
   * @param context - The day context to evaluate
   * @returns Object containing available activity types and blockers
   */
  evaluateDay(context: DayContext): {
    availableActivityTypes: SchedulableActivityType[];
    blockers: DayBlocker[];
  } {
    const allActivityTypes: SchedulableActivityType[] = [
      'training',
      'scrim',
      'rest',
      'social_media',
      'team_offsite',
      'bootcamp'
    ];

    const blockers: DayBlocker[] = [];
    const blockedTypeSet = new Set<SchedulableActivityType>();

    // Evaluate each rule in priority order
    for (const rule of this.rules) {
      const result = rule.evaluate(context);

      if (result.type === 'block') {
        // Add blocker
        blockers.push({
          ruleId: rule.id,
          reason: result.reason,
          blockedActivityTypes: result.blockedTypes,
          severity: 'hard' // All current rules are hard blockers
        });

        // Track blocked types
        for (const type of result.blockedTypes) {
          blockedTypeSet.add(type);
        }
      }
      // 'allow' and 'skip' don't modify blockers
    }

    // Available types = all types minus blocked types
    const availableActivityTypes = allActivityTypes.filter(
      type => !blockedTypeSet.has(type)
    );

    return {
      availableActivityTypes,
      blockers
    };
  }

  /**
   * Get all registered rules (for debugging/testing)
   */
  getRules(): SchedulingRule[] {
    return [...this.rules];
  }

  /**
   * Clear all registered rules (for testing)
   */
  clearRules(): void {
    this.rules = [];
  }
}
