// Debug Section: Conditions Inspector
// Shows per-template condition evaluation results using live snapshot

import { useMemo, useState } from 'react';
import { useGameStore } from '../../store';
import { evaluateCondition } from '../../engine/drama';
import { DRAMA_EVENT_TEMPLATES } from '../../data/drama';
import { dramaService } from '../../services/DramaService';
import type { DramaCategory, DramaGameStateSnapshot } from '../../types/drama';

const CATEGORY_COLORS: Record<DramaCategory, string> = {
  player_ego: 'bg-red-900/40 text-red-300',
  team_synergy: 'bg-blue-900/40 text-blue-300',
  external_pressure: 'bg-orange-900/40 text-orange-300',
  practice_burnout: 'bg-yellow-900/40 text-yellow-300',
  breakthrough: 'bg-green-900/40 text-green-300',
  meta_rumors: 'bg-purple-900/40 text-purple-300',
  visa_arc: 'bg-cyan-900/40 text-cyan-300',
  coaching_overhaul: 'bg-amber-900/40 text-amber-300',
};

const CATEGORIES = Object.keys(CATEGORY_COLORS) as DramaCategory[];

export function DebugSection_Conditions() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [anyPassOnly, setAnyPassOnly] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Subscribe to all drama-relevant state slices so useMemo reacts to changes
  const activeEvents = useGameStore((s) => s.activeEvents);
  const activeFlags = useGameStore((s) => s.activeFlags);
  const cooldowns = useGameStore((s) => s.cooldowns);
  const calendar = useGameStore((s) => s.calendar);
  const players = useGameStore((s) => s.players);
  const teams = useGameStore((s) => s.teams);

  // Build snapshot using dramaService (pure read, no mutation)
  const snapshot = useMemo((): DramaGameStateSnapshot | null => {
    try {
      return dramaService.buildSnapshot();
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEvents, activeFlags, cooldowns, calendar, players, teams]);

  const results = useMemo(() => {
    if (!snapshot) return [];
    return DRAMA_EVENT_TEMPLATES.map((template) => {
      const cooldownExpiry = snapshot.dramaState.cooldowns[template.category] ?? null;
      const isOnCooldown = cooldownExpiry
        ? new Date(snapshot.currentDate) < new Date(cooldownExpiry)
        : false;
      const cooldownDaysRemaining = isOnCooldown && cooldownExpiry
        ? Math.ceil(
            (new Date(cooldownExpiry).getTime() - new Date(snapshot.currentDate).getTime()) /
            (1000 * 60 * 60 * 24)
          )
        : 0;
      const condResults = template.conditions.map((cond) => ({
        cond,
        pass: cond.type === 'random_chance' ? null : evaluateCondition(cond, snapshot),
      }));
      const allPass = template.conditions.every((c) =>
        c.type === 'random_chance' ? true : evaluateCondition(c, snapshot)
      );
      const anyPass = condResults.some((r) => r.pass === true);
      return { template, isOnCooldown, cooldownDaysRemaining, conditions: condResults, allPass, anyPass };
    });
  }, [snapshot]);

  const filtered = results.filter((r) => {
    if (categoryFilter !== 'all' && r.template.category !== categoryFilter) return false;
    if (eligibleOnly && !r.allPass) return false;
    if (anyPassOnly && !r.anyPass) return false;
    if (searchText && !r.template.id.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  if (!snapshot) {
    return (
      <div className="text-vct-gray text-sm italic">
        Snapshot unavailable — start a game first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-vct-darker border border-vct-gray/30 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-vct-gray/60"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search template ID..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="bg-vct-darker border border-vct-gray/30 rounded px-3 py-1.5 text-sm text-white w-52 focus:outline-none focus:border-vct-gray/60"
        />
        <label className="flex items-center gap-1.5 text-sm text-vct-gray cursor-pointer select-none">
          <input
            type="checkbox"
            checked={eligibleOnly}
            onChange={(e) => setEligibleOnly(e.target.checked)}
            className="accent-green-500"
          />
          Eligible only
        </label>
        <label className="flex items-center gap-1.5 text-sm text-vct-gray cursor-pointer select-none">
          <input
            type="checkbox"
            checked={anyPassOnly}
            onChange={(e) => setAnyPassOnly(e.target.checked)}
            className="accent-yellow-500"
          />
          Any condition passing
        </label>
        <span className="text-vct-gray/60 text-xs">{filtered.length} / {results.length} templates</span>
      </div>

      {/* Template cards */}
      <div className="space-y-2">
        {filtered.map(({ template, isOnCooldown, cooldownDaysRemaining, conditions, allPass }) => {
          const borderColor = isOnCooldown
            ? 'border-l-orange-500'
            : allPass
              ? 'border-l-green-500'
              : 'border-l-red-500';

          const statusLabel = isOnCooldown
            ? <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-900/50 text-orange-300">COOLDOWN {cooldownDaysRemaining}d</span>
            : allPass
              ? <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-900/50 text-green-300">ELIGIBLE</span>
              : <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/50 text-red-300">BLOCKED</span>;

          const catColor = CATEGORY_COLORS[template.category] ?? 'bg-vct-gray/20 text-vct-gray';

          return (
            <div
              key={template.id}
              className={`border border-vct-gray/20 border-l-4 ${borderColor} rounded bg-vct-darker/60 overflow-hidden`}
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-vct-gray/10">
                <span className="font-mono text-sm text-white">{template.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${catColor}`}>{template.category}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-vct-gray/20 text-vct-gray">{template.severity}</span>
                <span className="text-[10px] text-vct-gray/60">prob: {template.probability}%</span>
                <div className="ml-auto">{statusLabel}</div>
              </div>

              {/* Conditions */}
              <div className="px-3 py-2 space-y-0.5">
                {conditions.map(({ cond, pass }, i) => {
                  const icon = pass === null ? '~' : pass ? '✓' : '✗';
                  const iconColor = pass === null ? 'text-yellow-400' : pass ? 'text-green-400' : 'text-red-400';
                  const condStr = Object.entries(cond)
                    .filter(([k]) => k !== 'type')
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join('  ');
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs font-mono">
                      <span className={`${iconColor} w-3 flex-shrink-0`}>{icon}</span>
                      <span className="text-blue-300">{cond.type}</span>
                      {condStr && <span className="text-vct-gray/70">{condStr}</span>}
                      {pass === null && <span className="text-yellow-400/60 ml-1">→ N/A (random)</span>}
                    </div>
                  );
                })}
                {conditions.length === 0 && (
                  <div className="text-xs text-vct-gray/40 italic">No conditions.</div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-vct-gray text-sm italic">No templates match current filters.</div>
        )}
      </div>
    </div>
  );
}
