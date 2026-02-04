import type { DamageEvent } from '../../types';

interface DamageEventCardProps {
  event: DamageEvent;
  sourcePlayerName: string;
  targetPlayerName: string;
  sourceAgent?: string;
  targetAgent?: string;
}

export function DamageEventCard({
  event,
  sourcePlayerName,
  targetPlayerName,
  sourceAgent,
  targetAgent
}: DamageEventCardProps) {
  const getDamageColor = (hitLocation: string) => {
    switch (hitLocation) {
      case 'head': return 'text-red-400';
      case 'body': return 'text-yellow-400';
      case 'leg': return 'text-green-400';
      default: return 'text-white';
    }
  };

  const getSourceIcon = () => {
    switch (event.source) {
      case 'weapon': return '🔫';
      case 'ability': return '⚡';
      case 'melee': return '🗡️';
      case 'utility': return '💨';
      case 'environment': return '🌍';
      default: return '💥';
    }
  };

  return (
    <div className="bg-vct-dark p-2 rounded border border-vct-gray/20 hover:border-vct-red/50 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        {/* Damage source icon */}
        <span className="text-lg">{getSourceIcon()}</span>
        
        {/* Damage description */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-vct-light font-medium">{sourcePlayerName}</span>
            {sourceAgent && <span className="text-vct-gray text-xs">({sourceAgent})</span>}
            <span className="text-white">→</span>
            <span className="text-vct-light font-medium">{targetPlayerName}</span>
            {targetAgent && <span className="text-vct-gray text-xs">({targetAgent})</span>}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-vct-gray mt-1">
            <span>{event.weapon || 'Unknown'}</span>
            {event.ability && <span>• {event.ability}</span>}
            <span>• {Math.round(event.distance)}m</span>
            <span className={getDamageColor(event.hitLocation)}>
              {event.hitLocation.toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Damage values */}
        <div className="text-right">
          <div className="text-white font-semibold">
            {event.finalDamage}
          </div>
          <div className="text-xs text-vct-gray">
            {event.armorBreakdown.shieldDamage > 0 && (
              <div>Shield: {event.armorBreakdown.shieldDamage}</div>
            )}
            {event.armorBreakdown.hpDamage > 0 && (
              <div>HP: {event.armorBreakdown.hpDamage}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}