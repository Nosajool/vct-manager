// BracketMatch Component - Individual match display in bracket
//
// Note: Match simulation is handled by the global TimeBar.
// This component is view-only.
//
// Supports TBD placeholders with source information when teams are not yet qualified.

import type { BracketMatch as BracketMatchType, Team } from '../../types';
import type { TeamSlot } from '../../types/competition';
import { useGameStore } from '../../store';

interface BracketMatchProps {
  match: BracketMatchType;
  compact?: boolean;
  showScore?: boolean;
  /** Optional team slots for TBD display - indexed by team position */
  teamSlots?: { teamA?: TeamSlot; teamB?: TeamSlot };
  /** Callback when a completed match is clicked */
  onMatchClick?: (matchId: string) => void;
}

export function BracketMatch({
  match,
  compact = false,
  showScore = true,
  teamSlots,
  onMatchClick,
}: BracketMatchProps) {
  const teams = useGameStore((state) => state.teams);
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  const teamA = match.teamAId ? teams[match.teamAId] : null;
  const teamB = match.teamBId ? teams[match.teamBId] : null;

  // Helper to get team display name from TeamSlot
  const getTeamDisplay = (
    team: Team | null,
    slot?: TeamSlot
  ): { name: string; isTbd: boolean; description?: string } => {
    if (team) {
      return { name: team.name, isTbd: false };
    }

    if (slot) {
      if (slot.type === 'resolved' && slot.teamId) {
        const resolvedTeam = teams[slot.teamId];
        return { name: resolvedTeam?.name || 'Unknown', isTbd: false };
      }
      if (slot.type === 'qualified_from') {
        return {
          name: 'TBD',
          isTbd: true,
          description: slot.description,
        };
      }
    }

    return { name: 'TBD', isTbd: true };
  };

  const teamADisplay = getTeamDisplay(teamA, teamSlots?.teamA);
  const teamBDisplay = getTeamDisplay(teamB, teamSlots?.teamB);

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
    display,
    isWinner,
    score,
  }: {
    team: typeof teamA;
    display: { name: string; isTbd: boolean; description?: string };
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
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className={`text-sm truncate ${
              display.isTbd
                ? 'text-vct-gray/60 italic'
                : isWinner
                  ? 'text-white font-medium'
                  : 'text-vct-gray'
            } ${isPlayerTeam ? 'text-vct-red' : ''}`}
          >
            {display.name}
          </span>
          {display.isTbd && display.description && (
            <span className="text-xs text-vct-gray/40 truncate">
              {display.description}
            </span>
          )}
        </div>
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

  const isClickable = match.status === 'completed' && onMatchClick;

  const handleClick = () => {
    if (isClickable) {
      onMatchClick(match.matchId);
    }
  };

  // Format date for compact display (e.g., "Jan 15")
  const formatCompactDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={`bg-vct-dark border ${getStatusColor()} rounded text-xs w-32 ${
          isClickable ? 'cursor-pointer hover:border-vct-gray/50 transition-colors' : ''
        }`}
      >
        {/* Date header for compact view */}
        {match.scheduledDate && (
          <div className="px-2 py-0.5 border-b border-vct-gray/20 flex items-center justify-between">
            <span className="text-vct-gray/60 text-[10px]">
              {formatCompactDate(match.scheduledDate)}
            </span>
            {match.status === 'completed' && (
              <span className="text-green-500/60 text-[10px]">✓</span>
            )}
            {match.status === 'ready' && (
              <span className="text-vct-red/60 text-[10px]">●</span>
            )}
          </div>
        )}
        <TeamRow
          team={teamA}
          display={teamADisplay}
          isWinner={match.winnerId === match.teamAId}
          score={match.result?.scoreTeamA}
        />
        <div className="border-t border-vct-gray/20" />
        <TeamRow
          team={teamB}
          display={teamBDisplay}
          isWinner={match.winnerId === match.teamBId}
          score={match.result?.scoreTeamB}
        />
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`bg-vct-darker border ${getStatusColor()} rounded-lg p-3 ${
        isPlayerMatch ? 'ring-1 ring-vct-red/30' : ''
      } ${isClickable ? 'cursor-pointer hover:border-vct-gray/50 transition-colors' : ''}`}
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
          display={teamADisplay}
          isWinner={match.winnerId === match.teamAId}
          score={match.result?.scoreTeamA}
        />
        <div className="text-center text-xs text-vct-gray">vs</div>
        <TeamRow
          team={teamB}
          display={teamBDisplay}
          isWinner={match.winnerId === match.teamBId}
          score={match.result?.scoreTeamB}
        />
      </div>
    </div>
  );
}
