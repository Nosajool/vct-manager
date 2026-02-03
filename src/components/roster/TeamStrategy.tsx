// TeamStrategy - Configuration panel for team playstyle, economy, and composition
// Allows players to customize how their team plays matches

import { useState } from 'react';
import { useGameStore } from '../../store';
import { strategyService } from '../../services';
import type {
  TeamStrategy as TeamStrategyType,
  PlaystyleType,
  EconomyDiscipline,
  UltUsageStyle,
  CompositionRequirements,
} from '../../types';
import { AI_STRATEGY_PRESETS, getStrategyDisplayName } from '../../types/strategy';

interface TeamStrategyProps {
  teamId: string;
}

export function TeamStrategy({ teamId }: TeamStrategyProps) {
  const strategy = useGameStore((state) => state.getTeamStrategy(teamId));
  const team = useGameStore((state) => state.teams[teamId]);

  const [localStrategy, setLocalStrategy] = useState<TeamStrategyType>(strategy);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handlePlaystyleChange = (playstyle: PlaystyleType) => {
    setLocalStrategy((prev) => ({ ...prev, playstyle }));
    setHasChanges(true);
  };

  const handleDisciplineChange = (economyDiscipline: EconomyDiscipline) => {
    setLocalStrategy((prev) => ({ ...prev, economyDiscipline }));
    setHasChanges(true);
  };

  const handleUltStyleChange = (ultUsageStyle: UltUsageStyle) => {
    setLocalStrategy((prev) => ({ ...prev, ultUsageStyle }));
    setHasChanges(true);
  };

  const handleForceThresholdChange = (value: number) => {
    setLocalStrategy((prev) => ({ ...prev, forceThreshold: value }));
    setHasChanges(true);
  };

  const handleCompositionChange = (role: keyof CompositionRequirements, delta: number) => {
    setSaveError(null);
    setLocalStrategy((prev) => {
      const newComp = { ...prev.defaultComposition };
      const newValue = newComp[role] + delta;

      // Validate bounds
      if (newValue < 0 || newValue > 3) return prev;

      newComp[role] = newValue;
      return { ...prev, defaultComposition: newComp };
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    setSaveError(null);
    
    // Validate composition totals exactly 5 players
    const total = Object.values(localStrategy.defaultComposition).reduce((sum, v) => sum + v, 0);
    if (total !== 5) {
      setSaveError(`Composition must total exactly 5 players (currently ${total})`);
      return;
    }

    const success = strategyService.updateTeamStrategy(teamId, localStrategy);
    if (success) {
      setHasChanges(false);
    } else {
      setSaveError('Failed to save strategy');
    }
  };

  const handleReset = () => {
    strategyService.resetTeamStrategy(teamId);
    setLocalStrategy(strategyService.getTeamStrategy(teamId));
    setHasChanges(false);
  };

  const handleApplyPreset = (presetName: string) => {
    strategyService.applyPreset(teamId, presetName);
    setLocalStrategy(strategyService.getTeamStrategy(teamId));
    setHasChanges(false);
  };

  if (!team) {
    return (
      <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-8 text-center">
        <p className="text-vct-gray">Team not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-vct-light">{team.name} Strategy</h2>
          <p className="text-sm text-vct-gray">
            Configure how your team approaches matches
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-yellow-400">Unsaved changes</span>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded-lg transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 bg-vct-red hover:bg-vct-red/80 disabled:bg-vct-gray/30 disabled:text-vct-gray text-white rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {saveError && (
        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-sm">
          {saveError}
        </div>
      )}

      {/* Presets */}
      <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-vct-light mb-3">Quick Presets</h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(AI_STRATEGY_PRESETS).map((preset) => (
            <button
              key={preset}
              onClick={() => handleApplyPreset(preset)}
              className="px-3 py-1.5 bg-vct-gray/20 hover:bg-vct-red/30 text-vct-light text-sm rounded-lg transition-colors capitalize"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Playstyle */}
        <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-vct-light mb-1">Playstyle</h3>
          <p className="text-xs text-vct-gray mb-4">
            How aggressively your team plays rounds
          </p>
          <div className="space-y-2">
            <PlaystyleOption
              value="aggressive"
              label="Aggressive"
              description="Fast executes, early peeks, high tempo"
              selected={localStrategy.playstyle === 'aggressive'}
              onSelect={handlePlaystyleChange}
            />
            <PlaystyleOption
              value="balanced"
              label="Balanced"
              description="Adapts to situation, standard pace"
              selected={localStrategy.playstyle === 'balanced'}
              onSelect={handlePlaystyleChange}
            />
            <PlaystyleOption
              value="passive"
              label="Passive"
              description="Slow defaults, late rotates, holds angles"
              selected={localStrategy.playstyle === 'passive'}
              onSelect={handlePlaystyleChange}
            />
          </div>
        </div>

        {/* Economy Discipline */}
        <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-vct-light mb-1">Economy Discipline</h3>
          <p className="text-xs text-vct-gray mb-4">
            When to save vs force buy
          </p>
          <div className="space-y-2">
            <PlaystyleOption
              value="risky"
              label="Risky"
              description="Force buys often, aggressive spending"
              selected={localStrategy.economyDiscipline === 'risky'}
              onSelect={handleDisciplineChange}
            />
            <PlaystyleOption
              value="standard"
              label="Standard"
              description="Balanced eco management"
              selected={localStrategy.economyDiscipline === 'standard'}
              onSelect={handleDisciplineChange}
            />
            <PlaystyleOption
              value="conservative"
              label="Conservative"
              description="Save for full buys, disciplined"
              selected={localStrategy.economyDiscipline === 'conservative'}
              onSelect={handleDisciplineChange}
            />
          </div>
        </div>

        {/* Ultimate Usage */}
        <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-vct-light mb-1">Ultimate Usage</h3>
          <p className="text-xs text-vct-gray mb-4">
            When to use ultimates
          </p>
          <div className="space-y-2">
            <PlaystyleOption
              value="aggressive"
              label="Aggressive"
              description="Use ults as soon as available"
              selected={localStrategy.ultUsageStyle === 'aggressive'}
              onSelect={handleUltStyleChange}
            />
            <PlaystyleOption
              value="save_for_key_rounds"
              label="Save for Key Rounds"
              description="Hold for crucial rounds"
              selected={localStrategy.ultUsageStyle === 'save_for_key_rounds'}
              onSelect={handleUltStyleChange}
            />
            <PlaystyleOption
              value="combo_focused"
              label="Combo Focused"
              description="Stack multiple ults together"
              selected={localStrategy.ultUsageStyle === 'combo_focused'}
              onSelect={handleUltStyleChange}
            />
          </div>
        </div>

        {/* Force Buy Threshold */}
        <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-vct-light mb-1">Force Buy Threshold</h3>
          <p className="text-xs text-vct-gray mb-4">
            Minimum credits to consider force buying ({localStrategy.forceThreshold})
          </p>
          <input
            type="range"
            min="1000"
            max="4000"
            step="100"
            value={localStrategy.forceThreshold}
            onChange={(e) => handleForceThresholdChange(parseInt(e.target.value))}
            className="w-full h-2 bg-vct-gray/30 rounded-lg appearance-none cursor-pointer accent-vct-red"
          />
          <div className="flex justify-between text-xs text-vct-gray mt-2">
            <span>1000 (Risky)</span>
            <span>4000 (Safe)</span>
          </div>
        </div>
      </div>

      {/* Default Composition */}
      <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-vct-light mb-1">Default Composition</h3>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-vct-gray">
            Preferred role distribution
          </p>
          <div className={`text-sm font-medium ${
            Object.values(localStrategy.defaultComposition).reduce((sum, v) => sum + v, 0) === 5
              ? 'text-green-400'
              : 'text-yellow-400'
          }`}>
            Total: {Object.values(localStrategy.defaultComposition).reduce((sum, v) => sum + v, 0)} / 5
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RoleCounter
            role="Duelist"
            count={localStrategy.defaultComposition.duelist}
            color="text-red-400"
            onIncrement={() => handleCompositionChange('duelist', 1)}
            onDecrement={() => handleCompositionChange('duelist', -1)}
          />
          <RoleCounter
            role="Controller"
            count={localStrategy.defaultComposition.controller}
            color="text-purple-400"
            onIncrement={() => handleCompositionChange('controller', 1)}
            onDecrement={() => handleCompositionChange('controller', -1)}
          />
          <RoleCounter
            role="Initiator"
            count={localStrategy.defaultComposition.initiator}
            color="text-green-400"
            onIncrement={() => handleCompositionChange('initiator', 1)}
            onDecrement={() => handleCompositionChange('initiator', -1)}
          />
          <RoleCounter
            role="Sentinel"
            count={localStrategy.defaultComposition.sentinel}
            color="text-blue-400"
            onIncrement={() => handleCompositionChange('sentinel', 1)}
            onDecrement={() => handleCompositionChange('sentinel', -1)}
          />
        </div>
      </div>

      {/* Current Strategy Summary */}
      <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-vct-light mb-2">Current Strategy</h3>
        <p className="text-vct-gray">{getStrategyDisplayName(localStrategy)}</p>
      </div>
    </div>
  );
}

