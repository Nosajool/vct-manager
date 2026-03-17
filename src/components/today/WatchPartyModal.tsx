// WatchPartyModal - Let the player choose which match to watch during downtime
//
// Shows recent matches from other teams. Confirming marks the watch party as
// configured; cancelling removes the scheduled event.

import { useState } from 'react';
import { useGameStore } from '../../store';
import { downtimeService } from '../../services/DowntimeService';
import { dayPlanService } from '../../services/DayPlanService';

interface WatchPartyModalProps {
  isOpen: boolean;
  eventId: string;
  onClose: () => void;
}

export function WatchPartyModal({ isOpen, eventId, onClose }: WatchPartyModalProps) {
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const matches = useGameStore((state) => state.matches);
  const teams = useGameStore((state) => state.teams);
  const updateEventLifecycleState = useGameStore((state) => state.updateEventLifecycleState);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  if (!isOpen) return null;

  const recentMatchIds = playerTeamId
    ? downtimeService.getRecentOtherTeamMatchIds(playerTeamId, 7)
    : [];

  const recentMatches = recentMatchIds
    .map((id) => matches[id])
    .filter(Boolean);

  const handleConfirm = () => {
    updateEventLifecycleState(eventId, 'configured');
    onClose();
  };

  const handleCancel = () => {
    // Remove the scheduled event
    try {
      dayPlanService.unscheduleActivity(eventId);
    } catch {
      // Already removed or locked
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-vct-dark border border-vct-gray/30 rounded-lg w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0 space-y-2">
          <h2 className="text-white font-semibold text-lg">Schedule Watch Party</h2>
          <p className="text-vct-gray text-sm">
            Your team watches a recent pro match to study strategies and build team cohesion.
          </p>
        </div>

        {/* Scrollable match list */}
        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          {recentMatches.length > 0 ? (
            <div className="space-y-2 pb-2">
              <p className="text-vct-gray text-xs font-medium uppercase tracking-wider">
                Recent Matches (last 7 days)
              </p>
              {recentMatches.map((match) => {
                const teamA = teams[match.teamAId];
                const teamB = teams[match.teamBId];
                const label = `${teamA?.name ?? 'Unknown'} vs ${teamB?.name ?? 'Unknown'}`;
                const isSelected = selectedMatchId === match.id;
                return (
                  <button
                    key={match.id}
                    onClick={() => setSelectedMatchId(match.id)}
                    className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
                      isSelected
                        ? 'border-vct-red bg-vct-red/10 text-white'
                        : 'border-vct-gray/30 text-vct-gray hover:border-vct-gray/60 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-vct-gray/60 text-sm italic pb-2">
              No recent matches available — your team will watch VODs instead.
            </p>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 flex gap-2 shrink-0 border-t border-vct-gray/20">
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-vct-red hover:bg-vct-red/80 text-white text-sm font-medium rounded transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-gray hover:text-white text-sm rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
