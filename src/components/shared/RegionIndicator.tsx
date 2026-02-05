import type { TournamentRegion } from '../../types';

interface RegionIndicatorProps {
  region: TournamentRegion;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const REGION_CONFIG: Record<TournamentRegion, { emoji: string; label: string; fallback: string }> = {
  International: { emoji: '🌐', label: 'International', fallback: 'INT' },
  Americas: { emoji: '🇺🇸', label: 'Americas', fallback: 'AM' },
  EMEA: { emoji: '🇩🇪', label: 'EMEA', fallback: 'EMEA' },
  Pacific: { emoji: '🇰🇷', label: 'Pacific', fallback: 'PAC' },
  China: { emoji: '🇨🇳', label: 'China', fallback: 'CN' },
};

const SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function RegionIndicator({
  region,
  size = 'md',
  showLabel = false,
  className = '',
}: RegionIndicatorProps) {
  const config = REGION_CONFIG[region];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClass} ${className}`}
      title={config.label}
      aria-label={config.label}
    >
      <span className="select-none" role="img" aria-label={config.label}>
        {config.emoji}
      </span>
      {showLabel && (
        <span className="text-vct-light font-medium">{config.label}</span>
      )}
    </span>
  );
}

// Compact version with just the emoji and fallback text
interface RegionIndicatorCompactProps {
  region: TournamentRegion;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RegionIndicatorCompact({
  region,
  size = 'md',
  className = '',
}: RegionIndicatorCompactProps) {
  const config = REGION_CONFIG[region];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClass} ${className}`}
      title={config.label}
    >
      <span className="select-none" role="img" aria-label={config.label}>
        {config.emoji}
      </span>
      <span className="text-vct-gray text-xs">{config.fallback}</span>
    </span>
  );
}

// Badge version with background
interface RegionBadgeProps {
  region: TournamentRegion;
  size?: 'sm' | 'md';
  className?: string;
}

const BADGE_SIZE_CLASSES = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
};

export function RegionBadge({ region, size = 'md', className = '' }: RegionBadgeProps) {
  const config = REGION_CONFIG[region];
  const sizeClass = BADGE_SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded bg-vct-dark border border-vct-gray/30 ${sizeClass} ${className}`}
      title={config.label}
    >
      <span className="select-none" role="img" aria-label={config.label}>
        {config.emoji}
      </span>
      <span className="text-vct-light font-medium">{config.fallback}</span>
    </span>
  );
}
