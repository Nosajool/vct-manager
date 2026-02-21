// PlayerCard Component - Displays a player's summary info

import type { Player } from '../../types';
import type { PlayerPersonality } from '../../types/player';
import { playerGenerator } from '../../engine/player';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl } from '../../utils/imageAssets';
import { formatRating } from '../../utils/formatNumber';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  selected?: boolean;
  showContract?: boolean;
  compact?: boolean;
  teamName?: string;
  // Roster management props
  rosterPosition?: 'active' | 'reserve';
  isPlayerTeam?: boolean;
  canPromote?: boolean;
  onMoveToActive?: (playerId: string) => void;
  onMoveToReserve?: (playerId: string) => void;
}

export function PlayerCard({
  player,
  onClick,
  selected = false,
  showContract = false,
  compact = false,
  teamName,
  rosterPosition,
  isPlayerTeam = false,
  canPromote = false,
  onMoveToActive,
  onMoveToReserve,
}: PlayerCardProps) {
  const overall = playerGenerator.calculateOverall(player.stats);

  // Get overall color based on rating
  const getOverallColor = (ovr: number): string => {
    if (ovr >= 85) return 'text-yellow-400';
    if (ovr >= 75) return 'text-green-400';
    if (ovr >= 65) return 'text-blue-400';
    if (ovr >= 55) return 'text-vct-gray';
    return 'text-red-400';
  };

  // Get form indicator
  const getFormIndicator = (form: number): { icon: string; color: string } => {
    if (form >= 80) return { icon: '🔥', color: 'text-green-400' };
    if (form >= 60) return { icon: '➡️', color: 'text-yellow-400' };
    return { icon: '📉', color: 'text-red-400' };
  };

  const formIndicator = getFormIndicator(player.form);

  // Format salary
  const formatSalary = (salary: number): string => {
    if (salary >= 1000000) {
      return `$${(salary / 1000000).toFixed(1)}M`;
    }
    return `$${(salary / 1000).toFixed(0)}K`;
  };

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`
          flex items-center gap-3 p-2 rounded cursor-pointer transition-colors
          ${selected ? 'bg-vct-red/20 border border-vct-red/50' : 'bg-vct-dark hover:bg-vct-gray/10'}
        `}
      >
        {/* Player Photo */}
        <GameImage
          src={getPlayerImageUrl(player.name)}
          alt={player.name}
          className="w-8 h-8 rounded-full object-cover"
        />

        {/* Overall */}
        <div
          className={`w-10 h-10 rounded flex items-center justify-center font-bold ${getOverallColor(overall)} bg-vct-darker`}
        >
          {overall}
        </div>

        {/* Name and Region */}
        <div className="flex-1 min-w-0">
          <p className="text-vct-light font-medium truncate">{player.name}</p>
          <p className="text-xs text-vct-gray">
            {player.age}y • {player.nationality}
          </p>
        </div>

        {/* Form */}
        <span className={formIndicator.color}>{formIndicator.icon}</span>
      </div>
    );
  }

  // Handle quick action button clicks without triggering card onClick
  const handleMoveToActiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMoveToActive) onMoveToActive(player.id);
  };

  const handleMoveToReserveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMoveToReserve) onMoveToReserve(player.id);
  };

  // Determine if we should show roster actions
  const showRosterActions = isPlayerTeam && rosterPosition;
  const canMoveToActive = rosterPosition === 'reserve' && canPromote && onMoveToActive;
  const canMoveToReserve = rosterPosition === 'active' && onMoveToReserve;

  return (
    <div
      onClick={onClick}
      className={`
        group p-4 rounded-lg border transition-all cursor-pointer relative overflow-hidden
        ${
          selected
            ? 'bg-vct-red/10 border-vct-red/50 shadow-lg'
            : 'bg-vct-darker border-vct-gray/20 hover:border-vct-gray/40'
        }
      `}
    >
      {/* Roster Position Badge */}
      {showRosterActions && (
        <div className="absolute top-0 left-0">
          <div
            className={`
              text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-br
              ${rosterPosition === 'active'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
              }
            `}
          >
            {rosterPosition}
          </div>
        </div>
      )}

      {/* Quick Action Button - appears on hover */}
      {showRosterActions && (canMoveToActive || canMoveToReserve) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {canMoveToActive && (
            <button
              onClick={handleMoveToActiveClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md
                         bg-emerald-600/90 hover:bg-emerald-500 text-white
                         shadow-lg backdrop-blur-sm transition-all hover:scale-105"
              title="Promote to Active Roster"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Promote
            </button>
          )}
          {canMoveToReserve && (
            <button
              onClick={handleMoveToReserveClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md
                         bg-amber-600/90 hover:bg-amber-500 text-white
                         shadow-lg backdrop-blur-sm transition-all hover:scale-105"
              title="Move to Reserve"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Bench
            </button>
          )}
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Player Photo */}
        <GameImage
          src={getPlayerImageUrl(player.name)}
          alt={player.name}
          className="w-14 h-14 rounded-full object-cover"
        />

        {/* Overall Rating */}
        <div
          className={`
            w-14 h-14 rounded-lg flex items-center justify-center
            font-bold text-xl bg-vct-dark border border-vct-gray/20
            ${getOverallColor(overall)}
          `}
        >
          {overall}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-vct-light truncate">
              {player.name}
            </h3>
            <span className={formIndicator.color} title={`Form: ${player.form}`}>
              {formIndicator.icon}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-vct-gray">
            <span>{player.age} years</span>
            <span>•</span>
            <span>{player.nationality}</span>
            <span>•</span>
            <span className="text-vct-light">{player.region}</span>
          </div>

          {/* Personality Badge */}
          {player.personality && (
            <div className="mt-1.5">
              <PersonalityBadge personality={player.personality} />
            </div>
          )}

          {/* Stats Preview */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <StatMini label="MEC" value={player.stats.mechanics} />
            <StatMini label="ENT" value={player.stats.entry} />
            <StatMini label="CLU" value={player.stats.clutch} />
          </div>
        </div>

        {/* Contract Info */}
        {showContract && (
          <div className="text-right text-sm">
            {player.contract ? (
              <>
                <p className="text-vct-light font-medium">
                  {formatSalary(player.contract.salary)}
                </p>
                <p className="text-vct-gray text-xs">
                  {player.contract.yearsRemaining}y left
                </p>
                {teamName && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400 font-medium">
                    {teamName}
                  </span>
                )}
              </>
            ) : (
              <span className="text-green-400 text-xs font-medium">
                Free Agent
              </span>
            )}
          </div>
        )}
      </div>

      {/* Potential Bar */}
      <div className="mt-3 pt-3 border-t border-vct-gray/10">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-vct-gray">Potential</span>
          <span className="text-vct-light">{formatRating(player.potential)}</span>
        </div>
        <div className="h-1.5 bg-vct-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-vct-red to-yellow-500 rounded-full"
            style={{ width: `${formatRating(player.potential)}%` }}
          />
        </div>

        {/* Morale Bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-vct-gray">Morale</span>
            <span className="text-vct-light">{formatRating(player.morale)}</span>
          </div>
          <div className="h-1.5 bg-vct-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-400 rounded-full"
              style={{ width: `${formatRating(player.morale)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Personality badge config
const PERSONALITY_CONFIG: Record<
  PlayerPersonality,
  { label: string; color: string; bg: string }
> = {
  FAME_SEEKER: { label: 'Fame Seeker', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  TEAM_FIRST:  { label: 'Team First',  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20'  },
  INTROVERT:   { label: 'Introvert',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'    },
  BIG_STAGE:   { label: 'Big Stage',   color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20'},
  STABLE:      { label: 'Stable',      color: 'text-vct-gray',   bg: 'bg-vct-gray/10 border-vct-gray/20'   },
};

function PersonalityBadge({ personality }: { personality: PlayerPersonality }) {
  const config = PERSONALITY_CONFIG[personality];
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide ${config.color} ${config.bg}`}
      title={`Personality: ${config.label}`}
    >
      {config.label}
    </span>
  );
}

// Mini stat display
function StatMini({ label, value }: { label: string; value: number }) {
  const getColor = (v: number): string => {
    if (v >= 80) return 'text-green-400';
    if (v >= 65) return 'text-vct-light';
    return 'text-vct-gray';
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-vct-gray">{label}</span>
      <span className={getColor(value)}>{formatRating(value)}</span>
    </div>
  );
}
