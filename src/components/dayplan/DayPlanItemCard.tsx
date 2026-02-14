// DayPlanItemCard - Core shared component for day plan items
//
// Replaces both ObjectiveItem and inline activity buttons from DayScheduleCard.
// Supports two variants:
// - 'full': Used by Today panel. Shows checkbox, label, description, status badge.
// - 'compact': Used by WeekPlanner. Shows colored activity button with lifecycle state icon.

import type { DayPlanItem } from '../../types/dayPlan';
import { ACTIVITY_COLORS } from '../../constants/activityColors';

interface DayPlanItemCardProps {
  item: DayPlanItem;
  variant: 'full' | 'compact';
  onClick?: () => void;
  statusBadge?: React.ReactNode;
}

export function DayPlanItemCard({ item, variant, onClick, statusBadge }: DayPlanItemCardProps) {
  if (variant === 'full') {
    return <FullVariant item={item} onClick={onClick} statusBadge={statusBadge} />;
  }

  return <CompactVariant item={item} onClick={onClick} />;
}

// Full Variant - Used by Today panel
function FullVariant({
  item,
  onClick,
  statusBadge,
}: {
  item: DayPlanItem;
  onClick?: () => void;
  statusBadge?: React.ReactNode;
}) {
  // Primary items (priority >= 80) get red left border
  const isPrimary = item.priority >= 80;

  // Use activity colors if available, otherwise fallback to priority-based colors
  const colors = item.activityType ? ACTIVITY_COLORS[item.activityType] : null;

  // Build className based on activity type or priority
  const baseClasses = 'w-full p-3 border rounded-lg text-left transition-colors';

  const bgClass = colors?.bg ?? (isPrimary ? 'bg-vct-red/10' : 'bg-vct-gray/10');
  const bgHoverClass = colors?.bgHover ?? (isPrimary ? 'hover:bg-vct-red/20' : 'hover:bg-vct-gray/20');
  const borderClass = colors?.border ?? (isPrimary ? 'border-vct-red/30' : 'border-vct-gray/20');
  const borderLeftClass = colors
    ? `border-l-4 ${colors.borderLeft}`
    : isPrimary
      ? 'border-l-4 border-l-vct-red'
      : '';
  const textClass = colors?.text ?? (isPrimary ? 'text-vct-red' : 'text-vct-light');
  const checkboxBorderClass = colors?.checkboxBorder ?? (isPrimary ? 'border-vct-red/50' : 'border-vct-gray/50');

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${bgClass} ${bgHoverClass} ${borderClass} ${borderLeftClass}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="mt-0.5">
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              item.completed ? 'bg-green-500 border-green-500' : checkboxBorderClass
            }`}
          >
            {item.completed && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span
              className={`font-medium text-sm ${
                item.completed ? 'text-vct-gray line-through' : textClass
              }`}
            >
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              {statusBadge}
              {item.action && !item.completed && (
                <span className="text-xs text-vct-gray/60 ml-2">→</span>
              )}
            </div>
          </div>
          <p
            className={`text-xs ${
              item.completed ? 'text-vct-gray/60 line-through' : 'text-vct-gray'
            }`}
          >
            {item.description}
          </p>
        </div>
      </div>
    </button>
  );
}

// Compact Variant - Used by WeekPlanner
function CompactVariant({ item, onClick }: { item: DayPlanItem; onClick?: () => void }) {
  if (item.category !== 'activity') {
    // Compact variant only supports activity items
    return null;
  }

  const activityType = item.activityType;
  if (!activityType) return null;

  const activityState = item.activityState;

  // Get activity colors based on type
  const getActivityColors = () => {
    switch (activityType) {
      case 'training':
        return {
          bg: 'bg-blue-500/20',
          bgHover: 'bg-blue-500/30',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          dashedBorder: 'border-dashed border-blue-500/30',
          dashedText: 'text-blue-400',
          dashedHover: 'hover:bg-blue-500/10',
        };
      case 'scrim':
        return {
          bg: 'bg-orange-500/20',
          bgHover: 'bg-orange-500/30',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          dashedBorder: 'border-dashed border-orange-500/30',
          dashedText: 'text-orange-400',
          dashedHover: 'hover:bg-orange-500/10',
        };
      case 'strategy':
        return {
          bg: 'bg-amber-500/20',
          bgHover: 'bg-amber-500/30',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          dashedBorder: 'border-dashed border-amber-500/30',
          dashedText: 'text-amber-400',
          dashedHover: 'hover:bg-amber-500/10',
        };
    }
  };

  const colors = getActivityColors();

  // Get lifecycle state icon
  const getStateIcon = () => {
    switch (activityState) {
      case 'needs_setup':
        return '⚠️ Needs Setup';
      case 'configured':
        return '✓ Configured';
      case 'locked':
        return '🔒 Locked';
      case 'skipped':
        return 'Skipped';
      default:
        return null;
    }
  };

  // Render different variants based on state
  if (activityState === 'available') {
    // Available - dashed border, no solid background
    return (
      <button
        onClick={onClick}
        className={`w-full p-2 rounded border ${colors.dashedBorder} ${colors.dashedText} ${colors.dashedHover} transition-colors`}
      >
        <p className="text-xs">+ Schedule {activityType.charAt(0).toUpperCase() + activityType.slice(1)}</p>
      </button>
    );
  }

  if (activityState === 'unavailable') {
    // Unavailable - gray, disabled
    return (
      <div className="w-full p-2 rounded bg-vct-gray/10 border border-vct-gray/20">
        <p className="text-xs text-vct-gray capitalize">{activityType} Unavailable</p>
      </div>
    );
  }

  // Scheduled states (needs_setup, configured, locked, skipped) - solid background
  return (
    <button
      onClick={onClick}
      className={`w-full p-2 rounded ${colors.bg} border ${colors.border} text-left ${colors.bgHover} transition-colors`}
    >
      <p className={`text-xs font-medium ${colors.text} mb-1 capitalize`}>{activityType}</p>
      <p className="text-xs text-vct-gray">{getStateIcon()}</p>
    </button>
  );
}
