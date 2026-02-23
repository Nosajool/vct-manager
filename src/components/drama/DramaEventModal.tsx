// DramaEventModal - Full-screen modal for major drama events
//
// Displays major severity drama events that require player decisions
// Shows event narrative, player choices, and outcome after selection
// Blocks game progression until a choice is made (no dismiss/escape)

import { useState } from 'react';
import type { DramaCategory, DramaChoice, DramaEventInstance } from '../../types/drama';
import { useGameStore } from '../../store';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl } from '../../utils/imageAssets';

// NOTE: This component expects DramaEventInstance to be enriched with
// template data (narrative) and choices from the template.
interface DramaEventModalProps {
  /** The drama event to display (enriched with narrative from template) */
  event: DramaEventInstance & {
    narrative: string;
  };
  /** Available choices for the player to select */
  choices: DramaChoice[];
  /** Called when player makes a choice */
  onChoose: (choiceId: string) => void;
  /** Called when the user closes the modal (clicks Continue) */
  onClose: () => void;
  /** Whether the modal is open */
  isOpen: boolean;
}

/** Category display metadata - matches toast colors */
const CATEGORY_METADATA: Record<
  DramaCategory,
  { label: string; color: string; badgeColor: string }
> = {
  player_ego: {
    label: 'Player Issue',
    color: 'from-orange-500/20 to-orange-600/20',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  team_synergy: {
    label: 'Team Dynamics',
    color: 'from-cyan-500/20 to-cyan-600/20',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
  external_pressure: {
    label: 'External Pressure',
    color: 'from-red-500/20 to-red-600/20',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  practice_burnout: {
    label: 'Practice Concerns',
    color: 'from-yellow-500/20 to-yellow-600/20',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  breakthrough: {
    label: 'Major Breakthrough',
    color: 'from-green-500/20 to-green-600/20',
    badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  meta_rumors: {
    label: 'Strategic Intel',
    color: 'from-purple-500/20 to-purple-600/20',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  visa_arc: {
    label: 'Visa Crisis',
    color: 'from-blue-500/20 to-blue-600/20',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  coaching_overhaul: {
    label: 'Coaching Overhaul',
    color: 'from-amber-500/20 to-amber-600/20',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
};

/**
 * Format effect summary from choice effects
 * Returns a formatted string like "+5 Morale, -3 Chemistry"
 */
function formatEffectSummary(effects: DramaChoice['effects']): string {
  const summaries: string[] = [];

  for (const effect of effects) {
    if (effect.delta) {
      const sign = effect.delta > 0 ? '+' : '';
      const stat = effect.stat || effect.target.replace('_', ' ');
      const displayStat = stat.charAt(0).toUpperCase() + stat.slice(1);
      summaries.push(`${sign}${effect.delta} ${displayStat}`);
    }
  }

  return summaries.join(', ') || 'No immediate effects';
}

export function DramaEventModal({
  event,
  choices,
  onChoose,
  onClose,
  isOpen,
}: DramaEventModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);
  const [outcomeText, setOutcomeText] = useState('');
  const [outcomeEffects, setOutcomeEffects] = useState('');

  const players = useGameStore((state) => state.players);

  if (!isOpen) return null;

  const metadata = CATEGORY_METADATA[event.category];

  const affectedPlayer = event.affectedPlayerIds?.[0]
    ? players[event.affectedPlayerIds[0]]
    : null;
  const playerImageUrl = affectedPlayer ? getPlayerImageUrl(affectedPlayer.name) : null;
  const playerInitial = affectedPlayer ? affectedPlayer.name.charAt(0).toUpperCase() : '?';

  const handleChoose = (choice: DramaChoice) => {
    // Show the outcome first
    setOutcomeText(choice.outcomeText);
    setOutcomeEffects(formatEffectSummary(choice.effects));
    setShowOutcome(true);

    // Call the parent handler to apply effects
    onChoose(choice.id);
  };

  const handleContinue = () => {
    // Reset state for next time
    setSelectedChoice(null);
    setShowOutcome(false);
    setOutcomeText('');
    setOutcomeEffects('');

    // Close the modal
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg max-w-lg w-full overflow-hidden flex flex-col">
        {showOutcome ? (
          // Outcome View
          <>
            {/* Header */}
            <div className="p-4 border-b border-vct-gray/20">
              <h2 className="text-xl font-bold text-vct-light">Decision Made</h2>
              {affectedPlayer && (
                <div className="flex items-center gap-3 mt-2">
                  {playerImageUrl ? (
                    <GameImage
                      src={playerImageUrl}
                      alt={affectedPlayer.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      fallbackClassName="w-10 h-10 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-vct-darker border border-vct-gray/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-bold text-vct-gray">{playerInitial}</span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-vct-light">{affectedPlayer.name}</span>
                </div>
              )}
            </div>

            {/* Outcome Content */}
            <div className="p-6 space-y-4">
              <p className="text-vct-light text-base italic leading-relaxed">
                "{outcomeText}"
              </p>

              {/* Effect Summary */}
              <div className="pt-4 border-t border-vct-gray/20">
                <h3 className="text-sm font-medium text-vct-gray mb-2">Effects:</h3>
                <p className="text-sm text-vct-light font-medium">
                  {outcomeEffects}
                </p>
              </div>
            </div>

            {/* Footer */}
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
          // Choice View
          <>
            {/* Header */}
            <div className="p-4 border-b border-vct-gray/20">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`
                    inline-block px-3 py-1 rounded-full text-xs font-medium border
                    ${metadata.badgeColor}
                  `}
                >
                  {metadata.label}
                </span>
              </div>
              <h2 className="text-xl font-bold text-vct-light">
                Critical Decision Required
              </h2>
              {affectedPlayer && (
                <div className="flex items-center gap-3 mt-2">
                  {playerImageUrl ? (
                    <GameImage
                      src={playerImageUrl}
                      alt={affectedPlayer.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      fallbackClassName="w-10 h-10 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-vct-darker border border-vct-gray/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-bold text-vct-gray">{playerInitial}</span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-vct-light">{affectedPlayer.name}</span>
                </div>
              )}
            </div>

            {/* Event Narrative */}
            <div className="p-6 bg-vct-darker/50">
              <blockquote className="border-l-4 border-vct-gray/30 pl-4 italic text-vct-light leading-relaxed">
                {event.narrative}
              </blockquote>
            </div>

            {/* Divider */}
            <div className="h-px bg-vct-gray/20" />

            {/* Choices */}
            <div className="p-6 space-y-3">
              <h3 className="text-sm font-medium text-vct-gray mb-3">
                How do you respond?
              </h3>
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoose(choice)}
                  onMouseEnter={() => setSelectedChoice(choice.id)}
                  onMouseLeave={() => setSelectedChoice(null)}
                  className={`
                    w-full text-left p-4 rounded-lg border transition-all
                    ${
                      selectedChoice === choice.id
                        ? 'border-vct-red bg-vct-red/10'
                        : 'border-vct-gray/20 hover:border-vct-gray/40'
                    }
                  `}
                >
                  <div className="font-bold text-vct-light mb-1">{choice.text}</div>
                  {choice.description && (
                    <div className="text-sm text-vct-gray">{choice.description}</div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
