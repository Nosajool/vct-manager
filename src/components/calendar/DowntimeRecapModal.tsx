// DowntimeRecapModal - Shows results of resolved downtime activities after advancing a day
//
// Displays per-activity summaries: financial impact, morale changes, and reputation deltas.

import type { DowntimeActivityResult } from '../../types/activityPlan';

interface DowntimeRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: DowntimeActivityResult[];
  date: string;
}

const ACTIVITY_LABELS: Record<string, string> = {
  watch_party: 'Watch Party',
  fan_meetup: 'Fan Meetup',
  streamer_collab: 'Streamer Collab',
  youtube_documentary: 'YouTube Documentary',
  sponsored_content: 'Sponsored Content',
};

const ACTIVITY_ICONS: Record<string, string> = {
  watch_party: '📺',
  fan_meetup: '🤝',
  streamer_collab: '🎮',
  youtube_documentary: '🎬',
  sponsored_content: '💰',
};

function formatMoney(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs}`;
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

function DeltaBadge({ value, label }: { value: number; label: string }) {
  if (value === 0) return null;
  const positive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
        positive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      }`}
    >
      {positive ? '+' : ''}{value} {label}
    </span>
  );
}

function ActivityCard({ result }: { result: DowntimeActivityResult }) {
  const label = ACTIVITY_LABELS[result.activityType] ?? result.activityType;
  const icon = ACTIVITY_ICONS[result.activityType] ?? '📋';
  const hasFinancial = result.financialDelta !== 0;
  const hasMorale = result.moraleChanges.length > 0;
  const hasRep = Object.values(result.reputationDeltas).some(v => v !== undefined && v !== 0);

  return (
    <div className="bg-vct-dark/50 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="font-semibold text-vct-light">{label}</span>
        {result.featuredPlayerName && (
          <span className="text-xs text-vct-gray ml-auto">feat. {result.featuredPlayerName}</span>
        )}
      </div>

      {/* Financial impact */}
      {hasFinancial && (
        <div className={`text-sm font-medium ${result.financialDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatMoney(result.financialDelta)} {result.financialDelta >= 0 ? 'income' : 'cost'}
        </div>
      )}

      {/* Reputation deltas */}
      {hasRep && (
        <div className="flex flex-wrap gap-1.5">
          {result.reputationDeltas.fanbase !== undefined && result.reputationDeltas.fanbase !== 0 && (
            <DeltaBadge value={result.reputationDeltas.fanbase} label="Fanbase" />
          )}
          {result.reputationDeltas.hype !== undefined && result.reputationDeltas.hype !== 0 && (
            <DeltaBadge value={result.reputationDeltas.hype} label="Hype" />
          )}
          {result.reputationDeltas.sponsorTrust !== undefined && result.reputationDeltas.sponsorTrust !== 0 && (
            <DeltaBadge value={result.reputationDeltas.sponsorTrust} label="Sponsor Trust" />
          )}
        </div>
      )}

      {/* Morale changes */}
      {hasMorale && (
        <div className="space-y-1">
          <div className="text-xs text-vct-gray uppercase tracking-wide">Morale</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {result.moraleChanges.map(({ playerId, playerName, delta }) => (
              <div key={playerId} className="flex items-center justify-between gap-2">
                <span className="text-xs text-vct-light truncate">{playerName}</span>
                <span className={`text-xs font-mono shrink-0 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {delta > 0 ? '+' : ''}{delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special notes */}
      {result.interviewPending && (
        <div className="text-xs text-yellow-400 flex items-center gap-1">
          <span>🎤</span> Media interview request incoming
        </div>
      )}
      {result.dramaTriggered && (
        <div className="text-xs text-orange-400 flex items-center gap-1">
          <span>⚡</span> Drama event triggered
        </div>
      )}
    </div>
  );
}

export function DowntimeRecapModal({ isOpen, onClose, results, date }: DowntimeRecapModalProps) {
  if (!isOpen || results.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20">
          <h2 className="text-xl font-bold text-vct-light">Downtime Activities</h2>
          <p className="text-sm text-vct-gray">{date}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {results.map((result, i) => (
            <ActivityCard key={`${result.activityType}-${i}`} result={result} />
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-vct-gray/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
