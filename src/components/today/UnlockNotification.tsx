// UnlockNotification - Slide-in banner for newly unlocked features
//
// Appears after advanceDay() when features become available
// Shows feature name and description with auto-dismiss

import { useEffect, useState } from 'react';
import type { FeatureType } from '../../data/featureUnlocks';

interface UnlockNotificationProps {
  /** The feature that was just unlocked */
  feature: FeatureType;
  /** Description of the feature */
  description: string;
  /** Called when notification is dismissed */
  onDismiss: () => void;
  /** Auto-dismiss after this many milliseconds (default: 5000) */
  autoCloseMs?: number;
}

/** Feature display metadata */
const FEATURE_METADATA: Record<FeatureType, { icon: string; color: string; title: string }> = {
  training: {
    icon: '🎯',
    color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    title: 'Training Unlocked',
  },
  scrims: {
    icon: '⚔️',
    color: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    title: 'Scrims Unlocked',
  },
  transfers: {
    icon: '🔄',
    color: 'from-green-500/20 to-green-600/20 border-green-500/30',
    title: 'Transfers Unlocked',
  },
  strategy: {
    icon: '📋',
    color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    title: 'Strategy Unlocked',
  },
};

export function UnlockNotification({
  feature,
  description,
  onDismiss,
  autoCloseMs = 5000,
}: UnlockNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  const metadata = FEATURE_METADATA[feature];

  useEffect(() => {
    // Slide in after a brief delay
    const showTimer = setTimeout(() => setIsVisible(true), 100);

    // Auto-dismiss after specified time
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      // Wait for slide-out animation before calling onDismiss
      setTimeout(onDismiss, 300);
    }, autoCloseMs);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [autoCloseMs, onDismiss]);

  const handleManualDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`
        fixed top-20 right-6 z-50
        max-w-md
        transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}
      `}
    >
      <div
        className={`
          bg-gradient-to-r ${metadata.color}
          border rounded-lg p-4
          shadow-lg backdrop-blur-sm
        `}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="text-3xl flex-shrink-0">{metadata.icon}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-vct-light mb-1">{metadata.title}</h3>
            <p className="text-sm text-vct-gray">{description}</p>
          </div>

          {/* Close Button */}
          <button
            onClick={handleManualDismiss}
            className="flex-shrink-0 text-vct-gray hover:text-vct-light transition-colors"
            aria-label="Dismiss notification"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
