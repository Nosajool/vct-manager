// matchRoundName - Utility for deriving human-readable round names from a matchId

import { useGameStore } from '../store';

/**
 * Determine a human-readable round name for a given matchId by scanning
 * the tournament bracket that contains it.
 */
export function getMatchRoundName(matchId: string): string | undefined {
  const state = useGameStore.getState();
  const match = state.matches[matchId];
  if (!match?.tournamentId) return undefined;

  const tournament = state.tournaments[match.tournamentId];
  if (!tournament) return undefined;

  const bracket = tournament.bracket;

  // Check grand final first
  if (bracket.grandfinal?.matchId === matchId) {
    return 'Grand Final';
  }

  const roundNames: Record<string, Record<number, string>> = {
    upper: { 1: 'Upper R1', 2: 'Upper R2', 3: 'Upper Final', 4: 'Upper Final' },
    middle: { 1: 'Beta R1', 2: 'Beta R2', 3: 'Beta Final' },
    lower: { 1: 'Lower R1', 2: 'Lower R2', 3: 'Lower R3', 4: 'Lower Final' },
  };

  const bracketSections: Array<{ rounds: typeof bracket.upper; type: string }> = [
    { rounds: bracket.upper, type: 'upper' },
  ];
  if (bracket.middle) bracketSections.push({ rounds: bracket.middle, type: 'middle' });
  if (bracket.lower) bracketSections.push({ rounds: bracket.lower, type: 'lower' });

  for (const { rounds, type } of bracketSections) {
    for (const round of rounds) {
      for (const m of round.matches) {
        if (m.matchId === matchId) {
          const rn = round.roundNumber;
          return (
            roundNames[type]?.[rn] ||
            `${type.charAt(0).toUpperCase() + type.slice(1)} R${rn}`
          );
        }
      }
    }
  }

  return undefined;
}
