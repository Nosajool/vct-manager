// CoachBriefingModal - Context-sensitive daily/post-match briefing
//
// Shown after day advancement when notable team state conditions exist.
// Dismissible. Coach-voice narrative about current team state.

import type { CoachHint } from '../../utils/coachNarrative';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl } from '../../utils/imageAssets';

interface CoachBriefingModalProps {
  hints: CoachHint[];
  onClose: () => void;
}

export function CoachBriefingModal({ hints, onClose }: CoachBriefingModalProps) {
  if (hints.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg max-w-sm w-full overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20 bg-gradient-to-r from-vct-gray/10 to-transparent">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-vct-gray/60">Coach's Briefing</span>
          </div>
          <h2 className="text-base font-bold text-vct-light">Team Check-In</h2>
        </div>

        {/* Hints */}
        <div className="p-4 space-y-3">
          {hints.map((hint, i) => (
            <BriefingLine key={i} hint={hint} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light text-sm font-medium rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function BriefingLine({ hint }: { hint: CoachHint }) {
  const borderClass =
    hint.severity === 'warning'
      ? 'border-yellow-500/30 bg-yellow-500/5'
      : hint.severity === 'positive'
      ? 'border-green-500/30 bg-green-500/5'
      : 'border-vct-gray/20 bg-vct-gray/5';

  const textClass =
    hint.severity === 'warning'
      ? 'text-yellow-400/90'
      : hint.severity === 'positive'
      ? 'text-green-400/90'
      : 'text-vct-gray/80';

  return (
    <div className={`border rounded-lg p-3 ${borderClass}`}>
      {hint.playerName && (
        <div className="flex items-center gap-2 mb-2">
          <GameImage
            src={getPlayerImageUrl(hint.playerName)}
            alt={hint.playerName}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-xs font-semibold text-vct-light">{hint.playerName}</span>
        </div>
      )}
      <p className={`text-sm leading-relaxed italic ${textClass}`}>{hint.text}</p>
    </div>
  );
}
