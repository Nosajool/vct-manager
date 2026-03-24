// PlayerCard Component - Displays a player's summary info

import type { Player } from '../../types';
import type { PersonalityTraits, PlayerPersonality } from '../../types/player';
import { playerGenerator } from '../../engine/player';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl } from '../../utils/imageAssets';
import { formatRating } from '../../utils/formatNumber';
import { usePlayerIGLStatus } from '../../hooks/usePlayerIGLStatus';
import type { PlayerRestriction } from '../../services/ContractService';
import {
  getPlayerRoleLabel,
  getPlayerStatusLabel,
  getRoleLabelStyle,
  getStatusLabelStyle,
  type RoleLabel,
  type StatusLabel,
} from '../../utils/playerLabels';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  selected?: boolean;
  showContract?: boolean;
  compact?: boolean;
  teamName?: string;
  /** Pre-computed team-relative role label. Falls back to self-relative if omitted. */
  roleLabel?: RoleLabel;
  // Roster management props
  rosterPosition?: 'active' | 'reserve';
  isPlayerTeam?: boolean;
  canPromote?: boolean;
  restriction?: PlayerRestriction;
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
  roleLabel: roleLabelProp,
  rosterPosition,
  isPlayerTeam = false,
  canPromote = false,
  restriction,
  onMoveToActive,
  onMoveToReserve,
}: PlayerCardProps) {
  const overall = playerGenerator.calculateOverall(player.stats);
  const { isIGL, isFormerIGL } = usePlayerIGLStatus(player);
  const roleLabel = roleLabelProp ?? getPlayerRoleLabel(player);
  const statusLabel = getPlayerStatusLabel(player);

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
    if (form >= 80) return { icon: 'HOT', color: 'text-green-400' };
    if (form >= 60) return { icon: 'OK', color: 'text-yellow-400' };
    return { icon: 'COLD', color: 'text-red-400' };
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

        {/* Name and Role */}
        <div className="flex-1 min-w-0">
          <p className="text-vct-light font-medium truncate">{player.name}</p>
          <p className="text-xs text-vct-gray">
            {player.age}y • {roleLabel}
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
  const canMoveToActive = rosterPosition === 'reserve' && canPromote && onMoveToActive && !restriction?.isRestricted;
  const showRestrictedPromote = rosterPosition === 'reserve' && isPlayerTeam && restriction?.isRestricted;
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
      {showRosterActions && (canMoveToActive || canMoveToReserve || showRestrictedPromote) && (
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
          {showRestrictedPromote && (
            <button
              disabled
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md
                         bg-gray-700/90 text-gray-400 cursor-not-allowed
                         shadow-lg backdrop-blur-sm"
              title={restriction?.tooltip || 'Player unavailable'}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {restriction?.label || 'UNAVAILABLE'}
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
            <span className={`flex items-center gap-0.5 text-xs ${formIndicator.color}`}>
              {formIndicator.icon}
              <span className="font-medium">{player.form}</span>
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
          {(player.personality || isIGL || isFormerIGL) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {isIGL && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide bg-orange-500/10 border-orange-500/30 text-orange-400">
                  IGL
                </span>
              )}
              {isFormerIGL && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide bg-vct-gray/10 border-vct-gray/30 text-vct-gray">
                  Former IGL
                </span>
              )}
              {player.personality && (
                <PersonalityBadge personality={player.personality} />
              )}
              {player.personalityTraits && (
                <TraitBadge traits={player.personalityTraits} />
              )}
            </div>
          )}

          {/* Identity Labels */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <RoleLabelBadge label={roleLabel} />
            {statusLabel && <StatusLabelBadge label={statusLabel} />}
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

/**
 * Returns qualitative trait badge if a player has a standout trait value.
 * Only fires for extreme values so badges feel meaningful, not spammy.
 */
function getTraitBadge(traits: PersonalityTraits): { label: string; icon: string; color: string; bg: string } | null {
  // Powder Keg: high ego + high drama
  if (traits.ego >= 75 && traits.dramaTendency >= 65) {
    return { label: 'Powder Keg', icon: '💥', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
  }
  // Franchise Player: high loyalty
  if (traits.loyalty >= 80) {
    return { label: 'Franchise Player', icon: '🏆', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
  }
  // Silent Grinder: high work ethic + low drama
  if (traits.workEthic >= 75 && traits.dramaTendency <= 35) {
    return { label: 'Silent Grinder', icon: '💪', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' };
  }
  // Mercenary: very low loyalty
  if (traits.loyalty <= 25) {
    return { label: 'Mercenary', icon: '💸', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' };
  }
  return null;
}

function TraitBadge({ traits }: { traits: PersonalityTraits }) {
  const badge = getTraitBadge(traits);
  if (!badge) return null;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide ${badge.color} ${badge.bg}`}
      title={`Trait: ${badge.label}`}
    >
      {badge.icon} {badge.label}
    </span>
  );
}

function RoleLabelBadge({ label }: { label: RoleLabel }) {
  const style = getRoleLabelStyle(label);
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide ${style.color} ${style.bg}`}
      title={`Role: ${label}`}
    >
      {label}
    </span>
  );
}

function StatusLabelBadge({ label }: { label: StatusLabel }) {
  const style = getStatusLabelStyle(label);
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide ${style.color} ${style.bg}`}
      title={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
