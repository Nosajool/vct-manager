// Interview Condition Evaluator
// Pure function module for evaluating interview template conditions against an InterviewSnapshot.
// Delegates to DramaConditionEvaluator for all condition evaluation.

import { evaluateAllConditions } from '@/engine/drama/DramaConditionEvaluator';
import type { InterviewSnapshot, InterviewTemplate } from '@/types/interview';

/**
 * Evaluates the template-level conditions gate.
 * Returns true if the template has no conditions, or if all conditions pass.
 */
export function evaluateTemplateFlagGate(
  template: InterviewTemplate,
  snapshot: InterviewSnapshot
): boolean {
  if (!template.conditions?.length) return true;
  return evaluateAllConditions(template.conditions, snapshot);
}
