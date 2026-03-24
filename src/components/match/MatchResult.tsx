// MatchResult Component - Full match result display modal

import { useGameStore } from '../../store';
import type { Match } from '../../types';
import { Scoreboard } from './Scoreboard';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl } from '../../utils/imageAssets';
import { generateMatchNarrative } from '../../utils/matchNarrative';
import type { NarrativeTag } from '../../utils/matchNarrative';
import { buildPlayerRoleMap } from '../../utils/playerLabels';

function TagPill({ tag }: { tag: NarrativeTag }) {
  const colors = {
    positive: 'bg-green-500/20 text-green-400 border-green-500/30',
    negative: 'bg-red-500/20 text-red-400 border-red-500/30',
    neutral: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-bold tracking-wider border ${colors[tag.type]}`}
    >
      {tag.label}
    </span>
  );
}

function MatchStory({
  narrative,
  playerSide,
}: {
  narrative: ReturnType<typeof generateMatchNarrative>;
  playerSide: 'teamA' | 'teamB' | null;
}) {
  const headlineColor = playerSide === null
    ? 'text-vct-light'
    : narrative.isWin
      ? 'text-green-400'
      : 'text-red-400';

  return (
    <div className="mb-6 p-4 bg-vct-darker rounded-lg border border-vct-gray/20">
      {/* Headline */}
      <p className={`text-lg font-black tracking-widest mb-3 ${headlineColor}`}>
        {narrative.headline}
      </p>

      {/* Tags */}
      {narrative.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {narrative.tags.map((tag) => (
            <TagPill key={tag.label} tag={tag} />
          ))}
        </div>
      )}

      {/* Highlights */}
      {narrative.highlights.length > 0 && (
        <ul className="space-y-1">
          {narrative.highlights.map((h, i) => (
            <li key={i} className="text-sm text-vct-gray flex gap-2">
              <span className="text-vct-gray/50 shrink-0">&#9733;</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface MatchResultProps {
  match: Match;
  onClose: () => void;
}

export function MatchResult({ match, onClose }: MatchResultProps) {
  const teams = useGameStore((state) => state.teams);
  const results = useGameStore((state) => state.results);
  const players = useGameStore((state) => state.players);
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  const teamA = teams[match.teamAId];
  const teamB = teams[match.teamBId];
  const result = results[match.id];

  if (!teamA || !teamB || !result) {
    return null;
  }

  const winnerTeam = result.winnerId === teamA.id ? teamA : teamB;

  const playerSide =
    match.teamAId === playerTeamId
      ? 'teamA'
      : match.teamBId === playerTeamId
        ? 'teamB'
        : null;

  // Build role map for both teams' players so narrative highlights include role labels
  const matchPlayerIds = [
    ...(teamA.playerIds ?? []),
    ...(teamB.playerIds ?? []),
  ];
  const matchPlayers = matchPlayerIds.map((id) => players[id]).filter(Boolean);
  const playerRoles = buildPlayerRoleMap(matchPlayers);

  const narrative = generateMatchNarrative(result, playerSide, playerRoles);

  // Parse date string as local date to avoid timezone shifts
  const parseAsLocalDate = (dateStr: string): Date => {
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = parseAsLocalDate(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-dark rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-vct-darker p-6 border-b border-vct-gray/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-vct-gray">
              {formatDate(match.scheduledDate)}
            </span>
            <button
              onClick={onClose}
              className="text-vct-gray hover:text-vct-light transition-colors text-xl"
            >
              ×
            </button>
          </div>

          {/* Match Score */}
          <div className="flex items-center justify-between">
            {/* Team A */}
            <div className="flex-1 text-left flex items-center gap-2 sm:gap-3">
              <GameImage
                src={getTeamLogoUrl(teamA.name)}
                alt={teamA.name}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <div className="min-w-0">
                <p
                  className={`text-xl sm:text-2xl font-bold truncate ${
                    result.winnerId === teamA.id ? 'text-green-400' : 'text-vct-light'
                  }`}
                >
                  {teamA.name}
                </p>
                <p className="text-sm text-vct-gray">{teamA.region}</p>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-8">
              <span
                className={`text-5xl font-bold ${
                  result.winnerId === teamA.id ? 'text-green-400' : 'text-vct-gray'
                }`}
              >
                {result.scoreTeamA}
              </span>
              <span className="text-3xl text-vct-gray">-</span>
              <span
                className={`text-5xl font-bold ${
                  result.winnerId === teamB.id ? 'text-green-400' : 'text-vct-gray'
                }`}
              >
                {result.scoreTeamB}
              </span>
            </div>

            {/* Team B */}
            <div className="flex-1 text-right flex items-center justify-end gap-2 sm:gap-3">
              <div className="min-w-0">
                <p
                  className={`text-xl sm:text-2xl font-bold truncate ${
                    result.winnerId === teamB.id ? 'text-green-400' : 'text-vct-light'
                  }`}
                >
                  {teamB.name}
                </p>
                <p className="text-sm text-vct-gray">{teamB.region}</p>
              </div>
              <GameImage
                src={getTeamLogoUrl(teamB.name)}
                alt={teamB.name}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
            </div>
          </div>

          {/* Winner Banner */}
          <div className="mt-4 text-center">
            <span className="inline-block px-4 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
              {winnerTeam.name} wins
            </span>
            <span className="ml-3 text-vct-gray text-sm">
              {result.duration} minutes
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Match Story */}
          <MatchStory narrative={narrative} playerSide={playerSide} />

          <Scoreboard
            result={result}
            teamAName={teamA.name}
            teamBName={teamB.name}
            overallWinner={result.winnerId === teamA.id ? 'teamA' : 'teamB'}
          />
        </div>

        {/* Footer */}
        <div className="bg-vct-darker p-4 border-t border-vct-gray/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
