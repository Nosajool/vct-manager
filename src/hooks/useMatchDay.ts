// useMatchDay Hook - Centralized match day detection
//
// Provides information about today's match (if any) for the player's team.
// Used by TimeBar and TodayPage to show match day context.

import { useGameStore } from '../store';
import type { Match, Team, Tournament, BracketMatch, CalendarEvent, MatchEventData } from '../types';

export interface MatchDayInfo {
  /** Whether the player's team has a match scheduled today */
  isMatchDay: boolean;
  /** The calendar event for today's match (if any) */
  matchEvent: CalendarEvent | null;
  /** The Match entity (if exists in store) */
  todaysMatch: Match | null;
  /** The opponent team */
  opponent: Team | null;
  /** The tournament this match is part of */
  tournament: Tournament | null;
  /** The bracket match info (for tournament matches) */
  bracketMatch: BracketMatch | null;
  /** Display text for opponent */
  opponentName: string;
  /** Display text for tournament context */
  tournamentContext: string;
}

/**
 * Hook to get information about today's match for the player's team.
 * Centralizes the match day detection logic previously in TimeBar.
 */
export function useMatchDay(): MatchDayInfo {
  const getTodaysActivities = useGameStore((state) => state.getTodaysActivities);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const matches = useGameStore((state) => state.matches);
  const tournaments = useGameStore((state) => state.tournaments);

  // Default return value for no match
  const noMatch: MatchDayInfo = {
    isMatchDay: false,
    matchEvent: null,
    todaysMatch: null,
    opponent: null,
    tournament: null,
    bracketMatch: null,
    opponentName: '',
    tournamentContext: '',
  };

  if (!playerTeamId) {
    return noMatch;
  }

  // Find today's match event for the player's team
  const todaysActivities = getTodaysActivities();
  const playerMatchEvent = todaysActivities.find((e) => {
    if (e.type !== 'match' || e.processed) return false;
    const data = e.data as MatchEventData;
    return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId;
  });

  if (!playerMatchEvent) {
    return noMatch;
  }

  const eventData = playerMatchEvent.data as MatchEventData;

  // Get opponent
  const opponentId = eventData.homeTeamId === playerTeamId
    ? eventData.awayTeamId
    : eventData.homeTeamId;
  const opponent = teams[opponentId] || null;
  const opponentName = opponent?.name || eventData.awayTeamName || eventData.homeTeamName || 'TBD';

  // Get match entity (may not exist yet for bracket matches)
  const todaysMatch = matches[eventData.matchId] || null;

  // Get tournament info
  const tournament = eventData.tournamentId
    ? tournaments[eventData.tournamentId] || null
    : null;

  // Get bracket match info
  let bracketMatch: BracketMatch | null = null;
  if (tournament?.bracket) {
    // Search for the bracket match in upper, middle, lower brackets and grand final
    const findInRounds = (rounds: { matches: BracketMatch[] }[]): BracketMatch | null => {
      for (const round of rounds) {
        const match = round.matches.find(m => m.matchId === eventData.matchId);
        if (match) return match;
      }
      return null;
    };

    bracketMatch = findInRounds(tournament.bracket.upper || [])
      || findInRounds(tournament.bracket.middle || [])
      || findInRounds(tournament.bracket.lower || [])
      || (tournament.bracket.grandfinal?.matchId === eventData.matchId && tournament.bracket.grandfinal
          ? tournament.bracket.grandfinal
          : null);
  }

  // Build tournament context string
  let tournamentContext = '';
  if (tournament) {
    tournamentContext = tournament.name;

    // Add stage info for multi-stage tournaments
    if ('currentStage' in tournament) {
      const stage = (tournament as { currentStage?: string }).currentStage;
      if (stage === 'swiss') {
        tournamentContext += ' (Swiss Stage)';
      } else if (stage === 'league') {
        tournamentContext += ' (League Stage)';
      } else if (stage === 'playoff') {
        tournamentContext += ' (Playoffs)';
      }
    }

    // Add bracket position for playoff matches
    if (bracketMatch) {
      if (tournament.bracket?.grandfinal?.matchId === eventData.matchId) {
        tournamentContext += ' - Grand Final';
      }
    }
  }

  return {
    isMatchDay: true,
    matchEvent: playerMatchEvent,
    todaysMatch,
    opponent,
    tournament,
    bracketMatch,
    opponentName,
    tournamentContext,
  };
}
