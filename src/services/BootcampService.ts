import { useGameStore } from '../store';
import type { BootcampConfig } from '../store/slices/bootcampSlice';
import type { BootcampRegion } from '../types/activityPlan';
import type { CalendarEvent } from '../types/calendar';
import { downtimeService } from './DowntimeService';

// ============================================
// Region stat definitions
// ============================================

type StatKey = 'mechanics' | 'igl' | 'mental' | 'clutch' | 'vibes' | 'lurking' | 'entry' | 'support' | 'stamina';

const DAILY_STAT_GAINS: Record<BootcampRegion, Partial<Record<StatKey, number>>> = {
  APAC:     { mechanics: 0.3, clutch: 0.3, stamina: -0.2 },
  EU:       { igl: 0.3, mental: 0.3, stamina: -0.2 },
  Americas: { entry: 0.3, lurking: 0.2, stamina: -0.2 },
};

const COMPLETION_BONUS_STATS: Record<BootcampRegion, Partial<Record<StatKey, number>>> = {
  APAC:     { mechanics: 2, clutch: 2 },
  EU:       { igl: 2, mental: 2 },
  Americas: { entry: 2, lurking: 2 },
};

const TRAVEL_COST = 15_000;
const DAILY_CHEMISTRY_GAIN = 1;
const COMPLETION_CHEMISTRY_BONUS = 5;
const COMPLETION_MORALE_BONUS = 5;
const CANCELLATION_MORALE_PENALTY = -5;

// ============================================
// BootcampDayEventData — stored in CalendarEvent.data
// ============================================

export interface BootcampDayEventData {
  activityType: 'bootcamp_day';
  bootcampId: string;
  bootcampDay: number;  // 1-7
  region: BootcampRegion;
}

// ============================================
// Result types
// ============================================

export interface BootcampStartResult {
  success: boolean;
  bootcamp?: BootcampConfig;
  error?: string;
}

export interface BootcampDayResult {
  bootcampId: string;
  day: number;
  region: BootcampRegion;
  statGains: Partial<Record<StatKey, number>>;
  moraleChange: number;
  chemistryChange: number;
  completed: boolean;  // true when day 7 finishes
}

// ============================================
// BootcampService
// ============================================

export class BootcampService {
  /**
   * Start a 7-day regional bootcamp.
   * Creates 7 linked team_activity CalendarEvents and initialises the BootcampConfig.
   */
  startBootcamp(region: BootcampRegion, startDate: string): BootcampStartResult {
    const state = useGameStore.getState();
    const { playerTeamId } = state;

    if (!playerTeamId) {
      return { success: false, error: 'No player team' };
    }

    // Guard: only one bootcamp at a time
    if (state.activeBootcamp) {
      return { success: false, error: 'A bootcamp is already in progress' };
    }

    // Guard: must be in downtime
    if (!downtimeService.isTeamInDowntime(playerTeamId)) {
      return { success: false, error: 'Team is in an active tournament' };
    }

    // Guard: budget check
    const team = state.teams[playerTeamId];
    if (!team) return { success: false, error: 'Team not found' };

    if (team.finances.balance < TRAVEL_COST) {
      return {
        success: false,
        error: `Insufficient funds — bootcamp costs $${TRAVEL_COST.toLocaleString()}`,
      };
    }

    // Deduct travel cost
    state.updateTeamBalance(playerTeamId, -TRAVEL_COST);

    // Build 7 calendar events
    const bootcampId = crypto.randomUUID();
    const linkedEventIds: string[] = [];

    for (let day = 1; day <= 7; day++) {
      const eventDate = this.addDays(startDate, day - 1);
      const eventData: BootcampDayEventData = {
        activityType: 'bootcamp_day',
        bootcampId,
        bootcampDay: day,
        region,
      };

      const event: CalendarEvent = {
        id: crypto.randomUUID(),
        date: eventDate,
        type: 'team_activity',
        data: eventData,
        processed: false,
        required: false,
        lifecycleState: 'locked', // auto-resolves, no user config needed
      };

      state.addCalendarEvent(event);
      linkedEventIds.push(event.id);
    }

    const endDate = this.addDays(startDate, 6);

    const bootcamp: BootcampConfig = {
      id: bootcampId,
      region,
      startDate,
      endDate,
      currentDay: 1,
      status: 'active',
      linkedEventIds,
      cumulativeStatGains: {},
      dailyMoraleChanges: [],
    };

    state.setActiveBootcamp(bootcamp);

    return { success: true, bootcamp };
  }

