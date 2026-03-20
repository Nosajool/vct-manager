// PostMatchHeader - Shared match result header used in InterviewModal and MoraleChangeModal
// Shows team logos, names, score, round name, and per-map breakdown.
// Also shows tournament name, round stakes, and roster icons when available.
// Clickable — opens the full MatchResult modal.

import { useState } from 'react';
import { useGameStore } from '../../store';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl, getPlayerImageUrl } from '../../utils/imageAssets';
import { getMatchRoundName } from '../../utils/matchRoundName';
import { MatchResult } from './MatchResult';
import type { Destination } from '../../types/competition';

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

interface PostMatchHeaderProps {
  matchId: string;
}

export function PostMatchHeader({ matchId }: PostMatchHeaderProps) {
  const [showMatchResult, setShowMatchResult] = useState(false);

  const match = useGameStore((state) => state.matches[matchId]);
  const result = useGameStore((state) => state.results[matchId]);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const tournament = useGameStore((state) =>
    match?.tournamentId ? state.tournaments[match.tournamentId] : null
  );
  const players = useGameStore((state) => state.players);

  if (!match || !result || !playerTeamId) return null;

  const opponentTeamId = match.teamAId === playerTeamId ? match.teamBId : match.teamAId;
  const playerTeam = teams[playerTeamId];
  const opponentTeam = teams[opponentTeamId];

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

  const isTeamA = match.teamAId === playerTeamId;
  const playerTeamScore = isTeamA ? result.scoreTeamA : result.scoreTeamB;
  const opponentScore = isTeamA ? result.scoreTeamB : result.scoreTeamA;
  const playerWon = result.winnerId === playerTeamId;
  const matchRoundName = getMatchRoundName(matchId);

  const maps = result.maps?.map((m) => ({
    map: m.map,
    playerTeamScore: isTeamA ? m.teamAScore : m.teamBScore,
    opponentScore: isTeamA ? m.teamBScore : m.teamAScore,
  })) ?? [];

  return (
    <>
      <div
        className="px-5 py-4 bg-vct-darker/40 border-b border-vct-gray/20 cursor-pointer hover:bg-vct-gray/10 transition-colors"
        onClick={() => setShowMatchResult(true)}
        title="View full match details"
      >
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
              {playerTeamScore}
              <span className="text-vct-gray/50 mx-1.5">-</span>
              {opponentScore}
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
        {maps.length > 0 && (
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-2.5">
            {maps.map((m, i) => (
              <span key={i} className="text-xs text-vct-gray">
                {m.map}{' '}
                <span className="text-vct-light font-medium tabular-nums">
                  {m.playerTeamScore}–{m.opponentScore}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Tournament + stakes row */}
        {tournament && (
          <div className="mt-2 flex items-center justify-center flex-wrap gap-x-2 gap-y-1 text-xs text-vct-gray/70">
            <span>{tournament.name}</span>
            {bracketMatch && (() => {
              const dest = playerWon ? bracketMatch.winnerDestination : bracketMatch.loserDestination;
              const label = stakeLabel(dest, tournament.id);
              const color = playerWon ? 'text-green-400/80' : 'text-red-400/80';
              return (
                <>
                  <span>·</span>
                  <span className={color}>{label}</span>
                </>
              );
            })()}
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

      {showMatchResult && (
        <MatchResult match={match} onClose={() => setShowMatchResult(false)} />
      )}
    </>
  );
}
