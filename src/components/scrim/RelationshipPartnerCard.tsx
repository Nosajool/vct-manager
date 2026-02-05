// RelationshipPartnerCard - Expandable partner detail card

import type { ScrimRelationship, ScrimResult, TeamTier } from '../../types';

interface RelationshipPartnerCardProps {
  relationship: ScrimRelationship & { effectiveness: number };
  teamName: string;
  isExpanded: boolean;
  onToggle: () => void;
  winLoss: { wins: number; losses: number };
  scrimHistory: ScrimResult[];
}

const TIER_COLORS: Record<TeamTier, string> = {
  T1: 'text-yellow-400',
  T2: 'text-blue-400',
  T3: 'text-vct-gray',
};

const TIER_LABELS: Record<TeamTier, string> = {
  T1: 'Tier 1',
  T2: 'Tier 2',
  T3: 'Tier 3',
};

function getRelationshipColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function getRelationshipStatus(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Neutral';
  if (score >= 20) return 'Poor';
  return 'Hostile';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function RelationshipPartnerCard({
  relationship,
  teamName,
  isExpanded,
  onToggle,
  winLoss,
  scrimHistory,
}: RelationshipPartnerCardProps) {
  const vodRiskHigh = relationship.vodLeakRisk > 50;
  const effectivenessPercent = Math.round(relationship.effectiveness * 100);

  return (
    <div className="bg-vct-dark border border-vct-gray/20 rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-vct-darker/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-left">
            <span className="font-medium text-vct-light text-lg">{teamName}</span>
            <span className={`ml-2 text-xs px-2 py-1 rounded bg-vct-darker ${TIER_COLORS[relationship.tier]}`}>
              {TIER_LABELS[relationship.tier]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Effectiveness Score */}
          <div className="text-right hidden sm:block">
            <p className="text-xs text-vct-gray">Effectiveness</p>
            <span className="text-sm font-medium text-vct-light">{effectivenessPercent}%</span>
          </div>

          {/* Relationship Score */}
          <div className="text-right">
            <p className="text-xs text-vct-gray">Relationship</p>
            <span className={`font-bold ${getRelationshipColor(relationship.relationshipScore)}`}>
              {relationship.relationshipScore}
            </span>
          </div>

          {/* Expand Icon */}
          <span className="text-vct-gray text-lg">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-vct-gray/20 p-4 space-y-4">
          {/* Relationship Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-vct-gray">Relationship Score</span>
              <span className={`text-sm font-medium ${getRelationshipColor(relationship.relationshipScore)}`}>
                {getRelationshipStatus(relationship.relationshipScore)}
              </span>
            </div>
            <div className="h-3 bg-vct-gray/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  relationship.relationshipScore >= 60
                    ? 'bg-green-500'
                    : relationship.relationshipScore >= 40
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${relationship.relationshipScore}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-vct-darker rounded-lg p-3">
              <p className="text-xs text-vct-gray mb-1">Total Scrims</p>
              <p className="text-xl font-bold text-vct-light">{relationship.totalScrims}</p>
            </div>

            <div className="bg-vct-darker rounded-lg p-3">
              <p className="text-xs text-vct-gray mb-1">Record</p>
              <p className="text-xl font-bold text-vct-light">
                <span className="text-green-400">{winLoss.wins}</span>
                <span className="text-vct-gray mx-1">-</span>
                <span className="text-red-400">{winLoss.losses}</span>
              </p>
            </div>

            <div className="bg-vct-darker rounded-lg p-3">
              <p className="text-xs text-vct-gray mb-1">Last Scrim</p>
              <p className="text-lg font-bold text-vct-light">
                {relationship.lastScrimDate ? formatDate(relationship.lastScrimDate) : 'Never'}
              </p>
            </div>

            <div className="bg-vct-darker rounded-lg p-3">
              <p className="text-xs text-vct-gray mb-1">VOD Risk</p>
              <p className={`text-xl font-bold ${vodRiskHigh ? 'text-red-400' : 'text-green-400'}`}>
                {relationship.vodLeakRisk}%
              </p>
            </div>
          </div>

          {/* VOD Risk Warning */}
          {vodRiskHigh && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <span>⚠️</span>
                <span className="text-sm">High VOD leak risk! Consider taking a break from this partner.</span>
              </div>
            </div>
          )}

          {/* Recent Events */}
          {scrimHistory.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-vct-light mb-2">Recent Relationship Events</h4>
              <div className="space-y-2">
                {scrimHistory
                  .filter((s) => s.relationshipEvent)
                  .slice(-3)
                  .reverse()
                  .map((scrim) => (
                    <div key={scrim.id} className="flex items-start gap-2 text-sm">
                      <span
                        className={`font-medium ${
                          (scrim.relationshipEvent!.relationshipChange || 0) > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {(scrim.relationshipEvent!.relationshipChange || 0) > 0 ? '+' : ''}
                        {scrim.relationshipEvent!.relationshipChange}
                      </span>
                      <span className="text-vct-gray">{scrim.relationshipEvent!.description}</span>
                      <span className="text-vct-gray/60 text-xs ml-auto">
                        {formatDate(scrim.date)}
                      </span>
                    </div>
                  ))}
                {scrimHistory.filter((s) => s.relationshipEvent).length === 0 && (
                  <p className="text-sm text-vct-gray">No relationship events yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
