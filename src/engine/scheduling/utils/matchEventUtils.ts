import type { CalendarEvent } from '../../../types/calendar';
import type { BracketMatch, BracketStructure } from '../../../types/competition';

/**
 * Returns true if the calendar event is a match (confirmed or placeholder) involving teamId.
 * Used by both MatchDayBlocker and BootcampWindowRule to avoid duplicating match-detection logic.
 */
export function isTeamMatch(event: CalendarEvent, teamId: string): boolean {
  if (event.type === 'match') {
    const data = event.data as { homeTeamId: string; awayTeamId: string };
    return data.homeTeamId === teamId || data.awayTeamId === teamId;
  }

  if (event.type === 'placeholder_match') {
    const data = event.data as { resolvedTeamAId?: string; resolvedTeamBId?: string };
    return data.resolvedTeamAId === teamId || data.resolvedTeamBId === teamId;
  }

  return false;
}

/**
 * Flattens all BracketMatch entries from a BracketStructure into a single array.
 * Covers upper, middle (triple-elim), lower (double/triple-elim), and grand final.
 */
export function getAllBracketMatches(bracket: BracketStructure): BracketMatch[] {
  const matches: BracketMatch[] = [];

  for (const round of bracket.upper) {
    matches.push(...round.matches);
  }

  if (bracket.middle) {
    for (const round of bracket.middle) {
      matches.push(...round.matches);
    }
  }

  if (bracket.lower) {
    for (const round of bracket.lower) {
      matches.push(...round.matches);
    }
  }

  if (bracket.grandfinal) {
    matches.push(bracket.grandfinal);
  }

  return matches;
}
