// DramaHistoryPanel - Display recent drama event history
//
// Shows a scrollable list of past drama events with category badges,
// outcomes, and effects summary

import { useState } from 'react';
import { useGameStore } from '../../store';
import { timeProgression } from '../../engine/calendar';
import type { DramaCategory, DramaEventInstance } from '../../types/drama';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl } from '../../utils/imageAssets';

interface DramaHistoryPanelProps {
  /** Maximum number of events to show (default: 20) */
  limit?: number;
}

/** Category display metadata */
const CATEGORY_METADATA: Record<
  DramaCategory,
  { label: string; color: string; dotColor: string; icon: string }
> = {
  player_ego: {
    label: 'Player',
    color: 'text-orange-400',
    dotColor: 'bg-orange-500',
    icon: '👤',
  },
  team_synergy: {
    label: 'Team',
    color: 'text-cyan-400',
    dotColor: 'bg-cyan-500',
    icon: '🤝',
  },
  external_pressure: {
    label: 'External',
    color: 'text-red-400',
    dotColor: 'bg-red-500',
    icon: '⚠️',
  },
  practice_burnout: {
    label: 'Staff',
    color: 'text-yellow-400',
    dotColor: 'bg-yellow-500',
    icon: '📋',
  },
  breakthrough: {
    label: 'Breakthrough',
    color: 'text-green-400',
    dotColor: 'bg-green-500',
    icon: '⭐',
  },
  meta_rumors: {
    label: 'Intel',
    color: 'text-purple-400',
    dotColor: 'bg-purple-500',
    icon: '📰',
  },
  visa_arc: {
    label: 'Visa Crisis',
    color: 'text-blue-400',
    dotColor: 'bg-blue-500',
    icon: '🛂',
  },
  coaching_overhaul: {
    label: 'Coaching',
    color: 'text-amber-400',
    dotColor: 'bg-amber-500',
    icon: '📋',
  },
  igl_crisis: {
    label: 'IGL Crisis',
    color: 'text-red-400',
    dotColor: 'bg-red-500',
    icon: '🎯',
  },
};

/**
 * Format effect summary from applied effects
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

  return summaries.join(', ') || 'No effects';
}

/**
 * Get color class for effect delta
 */
function getEffectColor(effects: DramaEventInstance['appliedEffects']): string {
  const totalDelta = effects.reduce((sum, e) => sum + (e.delta || 0), 0);
  if (totalDelta > 0) return 'text-green-400';
  if (totalDelta < 0) return 'text-red-400';
  return 'text-vct-gray';
}

export function DramaHistoryPanel({ limit = 20 }: DramaHistoryPanelProps) {
  const getEventHistory = useGameStore((state) => state.getEventHistory);
  const players = useGameStore((state) => state.players);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Get recent events (they come in chronological order, newest last)
  const allEvents = getEventHistory(limit);
  // Reverse to show newest first
  const events = [...allEvents].reverse();

  if (events.length === 0) {
    return (
      <div className="bg-vct-darker rounded-lg border border-vct-gray/20 p-6">
        <h3 className="text-lg font-semibold text-vct-light mb-3">Recent Events</h3>
        <p className="text-sm text-vct-gray/60 italic text-center py-8">
          No events yet. Keep playing and drama will unfold.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-vct-darker rounded-lg border border-vct-gray/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-vct-light">Recent Events</h3>
        <span className="text-sm text-vct-gray/60">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Event List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {events.map((event) => {
          const metadata = CATEGORY_METADATA[event.category];
          const effectSummary = formatEffectSummary(event.appliedEffects);
          const effectColor = getEffectColor(event.appliedEffects);
          const dateFormatted = timeProgression.formatDateShort(event.triggeredDate);
          const affectedPlayer = event.affectedPlayerIds?.[0]
            ? players[event.affectedPlayerIds[0]]
            : null;

          const isExpanded = expandedEventId === event.id;

          return (
            <div
              key={event.id}
              className="bg-vct-dark/50 rounded-lg border border-vct-gray/20 p-3 hover:border-vct-gray/40 transition-colors cursor-pointer"
              onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
            >
              {/* Header: Category + Date + Chevron */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${metadata.dotColor}`} />
                  <span className={`text-xs font-medium ${metadata.color}`}>
                    {metadata.label}
                  </span>
                  {event.severity === 'major' && (
                    <span className="px-1.5 py-0.5 bg-vct-red/20 text-vct-red text-xs rounded font-medium">
                      MAJOR
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-vct-gray/60">{dateFormatted}</span>
                  <svg
                    className={`w-4 h-4 text-vct-gray/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Narrative */}
              <div className="flex items-start gap-2 mb-2">
                {affectedPlayer && (
                  <GameImage
                    src={getPlayerImageUrl(affectedPlayer.name)}
                    alt={affectedPlayer.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    fallbackClassName="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                <p className={`text-sm text-vct-light ${!isExpanded ? 'line-clamp-1' : ''}`}>
                  {event.outcomeText || 'Event occurred'}
                </p>
              </div>

              {/* Bottom row: Outcome + Effects */}
              <div className="flex items-center justify-between text-xs">
                {/* Outcome indicator */}
                {event.status === 'resolved' && event.chosenOptionId && (
                  <span className="text-vct-gray/60">
                    Decision made
                  </span>
                )}
                {event.status === 'escalated' && (
                  <span className="text-orange-400">Escalated</span>
                )}
                {event.status === 'expired' && (
                  <span className="text-vct-gray/60">Expired</span>
                )}
                {!event.chosenOptionId && event.status === 'resolved' && (
                  <span className="text-vct-gray/60">Auto-resolved</span>
                )}

                {/* Effects */}
                <span className={`font-medium ${effectColor}`}>
                  {isExpanded ? effectSummary : effectSummary.length > 40 ? effectSummary.substring(0, 40) + '...' : effectSummary}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
