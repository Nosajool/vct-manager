// NarrativeCollectionModal - Pokédex-style view of discovered narrative entries
//
// Shows all 12 DramaCategory values (5 arc categories + 6 general drama categories + tournament_drama)
// with discovered vs locked entries. Locked entries show type hint but not the title.

import { useState } from 'react';
import { useGameStore } from '../../store';
import { DRAMA_EVENT_TEMPLATES } from '../../data/drama';
import { INTERVIEW_TEMPLATES } from '../../data/interviews';
import type { DramaCategory } from '../../types/drama';

interface NarrativeCollectionModalProps {
  onClose: () => void;
}

// ============================================================================
// Category display config
// ============================================================================

const CATEGORY_CONFIG: Record<
  DramaCategory,
  { label: string; color: string; badgeColor: string }
> = {
  visa_arc:          { label: 'Visa Arc',          color: 'text-blue-400',    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'      },
  coaching_overhaul: { label: 'Coaching Overhaul', color: 'text-amber-400',   badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'   },
  igl_crisis:        { label: 'IGL Crisis',        color: 'text-red-400',     badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30'         },
  scrim_sharing:     { label: 'Scrim Sharing',     color: 'text-cyan-400',    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'      },
  org_culture:       { label: 'Org Culture',       color: 'text-yellow-400',  badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'},
  player_ego:        { label: 'Player Ego',        color: 'text-orange-400',  badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30'},
  team_synergy:      { label: 'Team Synergy',      color: 'text-green-400',   badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30'   },
  external_pressure: { label: 'External Pressure', color: 'text-purple-400',  badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'},
  practice_burnout:  { label: 'Practice Burnout',  color: 'text-orange-300',  badgeColor: 'bg-orange-400/20 text-orange-300 border-orange-400/30'},
  breakthrough:      { label: 'Breakthrough',      color: 'text-emerald-400', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'},
  meta_rumors:       { label: 'Meta Rumors',       color: 'text-violet-400',  badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30'},
  tournament_drama:  { label: 'Tournament Drama',  color: 'text-rose-400',    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'       },
};

const NARRATIVE_CATEGORIES: DramaCategory[] = [
  // Arc categories (narrative arcs)
  'scrim_sharing', 'visa_arc', 'igl_crisis', 'coaching_overhaul', 'org_culture',
  // General drama categories
  'player_ego', 'team_synergy', 'external_pressure', 'practice_burnout', 'breakthrough', 'meta_rumors',
  'tournament_drama',
];

// ============================================================================
// Helper: collect all templates for a category
// ============================================================================

interface CollectionEntry {
  templateId: string;
  type: 'MINOR DRAMA' | 'MAJOR DRAMA' | 'INTERVIEW';
  title: string;
}

function getCategoryEntries(category: DramaCategory): CollectionEntry[] {
  const dramaEntries = DRAMA_EVENT_TEMPLATES
    .filter(t => t.category === category)
    .map((t): CollectionEntry => ({
      templateId: t.id,
      type: t.severity === 'major' ? 'MAJOR DRAMA' : 'MINOR DRAMA',
      title: t.title,
    }));

  const interviewEntries = INTERVIEW_TEMPLATES
    .filter(t => t.narrativeCategory === category)
    .map((t): CollectionEntry => ({
      templateId: t.id,
      type: 'INTERVIEW',
      title: t.prompt.length > 60 ? t.prompt.slice(0, 57) + '...' : t.prompt,
    }));

  return [...dramaEntries, ...interviewEntries];
}

// ============================================================================
// Type badge color
// ============================================================================

function typeBadgeColor(type: CollectionEntry['type']): string {
  if (type === 'MAJOR DRAMA') return 'bg-vct-red/20 text-vct-red border-vct-red/30';
  if (type === 'MINOR DRAMA') return 'bg-vct-gray/20 text-vct-gray/80 border-vct-gray/30';
  return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
}

// ============================================================================
// Main component
// ============================================================================

export function NarrativeCollectionModal({ onClose }: NarrativeCollectionModalProps) {
  const seenTemplateIds = useGameStore((state) => state.seenTemplateIds);
  const currentDate = useGameStore((state) => state.calendar.currentDate);
  const resetCollection = useGameStore((state) => state.resetCollection);
  const [confirmReset, setConfirmReset] = useState(false);

  const [expandedCategories, setExpandedCategories] = useState<Set<DramaCategory>>(() => {
    const initial = new Set<DramaCategory>();
    NARRATIVE_CATEGORIES.forEach((category) => {
      const entries = getCategoryEntries(category);
      const seenCount = entries.filter((e) => seenTemplateIds.includes(e.templateId)).length;
      if (seenCount > 0) initial.add(category);
    });
    return initial;
  });

  const toggleCategory = (category: DramaCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleReset = () => {
    resetCollection(currentDate);
    setConfirmReset(false);
  };

  const allEntries = NARRATIVE_CATEGORIES.flatMap(getCategoryEntries);
  const totalSeen = allEntries.filter(e => seenTemplateIds.includes(e.templateId)).length;
  const totalAvailable = allEntries.length;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-vct-light">Narrative Collection</h2>
            <p className="text-sm text-vct-gray/60 mt-0.5">{totalSeen} / {totalAvailable} collected</p>
          </div>
          <div className="flex items-center gap-2">
            {confirmReset ? (
              <>
                <span className="text-xs text-vct-gray/60">Are you sure?</span>
                <button
                  onClick={handleReset}
                  className="px-3 py-1 text-xs bg-vct-red/20 text-vct-red border border-vct-red/30 rounded hover:bg-vct-red/30 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1 text-xs bg-vct-gray/10 text-vct-gray border border-vct-gray/20 rounded hover:bg-vct-gray/20 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="px-3 py-1 text-xs text-vct-gray/60 border border-vct-gray/20 rounded hover:text-vct-gray hover:border-vct-gray/40 transition-colors"
              >
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="text-vct-gray hover:text-vct-light transition-colors ml-2"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 divide-y divide-vct-gray/10">
          {NARRATIVE_CATEGORIES.map((category) => {
            const config = CATEGORY_CONFIG[category];
            const entries = getCategoryEntries(category);
            const seenCount = entries.filter(e => seenTemplateIds.includes(e.templateId)).length;

            return (
              <div key={category} className="p-4">
                {/* Category header */}
                <div
                  className="flex items-center justify-between mb-3 cursor-pointer hover:opacity-80"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className={`w-4 h-4 text-vct-gray/60 transition-transform ${
                        expandedCategories.has(category) ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className={`text-sm font-semibold uppercase tracking-wide ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <span className="text-xs text-vct-gray/60">
                    {seenCount} / {entries.length} discovered
                  </span>
                </div>

                {/* Entry list */}
                {expandedCategories.has(category) && (
                  <div className="space-y-2">
                    {entries.map((entry) => {
                    const isSeen = seenTemplateIds.includes(entry.templateId);
                    return (
                      <div
                        key={entry.templateId}
                        className={`flex items-start gap-3 p-2 rounded ${isSeen ? 'bg-vct-dark/30' : 'bg-vct-dark/10 opacity-60'}`}
                      >
                        {/* Seen/locked icon */}
                        <span className="flex-shrink-0 mt-0.5">
                          {isSeen ? (
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-sm leading-none">🔒</span>
                          )}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-vct-light truncate">
                            {isSeen ? entry.title : '???'}
                          </p>
                        </div>

                        {/* Type badge */}
                        <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded border ${typeBadgeColor(entry.type)}`}>
                          {entry.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
