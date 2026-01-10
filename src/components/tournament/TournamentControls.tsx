// TournamentControls Component - Tournament simulation controls

import { useState } from 'react';
import type { Tournament } from '../../types';
import { bracketManager } from '../../engine/competition';

interface TournamentControlsProps {
  tournament: Tournament;
  onSimulateMatch: () => void;
  onSimulateRound: () => void;
  onSimulateTournament: () => void;
  isSimulating?: boolean;
}

export function TournamentControls({
  tournament,
  onSimulateMatch,
  onSimulateRound,
  onSimulateTournament,
  isSimulating = false,
}: TournamentControlsProps) {
  const [confirmSimAll, setConfirmSimAll] = useState(false);

  const readyMatches = bracketManager.getReadyMatches(tournament.bracket);
  const bracketStatus = bracketManager.getBracketStatus(tournament.bracket);
  const isCompleted = bracketStatus === 'completed';
  const hasReadyMatches = readyMatches.length > 0;

  const handleSimulateTournament = () => {
    if (confirmSimAll) {
      onSimulateTournament();
      setConfirmSimAll(false);
    } else {
      setConfirmSimAll(true);
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmSimAll(false), 3000);
    }
  };

  if (isCompleted) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
        <p className="text-green-400 font-medium">Tournament Complete</p>
        <p className="text-sm text-vct-gray mt-1">
          All matches have been played
        </p>
      </div>
    );
  }

  if (tournament.status === 'upcoming') {
    return (
      <div className="bg-vct-gray/10 border border-vct-gray/30 rounded-lg p-4 text-center">
        <p className="text-vct-gray">Tournament has not started yet</p>
        <p className="text-xs text-vct-gray mt-1">
          Starts {new Date(tournament.startDate).toLocaleDateString()}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Match Count */}
      <div className="text-sm text-vct-gray">
        {hasReadyMatches ? (
          <span>
            <span className="text-vct-red font-medium">{readyMatches.length}</span>{' '}
            match{readyMatches.length > 1 ? 'es' : ''} ready to simulate
          </span>
        ) : (
          <span>Waiting for matches to become ready...</span>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Simulate Next Match */}
        <button
          onClick={onSimulateMatch}
          disabled={!hasReadyMatches || isSimulating}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            hasReadyMatches && !isSimulating
              ? 'bg-vct-red text-white hover:bg-vct-red/80'
              : 'bg-vct-gray/20 text-vct-gray cursor-not-allowed'
          }`}
        >
          {isSimulating ? 'Simulating...' : 'Simulate Match'}
        </button>

        {/* Simulate Round */}
        <button
          onClick={onSimulateRound}
          disabled={!hasReadyMatches || isSimulating}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            hasReadyMatches && !isSimulating
              ? 'bg-vct-dark border border-vct-gray/30 text-white hover:bg-vct-gray/20'
              : 'bg-vct-gray/20 text-vct-gray cursor-not-allowed'
          }`}
        >
          Simulate Round ({readyMatches.length})
        </button>

        {/* Simulate All */}
        <button
          onClick={handleSimulateTournament}
          disabled={isSimulating}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            confirmSimAll
              ? 'bg-yellow-500 text-black hover:bg-yellow-400'
              : isSimulating
                ? 'bg-vct-gray/20 text-vct-gray cursor-not-allowed'
                : 'bg-vct-dark border border-vct-gray/30 text-white hover:bg-vct-gray/20'
          }`}
        >
          {confirmSimAll
            ? 'Click to Confirm'
            : isSimulating
              ? 'Simulating...'
              : 'Simulate All'}
        </button>
      </div>

      {/* Warning for Simulate All */}
      {confirmSimAll && (
        <p className="text-xs text-yellow-400">
          This will simulate all remaining matches instantly
        </p>
      )}
    </div>
  );
}

// Compact version for inline use
interface TournamentControlsCompactProps {
  onSimulateMatch: () => void;
  onSimulateRound: () => void;
  readyCount: number;
  isSimulating?: boolean;
}

export function TournamentControlsCompact({
  onSimulateMatch,
  onSimulateRound,
  readyCount,
  isSimulating = false,
}: TournamentControlsCompactProps) {
  const hasReady = readyCount > 0;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onSimulateMatch}
        disabled={!hasReady || isSimulating}
        className={`px-3 py-1.5 rounded text-xs font-medium ${
          hasReady && !isSimulating
            ? 'bg-vct-red text-white hover:bg-vct-red/80'
            : 'bg-vct-gray/20 text-vct-gray cursor-not-allowed'
        }`}
      >
        Sim Match
      </button>
      <button
        onClick={onSimulateRound}
        disabled={!hasReady || isSimulating}
        className={`px-3 py-1.5 rounded text-xs font-medium ${
          hasReady && !isSimulating
            ? 'bg-vct-dark border border-vct-gray/30 text-white hover:bg-vct-gray/20'
            : 'bg-vct-gray/20 text-vct-gray cursor-not-allowed'
        }`}
      >
        Sim Round
      </button>
    </div>
  );
}
