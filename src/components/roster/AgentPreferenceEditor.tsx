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

  // Handle primary role change
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

      // Remove new primary role from flex roles
      if (prev.flexRoles) {
        newPrefs.flexRoles = prev.flexRoles.filter((r) => r !== role);
      }

      return newPrefs;
    });
      };

  // Handle flex role toggle
  const handleFlexRoleToggle = (role: AgentRole) => {
    if (role === preferences.primaryRole) return; // Can't flex to primary

    setPreferences((prev) => {
      const currentFlex = prev.flexRoles || [];
      const newFlex = currentFlex.includes(role)
        ? currentFlex.filter((r) => r !== role)
        : [...currentFlex, role].slice(0, 2); // Max 2 flex roles

      return { ...prev, flexRoles: newFlex };
    });
      };

  // Handle agent image click (select/deselect)
  const handleAgentImageClick = (agent: string) => {
    setPreferences((prev) => {
      const current = [...prev.preferredAgents] as [string, string, string];
      const existingIndex = current.indexOf(agent);

      if (existingIndex !== -1) {
        // Deselect: remove and compact. Fill the 3rd slot with a fallback agent.
        const remaining = current.filter((a) => a !== agent);
        const fallback = primaryRoleAgents.find((a) => !remaining.includes(a) && a !== agent);
        const newAgents = [...remaining, fallback ?? remaining[0]] as [string, string, string];
        return { ...prev, preferredAgents: newAgents };
      } else {
        // Select: replace the 3rd slot (lowest priority)
        const newAgents = [current[0], current[1], agent] as [string, string, string];
        return { ...prev, preferredAgents: newAgents };
      }
    });
  };

  // Handle save
  const handleSave = () => {
    strategyService.setPlayerAgentPreferences(player.id, preferences);
        onSave?.();
    onClose();
  };

  // Get agents for current primary role
  const primaryRoleAgents = strategyService.getAgentsByRole(preferences.primaryRole);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-vct-light">{player.name}</h2>
              <p className="text-sm text-vct-gray">Agent Preferences</p>
            </div>
            <button
              onClick={onClose}
              className="text-vct-gray hover:text-vct-light transition-colors text-xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Primary Role */}
          <div>
            <h3 className="text-sm font-semibold text-vct-light mb-3">Primary Role</h3>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => handlePrimaryRoleChange(role)}
                  className={`p-3 rounded-lg border transition-colors ${
                    preferences.primaryRole === role
                      ? `${ROLE_COLORS[role]} border-2`
                      : 'bg-vct-dark border-vct-gray/20 text-vct-gray hover:border-vct-gray/40'
                  }`}
                >
                  <div className="font-medium">{role}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Flex Roles */}
          <div>
            <h3 className="text-sm font-semibold text-vct-light mb-2">Flex Roles</h3>
            <p className="text-xs text-vct-gray mb-3">
              Secondary roles this player can fill (max 2)
            </p>
            <div className="flex flex-wrap gap-2">
              {ROLES.filter((r) => r !== preferences.primaryRole).map((role) => {
                const isSelected = preferences.flexRoles?.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => handleFlexRoleToggle(role)}
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      isSelected
                        ? `${ROLE_COLORS[role]}`
                        : 'bg-vct-dark border-vct-gray/20 text-vct-gray hover:border-vct-gray/40'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Agents */}
          <div>
            <h3 className="text-sm font-semibold text-vct-light mb-2">Preferred Agents</h3>
            <p className="text-xs text-vct-gray mb-3">
              Top 3 agents for {preferences.primaryRole} role (in order of preference)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {primaryRoleAgents.map((agent) => {
                const rankIndex = preferences.preferredAgents.indexOf(agent);
                const isSelected = rankIndex !== -1;
                const mastery = existingPrefs?.agentMastery?.[agent] ?? 0;
                const roleColorRing: Record<AgentRole, string> = {
                  Duelist: 'ring-red-400',
                  Initiator: 'ring-green-400',
                  Controller: 'ring-purple-400',
                  Sentinel: 'ring-blue-400',
                };

                return (
                  <button
                    key={agent}
                    onClick={() => handleAgentImageClick(agent)}
                    className={`relative flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all
                      ${isSelected
                        ? `border-transparent ring-2 ${roleColorRing[preferences.primaryRole]} bg-vct-dark`
                        : 'border-vct-gray/20 bg-vct-dark hover:border-vct-gray/40 opacity-60 hover:opacity-100'
                      }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1 left-1 text-xs font-bold text-white bg-black/60 rounded px-1 leading-tight z-10">
                        #{rankIndex + 1}
                      </span>
                    )}
                    <GameImage
                      src={getAgentImageUrl(agent)}
                      alt={agent}
                      className="w-12 h-12 object-cover rounded"
                      fallbackClassName="w-12 h-12 rounded"
                    />
                    <span className="text-xs text-vct-light text-center leading-tight w-full truncate">
                      {agent}
                    </span>
                    {isSelected && existingPrefs && (
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
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player Stats Reference */}
          <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-vct-gray mb-2">Player Stats Reference</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <StatBadge label="Mechanics" value={player.stats.mechanics} />
              <StatBadge label="Entry" value={player.stats.entry} />
              <StatBadge label="Support" value={player.stats.support} />
              <StatBadge label="Clutch" value={player.stats.clutch} />
              <StatBadge label="IGL" value={player.stats.igl} />
              <StatBadge label="Mental" value={player.stats.mental} />
            </div>
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

// Helper component for stat badges
function StatBadge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80
      ? 'text-green-400'
      : value >= 60
      ? 'text-yellow-400'
      : 'text-vct-gray';

  return (
    <div className="flex justify-between">
      <span className="text-vct-gray">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}
