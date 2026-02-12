import React from 'react';
import { useGameStore } from '../../store';
import type { TrainingActivityConfig, ScrimActivityConfig } from '../../types/activityPlan';

type LoadLevel = 'light' | 'moderate' | 'heavy';

interface LoadCalculation {
  level: LoadLevel;
  fatiguePercent: number;
  activePlayerCount: number;
}

/**
 * TeamLoadIndicator - UI-only component that projects team fatigue from today's configured activities
 *
 * Displays team load level and projected fatigue percentage based on:
 * - Training intensity per player (light=5, moderate=10, intense=15)
 * - Scrim intensity (light=5, moderate=10, competitive=15)
 * - Averaged across active players
 */
export const TeamLoadIndicator: React.FC = () => {
  const getTodayConfigs = useGameStore((state) => state.getTodayConfigs);
  const getPlayerTeam = useGameStore((state) => state.getPlayerTeam);

  const todayConfigs = getTodayConfigs();
  const playerTeam = getPlayerTeam();

  const calculateLoad = (): LoadCalculation | null => {
    if (todayConfigs.length === 0) {
      return null;
    }

    let totalFatiguePoints = 0;
    const activePlayerIds = new Set<string>();

    // Process training configs
    todayConfigs.forEach((config) => {
      if (config.type === 'training') {
        const trainingConfig = config as TrainingActivityConfig;
        trainingConfig.assignments.forEach((assignment) => {
          if (assignment.action === 'train' && assignment.intensity) {
            activePlayerIds.add(assignment.playerId);
            const intensityPoints = getTrainingIntensityPoints(assignment.intensity);
            totalFatiguePoints += intensityPoints;
          }
        });
      } else if (config.type === 'scrim') {
        const scrimConfig = config as ScrimActivityConfig;
        if (scrimConfig.action === 'play' && scrimConfig.intensity) {
          // Scrims affect all active players on the roster
          const activePlayers = playerTeam ? playerTeam.playerIds : [];
          activePlayers.forEach((playerId: string) => activePlayerIds.add(playerId));

          const scrimIntensityPoints = getScrimIntensityPoints(scrimConfig.intensity);
          totalFatiguePoints += scrimIntensityPoints * activePlayers.length;
        }
      }
    });

    const activePlayerCount = activePlayerIds.size;
    if (activePlayerCount === 0) {
      return null;
    }

    // Calculate average fatigue per player
    const avgFatigue = totalFatiguePoints / activePlayerCount;

    // Determine load level based on average fatigue
    let level: LoadLevel;
    if (avgFatigue < 10) {
      level = 'light';
    } else if (avgFatigue < 20) {
      level = 'moderate';
    } else {
      level = 'heavy';
    }

    return {
      level,
      fatiguePercent: Math.round(avgFatigue),
      activePlayerCount,
    };
  };

  const load = calculateLoad();

  if (!load) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Team Load</h3>
        <p className="text-sm text-gray-500">No activities configured</p>
      </div>
    );
  }

  const { level, fatiguePercent, activePlayerCount } = load;

  // Color coding based on load level
  const levelColors = {
    light: {
      bg: 'bg-green-900/30',
      border: 'border-green-700',
      text: 'text-green-400',
      label: 'Light',
    },
    moderate: {
      bg: 'bg-yellow-900/30',
      border: 'border-yellow-700',
      text: 'text-yellow-400',
      label: 'Moderate',
    },
    heavy: {
      bg: 'bg-red-900/30',
      border: 'border-red-700',
      text: 'text-red-400',
      label: 'Heavy',
    },
  };

  const colors = levelColors[level];

  return (
    <div className={`${colors.bg} rounded-lg p-4 border ${colors.border}`}>
      <h3 className="text-sm font-semibold text-gray-300 mb-2">Team Load</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-lg font-bold ${colors.text}`}>{colors.label}</p>
          <p className="text-xs text-gray-400 mt-1">
            {activePlayerCount} player{activePlayerCount !== 1 ? 's' : ''} active
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${colors.text}`}>+{fatiguePercent}%</p>
          <p className="text-xs text-gray-400">Projected Fatigue</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Get fatigue points for training intensity
 */
function getTrainingIntensityPoints(intensity: 'light' | 'moderate' | 'intense'): number {
  const intensityMap = {
    light: 5,
    moderate: 10,
    intense: 15,
  };
  return intensityMap[intensity];
}

/**
 * Get fatigue points for scrim intensity
 */
function getScrimIntensityPoints(intensity: 'light' | 'moderate' | 'competitive'): number {
  const intensityMap = {
    light: 5,
    moderate: 10,
    competitive: 15,
  };
  return intensityMap[intensity];
}
