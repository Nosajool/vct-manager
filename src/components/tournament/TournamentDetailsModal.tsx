// TournamentDetailsModal - Full tournament details in a modal overlay

import type { Tournament } from '../../types';
import { TournamentCard } from './TournamentCard';

interface TournamentDetailsModalProps {
  tournament: Tournament;
  onClose: () => void;
}

export function TournamentDetailsModal({ tournament, onClose }: TournamentDetailsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-vct-darker border border-vct-gray/20 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-vct-gray/20">
          <h2 className="text-lg font-semibold text-white">{tournament.name}</h2>
          <button
            onClick={onClose}
            className="text-vct-gray hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <TournamentCard tournament={tournament} showDetails />
        </div>
      </div>
    </div>
  );
}
