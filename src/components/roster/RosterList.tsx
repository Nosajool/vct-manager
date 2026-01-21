// RosterList Component - Displays team's active roster and reserves

import { useState, useEffect } from 'react';
import type { Player, Team } from '../../types';
import { PlayerCard } from './PlayerCard';
import { PlayerDetailModal } from './PlayerDetailModal';
import { useGameStore } from '../../store';
import { contractService } from '../../services/ContractService';

interface RosterListProps {
  team: Team;
  players: Player[];
  onReleasePlayer?: (playerId: string) => void;
}

// Toast notification component
function Toast({
  message,
  type,
  onClose
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl backdrop-blur-sm
          ${type === 'success'
            ? 'bg-emerald-900/90 border border-emerald-500/50'
            : 'bg-red-900/90 border border-red-500/50'
          }
        `}
      >
        {type === 'success' ? (
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span className={`text-sm font-medium ${type === 'success' ? 'text-emerald-100' : 'text-red-100'}`}>
          {message}
        </span>
        <button
          onClick={onClose}
          className={`ml-2 p-1 rounded hover:bg-white/10 transition-colors ${
            type === 'success' ? 'text-emerald-300' : 'text-red-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function RosterList({ team, players, onReleasePlayer }: RosterListProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const isPlayerTeam = team.id === playerTeamId;

  // Split into active and reserve
  const activePlayers = players.filter((p) => team.playerIds.includes(p.id));
  const reservePlayers = players.filter((p) =>
    team.reservePlayerIds.includes(p.id)
  );

  // Check if active roster has space
  const canPromote = activePlayers.length < 5;
  const slotsAvailable = 5 - activePlayers.length;

  // Handler for moving player to active roster
  const handleMoveToActive = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    const result = contractService.movePlayerPosition(playerId, 'active');
    if (result.success) {
      setToast({ type: 'success', text: `${player?.name || 'Player'} promoted to active roster` });
    } else {
      setToast({ type: 'error', text: result.error || 'Failed to move player' });
    }
  };

  // Handler for moving player to reserve
  const handleMoveToReserve = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    const result = contractService.movePlayerPosition(playerId, 'reserve');
    if (result.success) {
      setToast({ type: 'success', text: `${player?.name || 'Player'} moved to reserve` });
    } else {
      setToast({ type: 'error', text: result.error || 'Failed to move player' });
    }
  };

  const handleRelease = () => {
    if (selectedPlayer && onReleasePlayer) {
      onReleasePlayer(selectedPlayer.id);
      setSelectedPlayer(null);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="space-y-8">
        {/* Team Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-vct-light">{team.name}</h2>
            <p className="text-sm text-vct-gray">
              {team.region} • {activePlayers.length}/5 Active • {reservePlayers.length} Reserve
            </p>
          </div>
          {isPlayerTeam && (
            <span className="px-3 py-1 bg-vct-red/20 border border-vct-red/50 rounded text-vct-red text-sm font-medium">
              Your Team
            </span>
          )}
        </div>

        {/* Active Roster Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">
                Active Roster
              </h3>
              <span className={`
                px-2 py-0.5 rounded text-xs font-medium
                ${activePlayers.length === 5
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
                }
              `}>
                {activePlayers.length}/5
              </span>
            </div>
            {isPlayerTeam && slotsAvailable > 0 && reservePlayers.length > 0 && (
              <span className="text-xs text-vct-gray">
                <span className="text-emerald-400 font-medium">{slotsAvailable}</span> slot{slotsAvailable > 1 ? 's' : ''} available
              </span>
            )}
          </div>

          {activePlayers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onClick={() => setSelectedPlayer(player)}
                  selected={selectedPlayer?.id === player.id}
                  showContract
                  rosterPosition="active"
                  isPlayerTeam={isPlayerTeam}
                  onMoveToReserve={handleMoveToReserve}
                />
              ))}
            </div>
          ) : (
            <div className="bg-vct-dark/50 border border-dashed border-vct-gray/30 rounded-lg p-8 text-center">
              <p className="text-vct-gray">No active players</p>
              {isPlayerTeam && reservePlayers.length > 0 && (
                <p className="text-xs text-vct-gray mt-2">
                  Promote players from reserve to fill your roster
                </p>
              )}
            </div>
          )}
        </section>

        {/* Reserve Roster Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">
              Reserve Players
            </h3>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-vct-gray/20 text-vct-gray">
              {reservePlayers.length}
            </span>
          </div>

          {reservePlayers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reservePlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onClick={() => setSelectedPlayer(player)}
                  selected={selectedPlayer?.id === player.id}
                  showContract
                  rosterPosition="reserve"
                  isPlayerTeam={isPlayerTeam}
                  canPromote={canPromote}
                  onMoveToActive={handleMoveToActive}
                />
              ))}
            </div>
          ) : (
            <div className="bg-vct-dark/30 border border-dashed border-vct-gray/20 rounded-lg p-6 text-center">
              <p className="text-vct-gray text-sm">No reserve players</p>
            </div>
          )}
        </section>

        {/* Player Detail Modal */}
        {selectedPlayer && (
          <PlayerDetailModal
            player={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
            onRelease={isPlayerTeam ? handleRelease : undefined}
            isOnPlayerTeam={isPlayerTeam}
            rosterPosition={
              team.playerIds.includes(selectedPlayer.id) ? 'active' : 'reserve'
            }
            canPromote={canPromote}
            onMoveToActive={() => {
              handleMoveToActive(selectedPlayer.id);
              setSelectedPlayer(null);
            }}
            onMoveToReserve={() => {
              handleMoveToReserve(selectedPlayer.id);
              setSelectedPlayer(null);
            }}
          />
        )}
      </div>
    </>
  );
}
