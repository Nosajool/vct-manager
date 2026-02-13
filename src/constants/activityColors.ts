// Activity type color constants
//
// Centralizes color tokens for training, scrims, and strategy activities.
// Used across ObjectivesPanel, DayPlanPanel, and other activity-related components.

export type ActivityType = 'training' | 'scrim' | 'strategy';

interface ActivityColors {
  bg: string;
  bgHover: string;
  border: string;
  borderLeft: string;
  text: string;
  checkboxBorder: string;
}

export const ACTIVITY_COLORS: Record<ActivityType, ActivityColors> = {
  training: {
    bg: 'bg-blue-500/10',
    bgHover: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    borderLeft: 'border-l-blue-500',
    text: 'text-blue-400',
    checkboxBorder: 'border-blue-500',
  },
  scrim: {
    bg: 'bg-purple-500/10',
    bgHover: 'bg-purple-500/20',
    border: 'border-purple-500/30',
    borderLeft: 'border-l-purple-500',
    text: 'text-purple-400',
    checkboxBorder: 'border-purple-500',
  },
  strategy: {
    bg: 'bg-amber-500/10',
    bgHover: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    borderLeft: 'border-l-amber-500',
    text: 'text-amber-400',
    checkboxBorder: 'border-amber-500',
  },
};
