// MinorDramaEventModal - Compact centered modal for minor drama events
//
// Shown in the regular modal stack (not as a top-right toast) after post-simulation modals.
// Informational only — effects are already applied, no choices required.

import type { DramaCategory, DramaEventInstance } from '../../types/drama';
import { useGameStore } from '../../store';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl } from '../../utils/imageAssets';
import { NewBadge } from '../narrative/NewBadge';

interface MinorDramaEventModalProps {
  event: DramaEventInstance & { title: string; narrative: string };
  onNext: () => void;
  onSkipAll: () => void;
  queuePosition: { current: number; total: number };
}

const CATEGORY_METADATA: Record<DramaCategory, { label: string; accent: string; icon: string }> = {
  player_ego:          { label: 'Player Update',      accent: 'bg-orange-500', icon: '👤' },
  team_synergy:        { label: 'Team Update',        accent: 'bg-cyan-500',   icon: '🤝' },
  external_pressure:   { label: 'External',           accent: 'bg-red-500',    icon: '⚠️' },
  practice_burnout:    { label: 'Staff Report',       accent: 'bg-yellow-500', icon: '📋' },
  breakthrough:        { label: 'Breakthrough!',      accent: 'bg-green-500',  icon: '⭐' },
  meta_rumors:         { label: 'Intel Report',       accent: 'bg-purple-500', icon: '📰' },
  cove_incident:       { label: 'Cove Incident',      accent: 'bg-cyan-400',   icon: '🌊' },
  visa_arc:            { label: 'Visa Crisis',        accent: 'bg-blue-500',   icon: '🛂' },
  coaching_overhaul:   { label: 'Coaching Overhaul',  accent: 'bg-amber-500',  icon: '📋' },
  igl_crisis:          { label: 'IGL Crisis',         accent: 'bg-red-600',    icon: '🎯' },
  scrim_sharing:       { label: 'Scrim Scandal',      accent: 'bg-cyan-600',   icon: '🎬' },
  org_culture:         { label: 'Org Culture',        accent: 'bg-yellow-600', icon: '🍗' },
  tournament_drama:    { label: 'Tournament',         accent: 'bg-rose-500',   icon: '🏆' },
  map_pool:            { label: 'Map Pool',           accent: 'bg-teal-500',   icon: '🗺️' },
  financial_stress:    { label: 'Financial Stress',   accent: 'bg-amber-600',  icon: '💸' },
  iconic_moments:      { label: 'Iconic Moment',      accent: 'bg-violet-500', icon: '⚡' },
  coaching_beef:       { label: 'Coaching Beef',      accent: 'bg-orange-600', icon: '🔥' },
  free_agent_pursuit:  { label: 'FA Pursuit',         accent: 'bg-cyan-500',   icon: '🎯' },
  player_conflict:     { label: 'Team Conflict',      accent: 'bg-purple-500', icon: '⚡' },
};

const DRAMA_EFFECT_DISPLAY: Record<string, { icon: string; label: string }> = {
  morale:             { icon: '💙', label: 'Morale' },
  chemistry:          { icon: '🤝', label: 'Chemistry' },
  form:               { icon: '🎯', label: 'Form' },
  budget:             { icon: '💰', label: 'Budget' },
  player_morale:      { icon: '💙', label: 'Morale' },
  player_form:        { icon: '🎯', label: 'Form' },
  team_chemistry:     { icon: '🤝', label: 'Chemistry' },
  team_budget:        { icon: '💰', label: 'Budget' },
  team_hype:          { icon: '🔥', label: 'Hype' },
  team_sponsor_trust: { icon: '💰', label: 'Sponsor' },
};

const SKIP_TARGETS = new Set([
  'set_flag', 'clear_flag', 'add_cooldown',
  'trigger_event', 'escalate_event',
  'move_to_reserve', 'move_to_active', 'release_player',
  'assign_igl', 'free_agent_interest',
]);

function formatEffectSummary(effects: DramaEventInstance['appliedEffects']): string {
  const parts: string[] = [];
  for (const effect of effects) {
    if (!effect.delta || SKIP_TARGETS.has(effect.target)) continue;
    const key = effect.stat ?? effect.target;
    const meta = DRAMA_EFFECT_DISPLAY[key] ?? { icon: '📊', label: key.replace(/_/g, ' ') };
    const sign = effect.delta > 0 ? '+' : '';
    parts.push(`${meta.icon} ${sign}${effect.delta} ${meta.label}`);
  }
  return parts.join('  ·  ') || 'No immediate effects';
}

function getEffectColor(effects: DramaEventInstance['appliedEffects']): string {
  const totalDelta = effects.reduce((sum, e) => sum + (e.delta || 0), 0);
  if (totalDelta > 0) return 'text-green-400';
  if (totalDelta < 0) return 'text-red-400';
  return 'text-vct-gray';
}

export function MinorDramaEventModal({
  event,
  onNext,
  onSkipAll,
  queuePosition,
}: MinorDramaEventModalProps) {
  const players = useGameStore((state) => state.players);
  const affectedPlayer = event.affectedPlayerIds?.[0]
    ? players[event.affectedPlayerIds[0]]
    : null;
  const playerImageUrl = affectedPlayer ? getPlayerImageUrl(affectedPlayer.name) : null;

  const metadata = CATEGORY_METADATA[event.category];
  const effectSummary = formatEffectSummary(event.appliedEffects);
  const effectColor = getEffectColor(event.appliedEffects);
  const { current, total } = queuePosition;
  const isLast = current === total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg max-w-[480px] w-full mx-4 overflow-hidden shadow-2xl">
        {/* Category accent bar */}
        <div className={`h-1 ${metadata.accent}`} />

        {/* Header: category label + queue position */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{metadata.icon}</span>
            <span className="text-xs font-semibold text-vct-gray uppercase tracking-wider">
              {metadata.label}
            </span>
          </div>
          {total > 1 && (
            <span className="text-xs text-vct-gray/50">{current} of {total}</span>
          )}
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {/* Player info row */}
          {affectedPlayer && (
            <div className="flex items-center gap-3 mb-3">
              <GameImage
                src={playerImageUrl!}
                alt={affectedPlayer.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                fallbackClassName="w-8 h-8 rounded-full flex-shrink-0"
              />
              <span className="text-sm text-vct-gray">{affectedPlayer.name}</span>
            </div>
          )}

          {/* Title */}
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-xl font-bold text-vct-light">{event.title}</h2>
            {event.isNew && <NewBadge />}
          </div>

          {/* Narrative */}
          <p className="text-sm text-vct-gray leading-relaxed mb-4">
            {event.narrative}
          </p>

          {/* Effect summary */}
          <div className={`text-sm font-medium ${effectColor} mb-6`}>
            {effectSummary}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            {total > 1 ? (
              <button
                onClick={onSkipAll}
                className="text-sm text-vct-gray/50 hover:text-vct-gray transition-colors"
              >
                Skip All ({total - current} more)
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={onNext}
              className="px-5 py-2 bg-vct-red hover:bg-vct-red/80 text-white text-sm font-semibold rounded transition-colors"
            >
              {isLast ? 'Done' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
