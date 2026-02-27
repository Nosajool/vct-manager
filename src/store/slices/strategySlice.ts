// Strategy Slice - Manages team strategies and player agent preferences
// Stores configuration for how teams play matches

import type { StateCreator } from 'zustand';
import type {
  TeamStrategy,
  PlayerAgentPreferences,
  Player,
} from '../../types';
import { DEFAULT_TEAM_STRATEGY, AI_STRATEGY_PRESETS, validateStrategy } from '../../types/strategy';

/**
 * State for team strategies
 */
export interface StrategySliceState {
  /** Team strategies indexed by team ID */
  teamStrategies: Record<string, TeamStrategy>;

  /** Player agent preferences indexed by player ID */
  playerAgentPreferences: Record<string, PlayerAgentPreferences>;
}

/**
 * Actions for managing strategies
 */
export interface StrategySliceActions {
  // Team strategy actions
  setTeamStrategy: (teamId: string, strategy: TeamStrategy) => void;
  updateTeamStrategy: (teamId: string, updates: Partial<TeamStrategy>) => void;
  resetTeamStrategy: (teamId: string) => void;
  initializeAIStrategies: (teamIds: string[], playerTeamId?: string) => void;

  // Player agent preference actions
  setPlayerAgentPreferences: (playerId: string, preferences: PlayerAgentPreferences) => void;
  updatePlayerAgentPreferences: (playerId: string, updates: Partial<PlayerAgentPreferences>) => void;
  clearPlayerAgentPreferences: (playerId: string) => void;

  // Mastery
  updateAgentMastery: (playerId: string, agentName: string, delta: number) => void;

  // Selectors
  getTeamStrategy: (teamId: string) => TeamStrategy;
  getPlayerAgentPreferences: (playerId: string) => PlayerAgentPreferences | undefined;
}

export type StrategySlice = StrategySliceState & StrategySliceActions;

/**
 * Initial state
 */
const initialState: StrategySliceState = {
  teamStrategies: {},
  playerAgentPreferences: {},
};

/**
 * Generate random strategy for AI teams
 */
function generateAIStrategy(): TeamStrategy {
  const presetKeys = Object.keys(AI_STRATEGY_PRESETS);
  const randomPreset = presetKeys[Math.floor(Math.random() * presetKeys.length)];
  const preset = AI_STRATEGY_PRESETS[randomPreset];

  return {
    ...DEFAULT_TEAM_STRATEGY,
    ...preset,
    // Add some variation
    forceThreshold: preset.forceThreshold! + Math.floor(Math.random() * 400 - 200),
  };
}

/**
 * Create the strategy slice
 */
export const createStrategySlice: StateCreator<
  StrategySlice & { players: Record<string, Player> },
  [],
  [],
  StrategySlice
> = (set, get) => ({
  ...initialState,

  // Set complete team strategy
  setTeamStrategy: (teamId, strategy) => {
    if (!validateStrategy(strategy)) {
      console.warn('Invalid strategy provided for team:', teamId);
      return;
    }

    set((state) => ({
      teamStrategies: {
        ...state.teamStrategies,
        [teamId]: strategy,
      },
    }));
  },

  // Update partial team strategy
  updateTeamStrategy: (teamId, updates) => {
    set((state) => {
      const current = state.teamStrategies[teamId] || DEFAULT_TEAM_STRATEGY;
      const updated = { ...current, ...updates };

      if (!validateStrategy(updated)) {
        console.warn('Invalid strategy update for team:', teamId);
        return state;
      }

      return {
        teamStrategies: {
          ...state.teamStrategies,
          [teamId]: updated,
        },
      };
    });
  },

  // Reset team strategy to default
  resetTeamStrategy: (teamId) => {
    set((state) => ({
      teamStrategies: {
        ...state.teamStrategies,
        [teamId]: { ...DEFAULT_TEAM_STRATEGY },
      },
    }));
  },

  // Initialize strategies for AI teams
  initializeAIStrategies: (teamIds, playerTeamId) => {
    set((state) => {
      const newStrategies = { ...state.teamStrategies };

      for (const teamId of teamIds) {
        // Skip player's team - they manage their own strategy
        if (teamId === playerTeamId) {
          // Give player team default strategy if not set
          if (!newStrategies[teamId]) {
            newStrategies[teamId] = { ...DEFAULT_TEAM_STRATEGY };
          }
          continue;
        }

        // Generate random strategy for AI teams
        newStrategies[teamId] = generateAIStrategy();
      }

      return { teamStrategies: newStrategies };
    });
  },

  // Set complete player agent preferences
  setPlayerAgentPreferences: (playerId, preferences) => {
    set((state) => ({
      playerAgentPreferences: {
        ...state.playerAgentPreferences,
        [playerId]: preferences,
      },
      players: state.players[playerId]
        ? {
            ...state.players,
            [playerId]: { ...state.players[playerId], agentPreferences: preferences },
          }
        : state.players,
    }));
  },

  // Update partial player agent preferences
  updatePlayerAgentPreferences: (playerId, updates) => {
    set((state) => {
      const current = state.playerAgentPreferences[playerId];
      if (!current) {
        console.warn('No existing preferences to update for player:', playerId);
        return state;
      }

      const updated = { ...current, ...updates };
      return {
        playerAgentPreferences: {
          ...state.playerAgentPreferences,
          [playerId]: updated,
        },
        players: state.players[playerId]
          ? {
              ...state.players,
              [playerId]: { ...state.players[playerId], agentPreferences: updated },
            }
          : state.players,
      };
    });
  },

  // Update a single agent's mastery value for a player (clamped 0–100)
  updateAgentMastery: (playerId, agentName, delta) => {
    set((state) => {
      const prefs = state.playerAgentPreferences[playerId];
      if (!prefs) return state;
      const currentMastery = prefs.agentMastery ?? {};
      const newValue = Math.min(100, Math.max(0, (currentMastery[agentName] ?? 0) + delta));
      const updated = {
        ...prefs,
        agentMastery: { ...currentMastery, [agentName]: newValue },
      };
      return {
        playerAgentPreferences: {
          ...state.playerAgentPreferences,
          [playerId]: updated,
        },
        players: state.players[playerId]
          ? {
              ...state.players,
              [playerId]: { ...state.players[playerId], agentPreferences: updated },
            }
          : state.players,
      };
    });
  },

  // Clear player agent preferences
  clearPlayerAgentPreferences: (playerId) => {
    set((state) => {
      const newPreferences = { ...state.playerAgentPreferences };
      delete newPreferences[playerId];
      return {
        playerAgentPreferences: newPreferences,
        players: state.players[playerId]
          ? {
              ...state.players,
              [playerId]: { ...state.players[playerId], agentPreferences: undefined },
            }
          : state.players,
      };
    });
  },

  // Get team strategy (returns default if not set)
  getTeamStrategy: (teamId) => {
    return get().teamStrategies[teamId] || DEFAULT_TEAM_STRATEGY;
  },

  // Get player agent preferences
  getPlayerAgentPreferences: (playerId) => {
    return get().playerAgentPreferences[playerId];
  },
});