  /**
   * Process a single bootcamp day during CalendarService.advanceDay().
   * Applies daily stat gains, morale, and chemistry. On day 7 applies completion bonuses.
   */
  processBootcampDay(event: CalendarEvent): BootcampDayResult | null {
    const data = event.data as BootcampDayEventData;
    const state = useGameStore.getState();
    const { playerTeamId, activeBootcamp } = state;

    if (!playerTeamId || !activeBootcamp || activeBootcamp.id !== data.bootcampId) {
      console.warn('BootcampService.processBootcampDay: no matching active bootcamp');
      return null;
    }

    const team = state.teams[playerTeamId];
    if (!team) return null;

    const region = data.region;
    const dailyGains = DAILY_STAT_GAINS[region];
    const moraleChange = this.randomMoraleChange();
    const isLastDay = data.bootcampDay === 7;

    // Apply daily stat gains to every active roster player
    for (const playerId of team.playerIds) {
      const player = state.players[playerId];
      if (!player) continue;

      const updatedStats = { ...player.stats };
      for (const [stat, gain] of Object.entries(dailyGains) as [StatKey, number][]) {
        const current = (updatedStats as any)[stat] ?? 0;
        (updatedStats as any)[stat] = Math.min(100, Math.max(0, current + gain));
      }

      const updatedMorale = Math.min(100, Math.max(0, player.morale + moraleChange));
      state.updatePlayer(playerId, { stats: updatedStats, morale: updatedMorale });
    }

    // Daily chemistry gain
    const newOverallChemistry = Math.min(
      100,
      (team.chemistry.overall ?? 0) + DAILY_CHEMISTRY_GAIN
    );
    state.updateTeamChemistry(playerTeamId, {
      ...team.chemistry,
      overall: newOverallChemistry,
    });

    // Accumulate cumulative stat gains (for display purposes)
    const updatedCumulative = { ...activeBootcamp.cumulativeStatGains };
    for (const [stat, gain] of Object.entries(dailyGains) as [StatKey, number][]) {
      updatedCumulative[stat] = (updatedCumulative[stat] ?? 0) + gain;
    }

    state.updateActiveBootcamp({
      currentDay: data.bootcampDay + 1,
      cumulativeStatGains: updatedCumulative,
      dailyMoraleChanges: [...activeBootcamp.dailyMoraleChanges, moraleChange],
    });

    // Completion bonuses on day 7
    if (isLastDay) {
      this.applyCompletionBonuses(region, playerTeamId, team.playerIds);
      state.finalizeBootcamp('completed');
    }

    return {
      bootcampId: activeBootcamp.id,
      day: data.bootcampDay,
      region,
      statGains: dailyGains,
      moraleChange,
      chemistryChange: DAILY_CHEMISTRY_GAIN,
      completed: isLastDay,
    };
  }

  /**
   * Cancel an active bootcamp.
   * Removes remaining unprocessed events, applies morale penalty, archives as cancelled.
   */
  cancelBootcamp(): { success: boolean; error?: string } {
    const state = useGameStore.getState();
    const { playerTeamId, activeBootcamp } = state;

    if (!activeBootcamp) {
      return { success: false, error: 'No active bootcamp' };
    }
    if (!playerTeamId) {
      return { success: false, error: 'No player team' };
    }

    // Remove future (unprocessed) bootcamp day events
    for (const eventId of activeBootcamp.linkedEventIds) {
      const event = state.calendar.scheduledEvents.find(e => e.id === eventId);
      if (event && !event.processed) {
        state.removeCalendarEvent(eventId);
      }
    }

    // Morale penalty
    const team = state.teams[playerTeamId];
    if (team) {
      for (const playerId of team.playerIds) {
        const player = state.players[playerId];
        if (!player) continue;
        const newMorale = Math.max(0, player.morale + CANCELLATION_MORALE_PENALTY);
        state.updatePlayer(playerId, { morale: newMorale });
      }
    }

    state.finalizeBootcamp('cancelled');
    return { success: true };
  }

  // ============================================
  // Private helpers
  // ============================================

  private applyCompletionBonuses(
    region: BootcampRegion,
    teamId: string,
    playerIds: string[]
  ): void {
    const state = useGameStore.getState();
    const bonusStats = COMPLETION_BONUS_STATS[region];

    for (const playerId of playerIds) {
      const player = state.players[playerId];
      if (!player) continue;

      const updatedStats = { ...player.stats };
      for (const [stat, bonus] of Object.entries(bonusStats) as [StatKey, number][]) {
        const current = (updatedStats as any)[stat] ?? 0;
        (updatedStats as any)[stat] = Math.min(100, current + bonus);
      }

      const newMorale = Math.min(100, player.morale + COMPLETION_MORALE_BONUS);
      state.updatePlayer(playerId, { stats: updatedStats, morale: newMorale });
    }

    // Completion chemistry bonus
    const team = state.teams[teamId];
    if (team) {
      const newChemistry = Math.min(
        100,
        (team.chemistry.overall ?? 0) + COMPLETION_CHEMISTRY_BONUS
      );
      state.updateTeamChemistry(teamId, { ...team.chemistry, overall: newChemistry });
    }
  }

  private randomMoraleChange(): number {
    // +1 to +3 random daily morale boost (excitement of travel / new environment)
    return Math.floor(Math.random() * 3) + 1;
  }

  private addDays(isoDate: string, days: number): string {
    const date = new Date(isoDate);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }
}

export const bootcampService = new BootcampService();