// Helper component for playstyle options
function PlaystyleOption<T extends string>({
  value,
  label,
  description,
  selected,
  onSelect,
}: {
  value: T;
  label: string;
  description: string;
  selected: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <button
      onClick={() => onSelect(value)}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        selected
          ? 'bg-vct-red/20 border-vct-red text-vct-light'
          : 'bg-vct-dark border-vct-gray/20 text-vct-gray hover:border-vct-gray/40'
      }`}
    >
      <div className="font-medium">{label}</div>
      <div className="text-xs opacity-80">{description}</div>
    </button>
  );
}

// Helper component for role counters
function RoleCounter({
  role,
  count,
  color,
  onIncrement,
  onDecrement,
}: {
  role: string;
  count: number;
  color: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="text-center">
      <div className={`text-sm font-medium ${color} mb-2`}>{role}</div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onDecrement}
          disabled={count <= 0}
          className="w-8 h-8 bg-vct-gray/20 hover:bg-vct-gray/30 disabled:opacity-30 disabled:cursor-not-allowed text-vct-light rounded-lg transition-colors"
        >
          -
        </button>
        <span className="text-xl font-bold text-vct-light w-6">{count}</span>
        <button
          onClick={onIncrement}
          disabled={count >= 3}
          className="w-8 h-8 bg-vct-gray/20 hover:bg-vct-gray/30 disabled:opacity-30 disabled:cursor-not-allowed text-vct-light rounded-lg transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
