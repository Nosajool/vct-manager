// Inline types (previously in ../types which was deleted)
interface DayContext {
  date: string;
  playerTeamId: string;
  getEventsBetweenDates: (start: string, end: string) => import('../../../types/calendar').CalendarEvent[];
  tournaments: Record<string, import('../../../types/competition').Tournament>;
}
interface RuleResult {
  type: 'allow' | 'block';
  blockedTypes?: string[];
  reason?: string;
}
interface SchedulingRule {
  id: string;
  name: string;
  priority: number;
  evaluate(context: DayContext): RuleResult;
}
import type { CalendarEvent } from '../../../types/calendar';
import type { Tournament } from '../../../types/competition';
import { isTeamMatch, getAllBracketMatches } from '../utils/matchEventUtils';

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function toDateOnly(isoDate: string): string {
  return isoDate.slice(0, 10);
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * BootcampWindowRule - Prevents scheduling a regional_bootcamp if any match
 * falls within the 7-day bootcamp window.
 *
 * Checks two sources:
 * 1. Calendar events already scheduled (match + placeholder_match)
 * 2. Bracket matches with pre-assigned scheduledDates not yet on the calendar
 *    (tournaments whose bracket was scheduled but haven't started yet)
 *
 * Priority: 90 (below DowntimeBlocker at 95)
 */
export class BootcampWindowRule implements SchedulingRule {
  id = 'bootcamp_window_rule';
  name = 'Bootcamp Window Rule';
  priority = 90;

  evaluate(context: DayContext): RuleResult {
    const { date, playerTeamId, getEventsBetweenDates, tournaments } = context;

    const windowEnd = addDays(date, 6); // 7-day window inclusive
    const conflicts = this.findMatchConflicts(
      playerTeamId,
      date,
      windowEnd,
      getEventsBetweenDates,
      tournaments
    );

    if (conflicts.length > 0) {
      return {
        type: 'block',
        blockedTypes: ['regional_bootcamp'],
        reason: `Match scheduled on ${formatDate(conflicts[0])} — bootcamp would conflict`,
      };
    }

    return { type: 'allow' };
  }

  private findMatchConflicts(
    teamId: string,
    windowStart: string,
    windowEnd: string,
    getEventsBetweenDates: (start: string, end: string) => CalendarEvent[],
    tournaments: Record<string, Tournament>
  ): string[] {
    const windowStartDate = toDateOnly(windowStart);
    const windowEndDate = toDateOnly(windowEnd);

    // Check 1: calendar events already scheduled (match + placeholder_match)
    const calendarConflicts = getEventsBetweenDates(windowStart, windowEnd)
      .filter(e => isTeamMatch(e, teamId))
      .map(e => toDateOnly(e.date));

    // Check 2: bracket matches pre-assigned a scheduledDate by GlobalTournamentScheduler
    // but not yet added as calendar events (tournament hasn't started yet)
    const bracketConflicts = Object.values(tournaments)
      .filter(t => t.status !== 'completed')
      .flatMap(t => getAllBracketMatches(t.bracket))
      .filter(m => {
        if (!m.scheduledDate) return false;
        const d = toDateOnly(m.scheduledDate);
        return (
          d >= windowStartDate &&
          d <= windowEndDate &&
          (m.teamAId === teamId || m.teamBId === teamId)
        );
      })
      .map(m => toDateOnly(m.scheduledDate!));

    // Deduplicate and sort ascending so we report the soonest conflict
    return [...new Set([...calendarConflicts, ...bracketConflicts])].sort();
  }
}
