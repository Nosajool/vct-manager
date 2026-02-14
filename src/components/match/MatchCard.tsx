// MatchCard Component - Displays match summary (upcoming or completed)

import { useState } from 'react';
import { useGameStore } from '../../store';
import type { Match, MatchResult } from '../../types';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl } from '../../utils/imageAssets';
import { MatchStrategyEditor } from './MatchStrategyEditor';

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
  showActions?: boolean;
  onSimulate?: () => void;
}

export function MatchCard({
  match,
  onClick,
  showActions = false,
  onSimulate,
}: MatchCardProps) {
  const teams = useGameStore((state) => state.teams);
  const results = useGameStore((state) => state.results);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const hasMatchStrategy = useGameStore((state) => state.hasMatchStrategy);

  const [showStrategyEditor, setShowStrategyEditor] = useState(false);

  const teamA = teams[match.teamAId];
  const teamB = teams[match.teamBId];
  const result = results[match.id];

  if (!teamA || !teamB) {
    return null;
  }

  const isCompleted = match.status === 'completed';
  const isScheduled = match.status === 'scheduled';
  const isPlayerMatch = match.teamAId === playerTeamId || match.teamBId === playerTeamId;
  const hasCustomStrategy = hasMatchStrategy(match.id);

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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border transition-all
        ${onClick ? 'cursor-pointer hover:border-vct-gray/40' : ''}
        ${isCompleted ? 'bg-vct-darker border-vct-gray/20' : 'bg-vct-dark border-vct-gray/30'}
      `}
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-vct-gray">
          {formatDate(match.scheduledDate)}
        </span>
        <StatusBadge status={match.status} />
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4">
        {/* Team A */}
        <TeamDisplay
          team={teamA}
          isWinner={result?.winnerId === teamA.id}
          align="left"
        />

        {/* VS / Score */}
        <div className="flex-shrink-0 text-center">
          {isCompleted && result ? (
            <div className="flex items-center gap-2 font-bold text-lg">
              <span className={result.winnerId === teamA.id ? 'text-green-400' : 'text-vct-gray'}>
                {result.scoreTeamA}
              </span>
              <span className="text-vct-gray text-sm">-</span>
              <span className={result.winnerId === teamB.id ? 'text-green-400' : 'text-vct-gray'}>
                {result.scoreTeamB}
              </span>
            </div>
          ) : (
            <span className="text-vct-gray font-medium">VS</span>
          )}
        </div>

        {/* Team B */}
        <TeamDisplay
          team={teamB}
          isWinner={result?.winnerId === teamB.id}
          align="right"
        />
      </div>

      {/* Actions */}
      {showActions && isScheduled && (
        <div className="mt-4 pt-3 border-t border-vct-gray/10 space-y-2">
          {/* Strategy Customization - only for player's matches */}
          {isPlayerMatch && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStrategyEditor(true);
              }}
              className={`w-full py-2 rounded font-medium transition-colors ${
                hasCustomStrategy
                  ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30'
                  : 'bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light'
              }`}
            >
              {hasCustomStrategy ? '⚙️ Custom Strategy Set' : '⚙️ Customize Strategy'}
            </button>
          )}

          {/* Simulate Button */}
          {onSimulate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSimulate();
              }}
              className="w-full py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded font-medium transition-colors"
            >
              Simulate Match
            </button>
          )}
        </div>
      )}

      {/* Strategy Editor Modal */}
      {showStrategyEditor && (
        <MatchStrategyEditor
          match={match}
          onClose={() => setShowStrategyEditor(false)}
        />
      )}

      {/* Map Details for Completed */}
      {isCompleted && result && (
        <div className="mt-3 pt-3 border-t border-vct-gray/10">
          <MapScoreSummary result={result} />
        </div>
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: Match['status'] }) {
  const config = {
    scheduled: { label: 'Upcoming', color: 'bg-blue-500/20 text-blue-400' },
    in_progress: { label: 'Live', color: 'bg-red-500/20 text-red-400' },
    completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  };

  const { label, color } = config[status];

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

// Team Display Component
function TeamDisplay({
  team,
  isWinner,
  align,
}: {
  team: { id: string; name: string; region: string };
  isWinner?: boolean;
  align: 'left' | 'right';
}) {
  return (
    <div className={`flex-1 flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : 'text-left'}`}>
      <GameImage
        src={getTeamLogoUrl(team.id)}
        alt={`${team.name} logo`}
        className="w-6 h-6"
      />
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold truncate ${
            isWinner ? 'text-green-400' : 'text-vct-light'
          }`}
        >
          {team.name}
        </p>
        <p className="text-xs text-vct-gray">{team.region}</p>
      </div>
    </div>
  );
}

// Map Score Summary Component
function MapScoreSummary({
  result,
}: {
  result: MatchResult;
}) {
  return (
    <div className="space-y-1">
      {result.maps.map((map, idx) => (
        <div key={idx} className="flex items-center justify-between text-xs">
          <span className="text-vct-gray">{map.map}</span>
          <div className="flex items-center gap-2">
            <span
              className={
                map.winner === 'teamA' ? 'text-green-400 font-medium' : 'text-vct-gray'
              }
            >
              {map.teamAScore}
            </span>
            <span className="text-vct-gray">-</span>
            <span
              className={
                map.winner === 'teamB' ? 'text-green-400 font-medium' : 'text-vct-gray'
              }
            >
              {map.teamBScore}
            </span>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-center gap-1 text-xs text-vct-gray pt-1">
        <span>{result.duration} min</span>
        {result.maps.some((m) => m.overtime) && (
          <span className="text-yellow-400">(OT)</span>
        )}
      </div>
    </div>
  );
}
