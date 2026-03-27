// RosterIssueModal - Blocks match-day advance when roster is invalid
//
// Shown by TimeBar when validateRosterForMatch() returns violations on a day
// that has a match. Offers an auto-fix path (promote eligible reserves) or
// a manual-fix escape hatch.

import type { RosterViolation } from '../../utils/rosterValidation';

interface RosterIssueModalProps {
  violations: RosterViolation[];
  activeCount: number;
  /** True when every violation has a viable auto-fix */
  canAutoFix: boolean;
  onAutoFix: () => void;
  onFixManually: () => void;
}

export function RosterIssueModal({
  violations,
  activeCount,
  canAutoFix,
  onAutoFix,
  onFixManually,
}: RosterIssueModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-vct-darker border border-red-500/30 rounded-lg max-w-sm w-full overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-red-500/20 bg-gradient-to-r from-red-500/10 to-transparent">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-red-400/70">Roster Problem</span>
          </div>
          <h2 className="text-base font-bold text-vct-light">Can't field a full team</h2>
          <p className="text-xs text-vct-gray/60 mt-0.5">Resolve this before the match can be played.</p>
        </div>

        {/* Violations */}
        <div className="p-4 space-y-3">
          {violations.map((v, i) => (
            <ViolationCard key={i} violation={v} activeCount={activeCount} />
          ))}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-2">
          {canAutoFix && (
            <button
              onClick={onAutoFix}
              className="w-full py-2 px-4 bg-vct-accent hover:bg-vct-accent/80 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Auto-fix and continue
            </button>
          )}
          <button
            onClick={onFixManually}
            className="w-full py-2 px-4 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light text-sm font-medium rounded-lg transition-colors"
          >
            Fix manually
          </button>
        </div>
      </div>
    </div>
  );
}

function ViolationCard({ violation, activeCount }: { violation: RosterViolation; activeCount: number }) {
  if (violation.type === 'insufficient_players') {
    const needed = 5 - activeCount;
    const canPromote = violation.promotablePlayers.length >= needed;
    return (
      <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-3">
        <p className="text-sm font-semibold text-red-400 mb-1">
          Only {activeCount}/5 active players
        </p>
        {canPromote ? (
          <p className="text-xs text-vct-gray/70">
            {violation.promotablePlayers.length} eligible reserve
            {violation.promotablePlayers.length !== 1 ? 's' : ''} available to promote.
          </p>
        ) : violation.promotablePlayers.length > 0 ? (
          <p className="text-xs text-vct-gray/70">
            Only {violation.promotablePlayers.length} eligible reserve
            {violation.promotablePlayers.length !== 1 ? 's' : ''} available — not enough to fill the roster.
            You may need to sign a free agent.
          </p>
        ) : (
          <p className="text-xs text-vct-gray/70">
            No eligible reserves — all are currently restricted (visa delays, family leave, etc.).
            You may need to sign a free agent.
          </p>
        )}
      </div>
    );
  }

  if (violation.type === 'no_active_igl') {
    return (
      <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-3">
        <p className="text-sm font-semibold text-yellow-400 mb-1">
          IGL not in active lineup
        </p>
        {violation.iglInReserves ? (
          <p className="text-xs text-vct-gray/70">
            {violation.iglName} is on the bench and needs to be active for the match.
          </p>
        ) : violation.iglName ? (
          <p className="text-xs text-vct-gray/70">
            {violation.iglName} is no longer on the team. Go to the roster to assign a new IGL.
          </p>
        ) : (
          <p className="text-xs text-vct-gray/70">
            No IGL assigned. Go to the roster to designate one.
          </p>
        )}
      </div>
    );
  }

  return null;
}
