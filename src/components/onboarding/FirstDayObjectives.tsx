// FirstDayObjectives - Day 1 checklist panel shown on the Today page
// Guides new players through the three orientation steps before advancing

import { useGameStore } from '../../store';

export function FirstDayObjectives() {
  const hasVisitedRoster = useGameStore((state) => state.onboardingHasVisitedRoster);
  const hasVisitedTournament = useGameStore((state) => state.onboardingHasVisitedTournament);
  const setActiveView = useGameStore((state) => state.setActiveView);

  // Hide once both navigation objectives are done
  if (hasVisitedRoster && hasVisitedTournament) return null;

  const steps = [
    {
      id: 'roster',
      label: 'Meet your team',
      why: 'Know your players before the season starts',
      done: hasVisitedRoster,
      onAction: () => setActiveView('team'),
      actionLabel: 'Go to Team',
    },
    {
      id: 'tournament',
      label: 'Check the bracket',
      why: "See your first match and what's at stake",
      done: hasVisitedTournament,
      onAction: () => setActiveView('tournament'),
      actionLabel: 'Go to Tournament',
    },
    {
      id: 'advance',
      label: 'Advance Day 1',
      why: 'Use the Advance Day button at the bottom of the screen',
      done: false,
      onAction: null,
      actionLabel: null,
    },
  ];

  return (
    <div className="bg-vct-darker border border-vct-red/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-vct-red text-sm font-bold uppercase tracking-wide">Day 1 Checklist</span>
        <span className="text-vct-gray/50 text-xs">— get oriented before you start</span>
      </div>
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            {/* Check indicator */}
            <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${
              step.done
                ? 'bg-green-500/20 border-green-500/60'
                : 'border-vct-gray/40'
            }`}>
              {step.done && (
                <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${step.done ? 'text-vct-gray/50 line-through' : 'text-vct-light'}`}>
                {step.label}
              </span>
              {!step.done && (
                <span className="text-xs text-vct-gray/60 ml-2">{step.why}</span>
              )}
            </div>

            {/* Action button — only for steps with navigation */}
            {!step.done && step.onAction && (
              <button
                onClick={step.onAction}
                className="text-xs px-3 py-1 bg-vct-red/10 hover:bg-vct-red/20 text-vct-red border border-vct-red/30 rounded transition-colors flex-shrink-0"
              >
                {step.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
