// FeatureUnlockModal - Centered modal for newly unlocked features
//
// Shown in the modal stack after post-simulation modals, before drama events.
// Informational only — just announces the unlock, no choices required.

import type { FeatureType, FeatureUnlock } from '../../data/featureUnlocks';

interface FeatureUnlockModalProps {
  unlock: FeatureUnlock;
  onNext: () => void;
  onSkipAll: () => void;
  queuePosition: { current: number; total: number };
}

const FEATURE_METADATA: Record<FeatureType, { icon: string; accent: string; title: string }> = {
  training: {
    icon: '🎯',
    accent: 'bg-blue-500',
    title: 'Training Unlocked',
  },
  scrims: {
    icon: '⚔️',
    accent: 'bg-purple-500',
    title: 'Scrims Unlocked',
  },
  transfers: {
    icon: '🔄',
    accent: 'bg-green-500',
    title: 'Transfers Unlocked',
  },
  strategy: {
    icon: '📋',
    accent: 'bg-orange-500',
    title: 'Strategy Unlocked',
  },
  roster_optimization: {
    icon: '📊',
    accent: 'bg-emerald-500',
    title: 'Lineup Optimizer Unlocked',
  },
  auto_assign: {
    icon: '🤖',
    accent: 'bg-yellow-500',
    title: 'Smart Tools Unlocked',
  },
  advancedTraining: {
    icon: '📊',
    accent: 'bg-cyan-500',
    title: 'Advanced Training Unlocked',
  },
  advancedScrims: {
    icon: '🗺️',
    accent: 'bg-violet-500',
    title: 'Advanced Scrims Unlocked',
  },
  downtime_activities: {
    icon: '👁️',
    accent: 'bg-slate-500',
    title: 'Downtime Activities Unlocked',
  },
  bootcamp: {
    icon: '✈️',
    accent: 'bg-sky-500',
    title: 'Regional Bootcamps Unlocked',
  },
  content_events: {
    icon: '📱',
    accent: 'bg-pink-500',
    title: 'Content & Brand Events Unlocked',
  },
};

export function FeatureUnlockModal({
  unlock,
  onNext,
  onSkipAll,
  queuePosition,
}: FeatureUnlockModalProps) {
  const metadata = FEATURE_METADATA[unlock.feature];
  const { current, total } = queuePosition;
  const isLast = current === total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg max-w-[480px] w-full mx-4 overflow-hidden shadow-2xl">
        {/* Feature accent bar */}
        <div className={`h-1 ${metadata.accent}`} />

        {/* Header: label + queue position */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🆕</span>
            <span className="text-xs font-semibold text-vct-gray uppercase tracking-wider">
              New Feature
            </span>
          </div>
          {total > 1 && (
            <span className="text-xs text-vct-gray/50">{current} of {total}</span>
          )}
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {/* Icon + title */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{metadata.icon}</span>
            <h2 className="text-xl font-bold text-vct-light">{metadata.title}</h2>
          </div>

          {/* Description */}
          <p className="text-sm text-vct-gray leading-relaxed mb-6">
            {unlock.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            {total > 1 ? (
              <button
                onClick={onSkipAll}
                className="text-sm text-vct-gray/50 hover:text-vct-gray transition-colors"
              >
                Skip All ({total - current} more)
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={onNext}
              className="px-5 py-2 bg-vct-red hover:bg-vct-red/80 text-white text-sm font-semibold rounded transition-colors"
            >
              {isLast ? 'Got it' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
