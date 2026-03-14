// NarrativeCollectionModal - Pokédex-style view of discovered narrative entries
//
// Shows all 14 DramaCategory values (5 arc categories + 7 general drama categories + cove_incident + tournament_drama)
// with discovered vs locked entries. Locked entries show type hint but not the title.

import { useState } from 'react';
import { useGameStore } from '../../store';
import { DRAMA_EVENT_TEMPLATES } from '../../data/drama';
import { INTERVIEW_TEMPLATES } from '../../data/interviews';
import type { DramaCategory, DramaEffect } from '../../types/drama';
import type { InterviewEffects } from '../../types/interview';

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
  cove_incident:     { label: 'Cove Incident',     color: 'text-cyan-400',    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'         },
  tournament_drama:  { label: 'Tournament Drama',  color: 'text-rose-400',    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'       },
  map_pool:          { label: 'Map Pool',          color: 'text-teal-400',    badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30'        },
  financial_stress:  { label: 'Financial Stress',  color: 'text-amber-400',   badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'      },
  iconic_moments:    { label: 'Iconic Moment',     color: 'text-violet-400',  badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30'    },
};

const NARRATIVE_CATEGORIES: DramaCategory[] = [
  // Arc categories (narrative arcs)
  'scrim_sharing', 'visa_arc', 'igl_crisis', 'coaching_overhaul', 'org_culture',
  // General drama categories
  'player_ego', 'team_synergy', 'external_pressure', 'practice_burnout', 'breakthrough', 'meta_rumors',
  'cove_incident', 'tournament_drama', 'map_pool', 'financial_stress', 'iconic_moments',
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
      title: (() => { const displayPrompt = t.prompt.replace(/\{[^}]+\}/g, 'a map'); return displayPrompt.length > 60 ? displayPrompt.slice(0, 57) + '...' : displayPrompt; })(),
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
// Effect summary helpers
// ============================================================================

function formatDramaEffects(effects: DramaEffect[]): string {
  const parts: string[] = [];
  for (const e of effects) {
    if (e.delta === undefined) continue;
    const sign = e.delta >= 0 ? '+' : '';
    if (e.target === 'player_morale') parts.push(`Morale ${sign}${e.delta}`);
    else if (e.target === 'player_form') parts.push(`Form ${sign}${e.delta}`);
    else if (e.target === 'team_chemistry') parts.push(`Chemistry ${sign}${e.delta}`);
    else if (e.target === 'team_hype') parts.push(`Hype ${sign}${e.delta}`);
    else if (e.target === 'team_sponsor_trust') parts.push(`Sponsor Trust ${sign}${e.delta}`);
    else if (e.target === 'team_budget') parts.push(`Budget ${sign}${e.delta}`);
    else if (e.target === 'player_stat' && e.stat) parts.push(`${e.stat} ${sign}${e.delta}`);
  }
  return parts.join(' · ') || 'No stat effects';
}

function formatInterviewEffects(effects: InterviewEffects): string {
  const parts: string[] = [];
  if (effects.hype) parts.push(`Hype ${effects.hype >= 0 ? '+' : ''}${effects.hype}`);
  if (effects.fanbase) parts.push(`Fanbase ${effects.fanbase >= 0 ? '+' : ''}${effects.fanbase}`);
  if (effects.morale) parts.push(`Morale ${effects.morale >= 0 ? '+' : ''}${effects.morale}`);
  if (effects.sponsorTrust) parts.push(`Sponsor ${effects.sponsorTrust >= 0 ? '+' : ''}${effects.sponsorTrust}`);
  if (effects.rivalryDelta) parts.push(`Rivalry ${effects.rivalryDelta >= 0 ? '+' : ''}${effects.rivalryDelta}`);
  if (effects.dramaChance) parts.push(`Drama chance +${effects.dramaChance}%`);
  return parts.join(' · ') || 'No stat effects';
}

// ============================================================================
// Entry detail view
// ============================================================================

function EntryDetailView({ entry }: { entry: CollectionEntry }) {
  if (entry.type === 'INTERVIEW') {
    const template = INTERVIEW_TEMPLATES.find(t => t.id === entry.templateId);
    if (!template) return <p className="text-vct-gray/60 text-sm">Template not found.</p>;

    return (
      <div className="space-y-4">
        {/* Context badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded border bg-blue-500/20 text-blue-400 border-blue-500/30">
            {template.context.replace('_', '-')}
          </span>
          <span className="text-xs px-2 py-0.5 rounded border bg-blue-500/20 text-blue-400 border-blue-500/30">
            INTERVIEW
          </span>
          <span className="text-xs text-vct-gray/50 capitalize">{template.subjectType}</span>
        </div>

        {/* Reporter question */}
        <div className="bg-vct-dark/30 rounded-lg p-4 border border-vct-gray/10">
          <p className="text-sm text-vct-gray/80 italic leading-relaxed">
            &ldquo;{template.prompt}&rdquo;
          </p>
        </div>

        {/* Response options */}
        <div className="space-y-3">
          {template.options.map((option, i) => (
            <div key={i} className="bg-vct-dark/20 rounded-lg p-3 border border-vct-gray/10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs px-1.5 py-0.5 rounded border bg-vct-gray/10 text-vct-gray/70 border-vct-gray/20 font-mono">
                  {option.tone}
                </span>
                <span className="text-sm font-medium text-vct-light">{option.label}</span>
              </div>
              <p className="text-sm text-vct-gray/70 italic leading-relaxed mb-2">
                &ldquo;{option.quote}&rdquo;
              </p>
              <p className="text-xs text-vct-gray/50">{formatInterviewEffects(option.effects)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Drama template
  const template = DRAMA_EVENT_TEMPLATES.find(t => t.id === entry.templateId);
  if (!template) return <p className="text-vct-gray/60 text-sm">Template not found.</p>;

  const categoryConfig = CATEGORY_CONFIG[template.category];

  return (
    <div className="space-y-4">
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded border ${categoryConfig.badgeColor}`}>
          {categoryConfig.label.toUpperCase()}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded border ${typeBadgeColor(entry.type)}`}>
          {entry.type}
        </span>
      </div>

      {/* Title + description */}
      <div>
        <h3 className="text-base font-bold text-vct-light mb-1">{template.title}</h3>
        <div className="border-t border-vct-gray/20 pt-3">
          <p className="text-sm text-vct-gray/80 leading-relaxed">
            {template.description}
          </p>
          {template.description.includes('{') && (
            <p className="text-xs text-vct-gray/40 mt-1 italic">
              (player name substituted at runtime)
            </p>
          )}
        </div>
      </div>

      {/* Choices (major drama) */}
      {template.choices && template.choices.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-vct-gray/50">Choices</p>
          {template.choices.map((choice, i) => (
            <div key={i} className="bg-vct-dark/20 rounded-lg p-3 border border-vct-gray/10">
              <p className="text-sm font-medium text-vct-light mb-1">{choice.text}</p>
              {choice.outcomeText && (
                <p className="text-sm text-vct-gray/70 italic leading-relaxed mb-2">
                  {choice.outcomeText}
                </p>
              )}
              {choice.effects.length > 0 && (
                <p className="text-xs text-vct-gray/50">{formatDramaEffects(choice.effects)}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Minor drama — show auto effects */
        <div className="bg-vct-dark/20 rounded-lg p-3 border border-vct-gray/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-vct-gray/50 mb-1">Effects</p>
          <p className="text-sm text-vct-gray/70">
            {template.effects && template.effects.length > 0
              ? formatDramaEffects(template.effects)
              : 'No immediate stat effects'}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function NarrativeCollectionModal({ onClose }: NarrativeCollectionModalProps) {
  const seenTemplateIds = useGameStore((state) => state.seenTemplateIds);
  const currentDate = useGameStore((state) => state.calendar.currentDate);
  const resetCollection = useGameStore((state) => state.resetCollection);
  const [confirmReset, setConfirmReset] = useState(false);

  const [expandedCategories, setExpandedCategories] = useState<Set<DramaCategory>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<CollectionEntry | null>(null);

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
          {selectedEntry ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => setSelectedEntry(null)}
                className="flex items-center gap-1 text-sm text-vct-gray hover:text-vct-light transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-vct-light truncate">{selectedEntry.title}</h2>
                <span className={`text-xs px-1.5 py-0.5 rounded border ${typeBadgeColor(selectedEntry.type)}`}>
                  {selectedEntry.type}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-vct-light">Narrative Collection</h2>
              <p className="text-sm text-vct-gray/60 mt-0.5">{totalSeen} / {totalAvailable} collected</p>
            </div>
          )}
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {!selectedEntry && (
              confirmReset ? (
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
              )
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
        {selectedEntry ? (
          <div className="overflow-y-auto flex-1 p-4">
            <EntryDetailView entry={selectedEntry} />
          </div>
        ) : (
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
                        onClick={isSeen ? () => setSelectedEntry(entry) : undefined}
                        className={`flex items-start gap-3 p-2 rounded transition-colors ${
                          isSeen
                            ? 'bg-vct-dark/30 cursor-pointer hover:bg-vct-dark/60'
                            : 'bg-vct-dark/10 opacity-60'
                        }`}
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
        )}

      </div>
    </div>
  );
}
