// InterviewModal - Forced-engagement modal for interview decisions
//
// No skip option — player must choose a response.
// Quote is the primary text on each option card. Tone badge + effect hints below.
// Color-coded by tone for instant scanning.
// Shows manager archetype badge in header when archetype is established.

import { useState, type ReactNode } from 'react';
import { useGameStore } from '../../store';
import type { PendingInterview, InterviewContext, InterviewTone, InterviewEffects } from '../../types/interview';
import { selectManagerProfile, type ManagerArchetype } from '../../store/slices/interviewSlice';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl } from '../../utils/imageAssets';
import { PostMatchHeader } from '../match/PostMatchHeader';
import { PreMatchHeader } from '../match/PreMatchHeader';
import { NewBadge } from './NewBadge';
import { NarrativeCollectionModal } from './NarrativeCollectionModal';
import { getInterviewApprovalContext } from '../../engine/reputation/publicNarrative';

interface InterviewModalProps {
  interview: PendingInterview;
  /** Called when player makes a choice - applies effects to game state */
  onChoose: (choiceIndex: number) => void;
  /** Called when the user closes the modal (clicks Continue) */
  onClose: () => void;
  /** Current question number in the press conference (1-based) */
  questionNumber?: number;
  /** Total questions in this press conference */
  totalQuestions?: number;
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
  KICKOFF: {
    label: 'SEASON KICKOFF',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  GENERAL: {
    label: 'GENERAL',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  WATCH_PARTY: {
    label: 'WATCH PARTY',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
};

// Tone card: border color + badge color
const TONE_CARD_STYLE: Record<InterviewTone, { border: string; badge: string; hoverBorder: string }> = {
  CONFIDENT:   { border: 'border-amber-500/40',  hoverBorder: 'hover:border-amber-500/70',  badge: 'bg-amber-500/20 text-amber-400' },
  AGGRESSIVE:  { border: 'border-amber-600/40',  hoverBorder: 'hover:border-amber-600/70',  badge: 'bg-amber-600/20 text-amber-300' },
  TRASH_TALK:  { border: 'border-red-500/40',    hoverBorder: 'hover:border-red-500/70',    badge: 'bg-red-500/20 text-red-400' },
  HUMBLE:      { border: 'border-slate-400/30',  hoverBorder: 'hover:border-slate-400/60',  badge: 'bg-slate-500/20 text-slate-400' },
  DEFLECTIVE:  { border: 'border-slate-400/30',  hoverBorder: 'hover:border-slate-400/60',  badge: 'bg-slate-500/20 text-slate-400' },
  RESPECTFUL:  { border: 'border-green-500/40',  hoverBorder: 'hover:border-green-500/70',  badge: 'bg-green-500/20 text-green-400' },
  BLAME_SELF:  { border: 'border-green-500/40',  hoverBorder: 'hover:border-green-500/70',  badge: 'bg-green-500/20 text-green-400' },
  BLAME_TEAM:  { border: 'border-orange-500/40', hoverBorder: 'hover:border-orange-500/70', badge: 'bg-orange-500/20 text-orange-400' },
};

// Manager archetype display metadata
const ARCHETYPE_META: Record<NonNullable<ManagerArchetype>, { icon: string; label: string; color: string }> = {
  HYPE_MACHINE:   { icon: '🔥', label: 'Hype Machine',   color: 'text-orange-400' },
  TEAM_BUILDER:   { icon: '🤝', label: 'Team Builder',   color: 'text-green-400' },
  MAVERICK:       { icon: '⚡', label: 'Maverick',       color: 'text-yellow-400' },
  HUMBLE_GRINDER: { icon: '💪', label: 'Humble Grinder', color: 'text-blue-400' },
  ANALYST:        { icon: '📊', label: 'Analyst',        color: 'text-purple-400' },
};

// On-brand tones per archetype (for visual indicator)
const ARCHETYPE_ON_BRAND: Record<NonNullable<ManagerArchetype>, InterviewTone[]> = {
  HYPE_MACHINE:   ['CONFIDENT', 'TRASH_TALK', 'AGGRESSIVE'],
  TEAM_BUILDER:   ['RESPECTFUL', 'BLAME_SELF'],
  MAVERICK:       ['TRASH_TALK', 'AGGRESSIVE', 'BLAME_TEAM'],
  HUMBLE_GRINDER: ['HUMBLE'],
  ANALYST:        ['DEFLECTIVE'],
};

// Tooltip descriptions for effect hints
const EFFECT_TOOLTIP: Record<string, string> = {
  'Fans':    'Fanbase — public support for your team',
  'Morale':  'Player morale and team spirit',
  'Hype':    'Media buzz and narrative momentum',
  'Sponsor': 'Sponsor confidence in your org',
  'Rival':   'Rivalry intensity with this opponent',
  '+Drama':  'Raises chance of a drama event',
};

// ============================================================================
// Effect hint helpers
// ============================================================================

function getArrow(value: number): string {
  if (value >= 8) return '↑↑';
  if (value >= 3) return '↑';
  if (value <= -8) return '↓↓';
  if (value <= -3) return '↓';
  return '→';
}

interface EffectHint {
  icon: string;
  label: string;
  arrow: string;
  value?: number;
  positive: boolean;
}

function getEffectHints(effects: InterviewEffects): EffectHint[] {
  const hints: EffectHint[] = [];
  if (effects.fanbase)      hints.push({ icon: '👥', label: 'Fans',    arrow: getArrow(effects.fanbase),      value: effects.fanbase,      positive: effects.fanbase > 0 });
  if (effects.morale)       hints.push({ icon: '💙', label: 'Morale',  arrow: getArrow(effects.morale),       value: effects.morale,       positive: effects.morale > 0 });
  if (effects.hype)         hints.push({ icon: '🔥', label: 'Hype',    arrow: getArrow(effects.hype),         value: effects.hype,         positive: effects.hype > 0 });
  if (effects.sponsorTrust) hints.push({ icon: '💰', label: 'Sponsor', arrow: getArrow(effects.sponsorTrust), value: effects.sponsorTrust, positive: effects.sponsorTrust > 0 });
  if (effects.rivalryDelta) hints.push({ icon: '⚔️', label: 'Rival',   arrow: getArrow(effects.rivalryDelta), value: effects.rivalryDelta, positive: effects.rivalryDelta > 0 });
  if (effects.dramaChance && effects.dramaChance > 0) {
    hints.push({ icon: '🎲', label: '+Drama', arrow: '', positive: false });
  }
  return hints;
}

function formatOutcomeHint(hint: EffectHint): string {
  if (hint.value != null) {
    return `${hint.value > 0 ? '+' : ''}${hint.value} ${hint.label}`;
  }
  return hint.arrow ? `${hint.label} ${hint.arrow}` : hint.label;
}

// ============================================================================
// Matchup header — renders PostMatchHeader or PreMatchHeader depending on match status
// ============================================================================

function MatchupHeader({ interview }: { interview: PendingInterview }) {
  const match = useGameStore((state) => interview.matchId ? state.matches[interview.matchId] : undefined);
  if (!interview.matchId || !match) return null;

  if (match.status === 'completed') {
    return <PostMatchHeader matchId={interview.matchId} />;
  }
  return <PreMatchHeader matchId={interview.matchId} />;
}

// Parses STX/ETX markers (\x02...\x03) inserted by InterviewService and renders
// highlighted spans for substituted values (player names, team names, etc.)
function renderHighlightedQuote(text: string): ReactNode {
  const parts = text.split(/(\x02[^\x03]*\x03)/);
  return parts.map((part, i) => {
    if (part.startsWith('\x02') && part.endsWith('\x03')) {
      return (
        <span key={i} className="font-semibold text-white not-italic">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

// ============================================================================
// Component
// ============================================================================

export function InterviewModal({ interview, onChoose, onClose, questionNumber, totalQuestions }: InterviewModalProps) {
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);
  const [showCollection, setShowCollection] = useState(false);

  const players = useGameStore((state) => state.players);
  const teams = useGameStore((state) => state.teams);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const interviewHistory = useGameStore((state) => state.interviewHistory);
  const fanbase = useGameStore((state) =>
    state.playerTeamId ? state.teams[state.playerTeamId]?.reputation.fanbase : undefined
  );

  const contextMeta = CONTEXT_META[interview.context];
  const managerProfile = selectManagerProfile(interviewHistory);

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

  // Resolve avatar image for the subject
  const { subjectImageUrl, subjectInitial } = (() => {
    if (interview.subjectType === 'player' && interview.subjectId) {
      const player = players[interview.subjectId];
      if (player) return {
        subjectImageUrl: getPlayerImageUrl(player.name),
        subjectInitial: player.name.charAt(0).toUpperCase(),
      };
    }
    const initial = interview.subjectType === 'manager' ? 'M' : 'C';
    return { subjectImageUrl: null, subjectInitial: initial };
  })();

  // Handle choice - show outcome first, then apply effects via parent
  const handleChoose = (index: number) => {
    setChosenIndex(index);
    setShowOutcome(true);

    onChoose(index);
  };

  const handleContinue = () => {
    setChosenIndex(null);
    setShowOutcome(false);
    onClose();
  };

  const chosenOption = chosenIndex !== null ? interview.options[chosenIndex] : null;

  // Derive which players were affected by the chosen option's morale effect
  const affectedPlayerIds = (() => {
    if (!chosenOption) return [];
    const { effects } = chosenOption;
    if (effects.targetPlayerIds) return effects.targetPlayerIds;
    if (effects.morale !== undefined) {
      return (playerTeamId ? teams[playerTeamId]?.playerIds : undefined) ?? [];
    }
    return [];
  })();

  return (
    <>
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">

        {showOutcome ? (
          // ── Outcome view ────────────────────────────────────────────────
          <>
            <div className="p-4 border-b border-vct-gray/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-vct-light">Response Delivered</h2>
              <button
                onClick={() => setShowCollection(true)}
                className="flex items-center gap-1.5 text-sm text-vct-gray/70 hover:text-vct-light transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Collection
              </button>
            </div>

            <div className="overflow-y-auto overflow-x-hidden flex-1">
              <MatchupHeader interview={interview} />

              <div className="p-6 space-y-4">
                <p className="text-vct-light text-base italic leading-relaxed">
                  "{chosenOption?.quote ? renderHighlightedQuote(chosenOption.quote) : ''}"
                </p>

                {affectedPlayerIds.length > 0 && (
                  <div className="pt-4 border-t border-vct-gray/20">
                    <h3 className="text-sm font-medium text-vct-gray mb-3">Players Affected:</h3>
                    <div className="flex flex-wrap gap-3">
                      {affectedPlayerIds.map((id) => {
                        const player = players[id];
                        if (!player) return null;
                        return (
                          <div key={id} className="flex flex-col items-center gap-1">
                            <GameImage
                              src={getPlayerImageUrl(player.name)}
                              alt={player.name}
                              className="w-10 h-10 rounded-full object-cover"
                              fallbackClassName="w-10 h-10 rounded-full"
                            />
                            <span className="text-xs text-vct-gray">{player.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-vct-gray/20">
                  <h3 className="text-sm font-medium text-vct-gray mb-2">Effects:</h3>
                  {(() => {
                    const hints = chosenOption ? getEffectHints(chosenOption.effects) : [];
                    if (hints.length === 0) return <p className="text-sm text-vct-gray">No immediate effects</p>;
                    return (
                      <div className="flex items-center gap-2 flex-wrap">
                        {hints.map((hint, i) => (
                          <span key={i} className={`text-xs font-mono ${hint.arrow === '' && hint.value == null ? 'text-purple-400' : hint.positive ? 'text-green-400' : 'text-red-400'}`}>
                            {hint.icon} {formatOutcomeHint(hint)}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-vct-gray/20 flex justify-end">
              <button
                onClick={handleContinue}
                className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
              >
                {totalQuestions && questionNumber && questionNumber < totalQuestions
                  ? 'Next Question'
                  : 'Continue'}
              </button>
            </div>
          </>
        ) : (
          // ── Choice view ─────────────────────────────────────────────────
          <>
            {/* Top badges + title row */}
            <div className="p-4 border-b border-vct-gray/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${contextMeta.badgeColor}`}>
                    {contextMeta.label}
                  </span>
                  {interview.isNew && <NewBadge />}
                  {/* Manager archetype badge */}
                  {managerProfile.archetype && (() => {
                    const meta = ARCHETYPE_META[managerProfile.archetype];
                    return (
                      <span className={`text-xs font-medium ${meta.color}`}>
                        {meta.icon} {meta.label} ({managerProfile.archetypeStrength}%)
                      </span>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setShowCollection(true)}
                  className="flex items-center gap-1.5 text-sm text-vct-gray/70 hover:text-vct-light transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Collection
                </button>
              </div>
              <p className="text-sm text-vct-gray">
                Press Conference{(totalQuestions ?? 0) > 1 ? ` · Q ${questionNumber} of ${totalQuestions}` : ''}
              </p>
            </div>

            {/* Scene panel: reporter (left) + subject (right) */}
            <div className="grid grid-cols-[3fr_2fr] border-b border-vct-gray/20">
              {/* Reporter column */}
              <div className="p-4 border-r border-vct-gray/20 flex flex-col gap-2">
                <p className="text-xs font-medium text-vct-gray/70">🎙️ REPORTER</p>
                <div className="bg-vct-dark rounded-lg rounded-tl-none p-3">
                  <p className="text-sm text-vct-light leading-relaxed">"{renderHighlightedQuote(interview.prompt)}"</p>
                </div>
                {fanbase !== undefined && (() => {
                  const ctx = getInterviewApprovalContext(fanbase);
                  if (!ctx) return null;
                  const isLow = fanbase < 40;
                  return (
                    <p className={`text-xs ${isLow ? 'text-red-400/80' : 'text-green-400/80'}`}>
                      👥 {ctx}
                    </p>
                  );
                })()}
              </div>
              {/* Subject column */}
              <div className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                {subjectImageUrl ? (
                  <GameImage
                    src={subjectImageUrl}
                    alt={subjectLabel}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover flex-shrink-0"
                    fallbackClassName="w-16 h-16 md:w-20 md:h-20 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-vct-darker border border-vct-gray/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-vct-gray">{subjectInitial}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-vct-light">{subjectLabel}</p>
                  <p className="text-xs text-vct-gray">
                    {interview.subjectType === 'manager' ? 'Manager' : interview.subjectType === 'coach' ? 'Head Coach' : 'Player'}
                  </p>
                </div>
              </div>
            </div>

            {/* Matchup context header + scrollable body */}
            <div className="overflow-y-auto overflow-x-hidden flex-1">
              <MatchupHeader interview={interview} />

              {/* Options — quote-first layout */}
              <div className="p-6 space-y-3">
                <h3 className="text-sm font-medium text-vct-gray mb-3">How do you respond?</h3>
                {interview.options.map((option, index) => {
                  const toneStyle = TONE_CARD_STYLE[option.tone];
                  const hints = getEffectHints(option.effects);
                  const isOnBrand = managerProfile.archetype
                    ? ARCHETYPE_ON_BRAND[managerProfile.archetype].includes(option.tone)
                    : false;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleChoose(index)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${toneStyle.border} ${toneStyle.hoverBorder}`}
                    >
                      {/* Quote — primary text */}
                      <p className="text-sm text-vct-light leading-relaxed mb-3">
                        "{option.quote ? renderHighlightedQuote(option.quote) : ''}"
                      </p>

                      {/* Attribution — only on iconic/real-world quotes */}
                      {option.attribution && (
                        <p className="text-xs text-vct-gray/40 mb-2">📌 {option.attribution}</p>
                      )}

                      {/* Footer: tone badge + effect hints */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${toneStyle.badge}`}>
                            {option.tone.replace('_', ' ')}
                          </span>
                          {isOnBrand && (
                            <span className="text-xs text-vct-gray/50" title="On-brand for your archetype">✓</span>
                          )}
                        </div>

                        {/* Effect hints */}
                        {hints.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {hints.map((hint, i) => (
                              <span key={i} className="relative group/hint">
                                <span
                                  className={`text-xs font-mono cursor-help ${hint.arrow === '' ? 'text-purple-400' : hint.positive ? 'text-green-400' : 'text-red-400'}`}
                                >
                                  {hint.icon} {hint.label}{hint.arrow ? ` ${hint.arrow}` : ''}
                                </span>
                                {EFFECT_TOOLTIP[hint.label] && (
                                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-vct-darker border border-vct-gray/30 rounded whitespace-nowrap opacity-0 group-hover/hint:opacity-100 transition-opacity pointer-events-none z-10">
                                    {EFFECT_TOOLTIP[hint.label]}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    {showCollection && <NarrativeCollectionModal onClose={() => setShowCollection(false)} />}
    </>
  );
}
