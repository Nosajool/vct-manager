// PreMatchHeader - Upcoming matchup header used in InterviewModal for pre-match interviews.
// Shows both team logos and names with a "VS" separator. No score data.

import { useGameStore } from '../../store';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl } from '../../utils/imageAssets';

interface PreMatchHeaderProps {
  playerTeamId: string;
  opponentTeamId: string;
  matchRoundName?: string;
}

export function PreMatchHeader({ playerTeamId, opponentTeamId, matchRoundName }: PreMatchHeaderProps) {
  const teams = useGameStore((state) => state.teams);
  const playerTeam = teams[playerTeamId];
  const opponentTeam = teams[opponentTeamId];

  if (!playerTeam || !opponentTeam) return null;

  return (
    <div className="px-5 py-4 bg-vct-darker/40 border-b border-vct-gray/20">
      <div className="flex items-center gap-3">
        {/* Player team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GameImage
            src={getTeamLogoUrl(playerTeam.name)}
            alt={playerTeam.name}
            className="w-9 h-9 flex-shrink-0 object-contain"
            fallbackClassName="w-9 h-9 flex-shrink-0 rounded bg-vct-gray/10"
          />
          <span className="font-semibold text-sm truncate text-vct-light">{playerTeam.name}</span>
        </div>

        {/* VS center */}
        <div className="flex flex-col items-center flex-shrink-0 px-2">
          <span className="text-lg font-bold text-vct-gray/60 leading-none">VS</span>
          {matchRoundName && (
            <span className="text-xs text-vct-gray/70 mt-0.5 font-medium">{matchRoundName}</span>
          )}
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="font-semibold text-sm truncate text-vct-light">{opponentTeam.name}</span>
          <GameImage
            src={getTeamLogoUrl(opponentTeam.name)}
            alt={opponentTeam.name}
            className="w-9 h-9 flex-shrink-0 object-contain"
            fallbackClassName="w-9 h-9 flex-shrink-0 rounded bg-vct-gray/10"
          />
        </div>
      </div>
    </div>
  );
}
