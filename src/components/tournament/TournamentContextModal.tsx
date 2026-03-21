// TournamentContextModal - Shows tournament standings/bracket after a match
// Appears in the post-match flow: MoraleChange → TournamentContext → Interview

import { useEffect } from 'react';
import type { Tournament } from '../../types';
import { isMultiStageTournament } from '../../types';
import { SwissStandingsTable } from './SwissStandingsTable';
import { LeagueStandingsTable } from './LeagueStandingsTable';
import { BracketView } from './BracketView';

interface TournamentContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
}

type ModalView = 'swiss' | 'league' | 'bracket';

function getModalView(t: Tournament): ModalView {
  if (isMultiStageTournament(t)) {
    if (t.currentStage === 'swiss' && t.swissStage) return 'swiss';
    if (t.currentStage === 'league' && t.leagueStage) return 'league';
    return 'bracket';
  }
  return 'bracket';
}

function getStageLabel(t: Tournament): string {
  if (isMultiStageTournament(t)) {
    if (t.currentStage === 'swiss') return 'Swiss Stage';
    if (t.currentStage === 'league') return 'League Stage';
    return 'Playoffs';
  }
  return 'Bracket';
}

export function TournamentContextModal({ isOpen, onClose, tournament }: TournamentContextModalProps) {
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

  const view = getModalView(tournament);
  const stageLabel = getStageLabel(tournament);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const bracketToShow = (() => {
    if (isMultiStageTournament(tournament) && tournament.currentStage === 'playoff') {
      return tournament.playoffBracket ?? tournament.bracket;
    }
    return tournament.bracket;
  })();

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-vct-darker rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-vct-light">{tournament.name}</h2>
              <p className="text-sm text-vct-gray mt-0.5">{stageLabel} — Updated Standings</p>
            </div>
            <button
              onClick={onClose}
              className="text-vct-gray hover:text-white transition-colors text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {view === 'swiss' && isMultiStageTournament(tournament) && tournament.swissStage && (
            <SwissStandingsTable swissStage={tournament.swissStage} />
          )}
          {view === 'league' && isMultiStageTournament(tournament) && tournament.leagueStage && (
            <LeagueStandingsTable leagueStage={tournament.leagueStage} />
          )}
          {view === 'bracket' && (
            <BracketView bracket={bracketToShow} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-vct-gray/20 flex-shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white text-sm font-medium rounded transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
