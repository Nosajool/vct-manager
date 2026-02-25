// DramaEventToast - Slide-in notification for minor drama events
//
// Appears for minor severity drama events with auto-dismiss
// Shows event narrative and effect summary with category-based styling

import { useEffect, useState } from 'react';
import type { DramaCategory, DramaEventInstance } from '../../types/drama';
import { useGameStore } from '../../store';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl } from '../../utils/imageAssets';

// NOTE: This component expects DramaEventInstance to be enriched with
// template data (title, narrative) before being passed as props.
// The narrative field should have player names already substituted.
interface DramaEventToastProps {
  /** The drama event to display (enriched with title/narrative from template) */
  event: DramaEventInstance & {
    title: string;
    narrative: string;
  };
  /** Called when notification is dismissed */
  onDismiss: () => void;
  /** Auto-dismiss after this many milliseconds (default: 5000) */
  autoCloseMs?: number;
}

/** Category display metadata */
const CATEGORY_METADATA: Record<
  DramaCategory,
  { label: string; color: string; icon: string }
> = {
  player_ego: {
    label: 'Player Update',
    color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    icon: '👤',
  },
  team_synergy: {
    label: 'Team Update',
    color: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
    icon: '🤝',
  },
  external_pressure: {
    label: 'External',
    color: 'from-red-500/20 to-red-600/20 border-red-500/30',
    icon: '⚠️',
  },
  practice_burnout: {
    label: 'Staff Report',
    color: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    icon: '📋',
  },
  breakthrough: {
    label: 'Breakthrough!',
    color: 'from-green-500/20 to-green-600/20 border-green-500/30',
    icon: '⭐',
  },
  meta_rumors: {
    label: 'Intel Report',
    color: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    icon: '📰',
  },
  visa_arc: {
    label: 'Visa Crisis',
    color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    icon: '🛂',
  },
  coaching_overhaul: {
    label: 'Coaching Overhaul',
    color: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
    icon: '📋',
  },
  igl_crisis: {
    label: 'IGL Crisis',
    color: 'from-red-500/20 to-red-600/20 border-red-500/30',
    icon: '🎯',
  },
};

/**
 * Format effect summary from applied effects
 * Returns a formatted string like "-3 Morale, +2 Chemistry"
 */
function formatEffectSummary(effects: DramaEventInstance['appliedEffects']): string {
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

/**
 * Get color class for effect delta (red for negative, green for positive)
 */
function getEffectColor(effects: DramaEventInstance['appliedEffects']): string {
  const totalDelta = effects.reduce((sum, e) => sum + (e.delta || 0), 0);
  if (totalDelta > 0) return 'text-green-400';
  if (totalDelta < 0) return 'text-red-400';
  return 'text-vct-gray';
}

export function DramaEventToast({
  event,
  onDismiss,
  autoCloseMs = 5000,
}: DramaEventToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const players = useGameStore((state) => state.players);
  const affectedPlayer = event.affectedPlayerIds?.[0]
    ? players[event.affectedPlayerIds[0]]
    : null;
  const playerImageUrl = affectedPlayer ? getPlayerImageUrl(affectedPlayer.name) : null;

  const metadata = CATEGORY_METADATA[event.category];
  const effectSummary = formatEffectSummary(event.appliedEffects);
  const effectColor = getEffectColor(event.appliedEffects);

  // Show effect: runs once on mount
  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(showTimer);
  }, []);

  // Dismiss effect: paused when expanded
  useEffect(() => {
    if (isExpanded) return;

    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, autoCloseMs);

    return () => clearTimeout(dismissTimer);
  }, [autoCloseMs, onDismiss, isExpanded]);

  const handleManualDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleToggleExpand = () => {
    setIsExpanded(true);
  };

  return (
    <div
      className={`
        fixed top-20 right-6 z-50
        max-w-md
        transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}
      `}
    >
      <div
        className={`
          bg-gradient-to-r ${metadata.color}
          bg-vct-darker
          border rounded-lg p-4
          shadow-lg backdrop-blur-sm
        `}
      >
        <div className="flex items-start gap-3">
          {/* Clickable content area */}
          <div
            className={`flex items-start gap-3 flex-1 min-w-0 ${!isExpanded ? 'cursor-pointer' : ''}`}
            onClick={!isExpanded ? handleToggleExpand : undefined}
          >
            {/* Category Icon / Player Image */}
            <div className="flex-shrink-0 flex flex-col items-center">
              {affectedPlayer ? (
                <GameImage
                  src={playerImageUrl!}
                  alt={affectedPlayer.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 mb-1"
                  fallbackClassName="w-10 h-10 rounded-full flex-shrink-0 mb-1"
                />
              ) : (
                <div className="text-2xl mb-1">{metadata.icon}</div>
              )}
              <span className="text-xs font-medium text-vct-gray">
                {metadata.label}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1 mb-1">
                <h3 className="text-lg font-bold text-vct-light">
                  {event.title}
                </h3>
                {isExpanded && (
                  <span className="text-xs text-vct-gray/60 ml-1">Paused</span>
                )}
              </div>
              <p className={`text-sm text-vct-gray mb-2 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                {event.narrative}
              </p>
              {/* Effect Summary */}
              <div className={`text-xs font-medium ${effectColor}`}>
                {effectSummary}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleManualDismiss}
            className="flex-shrink-0 text-vct-gray hover:text-vct-light transition-colors"
            aria-label="Dismiss notification"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
