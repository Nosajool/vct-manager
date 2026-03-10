// AgentPreferenceEditor - Modal for editing player agent preferences
// Allows setting preferred agents and roles for a player

import { useState } from 'react';
import { useGameStore } from '../../store';
import { strategyService } from '../../services';
import type { Player, PlayerAgentPreferences, AgentRole } from '../../types';
import { getAgentImageUrl } from '../../utils/imageAssets';
import { GameImage } from '../shared/GameImage';
import { COMPOSITION_CONSTANTS } from '../../engine/match/constants';

interface AgentPreferenceEditorProps {
  player: Player;
  onClose: () => void;
  onSave?: () => void;
}

const ROLE_COLORS: Record<AgentRole, string> = {
  Duelist: 'text-red-400',
  Initiator: 'text-green-400',
  Controller: 'text-purple-400',
  Sentinel: 'text-blue-400',
};

const ROLE_RING_COLORS: Record<AgentRole, string> = {
  Duelist: 'ring-red-400',
  Initiator: 'ring-green-400',
  Controller: 'ring-purple-400',
  Sentinel: 'ring-blue-400',
};

export function AgentPreferenceEditor({
  player,
  onClose,
  onSave,
}: AgentPreferenceEditorProps) {
  const existingPrefs = useGameStore((state) =>
    state.getPlayerAgentPreferences(player.id)
  );

  // Initialize with existing or generate defaults
  const [preferences, setPreferences] = useState<PlayerAgentPreferences>(() => {
    if (existingPrefs) return existingPrefs;
    return strategyService.generateDefaultPreferences(player);
  });

  const [activeSlot, setActiveSlot] = useState<0 | 1 | 2>(0);

  // Handle agent image click — assigns agent to active slot
  const handleAgentImageClick = (agent: string) => {
    const current = [...preferences.preferredAgents] as [string, string, string];
    const existingIndex = current.indexOf(agent) as -1 | 0 | 1 | 2;

    if (existingIndex === activeSlot) {
      // Already in active slot — do nothing
      return;
    }

    const newAgents = [...current] as [string, string, string];

    if (existingIndex !== -1) {
      // Agent is in another slot — swap
      newAgents[activeSlot] = agent;
      newAgents[existingIndex] = current[activeSlot];
    } else {
      // Assign agent to active slot
      newAgents[activeSlot] = agent;
    }

    setPreferences((prev) => ({ ...prev, preferredAgents: newAgents }));

    // Advance to next slot (capped at slot 2)
    setActiveSlot((prev) => (prev < 2 ? ((prev + 1) as 0 | 1 | 2) : 2));
  };

  // Handle slot tray click — makes that slot active
  const handleSlotClick = (slotIndex: 0 | 1 | 2) => {
    setActiveSlot(slotIndex);
  };

  // Handle clearing a specific slot
  const handleSlotClear = (slotIndex: 0 | 1 | 2) => {
    const current = [...preferences.preferredAgents] as [string, string, string];
    const otherAgents = current.filter((_, i) => i !== slotIndex);
    const allAgents = Object.keys(COMPOSITION_CONSTANTS.AGENT_ROLES);
    const fallback = allAgents.find((a) => !otherAgents.includes(a) && a !== current[slotIndex]);
    const newAgents = [...current] as [string, string, string];
    newAgents[slotIndex] = fallback ?? current[slotIndex];
    setPreferences((prev) => ({ ...prev, preferredAgents: newAgents }));
    setActiveSlot(slotIndex);
  };

  // Handle save — auto-derive primaryRole from first preferred agent
  const handleSave = () => {
    const derivedRole = (COMPOSITION_CONSTANTS.AGENT_ROLES as Record<string, AgentRole>)[preferences.preferredAgents[0]] ?? 'Duelist';
    strategyService.setPlayerAgentPreferences(player.id, {
      ...preferences,
      primaryRole: derivedRole,
    });
    onSave?.();
    onClose();
  };

  const topAgent = preferences.preferredAgents[0];
  const derivedRole = (COMPOSITION_CONSTANTS.AGENT_ROLES as Record<string, AgentRole>)[topAgent] ?? 'Duelist';

  // Active slot ring color based on slot-1 agent's role
  const activeSlotRingClass = `ring-2 ${ROLE_RING_COLORS[derivedRole]} bg-vct-dark shadow-[0_0_8px_rgba(0,0,0,0.4)]`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {topAgent && (
                <GameImage
                  src={getAgentImageUrl(topAgent)}
                  alt={topAgent}
                  className="w-10 h-10 object-cover rounded-lg"
                  fallbackClassName="w-10 h-10 rounded-lg"
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-vct-light">{player.name}</h2>
                <p className={`text-sm font-medium ${ROLE_COLORS[derivedRole]}`}>
                  {derivedRole} · {topAgent}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-vct-gray hover:text-vct-light transition-colors text-xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Priority Slot Tray */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-vct-gray mb-2">Tap a slot, then tap an agent to assign</p>
          <div className="flex gap-2">
            {([0, 1, 2] as const).map((slotIndex) => {
              const agent = preferences.preferredAgents[slotIndex];
              const isActive = activeSlot === slotIndex;

              return (
                <button
                  key={slotIndex}
                  onClick={() => handleSlotClick(slotIndex)}
                  className={`flex-1 relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all
                    ${isActive
                      ? activeSlotRingClass
                      : 'border-vct-gray/20 bg-vct-dark hover:border-vct-gray/40'
                    }`}
                >
                  <span className={`text-xs font-bold ${isActive ? ROLE_COLORS[derivedRole] : 'text-vct-gray'}`}>
                    #{slotIndex + 1}
                  </span>
                  <GameImage
                    src={getAgentImageUrl(agent)}
                    alt={agent}
                    className="w-10 h-10 object-cover rounded-md"
                    fallbackClassName="w-10 h-10 rounded-md"
                  />
                  <span className="text-xs text-vct-light text-center leading-tight w-full truncate">
                    {agent}
                  </span>
                  {/* Clear button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSlotClear(slotIndex);
                    }}
                    className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-vct-gray hover:text-vct-light transition-colors text-xs leading-none"
                    aria-label={`Clear slot ${slotIndex + 1}`}
                  >
                    ×
                  </button>
                </button>
              );
            })}
          </div>
        </div>

        {/* Agent Grid — grouped by role */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-4">
          {(Object.entries(COMPOSITION_CONSTANTS.AGENTS_BY_ROLE) as [AgentRole, readonly string[]][]).map(([role, agents]) => (
            <div key={role}>
              <p className={`text-xs font-semibold mb-2 ${ROLE_COLORS[role]}`}>{role}</p>
              <div className="grid grid-cols-3 gap-3">
                {agents.map((agent) => {
                  const rankIndex = preferences.preferredAgents.indexOf(agent);
                  const isSelected = rankIndex !== -1;
                  const mastery = existingPrefs?.agentMastery?.[agent] ?? 0;

                  return (
                    <button
                      key={agent}
                      onClick={() => handleAgentImageClick(agent)}
                      className={`relative flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all
                        ${isSelected
                          ? `border-transparent ring-2 ${ROLE_RING_COLORS[role]} bg-vct-dark`
                          : 'border-vct-gray/20 bg-vct-dark hover:border-vct-gray/40 opacity-60 hover:opacity-100'
                        }`}
                    >
                      {isSelected && (
                        <span className="absolute top-1.5 left-1.5 text-xs font-bold text-white bg-black/60 rounded px-1 leading-tight z-10">
                          #{rankIndex + 1}
                        </span>
                      )}
                      <GameImage
                        src={getAgentImageUrl(agent)}
                        alt={agent}
                        className="w-16 h-16 object-cover rounded-lg"
                        fallbackClassName="w-16 h-16 rounded-lg"
                      />
                      <span className="text-xs text-vct-light text-center leading-tight w-full truncate">
                        {agent}
                      </span>
                      <div className="w-full h-1 bg-vct-gray/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            mastery >= 80 ? 'bg-green-400'
                            : mastery >= 60 ? 'bg-yellow-400'
                            : mastery >= 30 ? 'bg-orange-400'
                            : 'bg-red-400'
                          }`}
                          style={{ width: `${mastery}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-vct-gray/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
