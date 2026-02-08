// useSimulationProgress - Hook for accessing simulation progress
// Provides convenient access to simulation progress state for components

import { useGameStore } from '../store';

export function useSimulationProgress() {
  const { 
    simulationProgress, 
    isSimulating,
    setSimulationProgress
  } = useGameStore();

  const clearProgress = () => {
    setSimulationProgress(null);
  };

  const getProgressPercentage = () => {
    if (!simulationProgress) return 0;
    return Math.round((simulationProgress.current / simulationProgress.total) * 100);
  };

  const isActive = () => {
    return simulationProgress !== null;
  };

  const getStatusText = () => {
    if (!simulationProgress) return '';
    return simulationProgress.status;
  };

  const getTypeText = () => {
    if (!simulationProgress) return '';
    
    switch (simulationProgress.type) {
      case 'tournament':
        return 'Tournament Simulation';
      case 'calendar':
        return 'Calendar Processing';
      case 'matches':
        return 'Match Simulation';
      case 'bulk':
        return 'Bulk Simulation';
      default:
        return 'Simulation';
    }
  };

  return {
    // State
    progress: simulationProgress,
    isSimulating,
    
    // Computed values
    percentage: getProgressPercentage(),
    status: getStatusText(),
    type: getTypeText(),
    isActive: isActive(),
    
    // Actions
    clearProgress,
  };
}