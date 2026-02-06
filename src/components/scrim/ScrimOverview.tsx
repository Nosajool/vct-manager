// ScrimOverview - Main scrim relationship dashboard
// Comprehensive overview of scrim partnerships and analytics

import { useState } from 'react';
import { useGameStore } from '../../store';
import { scrimService } from '../../services';
import { ScrimStatsSummary } from './ScrimStatsSummary';
import { RelationshipPartnerCard } from './RelationshipPartnerCard';
import { ScrimRecommendations } from './ScrimRecommendations';
import { ScrimModal } from './ScrimModal';
import { SCRIM_CONSTANTS } from '../../types/scrim';

export function ScrimOverview() {
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [isScrimModalOpen, setIsScrimModalOpen] = useState(false);

  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const tierTeams = useGameStore((state) => state.tierTeams);
  const scrimHistory = useGameStore((state) => state.scrimHistory);

  if (!playerTeamId) {
    return (
      <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-8 text-center">
        <p className="text-vct-gray">No team selected</p>
      </div>
    );
  }

  const playerTeam = teams[playerTeamId];
  if (!playerTeam) {
    return (
      <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-8 text-center">
        <p className="text-vct-gray">Player team not found</p>
      </div>
    );
  }

  // Get all relationship data
  const stats = scrimService.getRelationshipStats();
  const relationshipsWithEffectiveness = scrimService.getRelationshipsByEffectiveness();
  const recommendations = scrimService.getRecommendations();

  // Get comprehensive eligibility status
  const eligibility = scrimService.checkScrimEligibility();
  const scrimsRemaining = SCRIM_CONSTANTS.MAX_WEEKLY_SCRIMS - eligibility.scrimsUsed;

  // Helper to get team name
  const getTeamName = (teamId: string): string => {
    const t1Team = teams[teamId];
    if (t1Team) return t1Team.name;
    const tierTeam = tierTeams[teamId];
    if (tierTeam) return tierTeam.name;
    return 'Unknown Team';
  };

  return (
    <div className="space-y-6">
      {/* Schedule Scrim Button */}
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => setIsScrimModalOpen(true)}
          disabled={!eligibility.canScrim}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all
            ${eligibility.canScrim
              ? 'bg-vct-red hover:bg-vct-red/80 text-white'
              : 'bg-vct-gray/20 text-vct-gray cursor-not-allowed'}
          `}
        >
          {eligibility.canScrim
            ? `Schedule Scrim (${scrimsRemaining} of ${SCRIM_CONSTANTS.MAX_WEEKLY_SCRIMS} remaining)`
            : 'Schedule Scrim'}
        </button>
        {!eligibility.canScrim && eligibility.reason && (
          <p className="text-sm text-vct-gray italic">
            {eligibility.reason}
          </p>
        )}
      </div>

      {/* Summary Stats Section */}
      <ScrimStatsSummary stats={stats} />

      {/* Relationship Distribution */}
      <div className="bg-vct-dark border border-vct-gray/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-vct-light mb-4">Relationship Distribution</h3>
        <div className="space-y-3">
          {Object.entries(stats.distribution).map(([status, count]) => {
            const total = Object.values(stats.distribution).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const colorClass =
              status === 'Excellent'
                ? 'bg-green-500'
                : status === 'Good'
                  ? 'bg-blue-500'
                  : status === 'Neutral'
                    ? 'bg-yellow-500'
                    : status === 'Poor'
                      ? 'bg-orange-500'
                      : 'bg-red-500';

            if (count === 0) return null;

            return (
              <div key={status} className="flex items-center gap-3">
                <span className="text-sm text-vct-gray w-20">{status}</span>
                <div className="flex-1 h-4 bg-vct-gray/20 rounded-full overflow-hidden">
                  <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-sm text-vct-light w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Partner Details (Sorted by Effectiveness) */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-vct-light">Scrim Partners (by Effectiveness)</h3>
        {relationshipsWithEffectiveness.length === 0 ? (
          <div className="bg-vct-dark border border-vct-gray/20 rounded-lg p-6 text-center">
            <p className="text-vct-gray mb-2">No scrim relationships established yet.</p>
            <p className="text-sm text-vct-gray">Schedule scrims to build relationships with other teams.</p>
          </div>
        ) : (
          relationshipsWithEffectiveness.map((rel) => (
            <RelationshipPartnerCard
              key={rel.teamId}
              relationship={rel}
              teamName={getTeamName(rel.teamId)}
              isExpanded={expandedPartner === rel.teamId}
              onToggle={() => setExpandedPartner(expandedPartner === rel.teamId ? null : rel.teamId)}
              winLoss={scrimService.getWinLossRecord(rel.teamId)}
              scrimHistory={scrimHistory.filter((s) => s.partnerTeamId === rel.teamId)}
            />
          ))
        )}
      </div>

      {/* Recommendations */}
      <ScrimRecommendations recommendations={recommendations} />

      {/* Scrim Modal */}
      <ScrimModal
        isOpen={isScrimModalOpen}
        onClose={() => setIsScrimModalOpen(false)}
        onScrimComplete={() => {
          // Modal will close automatically and stats will refresh via store updates
          setIsScrimModalOpen(false);
        }}
      />
    </div>
  );
}
