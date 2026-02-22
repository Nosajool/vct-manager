// PostMatchHeader - Shared match result header used in InterviewModal and MoraleChangeModal
// Shows team logos, names, score, round name, and per-map breakdown.

import { useGameStore } from '../../store';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl } from '../../utils/imageAssets';

export interface MatchDisplayContext {
  playerTeamId: string;
  opponentTeamId: string;
  matchRoundName?: string;
  matchScore: {
    playerTeamScore: number;
    opponentScore: number;
    maps: Array<{
      map: string;
      playerTeamScore: number;
      opponentScore: number;
    }>;
  };
}

interface PostMatchHeaderProps {
  context: MatchDisplayContext;
}

export function PostMatchHeader({ context }: PostMatchHeaderProps) {
  const teams = useGameStore((state) => state.teams);
  const playerTeam = teams[context.playerTeamId];
  const opponentTeam = teams[context.opponentTeamId];

  if (!playerTeam || !opponentTeam) return null;

  const { matchScore, matchRoundName } = context;
  const playerWon = matchScore.playerTeamScore > matchScore.opponentScore;

  return (
    <div className="px-5 py-4 bg-vct-darker/40 border-b border-vct-gray/20">
      {/* Teams + Score row */}
      <div className="flex items-center gap-3">
        {/* Player team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GameImage
            src={getTeamLogoUrl(playerTeam.name)}
            alt={playerTeam.name}
            className="w-9 h-9 flex-shrink-0 object-contain"
            fallbackClassName="w-9 h-9 flex-shrink-0 rounded bg-vct-gray/10"
          />
          <span className={`font-semibold text-sm truncate ${playerWon ? 'text-green-400' : 'text-vct-light'}`}>
            {playerTeam.name}
          </span>
        </div>

        {/* Score + round */}
        <div className="flex flex-col items-center flex-shrink-0 px-2">
          <span className="text-2xl font-bold text-vct-light tabular-nums leading-none">
            {matchScore.playerTeamScore}
            <span className="text-vct-gray/50 mx-1.5">-</span>
            {matchScore.opponentScore}
          </span>
          {matchRoundName && (
            <span className="text-xs text-vct-gray/70 mt-0.5 font-medium">{matchRoundName}</span>
          )}
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className={`font-semibold text-sm truncate ${!playerWon ? 'text-green-400' : 'text-vct-light'}`}>
            {opponentTeam.name}
          </span>
          <GameImage
            src={getTeamLogoUrl(opponentTeam.name)}
            alt={opponentTeam.name}
            className="w-9 h-9 flex-shrink-0 object-contain"
            fallbackClassName="w-9 h-9 flex-shrink-0 rounded bg-vct-gray/10"
          />
        </div>
      </div>

      {/* Per-map scores */}
      {matchScore.maps.length > 0 && (
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-2.5">
          {matchScore.maps.map((m, i) => (
            <span key={i} className="text-xs text-vct-gray">
              {m.map}{' '}
              <span className="text-vct-light font-medium tabular-nums">
                {m.playerTeamScore}–{m.opponentScore}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
