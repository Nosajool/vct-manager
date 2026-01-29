// MatchResult Component - Full match result display modal

import { useGameStore } from '../../store';
import type { Match } from '../../types';
import { Scoreboard } from './Scoreboard';

interface MatchResultProps {
  match: Match;
  onClose: () => void;
}

export function MatchResult({ match, onClose }: MatchResultProps) {
  const teams = useGameStore((state) => state.teams);
  const results = useGameStore((state) => state.results);

  const teamA = teams[match.teamAId];
  const teamB = teams[match.teamBId];
  const result = results[match.id];

  if (!teamA || !teamB || !result) {
    return null;
  }

  const winnerTeam = result.winnerId === teamA.id ? teamA : teamB;

  // Parse date string as local date to avoid timezone shifts
  const parseAsLocalDate = (dateStr: string): Date => {
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = parseAsLocalDate(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-dark rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-vct-darker p-6 border-b border-vct-gray/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-vct-gray">
              {formatDate(match.scheduledDate)}
            </span>
            <button
              onClick={onClose}
              className="text-vct-gray hover:text-vct-light transition-colors text-xl"
            >
              ×
            </button>
          </div>

          {/* Match Score */}
          <div className="flex items-center justify-between">
            {/* Team A */}
            <div className="flex-1 text-left">
              <p
                className={`text-2xl font-bold ${
                  result.winnerId === teamA.id ? 'text-green-400' : 'text-vct-light'
                }`}
              >
                {teamA.name}
              </p>
              <p className="text-sm text-vct-gray">{teamA.region}</p>
            </div>

            {/* Score */}
            <div className="flex items-center gap-4 px-8">
              <span
                className={`text-5xl font-bold ${
                  result.winnerId === teamA.id ? 'text-green-400' : 'text-vct-gray'
                }`}
              >
                {result.scoreTeamA}
              </span>
              <span className="text-3xl text-vct-gray">-</span>
              <span
                className={`text-5xl font-bold ${
                  result.winnerId === teamB.id ? 'text-green-400' : 'text-vct-gray'
                }`}
              >
                {result.scoreTeamB}
              </span>
            </div>

            {/* Team B */}
            <div className="flex-1 text-right">
              <p
                className={`text-2xl font-bold ${
                  result.winnerId === teamB.id ? 'text-green-400' : 'text-vct-light'
                }`}
              >
                {teamB.name}
              </p>
              <p className="text-sm text-vct-gray">{teamB.region}</p>
            </div>
          </div>

          {/* Winner Banner */}
          <div className="mt-4 text-center">
            <span className="inline-block px-4 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
              {winnerTeam.name} wins
            </span>
            <span className="ml-3 text-vct-gray text-sm">
              {result.duration} minutes
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Scoreboard
            result={result}
            teamAName={teamA.name}
            teamBName={teamB.name}
          />
        </div>

        {/* Footer */}
        <div className="bg-vct-darker p-4 border-t border-vct-gray/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
