// BracketMatch Component - Individual match display in bracket

import type { BracketMatch as BracketMatchType } from '../../types';
import { useGameStore } from '../../store';

interface BracketMatchProps {
  match: BracketMatchType;
  compact?: boolean;
  showScore?: boolean;
  onSimulate?: (matchId: string) => void;
}

export function BracketMatch({
  match,
  compact = false,
  showScore = true,
  onSimulate,
}: BracketMatchProps) {
  const teams = useGameStore((state) => state.teams);
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  const teamA = match.teamAId ? teams[match.teamAId] : null;
  const teamB = match.teamBId ? teams[match.teamBId] : null;

  const isPlayerMatch =
    match.teamAId === playerTeamId || match.teamBId === playerTeamId;

  const getStatusColor = () => {
    switch (match.status) {
      case 'completed':
        return 'border-green-500/30';
      case 'ready':
        return 'border-vct-red/50';
      case 'in_progress':
        return 'border-yellow-500/50';
      default:
        return 'border-vct-gray/30';
    }
  };

  const getStatusLabel = () => {
    switch (match.status) {
      case 'completed':
        return 'Completed';
      case 'ready':
        return 'Ready';
      case 'in_progress':
        return 'Live';
      default:
        return 'Pending';
    }
  };

  const TeamRow = ({
    team,
    isWinner,
    score,
  }: {
    team: typeof teamA;
    isWinner: boolean;
    score?: number;
  }) => {
    const isPlayerTeam = team?.id === playerTeamId;

    return (
      <div
        className={`flex items-center justify-between px-2 py-1 ${
          isWinner ? 'bg-green-500/10' : ''
        } ${isPlayerTeam ? 'bg-vct-red/10' : ''}`}
      >
        <span
          className={`text-sm truncate ${
            isWinner ? 'text-white font-medium' : 'text-vct-gray'
          } ${isPlayerTeam ? 'text-vct-red' : ''}`}
        >
          {team?.name || 'TBD'}
        </span>
        {showScore && match.status === 'completed' && score !== undefined && (
          <span
            className={`text-sm font-mono ${
              isWinner ? 'text-green-400' : 'text-vct-gray'
            }`}
          >
            {score}
          </span>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div
        className={`bg-vct-dark border ${getStatusColor()} rounded text-xs w-32`}
      >
        <TeamRow
          team={teamA}
          isWinner={match.winnerId === match.teamAId}
          score={match.result?.scoreTeamA}
        />
        <div className="border-t border-vct-gray/20" />
        <TeamRow
          team={teamB}
          isWinner={match.winnerId === match.teamBId}
          score={match.result?.scoreTeamB}
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-vct-darker border ${getStatusColor()} rounded-lg p-3 ${
        isPlayerMatch ? 'ring-1 ring-vct-red/30' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            match.status === 'ready'
              ? 'bg-vct-red/20 text-vct-red'
              : match.status === 'completed'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-vct-gray/20 text-vct-gray'
          }`}
        >
          {getStatusLabel()}
        </span>
        {match.scheduledDate && (
          <span className="text-xs text-vct-gray">
            {new Date(match.scheduledDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-1">
        <TeamRow
          team={teamA}
          isWinner={match.winnerId === match.teamAId}
          score={match.result?.scoreTeamA}
        />
        <div className="text-center text-xs text-vct-gray">vs</div>
        <TeamRow
          team={teamB}
          isWinner={match.winnerId === match.teamBId}
          score={match.result?.scoreTeamB}
        />
      </div>

      {/* Simulate Button */}
      {match.status === 'ready' && onSimulate && (
        <button
          onClick={() => onSimulate(match.matchId)}
          className="w-full mt-3 px-3 py-1.5 bg-vct-red text-white text-sm rounded hover:bg-vct-red/80 transition-colors"
        >
          Simulate
        </button>
      )}
    </div>
  );
}
