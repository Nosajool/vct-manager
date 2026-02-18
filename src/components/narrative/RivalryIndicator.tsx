// RivalryIndicator - Inline flame icon + intensity number
// Only renders when a rivalry exists with intensity > 0

import { useGameStore } from '../../store';

interface RivalryIndicatorProps {
  opponentTeamId: string;
  className?: string;
}

export function RivalryIndicator({ opponentTeamId, className = '' }: RivalryIndicatorProps) {
  const rivalry = useGameStore((state) => state.rivalries[opponentTeamId]);

  if (!rivalry || rivalry.intensity <= 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs text-orange-400 font-medium ${className}`}
      title={`Rivalry intensity: ${rivalry.intensity}`}
    >
      🔥 {rivalry.intensity}
    </span>
  );
}
