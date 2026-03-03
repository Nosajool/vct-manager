// MetaShiftEngine - Pure engine for computing meta preferences from patches
// No store access — patch calculation stays testable

import type { MetaPatch } from '../../types/meta';
import type { CalendarEvent, SeasonPhase } from '../../types/calendar';

// Phase day offsets from season start (mirrors EventScheduler.SEASON_STRUCTURE)
const PHASE_START_OFFSETS: Record<SeasonPhase, number> = {
  kickoff: 0,
  masters1: 35,
  stage1: 56,
  stage1_playoffs: 98,
  masters2: 119,
  stage2: 140,
  stage2_playoffs: 182,
  champions: 217,
  offseason: 245,
};

// Base map-agent preferences (mirrored from CompositionEngine for patch computation)
const BASE_MAP_PREFERENCES: Record<string, string[]> = {
  Ascent:   ['Sova', 'KAY/O', 'Killjoy', 'Jett', 'Omen'],
  Bind:     ['Raze', 'Skye', 'Brimstone', 'Viper', 'Chamber'],
  Haven:    ['Breach', 'Sova', 'Omen', 'Killjoy', 'Jett'],
  Split:    ['Raze', 'Sage', 'Astra', 'Cypher', 'Jett'],
  Icebox:   ['Sova', 'Viper', 'Sage', 'Jett', 'Chamber'],
  Breeze:   ['Sova', 'Viper', 'Chamber', 'Jett', 'KAY/O'],
  Fracture: ['Breach', 'Fade', 'Brimstone', 'Cypher', 'Neon'],
  Pearl:    ['Fade', 'Astra', 'Killjoy', 'Jett', 'Harbor'],
  Lotus:    ['Fade', 'Omen', 'Killjoy', 'Raze', 'Harbor'],
  Sunset:   ['Omen', 'Cypher', 'Breach', 'Raze', 'Neon'],
  Abyss:    ['Omen', 'Sage', 'Jett', 'Sova', 'Killjoy'],
};

export class MetaShiftEngine {
  /**
   * Apply a patch's changes to the base map preferences.
   * Returns the full map-agent preferences record with patch modifications applied.
   * If activePatch is null, returns the base preferences unchanged.
   */
  getEffectivePreferences(activePatch: MetaPatch | null): Record<string, string[]> {
    if (!activePatch) {
      return { ...BASE_MAP_PREFERENCES };
    }

    // Deep-copy the base preferences
    const result: Record<string, string[]> = {};
    for (const [map, agents] of Object.entries(BASE_MAP_PREFERENCES)) {
      result[map] = [...agents];
    }

    // Apply each change from the patch
    for (const change of activePatch.changes) {
      const list = result[change.map];
      if (!list) continue;

      // Remove agent from current position if present
      const currentIdx = list.indexOf(change.agent);
      if (currentIdx !== -1) {
        list.splice(currentIdx, 1);
      }

      // Insert at target position (clamped to list length)
      const insertAt = Math.min(change.toPosition, list.length);
      list.splice(insertAt, 0, change.agent);
    }

    return result;
  }

  /**
   * Generate patch_notes CalendarEvents for each patch, scheduled at the
   * start of their corresponding phase. Also generates patch_preview events
   * PREVIEW_DAYS_BEFORE days earlier (skipped if the computed date is on or
   * before the season start date, e.g. the kickoff patch).
   */
  schedulePatchEvents(
    seasonStartDate: string,
    patches: MetaPatch[]
  ): CalendarEvent[] {
    const PREVIEW_DAYS_BEFORE = 5;
    const seasonStart = new Date(seasonStartDate);
    seasonStart.setHours(0, 0, 0, 0);

    const events: CalendarEvent[] = [];

    for (const patch of patches) {
      const phaseOffset = PHASE_START_OFFSETS[patch.scheduledPhase] ?? 0;
      const patchDate = this.addDays(seasonStartDate, phaseOffset + 1); // day 1 of phase

      events.push({
        id: `patch-notes-${patch.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        date: patchDate,
        type: 'patch_notes' as const,
        processed: false,
        required: false,
        data: {
          patchId: patch.id,
          version: patch.version,
          title: patch.title,
        },
      });

      const previewDate = this.addDays(seasonStartDate, phaseOffset + 1 - PREVIEW_DAYS_BEFORE);
      const previewDay = new Date(previewDate);
      previewDay.setHours(0, 0, 0, 0);

      if (previewDay > seasonStart) {
        events.push({
          id: `patch-preview-${patch.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          date: previewDate,
          type: 'patch_preview' as const,
          processed: false,
          required: false,
          data: {
            patchId: patch.id,
            version: patch.version,
            title: patch.title,
          },
        });
      }
    }

    return events;
  }

  private addDays(isoDate: string, days: number): string {
    const date = new Date(isoDate);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }
}

export const metaShiftEngine = new MetaShiftEngine();
