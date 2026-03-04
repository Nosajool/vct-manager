// NarrativeHistoryPanel - Unified chronological feed of drama events + interviews
//
// Merges dramaSlice.eventHistory and interviewSlice.interviewHistory, sorted by
// date descending. Includes a "Collection" button to open NarrativeCollectionModal.

import { useState } from 'react';
import { useGameStore } from '../../store';
import { timeProgression } from '../../engine/calendar';
import type { DramaCategory, DramaEventInstance } from '../../types/drama';
import type { InterviewHistoryEntry, InterviewContext } from '../../types/interview';
import { DRAMA_EVENT_TEMPLATES } from '../../data/drama';
import { INTERVIEW_TEMPLATES } from '../../data/interviews';
import { NarrativeCollectionModal } from './NarrativeCollectionModal';

interface NarrativeHistoryPanelProps {
  limit?: number;
}

// ============================================================================
// Unified entry type
// ============================================================================

type NarrativeHistoryEntry =
  | { type: 'drama'; date: string; event: DramaEventInstance }
  | { type: 'interview'; date: string; entry: InterviewHistoryEntry };

// ============================================================================
// Category display metadata (drama)
// ============================================================================

const DRAMA_CATEGORY_META: Record<
  DramaCategory,
  { label: string; color: string; dotColor: string; icon: string }
> = {
  player_ego:       { label: 'Player',        color: 'text-orange-400', dotColor: 'bg-orange-500',  icon: '👤' },
  team_synergy:     { label: 'Team',           color: 'text-cyan-400',   dotColor: 'bg-cyan-500',    icon: '🤝' },
  external_pressure:{ label: 'External',       color: 'text-red-400',    dotColor: 'bg-red-500',     icon: '⚠️' },
  practice_burnout: { label: 'Staff',          color: 'text-yellow-400', dotColor: 'bg-yellow-500',  icon: '📋' },
  breakthrough:     { label: 'Breakthrough',   color: 'text-green-400',  dotColor: 'bg-green-500',   icon: '⭐' },
  meta_rumors:      { label: 'Intel',          color: 'text-purple-400', dotColor: 'bg-purple-500',  icon: '📰' },
  visa_arc:         { label: 'Visa Crisis',    color: 'text-blue-400',   dotColor: 'bg-blue-500',    icon: '🛂' },
  coaching_overhaul:{ label: 'Coaching',       color: 'text-amber-400',  dotColor: 'bg-amber-500',   icon: '📋' },
  igl_crisis:       { label: 'IGL Crisis',     color: 'text-red-400',    dotColor: 'bg-red-500',     icon: '🎯' },
  scrim_sharing:    { label: 'Scrim Scandal',  color: 'text-cyan-400',   dotColor: 'bg-cyan-500',    icon: '🎬' },
};

const INTERVIEW_CONTEXT_META: Record<
  InterviewContext,
  { label: string; color: string; dotColor: string }
> = {
  PRE_MATCH:  { label: 'Pre-Match',     color: 'text-blue-400',   dotColor: 'bg-blue-500'   },
  POST_MATCH: { label: 'Post-Match',    color: 'text-green-400',  dotColor: 'bg-green-500'  },
  CRISIS:     { label: 'Crisis',        color: 'text-red-400',    dotColor: 'bg-red-500'    },
  KICKOFF:    { label: 'Kickoff',       color: 'text-yellow-400', dotColor: 'bg-yellow-500' },
  GENERAL:    { label: 'Media Day',     color: 'text-purple-400', dotColor: 'bg-purple-500' },
};

// ============================================================================
// Effect summary helpers
// ============================================================================

function formatDramaEffects(effects: DramaEventInstance['appliedEffects']): string {
  const summaries: string[] = [];
  for (const effect of effects) {
    if (effect.delta) {
      const sign = effect.delta > 0 ? '+' : '';
      const stat = effect.stat || effect.target.replace('_', ' ');
      summaries.push(`${sign}${effect.delta} ${stat.charAt(0).toUpperCase() + stat.slice(1)}`);
    }
  }
  return summaries.join(', ') || 'No effects';
}

function formatInterviewEffects(effects: InterviewHistoryEntry['effects']): string {
  const parts: string[] = [];
  if (effects.morale)       parts.push(`${effects.morale > 0 ? '+' : ''}${effects.morale} Morale`);
  if (effects.fanbase)      parts.push(`${effects.fanbase > 0 ? '+' : ''}${effects.fanbase} Fans`);
  if (effects.hype)         parts.push(`${effects.hype > 0 ? '+' : ''}${effects.hype} Hype`);
  if (effects.sponsorTrust) parts.push(`${effects.sponsorTrust > 0 ? '+' : ''}${effects.sponsorTrust} Sponsor Trust`);
  return parts.length > 0 ? parts.join(', ') : 'No effects';
}

function getDramaEffectColor(effects: DramaEventInstance['appliedEffects']): string {
  const total = effects.reduce((s, e) => s + (e.delta || 0), 0);
  return total > 0 ? 'text-green-400' : total < 0 ? 'text-red-400' : 'text-vct-gray';
}

function getInterviewEffectColor(effects: InterviewHistoryEntry['effects']): string {
  const total = (effects.morale ?? 0) + (effects.fanbase ?? 0) + (effects.hype ?? 0) + (effects.sponsorTrust ?? 0);
  return total > 0 ? 'text-green-400' : total < 0 ? 'text-red-400' : 'text-vct-gray';
}

