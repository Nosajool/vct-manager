// ContractNegotiationModal - Interface for negotiating contracts with free agents

import { useState, useMemo } from 'react';
import type { Player, Team } from '../../types';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl } from '../../utils/imageAssets';
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
import { freeAgentInterestService } from '../../services/FreeAgentInterestService';
import { freeAgentInterestEngine } from '../../engine/player/FreeAgentInterestEngine';
import { useGameStore } from '../../store';

interface ContractNegotiationModalProps {
  player: Player;
  team: Team;
  onClose: () => void;
  onSuccess?: () => void;
}

function getPriorityLabel(value: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (value > 70) return 'HIGH';
  if (value < 40) return 'LOW';
  return 'MEDIUM';
}

function getPriorityColor(label: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  if (label === 'HIGH') return 'text-red-400';
  if (label === 'LOW') return 'text-blue-400';
  return 'text-vct-gray';
}

function getTopPriorityName(prefs: Player['preferences']): string {
  const vals = [
    { name: 'Salary', value: prefs.salaryImportance },
    { name: 'Team Quality', value: prefs.teamQualityImportance },
    { name: 'Region', value: prefs.regionLoyalty },
  ];
  return vals.reduce((a, b) => (a.value >= b.value ? a : b)).name;
}

export function ContractNegotiationModal({
  player,
  team,
  onClose,
  onSuccess,
}: ContractNegotiationModalProps) {
  // Always use latest store data so outreach updates are reflected immediately
  const latestPlayer = useGameStore((state) => state.players[player.id]) ?? player;
  const overall = playerGenerator.calculateOverall(latestPlayer.stats);

  const salaryExpectation = useMemo(
    () => contractService.getSalaryExpectation(latestPlayer.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [latestPlayer.id, latestPlayer.preferences.salaryImportance]
  );

  // Form state
  const [salary, setSalary] = useState(salaryExpectation?.expected || 100000);
  const [signingBonus, setSigningBonus] = useState(0);
  const [years, setYears] = useState(2);
  const isRosterFull = team.playerIds.length >= 5;
  const [position, setPosition] = useState<'active' | 'reserve'>(isRosterFull ? 'reserve' : 'active');

  // Negotiation state
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [result, setResult] = useState<SigningResult | null>(null);
  const [previewResult, setPreviewResult] = useState<NegotiationResult | null>(null);
  const [outreachMessage, setOutreachMessage] = useState<string | null>(null);

  // Free agent state
  const currentDate = useGameStore((state) => state.calendar.currentDate);
  const isFreeAgent = latestPlayer.teamId === null;
  const isOnCooldown = isFreeAgent
    ? freeAgentInterestService.isOnCooldown(latestPlayer.id, team.id, currentDate)
    : false;

  const cooldownDaysRemaining = useMemo(() => {
    if (!isFreeAgent || !isOnCooldown) return 0;
    const cooldownExpiry = latestPlayer.offerCooldowns?.[team.id];
    if (!cooldownExpiry) return 0;
    const diff = new Date(cooldownExpiry).getTime() - new Date(currentDate).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [isFreeAgent, isOnCooldown, latestPlayer.offerCooldowns, team.id, currentDate]);

  // Outreach tracking
  const outreachActions = latestPlayer.outreachActions?.[team.id] ?? [];
  const outreachSpend = latestPlayer.outreachSpend?.[team.id] ?? 0;
  const currentInterest = latestPlayer.teamInterests?.[team.id];

  const hasBackchannelInquiry = outreachActions.includes('backchannel_inquiry');
  const hasPhoneCall = outreachActions.includes('phone_call');
  const hasPlayerDms = outreachActions.includes('player_dms');
  const hasTrialSession = outreachActions.includes('trial_session');
  const hasCoachVisionPitch = outreachActions.includes('coach_vision_pitch');
  const hasFacilityTour = outreachActions.includes('facility_tour');

  const tier1Done = hasPhoneCall || hasPlayerDms;
  const tier2Done = hasTrialSession || hasCoachVisionPitch;

  // Cold offer penalty level (for warning display)
  const coldPenalty = outreachSpend >= 25000 ? 0
    : outreachSpend >= 10000 ? 5
    : (outreachSpend >= 1 || hasPlayerDms) ? 10
    : 20;

  // Connection info for Player DMs action
  const connectionInfo = useMemo(
    () => freeAgentInterestService.hasPlayerConnection(latestPlayer.id, team.id),
    [latestPlayer.id, team.id]
  );

  // Minimum acceptable salary range — only after Tier 1
  const minimumSalaryRange = useMemo(() => {
    if (!isFreeAgent || !tier1Done) return null;
    const interest = freeAgentInterestService.getInterest(latestPlayer.id, team.id);
    return freeAgentInterestEngine.getMinimumAcceptableOffer(
      latestPlayer,
      team,
      interest,
      (offer) => contractService.evaluateOffer(latestPlayer.id, team.id, offer)?.factors.overallScore ?? 0
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFreeAgent, latestPlayer.id, team.id, outreachSpend, tier1Done, outreachActions.length]);

  const formatSalary = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const canAfford = team.finances.balance >= signingBonus;
  const hasRosterSpace =
    position === 'active'
      ? team.playerIds.length < 5
      : team.playerIds.length + team.reservePlayerIds.length < 10;

  const handleOutreach = (actionName: string, cost: number, delta: number) => {
    const outreachResult = freeAgentInterestService.applyOutreach(
      latestPlayer.id, team.id, actionName, delta, cost
    );
    if (!outreachResult.alreadyDone) {
      setOutreachMessage(outreachResult.flavorText);
      setPreviewResult(null); // Invalidate preview since scores changed
      setTimeout(() => setOutreachMessage(null), 3000);
    }
  };

  const handlePreview = () => {
    const offer: ContractOffer = {
      salary,
      signingBonus,
      yearsRemaining: years,
      bonusPerWin: Math.round(salary * 0.01),
    };
    const preview = contractService.evaluateOffer(latestPlayer.id, team.id, offer);
    setPreviewResult(preview);
  };

  const handleSubmit = () => {
    setIsNegotiating(true);
    const offer: ContractOffer = {
      salary,
      signingBonus,
      yearsRemaining: years,
      bonusPerWin: Math.round(salary * 0.01),
    };
    const signingResult = contractService.signPlayer(latestPlayer.id, team.id, offer, position);
    setResult(signingResult);
    setIsNegotiating(false);
    if (signingResult.success && onSuccess) {
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    }
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

  const salaryImpLabel = getPriorityLabel(latestPlayer.preferences.salaryImportance);
  const teamQualLabel = getPriorityLabel(latestPlayer.preferences.teamQualityImportance);
  const regionLabel = getPriorityLabel(latestPlayer.preferences.regionLoyalty);

  const interestLabel = currentInterest === undefined ? '?'
    : currentInterest >= 70 ? 'High'
    : currentInterest >= 45 ? 'Moderate'
    : 'Low';

  const interestColor = currentInterest === undefined ? 'text-vct-gray'
    : currentInterest >= 70 ? 'text-green-400'
    : currentInterest >= 45 ? 'text-yellow-400'
    : 'text-red-400';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-vct-gray/20">
          <div className="flex items-center gap-4">
            <GameImage
              src={getPlayerImageUrl(latestPlayer.name)}
              alt={latestPlayer.name}
              className="w-14 h-14 rounded-full object-cover"
            />
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
              <h2 className="text-xl font-bold text-vct-light">{latestPlayer.name}</h2>
              <p className="text-vct-gray text-sm">
                {latestPlayer.age} years · {latestPlayer.nationality}
              </p>
              <p className="text-vct-red text-sm">{latestPlayer.region}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-vct-gray hover:text-vct-light transition-colors text-2xl">
            ×
          </button>
        </div>

        {/* Success message */}
        {result?.success && (
          <div className="mx-6 mt-4 p-4 rounded-lg bg-green-900/30 border border-green-500/50">
            <p className="font-medium text-green-400">Contract Signed!</p>
            {result.negotiationResult && (
              <p className="text-vct-gray text-sm mt-1">{result.negotiationResult.reason}</p>
            )}
          </div>
        )}

        {!result?.success && (
          <div className="p-6 space-y-5">

            {/* Cold offer warning */}
            {isFreeAgent && !isOnCooldown && coldPenalty >= 15 && (
              <div className="p-3 rounded-lg bg-orange-900/20 border border-orange-500/40 flex items-start gap-2">
                <span className="text-orange-400 text-sm font-medium">Cold Offer Warning</span>
                <span className="text-vct-gray text-sm">
                  — No outreach done. Player will be much harder to sign (-{coldPenalty} to offer score).
                </span>
              </div>
            )}
            {isFreeAgent && !isOnCooldown && coldPenalty > 0 && coldPenalty < 15 && (
              <div className="p-3 rounded-lg bg-yellow-900/15 border border-yellow-500/30">
                <span className="text-yellow-400 text-sm">Limited outreach — offer score penalized (-{coldPenalty}).</span>
              </div>
            )}

            {/* Player priorities */}
            <div className="bg-vct-dark rounded-lg p-4">
              <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
                Player Priorities
              </h3>

              {/* Backchannel info: interest + top priority */}
              {isFreeAgent && hasBackchannelInquiry && currentInterest !== undefined && (
                <div className="mb-3 pb-3 border-b border-vct-gray/20 flex items-center justify-between">
                  <span className="text-vct-gray text-xs">Interest Level</span>
                  <span className={`text-sm font-medium ${interestColor}`}>
                    {interestLabel} ({Math.round(currentInterest)}/100)
                  </span>
                </div>
              )}
              {isFreeAgent && hasBackchannelInquiry && (
                <div className="mb-3 pb-3 border-b border-vct-gray/20 flex items-center justify-between">
                  <span className="text-vct-gray text-xs">Top Priority</span>
                  <span className="text-sm font-medium text-vct-light">
                    {getTopPriorityName(latestPlayer.preferences)}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {/* Salary priority */}
                <div className="flex items-center justify-between">
                  <span className="text-vct-gray text-xs">Salary Importance</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${getPriorityColor(salaryImpLabel)}`}>
                      {salaryImpLabel}
                    </span>
                    {hasPhoneCall && salaryExpectation ? (
                      <span className="text-xs text-vct-gray">
                        ({formatSalary(salaryExpectation.minimum)}–{formatSalary(salaryExpectation.maximum)})
                      </span>
                    ) : isFreeAgent ? (
                      <span className="text-xs text-vct-gray/50 italic">
                        Phone Call to reveal range
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Team quality priority */}
                <div className="flex items-center justify-between">
                  <span className="text-vct-gray text-xs">Team Quality</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${getPriorityColor(teamQualLabel)}`}>
                      {teamQualLabel}
                    </span>
                    {(hasTrialSession || hasCoachVisionPitch) ? (
                      <span className="text-xs text-vct-gray">
                        (requirement visible)
                        {hasCoachVisionPitch && (
                          <span className="text-green-400/70"> ·coach pitch +5</span>
                        )}
                      </span>
                    ) : isFreeAgent ? (
                      <span className="text-xs text-vct-gray/50 italic">
                        Trial/Coach Pitch to reveal
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Region loyalty */}
                <div className="flex items-center justify-between">
                  <span className="text-vct-gray text-xs">Region Loyalty</span>
                  <span className={`text-xs font-bold ${getPriorityColor(regionLabel)}`}>
                    {regionLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Outreach actions — only for free agents not on cooldown */}
            {isFreeAgent && !isOnCooldown && (
              <div className="bg-vct-dark rounded-lg p-4">
                <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
                  Outreach Actions
                </h3>
                {outreachMessage && (
                  <p className="mb-3 text-sm text-blue-400">{outreachMessage}</p>
                )}

                <div className="space-y-3">
                  {/* Scout tier */}
                  <div>
                    <p className="text-xs text-vct-gray/60 mb-1">Scout</p>
                    <div className="flex flex-wrap gap-2">
                      <OutreachButton
                        label="Backchannel Inquiry"
                        cost={2000}
                        done={hasBackchannelInquiry}
                        unlocks="interest level + top priority"
                        onClick={() => handleOutreach('backchannel_inquiry', 2000, 3)}
                      />
                    </div>
                  </div>

                  {/* Tier 1 */}
                  <div>
                    <p className="text-xs text-vct-gray/60 mb-1">Tier 1</p>
                    <div className="flex flex-wrap gap-2">
                      <OutreachButton
                        label="Phone Call"
                        cost={5000}
                        done={hasPhoneCall}
                        unlocks="salary range"
                        onClick={() => handleOutreach('phone_call', 5000, 8)}
                      />
                      {connectionInfo.connected ? (
                        <OutreachButton
                          label={`Player DMs (${connectionInfo.connectionCount} connection${connectionInfo.connectionCount > 1 ? 's' : ''})`}
                          cost={0}
                          done={hasPlayerDms}
                          unlocks="relationship boost"
                          onClick={() => handleOutreach(
                            'player_dms', 0,
                            connectionInfo.hasFavoriteConnection ? 15 : 10
                          )}
                        />
                      ) : (
                        <button
                          disabled
                          className="px-3 py-2 bg-vct-darker/50 border border-vct-gray/15 text-vct-gray/40 text-xs rounded cursor-not-allowed"
                          title="No mutual connections on current roster"
                        >
                          Player DMs — No connections
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tier 2 */}
                  <div>
                    <p className="text-xs text-vct-gray/60 mb-1">
                      Tier 2 {!tier1Done && <span className="text-vct-gray/40">(requires Tier 1)</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <OutreachButton
                        label="Trial Session"
                        cost={10000}
                        done={hasTrialSession}
                        disabled={!tier1Done}
                        unlocks="team quality requirement"
                        onClick={() => handleOutreach('trial_session', 10000, 15)}
                      />
                      <OutreachButton
                        label="Coach Vision Pitch"
                        cost={15000}
                        done={hasCoachVisionPitch}
                        disabled={!tier1Done}
                        unlocks="team quality + softens deficit"
                        onClick={() => handleOutreach('coach_vision_pitch', 15000, 12)}
                      />
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div>
                    <p className="text-xs text-vct-gray/60 mb-1">
                      Tier 3 {!tier2Done && <span className="text-vct-gray/40">(requires Tier 2)</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <OutreachButton
                        label="Facility Tour"
                        cost={25000}
                        done={hasFacilityTour}
                        disabled={!tier2Done}
                        unlocks="acceptance indicator"
                        onClick={() => handleOutreach('facility_tour', 25000, 25)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contract form */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">
                Your Offer
              </h3>

              {/* Salary */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-vct-gray">Annual Salary</label>
                  {salaryExpectation && (
                    <span className={`text-sm ${getSalaryColor(salary, salaryExpectation)}`}>
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
                    onChange={(e) => { setSalary(Number(e.target.value)); setPreviewResult(null); }}
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
                    onChange={(e) => { setSigningBonus(Number(e.target.value)); setPreviewResult(null); }}
                    className="flex-1 accent-vct-red"
                  />
                  <span className="w-24 text-right text-vct-light font-medium">
                    {formatSalary(signingBonus)}
                  </span>
                </div>
              </div>

              {/* Contract length */}
              <div>
                <label className="text-sm text-vct-gray block mb-1">Contract Length</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((y) => (
                    <button
                      key={y}
                      onClick={() => { setYears(y); setPreviewResult(null); }}
                      className={`px-4 py-2 rounded font-medium transition-colors ${
                        years === y ? 'bg-vct-red text-white' : 'bg-vct-dark text-vct-gray hover:text-vct-light'
                      }`}
                    >
                      {y} Year{y > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position — only shown when active roster has room */}
              {!isRosterFull && (
                <div>
                  <label className="text-sm text-vct-gray block mb-1">Roster Position</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPosition('active')}
                      className={`px-4 py-2 rounded font-medium transition-colors ${
                        position === 'active' ? 'bg-vct-red text-white' : 'bg-vct-dark text-vct-gray hover:text-vct-light'
                      }`}
                    >
                      Active ({team.playerIds.length}/5)
                    </button>
                    <button
                      onClick={() => setPosition('reserve')}
                      className={`px-4 py-2 rounded font-medium transition-colors ${
                        position === 'reserve' ? 'bg-vct-red text-white' : 'bg-vct-dark text-vct-gray hover:text-vct-light'
                      }`}
                    >
                      Reserve ({team.reservePlayerIds.length})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Offer summary */}
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
                    {signingBonus > 0 ? formatSalary(signingBonus) : '—'}
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
                  <p className={`font-medium ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                    {formatSalary(team.finances.balance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Minimum acceptable salary range — only shown after Tier 1 */}
            {isFreeAgent && tier1Done && minimumSalaryRange && (
              <div className="bg-vct-dark rounded-lg p-4">
                <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-2">
                  Estimated Minimum
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-vct-light">
                    ~{formatSalary(minimumSalaryRange.minSalary)}–{formatSalary(minimumSalaryRange.maxSalary)}/year
                  </span>
                  <button
                    onClick={() => {
                      setSalary(minimumSalaryRange.maxSalary);
                      setPreviewResult(null);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500"
                  >
                    Use Upper Bound
                  </button>
                </div>
                <p className="text-vct-gray/60 text-xs mt-1">
                  Includes current outreach level, team quality, and region factors.
                </p>
              </div>
            )}
            {isFreeAgent && tier1Done && !minimumSalaryRange && (
              <div className="bg-vct-dark rounded-lg p-4">
                <p className="text-vct-gray text-sm">
                  No offer in range accepted — player's interest is too low.
                </p>
              </div>
            )}

            {/* Acceptance indicator — only shown if Facility Tour done */}
            {isFreeAgent && previewResult && (
              <div className={`p-4 rounded-lg ${
                previewResult.accepted
                  ? 'bg-green-900/20 border border-green-500/30'
                  : 'bg-red-900/20 border border-red-500/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-vct-gray text-sm">Offer Prediction:</span>
                  <span className={`font-bold ${previewResult.accepted ? 'text-green-400' : 'text-red-400'}`}>
                    {hasFacilityTour
                      ? previewResult.acceptanceIndicator
                      : previewResult.accepted ? 'Will Accept' : 'Will Reject'
                    }
                  </span>
                </div>
                {!hasFacilityTour && !previewResult.accepted && (
                  <p className="text-vct-gray/60 text-xs mb-2 italic">
                    Do a Facility Tour to reveal acceptance likelihood.
                  </p>
                )}
              </div>
            )}
            {isFreeAgent && !previewResult && hasFacilityTour && (
              <div className="p-3 rounded-lg bg-vct-dark border border-vct-gray/20">
                <p className="text-vct-gray text-sm">
                  Preview your offer to see acceptance likelihood.
                </p>
              </div>
            )}

            {/* Validation errors */}
            {!canAfford && (
              <p className="text-red-400 text-sm">Insufficient funds for signing bonus.</p>
            )}
            {!hasRosterSpace && (
              <p className="text-red-400 text-sm">No roster space in selected position.</p>
            )}
            {isFreeAgent && isOnCooldown && (
              <p className="text-yellow-400 text-sm">
                Not accepting offers right now. Check back in {cooldownDaysRemaining} day{cooldownDaysRemaining !== 1 ? 's' : ''}.
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
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
                disabled={!canAfford || !hasRosterSpace || isNegotiating || (isFreeAgent && isOnCooldown)}
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

        {/* Rejection message with hint */}
        {result && !result.success && result.negotiationResult && (
          <div className="mx-6 mb-4 p-4 rounded-lg bg-red-900/30 border border-red-500/50">
            <p className="font-medium text-red-400">Offer Rejected</p>
            <p className="text-vct-gray text-sm mt-1">{result.negotiationResult.reason}</p>
            {result.negotiationResult.rejectionHint && (
              <p className="text-vct-gray/80 text-sm mt-2 italic">
                "{result.negotiationResult.rejectionHint}"
              </p>
            )}
          </div>
        )}
        {result && !result.success && !result.negotiationResult && result.error && (
          <div className="mx-6 mb-4 p-4 rounded-lg bg-red-900/30 border border-red-500/50">
            <p className="font-medium text-red-400">Error</p>
            <p className="text-vct-gray text-sm mt-1">{result.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Small helper component for outreach buttons
function OutreachButton({
  label,
  cost,
  done,
  disabled = false,
  unlocks,
  onClick,
}: {
  label: string;
  cost: number;
  done: boolean;
  disabled?: boolean;
  unlocks: string;
  onClick: () => void;
}) {
  const formatCost = (c: number) => c === 0 ? 'Free' : `$${c / 1000}K`;

  if (done) {
    return (
      <div className="px-3 py-2 bg-green-900/20 border border-green-500/30 text-green-400 text-xs rounded flex items-center gap-1">
        <span>✓</span>
        <span>{label}</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={`Unlocks: ${unlocks}`}
      className={`px-3 py-2 border text-xs rounded transition-colors ${
        disabled
          ? 'bg-vct-darker/50 border-vct-gray/15 text-vct-gray/40 cursor-not-allowed'
          : 'bg-vct-darker border-vct-gray/30 text-vct-light hover:bg-vct-gray/20'
      }`}
    >
      {label} ({formatCost(cost)})
    </button>
  );
}
