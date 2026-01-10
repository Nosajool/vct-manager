// RelationshipView Component - Display scrim partner relationships

import { useGameStore } from '../../store';
import { scrimService } from '../../services';
import type { TeamTier } from '../../types';

interface RelationshipViewProps {
  compact?: boolean;
}

const TIER_COLORS: Record<TeamTier, string> = {
  T1: 'text-yellow-400',
  T2: 'text-blue-400',
  T3: 'text-vct-gray',
};

export function RelationshipView({ compact = false }: RelationshipViewProps) {
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const tierTeams = useGameStore((state) => state.tierTeams);

  if (!playerTeamId) return null;

  const playerTeam = teams[playerTeamId];
  if (!playerTeam) return null;

  const relationships = scrimService.getAllRelationships();

  // Get team name by ID
  const getTeamName = (teamId: string): string => {
    const t1Team = teams[teamId];
    if (t1Team) return t1Team.name;
    const tierTeam = tierTeams[teamId];
    if (tierTeam) return tierTeam.name;
    return 'Unknown Team';
  };

  // Get relationship color
  const getRelationshipColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get relationship status text
  const getRelationshipStatus = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Neutral';
    if (score >= 20) return 'Poor';
    return 'Hostile';
  };

  // Sort relationships by score
  const sortedRelationships = relationships.slice().sort(
    (a, b) => b.relationshipScore - a.relationshipScore
  );

  if (compact) {
    const topRelationships = sortedRelationships.slice(0, 3);

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-vct-gray">Scrim Partners</h4>
        {topRelationships.length === 0 ? (
          <p className="text-xs text-vct-gray">No scrim history yet</p>
        ) : (
          <div className="space-y-1">
            {topRelationships.map((rel) => (
              <div
                key={rel.teamId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-vct-light truncate">{getTeamName(rel.teamId)}</span>
                <span className={getRelationshipColor(rel.relationshipScore)}>
                  {rel.relationshipScore}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-vct-light">Scrim Partner Relationships</h3>

      {sortedRelationships.length === 0 ? (
        <div className="bg-vct-dark p-4 rounded-lg border border-vct-gray/20 text-center">
          <p className="text-vct-gray">No scrim relationships established yet.</p>
          <p className="text-sm text-vct-gray mt-1">
            Schedule scrims to build relationships with other teams.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedRelationships.map((rel) => (
            <div
              key={rel.teamId}
              className="bg-vct-dark p-4 rounded-lg border border-vct-gray/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-vct-light">
                    {getTeamName(rel.teamId)}
                  </span>
                  <span className={`ml-2 text-xs ${TIER_COLORS[rel.tier]}`}>
                    {rel.tier}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${getRelationshipColor(rel.relationshipScore)}`}>
                    {rel.relationshipScore}
                  </span>
                  <p className={`text-xs ${getRelationshipColor(rel.relationshipScore)}`}>
                    {getRelationshipStatus(rel.relationshipScore)}
                  </p>
                </div>
              </div>

              {/* Relationship Bar */}
              <div className="h-2 bg-vct-gray/20 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    rel.relationshipScore >= 60 ? 'bg-green-500' :
                    rel.relationshipScore >= 40 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${rel.relationshipScore}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-vct-gray">
                <span>Total scrims: {rel.totalScrims}</span>
                {rel.lastScrimDate && (
                  <span>
                    Last scrim: {new Date(rel.lastScrimDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {rel.vodLeakRisk > 30 && (
                <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                  <span>Warning: High VOD leak risk ({rel.vodLeakRisk}%)</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
