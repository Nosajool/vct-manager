import type { SchedulingRule, DayContext, RuleResult, SchedulableActivityType } from '../types';
import { FeatureGateService } from '../../../services/FeatureGateService';
import type { FeatureType } from '../../../data/featureUnlocks';

/**
 * FeatureGateRule - Blocks activities that haven't been unlocked yet
 *
 * This rule delegates to FeatureGateService to check if activities
 * are available based on game progression (days elapsed, season phase).
 *
 * Priority: 90 (high priority - hard blocker)
 */
export class FeatureGateRule implements SchedulingRule {
  id = 'feature_gate';
  name = 'Feature Gate';
  priority = 90;

  private featureGateService: FeatureGateService;

  constructor(featureGateService: FeatureGateService) {
    this.featureGateService = featureGateService;
  }

  evaluate(_context: DayContext): RuleResult {
    // Map activity types to feature types
    const activityFeatureMap: Partial<Record<SchedulableActivityType, FeatureType>> = {
      training: 'training',
      scrim: 'scrims',
      // rest, social_media, team_offsite, bootcamp don't require feature unlocks
    };

    const blockedTypes: SchedulableActivityType[] = [];

    // Check each activity type
    for (const [activityType, featureType] of Object.entries(activityFeatureMap)) {
      if (featureType && !this.featureGateService.isFeatureUnlocked(featureType)) {
        blockedTypes.push(activityType as SchedulableActivityType);
      }
    }

    if (blockedTypes.length > 0) {
      return {
        type: 'block',
        blockedTypes,
        reason: this.buildReason(blockedTypes, activityFeatureMap)
      };
    }

    return { type: 'allow' };
  }

  private buildReason(
    blockedTypes: SchedulableActivityType[],
    activityFeatureMap: Partial<Record<SchedulableActivityType, FeatureType>>
  ): string {
    // Get the first blocked type's feature for the reason
    const firstBlockedType = blockedTypes[0];
    const featureType = activityFeatureMap[firstBlockedType];

    if (!featureType) {
      return 'Feature not yet unlocked';
    }

    const nextUnlock = this.featureGateService.getNextUnlock();
    if (nextUnlock && nextUnlock.feature === featureType) {
      return nextUnlock.description;
    }

    return `${featureType} not yet unlocked`;
  }
}
