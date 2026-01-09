// ReleasePlayerModal - Confirmation modal for releasing a player

import { useState, useMemo } from 'react';
import type { Player, Team } from '../../types';
import { playerGenerator } from '../../engine/player';
import { contractService, type ReleaseResult } from '../../services/ContractService';

interface ReleasePlayerModalProps {
  player: Player;
  team: Team;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReleasePlayerModal({
  player,
  team,
  onClose,
  onSuccess,
}: ReleasePlayerModalProps) {
  const [isReleasing, setIsReleasing] = useState(false);
  const [result, setResult] = useState<ReleaseResult | null>(null);

  const overall = playerGenerator.calculateOverall(player.stats);
  const releaseCost = useMemo(
    () => contractService.getReleaseCost(player.id),
    [player.id]
  );

  const canAfford = team.finances.balance >= releaseCost;

  const formatSalary = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const handleRelease = () => {
    setIsReleasing(true);

    const releaseResult = contractService.releasePlayer(player.id);
    setResult(releaseResult);
    setIsReleasing(false);

    if (releaseResult.success && onSuccess) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
  };

  const isActive = team.playerIds.includes(player.id);
  const remainingActive = isActive ? team.playerIds.length - 1 : team.playerIds.length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-vct-gray/20">
          <div className="flex items-center gap-4">
            <div
              className={`
                w-14 h-14 rounded-lg flex items-center justify-center
                font-bold text-xl bg-vct-dark border-2
                ${overall >= 85 ? 'border-yellow-500 text-yellow-400' : ''}
                ${overall >= 75 && overall < 85 ? 'border-green-500 text-green-400' : ''}
                ${overall >= 65 && overall < 75 ? 'border-blue-500 text-blue-400' : ''}
                ${overall < 65 ? 'border-vct-gray text-vct-gray' : ''}
              `}
            >
              {overall}
            </div>
            <div>
              <h2 className="text-lg font-bold text-vct-light">Release {player.name}?</h2>
              <p className="text-vct-gray text-sm">{player.nationality}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-vct-gray hover:text-vct-light transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`mx-6 mt-4 p-4 rounded-lg ${
              result.success
                ? 'bg-green-900/30 border border-green-500/50'
                : 'bg-red-900/30 border border-red-500/50'
            }`}
          >
            <p
              className={`font-medium ${
                result.success ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {result.success ? 'Player Released' : 'Release Failed'}
            </p>
            {result.success && (
              <p className="text-vct-gray text-sm mt-1">
                {player.name} is now a free agent.
              </p>
            )}
            {result.error && (
              <p className="text-vct-gray text-sm mt-1">{result.error}</p>
            )}
          </div>
        )}

        {/* Content */}
        {!result?.success && (
          <div className="p-6 space-y-4">
            {/* Warning */}
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 font-medium mb-1">Warning</p>
              <p className="text-vct-gray text-sm">
                This action cannot be undone. The player will become a free agent
                and can be signed by any team.
              </p>
            </div>

            {/* Contract Info */}
            {player.contract && (
              <div className="bg-vct-dark rounded-lg p-4">
                <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
                  Current Contract
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-vct-gray">Annual Salary</p>
                    <p className="text-vct-light font-medium">
                      {formatSalary(player.contract.salary)}
                    </p>
                  </div>
                  <div>
                    <p className="text-vct-gray">Years Remaining</p>
                    <p className="text-vct-light font-medium">
                      {player.contract.yearsRemaining}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Impact */}
            <div className="bg-vct-dark rounded-lg p-4">
              <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
                Financial Impact
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-vct-gray">Buyout Cost (50% of remaining)</span>
                  <span className="text-red-400 font-medium">
                    -{formatSalary(releaseCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vct-gray">Your Budget</span>
                  <span className={`font-medium ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                    {formatSalary(team.finances.balance)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-vct-gray/20">
                  <span className="text-vct-gray">After Release</span>
                  <span className={`font-medium ${canAfford ? 'text-vct-light' : 'text-red-400'}`}>
                    {formatSalary(team.finances.balance - releaseCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Roster Impact */}
            <div className="bg-vct-dark rounded-lg p-4">
              <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
                Roster Impact
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-vct-gray">Active Roster:</span>
                <span className="text-vct-light">
                  {team.playerIds.length}/5
                </span>
                <span className="text-vct-gray">→</span>
                <span
                  className={`font-medium ${
                    remainingActive < 5 ? 'text-yellow-400' : 'text-vct-light'
                  }`}
                >
                  {remainingActive}/5
                </span>
                {remainingActive < 5 && (
                  <span className="text-yellow-400 text-xs">
                    (Need {5 - remainingActive} more)
                  </span>
                )}
              </div>
            </div>

            {/* Validation Errors */}
            {!canAfford && (
              <p className="text-red-400 text-sm">
                Insufficient funds for buyout payment.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-6 border-t border-vct-gray/20 flex justify-end gap-3">
          {!result?.success && (
            <button
              onClick={handleRelease}
              disabled={!canAfford || isReleasing}
              className="px-6 py-2 bg-red-600 text-white font-medium rounded
                         hover:bg-red-500 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isReleasing ? 'Releasing...' : 'Confirm Release'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vct-dark border border-vct-gray/30 text-vct-light
                       font-medium rounded hover:bg-vct-gray/20 transition-colors"
          >
            {result?.success ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
