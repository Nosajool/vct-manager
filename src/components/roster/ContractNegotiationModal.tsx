// ContractNegotiationModal - Interface for negotiating contracts with free agents

import { useState, useMemo } from 'react';
import type { Player, Team } from '../../types';
import { playerGenerator } from '../../engine/player';
import {
  contractService,
  type SigningResult,
} from '../../services/ContractService';
import type {
  ContractOffer,
  NegotiationResult,
  SalaryExpectation,
} from '../../engine/player';

interface ContractNegotiationModalProps {
  player: Player;
  team: Team;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ContractNegotiationModal({
  player,
  team,
  onClose,
  onSuccess,
}: ContractNegotiationModalProps) {
  const overall = playerGenerator.calculateOverall(player.stats);
  const salaryExpectation = useMemo(
    () => contractService.getSalaryExpectation(player.id),
    [player.id]
  );

  // Form state
  const [salary, setSalary] = useState(salaryExpectation?.expected || 100000);
  const [signingBonus, setSigningBonus] = useState(0);
  const [years, setYears] = useState(2);
  const [position, setPosition] = useState<'active' | 'reserve'>('active');

  // Negotiation state
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [result, setResult] = useState<SigningResult | null>(null);
  const [previewResult, setPreviewResult] = useState<NegotiationResult | null>(null);

  const formatSalary = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const canAfford = team.finances.balance >= signingBonus;
  const hasRosterSpace =
    position === 'active'
      ? team.playerIds.length < 5
      : team.playerIds.length + team.reservePlayerIds.length < 10;

  // Preview the offer
  const handlePreview = () => {
    const offer: ContractOffer = {
      salary,
      signingBonus,
      yearsRemaining: years,
      bonusPerWin: Math.round(salary * 0.01),
    };

    const preview = contractService.evaluateOffer(player.id, team.id, offer);
    setPreviewResult(preview);
  };

  // Submit the offer
  const handleSubmit = () => {
    setIsNegotiating(true);

    const offer: ContractOffer = {
      salary,
      signingBonus,
      yearsRemaining: years,
      bonusPerWin: Math.round(salary * 0.01),
    };

    const signingResult = contractService.signPlayer(
      player.id,
      team.id,
      offer,
      position
    );

    setResult(signingResult);
    setIsNegotiating(false);

    if (signingResult.success && onSuccess) {
      // Delay to show success message
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
  };

  // Accept counter-offer
  const handleAcceptCounter = () => {
    if (!previewResult?.counterOffer) return;

    const counter = previewResult.counterOffer;
    setSalary(counter.salary);
    setSigningBonus(counter.signingBonus);
    setYears(counter.yearsRemaining);
    setPreviewResult(null);
  };

  const getSalaryRating = (amount: number, expectation: SalaryExpectation): string => {
    if (amount >= expectation.maximum) return 'Excellent';
    if (amount >= expectation.expected) return 'Good';
    if (amount >= expectation.minimum) return 'Fair';
    return 'Low';
  };

  const getSalaryColor = (amount: number, expectation: SalaryExpectation): string => {
    if (amount >= expectation.maximum) return 'text-yellow-400';
    if (amount >= expectation.expected) return 'text-green-400';
    if (amount >= expectation.minimum) return 'text-vct-gray';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-vct-gray/20">
          <div className="flex items-center gap-4">
            <div
              className={`
                w-16 h-16 rounded-lg flex items-center justify-center
                font-bold text-2xl bg-vct-dark border-2
                ${overall >= 85 ? 'border-yellow-500 text-yellow-400' : ''}
                ${overall >= 75 && overall < 85 ? 'border-green-500 text-green-400' : ''}
                ${overall >= 65 && overall < 75 ? 'border-blue-500 text-blue-400' : ''}
                ${overall < 65 ? 'border-vct-gray text-vct-gray' : ''}
              `}
            >
              {overall}
            </div>
            <div>
              <h2 className="text-xl font-bold text-vct-light">{player.name}</h2>
              <p className="text-vct-gray text-sm">
                {player.age} years - {player.nationality}
              </p>
              <p className="text-vct-red text-sm">{player.region}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-vct-gray hover:text-vct-light transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Success Message (at top for confirmation) */}
        {result?.success && (
          <div
            className="mx-6 mt-4 p-4 rounded-lg bg-green-900/30 border border-green-500/50"
          >
            <p className="font-medium text-green-400">
              Contract Signed!
            </p>
            {result.negotiationResult && (
              <p className="text-vct-gray text-sm mt-1">
                {result.negotiationResult.reason}
              </p>
            )}
            {result.error && !result.negotiationResult && (
              <p className="text-vct-gray text-sm mt-1">{result.error}</p>
            )}
          </div>
        )}

        {/* Content */}
        {!result?.success && (
          <div className="p-6 space-y-6">
            {/* Player Expectations */}
            {salaryExpectation && (
              <div className="bg-vct-dark rounded-lg p-4">
                <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
                  Player Expectations
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-vct-gray text-xs">Minimum</p>
                    <p className="text-red-400 font-medium">
                      {formatSalary(salaryExpectation.minimum)}
                    </p>
                  </div>
                  <div>
                    <p className="text-vct-gray text-xs">Expected</p>
                    <p className="text-yellow-400 font-medium">
                      {formatSalary(salaryExpectation.expected)}
                    </p>
                  </div>
                  <div>
                    <p className="text-vct-gray text-xs">Maximum</p>
                    <p className="text-green-400 font-medium">
                      {formatSalary(salaryExpectation.maximum)}
                    </p>
                  </div>
                </div>

                {/* Preferences */}
                <div className="mt-4 pt-3 border-t border-vct-gray/20">
                  <p className="text-vct-gray text-xs mb-2">Player Priorities:</p>
                  <div className="flex gap-2 flex-wrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        player.preferences.salaryImportance > 60
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-vct-darker text-vct-gray'
                      }`}
                    >
                      Salary: {player.preferences.salaryImportance}%
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        player.preferences.teamQualityImportance > 60
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-vct-darker text-vct-gray'
                      }`}
                    >
                      Team Quality: {player.preferences.teamQualityImportance}%
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        player.preferences.regionLoyalty > 60
                          ? 'bg-purple-900/30 text-purple-400'
                          : 'bg-vct-darker text-vct-gray'
                      }`}
                    >
                      Region: {player.preferences.regionLoyalty}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Offer Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">
                Your Offer
              </h3>

              {/* Salary */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-vct-gray">Annual Salary</label>
                  {salaryExpectation && (
                    <span
                      className={`text-sm ${getSalaryColor(
                        salary,
                        salaryExpectation
                      )}`}
                    >
                      {getSalaryRating(salary, salaryExpectation)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={25000}
                    max={1500000}
                    step={25000}
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="flex-1 accent-vct-red"
                  />
                  <span className="w-24 text-right text-vct-light font-medium">
                    {formatSalary(salary)}
                  </span>
                </div>
              </div>

              {/* Signing Bonus */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-vct-gray">Signing Bonus</label>
                  <span className="text-sm text-vct-gray">One-time payment</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={500000}
                    step={10000}
                    value={signingBonus}
                    onChange={(e) => setSigningBonus(Number(e.target.value))}
                    className="flex-1 accent-vct-red"
                  />
                  <span className="w-24 text-right text-vct-light font-medium">
                    {formatSalary(signingBonus)}
                  </span>
                </div>
              </div>

              {/* Contract Length */}
              <div>
                <label className="text-sm text-vct-gray block mb-1">
                  Contract Length
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((y) => (
                    <button
                      key={y}
                      onClick={() => setYears(y)}
                      className={`px-4 py-2 rounded font-medium transition-colors ${
                        years === y
                          ? 'bg-vct-red text-white'
                          : 'bg-vct-dark text-vct-gray hover:text-vct-light'
                      }`}
                    >
                      {y} Year{y > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="text-sm text-vct-gray block mb-1">
                  Roster Position
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPosition('active')}
                    disabled={team.playerIds.length >= 5}
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      position === 'active'
                        ? 'bg-vct-red text-white'
                        : 'bg-vct-dark text-vct-gray hover:text-vct-light'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Active ({team.playerIds.length}/5)
                  </button>
                  <button
                    onClick={() => setPosition('reserve')}
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      position === 'reserve'
                        ? 'bg-vct-red text-white'
                        : 'bg-vct-dark text-vct-gray hover:text-vct-light'
                    }`}
                  >
                    Reserve ({team.reservePlayerIds.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-vct-dark rounded-lg p-4">
              <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
                Offer Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-vct-gray">Annual Salary</p>
                  <p className="text-vct-light font-medium">{formatSalary(salary)}/year</p>
                </div>
                <div>
                  <p className="text-vct-gray">Signing Bonus</p>
                  <p className="text-vct-light font-medium">
                    {signingBonus > 0 ? formatSalary(signingBonus) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-vct-gray">Total Contract Value</p>
                  <p className="text-yellow-400 font-medium">
                    {formatSalary(salary * years + signingBonus)}
                  </p>
                </div>
                <div>
                  <p className="text-vct-gray">Your Budget</p>
                  <p
                    className={`font-medium ${
                      canAfford ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {formatSalary(team.finances.balance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Result */}
            {previewResult && (
              <div
                className={`p-4 rounded-lg ${
                  previewResult.acceptanceProbability > 0.6
                    ? 'bg-green-900/20 border border-green-500/30'
                    : previewResult.acceptanceProbability > 0.3
                    ? 'bg-yellow-900/20 border border-yellow-500/30'
                    : 'bg-red-900/20 border border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-vct-gray text-sm">Acceptance Chance:</span>
                  <span
                    className={`font-bold ${
                      previewResult.acceptanceProbability > 0.6
                        ? 'text-green-400'
                        : previewResult.acceptanceProbability > 0.3
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {Math.round(previewResult.acceptanceProbability * 100)}%
                  </span>
                </div>

                {/* Counter offer */}
                {previewResult.counterOffer && (
                  <div className="mt-3 pt-3 border-t border-vct-gray/20">
                    <p className="text-vct-gray text-sm mb-2">Counter-offer:</p>
                    <div className="flex items-center justify-between">
                      <span className="text-vct-light text-sm">
                        {formatSalary(previewResult.counterOffer.salary)}/year +{' '}
                        {formatSalary(previewResult.counterOffer.signingBonus)} bonus,{' '}
                        {previewResult.counterOffer.yearsRemaining} year
                        {previewResult.counterOffer.yearsRemaining > 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={handleAcceptCounter}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500"
                      >
                        Use This
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Validation Errors */}
            {!canAfford && (
              <p className="text-red-400 text-sm">
                Insufficient funds for signing bonus.
              </p>
            )}
            {!hasRosterSpace && (
              <p className="text-red-400 text-sm">
                No roster space available in selected position.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-6 border-t border-vct-gray/20 flex justify-end gap-3">
          {!result?.success && (
            <>
              <button
                onClick={handlePreview}
                className="px-4 py-2 bg-vct-dark border border-vct-gray/30 text-vct-light
                           font-medium rounded hover:bg-vct-gray/20 transition-colors"
              >
                Preview Offer
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canAfford || !hasRosterSpace || isNegotiating}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded
                           hover:bg-green-500 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNegotiating ? 'Negotiating...' : 'Submit Offer'}
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vct-dark border border-vct-gray/30 text-vct-light
                       font-medium rounded hover:bg-vct-gray/20 transition-colors"
          >
            {result?.success ? 'Done' : 'Cancel'}
          </button>
        </div>

        {/* Rejection Message (at bottom for immediate feedback) */}
        {result && !result.success && (
          <div
            className="mx-6 mb-4 p-4 rounded-lg bg-red-900/30 border border-red-500/50"
          >
            <p className="font-medium text-red-400">
              Offer Rejected
            </p>
            {result.negotiationResult && (
              <p className="text-vct-gray text-sm mt-1">
                {result.negotiationResult.reason}
              </p>
            )}
            {result.error && !result.negotiationResult && (
              <p className="text-vct-gray text-sm mt-1">{result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
