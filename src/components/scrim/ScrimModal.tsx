// ScrimModal Component - Scrim session configuration (plan-confirm workflow)

import { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '../../store';
import { scrimService } from '../../services';
import type { TeamTier, ScrimIntensity } from '../../types';
import type { ScrimActivityConfig } from '../../types/activityPlan';
import { MAPS } from '../../utils/constants';

interface ScrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string; // Optional for backward compatibility during migration
  existingConfig?: ScrimActivityConfig;
  initialMaps?: string[];
  onScrimComplete?: (result: any) => void; // Deprecated, kept for backward compatibility
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

export function ScrimModal({ isOpen, onClose, eventId, existingConfig, initialMaps }: ScrimModalProps) {
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [selectedMaps, setSelectedMaps] = useState<Set<string>>(new Set());
  const [intensity, setIntensity] = useState<ScrimIntensity>('moderate');
  const [isSkipping, setIsSkipping] = useState(false);
  const [activeTier, setActiveTier] = useState<TeamTier>('T1');

  // Pre-populate form from existingConfig or initialMaps
  useEffect(() => {
    if (!isOpen) return;

    if (existingConfig) {
      // Load from existing config
      setIsSkipping(existingConfig.action === 'skip');
      if (existingConfig.action === 'play') {
        if (existingConfig.partnerTeamId) setSelectedPartner(existingConfig.partnerTeamId);
        if (existingConfig.maps) setSelectedMaps(new Set(existingConfig.maps));
        if (existingConfig.intensity) setIntensity(existingConfig.intensity);
      }
    } else if (initialMaps && initialMaps.length > 0) {
      // Pre-select maps when modal opens with initial maps
      setSelectedMaps(new Set(initialMaps.slice(0, 3)));
    }
  }, [isOpen, existingConfig, initialMaps]);

  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const setActivityConfig = useGameStore((state) => state.setActivityConfig);
  const updateEventLifecycleState = useGameStore((state) => state.updateEventLifecycleState);
  const calendar = useGameStore((state) => state.calendar);

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

  // Confirm scrim configuration (writes to activity plan store)
  const handleConfirm = () => {
    // For backward compatibility: if no eventId provided, do nothing
    // This allows old usages to continue working during migration
    if (!eventId) {
      handleClose();
      return;
    }

    // Get the event to extract the date
    const event = calendar.scheduledEvents.find((e) => e.id === eventId);
    if (!event) {
      console.error('Event not found:', eventId);
      return;
    }

    const config: ScrimActivityConfig = {
      type: 'scrim',
      id: existingConfig?.id ?? crypto.randomUUID(), // Reuse existing ID or generate new one
      date: event.date,
      eventId,
      status: 'configured',
      action: isSkipping ? 'skip' : 'play',
      autoConfigured: false,
    };

    if (!isSkipping) {
      // Validate play config
      if (!selectedPartner || selectedMaps.size === 0) return;

      config.partnerTeamId = selectedPartner;
      config.maps = Array.from(selectedMaps);
      config.intensity = intensity;
    }

    // Write config to store
    setActivityConfig(config);

    // Update event lifecycle state to 'configured'
    updateEventLifecycleState(eventId, 'configured');

    // Close modal
    handleClose();
  };

  // Reset and close
  const handleClose = () => {
    setSelectedPartner(null);
    setSelectedMaps(new Set());
    setIsSkipping(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-vct-light">Configure Scrim</h2>
            <p className="text-sm text-vct-gray">
              Practice against other teams
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
          {/* Scrim Configuration */}
          <div className="p-4 space-y-4">
            {/* Skip Scrim Toggle */}
            <div className="bg-vct-dark p-3 rounded-lg border border-vct-gray/20">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSkipping}
                  onChange={(e) => setIsSkipping(e.target.checked)}
                  className="w-4 h-4 rounded border-vct-gray/40 text-vct-red focus:ring-vct-red"
                />
                <div>
                  <span className="text-vct-light font-medium">Skip Scrim</span>
                  <p className="text-xs text-vct-gray">Team rests for a small morale boost</p>
                </div>
              </label>
            </div>

            {!isSkipping && (
              <>
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

                {/* Region Info */}
                <div className="text-xs text-vct-gray mb-2 flex items-center gap-2">
                  <span>📍</span>
                  <span>
                    Showing {playerTeam.region} teams only - scrims are region-restricted
                  </span>
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
                        disabled={!true}
                        className={`
                          p-3 rounded-lg border transition-all text-left
                          ${isSelected
                            ? 'border-vct-red bg-vct-red/10'
                            : true
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
                      No {TIER_LABELS[activeTier].label.toLowerCase()} available in {playerTeam.region}
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

              </>
            )}

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={!isSkipping && (!selectedPartner || selectedMaps.size === 0 || !true)}
              className="w-full py-3 bg-vct-red hover:bg-vct-red/80 disabled:bg-vct-gray/20 disabled:text-vct-gray text-white rounded-lg font-medium transition-colors"
            >
              {isSkipping
                ? 'Confirm Skip'
                : !true
                ? 'Weekly Limit Reached'
                : !selectedPartner
                ? 'Select a Partner'
                : selectedMaps.size === 0
                ? 'Select Maps to Practice'
                : `Confirm Scrim (${selectedMaps.size} map${selectedMaps.size > 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
