// ScrimRecommendations - Insights and recommendations for scrim management

interface ScrimRecommendationsProps {
  recommendations: Array<{
    type: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

const PRIORITY_STYLES = {
  high: 'border-red-500/30 bg-red-500/10 text-red-400',
  medium: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  low: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
};

const PRIORITY_ICONS = {
  high: '🔴',
  medium: '🟡',
  low: '🔵',
};

export function ScrimRecommendations({ recommendations }: ScrimRecommendationsProps) {
  if (recommendations.length === 0) {
    return null;
  }

  // Sort by priority (high -> medium -> low)
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="bg-vct-dark border border-vct-gray/20 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-vct-light mb-4">Recommendations</h3>

      <div className="space-y-2">
        {sortedRecommendations.map((rec, index) => (
          <div
            key={`${rec.type}-${index}`}
            className={`p-3 rounded-lg border ${PRIORITY_STYLES[rec.priority]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{PRIORITY_ICONS[rec.priority]}</span>
              <p className="text-sm">{rec.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
