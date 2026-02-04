import type { PlayerArmorState } from '../../types';

interface PlayerHealthBarProps {
  playerId: string;
  playerName: string;
  agent: string;
  playerStates: Map<number, Map<string, PlayerArmorState>>;
}

export function PlayerHealthBar({ 
  playerId, 
  playerName, 
  agent, 
  playerStates 
}: PlayerHealthBarProps) {
  const finalState = Array.from(playerStates.values())
    .slice(-1)[0]
    ?.get(playerId);

  if (!finalState) return null;

  const healthPercentage = (finalState.health / finalState.maxHealth) * 100;
  const shieldPercentage = (finalState.shieldHealth / (finalState.shieldType === 'heavy' ? 50 : 25)) * 100;

  const getHealthColor = (percentage: number) => {
    if (percentage <= 20) return 'bg-red-600';
    if (percentage <= 50) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getShieldColor = (shieldType: string) => {
    switch (shieldType) {
      case 'light': return 'bg-blue-400';
      case 'heavy': return 'bg-blue-600';
      case 'regen': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-vct-dark rounded">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-medium text-sm">{playerName}</span>
          <span className="text-vct-gray text-xs">{agent}</span>
          <span className="text-vct-gray text-xs ml-auto">
            {finalState.health}/{finalState.maxHealth} HP
          </span>
        </div>
        
        {/* Health Bar */}
        <div className="w-full bg-vct-darker rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getHealthColor(healthPercentage)}`}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>

        {/* Shield Bar (if has shield) */}
        {finalState.shieldType !== 'none' && finalState.shieldHealth > 0 && (
          <div className="mt-1">
            <div className="w-full bg-vct-darker rounded-full h-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getShieldColor(finalState.shieldType)}`}
                style={{ width: `${shieldPercentage}%` }}
              />
            </div>
            <div className="text-vct-gray text-xs mt-1">
              {finalState.shieldHealth} Shield ({finalState.shieldType})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}