// ScrimRecapModal - Visual recap of scrim session results
//
// Shows team logos, map win/loss cards, map attribute improvements, and chemistry changes.
// Replaces the scrim section of DayRecapModal with a more visual, scan-friendly layout.

import { useGameStore } from '../../store';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl } from '../../utils/imageAssets';
import type { ActivityResolutionResult } from '../../types/activityPlan';
import type { MapStrengthAttributes } from '../../types/scrim';

interface ScrimRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityResults: ActivityResolutionResult;
  date: string;
}

const ATTRIBUTE_LABELS: Record<keyof MapStrengthAttributes, string> = {
  executes: 'Executes',
  retakes: 'Retakes',
  utility: 'Utility',
  communication: 'Comms',
  mapControl: 'Map Control',
  antiStrat: 'Anti-Strat',
};

export function ScrimRecapModal({ isOpen, onClose, activityResults, date }: ScrimRecapModalProps) {
  if (!isOpen) return null;

  const getPlayerTeam = useGameStore((state) => state.getPlayerTeam);
  const playerTeam = getPlayerTeam();

  const { scrimResult, skippedScrim } = activityResults;

  if (skippedScrim) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-vct-darker rounded-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-vct-gray/20">
            <h2 className="text-xl font-bold text-vct-light">Scrim Session</h2>
            <p className="text-sm text-vct-gray">{date}</p>
          </div>
          <div className="p-6 flex items-center justify-center py-12">
            <div className="text-center bg-vct-dark/50 rounded-lg p-8 max-w-sm w-full">
              <div className="text-4xl mb-3">🎮</div>
              <div className="text-vct-light font-semibold text-lg">Scrim Skipped</div>
              <div className="text-vct-gray text-sm mt-1">Team takes a break</div>
              <div className="text-green-400 text-sm mt-2">+Morale for the squad</div>
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

  if (!scrimResult) return null;

  const playerTeamId = playerTeam?.id;
  const playerTeamName = playerTeam?.name ?? 'Your Team';
  const opponentName = scrimResult.partnerTeamName;

  // Count map wins for each side
  const playerWins = scrimResult.maps.filter((m) => m.winner === playerTeamId).length;
  const opponentWins = scrimResult.maps.filter((m) => m.winner !== playerTeamId).length;
  const playerWon = scrimResult.overallWinner === playerTeamId;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20">
          <h2 className="text-xl font-bold text-vct-light">Scrim Session</h2>
          <p className="text-sm text-vct-gray">{date}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Matchup bar */}
          <div className="flex items-center justify-between bg-vct-dark/50 rounded-lg p-4">
            {/* Player team */}
            <div className="flex items-center gap-3 flex-1">
              <GameImage
                src={getTeamLogoUrl(playerTeamName)}
                alt={playerTeamName}
                className="w-10 h-10 object-contain"
                fallbackClassName="w-10 h-10"
              />
              <span className={`font-semibold ${playerWon ? 'text-green-400' : 'text-vct-light'}`}>
                {playerTeamName}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-3 px-4">
              <span className={`text-2xl font-bold ${playerWon ? 'text-green-400' : 'text-vct-gray'}`}>
                {playerWins}
              </span>
              <span className="text-vct-gray text-lg">–</span>
              <span className={`text-2xl font-bold ${!playerWon ? 'text-green-400' : 'text-vct-gray'}`}>
                {opponentWins}
              </span>
            </div>

            {/* Opponent team */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <span className={`font-semibold ${!playerWon ? 'text-green-400' : 'text-vct-light'}`}>
                {opponentName}
              </span>
              <GameImage
                src={getTeamLogoUrl(opponentName)}
                alt={opponentName}
                className="w-10 h-10 object-contain"
                fallbackClassName="w-10 h-10"
              />
            </div>
          </div>

          {/* Per-map result cards */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">Maps</h3>
            <div className="space-y-2">
              {scrimResult.maps.map((mapResult, idx) => {
                const mapWon = mapResult.winner === playerTeamId;
                // Determine scores: teamA is player team
                const playerScore = mapResult.teamAScore;
                const opponentScore = mapResult.teamBScore;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-vct-dark/50 rounded-lg px-4 py-3"
                  >
                    <span className="text-vct-light font-medium">{mapResult.map}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-vct-light">
                        {playerScore} – {opponentScore}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          mapWon
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {mapWon ? 'W' : 'L'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map improvements */}
          {Object.keys(scrimResult.mapImprovements).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">Map Improvements</h3>
              <div className="space-y-2">
                {Object.entries(scrimResult.mapImprovements).map(([mapName, improvements]) => {
                  const positiveImprovements = Object.entries(improvements).filter(
                    ([, delta]) => (delta ?? 0) > 0
                  );
                  if (positiveImprovements.length === 0) return null;
                  return (
                    <div key={mapName} className="bg-vct-dark/50 rounded-lg px-4 py-3">
                      <div className="text-vct-light font-medium text-sm mb-2">{mapName}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {positiveImprovements.map(([attr, delta]) => (
                          <div
                            key={attr}
                            className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded"
                          >
                            <span>+{(delta as number).toFixed(1)}</span>
                            <span className="text-blue-300/70">
                              {ATTRIBUTE_LABELS[attr as keyof MapStrengthAttributes] ?? attr}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chemistry change */}
          {scrimResult.chemistryChange !== 0 && (
            <div className="flex items-center gap-2 bg-vct-dark/50 rounded-lg px-4 py-3">
              <span className="text-vct-gray text-sm">Team Chemistry</span>
              <span
                className={`text-sm font-semibold ${
                  scrimResult.chemistryChange > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {scrimResult.chemistryChange > 0 ? '+' : ''}{scrimResult.chemistryChange}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
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
