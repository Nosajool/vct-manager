// ScrimStatsSummary - Summary statistics for scrim relationships



interface ScrimStatsSummaryProps {
  stats: {
    totalScrims: number;
    weeklyScrimsUsed: number;
    weeklyScrimsMax: number;
    avgRelationshipScore: number;
    t1Partners: number;
    t2Partners: number;
    t3Partners: number;
    highVodRiskCount: number;
    distribution: Record<string, number>;
  };
}

export function ScrimStatsSummary({ stats }: ScrimStatsSummaryProps) {
  const weeklyPercentage = (stats.weeklyScrimsUsed / stats.weeklyScrimsMax) * 100;

  return (
    <div className="bg-vct-dark border border-vct-gray/20 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-vct-light mb-4">Scrim Overview</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Weekly Usage */}
        <div className="bg-vct-darker rounded-lg p-3">
          <p className="text-xs text-vct-gray mb-1">Weekly Scrims</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-vct-light">{stats.weeklyScrimsUsed}</span>
            <span className="text-vct-gray">/{stats.weeklyScrimsMax}</span>
          </div>
          <div className="mt-2 h-2 bg-vct-gray/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                weeklyPercentage >= 100 ? 'bg-red-500' : weeklyPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(weeklyPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Average Relationship */}
        <div className="bg-vct-darker rounded-lg p-3">
          <p className="text-xs text-vct-gray mb-1">Avg Relationship</p>
          <span
            className={`text-2xl font-bold ${
              stats.avgRelationshipScore >= 60
                ? 'text-green-400'
                : stats.avgRelationshipScore >= 40
                  ? 'text-yellow-400'
                  : 'text-red-400'
            }`}
          >
            {stats.avgRelationshipScore}
          </span>
          <span className="text-vct-gray text-sm">/100</span>
        </div>

        {/* Total Scrims */}
        <div className="bg-vct-darker rounded-lg p-3">
          <p className="text-xs text-vct-gray mb-1">Total Scrims</p>
          <span className="text-2xl font-bold text-vct-light">{stats.totalScrims}</span>
        </div>

        {/* Partner Count */}
        <div className="bg-vct-darker rounded-lg p-3">
          <p className="text-xs text-vct-gray mb-1">Partners</p>
          <div className="flex items-baseline gap-2">
            <span className="text-yellow-400 font-bold">{stats.t1Partners} T1</span>
            <span className="text-blue-400 font-bold">{stats.t2Partners} T2</span>
            <span className="text-vct-gray font-bold">{stats.t3Partners} T3</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {stats.highVodRiskCount > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400">
            <span>⚠️</span>
            <span className="text-sm">
              {stats.highVodRiskCount} partner{stats.highVodRiskCount > 1 ? 's' : ''} with high VOD leak risk
            </span>
          </div>
        </div>
      )}

      {/* No scrims message */}
      {stats.totalScrims === 0 && (
        <div className="mt-4 p-4 bg-vct-darker rounded-lg text-center">
          <p className="text-vct-gray text-sm">
            No scrims completed yet. Schedule scrims from the Today page to build relationships.
          </p>
        </div>
      )}
    </div>
  );
}