// ============================================================================
// Entry renderers
// ============================================================================

function DramaEntry({ event, isExpanded, onToggle }: {
  event: DramaEventInstance;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const meta = DRAMA_CATEGORY_META[event.category];
  const template = DRAMA_EVENT_TEMPLATES.find(t => t.id === event.templateId);
  const dateFormatted = timeProgression.formatDateShort(event.triggeredDate);
  const effectSummary = formatDramaEffects(event.appliedEffects);
  const effectColor = getDramaEffectColor(event.appliedEffects);

  return (
    <div
      className="bg-vct-dark/50 rounded-lg border border-vct-gray/20 p-3 hover:border-vct-gray/40 transition-colors cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
          <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
          {event.severity === 'major' && (
            <span className="px-1.5 py-0.5 bg-vct-red/20 text-vct-red text-xs rounded font-medium">MAJOR</span>
          )}
          <span className="px-1.5 py-0.5 bg-vct-gray/10 text-vct-gray/60 text-xs rounded">DRAMA</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-vct-gray/60">{dateFormatted}</span>
          <svg className={`w-4 h-4 text-vct-gray/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {template && (
        <p className="text-sm font-semibold text-vct-light mb-1">{template.title}</p>
      )}
      <p className={`text-sm text-vct-gray ${!isExpanded ? 'line-clamp-1' : ''}`}>
        {event.outcomeText || 'Event occurred'}
      </p>

      <div className="flex items-center justify-between text-xs mt-2">
        <span className="text-vct-gray/60">
          {event.status === 'resolved' && event.chosenOptionId && 'Decision made'}
          {event.status === 'resolved' && !event.chosenOptionId && 'Auto-resolved'}
          {event.status === 'escalated' && <span className="text-orange-400">Escalated</span>}
          {event.status === 'expired' && 'Expired'}
        </span>
        <span className={`font-medium ${effectColor}`}>
          {isExpanded ? effectSummary : effectSummary.length > 40 ? effectSummary.substring(0, 40) + '...' : effectSummary}
        </span>
      </div>
    </div>
  );
}

function InterviewEntry({ entry, isExpanded, onToggle }: {
  entry: InterviewHistoryEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const meta = INTERVIEW_CONTEXT_META[entry.context];
  const template = INTERVIEW_TEMPLATES.find(t => t.id === entry.templateId);
  const dateFormatted = timeProgression.formatDateShort(entry.date);
  const effectSummary = formatInterviewEffects(entry.effects);
  const effectColor = getInterviewEffectColor(entry.effects);

  return (
    <div
      className="bg-vct-dark/50 rounded-lg border border-vct-gray/20 p-3 hover:border-vct-gray/40 transition-colors cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
          <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
          <span className="px-1.5 py-0.5 bg-vct-gray/10 text-vct-gray/60 text-xs rounded">INTERVIEW</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-vct-gray/60">{dateFormatted}</span>
          <svg className={`w-4 h-4 text-vct-gray/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {template && (
        <p className={`text-sm text-vct-light ${!isExpanded ? 'line-clamp-1' : ''}`}>
          {template.prompt}
        </p>
      )}

      <div className="flex items-center justify-between text-xs mt-2">
        <span className="px-1.5 py-0.5 bg-vct-gray/10 text-vct-gray/60 rounded">
          {entry.chosenTone.replace('_', ' ')}
        </span>
        <span className={`font-medium ${effectColor}`}>
          {isExpanded ? effectSummary : effectSummary.length > 40 ? effectSummary.substring(0, 40) + '...' : effectSummary}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function NarrativeHistoryPanel({ limit = 20 }: NarrativeHistoryPanelProps) {
  const eventHistory = useGameStore((state) => state.getEventHistory());
  const interviewHistory = useGameStore((state) => state.interviewHistory);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCollection, setShowCollection] = useState(false);

  // Merge and sort by date descending
  const entries: NarrativeHistoryEntry[] = [
    ...eventHistory.map((e): NarrativeHistoryEntry => ({ type: 'drama', date: e.triggeredDate, event: e })),
    ...interviewHistory.map((e): NarrativeHistoryEntry => ({ type: 'interview', date: e.date, entry: e })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);

  const totalCount = entries.length;

  if (totalCount === 0) {
    return (
      <>
        <div className="bg-vct-darker rounded-lg border border-vct-gray/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-vct-light">Narrative History</h3>
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
          <p className="text-sm text-vct-gray/60 italic text-center py-8">
            No events yet. Keep playing and drama will unfold.
          </p>
        </div>
        {showCollection && <NarrativeCollectionModal onClose={() => setShowCollection(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="bg-vct-darker rounded-lg border border-vct-gray/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-vct-light">Narrative History</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-vct-gray/60">
              {totalCount} event{totalCount !== 1 ? 's' : ''}
            </span>
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
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {entries.map((entry, idx) => {
            const id = entry.type === 'drama' ? entry.event.id : `interview-${entry.entry.templateId}-${idx}`;
            const isExpanded = expandedId === id;
            const toggle = () => setExpandedId(isExpanded ? null : id);

            if (entry.type === 'drama') {
              return <DramaEntry key={id} event={entry.event} isExpanded={isExpanded} onToggle={toggle} />;
            }
            return <InterviewEntry key={id} entry={entry.entry} isExpanded={isExpanded} onToggle={toggle} />;
          })}
        </div>
      </div>

      {showCollection && <NarrativeCollectionModal onClose={() => setShowCollection(false)} />}
    </>
  );
}
