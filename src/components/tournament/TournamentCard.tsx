// TournamentCard Component - Tournament summary display

import type { Tournament } from '../../types';
import { useGameStore } from '../../store';
import { tournamentEngine } from '../../engine/competition';
import { bracketManager } from '../../engine/competition';

interface TournamentCardProps {
  tournament: Tournament;
  onClick?: () => void;
  showDetails?: boolean;
}

export function TournamentCard({
  tournament,
  onClick,
  showDetails = false,
}: TournamentCardProps) {
  const teams = useGameStore((state) => state.teams);
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  const isPlayerInTournament = tournament.teamIds.includes(playerTeamId || '');
  const champion = tournament.championId ? teams[tournament.championId] : null;

  // Get bracket stats
  const readyMatches = bracketManager.getReadyMatches(tournament.bracket);

  const getStatusColor = () => {
    switch (tournament.status) {
      case 'in_progress':
        return 'bg-vct-red';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-vct-gray';
    }
  };

  const getStatusLabel = () => {
    switch (tournament.status) {
      case 'in_progress':
        return 'Live';
      case 'completed':
        return 'Completed';
      default:
        return 'Upcoming';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrize = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const totalPrize =
    tournament.prizePool.first +
    tournament.prizePool.second +
    tournament.prizePool.third;

  return (
    <div
      onClick={onClick}
      className={`bg-vct-darker border border-vct-gray/20 rounded-lg p-4 ${
        onClick ? 'cursor-pointer hover:border-vct-gray/40 transition-colors' : ''
      } ${isPlayerInTournament ? 'ring-1 ring-vct-red/30' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-medium">{tournament.name}</h3>
          <p className="text-xs text-vct-gray">
            {tournamentEngine.getFormatName(tournament.format)} &middot;{' '}
            {tournament.teamIds.length} Teams
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-xs text-white ${getStatusColor()}`}
        >
          {getStatusLabel()}
        </span>
      </div>

      {/* Dates and Prize */}
      <div className="flex items-center gap-4 text-sm mb-3">
        <div className="text-vct-gray">
          <span className="text-white">{formatDate(tournament.startDate)}</span>
          {' - '}
          <span className="text-white">{formatDate(tournament.endDate)}</span>
        </div>
        <div className="text-green-400 font-medium">
          {formatPrize(totalPrize)}
        </div>
      </div>

      {/* Status Info */}
      {tournament.status === 'in_progress' && readyMatches.length > 0 && (
        <div className="text-sm text-vct-red mb-3">
          {readyMatches.length} match{readyMatches.length > 1 ? 'es' : ''} ready
          to play
        </div>
      )}

      {/* Champion */}
      {tournament.status === 'completed' && champion && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-yellow-400">Champion:</span>
          <span className="text-white font-medium">{champion.name}</span>
        </div>
      )}

      {/* Details Section */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-vct-gray/20">
          {/* Prize Distribution */}
          <div className="mb-3">
            <h4 className="text-xs text-vct-gray uppercase mb-2">
              Prize Distribution
            </h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-yellow-400">1st:</span>{' '}
                <span className="text-white">
                  {formatPrize(tournament.prizePool.first)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">2nd:</span>{' '}
                <span className="text-white">
                  {formatPrize(tournament.prizePool.second)}
                </span>
              </div>
              <div>
                <span className="text-orange-400">3rd:</span>{' '}
                <span className="text-white">
                  {formatPrize(tournament.prizePool.third)}
                </span>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div>
            <h4 className="text-xs text-vct-gray uppercase mb-2">
              Participating Teams
            </h4>
            <div className="flex flex-wrap gap-1">
              {tournament.teamIds.map((teamId) => {
                const team = teams[teamId];
                const isPlayerTeam = teamId === playerTeamId;
                return (
                  <span
                    key={teamId}
                    className={`px-2 py-0.5 rounded text-xs ${
                      isPlayerTeam
                        ? 'bg-vct-red/20 text-vct-red'
                        : 'bg-vct-gray/20 text-vct-gray'
                    }`}
                  >
                    {team?.name || teamId}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Player Team Indicator */}
      {isPlayerInTournament && (
        <div className="mt-3 pt-3 border-t border-vct-gray/20">
          <span className="text-xs text-vct-red">Your team is participating</span>
        </div>
      )}
    </div>
  );
}

// Mini version for lists
interface TournamentCardMiniProps {
  tournament: Tournament;
  onClick?: () => void;
}

export function TournamentCardMini({ tournament, onClick }: TournamentCardMiniProps) {
  const getStatusDot = () => {
    switch (tournament.status) {
      case 'in_progress':
        return 'bg-vct-red';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-vct-gray';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-2 rounded hover:bg-vct-gray/10 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${getStatusDot()}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{tournament.name}</p>
        <p className="text-xs text-vct-gray">
          {new Date(tournament.startDate).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
