// MoraleChangeModal - Shows morale changes after a match
// Appears in post-match flow: SimulationResults → Interview → MoraleChangeModal → DayRecap

import { useEffect } from 'react';
import type { MatchMoraleResult, MatchMasteryResult } from '../../types/match';
import { useGameStore } from '../../store';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl, getAgentImageUrl } from '../../utils/imageAssets';
import { PostMatchHeader } from './PostMatchHeader';

interface MoraleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: MatchMoraleResult;
  teamName: string;
  matchId?: string;
  masteryResult?: MatchMasteryResult;
}

export function MoraleChangeModal({ isOpen, onClose, result, matchId, masteryResult }: MoraleChangeModalProps) {
  const players = useGameStore((state) => state.players);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sortedPlayers = [...result.playerChanges].sort((a, b) => b.delta - a.delta);

  const masteryByPlayerId = Object.fromEntries(
    (masteryResult?.playerChanges ?? []).map((c) => [c.playerId, c])
  );

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-vct-darker rounded-lg w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-vct-gray/20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-vct-light">Player Morale</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                result.isWin
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {result.isWin ? 'Victory' : 'Defeat'}
            </span>
          </div>
        </div>

        {matchId && <PostMatchHeader matchId={matchId} />}

        {result.specialEvents.length > 0 && (
          <div className="p-4 bg-vct-dark/50 border-b border-vct-gray/20">
            <h3 className="text-sm font-medium text-vct-gray mb-2">Special Events</h3>
            <div className="flex flex-wrap gap-2">
              {result.specialEvents.map((event, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded text-sm ${
                    event.delta >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {event.icon} {event.label} ({event.delta > 0 ? '+' : ''}
                  {event.delta})
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 pb-1 mb-1">
            <div className="flex-1 min-w-0 text-xs text-vct-gray/60 font-medium">Player</div>
            <div className="w-28 flex-shrink-0 text-xs text-vct-gray/60 font-medium">Agent</div>
            <div className="w-12 flex-shrink-0 text-xs text-vct-gray/60 font-medium text-right">💙 Morale</div>
            <div className="w-10 flex-shrink-0 text-xs text-vct-gray/60 font-medium text-right">Mastery</div>
          </div>
          <div className="space-y-2">
            {sortedPlayers.map((player) => {
              const playerData = players[player.playerId];
              const mastery = masteryByPlayerId[player.playerId];
              return (
                <div key={player.playerId}
                  className="flex items-center gap-3 p-3 bg-vct-dark rounded-lg border border-vct-gray/20"
                >
                  {/* Player avatar + name + reasons */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {playerData && (
                      <GameImage
                        src={getPlayerImageUrl(playerData.name)}
                        alt={playerData.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        fallbackClassName="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-vct-light truncate">{player.playerName}</p>
                      <p className="text-xs text-vct-gray truncate">
                        {player.reasons.slice(0, 2).map((r) => r.label).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Agent name */}
                  <div className="w-28 flex-shrink-0">
                    {mastery ? (
                      <span className="text-xs text-vct-gray truncate block">{mastery.agentName}</span>
                    ) : (
                      <span className="text-xs text-vct-gray/40">—</span>
                    )}
                  </div>

                  {/* Morale delta */}
                  <div className={`text-sm font-bold w-12 text-right flex-shrink-0 whitespace-nowrap ${
                    player.delta >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    💙 {player.delta >= 0 ? '+' : ''}{player.delta} {player.delta >= 0 ? '▲' : '▼'}
                  </div>

                  {/* Mastery delta with agent icon */}
                  <div className="w-10 flex items-center justify-end gap-1 flex-shrink-0">
                    {mastery ? (
                      <>
                        <GameImage
                          src={getAgentImageUrl(mastery.agentName)}
                          alt={mastery.agentName}
                          className="w-4 h-4 rounded object-cover flex-shrink-0"
                          fallbackClassName="w-4 h-4 rounded flex-shrink-0"
                        />
                        <span className="text-xs text-blue-400 font-medium">+{mastery.delta}</span>
                      </>
                    ) : (
                      <span className="text-xs text-vct-gray/40">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-vct-gray/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
