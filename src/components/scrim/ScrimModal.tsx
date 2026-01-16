// ScrimModal Component - Scrim session scheduling and results

import { useState, useMemo } from 'react';
import { useGameStore } from '../../store';
import { scrimService } from '../../services';
import type { TeamTier, ScrimIntensity, ScrimResult } from '../../types';
import { MAPS } from '../../utils/constants';
import { SCRIM_CONSTANTS } from '../../types/scrim';

interface ScrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrimComplete?: (result: ScrimResult) => void;
}

const SCRIM_INTENSITIES: { value: ScrimIntensity; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Lower improvement, preserves morale' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced practice session' },
  { value: 'competitive', label: 'Competitive', description: 'Higher improvement, may decrease morale' },
];

const TIER_LABELS: Record<TeamTier, { label: string; efficiency: string; color: string }> = {
  T1: { label: 'VCT Teams', efficiency: '100%', color: 'text-yellow-400' },
  T2: { label: 'Academy Teams', efficiency: '70%', color: 'text-blue-400' },
  T3: { label: 'Amateur Teams', efficiency: '40%', color: 'text-vct-gray' },
};

export function ScrimModal({ isOpen, onClose, onScrimComplete }: ScrimModalProps) {
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [selectedMaps, setSelectedMaps] = useState<Set<string>>(new Set());
  const [intensity, setIntensity] = useState<ScrimIntensity>('moderate');
  const [scrimResult, setScrimResult] = useState<ScrimResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeTier, setActiveTier] = useState<TeamTier>('T1');

  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const tierTeams = useGameStore((state) => state.tierTeams);

  // Get available partners organized by tier - must be before early returns
  const availablePartners = useMemo(() => {
    if (!playerTeamId) {
      return { T1: [], T2: [], T3: [] };
    }
    const partners = scrimService.getAvailablePartners();
    return {
      T1: partners.t1Teams,
      T2: partners.t2Teams,
      T3: partners.t3Teams,
    };
  }, [playerTeamId]);

  // Early returns after all hooks
  if (!isOpen) return null;

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;
  if (!playerTeam) return null;

  // Get weekly limit status
  const weeklyStatus = scrimService.checkWeeklyLimit();
  const scrimsRemaining = SCRIM_CONSTANTS.MAX_WEEKLY_SCRIMS - weeklyStatus.scrimsUsed;

  // Get relationship score for a partner
  const getRelationshipScore = (partnerId: string): number => {
    return playerTeam.scrimRelationships?.[partnerId]?.relationshipScore ?? 50;
  };

  // Toggle map selection (max 3)
  const toggleMap = (mapName: string) => {
    const newSelected = new Set(selectedMaps);
    if (newSelected.has(mapName)) {
      newSelected.delete(mapName);
    } else if (newSelected.size < 3) {
      newSelected.add(mapName);
    }
    setSelectedMaps(newSelected);
  };

  // Get map strength for player's team
  const getMapStrength = (mapName: string): number => {
    const mapPool = playerTeam.mapPool;
    if (!mapPool?.maps[mapName]) return 50;
    const attrs = mapPool.maps[mapName].attributes;
    return Math.round(
      (attrs.executes + attrs.retakes + attrs.utility +
        attrs.communication + attrs.mapControl + attrs.antiStrat) / 6
    );
  };

  // Run scrim
  const handleScrim = () => {
    if (!selectedPartner || selectedMaps.size === 0) return;

    setIsProcessing(true);
    const result = scrimService.scheduleScrim({
      partnerTeamId: selectedPartner,
      focusMaps: Array.from(selectedMaps),
      intensity,
      format: selectedMaps.size === 1 ? 'single_map' : selectedMaps.size === 3 ? 'best_of_3' : 'map_rotation',
    });

    if (result.success && result.result) {
      setScrimResult(result.result);
      setShowResults(true);
      onScrimComplete?.(result.result);
    }
    setIsProcessing(false);
  };

  // Reset and close
  const handleClose = () => {
    setSelectedPartner(null);
    setSelectedMaps(new Set());
    setScrimResult(null);
    setShowResults(false);
    onClose();
  };

  // Get team name for display
  const getPartnerName = (partnerId: string): string => {
    const t1Team = teams[partnerId];
    if (t1Team) return t1Team.name;
    const tierTeam = tierTeams[partnerId];
    if (tierTeam) return tierTeam.name;
    return 'Unknown Team';
  };

  // Calculate map wins/losses from results
  const getMapScore = (result: ScrimResult): { won: number; lost: number } => {
    let won = 0;
    let lost = 0;
    for (const map of result.maps) {
      if (map.winner === 'teamA') {
        won++;
      } else {
        lost++;
      }
    }
    return { won, lost };
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-vct-light">Schedule Scrim</h2>
            <p className="text-sm text-vct-gray">
              {weeklyStatus.canScrim
                ? `${scrimsRemaining} of ${SCRIM_CONSTANTS.MAX_WEEKLY_SCRIMS} scrims remaining this week`
                : 'Weekly scrim limit reached'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-vct-gray hover:text-vct-light transition-colors"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {showResults && scrimResult ? (
            /* Scrim Results */
            <div className="p-4">
              <h3 className="text-lg font-semibold text-vct-light mb-4">Scrim Complete!</h3>

              {/* Overall Result */}
              {(() => {
                const { won, lost } = getMapScore(scrimResult);
                return (
                  <div className="bg-vct-dark p-4 rounded-lg border border-vct-gray/20 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-vct-light font-medium">
                        vs {getPartnerName(scrimResult.partnerTeamId)}
                      </span>
                      <span className={`font-bold ${
                        won > lost ? 'text-green-400' :
                        won < lost ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {won} - {lost}
                      </span>
                    </div>
                    <div className="text-sm text-vct-gray">
                      Efficiency: {Math.round(scrimResult.efficiencyMultiplier * 100)}%
                    </div>
                  </div>
                );
              })()}

              {/* Map Results */}
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium text-vct-gray">Map Results</h4>
                {scrimResult.maps.map((mapResult, index) => (
                  <div
                    key={index}
                    className="bg-vct-dark p-3 rounded-lg border border-vct-gray/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-vct-light">{mapResult.map}</span>
                      <span className={mapResult.winner === 'teamA' ? 'text-green-400' : 'text-red-400'}>
                        {mapResult.teamAScore} - {mapResult.teamBScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Improvements */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Chemistry Change */}
                <div className="bg-vct-dark p-3 rounded-lg border border-vct-gray/20">
                  <h4 className="text-sm font-medium text-vct-gray mb-2">Chemistry</h4>
                  <span className={`text-lg font-bold ${
                    scrimResult.chemistryChange > 0 ? 'text-green-400' : scrimResult.chemistryChange < 0 ? 'text-red-400' : 'text-vct-gray'
                  }`}>
                    {scrimResult.chemistryBefore.toFixed(1)} → {(scrimResult.chemistryBefore + scrimResult.chemistryChange).toFixed(1)}
                  </span>
                </div>

                {/* Relationship Change */}
                <div className="bg-vct-dark p-3 rounded-lg border border-vct-gray/20">
                  <h4 className="text-sm font-medium text-vct-gray mb-2">Relationship</h4>
                  <span className={`text-lg font-bold ${
                    scrimResult.relationshipChange > 0 ? 'text-green-400' : scrimResult.relationshipChange < 0 ? 'text-red-400' : 'text-vct-gray'
                  }`}>
                    {scrimResult.relationshipBefore} → {scrimResult.relationshipBefore + scrimResult.relationshipChange}
                  </span>
                </div>
              </div>

              {/* Map Pool Improvements */}
              {Object.keys(scrimResult.mapImprovements).length > 0 && (
                <div className="bg-vct-dark p-3 rounded-lg border border-vct-gray/20 mb-4">
                  <h4 className="text-sm font-medium text-vct-gray mb-2">Map Improvements</h4>
                  {Object.entries(scrimResult.mapImprovements).map(([mapName, improvements]) => {
                    const beforeStats = scrimResult.mapStatsBefore[mapName];
                    return (
                      <div key={mapName} className="mb-2">
                        <span className="text-vct-light font-medium">{mapName}</span>
                        <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                          {Object.entries(improvements).map(([attr, changeValue]) => {
                            const change = changeValue as number;
                            const before = beforeStats?.[attr as keyof typeof beforeStats] ?? 0;
                            const after = before + change;
                            const hasChange = change !== 0;
                            return (
                              <span key={attr} className={hasChange ? 'text-green-400' : 'text-vct-gray'}>
                                {attr}: {before.toFixed(1)} → {after.toFixed(1)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Relationship Event */}
              {scrimResult.relationshipEvent && (
                <div className={`p-3 rounded-lg border mb-4 ${
                  scrimResult.relationshipEvent.relationshipChange > 0
                    ? 'border-green-400/30 bg-green-400/10'
                    : 'border-red-400/30 bg-red-400/10'
                }`}>
                  <p className={`text-sm ${
                    scrimResult.relationshipEvent.relationshipChange > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {scrimResult.relationshipEvent.description}
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            /* Scrim Configuration */
            <div className="p-4 space-y-4">
              {/* Partner Selection */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-vct-gray">Select Scrim Partner</h4>

                {/* Tier Tabs */}
                <div className="flex gap-2 mb-3">
                  {(['T1', 'T2', 'T3'] as TeamTier[]).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setActiveTier(tier)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        activeTier === tier
                          ? 'bg-vct-red text-white'
                          : 'bg-vct-dark text-vct-gray hover:text-vct-light'
                      }`}
                    >
                      {TIER_LABELS[tier].label} ({availablePartners[tier].length})
                    </button>
                  ))}
                </div>

                {/* Efficiency Info */}
                <div className="text-xs text-vct-gray mb-2">
                  {TIER_LABELS[activeTier].label} provide{' '}
                  <span className={TIER_LABELS[activeTier].color}>
                    {TIER_LABELS[activeTier].efficiency}
                  </span>{' '}
                  training efficiency
                </div>

                {/* Partner List */}
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {availablePartners[activeTier].map((partner) => {
                    const relationshipScore = getRelationshipScore(partner.id);
                    const isSelected = selectedPartner === partner.id;

                    return (
                      <button
                        key={partner.id}
                        onClick={() => setSelectedPartner(partner.id)}
                        disabled={!weeklyStatus.canScrim}
                        className={`
                          p-3 rounded-lg border transition-all text-left
                          ${isSelected
                            ? 'border-vct-red bg-vct-red/10'
                            : weeklyStatus.canScrim
                            ? 'border-vct-gray/20 bg-vct-dark hover:border-vct-gray/40'
                            : 'border-vct-gray/10 bg-vct-gray/5 opacity-50 cursor-not-allowed'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-vct-light">{partner.name}</p>
                            <p className="text-xs text-vct-gray">{partner.region}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${
                              relationshipScore >= 70 ? 'text-green-400' :
                              relationshipScore >= 40 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {relationshipScore}
                            </p>
                            <p className="text-xs text-vct-gray">Relationship</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {availablePartners[activeTier].length === 0 && (
                    <p className="text-vct-gray text-sm text-center py-4">
                      No {TIER_LABELS[activeTier].label.toLowerCase()} available
                    </p>
                  )}
                </div>
              </div>

              {/* Map Selection */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-vct-gray">
                  Select Maps (1-3) - {selectedMaps.size} selected
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {MAPS.map((mapName) => {
                    const isSelected = selectedMaps.has(mapName);
                    const strength = getMapStrength(mapName);

                    return (
                      <button
                        key={mapName}
                        onClick={() => toggleMap(mapName)}
                        disabled={!isSelected && selectedMaps.size >= 3}
                        className={`
                          p-2 rounded-lg border transition-all text-center
                          ${isSelected
                            ? 'border-vct-red bg-vct-red/10'
                            : selectedMaps.size >= 3
                            ? 'border-vct-gray/10 bg-vct-gray/5 opacity-50 cursor-not-allowed'
                            : 'border-vct-gray/20 bg-vct-dark hover:border-vct-gray/40'}
                        `}
                      >
                        <p className="font-medium text-vct-light text-sm">{mapName}</p>
                        <p className={`text-xs ${
                          strength >= 70 ? 'text-green-400' :
                          strength >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          Strength: {strength}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intensity Selection */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-vct-gray">Scrim Intensity</h4>
                <div className="grid grid-cols-3 gap-2">
                  {SCRIM_INTENSITIES.map((i) => (
                    <button
                      key={i.value}
                      onClick={() => setIntensity(i.value)}
                      className={`
                        p-2 rounded-lg border transition-colors text-center
                        ${intensity === i.value
                          ? 'border-vct-red bg-vct-red/10 text-vct-red'
                          : 'border-vct-gray/20 bg-vct-dark text-vct-light hover:border-vct-gray/40'}
                      `}
                    >
                      <p className="font-medium">{i.label}</p>
                      <p className="text-xs text-vct-gray mt-1">{i.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Scrim Button */}
              <button
                onClick={handleScrim}
                disabled={!selectedPartner || selectedMaps.size === 0 || !weeklyStatus.canScrim || isProcessing}
                className="w-full py-3 bg-vct-red hover:bg-vct-red/80 disabled:bg-vct-gray/20 disabled:text-vct-gray text-white rounded-lg font-medium transition-colors"
              >
                {isProcessing
                  ? 'Running Scrim...'
                  : !weeklyStatus.canScrim
                  ? 'Weekly Limit Reached'
                  : !selectedPartner
                  ? 'Select a Partner'
                  : selectedMaps.size === 0
                  ? 'Select Maps to Practice'
                  : `Start Scrim (${selectedMaps.size} map${selectedMaps.size > 1 ? 's' : ''})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
