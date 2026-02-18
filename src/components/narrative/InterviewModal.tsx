// InterviewModal - Forced-engagement modal for interview decisions
//
// No skip option — player must choose a response.
// Shows context badge, subject badge, narrative prompt, and 3 option buttons.
// After a choice, shows an effects summary before continuing.
// Follows the same pattern as DramaEventModal.

import { useState } from 'react';
import { useGameStore } from '../../store';
import type { PendingInterview, InterviewContext, InterviewTone } from '../../types/interview';

interface InterviewModalProps {
  interview: PendingInterview;
  /** Called when player makes a choice - applies effects to game state */
  onChoose: (choiceIndex: number) => void;
  /** Called when the user closes the modal (clicks Continue) */
  onClose: () => void;
}

// ============================================================================
// Badge metadata
// ============================================================================

const CONTEXT_META: Record<InterviewContext, { label: string; badgeColor: string }> = {
  PRE_MATCH: {
    label: 'PRE-MATCH',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  POST_MATCH: {
    label: 'POST-MATCH',
    badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  CRISIS: {
    label: 'CRISIS',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
};

const TONE_BADGE: Record<InterviewTone, string> = {
  CONFIDENT:   'bg-blue-500/20 text-blue-400',
  AGGRESSIVE:  'bg-red-500/20 text-red-400',
  TRASH_TALK:  'bg-orange-500/20 text-orange-400',
  HUMBLE:      'bg-teal-500/20 text-teal-400',
  RESPECTFUL:  'bg-slate-500/20 text-slate-400',
  DEFLECTIVE:  'bg-slate-500/20 text-slate-400',
  BLAME_SELF:  'bg-purple-500/20 text-purple-400',
  BLAME_TEAM:  'bg-yellow-500/20 text-yellow-400',
};

// ============================================================================
// Effect summary helper
// ============================================================================

function formatEffects(effects: PendingInterview['options'][number]['effects']): string {
  const parts: string[] = [];
  if (effects.morale)       parts.push(`${effects.morale > 0 ? '+' : ''}${effects.morale} Morale`);
  if (effects.fanbase)      parts.push(`${effects.fanbase > 0 ? '+' : ''}${effects.fanbase} Fans`);
  if (effects.hype)         parts.push(`${effects.hype > 0 ? '+' : ''}${effects.hype} Hype`);
  if (effects.sponsorTrust) parts.push(`${effects.sponsorTrust > 0 ? '+' : ''}${effects.sponsorTrust} Sponsor Trust`);
  if (effects.rivalryDelta) parts.push(`${effects.rivalryDelta > 0 ? '+' : ''}${effects.rivalryDelta} Rivalry`);
  return parts.length > 0 ? parts.join(', ') : 'No immediate effects';
}

// ============================================================================
// Component
// ============================================================================

export function InterviewModal({ interview, onChoose, onClose }: InterviewModalProps) {
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);
  const [effectsSummary, setEffectsSummary] = useState('');

  const players = useGameStore((state) => state.players);

  const contextMeta = CONTEXT_META[interview.context];

  // Resolve subject display label
  const subjectLabel = (() => {
    if (interview.subjectType === 'manager') return 'MANAGER';
    if (interview.subjectType === 'coach')   return 'HEAD COACH';
    if (interview.subjectId) {
      const player = players[interview.subjectId];
      return player ? player.name.toUpperCase() : 'PLAYER';
    }
    return 'PLAYER';
  })();

  // Handle choice - show outcome first, then apply effects via parent
  const handleChoose = (index: number) => {
    const option = interview.options[index];
    
    // Show outcome view first (local state)
    setChosenIndex(index);
    setShowOutcome(true);
    setEffectsSummary(formatEffects(option.effects));
    
    // Then call parent to apply effects
    onChoose(index);
  };

  // Handle continue - reset state and close modal
  const handleContinue = () => {
    setChosenIndex(null);
    setShowOutcome(false);
    setEffectsSummary('');
    onClose();
  };

  const chosenOption = chosenIndex !== null ? interview.options[chosenIndex] : null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg max-w-lg w-full overflow-hidden flex flex-col">

        {showOutcome ? (
          // ── Outcome view ────────────────────────────────────────────────
          <>
            <div className="p-4 border-b border-vct-gray/20">
              <h2 className="text-xl font-bold text-vct-light">Response Delivered</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-vct-light text-base italic leading-relaxed">
                "{chosenOption?.quote}"
              </p>

              <div className="pt-4 border-t border-vct-gray/20">
                <h3 className="text-sm font-medium text-vct-gray mb-2">Effects:</h3>
                <p className="text-sm text-vct-light font-medium">{effectsSummary}</p>
              </div>
            </div>

            <div className="p-4 border-t border-vct-gray/20 flex justify-end">
              <button
                onClick={handleContinue}
                className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          // ── Choice view ─────────────────────────────────────────────────
          <>
            {/* Header */}
            <div className="p-4 border-b border-vct-gray/20">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${contextMeta.badgeColor}`}>
                  {contextMeta.label}
                </span>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border bg-vct-gray/10 text-vct-gray border-vct-gray/30">
                  {subjectLabel}
                </span>
              </div>
              <h2 className="text-xl font-bold text-vct-light">Press Conference</h2>
            </div>

            {/* Prompt */}
            <div className="p-6 bg-vct-darker/50">
              <blockquote className="border-l-4 border-vct-gray/30 pl-4 text-vct-light leading-relaxed">
                {interview.prompt}
              </blockquote>
            </div>

            <div className="h-px bg-vct-gray/20" />

            {/* Options */}
            <div className="p-6 space-y-3">
              <h3 className="text-sm font-medium text-vct-gray mb-3">How do you respond?</h3>
              {interview.options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleChoose(index)}
                  className="w-full text-left p-4 rounded-lg border border-vct-gray/20 hover:border-vct-gray/40 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${TONE_BADGE[option.tone]}`}>
                      {option.tone.replace('_', ' ')}
                    </span>
                    <span className="font-semibold text-vct-light">{option.label}</span>
                  </div>
                  <p className="text-sm text-vct-gray italic">"{option.quote}"</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
