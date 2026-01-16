// BracketView Component - Visual bracket display
//
// Note: Match simulation is handled by the global TimeBar.
// This component is view-only.

import type { BracketStructure, BracketRound } from '../../types';
import { BracketMatch } from './BracketMatch';

interface BracketViewProps {
  bracket: BracketStructure;
}

export function BracketView({ bracket }: BracketViewProps) {
  const hasMiddleBracket = bracket.middle && bracket.middle.length > 0;
  const hasLowerBracket = bracket.lower && bracket.lower.length > 0;
  const hasGrandFinal = !!bracket.grandfinal;

  const RoundColumn = ({
    round,
    label,
  }: {
    round: BracketRound;
    label: string;
  }) => (
    <div className="flex flex-col gap-4">
      <div className="text-xs text-vct-gray text-center font-medium uppercase tracking-wide">
        {label}
      </div>
      <div className="flex flex-col gap-4 justify-around flex-1">
        {round.matches.map((match) => (
          <BracketMatch key={match.matchId} match={match} compact />
        ))}
      </div>
    </div>
  );

  const getRoundLabel = (round: BracketRound, totalRounds: number, bracketType: 'upper' | 'middle' | 'lower'): string => {
    // Handle special round IDs
    if (round.roundId === 'upper-final') return 'Upper Final';
    if (round.roundId === 'middle-final') return 'Middle Final';
    if (round.roundId === 'lower-final') return 'Lower Final';

    const roundsFromEnd = totalRounds - round.roundNumber;

    if (bracketType === 'upper') {
      if (roundsFromEnd === 0) return 'Upper Final';
      if (roundsFromEnd === 1) return 'Upper R3';
      return `Upper R${round.roundNumber}`;
    }

    if (bracketType === 'middle') {
      if (round.roundId.includes('final')) return 'Middle Final';
      return `Middle R${round.roundNumber}`;
    }

    if (bracketType === 'lower') {
      if (round.roundId.includes('final')) return 'Lower Final';
      return `Lower R${round.roundNumber}`;
    }

    return `Round ${round.roundNumber}`;
  };

  const getBracketLabel = (bracketType: 'upper' | 'middle' | 'lower'): string => {
    if (hasMiddleBracket) {
      // Triple elimination naming
      if (bracketType === 'upper') return 'Alpha Bracket (0 Losses)';
      if (bracketType === 'middle') return 'Beta Bracket (1 Loss)';
      if (bracketType === 'lower') return 'Omega Bracket (2 Losses)';
    } else if (hasLowerBracket) {
      // Double elimination naming
      if (bracketType === 'upper') return 'Upper Bracket';
      if (bracketType === 'lower') return 'Lower Bracket';
    }
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Upper Bracket (Alpha) */}
      <div>
        {(hasLowerBracket || hasMiddleBracket) && (
          <h3 className="text-sm font-medium text-white mb-3">
            {getBracketLabel('upper')}
          </h3>
        )}
        <div className="flex gap-8 overflow-x-auto pb-4">
          {bracket.upper.map((round) => (
            <RoundColumn
              key={round.roundId}
              round={round}
              label={getRoundLabel(round, bracket.upper.length, 'upper')}
            />
          ))}
        </div>
      </div>

      {/* Middle Bracket (Beta) - Triple Elimination */}
      {hasMiddleBracket && (
        <div>
          <h3 className="text-sm font-medium text-yellow-400 mb-3">
            {getBracketLabel('middle')}
          </h3>
          <div className="flex gap-8 overflow-x-auto pb-4">
            {bracket.middle!.map((round) => (
              <RoundColumn
                key={round.roundId}
                round={round}
                label={getRoundLabel(round, bracket.middle!.length, 'middle')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lower Bracket (Omega) */}
      {hasLowerBracket && (
        <div>
          <h3 className="text-sm font-medium text-orange-400 mb-3">
            {getBracketLabel('lower')}
          </h3>
          <div className="flex gap-8 overflow-x-auto pb-4">
            {bracket.lower!.map((round) => (
              <RoundColumn
                key={round.roundId}
                round={round}
                label={getRoundLabel(round, bracket.lower!.length, 'lower')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grand Final */}
      {hasGrandFinal && bracket.grandfinal && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Grand Final</h3>
          <div className="flex justify-center">
            <BracketMatch match={bracket.grandfinal} />
          </div>
        </div>
      )}
    </div>
  );
}

// Compact list view for smaller spaces
interface BracketListViewProps {
  bracket: BracketStructure;
  showCompleted?: boolean;
}

export function BracketListView({
  bracket,
  showCompleted = true,
}: BracketListViewProps) {
  // Collect all matches
  const allMatches = [
    ...bracket.upper.flatMap((r) => r.matches),
    ...(bracket.lower?.flatMap((r) => r.matches) || []),
    ...(bracket.middle?.flatMap((r) => r.matches) || []),
    ...(bracket.grandfinal ? [bracket.grandfinal] : []),
  ];

  // Group by status
  const readyMatches = allMatches.filter((m) => m.status === 'ready');
  const pendingMatches = allMatches.filter((m) => m.status === 'pending');
  const completedMatches = allMatches.filter((m) => m.status === 'completed');

  return (
    <div className="space-y-4">
      {/* Ready Matches */}
      {readyMatches.length > 0 && (
        <div>
          <h4 className="text-xs text-vct-red font-medium uppercase mb-2">
            Ready to Play ({readyMatches.length})
          </h4>
          <div className="space-y-2">
            {readyMatches.map((match) => (
              <BracketMatch key={match.matchId} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Matches */}
      {pendingMatches.length > 0 && (
        <div>
          <h4 className="text-xs text-vct-gray font-medium uppercase mb-2">
            Upcoming ({pendingMatches.length})
          </h4>
          <div className="space-y-2">
            {pendingMatches.slice(0, 5).map((match) => (
              <BracketMatch key={match.matchId} match={match} compact />
            ))}
            {pendingMatches.length > 5 && (
              <p className="text-xs text-vct-gray">
                +{pendingMatches.length - 5} more matches
              </p>
            )}
          </div>
        </div>
      )}

      {/* Completed Matches */}
      {showCompleted && completedMatches.length > 0 && (
        <div>
          <h4 className="text-xs text-green-400 font-medium uppercase mb-2">
            Completed ({completedMatches.length})
          </h4>
          <div className="space-y-2">
            {completedMatches.slice(-5).map((match) => (
              <BracketMatch key={match.matchId} match={match} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
