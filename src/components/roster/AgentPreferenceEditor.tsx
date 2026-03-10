// AgentPreferenceEditor - Modal for editing player agent preferences
// Allows setting preferred agents and roles for a player

import { useState } from 'react';
import { useGameStore } from '../../store';
import { strategyService } from '../../services';
import type { Player, PlayerAgentPreferences, AgentRole } from '../../types';
import { getAgentImageUrl } from '../../utils/imageAssets';
import { GameImage } from '../shared/GameImage';

interface AgentPreferenceEditorProps {
  player: Player;
  onClose: () => void;
  onSave?: () => void;
}

const ROLES: AgentRole[] = ['Duelist', 'Initiator', 'Controller', 'Sentinel'];

const ROLE_COLORS: Record<AgentRole, string> = {
  Duelist: 'text-red-400 border-red-400/30 bg-red-400/10',
  Initiator: 'text-green-400 border-green-400/30 bg-green-400/10',
  Controller: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  Sentinel: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
};

const ROLE_RING_COLORS: Record<AgentRole, string> = {
  Duelist: 'ring-red-400',
  Initiator: 'ring-green-400',
  Controller: 'ring-purple-400',
  Sentinel: 'ring-blue-400',
};

const ROLE_TAB_ACTIVE: Record<AgentRole, string> = {
  Duelist: 'bg-red-400/20 text-red-400 border-b-2 border-red-400',
  Initiator: 'bg-green-400/20 text-green-400 border-b-2 border-green-400',
  Controller: 'bg-purple-400/20 text-purple-400 border-b-2 border-purple-400',
  Sentinel: 'bg-blue-400/20 text-blue-400 border-b-2 border-blue-400',
};

const ROLE_SLOT_ACTIVE: Record<AgentRole, string> = {
  Duelist: 'ring-2 ring-red-400 bg-red-400/10 shadow-[0_0_8px_rgba(248,113,113,0.4)]',
  Initiator: 'ring-2 ring-green-400 bg-green-400/10 shadow-[0_0_8px_rgba(74,222,128,0.4)]',
  Controller: 'ring-2 ring-purple-400 bg-purple-400/10 shadow-[0_0_8px_rgba(192,132,252,0.4)]',
  Sentinel: 'ring-2 ring-blue-400 bg-blue-400/10 shadow-[0_0_8px_rgba(96,165,250,0.4)]',
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

  // Handle primary role change (via tab click)
  const handlePrimaryRoleChange = (role: AgentRole) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, primaryRole: role };

      // Update preferred agents to match the new role
      const roleAgents = strategyService.getAgentsByRole(role);
      newPrefs.preferredAgents = [
        roleAgents[0] || prev.preferredAgents[0],
        roleAgents[1] || prev.preferredAgents[1],
        roleAgents[2] || prev.preferredAgents[2],
      ] as [string, string, string];

      return newPrefs;
    });
    setActiveSlot(0);
  };

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
    const fallback = primaryRoleAgents.find((a) => !otherAgents.includes(a) && a !== current[slotIndex]);
    const newAgents = [...current] as [string, string, string];
    newAgents[slotIndex] = fallback ?? primaryRoleAgents[slotIndex] ?? current[slotIndex];
    setPreferences((prev) => ({ ...prev, preferredAgents: newAgents }));
    setActiveSlot(slotIndex);
  };

  // Handle save
  const handleSave = () => {
    strategyService.setPlayerAgentPreferences(player.id, preferences);
    onSave?.();
    onClose();
  };

  // Get agents for current primary role
  const primaryRoleAgents = strategyService.getAgentsByRole(preferences.primaryRole);
  const topAgent = preferences.preferredAgents[0];

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
                <p className={`text-sm font-medium ${ROLE_COLORS[preferences.primaryRole].split(' ')[0]}`}>
                  {preferences.primaryRole} · {topAgent}
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

        {/* Role Tabs */}
        <div className="flex border-b border-vct-gray/20">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => handlePrimaryRoleChange(role)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                preferences.primaryRole === role
                  ? ROLE_TAB_ACTIVE[role]
                  : 'text-vct-gray hover:text-vct-light'
              }`}
            >
              {role}
            </button>
          ))}
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
                      ? ROLE_SLOT_ACTIVE[preferences.primaryRole]
                      : 'border-vct-gray/20 bg-vct-dark hover:border-vct-gray/40'
                    }`}
                >
                  <span className={`text-xs font-bold ${isActive ? ROLE_COLORS[preferences.primaryRole].split(' ')[0] : 'text-vct-gray'}`}>
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

        {/* Agent Grid */}
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          <div className="grid grid-cols-3 gap-3">
            {primaryRoleAgents.map((agent) => {
              const rankIndex = preferences.preferredAgents.indexOf(agent);
              const isSelected = rankIndex !== -1;
              const mastery = existingPrefs?.agentMastery?.[agent] ?? 0;

              return (
                <button
                  key={agent}
                  onClick={() => handleAgentImageClick(agent)}
                  className={`relative flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all
                    ${isSelected
                      ? `border-transparent ring-2 ${ROLE_RING_COLORS[preferences.primaryRole]} bg-vct-dark`
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
