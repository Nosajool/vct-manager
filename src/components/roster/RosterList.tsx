// RosterList Component - Displays team's active roster and reserves

import { useState } from 'react';
import type { Player, Team } from '../../types';
import { PlayerCard } from './PlayerCard';
import { PlayerDetailModal } from './PlayerDetailModal';
import { useGameStore } from '../../store';

interface RosterListProps {
  team: Team;
  players: Player[];
  onReleasePlayer?: (playerId: string) => void;
}

export function RosterList({ team, players, onReleasePlayer }: RosterListProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const isPlayerTeam = team.id === playerTeamId;

  // Split into active and reserve
  const activePlayers = players.filter((p) => team.playerIds.includes(p.id));
  const reservePlayers = players.filter((p) =>
    team.reservePlayerIds.includes(p.id)
  );

  const handleRelease = () => {
    if (selectedPlayer && onReleasePlayer) {
      onReleasePlayer(selectedPlayer.id);
      setSelectedPlayer(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-vct-light">{team.name}</h2>
          <p className="text-sm text-vct-gray">
            {team.region} • {activePlayers.length}/5 Active •{' '}
            {reservePlayers.length} Reserve
          </p>
        </div>
        {isPlayerTeam && (
          <span className="px-3 py-1 bg-vct-red/20 border border-vct-red/50 rounded text-vct-red text-sm font-medium">
            Your Team
          </span>
        )}
      </div>

      {/* Active Roster */}
      <div>
        <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
          Active Roster ({activePlayers.length}/5)
        </h3>
        {activePlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onClick={() => setSelectedPlayer(player)}
                selected={selectedPlayer?.id === player.id}
                showContract
              />
            ))}
          </div>
        ) : (
          <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-8 text-center">
            <p className="text-vct-gray">No active players</p>
          </div>
        )}
      </div>

      {/* Reserve Roster */}
      <div>
        <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
          Reserve Players ({reservePlayers.length})
        </h3>
        {reservePlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservePlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onClick={() => setSelectedPlayer(player)}
                selected={selectedPlayer?.id === player.id}
                showContract
              />
            ))}
          </div>
        ) : (
          <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4 text-center">
            <p className="text-vct-gray text-sm">No reserve players</p>
          </div>
        )}
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onRelease={isPlayerTeam ? handleRelease : undefined}
          isOnPlayerTeam={isPlayerTeam}
        />
      )}
    </div>
  );
}
