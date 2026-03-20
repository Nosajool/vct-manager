// PreMatchHeader - Upcoming matchup header used in InterviewModal for pre-match interviews.
// Shows both team logos and names with a "VS" separator. No score data.
// Also shows tournament name, round stakes, and roster icons when available.

import { useGameStore } from '../../store';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl, getPlayerImageUrl } from '../../utils/imageAssets';
import { getMatchRoundName } from '../../utils/matchRoundName';
import type { Destination } from '../../types/competition';

interface PreMatchHeaderProps {
  matchId: string;
}

function stakeLabel(dest: Destination, tournamentId?: string): string {
  switch (dest.type) {
    case 'champion': return 'Win Championship';
    case 'eliminated': return 'Eliminated';
    case 'match': {
      const roundName = getMatchRoundName(dest.matchId, tournamentId);
      return roundName ? `Advances to ${roundName}` : 'Advances';
    }
    case 'placement': return `#${dest.place} Place`;
  }
}

export function PreMatchHeader({ matchId }: PreMatchHeaderProps) {
  const match = useGameStore((state) => state.matches[matchId]);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const tournament = useGameStore((state) =>
    match?.tournamentId ? state.tournaments[match.tournamentId] : null
  );
  const players = useGameStore((state) => state.players);

  if (!match || !playerTeamId) return null;

  const opponentTeamId = match.teamAId === playerTeamId ? match.teamBId : match.teamAId;
  const playerTeam = teams[playerTeamId];
  const opponentTeam = teams[opponentTeamId];
  const matchRoundName = getMatchRoundName(matchId);

  if (!playerTeam || !opponentTeam) return null;

  // Find bracketMatch for stakes
  let bracketMatch = null;
  if (tournament) {
    const bracket = tournament.bracket;
    const allMatches = [
      ...bracket.upper.flatMap((r) => r.matches),
      ...(bracket.middle ?? []).flatMap((r) => r.matches),
      ...(bracket.lower ?? []).flatMap((r) => r.matches),
      ...(bracket.grandfinal ? [bracket.grandfinal] : []),
    ];
    bracketMatch = allMatches.find((m) => m.matchId === matchId) ?? null;
  }

  // Roster icons (up to 5 each)
  const playerRoster = playerTeam.playerIds.slice(0, 5).map((id) => players[id]).filter(Boolean);
  const opponentRoster = opponentTeam.playerIds.slice(0, 5).map((id) => players[id]).filter(Boolean);

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

      {/* Tournament + stakes row */}
      {tournament && (
        <div className="mt-2 flex items-center justify-center flex-wrap gap-x-2 gap-y-1 text-xs text-vct-gray/70">
          <span>{tournament.name}</span>
          {bracketMatch && (
            <>
              <span>·</span>
              <span className="text-green-400/80">WIN → {stakeLabel(bracketMatch.winnerDestination, tournament.id)}</span>
              <span>·</span>
              <span className="text-red-400/80">LOSE → {stakeLabel(bracketMatch.loserDestination, tournament.id)}</span>
            </>
          )}
        </div>
      )}

      {/* Roster icons */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {playerRoster.map((player) => (
            <div key={player.id} title={player.name}>
              <GameImage
                src={getPlayerImageUrl(player.name)}
                alt={player.name}
                className="w-6 h-6 rounded-full object-cover"
                fallbackClassName="w-6 h-6 rounded-full bg-vct-gray/20"
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {opponentRoster.map((player) => (
            <div key={player.id} title={player.name}>
              <GameImage
                src={getPlayerImageUrl(player.name)}
                alt={player.name}
                className="w-6 h-6 rounded-full object-cover"
                fallbackClassName="w-6 h-6 rounded-full bg-vct-gray/20"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
