// MatchStrategyEditor - Modal for customizing strategy for a specific match
// Allows overriding team's default strategy before match simulation

import { useState, useEffect } from 'react';
import { useGameStore } from '../../store';
import type {
  TeamStrategy,
  PlaystyleType,
  EconomyDiscipline,
  UltUsageStyle,
  Match,
} from '../../types';
import { AI_STRATEGY_PRESETS, validateStrategy } from '../../types/strategy';

interface MatchStrategyEditorProps {
  match: Match;
  onClose: () => void;
}

export function MatchStrategyEditor({ match, onClose }: MatchStrategyEditorProps) {
  const team = useGameStore((state) => state.teams[match.teamAId]);
  const opponent = useGameStore((state) => state.teams[match.teamBId]);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const getTeamStrategy = useGameStore((state) => state.getTeamStrategy);
  const getMatchStrategy = useGameStore((state) => state.getMatchStrategy);
  const setMatchStrategy = useGameStore((state) => state.setMatchStrategy);
  const deleteMatchStrategy = useGameStore((state) => state.deleteMatchStrategy);

  // Determine which team is player's team
  const isTeamAPlayerTeam = match.teamAId === playerTeamId;
  const playerTeam = isTeamAPlayerTeam ? team : opponent;
  const opponentTeam = isTeamAPlayerTeam ? opponent : team;

  if (!playerTeam || !opponentTeam || !playerTeamId) {
    return null;
  }

  // Get current strategy (match override or team default)
  const matchSnapshot = getMatchStrategy(match.id, playerTeamId);
  const defaultStrategy = getTeamStrategy(playerTeamId);
  const initialStrategy = matchSnapshot?.strategy ?? defaultStrategy;
  const isCustomized = matchSnapshot !== undefined;

  const [localStrategy, setLocalStrategy] = useState<TeamStrategy>(initialStrategy);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update local strategy when match changes
  useEffect(() => {
    const snapshot = getMatchStrategy(match.id, playerTeamId);
    const strategy = snapshot?.strategy ?? getTeamStrategy(playerTeamId);
    setLocalStrategy(strategy);
    setHasChanges(false);
  }, [match.id, playerTeamId, getMatchStrategy, getTeamStrategy]);

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

  const handleSave = () => {
    setSaveError(null);

    if (!validateStrategy(localStrategy)) {
      setSaveError('Invalid strategy configuration');
      return;
    }

    setMatchStrategy(match.id, playerTeamId, localStrategy);
    setHasChanges(false);
    onClose();
  };

  const handleResetToDefault = () => {
    deleteMatchStrategy(match.id);
    setLocalStrategy(getTeamStrategy(playerTeamId));
    setHasChanges(false);
  };

  const handleApplyPreset = (presetName: string) => {
    const preset = AI_STRATEGY_PRESETS[presetName];
    if (preset) {
      setLocalStrategy((prev) => ({ ...prev, ...preset }));
      setHasChanges(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-vct-darker border-b border-vct-gray/20 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-vct-light">Match Strategy</h2>
            <p className="text-sm text-vct-gray">
              {playerTeam.name} vs {opponentTeam.name}
            </p>
            {isCustomized && !hasChanges && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                Custom Strategy Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-yellow-400">Unsaved changes</span>
            )}
            {isCustomized && (
              <button
                onClick={handleResetToDefault}
                className="px-3 py-1.5 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light text-sm rounded-lg transition-colors"
              >
                Reset to Team Default
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-2 bg-vct-red hover:bg-vct-red/80 disabled:bg-vct-gray/30 disabled:text-vct-gray text-white rounded-lg transition-colors"
            >
              Save Strategy
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Playstyle */}
            <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-vct-light mb-1">Playstyle</h3>
              <p className="text-xs text-vct-gray mb-3">Round tempo and aggression</p>
              <div className="space-y-2">
                <StrategyOption
                  value="aggressive"
                  label="Aggressive"
                  description="Fast executes, early peeks"
                  selected={localStrategy.playstyle === 'aggressive'}
                  onSelect={handlePlaystyleChange}
                />
                <StrategyOption
                  value="balanced"
                  label="Balanced"
                  description="Adapts to situation"
                  selected={localStrategy.playstyle === 'balanced'}
                  onSelect={handlePlaystyleChange}
                />
                <StrategyOption
                  value="passive"
                  label="Passive"
                  description="Slow defaults, holds angles"
                  selected={localStrategy.playstyle === 'passive'}
                  onSelect={handlePlaystyleChange}
                />
              </div>
            </div>

            {/* Economy Discipline */}
            <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-vct-light mb-1">Economy</h3>
              <p className="text-xs text-vct-gray mb-3">Save vs force buy decisions</p>
              <div className="space-y-2">
                <StrategyOption
                  value="risky"
                  label="Risky"
                  description="Force buys often"
                  selected={localStrategy.economyDiscipline === 'risky'}
                  onSelect={handleDisciplineChange}
                />
                <StrategyOption
                  value="standard"
                  label="Standard"
                  description="Balanced eco management"
                  selected={localStrategy.economyDiscipline === 'standard'}
                  onSelect={handleDisciplineChange}
                />
                <StrategyOption
                  value="conservative"
                  label="Conservative"
                  description="Save for full buys"
                  selected={localStrategy.economyDiscipline === 'conservative'}
                  onSelect={handleDisciplineChange}
                />
              </div>
            </div>

            {/* Ultimate Usage */}
            <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-vct-light mb-1">Ultimate Usage</h3>
              <p className="text-xs text-vct-gray mb-3">When to use ultimates</p>
              <div className="space-y-2">
                <StrategyOption
                  value="aggressive"
                  label="Aggressive"
                  description="Use ults early"
                  selected={localStrategy.ultUsageStyle === 'aggressive'}
                  onSelect={handleUltStyleChange}
                />
                <StrategyOption
                  value="save_for_key_rounds"
                  label="Key Rounds"
                  description="Hold for crucial rounds"
                  selected={localStrategy.ultUsageStyle === 'save_for_key_rounds'}
                  onSelect={handleUltStyleChange}
                />
                <StrategyOption
                  value="combo_focused"
                  label="Combo Focused"
                  description="Stack multiple ults"
                  selected={localStrategy.ultUsageStyle === 'combo_focused'}
                  onSelect={handleUltStyleChange}
                />
              </div>
            </div>

            {/* Force Buy Threshold */}
            <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-vct-light mb-1">Force Buy Threshold</h3>
              <p className="text-xs text-vct-gray mb-3">
                Min credits to force ({localStrategy.forceThreshold})
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
                <span>1000</span>
                <span>4000</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helper component for strategy options
function StrategyOption<T extends string>({
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
      className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
        selected
          ? 'bg-vct-red/20 border-vct-red text-vct-light'
          : 'bg-vct-dark border-vct-gray/20 text-vct-gray hover:border-vct-gray/40'
      }`}
    >
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs opacity-80">{description}</div>
    </button>
  );
}

