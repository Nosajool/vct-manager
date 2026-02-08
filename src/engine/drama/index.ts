// Drama Engine Exports
// Main entry point for drama system

// Export main drama engine
export {
  evaluate,
  rollForEvent,
  createEventInstance,
  checkEscalations,
  checkFlagExpiry,
  substituteNarrative,
  selectInvolvedPlayer,
} from './DramaEngine';

// Re-export condition evaluator
export {
  evaluateCondition,
  evaluateAllConditions,
} from './DramaConditionEvaluator';

// Re-export effect resolver
export {
  resolveEffects,
  type ResolvedEffect,
} from './DramaEffectResolver';
