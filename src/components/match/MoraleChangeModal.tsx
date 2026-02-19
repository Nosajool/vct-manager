// MoraleChangeModal - Shows morale changes after a match
// Appears in post-match flow: SimulationResults → Interview → MoraleChangeModal → DayRecap

import { useEffect } from 'react';
import type { MatchMoraleResult } from '../../types/match';

interface MoraleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: MatchMoraleResult;
  teamName: string;
}

export function MoraleChangeModal({ isOpen, onClose, result }: MoraleChangeModalProps) {
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-vct-darker rounded-lg w-full max-w-lg overflow-hidden flex flex-col">
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
          <div className="space-y-2">
            {sortedPlayers.map((player) => (
              <div
                key={player.playerId}
                className="flex items-center justify-between p-3 bg-vct-dark rounded-lg border border-vct-gray/20"
              >
                <div className="flex-1">
                  <p className="font-medium text-vct-light">{player.playerName}</p>
                  <p className="text-sm text-vct-gray">
                    {player.reasons
                      .slice(0, 2)
                      .map((r) => r.label)
                      .join(', ')}
                  </p>
                </div>
                <div
                  className={`text-right font-bold ${
                    player.delta >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {player.delta >= 0 ? '+' : ''}
                  {player.delta} {player.delta >= 0 ? '▲' : '▼'}
                </div>
              </div>
            ))}
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
